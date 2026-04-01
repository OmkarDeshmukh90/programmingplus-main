const mongoose = require("mongoose");
const crypto = require("crypto");

const interviewSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* ── Interview basics ─────────────────────────────────────── */
    title: { type: String, trim: true, required: true },
    type: {
      type: String,
      enum: ["DSA", "SystemDesign", "Frontend", "Backend", "FullStack", "General"],
      default: "DSA",
    },
    duration: { type: Number, min: 15, default: 60 }, // minutes
    language: { type: String, trim: true, default: "javascript" },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["draft", "scheduled", "in_progress", "completed", "cancelled"],
      default: "draft",
      index: true,
    },

    /* ── Candidate ────────────────────────────────────────────── */
    candidate: {
      name: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, lowercase: true, default: "" },
      phone: { type: String, trim: true, default: "" },
    },

    /* ── Interviewer ──────────────────────────────────────────── */
    interviewer: {
      name: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, lowercase: true, default: "" },
      role: { type: String, trim: true, default: "Tech Interviewer" },
    },

    /* ── Schedule ─────────────────────────────────────────────── */
    schedule: {
      date: { type: String, default: "" },       // e.g. "2026-03-20"
      startTime: { type: String, default: "" },   // e.g. "11:00"
      duration: { type: Number, default: 60 },
      timezone: { type: String, default: "IST" },
    },

    /* ── Room ─────────────────────────────────────────────────── */
    roomToken: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(12).toString("hex"),
    },
    candidateLink: { type: String, default: "" },
    interviewerLink: { type: String, default: "" },

    /* ── Problem / Questions ──────────────────────────────────── */
    questions: [
      {
        title: { type: String, trim: true },
        description: { type: String, trim: true, default: "" },
        category: { type: String, trim: true, default: "" },
        difficulty: { type: String, default: "Medium" },
      },
    ],

    /* ── Code Submissions ─────────────────────────────────────── */
    codeSubmissions: [
      {
        questionTitle: { type: String, default: "" },
        code: { type: String, default: "" },
        language: { type: String, default: "javascript" },
        testcasesPassed: { type: Number, default: 0 },
        totalTestcases: { type: Number, default: 0 },
        submittedAt: { type: Date, default: Date.now },
      },
    ],

    /* ── Evaluation ───────────────────────────────────────────── */
    evaluation: {
      coding: { type: Number, min: 0, max: 5, default: 0 },
      problemSolving: { type: Number, min: 0, max: 5, default: 0 },
      communication: { type: Number, min: 0, max: 5, default: 0 },
      systemDesign: { type: Number, min: 0, max: 5, default: 0 },
      verdict: {
        type: String,
        enum: ["", "Pass", "Fail", "NextRound"],
        default: "",
      },
      notes: { type: String, default: "" },
    },

    /* ── Session Data (Real-time sync) ────────────────────────── */
    chatHistory: [
      {
        role: { type: String, enum: ["candidate", "interviewer", "ai"] },
        senderName: String,
        text: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    whiteboardData: { type: String, default: "" }, // Base64 or JSON of drawings
    currentCode: { type: String, default: "" },
    currentLanguage: { type: String, default: "javascript" },
    currentOutput: { type: String, default: "" },
    timerStatus: {
      remainingTime: { type: Number },
      isRunning: { type: Boolean, default: false },
      lastUpdated: { type: Date },
    },

    /* ── Recording ────────────────────────────────────────────── */
    recordingUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

interviewSchema.index({ companyId: 1, createdAt: -1 });

/* Auto-generate links before saving */
interviewSchema.pre("save", function (next) {
  if (!this.candidateLink) {
    this.candidateLink = `/interview/room/${this.roomToken}?role=candidate`;
  }
  if (!this.interviewerLink) {
    this.interviewerLink = `/interview/room/${this.roomToken}?role=interviewer`;
  }
  next();
});

module.exports = mongoose.model("Interview", interviewSchema);
