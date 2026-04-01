import React, { useEffect, useState, useRef, lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import { getQuestionById } from "../api/questions";

const CodeEditor = lazy(() => import("../components/CodeEditor"));

export default function QuestionDetail() {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTags, setShowTags] = useState(false);
  const [tab, setTab] = useState("statement");

  const [leftWidth, setLeftWidth] = useState(48);
  const isResizing = useRef(false);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const token = localStorage.getItem("token");
        const data = await getQuestionById(id, token);
        setProblem(data);
      } catch (err) {
        console.error("Error fetching problem:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [id]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current) return;
      const newLeftWidth = (e.clientX / window.innerWidth) * 100;
      setLeftWidth(Math.min(72, Math.max(28, newLeftWidth)));
    };

    const handleMouseUp = () => {
      isResizing.current = false;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  if (loading) return <div className="text-white">Loading...</div>;
  if (!problem) return <div className="text-white">Problem not found</div>;

  const renderCompact = (val) =>
    typeof val === "object" ? JSON.stringify(val) : String(val);
  const renderPretty = (val) =>
    typeof val === "object" ? JSON.stringify(val, null, 2) : String(val);

  return (
    <div className="flex flex-col xl:flex-row gap-0 min-h-[calc(100vh-140px)]">
      <div
        className="app-card p-6 overflow-y-auto"
        style={{ width: `${leftWidth}%` }}
      >
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { id: "statement", label: "Statement" },
            { id: "examples", label: "Examples" },
            { id: "discussion", label: "Discussion" },
            { id: "submissions", label: "Submissions" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`px-3 py-1 rounded-full text-xs border ${
                tab === item.id ? "border-cyan-400 text-cyan-200" : "border-slate-700 text-slate-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex items-center gap-3 text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-2">
               Challenge #{problem?.id} <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/30" /> {problem?.tags?.[0] || "DSA"}
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">{problem?.title}</h1>
          </div>
          <span className={`px-4 py-1.5 rounded-xl font-bold text-xs uppercase border ${problem?.difficulty?.toLowerCase() === 'easy' ? 'text-teal-400 border-teal-400/20 bg-teal-400/5' : problem?.difficulty?.toLowerCase() === 'medium' ? 'text-amber-400 border-amber-400/20 bg-amber-400/5' : 'text-rose-500 border-rose-500/20 bg-rose-500/5'}`}>
            {problem?.difficulty}
          </span>
        </div>

        {problem?.tags && (
          <div className="mb-4">
            <button
              onClick={() => setShowTags(!showTags)}
              className="px-3 py-1 border border-slate-600 rounded text-xs hover:bg-slate-800"
            >
              {showTags ? "Hide Tags" : "Show Tags"}
            </button>
            {showTags && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {problem.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 bg-slate-800 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "statement" && (
          <>
            {problem?.description && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-1">Problem Statement</h3>
                <p className="text-slate-300 whitespace-pre-line">{problem.description}</p>
              </div>
            )}
            {problem?.inputFormat && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-1">Input Format</h3>
                <pre className="bg-slate-950/70 p-3 rounded text-slate-300 whitespace-pre-wrap border border-slate-800">
                  {problem.inputFormat}
                </pre>
              </div>
            )}
            {problem?.outputFormat && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-1">Output Format</h3>
                <pre className="bg-slate-950/70 p-3 rounded text-slate-300 whitespace-pre-wrap border border-slate-800">
                  {problem.outputFormat}
                </pre>
              </div>
            )}
            {problem?.constraints && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-1">Constraints</h3>
                <pre className="bg-slate-950/70 p-3 rounded text-slate-300 whitespace-pre-wrap border border-slate-800">
                  {renderPretty(problem.constraints)}
                </pre>
              </div>
            )}
          </>
        )}

        {tab === "examples" && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3">Sample Test Cases</h3>
            {(problem?.sampleCases || []).map((tc, idx) => (
              <div key={idx} className="mb-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <p className="font-semibold text-sm">Example {idx + 1}</p>
                <div className="mt-2">
                  <p className="text-slate-300 text-sm">Input</p>
                  <pre className="bg-slate-900/80 p-2 rounded text-slate-200 whitespace-pre-wrap">
                    {renderCompact(tc.input)}
                  </pre>
                </div>
                <div className="mt-2">
                  <p className="text-slate-300 text-sm">Output</p>
                  <pre className="bg-slate-900/80 p-2 rounded text-slate-200 whitespace-pre-wrap">
                    {renderCompact(tc.expectedOutput)}
                  </pre>
                </div>
              </div>
            ))}
            {(problem?.sampleCases || []).length === 0 && (
              <div className="app-empty">No sample cases provided yet.</div>
            )}
          </div>
        )}

        {tab === "discussion" && (
          <div className="app-empty">
            Discussion threads will appear here. Use Discuss to share approaches.
          </div>
        )}

        {tab === "submissions" && (
          <div className="app-empty">
            Submission history will appear here after your first attempt.
          </div>
        )}
      </div>

      <div
        onMouseDown={() => (isResizing.current = true)}
        className="hidden xl:block w-1 bg-slate-700/60 cursor-col-resize"
      />

      <div
        className="app-card p-6 overflow-y-auto mt-4 xl:mt-0"
        style={{ width: `${100 - leftWidth}%` }}
      >
        <Suspense fallback={<div className="text-slate-300">Loading editor...</div>}>
          <CodeEditor problem={problem} />
        </Suspense>
      </div>
    </div>
  );
}
