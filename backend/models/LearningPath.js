const mongoose = require("mongoose");

const learningTaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const learningMilestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    durationWeeks: { type: Number, default: 2 },
    focus: { type: String, default: "" },
    tasks: { type: [learningTaskSchema], default: [] },
  },
  { _id: false }
);

const learningPathSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "Custom Learning Path" },
    summary: { type: String, default: "" },
    timePerWeek: { type: String, default: "" },
    durationWeeks: { type: Number, default: 8 },
    milestones: { type: [learningMilestoneSchema], default: [] },
    status: { type: String, enum: ["active", "archived"], default: "active", index: true },
  },
  { timestamps: true }
);

learningPathSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model("LearningPath", learningPathSchema);
