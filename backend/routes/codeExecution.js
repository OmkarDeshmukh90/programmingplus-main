const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const questionsData = require("../data/questions.json");
const Interview = require("../models/Interview");
const LiveInterviewSession = require("../models/LiveInterviewSession");

const EXECUTION_TIMEOUT_MS = 10000;
const SUPPORTED_LANGUAGES = new Set(["cpp", "python", "java", "javascript", "go"]);

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
  if (process.env.PYTHON_BIN) {
    return [process.env.PYTHON_BIN];
  }
  return process.platform === "win32"
    ? ["python", "py", "python3"]
    : ["python3", "python"];
};

const getCppCompilerCandidates = () => {
  if (process.env.CPP_BIN) return [process.env.CPP_BIN];
  return process.platform === "win32"
    ? ["g++", "clang++"]
    : ["g++", "clang++"];
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
    onFail(new Error("Python runtime not found. Install Python or set PYTHON_BIN in backend/.env"));
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

      child.once("spawn", () => {
        started = true;
      });

      child.once("error", (err) => {
        if (!started && err.code === "ENOENT") {
          tryCommand(rest);
          return;
        }
        resolve({ ok: false, output: err.message || "Command failed", code: null });
      });

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

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
  const numbers = rawOutput
    .replace(/\[|\]/g, "")
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number);
  return numbers;
};

const executeCode = (language, code, stdin) => {
  return new Promise((resolve) => {
    const runId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    let filePath = path.join(__dirname, `temp_${runId}`);
    const cleanupFiles = [];

    const cleanup = () => {
      for (const f of cleanupFiles) {
        try {
          if (fs.existsSync(f)) fs.unlinkSync(f);
        } catch {}
      }
    };

    const runWithStdin = (child) => {
      let stdout = "";
      let timedOut = false;
      const timeout = setTimeout(() => {
        timedOut = true;
        try {
          child.kill();
        } catch {}
      }, EXECUTION_TIMEOUT_MS);

      console.log(`[EXEC] Child process spawned. (PID: ${child.pid})`);

      child.once("error", (err) => {
        clearTimeout(timeout);
        console.error(`[EXEC] Child process error:`, err);
        cleanup();
        resolve({ output: err.message || "Runtime execution failed", success: false });
      });

      child.stdout.on("data", (data) => {
        const chunk = data.toString();
        console.log(`[EXEC] STDOUT: ${chunk}`);
        stdout += chunk;
      });
      child.stderr.on("data", (data) => {
        const chunk = data.toString();
        console.warn(`[EXEC] STDERR: ${chunk}`);
        stdout += chunk;
      });

      child.on("close", (exitCode) => {
        clearTimeout(timeout);
        console.log(`[EXEC] Child process closed with code ${exitCode}`);
        cleanup();
        if (timedOut) {
          resolve({
            output: `Execution timed out after ${EXECUTION_TIMEOUT_MS / 1000} seconds.`,
            success: false,
          });
          return;
        }
        resolve({ output: stdout.trim(), success: exitCode === 0 });
      });

      child.stdin.write(stdin);
      child.stdin.end();
    };

    if (language === "cpp") {
      filePath += ".cpp";
      console.log(`[EXEC] Preparing C++ execution. File: ${filePath}`);
      fs.writeFileSync(filePath, code);
      const outFile = process.platform === "win32" ? `${filePath}.exe` : `${filePath}.out`;
      cleanupFiles.push(filePath, outFile);

      runCommandWithFallback(getCppCompilerCandidates(), [filePath, "-o", outFile]).then((compileRes) => {
        console.log(`[EXEC] C++ Compile Result:`, compileRes);
        if (!compileRes.ok) {
          cleanup();
          resolve({ output: compileRes.output || "C++ compilation failed", success: false });
          return;
        }
        const child = spawn(outFile, [], { stdio: ["pipe", "pipe", "pipe"] });
        runWithStdin(child);
      });
    } else if (language === "python") {
      filePath += ".py";
      console.log(`[EXEC] Preparing Python execution. File: ${filePath}`);
      fs.writeFileSync(filePath, code);
      cleanupFiles.push(filePath);

      spawnFirstAvailable(
        getPythonCandidates(),
        [filePath],
        { stdio: ["pipe", "pipe", "pipe"] },
        (child) => runWithStdin(child),
        (err) => {
          console.error(`[EXEC] Python spawn failed:`, err);
          cleanup();
          resolve({ output: err.message || "Python execution failed", success: false });
        }
      );
    } else if (language === "java") {
      filePath += ".java";
      console.log(`[EXEC] Preparing Java execution. File: ${filePath}`);
      fs.writeFileSync(filePath, code);
      const className = path.basename(filePath, ".java");
      const classFile = path.join(__dirname, `${className}.class`);
      cleanupFiles.push(filePath, classFile);

      runCommandWithFallback(getJavaCompilerCandidates(), [filePath], { cwd: __dirname }).then((compileRes) => {
        console.log(`[EXEC] Java Compile Result:`, compileRes);
        if (!compileRes.ok) {
          cleanup();
          resolve({ output: compileRes.output || "Java compilation failed", success: false });
          return;
        }

        spawnFirstAvailable(
          getJavaRuntimeCandidates(),
          ["-cp", __dirname, className],
          { stdio: ["pipe", "pipe", "pipe"] },
          (child) => runWithStdin(child),
          (err) => {
            console.error(`[EXEC] Java spawn failed:`, err);
            cleanup();
            resolve({ output: err.message || "Java runtime not found", success: false });
          }
        );
      });
    } else if (language === "javascript") {
      filePath += ".js";
      console.log(`[EXEC] Preparing JS (Node) execution. File: ${filePath}`);
      fs.writeFileSync(filePath, code);
      cleanupFiles.push(filePath);

      spawnFirstAvailable(
        ["node"],
        [filePath],
        { stdio: ["pipe", "pipe", "pipe"] },
        (child) => runWithStdin(child),
        (err) => {
          console.error(`[EXEC] Node spawn failed:`, err);
          cleanup();
          resolve({ output: err.message || "Node.js execution failed", success: false });
        }
      );
    } else if (language === "go") {
      filePath += ".go";
      console.log(`[EXEC] Preparing Go execution. File: ${filePath}`);
      fs.writeFileSync(filePath, code);
      const outFile = process.platform === "win32" ? `${filePath}.exe` : `${filePath}.out`;
      cleanupFiles.push(filePath, outFile);

      runCommandWithFallback(["go"], ["build", "-o", outFile, filePath]).then((compileRes) => {
        console.log(`[EXEC] Go build result:`, compileRes);
        if (!compileRes.ok) {
          cleanup();
          resolve({ output: compileRes.output || "Go build failed", success: false });
          return;
        }
        const child = spawn(outFile, [], { stdio: ["pipe", "pipe", "pipe"] });
        runWithStdin(child);
      });
    } else {
      console.warn(`[EXEC] Unsupported Language: ${language}`);
      resolve({ output: `Unsupported language: ${language}`, success: false });
    }
  });
};

const runCode = async (language, code, testCases) => {
  const results = [];

  for (const tc of testCases) {
    const stdin = formatInput(tc.input);
    const { output } = await executeCode(language, code, stdin);

    const normalizedOutput = normalizeOutput(output);
    const passed = JSON.stringify(normalizedOutput) === JSON.stringify(tc.expectedOutput);

    results.push({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      output: normalizedOutput,
      passed,
    });
  }

  return results;
};

router.post("/run", verifyToken, async (req, res) => {
  const { code, language, questionId, type } = req.body;
  const question = questionsData.find((q) => q.id == questionId);
  if (!question) return res.status(404).json({ message: "Question not found" });

  const tests = type === "run" ? question.sampleCases : question.hiddenCases;

  try {
    const results = await runCode(language, code, tests);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/execute", ensureExecutionAccess, async (req, res) => {
  const { code, language, stdin = "" } = req.body;
  
  if (!code || !language) {
    return res.status(400).json({ message: "Code and language are required" });
  }

  if (!SUPPORTED_LANGUAGES.has(language)) {
    return res.status(400).json({ message: `Unsupported language: ${language}` });
  }

  try {
    const { output, success } = await executeCode(language, code, stdin);
    res.json({ output, success });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

