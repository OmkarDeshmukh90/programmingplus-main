const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  questionId: { type: Number, required: true },
  code: { type: String, required: true },
  language: { type: String, enum: ["javascript", "python", "cpp", "java"], default: "javascript" },
  status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
  timeTaken: Number,
  thoughtProcess: {
    planningTimeSec: { type: Number, default: 0 },
    executionAttempts: { type: Number, default: 0 },
    hintUsageCount: { type: Number, default: 0 },
    aiAssistActions: { type: Number, default: 0 },
    firstHintAtSec: { type: Number, default: null },
  },
  submittedAt: { type: Date, default: Date.now },
  aiMetrics: {
    timeComplexity: { type: String },
    spaceComplexity: { type: String },
    codeQualityScore: { type: Number, min: 0, max: 100 },
    concepts: [{ type: String }],
    feedback: { type: String },
  }
});

submissionSchema.index({ userId: 1, questionId: 1, submittedAt: -1 });
submissionSchema.index({ userId: 1, submittedAt: -1 });

module.exports = mongoose.model("Submission", submissionSchema);
