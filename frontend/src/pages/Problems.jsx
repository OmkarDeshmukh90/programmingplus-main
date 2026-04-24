import React, { useContext, useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";
import { Search, Filter, BookOpen, Layers, Brain, HelpCircle, Target } from "lucide-react";
import axios from "axios";
import BASE_URL from "../config";
import { getAllQuestions } from "../api/questions";
import QuestionCard from "../components/Dashboard/QuestionCard";
import { AuthContext } from "../context/AuthContext";


export default function Problems() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [solvedSet, setSolvedSet] = useState(new Set());
  const [attemptedSet, setAttemptedSet] = useState(new Set());
  const [thoughtProcess, setThoughtProcess] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [qRes, dRes] = await Promise.all([
          getAllQuestions(token),
          axios.get(`${BASE_URL}/dashboard/me`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        setQuestions(qRes.data || qRes);
        
        // Process user progress
        const solved = new Set();
        const attempted = new Set();
        const user = dRes.data.user || {};
        setThoughtProcess(dRes.data.thoughtProcess || null);
        
        (user.solvedQuestions || []).forEach(sq => {
          if (sq.status === "solved") {
            solved.add(Number(sq.questionId));
          } else {
            attempted.add(Number(sq.questionId));
          }
        });
        setSolvedSet(solved);
        setAttemptedSet(attempted);

      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, navigate]);

  const filteredQuestions = questions.filter((q) => {
    return (
      (filter === "all" || q.difficulty.toLowerCase() === filter) &&
      (tagFilter === "all" || (q.tags || []).map((t) => t.toLowerCase()).includes(tagFilter)) &&
      q.title.toLowerCase().includes(search.toLowerCase())
    );
  });

  const tagOptions = Array.from(
    new Set(
      questions.flatMap((q) => (q.tags || []).map((t) => t.toLowerCase()))
    )
  ).slice(0, 16);

  const learningPaths = [
    { title: "Foundations", subtitle: "Arrays, strings, math", icon: BookOpen },
    { title: "Core DSA", subtitle: "Stacks, queues, trees", icon: Layers },
    { title: "Advanced Patterns", subtitle: "DP, graphs, greedy", icon: Target },
  ];

  return (
    <div className="app-page">
      <div className="app-shell">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              Elite Problems
              <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 uppercase tracking-widest">Student Practice</span>
            </h1>
            <p className="app-subtitle mt-2 text-slate-400 font-medium">Master the art of competitive programming with curated challenges.</p>
          </div>
          <div className="text-sm font-semibold text-slate-500 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.06]">
            {filteredQuestions.length} challenges available
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-8">
          <aside className="space-y-6">
            <div className="app-card p-5 bg-white/[0.02] border-white/[0.08] backdrop-blur-md">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <Brain size={14} /> Thought Process Tracker
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500">Planning</div>
                    <div className="text-lg font-bold text-white mt-1">
                      {thoughtProcess ? `${thoughtProcess.averagePlanningTimeSec}s` : "--"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500">Attempts</div>
                    <div className="text-lg font-bold text-white mt-1">
                      {thoughtProcess ? thoughtProcess.averageAttempts : "--"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500">Hints</div>
                    <div className="text-lg font-bold text-white mt-1">
                      {thoughtProcess ? thoughtProcess.totalHintsUsed : "--"}
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300 font-bold mb-2">AI Insight</div>
                  <div className="space-y-2">
                    {(thoughtProcess?.insights || ["Solve a tracked problem to unlock thinking-pattern insights."]).map((insight) => (
                      <div key={insight} className="text-sm text-slate-200 leading-relaxed">
                        {insight}
                      </div>
                    ))}
                  </div>
                  {thoughtProcess?.topStruggleTag && (
                    <div className="mt-3 text-[11px] font-semibold text-slate-400">
                      Current friction area: <span className="text-cyan-300">{thoughtProcess.topStruggleTag}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="app-card p-5 bg-white/[0.02] border-white/[0.08] backdrop-blur-md">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <Layers size={14} /> Learning Paths
              </h3>
              <div className="space-y-3">
                {learningPaths.map((path) => {
                  const Icon = path.icon || BookOpen;
                  return (
                    <div key={path.title} className="group p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                          <Icon size={16} />
                        </div>
                        <div>
                          <div className="text-white font-bold text-sm">{path.title}</div>
                          <div className="text-[10px] text-slate-500 font-medium">{path.subtitle}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="app-card p-5 bg-white/[0.02] border-white/[0.08] backdrop-blur-md">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <Filter size={14} /> Popular Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTagFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${tagFilter === "all" ? "bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20" : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:border-white/20"}`}
                >
                  All
                </button>
                {tagOptions.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setTagFilter(tag)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all border ${tagFilter === tag ? "bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20" : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:border-white/20"}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  placeholder="Search challenges by title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent border-none p-3.5 pl-12 text-sm text-white focus:outline-none placeholder:text-slate-600 font-medium"
                />
              </div>
              <div className="w-[1px] bg-white/[0.06] hidden md:block my-2" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-transparent border-none p-3.5 text-sm text-slate-300 focus:outline-none appearance-none cursor-pointer font-bold px-6"
              >
                <option value="all" className="bg-[#0f172a]">Difficulty: All</option>
                <option value="easy" className="bg-[#0f172a]">Difficulty: Easy</option>
                <option value="medium" className="bg-[#0f172a]">Difficulty: Medium</option>
                <option value="hard" className="bg-[#0f172a]">Difficulty: Hard</option>
              </select>
            </div>

            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-16 w-full rounded-xl bg-white/[0.02] border border-white/[0.06]" />
                ))}
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="app-empty bg-white/[0.01] border-dashed border-slate-800 py-16">
                <HelpCircle className="mx-auto text-slate-700 mb-4" size={48} />
                <p className="text-slate-500 font-bold">No challenges found matching your filters.</p>
                <button 
                  onClick={() => { setSearch(""); setFilter("all"); setTagFilter("all"); }}
                  className="mt-4 text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredQuestions.map((q) => (
                  <QuestionCard 
                    key={q.id || q._id} 
                    question={q} 
                    status={solvedSet.has(Number(q.id || q._id)) ? "solved" : attemptedSet.has(Number(q.id || q._id)) ? "attempted" : "new"}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
