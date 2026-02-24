import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { submitCode, getQuestionSubmissions } from "../api/submissions";
import axios from "axios";
import { getAllQuestions } from "../api/questions";
import { Link } from "react-router-dom";
import { askAI } from "../utils/askAI";
import BASE_URL from "../config";

const CodeEditor = ({ problem }) => {
  if (!problem) return <p className="text-gray-400">Loading problem...</p>;

  const supportedLanguages = ["cpp", "python", "java"];
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState("");
  const [results, setResults] = useState([]);
  const [editorHeight, setEditorHeight] = useState(300);
  const isResizing = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousSubs, setPreviousSubs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  // ✅ AI states
  const [aiResponse, setAiResponse] = useState("");
  const [showAIOptions, setShowAIOptions] = useState(false);

  const defaultBoilerplates = {
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Write your solution here
    return 0;
}`,
    python: `def main():
    # Write your solution here
    pass

if __name__ == "__main__":
    main()`,
    java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        // Write your solution here
    }
}`,
  };

  // ✅ AI Code Quality Analyzer
  const handleAICodeQuality = async () => {
    setAiResponse("Analyzing code quality...");
    try {
      const prompt = `
You are an AI code reviewer.
Analyze the following ${language} code for:
1. **Time Complexity**
2. **Space Complexity**
3. **Readability & Code Style**
4. **Best Practices & Possible Improvements**
5. **Don't give too much text give crisp and short version**

Code:
${code}
    `;
      const res = await askAI(prompt);
      setAiResponse(
        res.result || res.message || "AI could not analyze the code quality."
      );
    } catch (err) {
      setAiResponse("Error while analyzing code quality.");
    }
  };


  // ✅ Load saved code or boilerplate when problem/language changes
  useEffect(() => {
    const savedCode = localStorage.getItem(`code_${problem.id}_${language}`);
    if (savedCode) {
      setCode(savedCode);
    } else {
      setCode(defaultBoilerplates[language]);
    }
  }, [problem.id, language]);

  // ✅ Save code to localStorage whenever it changes
  useEffect(() => {
    if (code) {
      localStorage.setItem(`code_${problem.id}_${language}`, code);
    }
  }, [code, problem.id, language]);

  useEffect(() => {
    // Clear previous submissions and results when switching problems
    setPreviousSubs([]);
    setResults([]);

    const fetchSubs = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await getQuestionSubmissions(problem.id, token);
        setPreviousSubs(res.data);
      } catch (err) {
        console.error("Failed to fetch submissions:", err.message);
      }
    };

    fetchSubs();
  }, [problem.id]);




  // ---- Drag handlers ----
  const handleMouseDown = (e) => {
    isResizing.current = true;
    startY.current = e.clientY;
    startHeight.current = editorHeight;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isResizing.current) return;
    const newHeight = startHeight.current + (e.clientY - startY.current);
    setEditorHeight(Math.max(150, Math.min(700, newHeight)));
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const runUserCode = async (type) => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(
        `${BASE_URL}/code/run`,
        { code, language, questionId: problem.id, type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data.results;
    } catch (err) {
      return [{ error: err.message }];
    }
  };

  // --- inside CodeEditor component ---

  // Track run failures
  useEffect(() => {
    // Initialize if not present
    const stored = localStorage.getItem(`failCount_${problem.id}`);
    if (!stored) localStorage.setItem(`failCount_${problem.id}`, "0");
  }, [problem.id]);

  const handleRun = async () => {
    setIsRunning(true);
    const res = await runUserCode("run");
    setResults(res);

    // Check run result
    const allPassed = res.every((r) => r.passed);

    if (!allPassed) {
      // Increment fail count
      let failCount =
        parseInt(localStorage.getItem(`failCount_${problem.id}`) || "0", 10) + 1;
      localStorage.setItem(`failCount_${problem.id}`, failCount.toString());

      if (failCount >= 3) {
        // Reset counter
        localStorage.setItem(`failCount_${problem.id}`, "0");

        // Show alert/toast
        alert(
          "⚠️ You tried 3 times but your code didn't run correctly.\nAI will now show you some hints!"
        );

        // Auto-trigger AI hints
        handleAIHint();
      }
    } else {
      // Reset on success
      localStorage.setItem(`failCount_${problem.id}`, "0");
    }

    setIsRunning(false);
  };



  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await runUserCode("submit");
      setResults(res);

      const token = localStorage.getItem("token");
      const submissionStatus = res.every((r) => r.passed) ? "success" : "failed";

      await submitCode(
        {
          questionId: problem.id,
          code,
          language,
          timeTaken: 0,
          status: submissionStatus,
        },
        token
      );

      // ✅ Run Code Quality Analyzer regardless of success/fail
      await handleAICodeQuality();

      // ✅ Recommendations only if successful
      if (submissionStatus === "success" && problem.similar) {
        const allQs = await getAllQuestions(token);
        const similarQs = allQs.filter((q) =>
          problem.similar.includes(q.id || q._id)
        );
        const shuffled = similarQs.sort(() => 0.5 - Math.random());
        setRecommendations(shuffled.slice(0, 3));
      } else {
        setRecommendations([]);
      }
    } catch (err) {
      console.error("❌ Submit error:", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };


  // ---- AI Handlers ----
  const handleAIHint = async () => {
    setAiResponse("Thinking...");
    try {
      const prompt = `Give me step-by-step hints for solving this problem:\n\n${problem.description}. give only hints not the full code`;
      const res = await askAI(prompt);
      setAiResponse(res.result || res.message || "AI could not generate hints.");
    } catch (err) {
      setAiResponse("Error while fetching hints.");
    }
  };

  const handleAIScan = async () => {
    setAiResponse("Scanning your code...");
    try {
      const prompt = `Question:\n${problem.description}\n\nUser's Code (${language}):\n${code}\n\nScan the code and point out mistakes or improvements.`;
      const res = await askAI(prompt);
      setAiResponse(
        res.result || res.message || "AI could not analyze the code."
      );
    } catch (err) {
      setAiResponse("Error while scanning code.");
    }
  };

  // ✅ AI: Approaches
  const handleAIApproach = async () => {
    setAiResponse("Thinking of possible approaches...");
    try {
      const prompt = `
The problem is:
${problem.description}

Give 2-3 different *approaches* or *strategies* to solve this problem — from brute force to optimized.
❌ Don't provide full code.
✅ Focus on algorithmic logic, data structures, and thought process.
Keep it short and structured, don't keep it too long.
`;
      const res = await askAI(prompt);
      setAiResponse(res.result || res.message || "AI could not generate approaches.");
    } catch (err) {
      setAiResponse("Error while fetching approaches.");
    }
  };

  // ✅ AI: Optimization
  const handleAIOptimization = async () => {
    setAiResponse("Finding possible optimizations...");
    try {
      const prompt = `
The problem is:
${problem.description}

User's code (${language}):
${code}

Suggest possible *optimizations* in logic, complexity, or space usage.
❌ Do not give full code.
✅ Just explain the improvements that can make it faster or cleaner.
Keep it concise.
`;
      const res = await askAI(prompt);
      setAiResponse(res.result || res.message || "AI could not generate optimizations.");
    } catch (err) {
      setAiResponse("Error while fetching optimizations.");
    }
  };


  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{problem.title}</h2>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-black border border-white/20 rounded px-2 py-1"
        >
          {supportedLanguages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>

      {/* Resizable editor */}
      <div
        className="border border-white/10 rounded overflow-hidden relative"
        style={{ height: editorHeight }}
      >
        <Editor
          height="100%"
          language={language === "cpp" ? "cpp" : language}
          value={code}
          onChange={setCode}
          theme="vs-dark"
          options={{
            lineNumbers: "on",
            fontSize: 16,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 10 },
            scrollbar: { alwaysConsumeMouseWheel: false },
          }}
        />
        <div
          onMouseDown={handleMouseDown}
          className="absolute bottom-0 left-0 w-full h-2 cursor-row-resize bg-white/20"
        />
      </div>

      <div className="flex gap-4 mt-4">
        <button
          onClick={handleRun}
          disabled={isRunning}
          className={`px-4 py-2 border border-white/20 rounded transition ${isRunning ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10"
            }`}
        >
          {isRunning ? "Running..." : "Run"}
        </button>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`px-4 py-2 border border-white/20 rounded transition ${isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10"
            }`}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>

        {/* 🔹 AI Button */}
        <button
          onClick={() => setShowAIOptions(!showAIOptions)}
          className="px-4 py-2 border border-cyan-400 text-cyan-400 rounded hover:bg-cyan-900/30"
        >
          AI
        </button>
      </div>

      {/* 🔹 AI Options */}
      {showAIOptions && (
        <div className="flex flex-wrap gap-3 mt-3">
          <button
            onClick={handleAIHint}
            className="px-3 py-1 bg-purple-600 rounded hover:bg-purple-700"
          >
            Hint
          </button>
          <button
            onClick={handleAIScan}
            className="px-3 py-1 bg-green-600 rounded hover:bg-green-700"
          >
            Scan
          </button>
          <button
            onClick={handleAIApproach}
            className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700"
          >
            Approaches
          </button>
          <button
            onClick={handleAIOptimization}
            className="px-3 py-1 bg-orange-600 rounded hover:bg-orange-700"
          >
            Optimization
          </button>
        </div>
      )}


      {/* 🔹 AI Response */}
      {aiResponse && (
        <div className="mt-4 p-3 border border-white/20 rounded bg-[#1a1a1a]">
          <h3 className="font-semibold text-cyan-400">AI Assistant:</h3>
          <div
            className="whitespace-pre-wrap text-gray-200 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: aiResponse
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // bold
                .replace(/\*(.*?)\*/g, "<em>$1</em>") // italic
                .replace(/```[\s\S]*?```/g, (match) =>
                  `<pre class='bg-black/30 p-2 rounded text-gray-100 overflow-x-auto'>${match
                    .replace(/```/g, "")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")}</pre>`
                ) // code blocks
                .replace(/\n/g, "<br/>"), // line breaks
            }}
          />

        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border border-white/10 rounded text-left">
            <thead>
              <tr className="bg-white/10">
                <th className="px-2 py-1 border-b border-white/20">#</th>
                <th className="px-2 py-1 border-b border-white/20">Input</th>
                <th className="px-2 py-1 border-b border-white/20">Expected</th>
                <th className="px-2 py-1 border-b border-white/20">Your Output</th>
                <th className="px-2 py-1 border-b border-white/20 text-center">
                  Result
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, idx) => (
                <tr
                  key={idx}
                  className={r.passed ? "bg-green-900/30" : "bg-red-900/30"}
                >
                  <td className="px-2 py-1 border-b border-white/20">{idx + 1}</td>
                  <td className="px-2 py-1 border-b border-white/20">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(r.input)}
                    </pre>
                  </td>
                  <td className="px-2 py-1 border-b border-white/20">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(r.expectedOutput)}
                    </pre>
                  </td>
                  <td className="px-2 py-1 border-b border-white/20">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(r.output)}
                    </pre>
                  </td>
                  <td className="px-2 py-1 border-b border-white/20 text-center">
                    {r.passed ? "✅" : "❌"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Previous Submissions */}
      {/* Previous Submissions */}
      {previousSubs.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Previous Submissions</h3>
          <ul className="space-y-2">
            {[...previousSubs]
              .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
              .map((s) => (
                <li
                  key={s._id}
                  onClick={() => setCode(s.code)}
                  className="p-2 border border-white/20 rounded cursor-pointer hover:bg-white/10"
                >
                  <div className="flex justify-between">
                    <span>{s.language}</span>
                    <span
                      className={
                        s.status === "success" ? "text-green-400" : "text-red-400"
                      }
                    >
                      {s.status === "success" ? "Accepted ✅" : "Attempted ❌"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(s.submittedAt).toLocaleString()}
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}


      {recommendations.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3 text-cyan-400">
            Recommended Next Problems
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => (
              <Link
                key={rec.id || rec._id}   // ✅ supports both id and _id
                to={`/question/${rec.id || rec._id}`}  // ✅ consistent with your backend
                className="p-3 border border-white/20 rounded hover:bg-white/10 transition"
              >
                <h4 className="font-bold">{rec.title}</h4>
                <p className="text-sm text-gray-400">
                  Difficulty: {rec.difficulty}
                </p>
                {rec.tags && (
                  <p className="text-xs text-gray-500">Tags: {rec.tags.join(", ")}</p>
                )}
              </Link>

            ))}
          </div>
        </div>
      )}


    </div>


  );
};

export default CodeEditor;
