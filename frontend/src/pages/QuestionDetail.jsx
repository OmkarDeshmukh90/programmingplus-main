import React, { useEffect, useState, useRef, lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import { getQuestionById } from "../api/questions";
import { MessageSquare, Code2 } from "lucide-react";

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

  if (loading) return (
    <div className="flex flex-col xl:flex-row gap-6 min-h-[calc(100vh-140px)] w-full p-4 animate-pulse">
      <div className="w-full xl:w-1/2 bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6">
        <div className="h-8 w-1/3 bg-slate-700/50 rounded-full mb-6"></div>
        <div className="h-10 w-3/4 bg-slate-700/50 rounded-lg mb-4"></div>
        <div className="h-6 w-1/4 bg-slate-700/50 rounded mb-12"></div>
        <div className="space-y-4">
          <div className="h-4 bg-slate-700/50 rounded w-full"></div>
          <div className="h-4 bg-slate-700/50 rounded w-full"></div>
          <div className="h-4 bg-slate-700/50 rounded w-5/6"></div>
          <div className="h-4 bg-slate-700/50 rounded w-4/6"></div>
        </div>
      </div>
      <div className="w-full xl:w-1/2 bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6">
        <div className="h-12 w-full bg-slate-700/50 rounded-lg mb-6"></div>
        <div className="h-[400px] w-full bg-slate-700/50 rounded-xl"></div>
      </div>
    </div>
  );
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
              className={`px-3 py-1 rounded-full text-xs border ${tab === item.id ? "border-cyan-400 text-cyan-200" : "border-slate-700 text-slate-300"
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
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-900/40 rounded-xl border border-dashed border-slate-700">
            <MessageSquare className="w-12 h-12 text-slate-500 mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-slate-300 mb-1">No Discussions Yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mb-6">
              Be the first to share your approach, ask a question, or discuss edge cases for this problem.
            </p>
            <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition text-sm shadow-lg shadow-indigo-900/20">
              Start a Discussion
            </button>
          </div>
        )}

        {tab === "submissions" && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-900/40 rounded-xl border border-dashed border-slate-700">
            <Code2 className="w-12 h-12 text-slate-500 mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-slate-300 mb-1">No Submissions</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              You haven't submitted any solutions for this problem yet. Run your code in the editor to see your submission history here.
            </p>
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
