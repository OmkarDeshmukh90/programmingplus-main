import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { getQuestionById } from "../api/questions";
import CodeEditor from "../components/CodeEditor";

export default function QuestionDetail() {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTags, setShowTags] = useState(false);

  // For resizable layout
  const [leftWidth, setLeftWidth] = useState(50); // percentage
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
      setLeftWidth(Math.min(75, Math.max(25, newLeftWidth))); // min 25%, max 75%
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

  // ✅ Compact stringify for sample cases
  const renderCompact = (val) =>
    typeof val === "object" ? JSON.stringify(val) : String(val);

  // ✅ Pretty stringify for descriptions, constraints, etc.
  const renderPretty = (val) =>
    typeof val === "object" ? JSON.stringify(val, null, 2) : String(val);

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Left side */}
      <div
        className="p-6 overflow-y-auto border-r border-white/10"
        style={{ width: `${leftWidth}%` }}
      >
        <h1 className="text-2xl font-bold mb-2">{problem?.title}</h1>
        <p className="text-gray-400 mb-1">ID: {problem?.id}</p>
        <p className="text-gray-400 mb-4">Difficulty: {problem?.difficulty}</p>

        {/* Tags */}
        {problem?.tags && (
          <div className="mb-4">
            <button
              onClick={() => setShowTags(!showTags)}
              className="px-3 py-1 border border-white/30 rounded text-sm hover:bg-white/10"
            >
              {showTags ? "Hide Tags" : "Show Tags"}
            </button>
            {showTags && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {problem.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-white/10 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Problem details */}
        {problem?.description && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-1">Problem Statement</h3>
            <p className="text-gray-300 whitespace-pre-line">
              {problem.description}
            </p>
          </div>
        )}
        {problem?.inputFormat && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-1">Input Format</h3>
            <pre className="bg-white/5 p-3 rounded text-gray-300 whitespace-pre-wrap">
              {problem.inputFormat}
            </pre>
            
          </div>
        )}
        {problem?.outputFormat && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-1">Output Format</h3>
            <pre className="bg-white/5 p-3 rounded text-gray-300 whitespace-pre-wrap">
              {problem.outputFormat}
            </pre>
          </div>
        )}
        {problem?.constraints && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-1">Constraints</h3>
            <pre className="bg-white/5 p-3 rounded text-gray-300 whitespace-pre-wrap">
              {renderPretty(problem.constraints)}
            </pre>
          </div>
        )}
        {problem?.sampleCases && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3">Sample Test Cases</h3>
            {problem.sampleCases.map((tc, idx) => (
              <div key={idx} className="mb-4">
                <p className="font-semibold text-sm">Example {idx + 1}</p>
                <div className="mt-1">
                  <p className="text-gray-300 text-sm">Input:</p>
                  <pre className="bg-white/5 p-2 rounded text-gray-200 whitespace-pre-wrap">
                    {renderCompact(tc.input)}
                  </pre>
                </div>
                <div className="mt-2">
                  <p className="text-gray-300 text-sm">Output:</p>
                  <pre className="bg-white/5 p-2 rounded text-gray-200 whitespace-pre-wrap">
                    {renderCompact(tc.expectedOutput)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drag handle */}
      <div
        onMouseDown={() => (isResizing.current = true)}
        className="w-1 bg-white/20 cursor-col-resize"
      ></div>

      {/* Right side */}
      <div
        className="p-6 overflow-y-auto"
        style={{ width: `${100 - leftWidth}%` }}
      >
        <CodeEditor problem={problem} />
      </div>
    </div>
  );
}
