import React from "react";
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
import { Activity, Clock } from "lucide-react";

const DIFFICULTY_COLORS = {
  Easy: "#22c55e",
  Medium: "#f59e0b",
  Hard: "#ef4444",
};

export default function DashboardCharts({ progressData, difficultyData, topics, streaks }) {
  const chartDifficulty = difficultyData.filter((d) => d.value > 0);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="app-card p-5">
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

        <div className="app-card p-5">
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

      <div className="app-card p-5 mb-6">
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
    </>
  );
}
