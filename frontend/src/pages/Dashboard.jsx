import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Trophy,
  Target,
  Flame,
  TrendingUp,
  Clock,
  Activity,
  ArrowRight,
} from "lucide-react";
import BASE_URL from "../config";
import ReactBitsButton from "../components/ui/ReactBitsButton";

const DIFFICULTY_COLORS = {
  Easy: "#22c55e",
  Medium: "#f59e0b",
  Hard: "#ef4444",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) {
    return <div className="min-h-screen bg-black text-white p-6">Loading dashboard...</div>;
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4">{error || "Unable to load dashboard."}</div>
      </div>
    );
  }

  const { user, summary, streaks, topics, progressData, difficultyData, motivation } = dashboard;
  const chartDifficulty = difficultyData.filter((d) => d.value > 0);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Welcome back, {user.name || user.email}</h1>
        <p className="text-gray-400 mt-1">{motivation.headline}</p>
      </div>

      <div className="bg-gradient-to-r from-blue-600/20 to-green-600/20 border border-blue-500/30 rounded-xl p-5 mb-6">
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
            className="px-4 py-2"
          >
            Continue Practice <ArrowRight size={16} />
          </ReactBitsButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <Icon className={`${card.tone} w-6 h-6`} />
                <span className={`text-xl font-bold ${card.tone}`}>{card.value}</span>
              </div>
              <p className="text-gray-300 text-sm">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-cyan-400" size={18} />
            <h2 className="text-lg font-semibold">Last 14 Days</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressData}>
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                />
                <Area type="monotone" dataKey="score" stroke="#22d3ee" fill="#164e63" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Best streak: {streaks.best} days. Active days: {streaks.activeDays}.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="text-violet-400" size={18} />
            <h2 className="text-lg font-semibold">Difficulty Wins</h2>
          </div>
          <div className="h-72">
            {chartDifficulty.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Solve your first problem to unlock this chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartDifficulty} dataKey="value" nameKey="name" innerRadius={45} outerRadius={90}>
                    {chartDifficulty.map((entry) => (
                      <Cell key={entry.name} fill={DIFFICULTY_COLORS[entry.name] || "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-300">
            {difficultyData.map((d) => (
              <span key={d.name}>{d.name}: {d.value}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 mb-6">
        <h2 className="text-lg font-semibold mb-4">Topic Progress</h2>
        <div className="h-72 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topics.slice(0, 10)}>
              <XAxis dataKey="topic" stroke="#9ca3af" angle={-30} textAnchor="end" interval={0} height={70} />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }}
              />
              <Bar dataKey="solved" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" fill="#374151" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {topics.slice(0, 6).map((topic) => (
            <div key={topic.topic}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-200">{topic.topic}</span>
                <span className="text-gray-400">
                  {topic.solved}/{topic.total} solved | avg {Math.round(topic.averageTimeSec / 60) || 0} min
                </span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${topic.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-2">Focus Next</h2>
        <p className="text-gray-300 text-sm mb-4">
          {motivation.focusTopics.length > 0
            ? `Prioritize: ${motivation.focusTopics.join(", ")}`
            : "Great balance. Keep building consistency with one solved problem daily."}
        </p>
        <div className="flex gap-3 flex-wrap">
          <ReactBitsButton
            onClick={() => navigate("/problems")}
            variant="success"
            className="px-4 py-2"
          >
            Solve Next Problem
          </ReactBitsButton>
          <ReactBitsButton
            onClick={() => navigate("/ai-chat")}
            variant="neutral"
            className="px-4 py-2"
          >
            Ask AI for Study Plan
          </ReactBitsButton>
        </div>
      </div>
    </div>
  );
}
