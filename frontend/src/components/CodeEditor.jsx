import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { submitCode, getQuestionSubmissions } from "../api/submissions";
import axios from "axios";
import { getAllQuestions } from "../api/questions";
import { Link } from "react-router-dom";
import { askAI } from "../utils/askAI";
import BASE_URL from "../config";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  const [executionAttempts, setExecutionAttempts] = useState(0);
  const [hintUsageCount, setHintUsageCount] = useState(0);
  const [aiAssistActions, setAiAssistActions] = useState(0);
  const [planningTimeSec, setPlanningTimeSec] = useState(0);

  // ✅ AI states
  const [aiResponse, setAiResponse] = useState("");
  const [showAIOptions, setShowAIOptions] = useState(false);
  const sessionStartedAtRef = useRef(Date.now());
  const firstMeaningfulEditAtRef = useRef(null);
  const firstHintAtRef = useRef(null);
  const baselineCodeRef = useRef("");

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
      const res = await askAI({ prompt });
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
    const initialCode = savedCode || defaultBoilerplates[language];
    baselineCodeRef.current = initialCode;
    sessionStartedAtRef.current = Date.now();
    firstMeaningfulEditAtRef.current = null;
    firstHintAtRef.current = null;
    setPlanningTimeSec(0);
    setExecutionAttempts(0);
    setHintUsageCount(0);
    setAiAssistActions(0);
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

  const getPlanningTimeValue = () => {
    const planningMs = (firstMeaningfulEditAtRef.current || Date.now()) - sessionStartedAtRef.current;
    return Math.max(0, Math.round(planningMs / 1000));
  };

  const updatePlanningMetric = () => {
    setPlanningTimeSec(getPlanningTimeValue());
  };

  const handleEditorChange = (nextCode) => {
    const codeValue = nextCode ?? "";
    if (!firstMeaningfulEditAtRef.current && codeValue !== baselineCodeRef.current) {
      firstMeaningfulEditAtRef.current = Date.now();
      updatePlanningMetric();
    }
    setCode(codeValue);
  };

  const recordAiAssistAction = ({ isHint = false } = {}) => {
    setAiAssistActions((prev) => prev + 1);
    if (isHint) {
      setHintUsageCount((prev) => prev + 1);
      if (!firstHintAtRef.current) {
        firstHintAtRef.current = getPlanningTimeValue();
      }
    }
  };

  const thoughtProcessInsights = (() => {
    const insights = [];
    const tags = (problem.tags || []).map((tag) => String(tag).toLowerCase());
    const effectivePlanning = planningTimeSec || getPlanningTimeValue();

    if (effectivePlanning > 0 && effectivePlanning < 45 && executionAttempts >= 2) {
      insights.push("You rush into coding without planning.");
    }
    if (tags.some((tag) => tag.includes("dp") || tag.includes("dynamic")) && (executionAttempts >= 3 || hintUsageCount > 0)) {
      insights.push("You struggle with DP transitions.");
    }
    if (hintUsageCount >= 2) {
      insights.push("You lean on hints quickly. Write the steps in plain English before asking again.");
    }
    if (executionAttempts >= 3 && !insights.includes("You struggle with DP transitions.")) {
      insights.push("Multiple attempts suggest your approach is still evolving.");
    }
    if (insights.length === 0) {
      insights.push("Your current session looks steady. Validate edge cases before you submit.");
    }

    return insights.slice(0, 2);
  })();

  const handleRun = async () => {
    setIsRunning(true);
    setExecutionAttempts((prev) => prev + 1);
    updatePlanningMetric();
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
    setExecutionAttempts((prev) => prev + 1);
    updatePlanningMetric();
    try {
      const res = await runUserCode("submit");
      setResults(res);

      const token = localStorage.getItem("token");
      const submissionStatus = res.every((r) => r.passed) ? "success" : "failed";
      const totalTimeTaken = Math.max(
        1,
        Math.round((Date.now() - sessionStartedAtRef.current) / 1000)
      );

      await submitCode(
        {
          questionId: problem.id,
          code,
          language,
          timeTaken: totalTimeTaken,
          status: submissionStatus,
          thoughtProcess: {
            planningTimeSec: getPlanningTimeValue(),
            executionAttempts: executionAttempts + 1,
            hintUsageCount,
            aiAssistActions,
            firstHintAtSec: firstHintAtRef.current,
          },
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
    recordAiAssistAction({ isHint: true });
    setAiResponse("Thinking...");
    try {
      const prompt = `Give me step-by-step hints for solving this problem:\n\n${problem.description}. give only hints not the full code`;
      const res = await askAI({ prompt });
      setAiResponse(res.result || res.message || "AI could not generate hints.");
    } catch (err) {
      setAiResponse("Error while fetching hints.");
    }
  };

  const handleAIScan = async () => {
    recordAiAssistAction();
    setAiResponse("Scanning your code...");
    try {
      const prompt = `Question:\n${problem.description}\n\nUser's Code (${language}):\n${code}\n\nScan the code and point out mistakes or improvements.`;
      const res = await askAI({ prompt });
      setAiResponse(
        res.result || res.message || "AI could not analyze the code."
      );
    } catch (err) {
      setAiResponse("Error while scanning code.");
    }
  };

  // ✅ AI: Approaches
  const handleAIApproach = async () => {
    recordAiAssistAction();
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
      const res = await askAI({ prompt });
      setAiResponse(res.result || res.message || "AI could not generate approaches.");
    } catch (err) {
      setAiResponse("Error while fetching approaches.");
    }
  };

  // ✅ AI: Optimization
  const handleAIOptimization = async () => {
    recordAiAssistAction();
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
      const res = await askAI({ prompt });
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

      <div className="mb-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-300">Thought Process Tracker</h3>
            <p className="text-xs text-slate-400">Tracking planning, retries, and hint dependence while you solve.</p>
          </div>
          <div className="text-[11px] font-semibold text-slate-300">
            AI Insight: <span className="text-cyan-300">{thoughtProcessInsights[0]}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-[10px] uppercase tracking-widest text-slate-500">Time Before Coding</div>
            <div className="text-2xl font-bold text-white mt-1">{planningTimeSec || getPlanningTimeValue()}s</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-[10px] uppercase tracking-widest text-slate-500">Number of Attempts</div>
            <div className="text-2xl font-bold text-white mt-1">{executionAttempts}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-[10px] uppercase tracking-widest text-slate-500">Hint Usage</div>
            <div className="text-2xl font-bold text-white mt-1">{hintUsageCount}</div>
          </div>
        </div>
        {thoughtProcessInsights[1] && (
          <div className="mt-3 text-xs text-slate-300">
            <span className="font-semibold text-cyan-300">Secondary Insight:</span> {thoughtProcessInsights[1]}
          </div>
        )}
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
          onChange={handleEditorChange}
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
        <div className="mt-4 p-4 border border-white/20 rounded-xl bg-[#1a1a1a]">
          <h3 className="font-semibold text-cyan-400 mb-2">AI Assistant:</h3>
          <div className="text-gray-200 text-sm leading-relaxed prose prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-4 mb-2 text-white" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-4 mb-2 text-white" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-md font-bold mt-3 mb-1 text-cyan-300" {...props} />,
                h4: ({node, ...props}) => <h4 className="text-base font-bold mt-2 mb-1 text-cyan-400" {...props} />,
                code: ({node, inline, className, children, ...props}) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline ? (
                    <div className="my-3 overflow-hidden rounded-lg border border-white/10 bg-black/40">
                      <pre className="p-3 overflow-x-auto text-sm font-mono text-gray-100">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  ) : (
                    <code className="bg-black/40 text-emerald-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                      {children}
                    </code>
                  );
                },
                p: ({node, ...props}) => <p className="mb-3 whitespace-pre-wrap" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc ml-5 mb-3 space-y-1 text-gray-300" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal ml-5 mb-3 space-y-1 text-gray-300" {...props} />,
                li: ({node, ...props}) => <li className="mb-1" {...props} />
              }}
            >
              {aiResponse}
            </ReactMarkdown>
          </div>
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
