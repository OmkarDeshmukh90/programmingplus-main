import axios from "axios";
import React, { useEffect, useMemo, useState, lazy, Suspense } from "react";
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

const DashboardCharts = lazy(() => import("../components/Dashboard/DashboardCharts"));

export default function Dashboard() {
  const role = localStorage.getItem("userRole") || "candidate";
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [learningPath, setLearningPath] = useState(null);
  const [pathLoading, setPathLoading] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to view your dashboard.");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${BASE_URL}/dashboard/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDashboard(res.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  useEffect(() => {
    const loadPath = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
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
  }, []);

  const handleToggleTask = async (milestoneIndex, taskIndex, done) => {
    const token = localStorage.getItem("token");
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

  if (role === "company") {
    return <CompanyOverview />;
  }

  if (loading) {
    return <div className="app-card p-6">Loading dashboard...</div>;
  }

  if (error || !dashboard) {
    return (
      <div className="app-card p-6 border border-rose-500/40 bg-rose-500/10 text-rose-200">
        {error || "Unable to load dashboard."}
      </div>
    );
  }

  const { user, summary, streaks, topics, progressData, difficultyData, motivation } = dashboard;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="app-section-title">Welcome back, {user.name || user.email}</h1>
        <p className="app-subtitle mt-1">{motivation.headline}</p>
      </div>

      <div className="app-card p-5 bg-gradient-to-r from-blue-600/20 to-cyan-600/10 border border-blue-500/30">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-blue-200">Weekly Goal</p>
            <p className="text-xl font-semibold">Solve {summary.weeklyTarget} more this week</p>
            <p className="text-sm text-gray-300 mt-1">
              Next milestone: {motivation.nextMilestone}/{summary.totalQuestions} solved
            </p>
          </div>
          <ReactBitsButton
            onClick={() => navigate("/problems")}
            variant="primary"
            className="px-4 py-2 w-full md:w-auto flex justify-center"
          >
            Continue Practice <ArrowRight size={16} />
          </ReactBitsButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="app-card p-4">
              <div className="flex items-center justify-between mb-3">
                <Icon className={`${card.tone} w-6 h-6`} />
                <span className={`text-xl font-bold ${card.tone}`}>{card.value}</span>
              </div>
              <p className="text-gray-300 text-sm">{card.label}</p>
            </div>
          );
        })}
      </div>

      {pathLoading ? (
        <div className="app-card p-5 text-slate-300">Loading learning path...</div>
      ) : learningPath ? (
        <LearningPathCard
          path={learningPath}
          onToggleTask={handleToggleTask}
          onViewAll={() => navigate("/learning-path")}
        />
      ) : (
        <div className="app-empty">
          No learning path yet. Generate one in AI Studio and add it to your learning curve.
        </div>
      )}

      <Suspense fallback={<div className="app-card p-6 text-slate-300">Loading analytics...</div>}>
        <DashboardCharts
          progressData={progressData}
          difficultyData={difficultyData}
          topics={topics}
          streaks={streaks}
        />
      </Suspense>

      <div className="flex justify-end text-sm mt-3 text-cyan-400">
        <button onClick={() => navigate("/analytics")} className="flex items-center gap-1 hover:text-cyan-300 transition-colors">
          View Full AI Analytics <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Upcoming Interviews Section */}
      {dashboard.upcomingInterviews?.length > 0 && (
        <div className="app-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Video className="text-indigo-400" size={20} />
              Upcoming Interviews
            </h2>
            <button 
              onClick={() => navigate("/live-interviews")}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View All →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dashboard.upcomingInterviews.slice(0, 4).map((iv) => (
              <div key={iv.id} className="app-panel p-4 flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{iv.title}</div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Calendar size={12} />
                      {new Date(iv.startTime).toLocaleDateString()} {new Date(iv.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 uppercase tracking-tight">
                      {iv.type}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => navigate(iv.link)}
                  className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-lg shadow-indigo-500/0 group-hover:shadow-indigo-500/20"
                >
                  <ExternalLink size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="app-card p-5">
        <h2 className="text-lg font-semibold mb-2">Focus Next</h2>
        <p className="text-gray-300 text-sm mb-4">
          {motivation.focusTopics.length > 0
            ? `Prioritize: ${motivation.focusTopics.join(", ")}`
            : "Great balance. Keep building consistency with one solved problem daily."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <ReactBitsButton
            onClick={() => navigate("/problems")}
            variant="success"
            className="px-4 py-2 w-full sm:w-auto flex justify-center"
          >
            Solve Next Problem
          </ReactBitsButton>
          <ReactBitsButton
            onClick={() => navigate("/ai-chat")}
            variant="neutral"
            className="px-4 py-2 w-full sm:w-auto flex justify-center"
          >
            Ask AI for Study Plan
          </ReactBitsButton>
        </div>
      </div>
    </div>
  );
}
