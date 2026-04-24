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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
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
    <div className="w-full relative">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Performance Area Chart */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f172a] to-[#020617] p-6 lg:p-8 shadow-[0_0_30px_rgba(34,211,238,0.1)] group transition-all duration-500 hover:shadow-[0_0_50px_rgba(34,211,238,0.2)] hover:border-cyan-500/40">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/20 blur-[100px] pointer-events-none transition-all group-hover:bg-cyan-500/30"></div>
          
          <div className="relative z-10 flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                <Activity className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,1)]" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Performance Trajectory</h2>
                <p className="text-xs text-cyan-300/70 font-bold uppercase tracking-widest mt-1">Last 14 Days</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">{streaks.best} <span className="text-sm text-cyan-500/50 uppercase tracking-widest">Day Max</span></div>
            </div>
          </div>

          <div className="relative z-10 h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.8}/>
                    <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="#0f172a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#334155" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#334155" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ stroke: 'rgba(34,211,238,0.2)', strokeWidth: 2, strokeDasharray: '5 5' }}
                  contentStyle={{ backgroundColor: "#020617", border: "1px solid rgba(34,211,238,0.3)", borderRadius: 16, boxShadow: "0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(34,211,238,0.2)" }}
                  itemStyle={{ color: "#22d3ee", fontSize: "16px", fontWeight: "900" }}
                  labelStyle={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase", fontWeight: "bold" }}
                />
                <Area type="monotone" dataKey="score" stroke="#22d3ee" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" style={{ filter: "drop-shadow(0 0 10px rgba(34,211,238,0.5))" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Difficulty Pie Chart */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1e1b4b] to-[#020617] p-6 lg:p-8 shadow-[0_0_30px_rgba(139,92,246,0.1)] group transition-all duration-500 hover:shadow-[0_0_50px_rgba(139,92,246,0.2)] hover:border-violet-500/40">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/20 blur-[100px] pointer-events-none transition-all group-hover:bg-violet-600/30"></div>
          
          <div className="relative z-10 flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                <Clock className="text-violet-400 drop-shadow-[0_0_10px_rgba(167,139,250,1)]" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Difficulty Matrix</h2>
                <p className="text-xs text-violet-300/70 font-bold uppercase tracking-widest mt-1">All Time</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 h-56 mt-2">
            {chartDifficulty.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm font-medium border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                Solve your first problem to unlock distribution.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartDifficulty} dataKey="value" nameKey="name" innerRadius={65} outerRadius={100} paddingAngle={8} stroke="none" cornerRadius={6}>
                    {chartDifficulty.map((entry) => (
                      <Cell key={entry.name} fill={DIFFICULTY_COLORS[entry.name] || "#6b7280"} style={{ filter: `drop-shadow(0px 0px 12px ${DIFFICULTY_COLORS[entry.name]}80)` }} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#020617", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 16, boxShadow: "0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(139,92,246,0.2)" }}
                    itemStyle={{ fontSize: "16px", fontWeight: "900" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="relative z-10 flex justify-center gap-8 mt-6">
            {difficultyData.map((d) => (
              <div key={d.name} className="flex flex-col items-center bg-white/[0.02] border border-white/5 px-6 py-3 rounded-2xl">
                <span className="text-2xl font-black drop-shadow-[0_0_10px_currentColor]" style={{ color: DIFFICULTY_COLORS[d.name] || "#fff" }}>{d.value}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Topic Progress Matrix */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#064e3b] to-[#020617] p-6 lg:p-10 shadow-[0_0_40px_rgba(16,185,129,0.1)] group transition-all duration-500 hover:shadow-[0_0_60px_rgba(16,185,129,0.2)] hover:border-emerald-500/40">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
        <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none transition-all group-hover:bg-emerald-500/20"></div>

        <div className="relative z-10 flex items-center gap-4 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,1)]"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Topic Proficiency Matrix</h2>
            <p className="text-xs text-emerald-300/70 font-bold uppercase tracking-widest mt-1">Skill Depth Analysis</p>
          </div>
        </div>
        
        <div className="relative z-10 grid grid-cols-1 xl:grid-cols-2 gap-10">
          {/* Left Side: Radar Skill Chart */}
          <div className="h-72 w-full rounded-2xl bg-[#020617]/50 border border-white/5 p-2 shadow-inner relative flex items-center justify-center">
            {topics.length < 3 ? (
              <div className="text-center text-slate-500 text-sm font-medium p-6 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                <Activity className="mx-auto mb-2 opacity-50" size={24} />
                Attempt at least 3 topics to unlock the Skill Radar.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={topics.slice(0, 8)}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis 
                    dataKey="topic" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#020617", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 12, boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}
                    itemStyle={{ color: "#34d399", fontWeight: "bold" }}
                    formatter={(value) => [`${Math.round(value)}%`, "Proficiency"]}
                  />
                  <Radar 
                    name="Skill Depth" 
                    dataKey="progress" 
                    stroke="#34d399" 
                    strokeWidth={2}
                    fill="url(#colorRadar)" 
                    fillOpacity={1} 
                    style={{ filter: "drop-shadow(0 0 10px rgba(52,211,153,0.6))" }}
                  />
                  <defs>
                    <radialGradient id="colorRadar" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#047857" stopOpacity={0.2} />
                    </radialGradient>
                  </defs>
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Right Side: Progress Bars */}
          <div className="flex flex-col gap-y-4 justify-center">
            {topics.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm font-medium border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                No topics solved yet.
              </div>
            ) : (
              topics.slice(0, 5).map((topic) => (
                <div key={topic.topic} className="group/item cursor-default bg-white/[0.01] border border-transparent hover:border-white/5 hover:bg-white/[0.03] p-3 -mx-3 rounded-xl transition-all">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-black text-white group-hover/item:text-emerald-400 transition-colors drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">{topic.topic}</span>
                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">{topic.solved}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">/ {topic.total}</span>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/10 shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-300 relative shadow-[0_0_15px_rgba(52,211,153,0.8)] rounded-full" 
                      style={{ width: `${Math.max(3, topic.progress)}%` }} 
                    >
                      <div className="absolute inset-0 bg-white/30 w-[200%] animate-[shimmer_2s_infinite] -skew-x-12"></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
