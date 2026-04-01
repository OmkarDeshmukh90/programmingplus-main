import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, Video, Briefcase, ArrowRight } from "lucide-react";
import ReactBitsButton from "../components/ui/ReactBitsButton";
import { getCompanyContests, getMyLiveInterviews } from "../api/contests";
import { listInterviews } from "../api/interviews";

export default function CompanyOverview() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [contests, setContests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const [contestRes, sessionRes, standaloneRes] = await Promise.all([
          getCompanyContests(token),
          getMyLiveInterviews(token),
          listInterviews(token),
        ]);
        setContests(contestRes.data || []);
        
        // Merge and normalize both types of sessions
        const liveSessions = sessionRes.data || [];
        const standaloneSessions = standaloneRes.data || [];
        
        const merged = [
          ...liveSessions.map(s => ({
            ...s,
            displayTitle: s.taskTitle || s.contestId?.title || "Live Interview",
            displayDate: s.scheduledStartTime ? new Date(s.scheduledStartTime) : null,
            roomUrl: `/contest/live/${s._id}`
          })),
          ...standaloneSessions.map(i => ({
            ...i,
            displayTitle: i.title,
            displayDate: i.schedule?.date ? new Date(`${i.schedule.date}T${i.schedule.startTime}:00+05:30`) : null,
            roomUrl: `/interview/room/${i.roomToken}`
          }))
        ].sort((a, b) => (a.displayDate || 0) - (b.displayDate || 0));

        setSessions(merged);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load company overview.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (loading) return <div className="app-card p-6">Loading company overview...</div>;
  if (error) return <div className="app-card p-6 border border-rose-500/40 bg-rose-500/10 text-rose-200">{error}</div>;

  const participants = contests.reduce((sum, c) => sum + (c.stats?.participants || 0), 0);
  const liveCount = sessions.filter((s) => s.status === "in_progress").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="app-section-title">Company Overview</h1>
        <p className="app-subtitle mt-1">Manage contests, interview sessions, and candidate flow.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Active Contests", value: contests.length, icon: Briefcase },
          { label: "Total Candidates", value: participants, icon: Users },
          { label: "Live Interviews", value: liveCount, icon: Video },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="app-card p-4">
              <div className="flex items-center justify-between mb-3">
                <Icon className="text-cyan-300" size={22} />
                <span className="text-2xl font-semibold text-white">{card.value}</span>
              </div>
              <p className="text-sm text-slate-300">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="app-card p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-white">Upcoming Sessions</h2>
          <ReactBitsButton variant="neutral" onClick={() => navigate("/contest?tab=live")}>View All</ReactBitsButton>
        </div>
        {sessions.length === 0 ? (
          <div className="app-empty">No live interviews scheduled yet.</div>
        ) : (
          <div className="space-y-3">
            {sessions.slice(0, 4).map((session) => (
              <div 
                key={session._id} 
                className="app-panel p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:border-indigo-500/30 transition-all"
                onClick={() => navigate(session.roomUrl)}
              >
                <div>
                  <div className="text-white font-semibold">{session.displayTitle}</div>
                  <div className="text-xs text-slate-400 capitalize">{session.status?.replace("_", " ")} - {session.interviewerName || (session.interviewer?.name)}</div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Calendar size={16} className="text-indigo-300" />
                  {session.displayDate ? session.displayDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : "TBD"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="app-card p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-white">Hiring Challenges</h2>
          <ReactBitsButton onClick={() => navigate("/contest?tab=company")}>Create Contest <ArrowRight size={16} /></ReactBitsButton>
        </div>
        {contests.length === 0 ? (
          <div className="app-empty">No contests created yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contests.slice(0, 4).map((contest) => (
              <div key={contest._id} className="app-panel p-4">
                <div className="text-white font-semibold">{contest.title}</div>
                <div className="text-xs text-slate-400">{contest.roleTitle}</div>
                <div className="mt-2 text-xs text-slate-300">
                  Participants {contest.stats?.participants || 0} - Submitted {contest.stats?.submitted || 0}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
