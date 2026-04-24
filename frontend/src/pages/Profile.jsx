import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useAuth } from "@clerk/clerk-react";
import {
  User, Mail, Shield, CheckCircle2, Bell, Eye,
  LogOut, Pencil, Check, X, Loader2, Save,
} from "lucide-react";
import axios from "axios";
import BASE_URL from "../config";

export default function Profile() {
  const navigate = useNavigate();
  const { setToken, setRole, userName, userEmail, user, role, setDisplayName, token } =
    useContext(AuthContext);
  const { signOut } = useAuth();

  const displayRole = role || localStorage.getItem("userRole") || "candidate";
  const profileImageUrl = user?.imageUrl || null;

  // ── Edit name state ───────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Notification toggles (real state, persisted to localStorage) ──────────
  const [notifEnabled, setNotifEnabled] = useState(
    () => localStorage.getItem("pref_notif") !== "false"
  );
  const [visibilityEnabled, setVisibilityEnabled] = useState(
    () => localStorage.getItem("pref_visibility") === "true"
  );

  const handleToggleNotif = () => {
    const next = !notifEnabled;
    setNotifEnabled(next);
    localStorage.setItem("pref_notif", String(next));
  };

  const handleToggleVisibility = () => {
    const next = !visibilityEnabled;
    setVisibilityEnabled(next);
    localStorage.setItem("pref_visibility", String(next));
  };

  // ── Name editing ──────────────────────────────────────────────────────────
  const startEdit = () => {
    setNameInput(userName);
    setSaveError("");
    setSaveSuccess(false);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setSaveError("");
  };

  const saveName = async () => {
    if (!nameInput.trim()) {
      setSaveError("Name cannot be empty.");
      return;
    }
    if (nameInput.trim() === userName) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setSaveError("");
    try {
      await axios.patch(
        `${BASE_URL}/profile`,
        { name: nameInput.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ Propagate instantly to all components via AuthContext
      setDisplayName(nameInput.trim());
      setSaveSuccess(true);
      setEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(
        err.response?.data?.message || "Could not save. Try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") saveName();
    if (e.key === "Escape") cancelEdit();
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("customDisplayName");

    setToken(null);
    setRole("candidate");

    await signOut();
    navigate("/");
  };

  const getInitial = (name) => (name || "L").charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      {/* ── Header Banner ── */}
      <div className="app-card p-8 bg-gradient-to-br from-[#0a0a0a] via-[#0f172a] to-cyan-950/40 border border-cyan-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-cyan-500/10 border-2 border-cyan-500/30 flex items-center justify-center text-4xl font-bold text-cyan-400 flex-shrink-0 shadow-[0_0_30px_rgba(6,182,212,0.15)] overflow-hidden">
            {profileImageUrl ? (
              <img src={profileImageUrl} alt={userName} className="w-full h-full object-cover" />
            ) : (
              getInitial(userName)
            )}
          </div>

          {/* Name + edit */}
          <div className="text-center md:text-left flex-1">
            {editing ? (
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-2xl font-bold bg-white/5 border border-cyan-500/40 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400 w-64"
                  placeholder="Your display name"
                />
                <button
                  onClick={saveName}
                  disabled={saving}
                  className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                </button>
                <button
                  onClick={cancelEdit}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <h1 className="text-3xl font-bold text-white tracking-tight">{userName}</h1>
                <button
                  onClick={startEdit}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
                  title="Edit display name"
                >
                  <Pencil size={15} />
                </button>
              </div>
            )}

            {saveError && (
              <p className="text-rose-400 text-sm mt-2">{saveError}</p>
            )}
            {saveSuccess && (
              <p className="text-emerald-400 text-sm mt-2 flex items-center gap-1.5">
                <Check size={14} /> Name updated everywhere!
              </p>
            )}

            <p className="text-slate-400 text-lg mt-2">
              Manage your account details and preferences.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Personal Info ── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="app-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Personal Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="app-panel p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 flex-shrink-0 mt-0.5">
                  <User size={20} className="stroke-[1.5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                    Display Name
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-base text-white font-medium truncate">{userName}</div>
                    <button
                      onClick={startEdit}
                      className="text-slate-500 hover:text-cyan-400 transition-colors flex-shrink-0"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="app-panel p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 flex-shrink-0 mt-0.5">
                  <Mail size={20} className="stroke-[1.5]" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                    Email Address
                  </div>
                  <div className="text-base text-white font-medium">{userEmail || "Not set"}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">Managed by sign-in provider</div>
                </div>
              </div>

              {/* Role */}
              <div className="app-panel p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
                  <Shield size={20} className="stroke-[1.5]" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                    Account Role
                  </div>
                  <div className="text-base text-white font-medium capitalize">
                    {displayRole === "company" ? "Company / Recruiter" : "Student / Candidate"}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="app-panel p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                  <CheckCircle2 size={20} className="stroke-[1.5]" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                    Account Status
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-base text-white font-medium">Active & Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Preferences (now functional) ── */}
          <div className="app-card p-6">
            <h2 className="text-xl font-bold text-white mb-6">Preferences</h2>
            <div className="space-y-3">
              {/* Email Notifications */}
              <div
                className="app-panel p-4 flex items-center justify-between cursor-pointer hover:border-cyan-500/20 transition-all"
                onClick={handleToggleNotif}
              >
                <div className="flex items-center gap-3">
                  <Bell size={18} className={notifEnabled ? "text-cyan-400" : "text-slate-400"} />
                  <div>
                    <div className="text-sm text-white font-medium">Email Notifications</div>
                    <div className="text-xs text-slate-500">
                      Receive alerts for new contests and interview invites
                    </div>
                  </div>
                </div>
                <div
                  className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${
                    notifEnabled ? "bg-cyan-500" : "bg-white/10 border border-white/10"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-300 ${
                      notifEnabled ? "right-1" : "left-1"
                    }`}
                  />
                </div>
              </div>

              {/* Profile Visibility */}
              <div
                className="app-panel p-4 flex items-center justify-between cursor-pointer hover:border-indigo-500/20 transition-all"
                onClick={handleToggleVisibility}
              >
                <div className="flex items-center gap-3">
                  <Eye size={18} className={visibilityEnabled ? "text-indigo-400" : "text-slate-400"} />
                  <div>
                    <div className="text-sm text-white font-medium">Profile Visibility</div>
                    <div className="text-xs text-slate-500">
                      Allow companies to find your profile during talent search
                    </div>
                  </div>
                </div>
                <div
                  className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${
                    visibilityEnabled ? "bg-indigo-500" : "bg-white/10 border border-white/10"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-300 ${
                      visibilityEnabled ? "right-1" : "left-1"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Actions ── */}
        <div className="space-y-6">
          {/* Save Name Card (shown when editing) */}
          {editing && (
            <div className="app-card p-6 border border-cyan-500/20">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Save size={16} className="text-cyan-400" /> Save Changes
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Your updated display name will be reflected immediately across the entire platform.
              </p>
              <button
                onClick={saveName}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 text-sm font-bold tracking-wide transition-all disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Check size={18} />
                )}
                {saving ? "Saving..." : "Confirm Name Change"}
              </button>
              <button
                onClick={cancelEdit}
                className="w-full mt-2 flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-slate-500 hover:text-slate-300 text-sm transition-all"
              >
                <X size={16} /> Cancel
              </button>
            </div>
          )}

          {/* Account Actions */}
          <div className="app-card p-6">
            <h2 className="text-lg font-bold text-white mb-4">Account Actions</h2>

            <button
              onClick={startEdit}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 text-sm font-bold tracking-wide transition-all group mb-3"
            >
              <Pencil size={16} className="stroke-[2]" /> Edit Display Name
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 text-sm font-bold tracking-wide transition-all group"
            >
              <LogOut size={18} className="stroke-[2] group-hover:-translate-x-1 transition-transform" />
              Sign Out
            </button>
          </div>

          {/* Info card */}
          <div className="app-card p-5 border border-white/5">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              <span className="text-slate-400 font-semibold block mb-1">About your profile</span>
              Your email address is managed by your sign-in provider (Google / email). 
              Only your display name can be changed here. Changes apply immediately across 
              all pages including the Dashboard, Contests, and Interview rooms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
