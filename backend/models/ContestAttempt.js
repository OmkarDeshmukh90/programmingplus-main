const mongoose = require("mongoose");

const contestAttemptSchema = new mongoose.Schema(
  {
    contestId: { type: mongoose.Schema.Types.ObjectId, ref: "Contest", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["registered", "in_progress", "submitted", "expired"],
      default: "registered",
      index: true,
    },
    joinedAt: { type: Date, default: Date.now },
    startedAt: Date,
    endsAt: Date,
    submittedAt: Date,
    score: { type: Number, min: 0 },
    feedback: { type: String, trim: true, default: "" },
    answersSummary: { type: String, trim: true, default: "" },
    assessmentQuestions: [
      {
        questionId: { type: Number, required: true },
        title: { type: String, required: true },
        difficulty: { type: String, default: "medium" },
        description: { type: String, default: "" },
        inputFormat: { type: String, default: "" },
        outputFormat: { type: String, default: "" },
        constraints: { type: String, default: "" },
      },
    ],
    answers: [
      {
        questionId: { type: Number, required: true },
        language: { type: String, enum: ["javascript", "python", "cpp", "java"], default: "javascript" },
        code: { type: String, default: "" },
        notes: { type: String, default: "" },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

contestAttemptSchema.index({ contestId: 1, userId: 1 }, { unique: true });
contestAttemptSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("ContestAttempt", contestAttemptSchema);
