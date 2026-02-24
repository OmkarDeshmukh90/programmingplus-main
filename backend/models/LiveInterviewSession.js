const mongoose = require("mongoose");

const liveInterviewSessionSchema = new mongoose.Schema(
  {
    contestId: { type: mongoose.Schema.Types.ObjectId, ref: "Contest", required: true, index: true },
    companyUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    candidateUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    invitedCandidateEmail: { type: String, trim: true, lowercase: true, default: "" },
    interviewerName: { type: String, trim: true, required: true },
    interviewerTitle: { type: String, trim: true, default: "" },
    taskTitle: { type: String, trim: true, required: true },
    taskDescription: { type: String, trim: true, required: true },
    allowedLanguages: [{ type: String, trim: true, lowercase: true }],
    durationMinutes: { type: Number, min: 1, default: 60 },
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed", "cancelled"],
      default: "scheduled",
      index: true,
    },
    startsAt: Date,
    endsAt: Date,
    candidateCode: { type: String, default: "" },
    candidateNotes: { type: String, default: "" },
    interviewerFeedback: { type: String, default: "" },
    interviewerRating: { type: Number, min: 0, max: 10 },
  },
  { timestamps: true }
);

liveInterviewSessionSchema.index({ companyUserId: 1, createdAt: -1 });
liveInterviewSessionSchema.index({ candidateUserId: 1, createdAt: -1 });

module.exports = mongoose.model("LiveInterviewSession", liveInterviewSessionSchema);
