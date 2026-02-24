const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/ask-ai", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": process.env.GEMINI_API_KEY, // ✅ use header not query param
        },
        timeout: 60000,
      }
    );

    const aiText =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from Gemini";

    res.json({ result: aiText });
  } catch (err) {
    console.error("Error calling Gemini:", err.response?.data || err.message);

    if (err.code === "ECONNABORTED") {
      return res
        .status(504)
        .json({ error: "Gemini is taking too long, please try again." });
    }

    res.status(500).json({ error: "Gemini request failed" });
  }
});

module.exports = router;
