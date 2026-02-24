import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { IoIosEye, IoIosEyeOff } from "react-icons/io";
import BASE_URL from "../../config";
import ReactBitsButton from "../ui/ReactBitsButton";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await axios.post(`${BASE_URL}/login`, form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userName", res.data.name);
      localStorage.setItem("userEmail", res.data.email);
      navigate("/dashboard");
    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900">
      <div className="bg-gray-800/90 backdrop-blur-sm p-10 rounded-3xl shadow-2xl w-full max-w-md border border-gray-700/50 relative z-10">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          Welcome back to <span className="text-indigo-400">Programming+</span>
        </h2>

        {message && <p className="text-red-400 text-center mb-4">{message}</p>}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full p-3 rounded-xl bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 transition"
          />

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
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

          <ReactBitsButton
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
          >
            Login
          </ReactBitsButton>
        </form>

        <p className="mt-4 text-center text-gray-400">
          Don't have an account?{" "}
          <Link to="/register" className="text-indigo-400 hover:text-purple-400 font-semibold">
            Register
          </Link>
        </p>
        <p className="mt-2 text-center text-gray-400">
          <Link to="/forgot-password" className="text-indigo-400 hover:text-purple-400 font-semibold">
            Forgot Password?
          </Link>
        </p>
      </div>
    </div>
  );
}
