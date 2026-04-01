const mongoose = require("mongoose");

const OtpVerificationSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otp: { type: String, required: true },
  otpExpires: { type: Date, required: true },
  role: { type: String, enum: ["candidate", "company"], default: "candidate" },
}, { timestamps: true });

OtpVerificationSchema.index({ otpExpires: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("OtpVerification", OtpVerificationSchema);
