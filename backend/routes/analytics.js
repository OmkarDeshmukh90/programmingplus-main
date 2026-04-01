const express = require("express");
const verifyToken = require("../middleware/auth");
const Submission = require("../models/Submission");

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    const submissions = await Submission.find({ userId: req.userId, "aiMetrics": { $exists: true } }).sort({ submittedAt: 1 });
    
    // Aggregate Strengths & Weaknesses
    const concepts = {};
    submissions.forEach(sub => {
      const { concepts: subConcepts } = sub.aiMetrics || {};
      if (Array.isArray(subConcepts)) {
        subConcepts.forEach(c => {
          if (!concepts[c]) concepts[c] = { attemptCount: 0, successCount: 0 };
          concepts[c].attemptCount++;
          if (sub.status === "success" || sub.aiMetrics?.codeQualityScore >= 70) {
            concepts[c].successCount++;
          }
        });
      }
    });

    const strengths = [];
    const weaknesses = [];

    Object.keys(concepts).forEach(c => {
      const stats = concepts[c];
      const winRate = stats.successCount / stats.attemptCount;
      if (stats.attemptCount >= 2) {
        if (winRate > 0.6) strengths.push({ concept: c, winRate });
        else weaknesses.push({ concept: c, winRate });
      } else {
        if (winRate > 0.6) strengths.push({ concept: c, winRate });
      }
    });

    const codeQualityTrend = submissions.map(sub => ({
      date: sub.submittedAt,
      score: sub.aiMetrics?.codeQualityScore || 0
    })).filter(s => s.score > 0);

    const timeComplexityImprovements = submissions.map(sub => ({
      date: sub.submittedAt,
      timeComplexity: sub.aiMetrics?.timeComplexity || "N/A",
      spaceComplexity: sub.aiMetrics?.spaceComplexity || "N/A",
      score: sub.aiMetrics?.codeQualityScore || 0,
      language: sub.language
    }));

    res.json({
      strengths: strengths.sort((a,b) => b.winRate - a.winRate).slice(0, 5),
      weaknesses: weaknesses.sort((a,b) => a.winRate - b.winRate).slice(0, 5),
      codeQualityTrend,
      history: timeComplexityImprovements,
      totalSubmissions: submissions.length
    });
  } catch (err) {
    console.error("Analytics Error:", err);
    res.status(500).json({ error: "Failed to load analytics" });
  }
});

module.exports = router;
