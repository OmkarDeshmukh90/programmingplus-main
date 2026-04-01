const mongoose = require("mongoose");

const aiChatMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "ai"], required: true },
    content: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const aiChatThreadSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "New chat" },
    mode: { type: String, default: "chat" },
    messages: { type: [aiChatMessageSchema], default: [] },
  },
  { timestamps: true }
);

aiChatThreadSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model("AIChatThread", aiChatThreadSchema);
