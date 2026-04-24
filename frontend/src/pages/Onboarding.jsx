import React, { useState, useEffect, useContext } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../config";
import { AuthContext } from "../context/AuthContext";
import ReactBitsButton from "../components/ui/ReactBitsButton";

export default function Onboarding() {
  const { user, isLoaded: userLoaded } = useUser();
  const { getToken, isLoaded: authLoaded } = useAuth();
  const navigate = useNavigate();
  const { setRole } = useContext(AuthContext);

  const [role, setSelectedRole] = useState("candidate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If user is already synced and has role in localStorage, or if we just want them to quickly skip
    // We can auto-sync if we wanted, but let's let them pick a role explicitly first time.
  }, []);

  const handleSync = async (e) => {
    e.preventDefault();
    if (!authLoaded || !userLoaded || !user) return;

    setLoading(true);
    setError(null);
    try {
      const token = await getToken();

      // Derive the best display name from Clerk
      const clerkName =
        user.fullName ||
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.primaryEmailAddress?.emailAddress?.split("@")[0] ||
        "User";
      const clerkEmail = user.primaryEmailAddress?.emailAddress || "";

      await axios.post(
        `${BASE_URL}/sync`,
        {
          name: clerkName,
          email: clerkEmail,
          role: role,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // ✔ Persist identity to localStorage so all pages see the correct name/email
      localStorage.setItem("userName", clerkName);
      localStorage.setItem("userEmail", clerkEmail);
      localStorage.setItem("userRole", role);

      setRole(role);
      navigate("/dashboard");
    } catch (err) {
      console.error("Onboarding error:", err.response?.data || err.message);
      const serverMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      setError(`Failed to onboard: ${serverMsg}`);
      setLoading(false);
    }
  };


  if (!userLoaded) return <div className="app-page text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="app-page flex items-center justify-center p-4">
      <div className="app-card w-full max-w-md p-10">
        <h2 className="text-3xl font-semibold text-white mb-6 text-center">
          Welcome to <span className="text-cyan-300">Programming+</span>
        </h2>
        <p className="text-slate-400 text-center mb-6">
          Please select your role to personalize your experience.
        </p>

        {error && <p className="text-rose-400 text-center mb-4">{error}</p>}

        <form onSubmit={handleSync} className="space-y-6">
          <div className="flex flex-col gap-2 rounded-xl border border-slate-700/60 p-3 bg-slate-950/40">
            <p className="text-xs uppercase tracking-wide text-slate-400">I am a</p>
            <div className="flex gap-3 flex-wrap">
              {[
                { label: "Student / Candidate", value: "candidate" },
                { label: "Company / Recruiter", value: "company" },
              ].map((item) => (
                <label key={item.value} className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value={item.value}
                    checked={role === item.value}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="accent-cyan-400"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <ReactBitsButton
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
          >
            Continue
          </ReactBitsButton>
        </form>
      </div>
    </div>
  );
}
