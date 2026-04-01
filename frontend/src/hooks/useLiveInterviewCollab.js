import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import BASE_URL from "../config";

const socketUrlFromApi = (apiBase) => apiBase.replace(/\/api\/?$/, "");

const createClientId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export default function useLiveInterviewCollab({
  sessionId,
  token,
  enabled,
  initialCode = "",
  initialNotes = "",
  initialLanguage = "javascript",
  initialAiChat = [],
  canPersist = false,
  canRequestHint = false,
  onPersist,
}) {
  const [code, setCode] = useState(initialCode);
  const [notes, setNotes] = useState(initialNotes);
  const [language, setLanguage] = useState(initialLanguage);
  const [saveStatus, setSaveStatus] = useState("Idle");
  const [connected, setConnected] = useState(false);
  const [aiMessages, setAiMessages] = useState(initialAiChat);
  const [aiStatus, setAiStatus] = useState("");

  const socketRef = useRef(null);
  const clientIdRef = useRef(createClientId());
  const suppressEmitRef = useRef(false);
  const lastSavedRef = useRef(0);

  useEffect(() => {
    setCode(initialCode || "");
    setNotes(initialNotes || "");
    setLanguage(initialLanguage || "javascript");
    setAiMessages(Array.isArray(initialAiChat) ? initialAiChat : []);
  }, [sessionId, initialCode, initialNotes, initialLanguage, initialAiChat]);

  useEffect(() => {
    if (!enabled || !sessionId || !token) return;

    const socket = io(socketUrlFromApi(BASE_URL), {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    const handleConnect = () => {
      setConnected(true);
      socket.emit("join-interview-room", { sessionId });
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    const handleCodeUpdate = ({ code: nextCode, notes: nextNotes, language: nextLanguage, origin }) => {
      if (origin && origin === clientIdRef.current) return;
      suppressEmitRef.current = true;
      if (typeof nextCode === "string") setCode(nextCode);
      if (typeof nextNotes === "string") setNotes(nextNotes);
      if (typeof nextLanguage === "string") setLanguage(nextLanguage);
      setSaveStatus("Synced");
    };

    const handleAiMessage = (payload) => {
      if (!payload) return;
      setAiMessages((prev) => [...prev, payload]);
      setAiStatus("");
    };

    const handleAiError = (payload) => {
      setAiStatus(payload?.message || "AI hint failed.");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("code-update", handleCodeUpdate);
    socket.on("ai-hint-message", handleAiMessage);
    socket.on("ai-hint-error", handleAiError);

    return () => {
      socket.emit("leave-interview", { sessionId });
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("code-update", handleCodeUpdate);
      socket.off("ai-hint-message", handleAiMessage);
      socket.off("ai-hint-error", handleAiError);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, sessionId, token]);

  useEffect(() => {
    if (!enabled || !canPersist || !onPersist) return;
    const interval = setInterval(async () => {
      try {
        setSaveStatus("Saving...");
        await onPersist({ code, notes, language });
        lastSavedRef.current = Date.now();
        setSaveStatus(`Saved ${new Date(lastSavedRef.current).toLocaleTimeString()}`);
      } catch {
        setSaveStatus("Auto-save failed");
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [enabled, canPersist, onPersist, code, notes, language]);

  const emitChange = (nextCode, nextNotes, nextLanguage) => {
    if (!socketRef.current) return;
    socketRef.current.emit("code-change", {
      sessionId,
      code: nextCode,
      notes: nextNotes,
      language: nextLanguage,
      origin: clientIdRef.current,
    });
  };

  const handleCodeChange = (nextCode) => {
    if (suppressEmitRef.current) {
      suppressEmitRef.current = false;
      setCode(nextCode || "");
      return;
    }
    const codeValue = nextCode || "";
    setCode(codeValue);
    setSaveStatus("Typing...");
    emitChange(codeValue, notes, language);
  };

  const handleNotesChange = (nextNotes) => {
    if (suppressEmitRef.current) {
      suppressEmitRef.current = false;
      setNotes(nextNotes || "");
      return;
    }
    const notesValue = nextNotes || "";
    setNotes(notesValue);
    setSaveStatus("Typing...");
    emitChange(code, notesValue, language);
  };

  const handleLanguageChange = (nextLanguage) => {
    const langValue = nextLanguage || "javascript";
    setLanguage(langValue);
    emitChange(code, notes, langValue);
  };

  const sendAiHint = ({ prompt, context }) => {
    if (!socketRef.current || !canRequestHint || !enabled) return;
    setAiStatus("Thinking...");
    socketRef.current.emit("ai-hint-request", {
      sessionId,
      prompt,
      context,
    });
  };

  return {
    code,
    notes,
    language,
    setCode,
    setNotes,
    setLanguage: handleLanguageChange,
    handleCodeChange,
    handleNotesChange,
    saveStatus,
    connected,
    aiMessages,
    aiStatus,
    sendAiHint,
  };
}
