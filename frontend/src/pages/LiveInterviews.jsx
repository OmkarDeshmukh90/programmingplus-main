/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useMemo } from "react";
import {
  createInterview,
  listInterviews,
  deleteInterview,
  updateInterview,
  evaluateInterview,
  listMyInterviews,
} from "../api/interviews";
import { getMyLiveInterviews } from "../api/contests";

/* ── SVG Icons ─────────────────────────────────────────────────── */
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
);
const ClipboardIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
);
const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
);
const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
);
const ArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
);

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "create",    label: "Create Interview", icon: "✨" },
  { id: "upcoming",  label: "Upcoming", icon: "📅" },
  { id: "past",      label: "Past", icon: "📋" },
  { id: "library",   label: "Problem Library", icon: "📚" },
];

const INTERVIEW_TYPES = ["DSA", "SystemDesign", "Frontend", "Backend", "FullStack", "General"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const LANGUAGES = ["javascript", "python", "java", "cpp", "go", "typescript"];
const VERDICTS = ["Pass", "Fail", "NextRound"];

const PROBLEM_CATEGORIES = [
  { name: "Arrays & Strings", icon: "📦", count: 45, color: "from-blue-500/20 to-indigo-500/20" },
  { name: "Linked Lists", icon: "🔗", count: 20, color: "from-cyan-500/20 to-blue-500/20" },
  { name: "Trees & Graphs", icon: "🌳", count: 35, color: "from-emerald-500/20 to-teal-500/20" },
  { name: "Dynamic Programming", icon: "🧩", count: 30, color: "from-purple-500/20 to-pink-500/20" },
  { name: "System Design", icon: "🏗️", count: 15, color: "from-amber-500/20 to-orange-500/20" },
  { name: "Frontend", icon: "🎨", count: 12, color: "from-rose-500/20 to-pink-500/20" },
  { name: "SQL & Databases", icon: "🗄️", count: 18, color: "from-indigo-500/20 to-purple-500/20" },
  { name: "Sorting & Searching", icon: "🔍", count: 22, color: "from-slate-500/20 to-blue-500/20" },
];

const statusColors = {
  draft: "bg-slate-500/15 text-slate-300 border-slate-500/20",
  scheduled: "bg-indigo-500/15 text-indigo-300 border-indigo-500/20",
  in_progress: "bg-amber-500/15 text-amber-300 border-amber-500/20 animate-pulse",
  completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/20",
};

const difficultyColors = {
  Easy: "text-emerald-400",
  Medium: "text-amber-400",
  Hard: "text-red-400",
};

/* ── Reusable form components (outside main component to avoid focus loss) ── */
const FormInput = ({ label, value, onChange, placeholder, type = "text" }) => (
  <div>
    <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 placeholder:text-slate-600 transition-shadow"
    />
  </div>
);

const FormSelect = ({ label, value, onChange, options }) => (
  <div>
    <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-shadow"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

const StatCard = ({ label, value, icon, color }) => (
  <div className="flex items-center gap-4 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-xl`}>{icon}</div>
    <div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════ */
const LiveInterviews = () => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole") || "candidate";
  const isCompany = userRole === "company";
  const [tab, setTab] = useState("dashboard");
  const [interviews, setInterviews] = useState([]);
  const [myInterviews, setMyInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [evalModal, setEvalModal] = useState(null);
  const [evalForm, setEvalForm] = useState({ coding: 3, problemSolving: 3, communication: 3, systemDesign: 3, verdict: "Pass", notes: "" });

  /* ── Create form state ───────────────────────────────────────── */
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: "",
    type: "DSA",
    duration: 60,
    language: "javascript",
    difficulty: "Medium",
    candidateName: "",
    candidateEmail: "",
    candidatePhone: "",
    interviewerName: "",
    interviewerEmail: "",
    interviewerRole: "Tech Interviewer",
    date: "",
    startTime: "",
    timezone: "IST",
  });

  /* ── Load interviews ─────────────────────────────────────────── */
  useEffect(() => {
    if (!token) return;
    if (isCompany) {
      loadInterviews();
    } else {
      loadMyInterviews();
    }
  }, [token]);

  const loadInterviews = async () => {
    setLoading(true);
    try {
      const [standaloneRes, liveRes] = await Promise.all([
        listInterviews(token),
        getMyLiveInterviews(token)
      ]);
      
      const standaloneInterviews = standaloneRes.data || [];
      const liveSessions = (liveRes.data || []).map(s => ({
        ...s,
        title: s.taskTitle || s.contestId?.title || "Live Session",
        type: "Live Session",
        difficulty: "Medium",
        duration: s.durationMinutes,
        schedule: {
          date: new Date(s.scheduledStartTime).toISOString().split('T')[0],
          startTime: new Date(s.scheduledStartTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
          timezone: "IST"
        },
        candidate: {
          name: s.candidateUserId?.name || s.invitedCandidateEmail || "Candidate",
          email: s.invitedCandidateEmail
        },
        interviewer: {
          name: s.interviewerName,
          role: s.interviewerTitle
        },
        candidateLink: `/interview/room/${s._id}?role=candidate`,
        interviewerLink: `/interview/room/${s._id}?role=interviewer`,
        isLiveSession: true
      }));

      setInterviews([...standaloneInterviews, ...liveSessions]);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const loadMyInterviews = async () => {
    setLoading(true);
    try {
      const [standaloneRes, liveRes] = await Promise.all([
        listMyInterviews(token),
        getMyLiveInterviews(token) // This endpoint already filters by candidateUserId on backend
      ]);

      const standalone = (standaloneRes.data || []).map(i => ({ ...i, isLiveSession: false }));
      const live = (liveRes.data || []).map(s => ({
        ...s,
        title: s.taskTitle || s.contestId?.title || "Live Session",
        type: "Live Session",
        difficulty: "Medium",
        duration: s.durationMinutes,
        schedule: {
          date: s.scheduledStartTime ? new Date(s.scheduledStartTime).toISOString().split('T')[0] : "TBD",
          startTime: s.scheduledStartTime ? new Date(s.scheduledStartTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : "TBD",
          timezone: "IST"
        },
        isLiveSession: true,
        candidateLink: `/interview/room/${s._id}?role=candidate`,
        link: `/interview/room/${s._id}`
      }));

      setMyInterviews([...standalone, ...live]);
    } catch (err) {
      console.error("Failed to load my interviews:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Derived lists ───────────────────────────────────────────── */
  const upcoming = useMemo(() => interviews.filter((i) => i.status === "scheduled" || i.status === "in_progress"), [interviews]);
  const past = useMemo(() => interviews.filter((i) => i.status === "completed" || i.status === "cancelled"), [interviews]);

  /* ── Helpers ─────────────────────────────────────────────────── */
  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleCreate = async () => {
    try {
      await createInterview(
        {
          title: form.title || "Untitled Interview",
          type: form.type,
          duration: Number(form.duration),
          language: form.language,
          difficulty: form.difficulty,
          candidate: { name: form.candidateName, email: form.candidateEmail, phone: form.candidatePhone },
          interviewer: { name: form.interviewerName, email: form.interviewerEmail, role: form.interviewerRole },
          schedule: { date: form.date, startTime: form.startTime, duration: Number(form.duration), timezone: form.timezone },
        },
        token
      );
      setForm({ title: "", type: "DSA", duration: 60, language: "javascript", difficulty: "Medium", candidateName: "", candidateEmail: "", candidatePhone: "", interviewerName: "", interviewerEmail: "", interviewerRole: "Tech Interviewer", date: "", startTime: "", timezone: "IST" });
      setStep(1);
      setTab("upcoming");
      loadInterviews();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteInterview(id, token);
      setInterviews((prev) => prev.filter((i) => i._id !== id));
    } catch { /* ignore */ }
  };

  const handleEvaluate = async () => {
    if (!evalModal) return;
    try {
      await evaluateInterview(evalModal, evalForm, token);
      setEvalModal(null);
      loadInterviews();
    } catch { /* ignore */ }
  };

  const copyLink = (link) => {
    navigator.clipboard.writeText(window.location.origin + link).catch(() => {});
  };

  /* Input, Select, StatCard are defined outside the component to avoid focus loss */

  /* ── Interview Row ───────────────────────────────────────────── */
  const InterviewRow = ({ interview: iv, showActions = true }) => {
    const isExpanded = expandedId === iv._id;
    return (
      <div className="border border-white/[0.06] rounded-2xl bg-white/[0.02] overflow-hidden transition-all duration-200">
        <div
          className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-white/[0.02] transition-colors"
          onClick={() => setExpandedId(isExpanded ? null : iv._id)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
              <span className="text-sm font-bold text-white truncate max-w-[150px] sm:max-w-none">{iv.title}</span>
              <span className={`px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] font-bold uppercase tracking-tight border flex items-center gap-1 ${statusColors[iv.status] || statusColors.draft}`}>
                {iv.status === "in_progress" && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                {iv.status?.replace("_", " ")}
              </span>
              <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-tight ${difficultyColors[iv.difficulty] || "text-slate-400"}`}>{iv.difficulty}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-xs text-slate-500 font-medium">
              {iv.candidate?.name && <span className="flex items-center gap-1">👤 <span className="text-slate-400">{iv.candidate.name}</span></span>}
              {iv.schedule?.date && <span className="flex items-center gap-1">📅 <span className="text-slate-400">{iv.schedule.date}</span></span>}
              <span className="flex items-center gap-1">⏱ <span className="text-slate-400">{iv.duration}m</span></span>
              <span className="uppercase text-slate-600 tracking-widest">{iv.type}</span>
            </div>
          </div>
          <div className={`transition-transform duration-200 text-slate-500 ${isExpanded ? "rotate-90" : ""}`}>
            <ChevronRight />
          </div>
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <div className="px-5 pb-5 pt-0 border-t border-white/[0.04]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {/* Candidate */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">Candidate</div>
                <div className="text-sm text-white">{iv.candidate?.name || "Not added"}</div>
                <div className="text-xs text-slate-400">{iv.candidate?.email}</div>
                {iv.candidate?.phone && <div className="text-xs text-slate-400">{iv.candidate.phone}</div>}
              </div>
              {/* Interviewer */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">Interviewer</div>
                <div className="text-sm text-white">{iv.interviewer?.name || "Not assigned"}</div>
                <div className="text-xs text-slate-400">{iv.interviewer?.email}</div>
                <div className="text-xs text-slate-400">{iv.interviewer?.role}</div>
              </div>
              {/* Schedule */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">Schedule</div>
                <div className="text-sm text-white">{iv.schedule?.date || "Not scheduled"}</div>
                <div className="text-xs text-slate-400">{iv.schedule?.startTime && `${iv.schedule.startTime} ${iv.schedule.timezone}`}</div>
                <div className="text-xs text-slate-400">{iv.schedule?.duration} min</div>
              </div>
            </div>

            {/* Interview links */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {iv.candidateLink && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <span className="text-xs text-slate-400 flex-1 truncate">Candidate: {iv.candidateLink}</span>
                  <button onClick={() => copyLink(iv.candidateLink)} className="text-indigo-400 hover:text-indigo-300 transition-colors"><ClipboardIcon /></button>
                </div>
              )}
              {iv.interviewerLink && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <span className="text-xs text-slate-400 flex-1 truncate">Interviewer: {iv.interviewerLink}</span>
                  <button onClick={() => copyLink(iv.interviewerLink)} className="text-indigo-400 hover:text-indigo-300 transition-colors"><ClipboardIcon /></button>
                </div>
              )}
            </div>

            {/* Evaluation summary (if completed) */}
            {iv.evaluation?.verdict && (
              <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">Evaluation</div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {["coding", "problemSolving", "communication", "systemDesign"].map((key) => (
                    <div key={key} className="text-center">
                      <div className="text-lg font-bold text-white">{iv.evaluation[key]}<span className="text-xs text-slate-500">/5</span></div>
                      <div className="text-[10px] text-slate-400 capitalize">{key.replace(/([A-Z])/g, " $1")}</div>
                    </div>
                  ))}
                  <div className="text-center">
                    <div className={`text-lg font-bold ${iv.evaluation.verdict === "Pass" ? "text-emerald-400" : iv.evaluation.verdict === "Fail" ? "text-red-400" : "text-amber-400"}`}>{iv.evaluation.verdict}</div>
                    <div className="text-[10px] text-slate-400">Verdict</div>
                  </div>
                </div>
                {iv.evaluation.notes && <p className="mt-2 text-xs text-slate-400">{iv.evaluation.notes}</p>}
              </div>
            )}

            {/* Actions */}
            {showActions && (
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                {(iv.status === "scheduled" || iv.status === "in_progress") && (
                  <a
                    href={iv.interviewerLink}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-lg shadow-indigo-600/20"
                  >
                    🎯 Join Room
                  </a>
                )}
                {iv.status === "completed" && !iv.evaluation?.verdict && (
                  <button
                    onClick={() => { setEvalModal(iv._id); setEvalForm({ coding: 3, problemSolving: 3, communication: 3, systemDesign: 3, verdict: "Pass", notes: "" }); }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow-lg shadow-emerald-600/20"
                  >
                    📝 Evaluate
                  </button>
                )}
                <button
                  onClick={() => handleDelete(iv._id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-400 hover:bg-red-400/10 border border-red-400/20 text-xs font-medium transition-all"
                >
                  <TrashIcon /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════
     CANDIDATE VIEW
     ══════════════════════════════════════════════════════════════════ */
  if (!isCompany) {
    const upcomingCand = myInterviews.filter((i) => i.status === "scheduled" || i.status === "in_progress");
    const pastCand = myInterviews.filter((i) => i.status === "completed" || i.status === "cancelled");
    return (
      <div className="app-page pt-6">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-3">
              <span className="text-sm">🎯</span> My Interviews
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Scheduled Interviews</h1>
            <p className="text-sm text-slate-400 mt-1">Your upcoming and past coding interviews</p>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-400">Loading interviews...</p>
            </div>
          ) : myInterviews.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <div className="text-4xl mb-3">📅</div>
              <div className="text-lg font-semibold text-white mb-1">No interviews yet</div>
              <p className="text-sm text-slate-400">When a company schedules an interview with you, it will appear here.</p>
            </div>
          ) : (
            <>
              {upcomingCand.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Upcoming ({upcomingCand.length})
                  </h2>
                  <div className="space-y-3">
                    {upcomingCand.map((iv) => (
                      <div key={iv._id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:bg-white/[0.03] transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-base font-semibold text-white">{iv.title}</span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${statusColors[iv.status] || statusColors.draft}`}>{iv.status?.replace("_", " ")}</span>
                              <span className={`text-[11px] font-medium ${difficultyColors[iv.difficulty] || "text-slate-400"}`}>{iv.difficulty}</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-400">
                              <div className="flex items-center gap-1.5"><span>📅</span><span>{iv.schedule?.date || "Not scheduled"}</span></div>
                              <div className="flex items-center gap-1.5"><span>🕐</span><span>{iv.schedule?.startTime || "—"} {iv.schedule?.timezone}</span></div>
                              <div className="flex items-center gap-1.5"><span>⏱</span><span>{iv.duration} minutes</span></div>
                              <div className="flex items-center gap-1.5"><span>💻</span><span className="uppercase">{iv.type} · {iv.language}</span></div>
                            </div>
                            {iv.interviewer?.name && (
                              <div className="mt-2 text-xs text-slate-500">Interviewer: <span className="text-slate-300">{iv.interviewer.name}</span></div>
                            )}
                          </div>
                          <a href={iv.candidateLink || iv.link} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 whitespace-nowrap">
                            🚀 Join Interview
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pastCand.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    Past Interviews ({pastCand.length})
                  </h2>
                  <div className="space-y-3">
                    {pastCand.map((iv) => (
                      <div key={iv._id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-base font-semibold text-white">{iv.title}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${statusColors[iv.status] || statusColors.draft}`}>{iv.status?.replace("_", " ")}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span>📅 {iv.schedule?.date || "—"}</span>
                          <span>⏱ {iv.duration} min</span>
                          <span className="uppercase">{iv.type}</span>
                        </div>
                        {iv.evaluation?.verdict && (
                          <div className="mt-3 flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-lg text-xs font-medium ${iv.evaluation.verdict === "Pass" ? "bg-emerald-500/15 text-emerald-300" : iv.evaluation.verdict === "Fail" ? "bg-red-500/15 text-red-300" : "bg-amber-500/15 text-amber-300"}`}>
                              {iv.evaluation.verdict}
                            </span>
                            <span className="text-xs text-slate-500">Score: {iv.evaluation.coding}/5 Coding · {iv.evaluation.problemSolving}/5 Problem Solving</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════
     COMPANY VIEW
     ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="app-page pt-6">
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-3">
            <span className="text-sm">🎯</span> Interview Platform
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Live Interviews</h1>
          <p className="text-sm text-slate-400 mt-1">Coding interview infrastructure for your company</p>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200 ${
                tab === t.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]"
              }`}
            >
              <span className="text-base leading-none">{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* ── DASHBOARD TAB ──────────────────────────────────────────── */}
        {tab === "dashboard" && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total Interviews" value={interviews.length} icon="📋" color="bg-indigo-500/10" />
              <StatCard label="Upcoming" value={upcoming.length} icon="📅" color="bg-amber-500/10" />
              <StatCard label="Completed" value={past.filter((i) => i.status === "completed").length} icon="✅" color="bg-emerald-500/10" />
              <StatCard label="Cancelled" value={past.filter((i) => i.status === "cancelled").length} icon="❌" color="bg-red-500/10" />
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setTab("create")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-600/20"
              >
                <PlusIcon /> Create Interview
              </button>
            </div>

            {/* Upcoming interviews */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-white mb-3">Upcoming Interviews</h2>
              {upcoming.length === 0 ? (
                <div className="text-center py-10 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="text-3xl mb-2">📅</div>
                  <p className="text-sm text-slate-400">No upcoming interviews</p>
                  <button onClick={() => setTab("create")} className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Create your first interview →</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.slice(0, 5).map((iv) => <InterviewRow key={iv._id} interview={iv} />)}
                </div>
              )}
            </div>

            {/* Recent completed */}
            {past.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-white mb-3">Recently Completed</h2>
                <div className="space-y-3">
                  {past.slice(0, 3).map((iv) => <InterviewRow key={iv._id} interview={iv} />)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CREATE TAB ─────────────────────────────────────────────── */}
        {tab === "create" && (
          <div className="max-w-3xl">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-4 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
              {[
                { num: 1, label: "Details", full: "Interview Details" },
                { num: 2, label: "Candidate", full: "Add Candidate" },
                { num: 3, label: "Interviewer", full: "Assign Interviewer" },
                { num: 4, label: "Schedule", full: "Schedule" },
              ].map((s, idx) => (
                <React.Fragment key={s.num}>
                  <button
                    onClick={() => setStep(s.num)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                      step === s.num
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                        : step > s.num
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                        : "bg-white/[0.03] text-slate-500 border border-white/[0.06]"
                    }`}
                  >
                    <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] sm:text-[10px] font-bold">
                      {step > s.num ? "✓" : s.num}
                    </span>
                    <span className="hidden sm:inline">{s.full}</span>
                    <span className="sm:hidden">{s.label}</span>
                  </button>
                  {idx < 3 && <div className="flex-shrink-0 w-4 h-px bg-white/[0.08]" />}
                </React.Fragment>
              ))}
            </div>

            {/* Step 1 — Interview Details */}
            {step === 1 && (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <h3 className="text-lg font-semibold text-white mb-1">Interview Details</h3>
                <p className="text-xs text-slate-400 mb-5">Configure the interview parameters</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <FormInput label="Interview Title" value={form.title} onChange={(v) => updateField("title", v)} placeholder="e.g. Backend Engineer Interview" />
                  </div>
                  <FormSelect label="Interview Type" value={form.type} onChange={(v) => updateField("type", v)} options={INTERVIEW_TYPES} />
                  <FormInput label="Duration (minutes)" value={form.duration} onChange={(v) => updateField("duration", v)} type="number" />
                  <FormSelect label="Language" value={form.language} onChange={(v) => updateField("language", v)} options={LANGUAGES} />
                  <FormSelect label="Difficulty" value={form.difficulty} onChange={(v) => updateField("difficulty", v)} options={DIFFICULTIES} />
                </div>
                <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                  <button onClick={() => setStep(2)} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 w-full sm:w-auto">
                    Next <ChevronRight />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 — Candidate */}
            {step === 2 && (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <h3 className="text-lg font-semibold text-white mb-1">Add Candidate</h3>
                <p className="text-xs text-slate-400 mb-5">Enter the candidate's details. They'll receive an invitation email.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput label="Candidate Name" value={form.candidateName} onChange={(v) => updateField("candidateName", v)} placeholder="e.g. Rahul Sharma" />
                  <FormInput label="Candidate Email" value={form.candidateEmail} onChange={(v) => updateField("candidateEmail", v)} placeholder="rahul@example.com" type="email" />
                  <FormInput label="Phone (Optional)" value={form.candidatePhone} onChange={(v) => updateField("candidatePhone", v)} placeholder="+91 9876543210" />
                </div>
                <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
                  <button onClick={() => setStep(1)} className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] text-sm transition-all w-full sm:w-auto"><ArrowLeft /> Back</button>
                  <button onClick={() => setStep(3)} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 w-full sm:w-auto">
                    Next <ChevronRight />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 — Interviewer */}
            {step === 3 && (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <h3 className="text-lg font-semibold text-white mb-1">Assign Interviewer</h3>
                <p className="text-xs text-slate-400 mb-5">Add the interviewer who will conduct the session</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput label="Interviewer Name" value={form.interviewerName} onChange={(v) => updateField("interviewerName", v)} placeholder="e.g. Sarah Chen" />
                  <FormInput label="Interviewer Email" value={form.interviewerEmail} onChange={(v) => updateField("interviewerEmail", v)} placeholder="sarah@company.com" type="email" />
                  <FormInput label="Role" value={form.interviewerRole} onChange={(v) => updateField("interviewerRole", v)} placeholder="Tech Interviewer" />
                </div>
                <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
                  <button onClick={() => setStep(2)} className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] text-sm transition-all w-full sm:w-auto"><ArrowLeft /> Back</button>
                  <button onClick={() => setStep(4)} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 w-full sm:w-auto">
                    Next <ChevronRight />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4 — Schedule & Create */}
            {step === 4 && (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <h3 className="text-lg font-semibold text-white mb-1">Schedule Interview</h3>
                <p className="text-xs text-slate-400 mb-5">Set the date and time. A calendar invite will be sent.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormInput label="Date" value={form.date} onChange={(v) => updateField("date", v)} type="date" />
                  <FormInput label="Start Time" value={form.startTime} onChange={(v) => updateField("startTime", v)} type="time" />
                  <FormInput label="Timezone" value={form.timezone} onChange={(v) => updateField("timezone", v)} placeholder="IST" />
                </div>

                {/* Summary */}
                <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3">Summary</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div><span className="text-slate-500">Title:</span> <span className="text-white ml-1">{form.title || "—"}</span></div>
                    <div><span className="text-slate-500">Type:</span> <span className="text-white ml-1">{form.type}</span></div>
                    <div><span className="text-slate-500">Candidate:</span> <span className="text-white ml-1">{form.candidateName || "—"}</span></div>
                    <div><span className="text-slate-500">Interviewer:</span> <span className="text-white ml-1">{form.interviewerName || "—"}</span></div>
                    <div><span className="text-slate-500">Date:</span> <span className="text-white ml-1">{form.date || "—"}</span></div>
                    <div><span className="text-slate-500">Time:</span> <span className="text-white ml-1">{form.startTime || "—"}</span></div>
                    <div><span className="text-slate-500">Duration:</span> <span className="text-white ml-1">{form.duration} min</span></div>
                    <div><span className="text-slate-500">Difficulty:</span> <span className={`ml-1 ${difficultyColors[form.difficulty]}`}>{form.difficulty}</span></div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
                  <button onClick={() => setStep(3)} className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] text-sm transition-all w-full sm:w-auto"><ArrowLeft /> Back</button>
                  <button onClick={handleCreate} className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all shadow-lg shadow-emerald-600/20 w-full sm:w-auto">
                    ✨ Create Interview
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── UPCOMING TAB ───────────────────────────────────────────── */}
        {tab === "upcoming" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">{upcoming.length} Upcoming Interview{upcoming.length !== 1 ? "s" : ""}</h2>
              <button onClick={() => {
                setForm({ title: "", type: "DSA", duration: 60, language: "javascript", difficulty: "Medium", candidateName: "", candidateEmail: "", candidatePhone: "", interviewerName: "", interviewerEmail: "", interviewerRole: "Tech Interviewer", date: "", startTime: "", timezone: "IST" });
                setStep(1);
                setTab("create");
              }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all"><PlusIcon /> New</button>
            </div>
            {upcoming.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <CalendarIcon />
                <p className="text-sm text-slate-400 mt-3">No upcoming interviews scheduled</p>
              </div>
            ) : (
              <div className="space-y-3">{upcoming.map((iv) => <InterviewRow key={iv._id} interview={iv} />)}</div>
            )}
          </div>
        )}

        {/* ── PAST TAB ───────────────────────────────────────────────── */}
        {tab === "past" && (
          <div>
            <h2 className="text-sm font-semibold text-white mb-4">{past.length} Past Interview{past.length !== 1 ? "s" : ""}</h2>
            {past.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <p className="text-sm text-slate-400">No past interviews yet</p>
              </div>
            ) : (
              <div className="space-y-3">{past.map((iv) => <InterviewRow key={iv._id} interview={iv} />)}</div>
            )}
          </div>
        )}

        {/* ── PROBLEM LIBRARY TAB ────────────────────────────────────── */}
        {tab === "library" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Problem Library</h2>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all"><PlusIcon /> Add Custom</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PROBLEM_CATEGORIES.map((cat) => (
                <div key={cat.name} className="group relative p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-indigo-500/20 transition-all cursor-pointer overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className="relative z-10 transition-transform group-hover:-translate-y-1">
                    <div className="text-2xl mb-3">{cat.icon}</div>
                    <div className="text-sm font-semibold text-white mb-1">{cat.name}</div>
                    <div className="text-xs text-slate-400">{cat.count} problems</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── EVALUATION MODAL ───────────────────────────────────────── */}
        {evalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEvalModal(null)}>
            <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-2xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-white mb-4">📝 Submit Evaluation</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {["coding", "problemSolving", "communication", "systemDesign"].map((key) => (
                  <div key={key}>
                    <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1 block capitalize">{key.replace(/([A-Z])/g, " $1")}</label>
                    <input
                      type="range"
                      min="0" max="5" step="1"
                      value={evalForm[key]}
                      onChange={(e) => setEvalForm((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                      className="w-full accent-indigo-500"
                    />
                    <div className="text-xs text-center text-white mt-1">{evalForm[key]} / 5</div>
                  </div>
                ))}
              </div>
              <FormSelect label="Verdict" value={evalForm.verdict} onChange={(v) => setEvalForm((prev) => ({ ...prev, verdict: v }))} options={VERDICTS} />
              <div className="mt-4">
                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Notes</label>
                <textarea
                  rows={3}
                  value={evalForm.notes}
                  onChange={(e) => setEvalForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none placeholder:text-slate-600"
                  placeholder="Additional notes..."
                />
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button onClick={() => setEvalModal(null)} className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm transition-colors">Cancel</button>
                <button onClick={handleEvaluate} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all shadow-lg shadow-emerald-600/20">Submit Evaluation</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveInterviews;
