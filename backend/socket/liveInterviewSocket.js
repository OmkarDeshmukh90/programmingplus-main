const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Interview = require("../models/Interview");
const LiveInterviewSession = require("../models/LiveInterviewSession");

const getUserIdFromToken = async (token) => {
  if (!token) return null;
  try {
    const payload = jwt.decode(token);
    if (!payload?.sub) return null;
    const user = await mongoose.model("User").findOne({ clerkId: payload.sub });
    return user?._id || null;
  } catch {
    return null;
  }
};

module.exports = (io) => {
  io.on("connection", (socket) => {
    // We'll support both auth token and room token for flexibility
    const token = socket.handshake.auth?.token || socket.handshake.query?.token || "";
    const userId = getUserIdFromToken(token);

    socket.on("join-room", async ({ roomToken }) => {
      if (!roomToken) return;

      let interview = await Interview.findOne({ roomToken }).lean();
      let isLiveSession = false;

      if (!interview && mongoose.Types.ObjectId.isValid(roomToken)) {
        interview = await LiveInterviewSession.findById(roomToken).lean();
        if (interview) isLiveSession = true;
      }

      if (!interview) {
        socket.emit("error", { message: "Interview not found" });
        return;
      }

      const room = `room_${roomToken}`;
      socket.join(room);
      socket.data.roomToken = roomToken;
      socket.data.room = room;
      socket.data.isLiveSession = isLiveSession;

      console.log(`Socket ${socket.id} joined room ${room} (LiveSession: ${isLiveSession})`);

      // Notify others in the room
      socket.to(room).emit("user-joined", { socketId: socket.id });

      // Send current state
      socket.emit("room-state", {
        code: isLiveSession ? interview.candidateCode : interview.currentCode,
        language: isLiveSession ? (interview.candidateLanguage || "javascript") : interview.currentLanguage,
        output: isLiveSession ? (interview.candidateOutput || "") : (interview.currentOutput || ""),
        chatHistory: isLiveSession ? (interview.aiChat || []).map(m => ({ role: m.role, text: m.content, senderName: m.role === 'ai' ? 'AI' : 'Candidate' })) : (interview.chatHistory || []),
        aiChatHistory: isLiveSession ? (interview.aiChat || []).map(m => ({ role: m.role, text: m.content, senderName: m.role === 'ai' ? 'AI Assistant' : 'Candidate' })) : [],
        notes: isLiveSession ? (interview.notes || "") : (interview.notes || ""),
        whiteboardData: interview.whiteboardData,
        timer: isLiveSession ? { remainingTime: (interview.durationMinutes || 60) * 60, isRunning: interview.status === 'in_progress' } : interview.timerStatus,
        status: interview.status
      });
    });

    /* ── Code Sync ─────────────────────────────────────────────── */
    socket.on("code-change", ({ code, language }) => {
      const room = socket.data.room;
      if (!room) return;
      socket.to(room).emit("code-update", { code, language });

      const updateData = socket.data.isLiveSession
        ? { candidateCode: code, candidateLanguage: language }
        : { currentCode: code, currentLanguage: language };

      const Model = socket.data.isLiveSession ? LiveInterviewSession : Interview;
      const query = socket.data.isLiveSession ? { _id: socket.data.roomToken } : { roomToken: socket.data.roomToken };

      Model.findOneAndUpdate(query, updateData).catch(err => console.error("DB Update Error:", err));
    });

    socket.on("code-output", ({ output }) => {
      const room = socket.data.room;
      if (!room) return;

      io.to(room).emit("code-output", { output });

      const Model = socket.data.isLiveSession ? LiveInterviewSession : Interview;
      const query = socket.data.isLiveSession ? { _id: socket.data.roomToken } : { roomToken: socket.data.roomToken };
      const updateData = socket.data.isLiveSession
        ? { candidateOutput: output }
        : { currentOutput: output };

      Model.findOneAndUpdate(query, updateData).catch(err => console.error("Output Sync Error:", err));
    });

    /* ── Chat Sync ─────────────────────────────────────────────── */
    socket.on("send-message", async ({ text, role, senderName }) => {
      const room = socket.data.room;
      if (!room) return;

      const message = {
        role,
        senderName,
        text,
        timestamp: new Date()
      };

      io.to(room).emit("new-message", message);

      if (socket.data.isLiveSession) {
        await LiveInterviewSession.findByIdAndUpdate(socket.data.roomToken, {
          $push: { aiChat: { role, content: text, createdAt: new Date() } }
        }).catch(err => console.error("Chat Persistence Error:", err));
      } else {
        await Interview.findOneAndUpdate(
          { roomToken: socket.data.roomToken },
          { $push: { chatHistory: message } }
        ).catch(err => console.error("Chat Persistence Error:", err));
      }
    });

    /* ── AI Chat Sync (Candidate to Interviewer) ──────────────── */
    socket.on("ai-chat-sync", ({ messages }) => {
      const room = socket.data.room;
      if (!room) return;
      socket.to(room).emit("ai-chat-update", { messages });

      // Persist to DB if it's a LiveSession
      if (socket.data.isLiveSession) {
        // Map to DB schema
        const aiChat = messages.map(m => ({ role: m.role, content: m.text, createdAt: m.timestamp || new Date() }));
        LiveInterviewSession.findByIdAndUpdate(socket.data.roomToken, { aiChat }).catch(err => console.error("Sync Error:", err));
      }
    });

    /* ── Notes Sync ────────────────────────────────────────────── */
    socket.on("notes-change", ({ notes }) => {
      const room = socket.data.room;
      if (!room) return;
      socket.to(room).emit("notes-update", { notes });

      const Model = socket.data.isLiveSession ? LiveInterviewSession : Interview;
      const query = socket.data.isLiveSession ? { _id: socket.data.roomToken } : { roomToken: socket.data.roomToken };
      Model.findOneAndUpdate(query, { notes }).catch(err => console.error("Notes Sync Error:", err));
    });

    /* ── Whiteboard Sync ───────────────────────────────────────── */
    socket.on("draw", (data) => {
      const room = socket.data.room;
      if (!room) return;
      socket.to(room).emit("draw-update", data);
    });

    /* ── Timer Sync ────────────────────────────────────────────── */
    socket.on("timer-control", ({ action, remainingTime }) => {
      const room = socket.data.room;
      if (!room) return;

      io.to(room).emit("timer-update", { action, remainingTime });

      if (socket.data.isLiveSession) {
        LiveInterviewSession.findByIdAndUpdate(socket.data.roomToken, {
          status: action === "start" ? "in_progress" : "completed"
        }).catch(err => console.error("Timer Persistence Error:", err));
      } else {
        Interview.findOneAndUpdate(
          { roomToken: socket.data.roomToken },
          {
            "timerStatus.remainingTime": remainingTime,
            "timerStatus.isRunning": action === "start",
            "timerStatus.lastUpdated": new Date()
          }
        ).catch(err => console.error("Timer Persistence Error:", err));
      }
    });

    /* ── Sync Request ─────────────────────────────────────────── */
    socket.on("request-sync", ({ to }) => {
      socket.to(to).emit("request-sync", { from: socket.id });
    });

    socket.on("disconnecting", () => {
      const rooms = Array.from(socket.rooms);
      rooms.forEach(room => {
        if (room.startsWith("room_")) {
          socket.to(room).emit("user-left", { socketId: socket.id });
        }
      });
    });

    socket.on("disconnect", () => {
      console.log(`Socket ${socket.id} disconnected`);
    });
  });
};
