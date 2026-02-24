const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Submission = require("../models/Submission");
const verifyToken = require("../middleware/auth");
const questionsData = require("../data/questions.json");

const toTopicName = (rawTag) => {
  if (!rawTag) return "General";
  return String(rawTag)
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

const isoDateOnly = (date) => new Date(date).toISOString().slice(0, 10);

const buildStreaks = (successSubmissions) => {
  const uniqueDays = Array.from(new Set(successSubmissions.map((s) => isoDateOnly(s.submittedAt)))).sort();
  if (uniqueDays.length === 0) {
    return { current: 0, best: 0, activeDays: 0 };
  }

  let best = 1;
  let running = 1;
  for (let i = 1; i < uniqueDays.length; i += 1) {
    const prev = new Date(`${uniqueDays[i - 1]}T00:00:00.000Z`);
    const cur = new Date(`${uniqueDays[i]}T00:00:00.000Z`);
    const diffDays = Math.round((cur - prev) / (24 * 60 * 60 * 1000));
    if (diffDays === 1) {
      running += 1;
      if (running > best) best = running;
    } else {
      running = 1;
    }
  }

  let current = 0;
  const daySet = new Set(uniqueDays);
  const cursor = new Date();
  while (daySet.has(isoDateOnly(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { current, best, activeDays: uniqueDays.length };
};

const buildProgressData = (submissions, windowDays = 14) => {
  const today = new Date();
  const entries = [];

  for (let i = windowDays - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    entries.push({
      key: isoDateOnly(d),
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      solved: 0,
      attempts: 0,
      score: 0,
    });
  }

  const byDate = new Map(entries.map((entry) => [entry.key, entry]));

  for (const sub of submissions) {
    const key = isoDateOnly(sub.submittedAt);
    const slot = byDate.get(key);
    if (!slot) continue;
    slot.attempts += 1;
    if (sub.status === "success") slot.solved += 1;
  }

  let runningScore = 0;
  for (const entry of entries) {
    runningScore += entry.solved * 100 + Math.max(0, entry.attempts - entry.solved) * 15;
    entry.score = runningScore;
  }

  return entries;
};

const buildDashboardPayload = async (userId) => {
  const [user, submissions] = await Promise.all([
    User.findById(userId).lean(),
    Submission.find({ userId }).sort({ submittedAt: 1 }).lean(),
  ]);

  if (!user) {
    return null;
  }

  const allQuestions = Array.isArray(questionsData) ? questionsData : [];
  const questionById = new Map(allQuestions.map((q) => [Number(q.id), q]));
  const totalQuestions = allQuestions.length;

  const topicStatsMap = new Map();
  for (const q of allQuestions) {
    const topic = toTopicName(q.tags?.[0]);
    if (!topicStatsMap.has(topic)) {
      topicStatsMap.set(topic, {
        topic,
        solved: 0,
        attempted: 0,
        total: 0,
        averageTimeSec: 0,
        difficulty: q.difficulty || "easy",
        streak: 0,
      });
    }
    topicStatsMap.get(topic).total += 1;
  }

  const successSubmissions = submissions.filter((s) => s.status === "success");
  const solvedQuestionSet = new Set(successSubmissions.map((s) => Number(s.questionId)));
  const attemptedQuestionSet = new Set(submissions.map((s) => Number(s.questionId)));

  const topicTimeTracker = new Map();
  for (const sub of successSubmissions) {
    const q = questionById.get(Number(sub.questionId));
    if (!q) continue;
    const topic = toTopicName(q.tags?.[0]);
    if (!topicTimeTracker.has(topic)) {
      topicTimeTracker.set(topic, { totalTimeSec: 0, count: 0 });
    }
    if (typeof sub.timeTaken === "number" && !Number.isNaN(sub.timeTaken)) {
      topicTimeTracker.get(topic).totalTimeSec += Math.max(0, sub.timeTaken);
      topicTimeTracker.get(topic).count += 1;
    }
  }

  for (const qId of solvedQuestionSet) {
    const q = questionById.get(qId);
    if (!q) continue;
    const topic = toTopicName(q.tags?.[0]);
    const current = topicStatsMap.get(topic);
    if (current) current.solved += 1;
  }

  for (const qId of attemptedQuestionSet) {
    const q = questionById.get(qId);
    if (!q) continue;
    const topic = toTopicName(q.tags?.[0]);
    const current = topicStatsMap.get(topic);
    if (current) current.attempted += 1;
  }

  for (const [topic, track] of topicTimeTracker.entries()) {
    const current = topicStatsMap.get(topic);
    if (!current) continue;
    current.averageTimeSec = track.count > 0 ? Math.round(track.totalTimeSec / track.count) : 0;
  }

  const topics = Array.from(topicStatsMap.values())
    .filter((item) => item.total > 0)
    .map((item) => ({
      ...item,
      progress: item.total > 0 ? Math.round((item.solved / item.total) * 100) : 0,
      pending: Math.max(item.total - item.solved, 0),
    }))
    .sort((a, b) => b.solved - a.solved || a.topic.localeCompare(b.topic));

  const difficultyData = ["easy", "medium", "hard"].map((level) => {
    const value = Array.from(solvedQuestionSet).reduce((sum, qId) => {
      const q = questionById.get(qId);
      return q && String(q.difficulty).toLowerCase() === level ? sum + 1 : sum;
    }, 0);
    return { name: level[0].toUpperCase() + level.slice(1), value };
  });

  const streaks = buildStreaks(successSubmissions);
  const progressData = buildProgressData(submissions, 14);

  const solvedCount = solvedQuestionSet.size;
  const attemptedCount = attemptedQuestionSet.size;
  const totalSubmissions = submissions.length;
  const successRate = totalSubmissions > 0 ? Math.round((successSubmissions.length / totalSubmissions) * 100) : 0;
  const progressPercent = totalQuestions > 0 ? Math.round((solvedCount / totalQuestions) * 100) : 0;

  const focusTopics = topics
    .filter((t) => t.pending > 0)
    .sort((a, b) => (a.progress - b.progress) || (b.pending - a.pending))
    .slice(0, 3)
    .map((t) => t.topic);

  const weeklyTarget = Math.max(3, Math.min(10, Math.ceil((totalQuestions - solvedCount) / 8)));

  return {
    user: { name: user.name, email: user.email, id: String(user._id) },
    summary: {
      solvedCount,
      attemptedCount,
      totalQuestions,
      totalSubmissions,
      successRate,
      progressPercent,
      weeklyTarget,
    },
    streaks,
    topics,
    difficultyData,
    progressData,
    motivation: {
      headline:
        solvedCount === 0
          ? "Start with one easy problem today to begin your streak."
          : streaks.current > 0
          ? `You are on a ${streaks.current}-day streak. Keep it alive today.`
          : "You solved before. Restart with one quick win today.",
      focusTopics,
      nextMilestone: Math.min(totalQuestions, solvedCount + weeklyTarget),
    },
  };
};

router.get("/me", verifyToken, async (req, res) => {
  try {
    const payload = await buildDashboardPayload(req.userId);
    if (!payload) return res.status(404).json({ error: "User not found" });
    return res.json(payload);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

// Backward-compatible endpoint with ownership enforcement.
router.get("/:userId", verifyToken, async (req, res) => {
  try {
    if (req.params.userId !== req.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const payload = await buildDashboardPayload(req.userId);
    if (!payload) return res.status(404).json({ error: "User not found" });
    return res.json(payload);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
