import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { IoIosEye, IoIosEyeOff } from "react-icons/io";
import { AuthContext } from "../../context/AuthContext";
import BASE_URL from "../../config";
import ReactBitsButton from "../ui/ReactBitsButton";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "candidate" });
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // Step 1: send OTP, Step 2: verify OTP
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { setToken, setRole } = React.useContext(AuthContext);

  const navigate = useNavigate();

  useEffect(() => {
    const presetRole = searchParams.get("role");
    if (presetRole === "company") {
      setForm((prev) => ({ ...prev, role: "company" }));
    }
  }, [searchParams]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Step 1: send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);
    try {
      await axios.post(`${BASE_URL}/register/send-otp`, form);
      setStep(2);
      setLoading(false);
      setMessage("OTP sent to your email!");
    } catch (err) {
      setLoading(false);
      setIsError(true);
      if (err.response?.data?.message) {
        setMessage(err.response.data.message);
      } else if (err.request) {
        setMessage(`Network error: unable to reach server at ${BASE_URL}`);
      } else {
        setMessage(err.message || "Failed to send OTP");
      }
    }
  };

  // Step 2: verify OTP
  const handleVerifyOtp = async () => {
    setLoading(true);
    setMessage("");
    setIsError(false);
    try {
      const res = await axios.post(`${BASE_URL}/register/verify-otp`, {
        email: form.email,
        otp,
        name: form.name,
        role: form.role,
      });
      setLoading(false);
      if (res.data.success || res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userName", res.data.name);
        localStorage.setItem("userEmail", res.data.email);
        localStorage.setItem("userRole", res.data.role || form.role);
        
        setToken(res.data.token);
        setRole(res.data.role || form.role);
        
        navigate("/dashboard");
      }
    } catch (err) {
      setLoading(false);
      setIsError(true);
      setMessage(err.response?.data?.message || "Invalid OTP");
    }
  };

  return (
    <div className="app-page flex items-center justify-center p-4">
      <div className="app-card w-full max-w-md p-10">
        <h2 className="text-3xl font-semibold text-white mb-6 text-center">
          Register to <span className="text-cyan-300">Programming+</span>
        </h2>

        {message && (
          <p className={`${isError ? "text-rose-400" : "text-green-400"} text-center mb-4`}>
            {message}
          </p>
        )}

        <form
          onSubmit={step === 1 ? handleSendOtp : (e) => e.preventDefault()}
          className="space-y-4"
        >
          {step === 1 && (
            <div className="flex flex-col gap-2 rounded-xl border border-slate-700/60 p-3 bg-slate-950/40">
              <p className="text-xs uppercase tracking-wide text-slate-400">I am a</p>
              <div className="flex gap-3 flex-wrap">
                {[
                  { label: "Student / Candidate", value: "candidate" },
                  { label: "Company / Recruiter", value: "company" },
                ].map((item) => (
                  <label key={item.value} className="flex items-center gap-2 text-sm text-slate-200">
                    <input
                      type="radio"
                      name="role"
                      value={item.value}
                      checked={form.role === item.value}
                      onChange={handleChange}
                      className="accent-cyan-400"
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>
          )}
          {/* Name */}
          {step === 1 && (
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              required
              className="app-input"
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
            className="app-input"
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
                className="app-input"
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
                className="app-input flex-1"
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

        <p className="mt-4 text-center text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="text-cyan-300 hover:text-cyan-200 font-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
