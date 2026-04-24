/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect, useState, useRef } from "react";

import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { io } from "socket.io-client";
import axios from "axios";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import BASE_URL from "../config";
import { AuthContext } from "../context/AuthContext";


const LANGUAGES = [
  { id: "javascript", label: "JavaScript" },
  { id: "python",     label: "Python" },
  { id: "java",       label: "Java" },
  { id: "cpp",        label: "C++" },
  { id: "go",         label: "Go" },
];

const defaultEditorOptions = {
  fontSize: 14,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  padding: { top: 12 },
  automaticLayout: true,
};

/* ── SVG Icons ─────────────────────────────────────────────────── */
const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
);
const SendIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
);
const SparklesIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" /><path d="M5 3l1 2M3 5l2-1M19 19l2-1M19 21l1-2" /></svg>
);

const InterviewRoom = () => {
  const { roomToken } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = searchParams.get("role") || "candidate";
  const { userName: contextUserName } = useContext(AuthContext);
  // Fall back to role-based label if context hasn't loaded yet
  const userName = contextUserName || (role === "interviewer" ? "Interviewer" : "Candidate");


  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("// Start coding here...\n");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [aiMessages, setAiMessages] = useState([{ role: "ai", text: "Hello! I am your AI assistant. I can help with theoretical questions, Big O complexity, or system design. (I cannot provide any code solutions.)", timestamp: new Date() }]);
  const [aiInput, setAiInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [accessError, setAccessError] = useState(null); // 'not_started', 'expired', 'not_found'
  const [scheduledAt, setScheduledAt] = useState("");

  // Socket & Video Refs
  const socketRef = useRef();
  const videoContainerRef = useRef(null);
  const zegoInstance = useRef(null);
  
  const isInterviewer = role === "interviewer";
  const isRemoteChange = useRef(false);
  const [activePanel, setActivePanel] = useState(null); // 'editor', 'chat', 'ai', 'notes'
  const [notes, setNotes] = useState("");
  const [showNav, setShowNav] = useState(true);
  const outputPreview = output
    ? output.split("\n").map((line) => line.trim()).filter(Boolean).slice(-3).join(" | ")
    : "";

  /* ── Socket Connection ────────────────────────────────────────── */
  useEffect(() => {
    if (!roomToken) return;

    const socketUrl = BASE_URL.replace("/api", "");
    const socket = io(socketUrl, {
      auth: { token: localStorage.getItem("token") },
      query: { roomToken }
    });
    socketRef.current = socket;

    socket.emit("join-room", { roomToken });

    socket.on("room-state", (state) => {
      if (state.code) setCode(state.code);
      if (state.language) setLanguage(state.language);
      if (state.chatHistory) setChatMessages(state.chatHistory);
      if (state.output) {
        setOutput(state.output);
        if (isInterviewer) {
          setActivePanel("editor");
        }
      }
    });

    socket.on("code-update", ({ code, language }) => {
      isRemoteChange.current = true;
      setCode(code);
      setLanguage(language);
      setTimeout(() => { isRemoteChange.current = false; }, 50);
    });

    socket.on("code-output", ({ output }) => {
      setOutput(output);
      if (isInterviewer) {
        setActivePanel("editor");
      }
    });

    socket.on("new-message", (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    socket.on("ai-chat-update", ({ messages }) => {
      setAiMessages(messages);
    });

    socket.on("notes-update", ({ notes }) => {
      setNotes(notes);
    });

    return () => {
      socket.disconnect();
      if (zegoInstance.current) {
        zegoInstance.current.destroy();
      }
    };
  }, [roomToken, isInterviewer]);

  /* ── ZegoCloud Integration ────────────────────────────────────── */
  useEffect(() => {
    if (!roomToken || !videoContainerRef.current || !interview) return;
    if (zegoInstance.current) return; // Prevent multiple initializations

    const myMeeting = async () => {
      try {
        const rawAppID = import.meta.env.VITE_ZEGO_APP_ID;
        const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET || import.meta.env.VITE_ZEGO_APP_SIGN;

        console.log("Zego Init: AppID present?", !!rawAppID);
        console.log("Zego Init: Secret present?", !!serverSecret);
        
        if (!rawAppID || !serverSecret) {
          console.error("Zego Config Missing! Check your .env file and restart the server.");
          return;
        }

        const appID = parseInt(rawAppID);
        if (isNaN(appID)) {
          console.error("Zego AppID is not a valid number:", rawAppID);
          return;
        }

        // Check if we are in a secure context (localhost or HTTPS)
        if (!window.isSecureContext) {
          console.warn("WARNING: Browser is not in a secure context. Camera/Mic may be blocked.");
        }

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID,
          serverSecret,
          roomToken,
          Date.now().toString(), // User ID
          userName
        );

        console.log("Zego KitToken generated successfully.");
        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zegoInstance.current = zp;

        zp.joinRoom({
          container: videoContainerRef.current,
          sharedLinks: [
            {
              name: 'Join link',
              url: window.location.origin + window.location.pathname + `?role=candidate`,
            },
          ],
          scenario: {
            mode: ZegoUIKitPrebuilt.GroupCall,
          },
          showScreenSharingButton: false,
          showUserList: false,
          showPreJoinView: false,
          turnOnCameraWhenJoining: true,
          turnOnMicrophoneWhenJoining: true,
          theme: "dark",
          layout: "Grid",
        });
        console.log("Zego Room joined successfully.");
      } catch (err) {
        console.error("Zego Initialization Error:", err);
      }
    };

    myMeeting();
  }, [roomToken, interview]);

  /* ── Load interview ──────────────────────────────────────────── */
  useEffect(() => {
    if (!roomToken) return;
    const load = async () => {
      setLoading(true);
      setAccessError(null);
      setScheduledAt("");

      try {
        console.log(`[DIAG] Loading room: ${roomToken} from ${BASE_URL}/interviews/session/${roomToken}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
        
        // Use native fetch with explicit CORS and credentials
        const response = await fetch(`${BASE_URL}/interviews/session/${roomToken}`, {
          mode: 'cors',
          credentials: 'include',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          if (response.status === 403) {
            const data = await response.json();
            setAccessError(data.error || "forbidden");
            setScheduledAt(data.scheduledAt || "");
          } else if (response.status === 404) {
            setAccessError("not_found");
          } else {
            setAccessError("server_error");
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setInterview(data);
        setAccessError(null);
      } catch (err) {
        console.error("Room Fetch Critical Error:", err);
        setAccessError("network_error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [roomToken, navigate]);

  const handlePing = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/interviews/ping`);
      alert("✅ Ping Success: " + (res.data.message || "Connected!"));
    } catch (err) {
      console.error("Ping error:", err);
      alert("❌ Ping Failed: " + (err.response?.data?.message || err.message));
    }
  };

  /* ── Handlers ────────────────────────────────────────────────── */
  const handleCodeChange = (newCode) => {
    if (isRemoteChange.current) return;
    setCode(newCode);
    if (socketRef.current) {
      socketRef.current.emit("code-change", { code: newCode, language });
    }
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (socketRef.current) {
      socketRef.current.emit("code-change", { code, language: newLang });
    }
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    socketRef.current.emit("send-message", { 
      text: chatInput, 
      role, 
      senderName: userName 
    });
    setChatInput("");
  };

  const handleRunCode = async () => {
    if (isRunning) return;
    console.log("handleRunCode triggered:", { language, codeLength: (code||"").length, endpoint: `${BASE_URL}/code/execute` });
    
    setIsRunning(true);
    const startMsg = "⏳ Initializing build environment...";
    setOutput(startMsg);
    if (socketRef.current) socketRef.current.emit("code-output", { output: startMsg });
    
    // Ensure the editor panel is active to see the console
    if (activePanel !== 'editor') setActivePanel("editor");
    
    try {
      if (!code || !language) {
        throw new Error("Missing code or language selection.");
      }
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(`${BASE_URL}/code/execute`, {
        code,
        language,
        stdin: "",
        roomToken,
      }, {
        headers,
        timeout: 20000 // 20s timeout
      });
      
      const finalMsg = res.data.output || "Code executed with no output.";
      setOutput(finalMsg);
      if (socketRef.current) socketRef.current.emit("code-output", { output: finalMsg });
    } catch (err) {
      console.error("Execution Error Detail:", err);
      let errMsg = "❌ Execution Failed\n\n";
      
      if (err.code === "ECONNABORTED") {
        errMsg += "Error: Request Timed Out.\nPossible cause: Server is taking too long to respond.";
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        errMsg += "Error: This interview room is not authorized to execute code right now.";
      } else if (!err.response) {
        errMsg += `Error: Network Connectivity Failure.\n\nPossible Causes:\n1. Server is offline at ${BASE_URL}\n2. CORS logic is blocking the request from ${window.location.origin}\n3. You are accessing via IP but the backend only allows localhost.`;
      } else {
        errMsg += `Error: ${err.response?.data?.message || err.message}`;
      }
      
      setOutput(errMsg);
      if (socketRef.current) socketRef.current.emit("code-output", { output: errMsg });
    } finally {
      setIsRunning(false);
    }
  };

  const _handleSubmit = () => {
    const submitMsg = "✅ Final solution submitted!\n\nThe interviewer will review your code and provide a verdict.";
    setOutput(submitMsg);
    socketRef.current.emit("code-output", { output: submitMsg });
    setActivePanel("editor");
  };

  const handleSubmitSolution = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setActivePanel("editor");

    try {
      if (!code || !language) {
        throw new Error("Missing code or language selection.");
      }

      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const startMsg = "Submitting candidate solution...";
      setOutput(startMsg);
      if (socketRef.current) socketRef.current.emit("code-output", { output: startMsg });

      const res = await axios.post(
        `${BASE_URL}/code/execute`,
        {
          code,
          language,
          stdin: "",
          roomToken,
        },
        {
          headers,
          timeout: 20000,
        }
      );

      const finalOutput = res.data.output || "Code executed with no output.";
      const submitMsg = `Final solution submitted.\n\nProgram Output:\n${finalOutput}`;
      setOutput(submitMsg);
      if (socketRef.current) socketRef.current.emit("code-output", { output: submitMsg });
    } catch (err) {
      let submitErrMsg = "Submission failed.\n\n";

      if (err.code === "ECONNABORTED") {
        submitErrMsg += "Error: Request timed out while validating the submission.";
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        submitErrMsg += "Error: This interview room is not authorized to execute code right now.";
      } else if (!err.response) {
        submitErrMsg += "Error: Network connectivity failure while submitting the code.";
      } else {
        submitErrMsg += `Error: ${err.response?.data?.message || err.message}`;
      }

      setOutput(submitErrMsg);
      if (socketRef.current) socketRef.current.emit("code-output", { output: submitErrMsg });
    } finally {
      setIsRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Immersing...</span>
        </div>
      </div>
    );
  }

  if (accessError === "not_started") {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-dark border border-white/[0.05] rounded-3xl p-10 text-center shadow-2xl">
          <div className="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Too Early!</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            This interview hasn't started yet. The room will become accessible at the scheduled time.
          </p>
          {scheduledAt && (
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-4 mb-8">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Scheduled For</span>
              <span className="text-amber-400 font-mono font-bold tracking-wider">{scheduledAt}</span>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <button onClick={() => window.location.reload()} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors">
              Check Again
            </button>
            <button onClick={() => navigate("/dashboard")} className="w-full py-3 border border-white/[0.1] text-white font-bold rounded-xl hover:bg-white/[0.05] transition-colors">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (accessError === "expired") {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-dark border border-white/[0.05] rounded-3xl p-10 text-center shadow-2xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Session Expired</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            The access window for this interview has closed. Please contact your coordinator for a reschedule.
          </p>
          <button onClick={() => navigate("/dashboard")} className="w-full py-3 border border-white/[0.1] text-white font-bold rounded-xl hover:bg-white/[0.05] transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (accessError === "network_error") {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full glass-dark-premium border border-white/10 rounded-3xl p-10">
          <div className="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Connection Failure</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 text-left">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-widest">Target Endpoint</p>
            <p className="text-xs text-indigo-300 font-mono break-all mb-4">{BASE_URL}/interviews/session/{roomToken}</p>
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-widest">Diagnosis</p>
            <p className="text-xs text-amber-200 leading-relaxed italic mb-4">
              The browser blocked the request or the server at this address is unreachable. 
            </p>
            <a 
              href={`${BASE_URL}/interviews/session/${roomToken}`} 
              target="_blank" 
              rel="noreferrer"
              className="text-[10px] text-indigo-400 font-bold underline block text-center py-2 bg-indigo-500/10 rounded-lg hover:bg-indigo-500/20 transition-all mb-2"
            >
              Open API Directly in Browser (Test Link)
            </a>
            <p className="text-[9px] text-slate-600 text-center uppercase tracking-tighter italic leading-tight">If this link shows data but the app still fails, your browser is blocking CORS.</p>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={() => window.location.reload()} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-colors">
              Retry Connection
            </button>
            <button onClick={handlePing} className="w-full py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors">
              Test Server Connection (Ping)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!interview || accessError === "not_found" || accessError === "server_error") {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-6 opacity-20 text-white font-black tracking-tighter italic">
            {accessError === "server_error" ? "500" : "404"}
          </div>
          <h2 className="text-2xl font-black text-white mb-2">
            {accessError === "server_error" ? "Server Error" : "Room not found"}
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            {accessError === "server_error" 
              ? "The server encountered an error processing your request. Please check the backend logs." 
              : "This interview link is invalid or the session has been deleted."}
          </p>
          <button onClick={() => navigate("/dashboard")} className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const askAI = async () => {
    if (!aiInput.trim() || isAiLoading || isInterviewer) return;
    const userPrompt = aiInput.trim();
    const userMsg = { role: "user", text: userPrompt, timestamp: new Date(), senderName: userName };
    const newMessagesWithUser = [...aiMessages, userMsg];
    setAiMessages(newMessagesWithUser);
    socketRef.current.emit("ai-chat-sync", { messages: newMessagesWithUser });
    setAiInput("");
    setIsAiLoading(true);

    try {
      const { data } = await axios.post(`${BASE_URL}/ai/ask-ai`, {
        prompt: userPrompt,
        mode: "theory_only"
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      const aiMsg = { role: "ai", text: data.result, timestamp: new Date(), senderName: "AI Assistant" };
      const finalMessages = [...newMessagesWithUser, aiMsg];
      setAiMessages(finalMessages);
      socketRef.current.emit("ai-chat-sync", { messages: finalMessages });
    } catch (err) {
      console.error("AI Error:", err);
      const errorMsg = { role: "ai", text: "I encountered an error analyzing that inquiry. Please try again.", timestamp: new Date(), senderName: "AI Assistant" };
      setAiMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#020202] text-slate-200 overflow-hidden font-sans relative">
      
      {/* ── BACKGROUND: IMMERSIVE VIDEO CONFERENCE ── */}
      <div className="absolute inset-0 z-0">
        <div ref={videoContainerRef} className="w-full h-full zego-video-container-fullscreen" />
        
        {/* Overlay Gradients for Depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />
      </div>

      {/* ── TOP SLIM BAR ── */}
      <div className="absolute top-0 inset-x-0 h-14 flex items-center justify-between px-6 bg-black/20 backdrop-blur-md border-b border-white/5 z-[120]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10">
            <span className="text-white font-black text-xs">IE</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-white tracking-tight uppercase">{interview.title}</span>
            <div className="flex items-center gap-2">
               <span className="text-[7px] text-indigo-400 font-black uppercase tracking-widest">Live Room</span>
               <span className="text-[7px] text-slate-500 font-black">•</span>
               <span className="text-[7px] text-emerald-500 font-bold uppercase tracking-wider">{userName} ({role})</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => window.confirm("Exit interview?") && navigate("/dashboard")}
            className="px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
          >
            Leave
          </button>
        </div>
      </div>

      {/* ── FLOATING TOOLBAR (RIGHT) ── */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-[400]">
        <button
          onClick={() => { setShowNav(!showNav); if (showNav) setActivePanel(null); }}
          className={`w-14 h-14 rounded-full flex flex-col items-center justify-center gap-1.5 transition-all duration-300 shadow-2xl border ${
            showNav 
              ? "bg-indigo-600 border-indigo-400 text-white" 
              : "bg-black/60 backdrop-blur-2xl border-white/20 text-indigo-400 hover:border-white/40"
          }`}
        >
          <div className={`w-6 h-0.5 bg-current rounded-full transition-transform ${showNav ? 'rotate-45 translate-y-2' : ''}`} />
          <div className={`w-6 h-0.5 bg-current rounded-full ${showNav ? 'opacity-0' : ''}`} />
          <div className={`w-6 h-0.5 bg-current rounded-full transition-transform ${showNav ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>

        {showNav && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {[
              { id: "editor", icon: "💻", label: "Editor", color: "indigo" },
              { id: "chat",   icon: "💬", label: "Chat", color: "blue" },
              { id: "notes",  icon: "📔", label: "Notes", color: "amber" },
              { id: "ai",     icon: "✨", label: "AI Help", color: "emerald", premium: true },
            ].map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActivePanel(activePanel === tool.id ? null : tool.id)}
                className={`group relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border shadow-2xl ${
                  activePanel === tool.id 
                    ? `bg-${tool.color}-600 border-${tool.color}-400 text-white scale-110` 
                    : "bg-black/60 backdrop-blur-3xl border-white/10 text-slate-400 hover:border-white/30 hover:scale-110"
                }`}
              >
                <span className="text-xl">{tool.icon}</span>
                <div className="absolute right-full mr-4 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-[8px] font-black text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {tool.label}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── FLOATING PANELS ── */}
      {output && (
        <div className="absolute left-6 right-24 bottom-6 z-[260] pointer-events-none">
          <div className="max-w-3xl rounded-3xl border border-emerald-400/30 bg-black/80 shadow-2xl shadow-emerald-950/40 backdrop-blur-2xl pointer-events-auto overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-emerald-400/20 bg-gradient-to-r from-emerald-500/15 via-cyan-400/10 to-transparent">
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-300">Latest Console Output</div>
                <div className="text-xs text-slate-300 truncate">{outputPreview || "Output ready"}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActivePanel("editor");
                    setShowNav(true);
                  }}
                  className="px-3 py-1.5 rounded-full bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-colors"
                >
                  Open Console
                </button>
                <button
                  onClick={() => setOutput("")}
                  className="px-3 py-1.5 rounded-full border border-white/10 text-slate-300 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <pre className="max-h-28 overflow-y-auto px-5 py-4 text-sm font-mono text-emerald-300 whitespace-pre-wrap leading-relaxed custom-scrollbar">
              {output}
            </pre>
          </div>
        </div>
      )}

      {activePanel && (
        <div className="flex-1 h-full flex items-center justify-center p-6 md:p-12 relative z-[250]">
          <div className="w-full max-w-5xl h-[85vh] glass-dark-premium border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in fade-in scale-in-95 duration-500 pointer-events-auto">
            
            {/* Panel Header */}
            <div className="flex-shrink-0 px-8 py-5 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{
                  activePanel === 'editor' ? '💻' : 
                  activePanel === 'chat' ? '💬' : 
                  activePanel === 'notes' ? '📔' : '✨'
                }</span>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-white uppercase tracking-widest">
                    {activePanel === 'editor' ? 'Collaborative Editor' : 
                     activePanel === 'chat' ? 'Internal Room Chat' : 
                     activePanel === 'notes' ? 'Private Notepad' : 'Elite AI Assistant'}
                  </span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">ProgrammingPlus+ Toolset</span>
                </div>
              </div>
              <button onClick={() => setActivePanel(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all transition-transform hover:rotate-90">
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {activePanel === 'editor' && (
                <div className="h-full flex flex-col">
                   <div className="px-8 py-3 bg-indigo-500/5 flex items-center justify-between border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Current Language:</span>
                         <select
                            value={language}
                            onChange={(e) => handleLanguageChange(e.target.value)}
                            className="bg-transparent text-[10px] font-black text-white uppercase tracking-widest focus:outline-none cursor-pointer"
                          >
                            {LANGUAGES.map((l) => <option key={l.id} value={l.id} className="bg-[#111]">{l.label}</option>)}
                          </select>
                      </div>
                      <div className="flex gap-2">
                        {!isInterviewer && (
                          <>
                            <button 
                              onClick={handleRunCode} 
                              disabled={isRunning}
                              className={`px-4 py-1.5 rounded-lg text-white text-[9px] font-black uppercase tracking-widest transition-all ${
                                isRunning ? 'bg-slate-700 animate-pulse' : 'bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20'
                              }`}
                            >
                              {isRunning ? "Running..." : "Compile & Run"}
                            </button>
                            <button onClick={handleSubmitSolution} className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-indigo-500/20 transition-all">Submit Solution</button>
                          </>
                        )}
                      </div>
                   </div>
                   <div className="flex-1 relative bg-black/20 flex flex-col">
                      <div className="flex-1">
                        <Editor
                          height="100%"
                          language={language === "cpp" ? "cpp" : language}
                          value={code}
                          onChange={handleCodeChange}
                          theme="vs-dark"
                          options={{
                            ...defaultEditorOptions,
                            fontSize: 15,
                            padding: { top: 20 },
                            backgroundColor: "transparent",
                            readOnly: isInterviewer
                          }}
                        />
                      </div>
                      
                      {/* Integrated Console Output */}
                      {output && (
                        <div className="h-[38%] min-h-[210px] border-t border-emerald-400/20 bg-gradient-to-b from-black/80 to-emerald-950/20 p-0 overflow-hidden animate-in slide-in-from-bottom-4 duration-300 shadow-inner shadow-emerald-950/30">
                           <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-400/15 bg-black/40 backdrop-blur-md">
                              <div>
                                <span className="block text-[10px] font-black text-emerald-300 uppercase tracking-[0.3em]">Console Output</span>
                                <span className="block text-[11px] text-slate-400 mt-1">Shared live with interviewer and candidate</span>
                              </div>
                              <button onClick={() => setOutput("")} className="px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-colors">Clear</button>
                           </div>
                           <pre className="h-[calc(100%-73px)] overflow-y-auto px-6 py-5 text-sm font-mono text-emerald-300 whitespace-pre-wrap leading-7 custom-scrollbar bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_45%)]">
                              {output}
                           </pre>
                        </div>
                      )}
                   </div>
                </div>
              )}

              {activePanel === 'chat' && (
                <div className="h-full flex flex-col p-8">
                  <div className="flex-1 overflow-y-auto space-y-6 mb-6 custom-scrollbar pr-4">
                    {chatMessages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3 opacity-50">
                        <div className="text-4xl">💭</div>
                        <span className="text-[10px] font-black uppercase tracking-widest">No messages yet</span>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex flex-col ${msg.role === role ? "items-end" : "items-start"}`}>
                        <div className={`rounded-2xl px-5 py-3 text-[13px] max-w-[80%] leading-relaxed shadow-xl ${
                          msg.role === role 
                            ? "bg-indigo-600 text-white rounded-tr-none shadow-indigo-900/20" 
                            : "bg-white/5 text-slate-200 border border-white/10 rounded-tl-none"
                        }`}>
                          {msg.text}
                        </div>
                        <span className="text-[8px] text-slate-500 mt-1.5 uppercase font-bold tracking-widest px-1">
                          {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-end gap-3 p-4 bg-white/[0.03] rounded-2xl border border-white/5 focus-within:border-indigo-500/30 transition-all shadow-inner">
                    <textarea
                      rows="2"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendChatMessage())}
                      placeholder="Type a message to the interviewer..."
                      className="flex-1 bg-transparent text-sm text-slate-200 focus:outline-none placeholder:text-slate-700 resize-none font-medium p-1"
                    />
                    <button onClick={sendChatMessage} className="w-12 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-900/40 transition-all flex-shrink-0">
                       <SendIcon />
                    </button>
                  </div>
                </div>
              )}

              {activePanel === 'notes' && (
                <div className="h-full flex flex-col p-8">
                  <div className="mb-4">
                     <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                       {isInterviewer ? "Rough Pad (Candidate's View)" : "Rough Pad (Only you can see this)"}
                     </span>
                  </div>
                   <textarea
                    value={notes}
                    readOnly={isInterviewer}
                    onChange={(e) => {
                      if (isInterviewer) return;
                      setNotes(e.target.value);
                      socketRef.current.emit("notes-change", { notes: e.target.value });
                    }}
                    placeholder={isInterviewer ? "Candidate is currently using the rough pad..." : "Draft your thoughts, logic steps, or system design components here..."}
                    className="flex-1 w-full bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-sm text-slate-200 focus:outline-none focus:border-white/10 transition-all resize-none font-medium leading-relaxed custom-scrollbar"
                  />
                </div>
              )}

              {activePanel === 'ai' && (
                <div className="h-full flex flex-col p-8">
                  <div className="flex-1 overflow-y-auto space-y-6 mb-6 custom-scrollbar pr-4">
                    {aiMessages.map((msg, i) => (
                      <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                        <div className={`rounded-2xl px-6 py-4 text-[13px] max-w-[85%] leading-relaxed shadow-xl border ${
                          msg.role === "user" 
                            ? "bg-emerald-600/10 text-emerald-100 border-emerald-500/20 rounded-tr-none" 
                            : "bg-white/[0.03] text-slate-200 border-white/10 rounded-tl-none ai-message-bubble"
                        }`}>
                          <div className="prose prose-invert prose-xs max-w-none">
                            {msg.text}
                          </div>
                        </div>
                         <span className="text-[8px] text-slate-500 mt-2 uppercase font-bold tracking-widest px-1">
                          {msg.role === "user" ? (isInterviewer ? "Candidate Inquiry" : "Your Inquiry") : "AI Intelligence Architecture"}
                        </span>
                      </div>
                    ))}
                    {isAiLoading && (
                      <div className="flex flex-col items-start animate-pulse">
                         <div className="rounded-2xl px-6 py-4 bg-white/5 border border-white/10 text-[10px] text-emerald-500 font-bold uppercase tracking-widest">
                            AI Assistant is thinking...
                         </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-end gap-3 p-4 bg-white/[0.03] rounded-2xl border border-white/5 focus-within:border-emerald-500/30 transition-all shadow-inner">
                    <textarea
                      rows="2"
                      value={aiInput}
                      readOnly={isInterviewer}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), askAI())}
                      placeholder={isInterviewer ? "You are viewing the candidate's AI interaction..." : "Ask about time complexity, logic flow, or alternative approaches..."}
                      className="flex-1 bg-transparent text-sm text-slate-200 focus:outline-none placeholder:text-slate-800 resize-none font-medium px-1 py-2"
                    />
                    {!isInterviewer && (
                      <button 
                        onClick={askAI} 
                        disabled={isAiLoading}
                        className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/40 transition-all flex-shrink-0 disabled:opacity-50"
                      >
                        {isAiLoading ? "Processing" : "Inquire"}
                      </button>
                    )}
                  </div>
                  <p className="mt-4 text-[9px] text-slate-600 font-bold uppercase tracking-widest text-center">AI Guidance is theoretical ONLY and follows interview governance rules</p>
                </div>
              )}
            </div>

            {/* Bottom Status (Optional) */}
            <div className={`h-12 border-t border-white/5 flex items-center px-8 text-[9px] font-black uppercase tracking-[0.2em] ${
               activePanel === 'ai' ? 'text-emerald-500 bg-emerald-500/[0.02]' : 'text-slate-600 bg-white/[0.01]'
            }`}>
               Realtime Session Synchronized • AES-256 Encrypted
            </div>
          </div>
        </div>
      )}

      {/* ── GLOBAL LAYOUT OVERLAYS & STYLES ── */}
      <style>{`
        .glass-dark-premium {
          background: rgba(10, 10, 10, 0.7);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
        }
        .ai-message-bubble {
          background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        .zego-video-container-fullscreen > div { background: transparent !important; }
        .zego-video-container-fullscreen video { object-fit: cover !important; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-in-from-bottom-8 { from { transform: translateY(32px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slide-in-from-right-4 { from { transform: translateX(16px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-in { animation: fade-in 0.5s ease-out forwards; }
        /* Remove Zego Default Shadow and Rounded Corners for Immersive Look */
        .zego-video-container-fullscreen div { border-radius: 0 !important; }
      `}</style>
    </div>
  );
};

export default InterviewRoom;
