const express = require("express");
const router = express.Router();
const Discuss = require("../models/Discuss");
const verifyToken = require("../middleware/auth");

// ✅ Create a new post
router.post("/", verifyToken, async (req, res) => {
  try {
    const newPost = new Discuss({
      text: req.body.text,
      category: req.body.category || "General",
      user: req.userId
    });

    const savedPost = await newPost.save();
    await savedPost.populate("user", "name email");
    res.json(savedPost);
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get all posts
router.get("/", verifyToken, async (req, res) => {
  try {
    const posts = await Discuss.find()
      .populate("user", "name email")
      .populate("replies.user", "name email") // also populate replies
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Edit a post
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const post = await Discuss.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.user.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    post.text = req.body.text;
    if (req.body.category) {
      post.category = req.body.category;
    }
    await post.save();
    await post.populate("user", "name email");
    res.json(post);
  } catch (err) {
    console.error("Error updating post:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Delete a post
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const post = await Discuss.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.user.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Add a reply
router.post("/:id/replies", verifyToken, async (req, res) => {
  try {
    const post = await Discuss.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const reply = { text: req.body.text, user: req.userId };
    post.replies.push(reply);
    await post.save();
    await post.populate("user", "name email");
    await post.populate("replies.user", "name email");

    res.json(post);
  } catch (err) {
    console.error("Error adding reply:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
