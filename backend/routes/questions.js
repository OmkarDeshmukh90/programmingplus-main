const express = require("express");
const verifyToken = require("../middleware/auth");
const questionsData = require("../data/questions.json");

const router = express.Router();

// Get all questions
router.get("/", verifyToken, (req, res) => {
  res.json(questionsData);
});

// Get question by ID
router.get("/:id", verifyToken, (req, res) => {
  const question = questionsData.find(q => q.id == req.params.id); // ✅ parseInt
  if (!question) return res.status(404).json({ message: "Question not found" });
  res.json(question);
});

module.exports = router;
