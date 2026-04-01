const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  otp: { type: String }, 
  otpExpires: { type: Date },
  clerkId: { type: String, unique: true, sparse: true },

  role: {
    type: String,
    enum: ["candidate", "company"],
    default: "candidate",
    index: true
  },
  
  // Programming+ specific fields
  solvedQuestions: [
  {
    questionId: Number, // match Submission schema
    status: { type: String, enum: ["solved", "attempted"], default: "solved" },
    timeTaken: Number, 
    submittedAt: { type: Date, default: Date.now }
  }
]
});

module.exports = mongoose.model("User", userSchema);
