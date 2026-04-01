import React, { useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import JitsiMeetPanel from "./JitsiMeetPanel";
import useLiveInterviewCollab from "../../hooks/useLiveInterviewCollab";
import ReactBitsButton from "../ui/ReactBitsButton";

const defaultEditorOptions = {
  fontSize: 14,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  padding: { top: 12 },
};

const languageOptions = ["javascript", "python", "cpp", "java"];

export default function LiveInterviewWorkspace({
  session,
  token,
  onAutoSave,
  onComplete,
  displayName,
}) {
  const isCandidate = session.isCandidate;
  const isOrganizer = session.isOwner;
  const enabled = session.status === "in_progress";

  const initialCode = session.candidateCode || "";
  const initialNotes = session.candidateNotes || "";
  const initialAiChat = session.aiChat || [];
  const [aiInput, setAiInput] = useState("");

  const {
    code,
    notes,
    language,
    handleCodeChange,
    handleNotesChange,
    setLanguage,
    saveStatus,
    connected,
    aiMessages,
    aiStatus,
    sendAiHint,
  } = useLiveInterviewCollab({
    sessionId: session._id,
    token,
    enabled,
    initialCode,
    initialNotes,
    initialLanguage: "javascript",
    initialAiChat,
    canPersist: isCandidate,
    canRequestHint: isCandidate,
    onPersist: onAutoSave,
  });

  const descriptionLines = useMemo(() => (session.taskDescription || "").split("\n"), [session.taskDescription]);

  const handleSendHint = () => {
    if (!aiInput.trim()) return;
    sendAiHint({
      prompt: aiInput,
      context: `${session.taskTitle}\n${session.taskDescription}`,
    });
    setAiInput("");
  };

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-xl font-semibold text-cyan-200">{session.taskTitle}</h3>
          <p className="text-xs text-slate-400">
            Status: {session.status} {session.remainingSeconds != null ? `- ${session.remainingSeconds}s left` : ""}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isOrganizer && session.status === "in_progress" && (
            <ReactBitsButton variant="success" onClick={onComplete}>Complete Interview</ReactBitsButton>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr,1.2fr,0.9fr] gap-4 mb-4">
        <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
          <h4 className="text-sm uppercase tracking-wide text-slate-300 mb-2">Problem Description</h4>
          <div className="text-sm text-slate-200 space-y-2">
            {descriptionLines.map((line, idx) => (
              <p key={`${idx}-${line}`} className="leading-relaxed">{line}</p>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h4 className="text-sm uppercase tracking-wide text-slate-300">Collaborative Code Editor</h4>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded bg-slate-900 border border-slate-700 p-2 text-sm"
            >
              {languageOptions.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
          <div className="h-[420px] rounded-lg overflow-hidden border border-slate-800">
            <Editor
              height="100%"
              language={language === "cpp" ? "cpp" : language}
              value={code}
              onChange={(value) => handleCodeChange(value || "")}
              theme="vs-dark"
              options={defaultEditorOptions}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm uppercase tracking-wide text-slate-300">AI Hint Stream</h4>
            <span className="text-xs text-slate-500">{isCandidate ? "Candidate prompts" : "Read only"}</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {aiMessages.length === 0 && (
              <div className="text-xs text-slate-400 border border-dashed border-slate-700 rounded-lg p-3">
                No hints yet. Ask the AI for guided help without code.
              </div>
            )}
            {aiMessages.map((msg, idx) => (
              <div
                key={`${msg.role}-${idx}`}
                className={`rounded-lg border border-slate-800 p-3 text-xs ${
                  msg.role === "user" ? "bg-cyan-600/15 text-cyan-100" : "bg-slate-900 text-slate-200"
                }`}
              >
                <div className="font-semibold mb-1">{msg.role === "user" ? "Candidate" : "AI"}</div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            ))}
          </div>
          {aiStatus && <div className="text-xs text-slate-400 mt-2">{aiStatus}</div>}
          {isCandidate && (
            <div className="mt-3 flex gap-2">
              <input
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Ask for a hint (no code)..."
                className="app-input flex-1 text-xs"
              />
              <ReactBitsButton variant="neutral" onClick={handleSendHint}>Send</ReactBitsButton>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <JitsiMeetPanel sessionId={session._id} displayName={displayName} />
        <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
          <h4 className="text-sm uppercase tracking-wide text-slate-300 mb-2">Candidate Notes</h4>
          <textarea
            rows={10}
            className="w-full rounded bg-slate-900 border border-slate-700 p-2 text-sm"
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Thinking steps, plan, or tradeoffs..."
          />
        </div>
      </div>

      <div className="text-xs text-slate-400">
        Auto-save: {saveStatus} - Realtime: {connected ? "Connected" : "Disconnected"}
      </div>
    </div>
  );
}
