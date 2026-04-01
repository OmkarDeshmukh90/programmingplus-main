const mongoose = require("mongoose");

const replySchema = new mongoose.Schema({
  text: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }
});

const discussSchema = new mongoose.Schema({
  text: { type: String, required: true },
  category: { type: String, default: "General" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  replies: [replySchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Discuss", discussSchema);
