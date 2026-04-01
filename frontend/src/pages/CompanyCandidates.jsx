import React, { useEffect, useState } from "react";
import { Users, TrendingUp } from "lucide-react";
import { getCompanyContests } from "../api/contests";

export default function CompanyCandidates() {
  const token = localStorage.getItem("token");
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await getCompanyContests(token);
        setContests(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load candidates.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (loading) return <div className="app-card p-6">Loading candidates...</div>;
  if (error) return <div className="app-card p-6 border border-rose-500/40 bg-rose-500/10 text-rose-200">{error}</div>;

  return (
    <div className="app-page">
      <div className="app-shell">
        <div className="mb-6">
          <h1 className="app-section-title">Candidates</h1>
          <p className="app-subtitle mt-1">Track candidate volume and funnel health across contests.</p>
        </div>

        {contests.length === 0 ? (
          <div className="app-empty">No contests created yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contests.map((contest) => (
              <div key={contest._id} className="app-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-white font-semibold">{contest.title}</div>
                    <div className="text-xs text-slate-400">{contest.roleTitle}</div>
                  </div>
                  <Users className="text-cyan-300" size={22} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div className="app-panel p-3 text-center">
                    <div className="text-white font-semibold">{contest.stats?.participants || 0}</div>
                    <div className="text-xs text-slate-400">Registered</div>
                  </div>
                  <div className="app-panel p-3 text-center">
                    <div className="text-white font-semibold">{contest.stats?.inProgress || 0}</div>
                    <div className="text-xs text-slate-400">In Progress</div>
                  </div>
                  <div className="app-panel p-3 text-center">
                    <div className="text-white font-semibold">{contest.stats?.submitted || 0}</div>
                    <div className="text-xs text-slate-400">Submitted</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                  <TrendingUp size={14} className="text-lime-300" />
                  Funnel health updates will appear here.
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
