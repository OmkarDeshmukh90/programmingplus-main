const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const questionsData = require("../data/questions.json");

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
    let filePath = path.join(__dirname, `temp_${Date.now()}`);
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

      child.once("error", (err) => {
        cleanup();
        resolve({ output: err.message || "Runtime execution failed", success: false });
      });

      child.stdout.on("data", (data) => (stdout += data.toString()));
      child.stderr.on("data", (data) => (stdout += data.toString()));

      child.on("close", (exitCode) => {
        cleanup();
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
          resolve({ output: compileRes.output || "C++ compilation failed", success: false });
          return;
        }
        const child = spawn(outFile, [], { stdio: ["pipe", "pipe", "pipe"] });
        runWithStdin(child);
      });
    } else if (language === "python") {
      filePath += ".py";
      fs.writeFileSync(filePath, code);
      cleanupFiles.push(filePath);

      spawnFirstAvailable(
        getPythonCandidates(),
        [filePath],
        { stdio: ["pipe", "pipe", "pipe"] },
        (child) => runWithStdin(child),
        (err) => {
          cleanup();
          resolve({ output: err.message || "Python execution failed", success: false });
        }
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
          resolve({ output: compileRes.output || "Java compilation failed", success: false });
          return;
        }

        spawnFirstAvailable(
          getJavaRuntimeCandidates(),
          ["-cp", __dirname, className],
          { stdio: ["pipe", "pipe", "pipe"] },
          (child) => runWithStdin(child),
          (err) => {
            cleanup();
            resolve({ output: err.message || "Java runtime not found", success: false });
          }
        );
      });
    } else {
      resolve({ output: "Unsupported language", success: false });
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

module.exports = router;
