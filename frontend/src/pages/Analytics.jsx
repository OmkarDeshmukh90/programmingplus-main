import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import BASE_URL from "../config";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import Navbar from "../components/Navbar";
import { Brain, Trophy, Activity, Target } from "lucide-react";

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err) {
        console.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-cyan-500/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-cyan-500/30">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium mb-4">
            <Brain className="w-4 h-4" /> AI Performance Analytics
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Your <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Insights</span>
          </h1>
          <p className="text-slate-400 text-lg">AI-tracked metrics on your code quality, complexity, and consistency.</p>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="app-card p-6 flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Activity className="w-6 h-6" />
               </div>
               <div>
                 <p className="text-slate-400 text-sm">Total Submissions</p>
                 <p className="text-2xl font-bold text-white">{data?.totalSubmissions || 0}</p>
               </div>
          </div>
          <div className="app-card p-6 flex items-center gap-4 shadow-lg">
               <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Trophy className="w-6 h-6" />
               </div>
               <div>
                 <p className="text-slate-400 text-sm">Avg Code Quality</p>
                 <p className="text-2xl font-bold text-white">
                   {data?.codeQualityTrend?.length 
                     ? Math.round(data.codeQualityTrend.reduce((acc, c) => acc + c.score, 0) / data.codeQualityTrend.length) 
                     : "N/A"}
                 </p>
               </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Strengths */}
          <div className="app-panel p-6 border border-white/[0.05]">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Target className="w-5 h-5 text-emerald-400"/> Strengths</h2>
            {data?.strengths?.length > 0 ? (
              <div className="space-y-4">
                {data.strengths.map((s, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300 font-medium">{s.concept}</span>
                      <span className="text-emerald-400">{Math.round(s.winRate * 100)}% Win Rate</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full" style={{ width: `${s.winRate * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
                <p className="text-slate-500 text-sm italic">Keep coding to unlock strengths! The AI needs more successes.</p>
            )}
          </div>

          {/* Weaknesses */}
          <div className="app-panel p-6 border border-white/[0.05]">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Target className="w-5 h-5 text-rose-400"/> Areas for Growth</h2>
            {data?.weaknesses?.length > 0 ? (
              <div className="space-y-4">
                {data.weaknesses.map((w, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300 font-medium">{w.concept}</span>
                      <span className="text-rose-400">{Math.round(w.winRate * 100)}% Win Rate</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className="bg-gradient-to-r from-rose-500 to-orange-500 h-2 rounded-full" style={{ width: `${w.winRate * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm italic">You have no major weaknesses tracked yet!</p>
            )}
          </div>
        </div>

        {/* Code Quality Graph */}
        <div className="app-panel p-6 border border-white/[0.05] mb-8">
           <h2 className="text-xl font-bold text-white mb-6">Code Quality Scoring Trend</h2>
           <div className="h-64 w-full">
             {data?.codeQualityTrend?.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={data.codeQualityTrend}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                   <XAxis dataKey="date" stroke="#94a3b8" tickFormatter={(val) => new Date(val).toLocaleDateString()} />
                   <YAxis stroke="#94a3b8" domain={[0, 100]} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc", borderRadius: "8px" }}
                     labelFormatter={(val) => new Date(val).toLocaleDateString()}
                   />
                   <Line type="monotone" dataKey="score" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4, fill: "#0ea5e9", strokeWidth: 2, stroke: "#0ea5e9" }} />
                 </LineChart>
               </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-slate-500">Not enough data to display quality trends.</div>
             )}
           </div>
        </div>

        {/* Time Complexity Log */}
        <div className="app-panel p-6 border border-white/[0.05]">
          <h2 className="text-xl font-bold text-white mb-6">Recent Complexity Logs</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-800/50 text-slate-400 border-b border-white/[0.05]">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Language</th>
                  <th className="px-4 py-3">Time O()</th>
                  <th className="px-4 py-3">Space O()</th>
                  <th className="px-4 py-3">Quality Score</th>
                </tr>
              </thead>
              <tbody>
                {data?.history?.slice().reverse().slice(0, 10).map((h, i) => (
                  <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                    <td className="px-4 py-3">{new Date(h.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 capitalize">{h.language}</td>
                    <td className="px-4 py-3 font-mono text-cyan-400">{h.timeComplexity}</td>
                    <td className="px-4 py-3 font-mono text-indigo-400">{h.spaceComplexity}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${h.score >= 80 ? 'bg-emerald-500/20 text-emerald-400' : h.score >= 50 ? 'bg-orange-500/20 text-orange-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {h.score}/100
                      </span>
                    </td>
                  </tr>
                ))}
                {(!data?.history || data.history.length === 0) && (
                  <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500">No submission history found. Get coding!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
