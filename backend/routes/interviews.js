const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Interview = require("../models/Interview");
const LiveInterviewSession = require("../models/LiveInterviewSession");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Public diagnostic route
router.get("/ping", (req, res) => {
  res.json({ message: "Interviews router is active" });
});

const verifyToken = require("../middleware/auth");

/* ── CREATE interview ─────────────────────────────────────────── */
router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, type, duration, language, difficulty, candidate, interviewer, schedule, questions } = req.body;
    const interview = new Interview({
      companyId: req.userId,
      title: title || "Untitled Interview",
      type,
      duration,
      language,
      difficulty,
      candidate,
      interviewer,
      schedule,
      questions,
      status: schedule?.date ? "scheduled" : "draft",
    });
    await interview.save();
    res.status(201).json(interview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── LIST CANDIDATE'S interviews (by logged-in user email) ────── */
router.get("/my-interviews", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    const emailStr = String(user.email || '').trim();
    const emailRegex = new RegExp(`^${emailStr}$`, "i");

    const interviews = await Interview.find({ "candidate.email": emailRegex })
      .sort({ "schedule.date": -1 })
      .lean();
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── LIST company interviews ──────────────────────────────────── */
router.get("/", verifyToken, async (req, res) => {
  try {
    const interviews = await Interview.find({ companyId: req.userId })
      .sort({ createdAt: -1 })
      .lean();
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── GET single interview ─────────────────────────────────────── */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id).lean();
    if (!interview) return res.status(404).json({ error: "Not found" });
    res.json(interview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── Time-window helper (IST = UTC+05:30) ────────────────────── */
function getSessionAccessStatus(schedule, durationMinutes) {
  // 1. Support LiveInterviewSession (flat scheduledStartTime)
  if (schedule instanceof Date || (typeof schedule === 'string' && !isNaN(Date.parse(schedule)))) {
    const startTime = new Date(schedule).getTime();
    const duration = (Number(durationMinutes) || 60) * 60 * 1000;
    const buffer = duration;
    const endWindow = startTime + duration + buffer;
    const now = Date.now();
    if (now < startTime) return "not_started";
    if (now > endWindow) return "expired";
    return "allowed";
  }

  // 2. Support Standalone Interview (nested schedule object)
  if (!schedule || !schedule.date || !schedule.startTime) return "allowed";

  // Parse "YYYY-MM-DD" + "HH:mm" as IST (+05:30)
  const isoString = `${schedule.date}T${schedule.startTime}:00+05:30`;
  const startTime = new Date(isoString).getTime();
  if (Number.isNaN(startTime)) return "allowed"; // unparseable → skip

  const duration = (Number(schedule.duration) || Number(durationMinutes) || 60) * 60 * 1000;
  const buffer = duration; // buffer equals duration
  const endWindow = startTime + duration + buffer;
  const now = Date.now();

  if (now < startTime) return "not_started";
  if (now > endWindow) return "expired";
  return "allowed";
}

/* ── GET interview by room token (public, for joining) ────────── */
router.get("/session/:roomToken", async (req, res) => {
  try {
    const roomToken = req.params.roomToken;
    console.log(`[SESSION] Fetching room with token: "${roomToken}"`);
    
    let interview = await Interview.findOne({ roomToken }).lean();
    let isLiveSession = false;
    if (!interview && mongoose.Types.ObjectId.isValid(roomToken)) {
      interview = await LiveInterviewSession.findById(roomToken)
        .populate("contestId", "title")
        .lean();
      if (interview) {
        isLiveSession = true;
        interview.title = interview.contestId?.title || interview.taskTitle || "Live Interview";
        interview.difficulty = interview.difficulty || "Medium";
        interview.type = interview.type || "Live Session";
        
        const validDate = interview.scheduledStartTime ? new Date(interview.scheduledStartTime) : new Date();
        const safeIso = !isNaN(validDate.getTime()) ? validDate.toISOString() : new Date().toISOString();
        
        interview.schedule = {
          date: safeIso.split('T')[0],
          startTime: !isNaN(validDate.getTime()) 
            ? validDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
            : "00:00"
        };
      }
    }

    if (!interview) {
      console.warn(`[SESSION] Room NOT FOUND for token: "${roomToken}"`);
      return res.status(404).json({ error: "Room not found" });
    }

    // Enforce time-window access
    const scheduleData = isLiveSession ? interview.scheduledStartTime : interview.schedule;
    const duration = isLiveSession ? interview.durationMinutes : interview.duration;
    
    const accessStatus = getSessionAccessStatus(scheduleData, duration);
    if (accessStatus === "not_started") {
      const scheduledAt = isLiveSession 
        ? new Date(interview.scheduledStartTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        : `${interview.schedule.date} ${interview.schedule.startTime} IST`;

      return res.status(403).json({
        error: "not_started",
        message: "This interview has not started yet. Please come back at the scheduled time.",
        scheduledAt,
      });
    }
    if (accessStatus === "expired") {
      return res.status(403).json({
        error: "expired",
        message: "This interview session has expired. The access window has closed.",
      });
    }

    res.json(interview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── UPDATE interview ─────────────────────────────────────────── */
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const allowed = ["title", "type", "duration", "language", "difficulty", "candidate", "interviewer", "schedule", "questions", "status", "currentCode", "currentLanguage", "whiteboardData", "chatHistory", "timerStatus"];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    // Auto-set status to scheduled if schedule is provided
    if (update.schedule?.date && !update.status) {
      update.status = "scheduled";
    }
    const interview = await Interview.findOneAndUpdate(
      { _id: req.params.id, companyId: req.userId },
      { $set: update },
      { new: true }
    );
    if (!interview) return res.status(404).json({ error: "Not found" });
    res.json(interview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── CHANGE STATUS ────────────────────────────────────────────── */
router.put("/:id/status", verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["draft", "scheduled", "in_progress", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const interview = await Interview.findOneAndUpdate(
      { _id: req.params.id, companyId: req.userId },
      { $set: { status } },
      { new: true }
    );
    if (!interview) return res.status(404).json({ error: "Not found" });
    res.json(interview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── SUBMIT EVALUATION ────────────────────────────────────────── */
router.post("/:id/evaluate", verifyToken, async (req, res) => {
  try {
    const { coding, problemSolving, communication, systemDesign, verdict, notes } = req.body;
    const interview = await Interview.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: {
          evaluation: { coding, problemSolving, communication, systemDesign, verdict, notes },
          status: "completed",
        },
      },
      { new: true }
    );
    if (!interview) return res.status(404).json({ error: "Not found" });
    res.json(interview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── GET REPORT ───────────────────────────────────────────────── */
router.get("/:id/report", verifyToken, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id).lean();
    if (!interview) return res.status(404).json({ error: "Not found" });

    const report = {
      candidateName: interview.candidate?.name || "N/A",
      interviewTitle: interview.title,
      type: interview.type,
      duration: interview.duration,
      scheduledDate: interview.schedule?.date || "N/A",
      questionsAttempted: interview.codeSubmissions?.length || 0,
      codeSubmissions: interview.codeSubmissions || [],
      evaluation: interview.evaluation || {},
      recordingUrl: interview.recordingUrl || "",
      createdAt: interview.createdAt,
      completedAt: interview.updatedAt,
    };
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── DELETE interview ─────────────────────────────────────────── */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const interview = await Interview.findOneAndDelete({
      _id: req.params.id,
      companyId: req.userId,
    });
    if (!interview) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
