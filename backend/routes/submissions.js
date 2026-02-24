const express = require("express");
const mongoose = require("mongoose");
const verifyToken = require("../middleware/auth");
const Submission = require("../models/Submission");
const User = require("../models/User");

const router = express.Router();

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
    let { questionId, code, language, timeTaken, status } = req.body;
    questionId = Number(questionId);

    const newSubmission = await Submission.create({
      userId: req.userId,
      questionId,
      code,
      language,
      timeTaken,
      status,
    });

    await updateSolvedQuestions({ userId: req.userId, questionId, timeTaken, status });

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

    const allowed = ["code", "language", "status", "timeTaken"];
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
