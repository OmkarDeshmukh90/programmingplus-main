import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../../config";
import ReactBitsButton from "../ui/ReactBitsButton";

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
    <div className="app-page flex items-center justify-center p-4">
      <div className="app-card w-full max-w-md p-10">
        <h2 className="text-3xl font-semibold text-white mb-6 text-center">
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
              className="app-input mb-4"
            />
            <ReactBitsButton
              onClick={handleSendOtp}
              disabled={loading || !email}
              loading={loading}
              fullWidth
            >
              Send OTP
            </ReactBitsButton>
          </>
        )}

        {step === 2 && (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="app-input mb-4"
            />
            <ReactBitsButton
              onClick={handleVerifyOtp}
              disabled={loading || !otp}
              loading={loading}
              variant="success"
              fullWidth
            >
              Verify OTP
            </ReactBitsButton>
          </>
        )}

        {step === 3 && (
          <>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="app-input mb-4"
            />
            <ReactBitsButton
              onClick={handleResetPassword}
              disabled={loading || !newPassword}
              loading={loading}
              fullWidth
            >
              Reset Password
            </ReactBitsButton>
          </>
        )}
      </div>
    </div>
  );
}
