import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../../config";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // Step 1: send OTP, Step 2: verify OTP, Step 3: reset password
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSendOtp = async () => {
    setLoading(true);
    setMessage("");
    try {
      await axios.post(`${BASE_URL}/forgot-password`, { email });
      setStep(2);
      setLoading(false);
      setMessage("OTP sent to your email!");
    } catch (err) {
      setLoading(false);
      setMessage(err.response?.data?.message || "Failed to send OTP");
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setMessage("");
    try {
      await axios.post(`${BASE_URL}/forgot-password/verify-otp`, { email, otp });
      setStep(3);
      setLoading(false);
      setMessage("OTP verified! Enter new password.");
    } catch (err) {
      setLoading(false);
      setMessage(err.response?.data?.message || "Invalid OTP");
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    setMessage("");
    try {
      await axios.post(`${BASE_URL}/reset-password`, { email, newPassword });
      setLoading(false);
      setMessage("Password reset successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setLoading(false);
      setMessage(err.response?.data?.message || "Failed to reset password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900">
      <div className="bg-gray-800/90 backdrop-blur-sm p-10 rounded-3xl shadow-2xl w-full max-w-md border border-gray-700/50 relative z-10">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          Forgot Password
        </h2>

        {message && <p className="text-green-400 text-center mb-4">{message}</p>}

        {step === 1 && (
          <>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 transition mb-4"
            />
            <button
              onClick={handleSendOtp}
              disabled={loading || !email}
              className="w-full py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 transition mb-4"
            />
            <button
              onClick={handleVerifyOtp}
              disabled={loading || !otp}
              className="w-full py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 transition mb-4"
            />
            <button
              onClick={handleResetPassword}
              disabled={loading || !newPassword}
              className="w-full py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
