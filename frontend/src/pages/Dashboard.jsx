import axios from "axios";
import React, { useContext, useEffect, useMemo, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  Target,
  Flame,
  TrendingUp,
  ArrowRight,
  Video,
  Calendar,
  ExternalLink,
} from "lucide-react";
import BASE_URL from "../config";
import ReactBitsButton from "../components/ui/ReactBitsButton";
import CompanyOverview from "./CompanyOverview";
import LearningPathCard from "../components/LearningPathCard";
import { getActiveLearningPath, updateLearningTask } from "../api/learningPaths";
import { AuthContext } from "../context/AuthContext";

const DashboardCharts = lazy(() => import("../components/Dashboard/DashboardCharts"));

export default function Dashboard() {
  // ── Read from AuthContext (reactive) — never stale ──────────────────────
  const { token, role, userName } = useContext(AuthContext);

  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [learningPath, setLearningPath] = useState(null);
  const [pathLoading, setPathLoading] = useState(false);

  // ── Fetch dashboard data whenever the token becomes available ───────────
  useEffect(() => {
    // Don't attempt fetch while Clerk is still loading (token === null and not yet set)
    // We distinguish "no token yet" from "definitely no token" by checking
    // if the AuthContext token is undefined vs null.
    if (token === undefined) return; // still initialising

    const fetchDashboard = async () => {
      if (!token) {
        setError("Please log in to view your dashboard.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${BASE_URL}/dashboard/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDashboard(res.data);
      } catch (err) {
        const msg = err.response?.data?.error || err.response?.data?.message || "Failed to load dashboard data.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [token]); // re-runs when token is ready or refreshed

  // ── Fetch active learning path ──────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    const loadPath = async () => {
      setPathLoading(true);
      try {
        const res = await getActiveLearningPath(token);
        setLearningPath(res.data);
      } catch {
        setLearningPath(null);
      } finally {
        setPathLoading(false);
      }
    };
    loadPath();
  }, [token]);

  const handleToggleTask = async (milestoneIndex, taskIndex, done) => {
    if (!token || !learningPath) return;
    try {
      const res = await updateLearningTask(token, learningPath._id, {
        milestoneIndex,
        taskIndex,
        done,
      });
      setLearningPath(res.data);
    } catch {
      // ignore
    }
  };

  const summaryCards = useMemo(() => {
    if (!dashboard) return [];
    const { summary, streaks } = dashboard;
    return [
      {
        label: "Problems Solved",
        value: `${summary.solvedCount}/${summary.totalQuestions}`,
        icon: Trophy,
        tone: "text-yellow-400",
      },
      {
        label: "Course Progress",
        value: `${summary.progressPercent}%`,
        icon: Target,
        tone: "text-blue-400",
      },
      {
        label: "Submission Accuracy",
        value: `${summary.successRate}%`,
        icon: TrendingUp,
        tone: "text-green-400",
      },
      {
        label: "Current Streak",
        value: `${streaks.current} day${streaks.current === 1 ? "" : "s"}`,
        icon: Flame,
        tone: "text-orange-400",
      },
    ];
  }, [dashboard]);

  // ── Company users see their own overview ────────────────────────────────
  if (role === "company") {
    return <CompanyOverview />;
  }

  // ── Loading state: show spinner while token is resolving ────────────────
  if (loading) {
    return (
      <div className="app-card p-6 flex items-center gap-3 text-slate-400">
        <div className="w-5 h-5 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
        Loading dashboard...
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="app-card p-6 border border-rose-500/40 bg-rose-500/10 text-rose-200">
        {error || "Unable to load dashboard."}
      </div>
    );
  }

  const { summary, streaks, topics, progressData, difficultyData, motivation } = dashboard;

  return (
    <div className="min-h-[calc(100vh-80px)] space-y-8 pb-10">
      
      {/* ── Welcome Header ── */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-[#0b1220] to-[#041c26] p-8 lg:p-12 shadow-[0_0_40px_rgba(34,211,238,0.1)] backdrop-blur-xl">
        <div className="absolute -right-20 -top-20 h-[300px] w-[300px] rounded-full bg-cyan-500/10 blur-[100px]"></div>
        <div className="absolute left-10 bottom-10 h-[200px] w-[200px] rounded-full bg-blue-500/10 blur-[80px]"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">{userName}</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-300 font-medium">
              {motivation.headline}
            </p>
          </div>
        </div>
      </div>

      {/* ── Weekly Goal & Action Area ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-600/20 to-cyan-600/10 p-6 lg:p-8 shadow-xl backdrop-blur-md group hover:border-blue-400/50 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 h-full">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-300 shadow-inner">
                <Target size={14} className="animate-pulse" /> Weekly Objective
              </div>
              <p className="text-2xl md:text-3xl font-extrabold text-white mt-1 tracking-tight">Solve {summary.weeklyTarget} more this week</p>
              <p className="text-sm font-semibold text-blue-200/80 mt-2">
                Next milestone: {motivation.nextMilestone}/{summary.totalQuestions} solved
              </p>
            </div>
            <button
              onClick={() => navigate("/problems")}
              className="group/btn relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-4 font-black text-white shadow-[0_8px_20px_rgba(37,99,235,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_10px_25px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2"
            >
              <span className="relative z-10 flex items-center gap-2">Continue Practice <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" /></span>
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#111] to-[#0a0a0a] p-6 shadow-xl backdrop-blur-md">
          <h2 className="text-xl font-black text-white flex items-center gap-2 mb-4">
            <Flame className="text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" size={20} /> Focus Next
          </h2>
          <div className="rounded-2xl bg-white/[0.03] p-4 border border-white/5 mb-4">
            <p className="text-slate-300 text-sm font-medium leading-relaxed">
              {motivation.focusTopics.length > 0
                ? <span><span className="text-white font-bold block mb-1">High Priority Areas:</span> {motivation.focusTopics.join(", ")}</span>
                : "Excellent balance across topics. Maintain consistency by solving one problem daily."}
            </p>
          </div>
          <button
            onClick={() => navigate("/ai-chat")}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
          >
            Ask AI for Guidance
          </button>
        </div>
      </div>

      {/* ── Summary Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          let topBorderColor = "border-t-slate-500/50";
          if (card.tone.includes("yellow")) topBorderColor = "border-t-yellow-400/60";
          if (card.tone.includes("blue")) topBorderColor = "border-t-blue-400/60";
          if (card.tone.includes("green")) topBorderColor = "border-t-emerald-400/60";
          if (card.tone.includes("orange")) topBorderColor = "border-t-orange-400/60";

          return (
            <div key={card.label} className={`relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-xl backdrop-blur-xl hover:bg-white/[0.04] hover:-translate-y-1 transition-all duration-300 border-t-2 ${topBorderColor}`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl bg-white/5 border border-white/10 ${card.tone}`}>
                  <Icon size={20} />
                </div>
                <span className={`text-2xl font-black ${card.tone} drop-shadow-[0_0_8px_currentColor]`}>{card.value}</span>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* ── Active Curriculum & Live Sessions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Learning Path */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-2">
             <Trophy className="text-amber-400" size={24} />
             <h2 className="text-2xl font-black text-white">Active Curriculum</h2>
          </div>
          {pathLoading ? (
            <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-10 text-center text-slate-400 backdrop-blur-sm animate-pulse font-medium">Loading learning path...</div>
          ) : learningPath ? (
            <div className="transform-gpu transition-all">
              <LearningPathCard
                path={learningPath}
                onToggleTask={handleToggleTask}
                onViewAll={() => navigate("/learning-path")}
              />
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/20 bg-white/[0.01] p-10 text-center backdrop-blur-sm">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-4 border border-white/10">
                <Sparkles size={24} className="text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Active Path</h3>
              <p className="text-slate-400 mb-6 max-w-sm mx-auto">Generate a custom learning curriculum in AI Studio to supercharge your prep.</p>
              <button onClick={() => navigate("/ai-chat")} className="rounded-full border border-cyan-500/50 bg-cyan-500/10 px-6 py-2.5 text-sm font-bold text-cyan-400 hover:bg-cyan-500/20 transition-colors">
                Go to AI Studio
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Interviews */}
        <div>
          {dashboard.upcomingInterviews?.length > 0 ? (
            <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/30 to-[#0a0a0a] p-7 shadow-xl backdrop-blur-md h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Video className="text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]" size={20} />
                  Live Sessions
                </h2>
                <button
                  onClick={() => navigate("/live-interviews")}
                  className="text-xs font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  See All
                </button>
              </div>
              <div className="space-y-4">
                {dashboard.upcomingInterviews.slice(0, 4).map((iv) => (
                  <div key={iv.id} className="group relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/5 p-4 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all duration-300">
                    <div className="min-w-0 pr-10">
                      <div className="text-base font-bold text-white truncate group-hover:text-indigo-300 transition-colors">{iv.title}</div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                          <Calendar size={12} className="text-indigo-500/70" />
                          {new Date(iv.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}{" "}
                          <span className="mx-1 opacity-50">•</span>
                          {new Date(iv.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(iv.link)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-lg group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-indigo-500/10 bg-gradient-to-b from-indigo-950/10 to-[#0a0a0a] p-7 shadow-xl backdrop-blur-md h-full flex flex-col items-center justify-center text-center">
              <Video className="text-indigo-500/30 mb-4" size={32} />
              <h3 className="text-lg font-bold text-white mb-2">No Live Sessions</h3>
              <p className="text-sm text-slate-400 mb-6">You don't have any upcoming mock interviews or live lab sessions scheduled.</p>
              <button onClick={() => navigate("/live-interviews")} className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-5 py-2.5 text-sm font-bold text-indigo-400 hover:bg-indigo-500/20 transition-colors">
                Schedule a Session
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── FULL WIDTH Analytics Section ── */}
      <div className="pt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
               <TrendingUp className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" size={24} />
             </div>
             <div>
               <h2 className="text-3xl font-black text-white tracking-tight">Performance Analytics</h2>
               <p className="text-xs text-emerald-400/80 font-bold uppercase tracking-widest mt-1">Full Scope Metrics</p>
             </div>
          </div>
          <button onClick={() => navigate("/analytics")} className="group flex items-center gap-2 text-sm font-black text-white hover:text-emerald-300 transition-colors bg-emerald-500/10 px-6 py-3 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            Open Advanced Analytics <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#050505] shadow-2xl backdrop-blur-xl overflow-hidden p-4">
          <Suspense fallback={<div className="p-10 text-center text-slate-400 animate-pulse font-medium">Loading advanced analytics engine...</div>}>
            <DashboardCharts
              progressData={progressData}
              difficultyData={difficultyData}
              topics={topics}
              streaks={streaks}
            />
          </Suspense>
        </div>
      </div>

    </div>
  );
}
