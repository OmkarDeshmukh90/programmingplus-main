const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const axios = require("axios");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const questionsData = require("../data/questions.json");
const Interview = require("../models/Interview");
const LiveInterviewSession = require("../models/LiveInterviewSession");

const EXECUTION_TIMEOUT_MS = 10000;
const SUPPORTED_LANGUAGES = new Set(["cpp", "python", "java", "javascript", "go"]);

// Map our language keys to Piston API compatibility
const PISTON_LANGUAGE_MAP = {
  cpp: "c++",
  python: "python",
  java: "java",
  javascript: "javascript",
  go: "go"
};

const getUserIdFromAuthHeader = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.decode(token);
    if (!decoded?.sub) return null;
    const user = await mongoose.model("User").findOne({ clerkId: decoded.sub });
    return user?._id || null;
  } catch {
    return null;
  }
};

const getInterviewRoomByToken = async (roomToken) => {
  if (!roomToken) return null;

  const interview = await Interview.findOne({ roomToken }).lean();
  if (interview) {
    return { interview, isLiveSession: false };
  }

  if (mongoose.Types.ObjectId.isValid(roomToken)) {
    const liveSession = await LiveInterviewSession.findById(roomToken).lean();
    if (liveSession) {
      return { interview: liveSession, isLiveSession: true };
    }
  }

  return null;
};

const ensureExecutionAccess = async (req, res, next) => {
  const userId = await getUserIdFromAuthHeader(req.headers.authorization);
  if (userId) {
    req.userId = userId;
    return next();
  }

  const roomToken = req.body?.roomToken;
  const roomContext = await getInterviewRoomByToken(roomToken);
  if (!roomContext) {
    return res.status(401).json({
      message: "Unauthorized. Provide a valid login token or interview room token.",
    });
  }

  req.roomToken = roomToken;
  req.roomContext = roomContext;
  next();
};

const getPythonCandidates = () => {
  if (process.env.PYTHON_BIN) return [process.env.PYTHON_BIN];
  return process.platform === "win32" ? ["python", "py", "python3"] : ["python3", "python"];
};

const getCppCompilerCandidates = () => {
  if (process.env.CPP_BIN) return [process.env.CPP_BIN];
  return process.platform === "win32" ? ["g++", "clang++"] : ["g++", "clang++"];
};

const getJavaCompilerCandidates = () => {
  if (process.env.JAVAC_BIN) return [process.env.JAVAC_BIN];
  return ["javac"];
};

const getJavaRuntimeCandidates = () => {
  if (process.env.JAVA_BIN) return [process.env.JAVA_BIN];
  return ["java"];
};

const spawnFirstAvailable = (commands, args, options, onReady, onFail) => {
  const [cmd, ...rest] = commands;
  if (!cmd) {
    onFail(new Error("Required runtime/compiler not found in local environment."));
    return;
  }

  const child = spawn(cmd, args, options);
  let started = false;

  child.once("spawn", () => {
    started = true;
    onReady(child);
  });

  child.once("error", (err) => {
    if (!started && err.code === "ENOENT") {
      spawnFirstAvailable(rest, args, options, onReady, onFail);
      return;
    }
    onFail(err);
  });
};

const runCommandWithFallback = (commands, args, options = {}) =>
  new Promise((resolve) => {
    let combinedOutput = "";

    const tryCommand = (remaining) => {
      const [cmd, ...rest] = remaining;
      if (!cmd) {
        resolve({
          ok: false,
          output: combinedOutput.trim() || "Required runtime/compiler not found.",
          code: null,
        });
        return;
      }

      const child = spawn(cmd, args, { ...options, stdio: ["ignore", "pipe", "pipe"] });

      let stderr = "";
      let stdout = "";
      let started = false;

      child.once("spawn", () => { started = true; });

      child.once("error", (err) => {
        if (!started && err.code === "ENOENT") {
          tryCommand(rest);
          return;
        }
        resolve({ ok: false, output: err.message || "Command failed", code: null });
      });

      child.stdout.on("data", (data) => { stdout += data.toString(); });
      child.stderr.on("data", (data) => { stderr += data.toString(); });

      child.on("close", (code) => {
        if (code === 0) {
          resolve({ ok: true, output: stdout.trim(), code });
        } else {
          combinedOutput = `${combinedOutput}\n${stderr || stdout}`.trim();
          resolve({ ok: false, output: (stderr || stdout || "Command failed").trim(), code });
        }
      });
    };

    tryCommand(commands);
  });

// --- Local Executor Fallback Logic ---
const executeLocalCode = (language, code, stdin) => {
  return new Promise((resolve) => {
    const runId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    let filePath = path.join(__dirname, `temp_${runId}`);
    const cleanupFiles = [];

    const cleanup = () => {
      for (const f of cleanupFiles) {
        try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {}
      }
    };

    const runWithStdin = (child) => {
      let stdout = "";
      let timedOut = false;
      const timeout = setTimeout(() => {
        timedOut = true;
        try { child.kill(); } catch {}
      }, EXECUTION_TIMEOUT_MS);

      child.once("error", (err) => {
        clearTimeout(timeout);
        cleanup();
        resolve({ output: err.message || "Runtime execution failed", success: false });
      });

      child.stdout.on("data", (data) => { stdout += data.toString(); });
      child.stderr.on("data", (data) => { stdout += data.toString(); });

      child.on("close", (exitCode) => {
        clearTimeout(timeout);
        cleanup();
        if (timedOut) return resolve({ output: `Execution timed out after ${EXECUTION_TIMEOUT_MS / 1000}s.`, success: false });
        resolve({ output: stdout.trim(), success: exitCode === 0 });
      });

      child.stdin.write(stdin);
      child.stdin.end();
    };

    if (language === "cpp") {
      filePath += ".cpp";
      fs.writeFileSync(filePath, code);
      const outFile = process.platform === "win32" ? `${filePath}.exe` : `${filePath}.out`;
      cleanupFiles.push(filePath, outFile);

      runCommandWithFallback(getCppCompilerCandidates(), [filePath, "-o", outFile]).then((compileRes) => {
        if (!compileRes.ok) {
          cleanup();
          return resolve({ output: compileRes.output || "C++ compilation failed", success: false });
        }
        const child = spawn(outFile, [], { stdio: ["pipe", "pipe", "pipe"] });
        runWithStdin(child);
      });
    } else if (language === "python") {
      filePath += ".py";
      fs.writeFileSync(filePath, code);
      cleanupFiles.push(filePath);

      spawnFirstAvailable(getPythonCandidates(), [filePath], { stdio: ["pipe", "pipe", "pipe"] }, 
        (child) => runWithStdin(child), 
        (err) => { cleanup(); resolve({ output: err.message || "Python execution failed", success: false }); }
      );
    } else if (language === "java") {
      filePath += ".java";
      fs.writeFileSync(filePath, code);
      const className = path.basename(filePath, ".java");
      const classFile = path.join(__dirname, `${className}.class`);
      cleanupFiles.push(filePath, classFile);

      runCommandWithFallback(getJavaCompilerCandidates(), [filePath], { cwd: __dirname }).then((compileRes) => {
        if (!compileRes.ok) {
          cleanup();
          return resolve({ output: compileRes.output || "Java compilation failed", success: false });
        }
        spawnFirstAvailable(getJavaRuntimeCandidates(), ["-cp", __dirname, className], { stdio: ["pipe", "pipe", "pipe"] },
          (child) => runWithStdin(child),
          (err) => { cleanup(); resolve({ output: err.message || "Java runtime not found", success: false }); }
        );
      });
    } else if (language === "javascript") {
      filePath += ".js";
      fs.writeFileSync(filePath, code);
      cleanupFiles.push(filePath);

      spawnFirstAvailable(["node"], [filePath], { stdio: ["pipe", "pipe", "pipe"] },
        (child) => runWithStdin(child),
        (err) => { cleanup(); resolve({ output: err.message || "Node execution failed", success: false }); }
      );
    } else {
      resolve({ output: `Unsupported local fallback language: ${language}`, success: false });
    }
  });
};

const formatInput = (inputObj) => {
  let stdin = "";
  if (Array.isArray(inputObj.nums)) {
    stdin += inputObj.nums.length + "\n";
    stdin += inputObj.nums.join(" ") + "\n";
  }
  if (typeof inputObj.target !== "undefined") {
    stdin += inputObj.target + "\n";
  }
  return stdin.trim() + "\n";
};

const normalizeOutput = (rawOutput) => {
  rawOutput = rawOutput.trim().replace(/\s+/g, " ");
  const numbers = rawOutput.replace(/\[|\]/g, "").split(/[\s,]+/).filter(Boolean).map(Number);
  return numbers;
};

// Main Execution Router (Uses Piston API with Fallback to Local)
const executeCode = async (language, code, stdin) => {
  const pistonLang = PISTON_LANGUAGE_MAP[language];
  
  if (!pistonLang) {
    return { output: `Unsupported language: ${language}`, success: false };
  }

  // ONLY ATTEMPT PISTON IF WE HAVE AN API KEY ATTACHED in .env OR we intentionally risk 401
  const pistonKey = process.env.PISTON_API_KEY;

  if (pistonKey) {
    try {
      const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
        language: pistonLang,
        version: "*",
        files: [{ content: code }],
        stdin: stdin
      }, { 
        timeout: 10000,
        headers: { "Authorization": `Bearer ${pistonKey}` }
      }); 

      const { run } = response.data;
      return {
        output: run.output ? run.output.trim() : "",
        success: run.code === 0,
        stderr: run.stderr || ""
      };
    } catch (err) {
      console.warn(`[EXEC] Piston API Failed (Status ${err.response?.status}). Falling back to local execution...`);
      // If we got a 401 or timeout, fall back to executing locally immediately!
      return await executeLocalCode(language, code, stdin);
    }
  } else {
    // If no API Key config is provided, default exclusively to local spawn (so platform doesn't crash)
    return await executeLocalCode(language, code, stdin);
  }
};

const { generateWrapper } = require('../utils/wrapperGenerator');

const runCode = async (language, code, testCases, problem) => {
  const hasOldMain = (language === 'cpp' && code.includes('int main')) || 
                     (language === 'java' && code.includes('public static void main')) ||
                     (language === 'python' && code.includes("if __name__ == '__main__'"));
                     
  if (hasOldMain) {
    const results = [];
    for (const tc of testCases) {
      const stdin = formatInput(tc.input);
      const { output, stderr } = await executeCode(language, code, stdin);
      const normalizedOutput = normalizeOutput(output);
      const passed = JSON.stringify(normalizedOutput) === JSON.stringify(tc.expectedOutput);
      results.push({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        output: normalizedOutput,
        rawOutput: output,
        stderr: stderr || "",
        passed,
      });
    }
    return results;
  }

  // Dynamic Wrapper Execution
  const fullCode = generateWrapper(language, code, testCases, problem);
  const { output, stderr } = await executeCode(language, fullCode, "");
  
  const rawOutputs = output.split(/---END_TC---/g).map(s => s.trim());
  const results = [];
  
  testCases.forEach((tc, i) => {
    let outStr = rawOutputs[i] || "";
    let parsedOutput;
    try {
      // Try to parse the clean JSON generated by our wrapper
      parsedOutput = JSON.parse(outStr);
    } catch (e) {
      // Fallback if there's print statements interfering or errors
      parsedOutput = normalizeOutput(outStr);
    }
    
    // Normalize both to JSON for strict comparison
    const passed = JSON.stringify(parsedOutput) === JSON.stringify(tc.expectedOutput);
    
    results.push({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      output: parsedOutput,
      rawOutput: outStr,
      // If it crashed/failed compiling, stderr goes to the first case so the user can debug
      stderr: i === 0 && stderr ? stderr : "", 
      passed,
    });
  });

  return results;
};

router.post("/run", verifyToken, async (req, res) => {
  const { code, language, questionId, type } = req.body;
  const question = questionsData.find((q) => q.id == questionId);
  if (!question) return res.status(404).json({ message: "Question not found" });

  const tests = type === "run" ? question.sampleCases : question.hiddenCases;

  try {
    const results = await runCode(language, code, tests, question);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/execute", ensureExecutionAccess, async (req, res) => {
  const { code, language, stdin = "" } = req.body;
  
  if (!code || !language) return res.status(400).json({ message: "Code and language are required" });
  if (!SUPPORTED_LANGUAGES.has(language)) return res.status(400).json({ message: `Unsupported language: ${language}` });

  try {
    const { output, success } = await executeCode(language, code, stdin);
    res.json({ output, success });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
