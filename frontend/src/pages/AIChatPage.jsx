import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useSearchParams } from "react-router-dom";
import { askAI } from "../utils/askAI";
import { createAIThread, deleteAIThread, listAIThreads, updateAIThread } from "../api/aiThreads";
import { createLearningPath } from "../api/learningPaths";
import { AuthContext } from "../context/AuthContext";


const STORAGE_KEY = "aiChatThreads_v1";

const buildId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getGreeting = (selectedMode) => ({
  role: "ai",
  content:
    selectedMode === "path"
      ? "I'll build you a personalized learning path! To get started, please tell me:\n\n1. **Your current level** (beginner / intermediate / advanced)\n2. **Your goal** (e.g. DSA interviews, full-stack development)\n3. **Preferred language** (e.g. JavaScript, Python)\n4. **Hours per week** you can dedicate\n5. **Timeline** in weeks\n6. **Any preferences** (e.g. visual learning, avoid heavy math)\n\nYou can answer all at once or one by one — I'll adapt!"
      : selectedMode === "problems"
      ? "Awesome! Tell me the topic and I'll suggest practice problems by difficulty."
      : selectedMode === "tutor"
      ? "Hi there! I'm your 24/7 AI Code Tutor. Paste your code or ask a question, and I'll break it down line-by-line, explain concepts simply, or give you both beginner and advanced explanations!"
      : "You can now chat freely with AI about coding topics.",
});

const buildThreadTitle = (mode, messages) => {
  const firstUser = messages.find((m) => m.role === "user");
  if (firstUser?.content) return firstUser.content.slice(0, 36);
  return mode ? `${mode} chat` : "New chat";
};

const parseMessageContent = (content = "") => {
  const parts = [];
  const regex = /```([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: "code", value: match[1] || "" });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) });
  }
  return parts;
};

const extractPathPlan = (content = "") => {
  const match = content.match(/```json([\s\S]*?)```/i);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
};

const stripJsonBlock = (content = "") =>
  content.replace(/```json[\s\S]*?```/i, "").trim();

const mapRemoteThread = (thread) => ({
  id: thread._id,
  title: thread.title,
  mode: thread.mode,
  messages: thread.messages || [],
  updatedAt: thread.updatedAt ? new Date(thread.updatedAt).getTime() : Date.now(),
  origin: "remote",
});

/* ── Rich text renderer ──────────────────────────────────────────
   Renders markdown-like syntax: **bold**, *italic*, `inline code`,
   headings (##), bullet lists (- or *), numbered lists (1.), horizontal rules (---)
   ─────────────────────────────────────────────────────────────── */
const RichText = ({ text }) => {
  const lines = text.split("\n");
  const elements = [];
  let listBuffer = [];
  let listType = null; // "ul" or "ol"

  const flushList = () => {
    if (listBuffer.length === 0) return;
    if (listType === "ol") {
      elements.push(
        <ol key={`ol-${elements.length}`} className="list-decimal list-inside space-y-1.5 my-2 text-sm leading-relaxed text-slate-200">
          {listBuffer.map((item, i) => <li key={i}>{formatInline(item)}</li>)}
        </ol>
      );
    } else {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1.5 my-2 text-sm leading-relaxed text-slate-200">
          {listBuffer.map((item, i) => <li key={i}>{formatInline(item)}</li>)}
        </ul>
      );
    }
    listBuffer = [];
    listType = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      flushList();
      elements.push(<hr key={`hr-${i}`} className="border-white/[0.06] my-4" />);
      continue;
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const cls = level === 1
        ? "text-lg font-bold text-white mt-4 mb-2"
        : level === 2
        ? "text-base font-semibold text-white mt-3 mb-1.5"
        : "text-sm font-semibold text-slate-200 mt-2 mb-1";
      elements.push(<div key={`h-${i}`} className={cls}>{formatInline(text)}</div>);
      continue;
    }

    // Unordered list items (- or *)
    const ulMatch = trimmed.match(/^[-*]\s+(.+)/);
    if (ulMatch) {
      if (listType === "ol") flushList();
      listType = "ul";
      listBuffer.push(ulMatch[1]);
      continue;
    }

    // Ordered list items (1. 2. etc)
    const olMatch = trimmed.match(/^\d+[.)]\s+(.+)/);
    if (olMatch) {
      if (listType === "ul") flushList();
      listType = "ol";
      listBuffer.push(olMatch[1]);
      continue;
    }

    // Normal text or empty line
    flushList();
    if (trimmed === "") {
      elements.push(<div key={`br-${i}`} className="h-2" />);
    } else {
      elements.push(
        <p key={`p-${i}`} className="text-sm leading-relaxed text-slate-200">
          {formatInline(trimmed)}
        </p>
      );
    }
  }
  flushList();

  return <>{elements}</>;
};

/* Format inline markdown: **bold**, *italic*, `code` */
function formatInline(text) {
  // Split by patterns, preserving delimiters
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[1];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(<strong key={match.index} className="font-semibold text-white">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(<em key={match.index} className="italic text-slate-300">{token.slice(1, -1)}</em>);
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(<code key={match.index} className="px-1.5 py-0.5 rounded-md bg-white/[0.06] text-indigo-300 text-[13px] font-mono">{token.slice(1, -1)}</code>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : parts;
}

/* ── Mode metadata ─────────────────────────────────────────────── */
const MODES = [
  { id: "path",      label: "Learning Path",     icon: "🎯", desc: "Custom roadmap with milestones" },
  { id: "problems",  label: "Practice Problems",  icon: "📚", desc: "Curated problems by difficulty" },
  { id: "tutor",     label: "AI Code Tutor",      icon: "🧠", desc: "Real-time guidance & breakdowns" },
  { id: "chat",      label: "General Chat",       icon: "💬", desc: "Open-ended coding Q&A" },
];

/* ── Tiny SVG icons ────────────────────────────────────────────── */
const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
);
const ChatIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

/* ── Code block with copy ──────────────────────────────────────── */
const CodeBlock = ({ value }) => {
  const [copied, setCopied] = useState(false);
  const lines = value.trim().split("\n");
  const firstLine = lines[0]?.trim() || "";
  const hasLang = /^[a-zA-Z]+$/.test(firstLine) && firstLine.length < 20;
  const lang = hasLang ? firstLine : "";
  const code = hasLang ? lines.slice(1).join("\n") : value.trim();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-white/[0.06] bg-[#0c0c0c]">
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/[0.06]">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{lang || "code"}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-indigo-300 transition-colors">
          {copied ? <><CheckIcon /> Copied</> : <><CopyIcon /> Copy</>}
        </button>
      </div>
      <pre className="p-4 text-[13px] leading-relaxed overflow-x-auto text-slate-200 font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════ */
const AIChatPage = () => {
  const token = localStorage.getItem("token");
  const { userName } = useContext(AuthContext);

  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("");
  const [syncStatus, setSyncStatus] = useState("idle");
  const [loading, setLoading] = useState(false);
  const [pathStatus, setPathStatus] = useState("");
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId),
    [threads, activeThreadId]
  );

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }, [messages]);

  /* Auto-resize textarea */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  useEffect(() => {
    const loadThreads = async () => {
      if (token) {
        try {
          const res = await listAIThreads(token);
          const remoteThreads = (res.data || []).map(mapRemoteThread);
          setThreads(remoteThreads);
          if (remoteThreads[0]) {
            setActiveThreadId(remoteThreads[0].id);
            setMode(remoteThreads[0].mode);
            setMessages(remoteThreads[0].messages || []);
          }
          return;
        } catch {
          setSyncStatus("offline");
        }
      }

      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const localThreads = parsed.map((t) => ({ ...t, origin: "local" }));
          setThreads(localThreads);
          if (localThreads[0]) {
            setActiveThreadId(localThreads[0].id);
            setMode(localThreads[0].mode);
            setMessages(localThreads[0].messages || []);
          }
        }
      } catch {
        // ignore
      }
    };

    loadThreads();
  }, [token]);

  useEffect(() => {
    if (!activeThreadId) return;
    setThreads((prev) => {
      const updated = prev.map((thread) =>
        thread.id === activeThreadId
          ? {
              ...thread,
              mode,
              messages,
              title: buildThreadTitle(mode, messages),
              updatedAt: Date.now(),
            }
          : thread
      );
      if (!token) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }, [messages, mode, activeThreadId, token]);

  useEffect(() => {
    if (!token || !activeThread) return;
    if (activeThread.origin !== "remote" || activeThread.pending) return;

    const handle = setTimeout(async () => {
      try {
        setSyncStatus("saving");
        await updateAIThread(token, activeThread.id, {
          title: activeThread.title,
          mode: activeThread.mode,
          messages: activeThread.messages,
        });
        setSyncStatus("saved");
      } catch {
        setSyncStatus("error");
      }
    }, 600);

    return () => clearTimeout(handle);
  }, [token, activeThread]);

  const startNewChat = useCallback(async (selectedMode, presetInput = "") => {
    const greeting = getGreeting(selectedMode);
    const tempId = `local-${buildId()}`;
    const optimisticThread = {
      id: tempId,
      title: selectedMode ? `${selectedMode} chat` : "New chat",
      mode: selectedMode,
      messages: [greeting],
      updatedAt: Date.now(),
      origin: token ? "remote" : "local",
      pending: !!token,
    };

    setMode(selectedMode);
    setMessages([greeting]);
    setInput(presetInput);
    setActiveThreadId(tempId);
    setThreads((prev) => [optimisticThread, ...prev].slice(0, 20));

    if (token) {
      try {
        const res = await createAIThread(token, {
          title: optimisticThread.title,
          mode: optimisticThread.mode,
          messages: optimisticThread.messages,
        });
        const saved = mapRemoteThread(res.data);
        setThreads((prev) => prev.map((t) => (t.id === tempId ? saved : t)));
        setActiveThreadId(saved.id);
        setSyncStatus("saved");
      } catch {
        setSyncStatus("error");
      }
    }
  }, [token]);

  useEffect(() => {
    const presetMode = searchParams.get("mode");
    const context = searchParams.get("context");
    if (presetMode === "chat" && context) {
      startNewChat("chat", `Need help with this problem:\n${decodeURIComponent(context)}`);
    }
  }, [searchParams, startNewChat]);

  const handleModeSelect = (selectedMode) => {
    startNewChat(selectedMode);
  };

  const loadThread = (thread) => {
    setActiveThreadId(thread.id);
    setMode(thread.mode);
    setMessages(thread.messages || []);
    setInput("");
  };

  const handleDeleteThread = async (thread) => {
    if (!thread) return;
    setThreads((prev) => {
      const updated = prev.filter((t) => t.id !== thread.id);
      if (!token) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
    if (activeThreadId === thread.id) {
      setActiveThreadId(null);
      setMessages([]);
      setMode("");
    }

    if (token && thread.origin === "remote") {
      try {
        await deleteAIThread(token, thread.id);
      } catch {
        setSyncStatus("error");
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const contextualGuidance =
        mode === "path"
          ? "You are a learning path architect. The user will describe their goals and constraints. IMPORTANT: Do NOT keep asking follow-up questions. Generate the learning path immediately using whatever information the user provides. For any missing details, assume reasonable defaults (intermediate level, 6 hours/week, 8 weeks, JavaScript).\n\nReturn your response in TWO parts:\n1) A JSON code block with keys: title, summary, time_per_week, duration_weeks, milestones (array of {title, duration_weeks, focus, tasks[]}).\n2) A clean, readable summary with markdown headings (##), **bold text**, and bullet points.\nNever ask more than one clarifying question. Prefer generating the path over asking questions. No code solutions."
          : mode === "problems"
          ? "Suggest 5-10 practice problems for the given topic with increasing difficulty and the concept each tests. Use markdown formatting with headers, numbered lists, and bold for problem names."
          : mode === "tutor"
          ? "You are a 24/7 AI Code Tutor. Explain concepts in simple terms, break down complex topics line-by-line, and give multiple explanations (such as a beginner-friendly analogy and a more advanced technical breakdown). Answer doubts instantly and clearly. Use markdown extensively."
          : "Respond with clean, well-formatted markdown. Use headings, bold, bullet points, and code blocks where appropriate.";
      const response = await askAI({
        prompt: userMsg.content,
        mode: "general",
        context: contextualGuidance,
      });
      const aiMsg = {
        role: "ai",
        content: response.result || response.message || response.error || "Something went wrong",
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", content: "Error contacting AI" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPath = async (plan) => {
    if (!plan || !token) return;
    try {
      setPathStatus("saving");
      await createLearningPath(token, {
        title: plan.title,
        summary: plan.summary,
        timePerWeek: String(plan.time_per_week || "").trim(),
        durationWeeks: Number(plan.duration_weeks || 8),
        milestones: (plan.milestones || []).map((m) => ({
          title: m.title,
          durationWeeks: Number(m.duration_weeks || 2),
          focus: m.focus,
          tasks: (m.tasks || []).map((t) => ({ title: t, done: false })),
        })),
      });
      setPathStatus("saved");
    } catch {
      setPathStatus("error");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const recentThreads = useMemo(
    () => [...threads].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 12),
    [threads]
  );

  const placeholders = {
    path: "Describe your goals, level, and time commitment…",
    problems: "e.g. Arrays, Dynamic Programming, Graphs…",
    tutor: "Share a concept or code snippet to break down…",
    chat: "Ask anything about coding…",
  };

  /* ── Sync status indicator ─────────────────────────────────────── */
  const syncDot = syncStatus === "saved" ? "bg-emerald-400" : syncStatus === "saving" ? "bg-amber-400 animate-pulse" : syncStatus === "error" ? "bg-red-400" : "bg-slate-500";

  /* ══════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#050505] text-slate-200">
      <div className="h-[calc(100vh-82px)] mt-[82px] flex overflow-hidden">

        {/* ── SIDEBAR ────────────────────────────────────────────────── */}
        <aside className="hidden md:flex w-72 flex-col border-r border-white/[0.06] bg-[#080808]">
          {/* Sidebar header */}
          <div className="p-4 border-b border-white/[0.06]">
            <button
              onClick={() => startNewChat(mode || "chat")}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-indigo-600/20"
            >
              <PlusIcon /> New Chat
            </button>
          </div>

          {/* Sync status */}
          <div className="px-4 pt-3 pb-1 flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${syncDot}`} />
            <span className="text-[11px] text-slate-500 capitalize">{syncStatus}</span>
          </div>

          {/* Thread list */}
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            <div className="pt-3 pb-2 px-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Recent Chats</span>
            </div>
            {recentThreads.length === 0 && (
              <div className="px-1 py-6 text-center">
                <div className="text-2xl mb-2">💬</div>
                <p className="text-xs text-slate-500">No conversations yet.</p>
                <p className="text-xs text-slate-600">Start a new chat above!</p>
              </div>
            )}
            <div className="space-y-1">
              {recentThreads.map((thread) => (
                <div
                  key={thread.id}
                  className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-150 ${
                    activeThreadId === thread.id
                      ? "bg-indigo-500/10 border border-indigo-500/20"
                      : "hover:bg-white/[0.03] border border-transparent"
                  }`}
                  onClick={() => loadThread(thread)}
                >
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/[0.05] flex items-center justify-center text-slate-400">
                    <ChatIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium capitalize truncate ${activeThreadId === thread.id ? "text-indigo-300" : "text-slate-300"}`}>
                      {thread.mode || "general"}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{thread.title}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteThread(thread); }}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-1 rounded-md hover:bg-red-400/10"
                    aria-label="Delete thread"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── MAIN CHAT AREA ─────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#050505]">

          {/* Mode tabs (shown when a mode is active) */}
          {mode && (
            <div className="flex-shrink-0 flex items-center justify-center gap-1.5 px-4 py-3 border-b border-white/[0.06] bg-[#080808]/80 backdrop-blur-sm">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleModeSelect(m.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                    mode === m.id
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                  }`}
                >
                  <span className="text-sm">{m.icon}</span> {m.label}
                </button>
              ))}
            </div>
          )}

          {/* ── WELCOME SCREEN (no mode selected) ──────────────────────── */}
          {!mode ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto">
              {/* Hero */}
              <div className="text-center max-w-2xl mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-6">
                  <span className="text-sm">✨</span> AI-Powered Coding Assistant
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Your <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Learning companion</span>
                </h1>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Choose a mode below to get targeted coaching, curated practice sets, or real-time code breakdowns.
                </p>
              </div>

              {/* Mode cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl mb-10">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleModeSelect(m.id)}
                    className="group flex flex-col items-center gap-3 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-indigo-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-600/5"
                  >
                    <span className="text-3xl group-hover:scale-110 transition-transform duration-200">{m.icon}</span>
                    <span className="text-sm font-semibold text-white">{m.label}</span>
                    <span className="text-[11px] text-slate-500 text-center leading-relaxed">{m.desc}</span>
                  </button>
                ))}
              </div>

              {/* Prompt suggestions */}
              <div className="w-full max-w-3xl">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-3 text-center">Try asking</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {[
                    "Build a roadmap for frontend interviews.",
                    "Suggest 10 graph problems by difficulty.",
                    "Explain the concept of closures.",
                    "Break down how a Promise works.",
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => {
                        handleModeSelect("chat");
                        setInput(example);
                      }}
                      className="text-left px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-sm text-slate-400 hover:text-slate-200 hover:border-indigo-500/20 hover:bg-white/[0.04] transition-all duration-200"
                    >
                      "{example}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ── MESSAGE LIST ──────────────────────────────────────────── */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="text-4xl mb-3">💬</div>
                      <p className="text-slate-400 text-sm">Start by asking a question or paste a problem statement.</p>
                    </div>
                  )}

                  {messages.map((msg, idx) => {
                    const plan = msg.role === "ai" ? extractPathPlan(msg.content) : null;
                    const displayContent = plan ? stripJsonBlock(msg.content) : msg.content;
                    const isUser = msg.role === "user";

                    return (
                      <div key={idx} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                        {/* AI Avatar */}
                        {!isUser && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center text-sm shadow-lg shadow-indigo-600/20 mt-0.5">
                            ✨
                          </div>
                        )}

                        {/* Message bubble */}
                        <div
                          className={`max-w-[85%] md:max-w-[75%] ${
                            isUser
                              ? "rounded-2xl rounded-br-md px-4 py-3 bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/15"
                              : "rounded-2xl rounded-bl-md px-5 py-4 bg-white/[0.03] border border-white/[0.06] text-slate-200"
                          }`}
                        >
                          {parseMessageContent(displayContent).map((part, partIdx) =>
                            part.type === "code" ? (
                              <CodeBlock key={partIdx} value={part.value} />
                            ) : isUser ? (
                              <div key={partIdx} className="whitespace-pre-wrap text-sm leading-relaxed">
                                {part.value}
                              </div>
                            ) : (
                              <RichText key={partIdx} text={part.value} />
                            )
                          )}

                          {/* Path plan card */}
                          {plan && (
                            <div className="mt-4 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm">🎯</span>
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300">Learning Path Detected</span>
                              </div>
                              <div className="text-sm font-semibold text-white mb-1">{plan.title}</div>
                              <div className="text-xs text-slate-400 leading-relaxed mb-3">{plan.summary}</div>
                              {plan.milestones && (
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                  {plan.milestones.slice(0, 5).map((m, i) => (
                                    <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/15 text-[11px] text-indigo-300">
                                      {m.title}
                                    </span>
                                  ))}
                                  {plan.milestones.length > 5 && (
                                    <span className="px-2.5 py-1 text-[11px] text-slate-500">+{plan.milestones.length - 5} more</span>
                                  )}
                                </div>
                              )}
                              {token ? (
                                <button
                                  onClick={() => handleAddPath(plan)}
                                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow-lg shadow-emerald-600/20"
                                >
                                  <PlusIcon /> Add to Learning Curve
                                </button>
                              ) : (
                                <p className="text-xs text-slate-500">Login to save this path.</p>
                              )}
                              {pathStatus && (
                                <p className="text-xs mt-2 text-slate-400">
                                  {pathStatus === "saving" && "Saving…"}
                                  {pathStatus === "saved" && "✓ Saved to your learning curve."}
                                  {pathStatus === "error" && "Could not save. Try again."}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* User Avatar */}
                        {isUser && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-400 text-slate-900 flex items-center justify-center text-[11px] font-bold shadow-lg shadow-cyan-600/20 mt-0.5">
                            {(userName || "U").charAt(0).toUpperCase()}
                          </div>
                        )}

                      </div>
                    );
                  })}

                  {/* Loading indicator */}
                  {loading && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center text-sm shadow-lg shadow-indigo-600/20">
                        ✨
                      </div>
                      <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-white/[0.03] border border-white/[0.06]">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* ── INPUT BAR ──────────────────────────────────────────────── */}
              <div className="flex-shrink-0 border-t border-white/[0.06] bg-[#080808]/80 backdrop-blur-sm px-4 py-3">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-end gap-3 p-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] focus-within:border-indigo-500/30 focus-within:shadow-lg focus-within:shadow-indigo-600/5 transition-all duration-300">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={placeholders[mode] || "Type your question…"}
                      className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-slate-200 placeholder:text-slate-500 px-2 py-1.5 max-h-40"
                      onKeyDown={handleKeyDown}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || loading}
                      className="flex-shrink-0 w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white flex items-center justify-center transition-all duration-200 shadow-lg shadow-indigo-600/20 disabled:shadow-none"
                    >
                      <SendIcon />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-2 text-center">
                    AI may produce inaccurate information. Always verify critical answers.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;
