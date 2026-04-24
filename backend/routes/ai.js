const express = require("express");
const router = express.Router();
const axios = require("axios");
const verifyToken = require("../middleware/auth");
const AIChatThread = require("../models/AIChatThread");

const stripCodeBlocks = (text = "") => {
  if (!text) return "";
  let cleaned = String(text);
  // Remove markdown code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "");
  // Remove inline code
  cleaned = cleaned.replace(/`[^`]+`/g, "");
  // Remove common code-like indentation patterns
  cleaned = cleaned.replace(/^\s{4,}.*$/gm, "");
  return cleaned.replace(/\n{3,}/g, "\n\n").trim();
};

const buildPrompt = ({ prompt, mode, context }) => {
  const safePrompt = String(prompt || "").trim();
  const safeContext = String(context || "").trim();

  const originalHintRules = `
You are a technical guide providing brief, structured assistance. 
- FORMAT: Provide a well-structured response of approximately 100 words.
- PERSONA: Act as a professional guide/mentor, not a teacher. Use a helpful but direct tone.
- CONTENT: Explain THEORETICAL concepts ONLY. NEVER provide code, pseudocode, or direct implementation steps.
- STRUCTURE: Use clear formatting (bullet points or numbered lists if helpful).
- SCOPE: Do not use previous context; answer ONLY the current question.
- GUARD: If code is requested, explain why you can't provide it and offer a conceptual alternative.
`;

  const companyLabRules = `
You are an Industry Guide—a highly experienced Senior Staff Engineer pair-programming with the user.
- PERSONA: You are a collaborative, knowledgeable industry guide. Your goal is to help the user successfully solve the problem by sharing how these systems are built in production at top tech companies.
- CONTENT: Actively guide the user toward the optimal solution. Explain the industry-standard architecture, the best algorithms to use, and the trade-offs (e.g., latency vs. memory).
- CODE REVIEW: Analyze their provided code. If they are stuck or have bugs, gently point out the logic errors and explain the correct approach. You may use pseudocode to illustrate structural concepts.
- GOAL: Help them solve the problem. Do not be a strict examiner; instead, be a helpful senior engineer guiding a junior engineer through a real-world task.
`;

  if (mode === "theory_only" || mode === "live_interview_hint") {
    return `${originalHintRules}\n\nUser Question: ${safePrompt}\n\nAssistant:`.trim();
  }

  if (mode === "company_lab_guide") {
    return `${companyLabRules}\n\nProblem Context (What the candidate is trying to solve):\n${safeContext}\n\nCandidate Question: ${safePrompt}\n\nMentor Response:`.trim();
  }

  if (mode === "hint") {
    return `You are a helpful assistant. Give a high-level conceptual hint only. No code.\nUser: ${safePrompt}`.trim();
  }

  if (safeContext) {
    return `Context:\n${safeContext}\n\nUser: ${safePrompt}`.trim();
  }

  return safePrompt;
};

const normalizeMessages = (messages = []) => {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((m) => m && (m.role === "user" || m.role === "ai"))
    .map((m) => ({
      role: m.role,
      content: String(m.content || "").slice(0, 4000),
      createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
    }))
    .slice(-50);
};

router.post("/ask-ai", async (req, res) => {
  try {
    const { prompt, mode, context } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const finalPrompt = buildPrompt({ prompt, mode, context });

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: finalPrompt }]
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      }
    );

    const aiText =
      response.data?.choices?.[0]?.message?.content ||
      "No response from Groq";

    const sanitized = mode === "live_interview_hint" ? stripCodeBlocks(aiText) : aiText;
    res.json({ result: sanitized || "I can provide hints and guidance without code. Ask about the approach or constraints." });
  } catch (err) {
    console.error("Error calling Groq:", err.response?.data || err.message);

    if (err.code === "ECONNABORTED") {
      return res
        .status(504)
        .json({ error: "Groq is taking too long, please try again." });
    }

    res.status(500).json({ error: "Groq request failed" });
  }
});

// AI chat threads (authenticated)
router.get("/threads", verifyToken, async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 20, 50));
    const threads = await AIChatThread.find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();
    res.json(threads);
  } catch (err) {
    console.error("Error fetching AI threads:", err);
    res.status(500).json({ error: "Failed to load threads" });
  }
});

router.post("/threads", verifyToken, async (req, res) => {
  try {
    const { title = "New chat", mode = "chat", messages = [] } = req.body || {};
    const thread = await AIChatThread.create({
      userId: req.userId,
      title: String(title || "New chat").slice(0, 80),
      mode: String(mode || "chat").slice(0, 40),
      messages: normalizeMessages(messages),
    });
    res.status(201).json(thread);
  } catch (err) {
    console.error("Error creating AI thread:", err);
    res.status(500).json({ error: "Failed to create thread" });
  }
});

router.get("/threads/:id", verifyToken, async (req, res) => {
  try {
    const thread = await AIChatThread.findOne({ _id: req.params.id, userId: req.userId }).lean();
    if (!thread) return res.status(404).json({ error: "Thread not found" });
    res.json(thread);
  } catch (err) {
    console.error("Error fetching AI thread:", err);
    res.status(500).json({ error: "Failed to load thread" });
  }
});

router.patch("/threads/:id", verifyToken, async (req, res) => {
  try {
    const { title, mode, messages } = req.body || {};
    const update = {};
    if (title != null) update.title = String(title || "New chat").slice(0, 80);
    if (mode != null) update.mode = String(mode || "chat").slice(0, 40);
    if (messages != null) update.messages = normalizeMessages(messages);

    const thread = await AIChatThread.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: update },
      { new: true }
    );
    if (!thread) return res.status(404).json({ error: "Thread not found" });
    res.json(thread);
  } catch (err) {
    console.error("Error updating AI thread:", err);
    res.status(500).json({ error: "Failed to update thread" });
  }
});

router.delete("/threads/:id", verifyToken, async (req, res) => {
  try {
    const result = await AIChatThread.deleteOne({ _id: req.params.id, userId: req.userId });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Thread not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting AI thread:", err);
    res.status(500).json({ error: "Failed to delete thread" });
  }
});

module.exports = router;
