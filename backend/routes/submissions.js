const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const verifyToken = require("../middleware/auth");
const Submission = require("../models/Submission");
const User = require("../models/User");

const router = express.Router();

const evaluateSubmissionInBackground = async (submissionId, code, language) => {
  try {
    const prompt = `
Analyze this ${language} code submission. Return a strict JSON response. Do NOT wrap in markdown \`\`\` blocks. Just raw JSON.
Format required:
{
  "timeComplexity": "O(N)",
  "spaceComplexity": "O(1)",
  "codeQualityScore": 85,
  "concepts": ["Arrays", "Loops"],
  "feedback": "Good attempt, try optimizing the inner loop."
}

Code:
${code}
    `.trim();

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      { 
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      },
      { 
        headers: { 
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json" 
        }, 
        timeout: 30000 
      }
    );

    let aiText = response.data?.choices?.[0]?.message?.content || "";
    aiText = aiText.replace(/```json/i, "").replace(/```/g, "").trim();

    if (aiText) {
      const metrics = JSON.parse(aiText);
      await Submission.findByIdAndUpdate(submissionId, { aiMetrics: metrics });
    }
  } catch (err) {
    console.error("Background AI Evaluation failed for submission:", submissionId, err.message);
  }
};

const updateSolvedQuestions = async ({ userId, questionId, timeTaken, status }) => {
  const user = await User.findById(userId);
  if (!user) return;

  const alreadySolved = user.solvedQuestions.some(
    (q) => Number(q.questionId) === Number(questionId) && q.status === "solved"
  );

  if (status === "success") {
    await User.findByIdAndUpdate(userId, {
      $pull: { solvedQuestions: { questionId: Number(questionId) } },
    });
    await User.findByIdAndUpdate(userId, {
      $push: {
        solvedQuestions: {
          questionId: Number(questionId),
          status: "solved",
          timeTaken,
          submittedAt: new Date(),
        },
      },
    });
    return;
  }

  if (!alreadySolved) {
    await User.findByIdAndUpdate(userId, {
      $pull: { solvedQuestions: { questionId: Number(questionId) } },
    });
    await User.findByIdAndUpdate(userId, {
      $push: {
        solvedQuestions: {
          questionId: Number(questionId),
          status: "attempted",
          timeTaken,
          submittedAt: new Date(),
        },
      },
    });
  }
};

router.post("/", verifyToken, async (req, res) => {
  try {
    let { questionId, code, language, timeTaken, status, thoughtProcess } = req.body;
    questionId = Number(questionId);

    const newSubmission = await Submission.create({
      userId: req.userId,
      questionId,
      code,
      language,
      timeTaken,
      status,
      thoughtProcess,
    });

    await updateSolvedQuestions({ userId: req.userId, questionId, timeTaken, status });

    // Fire and forget background evaluation
    if (code) {
      evaluateSubmissionInBackground(newSubmission._id, code, language);
    }

    return res.status(201).json(newSubmission);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/me/all", verifyToken, async (req, res) => {
  try {
    const submissions = await Submission.find({ userId: req.userId }).sort({ submittedAt: -1 });
    return res.json(submissions);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/:questionId", verifyToken, async (req, res) => {
  try {
    const questionId = Number(req.params.questionId);
    const submissions = await Submission.find({ userId: req.userId, questionId }).sort({ submittedAt: -1 });
    return res.json(submissions);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/entry/:submissionId", verifyToken, async (req, res) => {
  try {
    const { submissionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({ message: "Invalid submission id" });
    }

    const allowed = ["code", "language", "status", "timeTaken", "thoughtProcess"];
    const updateDoc = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updateDoc[key] = req.body[key];
      }
    }

    const updated = await Submission.findOneAndUpdate(
      { _id: submissionId, userId: req.userId },
      { $set: updateDoc },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Submission not found" });
    }

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/entry/:submissionId", verifyToken, async (req, res) => {
  try {
    const { submissionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({ message: "Invalid submission id" });
    }

    const removed = await Submission.findOneAndDelete({ _id: submissionId, userId: req.userId });
    if (!removed) {
      return res.status(404).json({ message: "Submission not found" });
    }

    return res.json({ message: "Submission deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
