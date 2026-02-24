const mongoose = require("mongoose");

const contestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    roleTitle: { type: String, required: true, trim: true },
    skills: [{ type: String, trim: true }],
    eligibility: {
      minSolvedQuestions: { type: Number, default: 0, min: 0 },
      minSuccessRate: { type: Number, default: 0, min: 0, max: 100 },
      allowedEmailDomains: [{ type: String, trim: true, lowercase: true }],
    },
    assessment: {
      durationMinutes: { type: Number, required: true, min: 1 },
      totalQuestions: { type: Number, required: true, min: 1 },
      instructions: { type: String, default: "" },
      maxScore: { type: Number, default: 100, min: 1 },
    },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["draft", "published", "closed"],
      default: "published",
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

contestSchema.index({ startsAt: 1, endsAt: 1 });
contestSchema.index({ companyName: 1, createdAt: -1 });

module.exports = mongoose.model("Contest", contestSchema);
