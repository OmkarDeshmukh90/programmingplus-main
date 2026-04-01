const express = require("express");
const verifyToken = require("../middleware/auth");
const LearningPath = require("../models/LearningPath");

const router = express.Router();

const normalizeMilestones = (milestones = []) => {
  if (!Array.isArray(milestones)) return [];
  return milestones.slice(0, 12).map((m) => ({
    title: String(m.title || "Milestone"),
    durationWeeks: Number(m.durationWeeks || 2),
    focus: String(m.focus || ""),
    tasks: Array.isArray(m.tasks)
      ? m.tasks.slice(0, 24).map((t) => ({
          title: String(t.title || "Task"),
          done: Boolean(t.done),
        }))
      : [],
  }));
};

router.get("/active", verifyToken, async (req, res) => {
  try {
    const path = await LearningPath.findOne({ userId: req.userId, status: "active" }).lean();
    if (!path) return res.json(null);
    res.json(path);
  } catch (err) {
    console.error("Failed to load active learning path:", err);
    res.status(500).json({ error: "Failed to load learning path" });
  }
});

router.get("/", verifyToken, async (req, res) => {
  try {
    const paths = await LearningPath.find({ userId: req.userId }).sort({ updatedAt: -1 }).lean();
    res.json(paths);
  } catch (err) {
    console.error("Failed to load learning paths:", err);
    res.status(500).json({ error: "Failed to load learning paths" });
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      title = "Custom Learning Path",
      summary = "",
      timePerWeek = "",
      durationWeeks = 8,
      milestones = [],
    } = req.body || {};

    await LearningPath.updateMany({ userId: req.userId, status: "active" }, { $set: { status: "archived" } });

    const path = await LearningPath.create({
      userId: req.userId,
      title: String(title || "Custom Learning Path").slice(0, 120),
      summary: String(summary || "").slice(0, 800),
      timePerWeek: String(timePerWeek || "").slice(0, 80),
      durationWeeks: Number(durationWeeks || 8),
      milestones: normalizeMilestones(milestones),
      status: "active",
    });

    res.status(201).json(path);
  } catch (err) {
    console.error("Failed to create learning path:", err);
    res.status(500).json({ error: "Failed to create learning path" });
  }
});

router.patch("/:id/tasks", verifyToken, async (req, res) => {
  try {
    const { milestoneIndex, taskIndex, done } = req.body || {};
    if (milestoneIndex == null || taskIndex == null) {
      return res.status(400).json({ error: "milestoneIndex and taskIndex are required" });
    }

    const path = await LearningPath.findOne({ _id: req.params.id, userId: req.userId });
    if (!path) return res.status(404).json({ error: "Learning path not found" });

    const milestone = path.milestones?.[milestoneIndex];
    if (!milestone || !milestone.tasks?.[taskIndex]) {
      return res.status(400).json({ error: "Task not found" });
    }

    milestone.tasks[taskIndex].done = Boolean(done);
    await path.save();

    res.json(path);
  } catch (err) {
    console.error("Failed to update learning path task:", err);
    res.status(500).json({ error: "Failed to update task" });
  }
});

module.exports = router;
