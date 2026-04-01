import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { IoIosEye, IoIosEyeOff } from "react-icons/io";
import { AuthContext } from "../../context/AuthContext";
import BASE_URL from "../../config";
import ReactBitsButton from "../ui/ReactBitsButton";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { setToken, setRole } = React.useContext(AuthContext);

  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await axios.post(`${BASE_URL}/login`, form);
      const { token, name, email, role } = res.data;
      
      localStorage.setItem("token", token);
      localStorage.setItem("userName", name);
      localStorage.setItem("userEmail", email);
      localStorage.setItem("userRole", role || "candidate");
      
      setToken(token);
      setRole(role || "candidate");
      
      navigate("/dashboard");
    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page flex items-center justify-center p-4">
      <div className="app-card w-full max-w-md p-10">
        <h2 className="text-3xl font-semibold text-white mb-6 text-center">
          Welcome back to <span className="text-cyan-300">Programming+</span>
        </h2>

        {message && <p className="text-rose-400 text-center mb-4">{message}</p>}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="app-input"
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

          <ReactBitsButton
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
          >
            Login
          </ReactBitsButton>
        </form>

        <p className="mt-4 text-center text-slate-400">
          Don't have an account?{" "}
          <Link to="/register" className="text-cyan-300 hover:text-cyan-200 font-semibold">
            Register
          </Link>
        </p>
        <p className="mt-2 text-center text-slate-400">
          <Link to="/forgot-password" className="text-cyan-300 hover:text-cyan-200 font-semibold">
            Forgot Password?
          </Link>
        </p>
      </div>
    </div>
  );
}
