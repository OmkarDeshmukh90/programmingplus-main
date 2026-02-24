const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  questionId: { type: Number, required: true },
  code: { type: String, required: true },
  language: { type: String, enum: ["javascript", "python", "cpp"], default: "javascript" },
  status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
  timeTaken: Number,
  submittedAt: { type: Date, default: Date.now }
});

submissionSchema.index({ userId: 1, questionId: 1, submittedAt: -1 });
submissionSchema.index({ userId: 1, submittedAt: -1 });

module.exports = mongoose.model("Submission", submissionSchema);
