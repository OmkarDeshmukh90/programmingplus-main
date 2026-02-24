import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { IoIosEye, IoIosEyeOff } from "react-icons/io";
import BASE_URL from "../../config";
import ReactBitsButton from "../ui/ReactBitsButton";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // Step 1: send OTP, Step 2: verify OTP
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Step 1: send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await axios.post(`${BASE_URL}/register/send-otp`, form);
      setStep(2);
      setLoading(false);
      setMessage("OTP sent to your email!");
    } catch (err) {
      setLoading(false);
      setMessage(err.response?.data?.message || "Failed to send OTP");
    }
  };

  // Step 2: verify OTP
  const handleVerifyOtp = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await axios.post(`${BASE_URL}/register/verify-otp`, {
        email: form.email,
        otp,
        name: form.name, // send name to backend
      });
      setLoading(false);
      if (res.data.success || res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userName", res.data.name);
        localStorage.setItem("userEmail", res.data.email);
        navigate("/dashboard");
      }
    } catch (err) {
      setLoading(false);
      setMessage(err.response?.data?.message || "Invalid OTP");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900">
      <div className="bg-gray-800/90 backdrop-blur-sm p-10 rounded-3xl shadow-2xl w-full max-w-md border border-gray-700/50 relative z-10">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          Register to <span className="text-indigo-400">Programming+</span>
        </h2>

        {message && <p className="text-green-400 text-center mb-4">{message}</p>}

        <form
          onSubmit={step === 1 ? handleSendOtp : (e) => e.preventDefault()}
          className="space-y-4"
        >
          {/* Name */}
          {step === 1 && (
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-xl bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 transition"
            />
          )}

          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            disabled={step === 2}
            className="w-full p-3 rounded-xl bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 transition"
          />

          {/* Password */}
          {step === 1 && (
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                disabled={step === 2}
                className="w-full p-3 rounded-xl bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300"
              >
                {showPassword ? <IoIosEye size={24} /> : <IoIosEyeOff size={24} />}
              </button>
            </div>
          )}

          {/* OTP */}
          {step === 2 && (
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="flex-1 p-3 rounded-xl bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 transition"
              />
              <ReactBitsButton
                type="button"
                onClick={handleVerifyOtp}
                disabled={!otp}
                variant="success"
                loading={loading}
                className="px-4"
              >
                Verify OTP
              </ReactBitsButton>
            </div>
          )}

          {/* Primary button */}
          {step === 1 && (
            <ReactBitsButton
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
            >
              Register
            </ReactBitsButton>
          )}
        </form>

        <p className="mt-4 text-center text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-400 hover:text-purple-400 font-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
