import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { askAI } from "../utils/askAI";

const AIChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("");
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }, [messages]);

  useEffect(() => {
    const presetMode = searchParams.get("mode");
    const context = searchParams.get("context");
    if (presetMode === "hint") {
      setMode("hint");
      setMessages([
        {
          role: "ai",
          content: "Hint mode enabled. I will provide guided hints without giving full direct solutions.",
        },
      ]);
      if (context) {
        setInput(`Need hints for this problem:\n${decodeURIComponent(context)}`);
      }
    }
  }, [searchParams]);

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    setMessages([
      {
        role: "ai",
        content:
          selectedMode === "path"
            ? "Great. Tell me which language you want to learn and I will build a step-by-step roadmap."
            : selectedMode === "problems"
            ? "Awesome. Tell me the topic and I will suggest practice problems by difficulty."
            : selectedMode === "hint"
            ? "Hint mode active. Share your code/thought process and I will nudge you with progressive hints."
            : "You can now chat freely with AI about coding topics.",
      },
    ]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    let promptPrefix = "";

    if (mode === "path") {
      promptPrefix = `
You are a helpful coding mentor.
The user is a beginner who wants a learning path.
Provide a structured roadmap from basics to advanced with mini project suggestions.
`;
    } else if (mode === "problems") {
      promptPrefix = `
You are a coding coach.
Suggest 5-10 practice problems for the given topic with increasing difficulty.
Include the concept each problem tests.
Do not provide full solutions.
`;
    } else if (mode === "hint") {
      promptPrefix = `
You are a coding interviewer assistant.
Provide hints only, not complete solutions.
Give progressive hints:
1) approach hint,
2) algorithm/data structure hint,
3) pseudocode direction.
Keep the user thinking.
`;
    } else {
      promptPrefix = `
You are an AI coding assistant.
Answer clearly and concisely.
`;
    }

    try {
      const response = await askAI(`${promptPrefix}\nUser query: ${input}`);
      const aiMsg = {
        role: "ai",
        content: response.result || response.message || response.error || "Something went wrong",
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", content: "Error contacting AI" }]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center justify-center mt-8 h-screen bg-[#0d1117] text-white">
      <div className="w-[75vw] h-[80vh] flex flex-col border border-gray-700 rounded-2xl shadow-lg overflow-hidden">
        <header className="bg-cyan-600 p-4 text-lg font-bold text-center">AI Programming Assistant</header>

        {mode ? (
          <div className="flex justify-around items-center bg-[#1a1f25] py-3 border-b border-gray-700 text-sm font-semibold">
            {[
              { id: "path", label: "Learning Path" },
              { id: "problems", label: "Practice Problems" },
              { id: "hint", label: "Hint Mode" },
              { id: "chat", label: "General Chat" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => handleModeSelect(m.id)}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  mode === m.id
                    ? "bg-cyan-700 border border-cyan-400 shadow-md scale-105"
                    : "bg-gray-800 hover:bg-gray-700 border border-transparent"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        ) : null}

        {!mode ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <h2 className="text-xl font-semibold mb-2">What do you want to do today?</h2>
            <div className="flex flex-wrap gap-4 justify-center">
              <button onClick={() => handleModeSelect("path")} className="px-5 py-3 bg-cyan-700 hover:bg-cyan-800 rounded-lg">Learning Path</button>
              <button onClick={() => handleModeSelect("problems")} className="px-5 py-3 bg-green-700 hover:bg-green-800 rounded-lg">Practice Problems</button>
              <button onClick={() => handleModeSelect("hint")} className="px-5 py-3 bg-amber-700 hover:bg-amber-800 rounded-lg">Hint Mode</button>
              <button onClick={() => handleModeSelect("chat")} className="px-5 py-3 bg-purple-700 hover:bg-purple-800 rounded-lg">General Chat</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] p-3 rounded-lg break-words whitespace-pre-wrap border border-gray-600 ${
                      msg.role === "user" ? "bg-cyan-700" : "bg-[#1e1e1e] text-gray-100"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex p-4 gap-2 bg-gray-900">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  mode === "path"
                    ? "e.g. I want to learn C++"
                    : mode === "problems"
                    ? "e.g. Arrays"
                    : mode === "hint"
                    ? "Share problem + your current approach/code"
                    : "Type your question..."
                }
                className="flex-1 px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-cyan-500 resize-none"
                onKeyDown={handleKeyDown}
              />
              <button onClick={handleSend} className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg">Send</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AIChatPage;
