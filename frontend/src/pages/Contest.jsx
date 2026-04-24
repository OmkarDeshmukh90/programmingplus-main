/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect, useMemo, useState } from "react";

import { Briefcase, Building2, Calendar, Clock3, Filter, Lightbulb, ShieldCheck, Sparkles, Target, Users, Video, Code2 } from "lucide-react";
import ReactBitsButton from "../components/ui/ReactBitsButton";
import {
  completeLiveInterview,
  createContest,
  createLiveInterviewSession,
  getAssessment,
  getCompanyContests,
  getCompanyProblemIdeas,
  getContests,
  getMyContestAttempts,
  getMyLiveInterviews,
  joinContest,
  joinLiveInterview,
  saveAssessmentAnswer,
  startAssessment,
  startLiveInterview,
  submitAssessment,
  updateLiveInterviewCode,
} from "../api/contests";
import { AuthContext } from "../context/AuthContext";
import CompanyLab from "../components/CompanyLab";


const emptyContestForm = { title: "", companyName: "", roleTitle: "", description: "", skills: "", startsAt: "", endsAt: "", durationMinutes: 60, totalQuestions: 3, maxScore: 100, instructions: "", minSolvedQuestions: 0, minSuccessRate: 0, allowedEmailDomains: "" };
const emptyLiveForm = { contestId: "", interviewerName: "", interviewerTitle: "", taskTitle: "", taskDescription: "", scheduledStartTime: "", durationMinutes: 60, invitedCandidateEmail: "", allowedLanguages: "javascript,python,cpp,java" };
const difficultyTone = { easy: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200", medium: "border-amber-400/30 bg-amber-500/10 text-amber-200", hard: "border-rose-400/30 bg-rose-500/10 text-rose-200" };

const formatDate = (date) => {
  try { return new Date(date).toLocaleString(); } catch { return String(date || "-"); }
};

const formatRemaining = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "Time over";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs > 0 ? `${hrs}h ` : ""}${mins}m ${secs}s`;
};

const prettyDifficulty = (difficulty) => {
  const value = String(difficulty || "medium").toLowerCase();
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export default function Contest() {
  const { token, userEmail, role } = useContext(AuthContext);
  const userRole = (role || "candidate").toLowerCase();
  const isCompanyUser = userRole === "company";


  const [tab, setTab] = useState("discover");
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [contests, setContests] = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);
  const [companyContests, setCompanyContests] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [companyProblemIdeas, setCompanyProblemIdeas] = useState([]);
  const [companyFilter, setCompanyFilter] = useState("all");
  const [contestForm, setContestForm] = useState(emptyContestForm);
  const [liveForm, setLiveForm] = useState(emptyLiveForm);
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [answerDrafts, setAnswerDrafts] = useState({});
  const [liveDrafts, setLiveDrafts] = useState({});

  const setFlash = (msg, isError = false) => {
    setMessage(isError ? "" : msg);
    setError(isError ? msg : "");
  };

  const refresh = async () => {
    if (!token) {
      setError("Login required to access contests.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [contestRes, attemptsRes, companyRes, liveRes, companyIdeasRes] = await Promise.all([
        getContests(token),
        getMyContestAttempts(token),
        getCompanyContests(token),
        getMyLiveInterviews(token),
        getCompanyProblemIdeas(token).catch(() => ({ data: [] })),
      ]);
      setContests(contestRes.data || []);
      setMyAttempts(attemptsRes.data || []);
      setCompanyContests(companyRes.data || []);
      setLiveSessions(liveRes.data || []);
      setCompanyProblemIdeas(companyIdeasRes.data || []);
    } catch (err) {
      setFlash(err.response?.data?.message || "Failed to load contest data", true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const activeContests = useMemo(() => contests.filter((contest) => contest.status === "published"), [contests]);
  const companyFilters = useMemo(() => ["all", ...new Set(companyProblemIdeas.map((idea) => idea.companyName).filter(Boolean))], [companyProblemIdeas]);
  const filteredCompanyProblems = useMemo(() => companyFilter === "all" ? companyProblemIdeas : companyProblemIdeas.filter((idea) => idea.companyName === companyFilter), [companyFilter, companyProblemIdeas]);

  useEffect(() => {
    if (companyFilter !== "all" && !companyFilters.includes(companyFilter)) setCompanyFilter("all");
  }, [companyFilter, companyFilters]);

  const openAssessment = async (contestId) => {
    try {
      const res = await getAssessment(contestId, token);
      setActiveAssessment(res.data);
      const drafts = {};
      (res.data.answers || []).forEach((answer) => {
        drafts[answer.questionId] = { code: answer.code || "", notes: answer.notes || "", language: answer.language || "javascript" };
      });
      setAnswerDrafts(drafts);
      setTab("assessment");
    } catch (err) {
      setFlash(err.response?.data?.message || "Unable to open assessment", true);
    }
  };

  const handleJoin = async (contestId) => {
    setActionLoadingId(`join-${contestId}`);
    try {
      await joinContest(contestId, token);
      setFlash("Joined contest successfully.");
      await refresh();
    } catch (err) {
      const reasons = err.response?.data?.eligibility?.reasons;
      const suffix = Array.isArray(reasons) && reasons.length ? ` (${reasons.join("; ")})` : "";
      setFlash((err.response?.data?.message || "Unable to join contest") + suffix, true);
    } finally {
      setActionLoadingId("");
    }
  };

  const handleStartAssessment = async (contestId) => {
    setActionLoadingId(`start-${contestId}`);
    try {
      await startAssessment(contestId, token);
      setFlash("Assessment started.");
      await refresh();
      await openAssessment(contestId);
    } catch (err) {
      setFlash(err.response?.data?.message || "Unable to start assessment", true);
    } finally {
      setActionLoadingId("");
    }
  };

  const handleSaveAnswer = async (contestId, questionId) => {
    const draft = answerDrafts[questionId] || { code: "", notes: "", language: "javascript" };
    setActionLoadingId(`save-${questionId}`);
    try {
      await saveAssessmentAnswer(contestId, { questionId, ...draft }, token);
      setFlash(`Saved answer for Q${questionId}`);
    } catch (err) {
      setFlash(err.response?.data?.message || "Failed to save answer", true);
    } finally {
      setActionLoadingId("");
    }
  };

  const handleSubmitAssessment = async () => {
    if (!activeAssessment) return;
    setActionLoadingId("submit-assessment");
    try {
      await submitAssessment(activeAssessment.contest._id, { answersSummary: "Submitted from workspace" }, token);
      setFlash("Assessment submitted successfully.");
      await refresh();
      await openAssessment(activeAssessment.contest._id);
    } catch (err) {
      setFlash(err.response?.data?.message || "Failed to submit assessment", true);
    } finally {
      setActionLoadingId("");
    }
  };

  const handleCreateContest = async (event) => {
    event.preventDefault();
    setActionLoadingId("create-contest");
    try {
      await createContest({ title: contestForm.title, companyName: contestForm.companyName, roleTitle: contestForm.roleTitle, description: contestForm.description, startsAt: contestForm.startsAt, endsAt: contestForm.endsAt, skills: contestForm.skills.split(",").map((item) => item.trim()).filter(Boolean), assessment: { durationMinutes: Number(contestForm.durationMinutes), totalQuestions: Number(contestForm.totalQuestions), maxScore: Number(contestForm.maxScore), instructions: contestForm.instructions }, eligibility: { minSolvedQuestions: Number(contestForm.minSolvedQuestions), minSuccessRate: Number(contestForm.minSuccessRate), allowedEmailDomains: contestForm.allowedEmailDomains.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean) } }, token);
      setContestForm(emptyContestForm);
      setFlash("Contest published successfully.");
      await refresh();
    } catch (err) {
      setFlash(err.response?.data?.message || "Failed to create contest", true);
    } finally {
      setActionLoadingId("");
    }
  };

  const runLiveAction = async (loadingKey, fn) => {
    setActionLoadingId(loadingKey);
    try { await fn(); await refresh(); } catch (err) { setFlash(err.response?.data?.message || err.message || "Action failed", true); } finally { setActionLoadingId(""); }
  };

  const renderCandidateCompanyTab = () => (<CompanyLab />);

  const _renderCandidateCompanyTabOld = () => (
    <div className="space-y-6">
      <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
              <Sparkles size={14} />
              Company-Specific AI Problem Lab
            </div>
            <h2 className="text-2xl font-semibold text-white md:text-3xl">Practice DSA the way interviewers actually frame it.</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300 md:text-base">
              These prompts are generated from company and role context, so instead of textbook wording you get practical,
              industry-style scenarios that still test core DSA patterns.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4"><div className="text-xs uppercase tracking-[0.18em] text-slate-400">Companies</div><div className="mt-2 text-2xl font-bold text-cyan-200">{companyFilters.length - 1 || 0}</div></div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4"><div className="text-xs uppercase tracking-[0.18em] text-slate-400">Generated Problems</div><div className="mt-2 text-2xl font-bold text-white">{companyProblemIdeas.length}</div></div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4"><div className="text-xs uppercase tracking-[0.18em] text-slate-400">Best For</div><div className="mt-2 text-sm font-semibold text-amber-200">Practical candidate prep</div></div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {companyFilters.map((company) => (
          <ReactBitsButton key={company} variant={companyFilter === company ? "primary" : "neutral"} onClick={() => setCompanyFilter(company)}>
            {company === "all" ? "All Companies" : company}
          </ReactBitsButton>
        ))}
      </div>
      {filteredCompanyProblems.length === 0 ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-300">No company-specific problems yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {filteredCompanyProblems.map((idea) => (
            <div key={idea.id} className="rounded-3xl border border-slate-700 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.14),_transparent_36%),linear-gradient(180deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.98))] p-6">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200"><Building2 size={14} />{idea.companyName}</span>
                <span className="rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-xs text-slate-300">{idea.roleTitle}</span>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${difficultyTone[idea.difficulty] || difficultyTone.medium}`}>{prettyDifficulty(idea.difficulty)}</span>
                <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-200">AI generated</span>
              </div>
              <h3 className="text-2xl font-semibold text-white">{idea.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{idea.prompt}</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4"><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-200"><Target size={16} />What This Really Tests</div><p className="text-sm leading-6 text-slate-300">{idea.interviewerLens}</p></div>
                <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4"><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-200"><Lightbulb size={16} />AI Insight</div><p className="text-sm leading-6 text-slate-300">{idea.aiInsight}</p></div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">{(idea.focusAreas || []).map((tag) => <span key={`${idea.id}-${tag}`} className="rounded-full border border-slate-600 bg-slate-900 px-3 py-1 text-xs text-slate-200">{tag}</span>)}</div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4 text-sm text-slate-400"><span>{idea.sourceNote}</span><span>{idea.timeEstimateMinutes} min practice</span></div>
              <div className="mt-3 rounded-2xl border border-slate-700 bg-slate-950/80 p-4"><div className="text-xs uppercase tracking-[0.18em] text-slate-500">Hidden DSA Pattern</div><div className="mt-2 text-sm font-medium text-slate-200">{idea.hiddenPattern}</div></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCompanyOrganizerTab = () => (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <form onSubmit={handleCreateContest} className="space-y-2 rounded-2xl border border-slate-700 bg-slate-900 p-5">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-cyan-200"><Briefcase size={18} />Organize Hiring Contest</h2>
        <input className="w-full rounded border border-slate-700 bg-slate-800 p-2" placeholder="Title" value={contestForm.title} onChange={(event) => setContestForm((state) => ({ ...state, title: event.target.value }))} required />
        <input className="w-full rounded border border-slate-700 bg-slate-800 p-2" placeholder="Company" value={contestForm.companyName} onChange={(event) => setContestForm((state) => ({ ...state, companyName: event.target.value }))} required />
        <input className="w-full rounded border border-slate-700 bg-slate-800 p-2" placeholder="Role" value={contestForm.roleTitle} onChange={(event) => setContestForm((state) => ({ ...state, roleTitle: event.target.value }))} required />
        <textarea className="w-full rounded border border-slate-700 bg-slate-800 p-2" placeholder="Description" value={contestForm.description} onChange={(event) => setContestForm((state) => ({ ...state, description: event.target.value }))} required />
        <input className="w-full rounded border border-slate-700 bg-slate-800 p-2" placeholder="Skills" value={contestForm.skills} onChange={(event) => setContestForm((state) => ({ ...state, skills: event.target.value }))} />
        <div className="grid grid-cols-2 gap-2">
          <input type="datetime-local" className="rounded border border-slate-700 bg-slate-800 p-2" value={contestForm.startsAt} onChange={(event) => setContestForm((state) => ({ ...state, startsAt: event.target.value }))} required />
          <input type="datetime-local" className="rounded border border-slate-700 bg-slate-800 p-2" value={contestForm.endsAt} onChange={(event) => setContestForm((state) => ({ ...state, endsAt: event.target.value }))} required />
        </div>
        <div className="grid grid-cols-4 gap-2">
          <input type="number" className="rounded border border-slate-700 bg-slate-800 p-2" value={contestForm.durationMinutes} onChange={(event) => setContestForm((state) => ({ ...state, durationMinutes: event.target.value }))} />
          <input type="number" className="rounded border border-slate-700 bg-slate-800 p-2" value={contestForm.totalQuestions} onChange={(event) => setContestForm((state) => ({ ...state, totalQuestions: event.target.value }))} />
          <input type="number" className="rounded border border-slate-700 bg-slate-800 p-2" value={contestForm.maxScore} onChange={(event) => setContestForm((state) => ({ ...state, maxScore: event.target.value }))} />
          <input type="number" className="rounded border border-slate-700 bg-slate-800 p-2" value={contestForm.minSolvedQuestions} onChange={(event) => setContestForm((state) => ({ ...state, minSolvedQuestions: event.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" className="rounded border border-slate-700 bg-slate-800 p-2" value={contestForm.minSuccessRate} onChange={(event) => setContestForm((state) => ({ ...state, minSuccessRate: event.target.value }))} />
          <input className="rounded border border-slate-700 bg-slate-800 p-2" placeholder="Allowed domains" value={contestForm.allowedEmailDomains} onChange={(event) => setContestForm((state) => ({ ...state, allowedEmailDomains: event.target.value }))} />
        </div>
        <textarea className="w-full rounded border border-slate-700 bg-slate-800 p-2" placeholder="Instructions" value={contestForm.instructions} onChange={(event) => setContestForm((state) => ({ ...state, instructions: event.target.value }))} />
        <ReactBitsButton type="submit" variant="success" loading={actionLoadingId === "create-contest"}>Publish Contest</ReactBitsButton>
      </form>
      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-cyan-200"><Users size={18} />My Contests</h2>
        {companyContests.length === 0 ? <div className="text-sm text-slate-400">You have not published any contests yet.</div> : companyContests.map((contest) => (
          <div key={contest._id} className="mb-2 rounded border border-slate-700 bg-slate-800/70 p-3">
            <div className="font-semibold text-cyan-100">{contest.title}</div>
            <div className="text-xs text-slate-400">participants {contest.stats?.participants || 0} | submitted {contest.stats?.submitted || 0}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) return <div className="min-h-screen bg-[#0b1220] p-8 text-white">Loading contests...</div>;

  const tabs = [
    { id: "discover", label: "Discover Contests" },
    { id: "assessment", label: "My Assessment" },
    { id: "attempts", label: "Past Attempts" },
    { id: "lab", label: "Company Lab" },
    ...(isCompanyUser ? [
      { id: "company", label: "Manage Company" },
      { id: "live", label: "Live Interviews" }
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-[#020202] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(34,211,238,0.15),rgba(255,255,255,0))] p-6 text-white md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 relative overflow-hidden rounded-3xl border border-cyan-500/20 p-8 lg:p-12 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0b1220] to-[#041c26]"></div>
          <div className="absolute -right-20 -top-20 h-[300px] w-[300px] rounded-full bg-cyan-500/10 blur-[100px]"></div>
          <div className="absolute left-10 bottom-10 h-[200px] w-[200px] rounded-full bg-emerald-500/10 blur-[80px]"></div>
          <div className="relative z-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-300">
              <Target size={14} /> Challenge Center
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
              Company Hiring <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Contests</span>
            </h1>
            <p className="max-w-2xl text-base md:text-lg text-slate-400 leading-relaxed">
              Compete in active hiring assessments, experience live interview environments, and practice industry-style algorithms tailored to top tech companies.
            </p>
          </div>
        </div>
        <div className="mb-8 inline-flex flex-wrap items-center gap-2 rounded-full border border-white/5 bg-white/[0.02] p-1.5 backdrop-blur-md">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`relative px-6 py-2.5 text-sm font-bold uppercase tracking-widest rounded-full transition-all duration-300 ${tab === item.id
                  ? "bg-cyan-500 text-slate-900 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {message && <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200"><ShieldCheck size={18} />{message}</div>}
        {error && <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-rose-200">{error}</div>}

        {tab === "discover" && <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">{activeContests.map((contest) => {
            const attempt = contest.viewerAttempt;
            const loadingKey = actionLoadingId.includes(contest._id);
            return (
              <div key={contest._id} className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-7 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] transition-all duration-300 group backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -right-10 -top-10 p-4 opacity-5 group-hover:opacity-[0.15] group-hover:rotate-12 transition-all duration-500 blur-sm group-hover:blur-none"><Building2 size={160} className="text-cyan-300" /></div>
                <div className="relative z-10">
                  <h2 className="text-2xl font-extrabold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-blue-400 transition-all line-clamp-1 tracking-tight">{contest.title}</h2>
                  <div className="mt-3 inline-flex items-center rounded-full bg-cyan-500/10 px-4 py-1.5 text-xs font-bold text-cyan-300 border border-cyan-500/20 shadow-inner">
                    <Building2 size={14} className="mr-2"/>
                    {contest.companyName} <span className="opacity-50 mx-2">•</span> {contest.roleTitle}
                  </div>
                  <p className="mt-5 text-sm leading-relaxed text-slate-300 line-clamp-2 h-10 font-medium">{contest.description}</p>
                  <div className="mt-6 grid grid-cols-2 gap-3 text-xs font-bold text-slate-300">
                    <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] p-3 border border-white/5 shadow-inner group-hover:border-white/10 transition-colors"><Calendar size={14} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />{formatDate(contest.startsAt).split(',')[0]}</div>
                    <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] p-3 border border-white/5 shadow-inner group-hover:border-white/10 transition-colors"><Clock3 size={14} className="text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]" />{contest.assessment?.durationMinutes} min</div>
                    <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] p-3 border border-white/5 shadow-inner group-hover:border-white/10 transition-colors"><Filter size={14} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />{contest.eligibility?.minSuccessRate || 0}% Req</div>
                    <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] p-3 border border-white/5 shadow-inner group-hover:border-white/10 transition-colors"><ShieldCheck size={14} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />{(contest.eligibility?.allowedEmailDomains || []).length ? "Restricted" : "Open"}</div>
                  </div>
                  <div className="mt-7 flex flex-wrap gap-3">
                    {!attempt && <button className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3.5 font-black text-white hover:from-cyan-400 hover:to-blue-500 hover:scale-[1.02] hover:-translate-y-0.5 transition-all shadow-[0_8px_20px_rgba(34,211,238,0.3)] border border-cyan-400/50" onClick={() => handleJoin(contest._id)}>Join Contest</button>}
                    {attempt?.status === "registered" && <button className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3.5 font-black text-white hover:from-emerald-400 hover:to-teal-400 hover:scale-[1.02] hover:-translate-y-0.5 shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition-all border border-emerald-400/50" onClick={() => handleStartAssessment(contest._id)}>Start Assessment</button>}
                    {attempt?.status === "in_progress" && <><div className="flex items-center justify-center rounded-xl bg-amber-500/10 px-5 text-sm font-black text-amber-400 border border-amber-500/30 shadow-inner">{formatRemaining(attempt.remainingSeconds)}</div><button className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-3.5 font-black text-white hover:from-cyan-400 hover:to-blue-400 hover:scale-[1.02] hover:-translate-y-0.5 transition-all shadow-[0_8px_20px_rgba(34,211,238,0.3)]" onClick={() => openAssessment(contest._id)}>Resume</button></>}
                    {attempt?.status === "submitted" && <div className="flex-1 rounded-xl bg-emerald-500/10 py-3.5 text-center font-black text-emerald-400 border border-emerald-500/30 shadow-inner">Submitted — Score: {attempt.score ?? 0}</div>}
                  </div>
                </div>
              </div>
            );
          })}</div>

          {/* External Global Hackathons Section */}
          <div className="mt-16 mb-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2"><Sparkles size={20} className="text-amber-400" /> Global Hackathons & Competitions</h2>
                <p className="text-sm text-slate-400 mt-1">Participate in world-class events recognized by top tech companies.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[
                { name: "MLH Global Hack Week: GenAI", host: "Major League Hacking", date: "May 8 - 14, 2026", type: "100% Online", link: "https://mlh.io", bg: "from-blue-600/20 to-indigo-600/20", border: "border-blue-500/30" },
                { name: "Google Cloud AI Hackathon", host: "Devpost", date: "Ongoing", type: "Global Online", link: "https://devpost.com/hackathons", bg: "from-amber-600/20 to-orange-600/20", border: "border-amber-500/30" },
                { name: "ETHGlobal Online", host: "ETHGlobal", date: "Coming Soon", type: "Async Virtual", link: "https://devfolio.co", bg: "from-emerald-600/20 to-teal-600/20", border: "border-emerald-500/30" }
              ].map((hack, i) => (
                <div key={i} className={`relative overflow-hidden rounded-3xl border ${hack.border} bg-gradient-to-br ${hack.bg} p-6 shadow-xl`}>
                  <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm z-0"></div>
                  <div className="relative z-10">
                    <div className="inline-flex items-center rounded-lg bg-white/10 px-3 py-1 text-xs font-bold text-white mb-3 backdrop-blur-md border border-white/5">
                      {hack.host}
                    </div>
                    <h3 className="text-xl font-black text-white leading-tight mb-2">{hack.name}</h3>
                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 mb-6">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {hack.date}</span>
                      <span className="flex items-center gap-1"><Target size={12} /> {hack.type}</span>
                    </div>
                    <a href={hack.link} target="_blank" rel="noopener noreferrer" className="block w-full text-center rounded-xl bg-white/10 py-3 font-black text-white hover:bg-white/20 transition-all border border-white/10 shadow-lg">
                      Visit Platform
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>}

        {tab === "assessment" && <div className="rounded-3xl border border-white/5 bg-[#0d0d0d] p-6 lg:p-10 shadow-2xl">
          {!activeAssessment ? <div className="text-slate-400 font-medium text-center py-12">Open an active assessment from the Discover tab to begin.</div> : <>
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-8">
              <div>
                <h2 className="text-3xl lg:text-4xl font-black text-white">{activeAssessment.contest?.title}</h2>
                <div className="mt-3 inline-flex items-center rounded-lg bg-white/[0.03] px-3 py-1 text-sm font-semibold text-slate-300 border border-white/5">
                  <Building2 size={14} className="mr-2 text-cyan-400" /> {activeAssessment.contest?.companyName} <span className="text-slate-600 px-2">•</span> {activeAssessment.contest?.roleTitle}
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-amber-500/10 px-5 py-3 text-lg font-black text-amber-400 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                <Clock3 size={20} /> {formatRemaining(activeAssessment.attempt?.remainingSeconds)}
              </div>
            </div>
            {(activeAssessment.questions || []).map((question, idx) => {
              const draft = answerDrafts[question.questionId] || { code: "", notes: "", language: "javascript" };
              return (
                <div key={question.questionId} className="mb-6 rounded-3xl border border-white/5 bg-[#111] p-6 lg:p-8 shadow-lg">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 font-black border border-cyan-500/20 text-lg">
                      {idx + 1}
                    </div>
                    <div className="pt-1">
                      <h3 className="text-xl font-bold text-white">{question.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-400">{question.description}</p>
                    </div>
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code2 size={16} className="text-cyan-400" />
                        <select value={draft.language} onChange={(event) => setAnswerDrafts((prev) => ({ ...prev, [question.questionId]: { ...draft, language: event.target.value } }))} className="rounded-lg border border-white/10 bg-[#050505] px-4 py-2 text-sm font-semibold text-slate-200 outline-none focus:border-cyan-500/50 cursor-pointer transition-colors">
                          <option value="javascript">JavaScript</option><option value="python">Python</option><option value="cpp">C++</option><option value="java">Java</option>
                        </select>
                      </div>
                    </div>
                    <textarea rows={8} className="w-full rounded-2xl border border-white/10 bg-[#050505] p-5 font-mono text-sm text-slate-300 outline-none focus:border-cyan-500/50 transition-colors" value={draft.code} onChange={(event) => setAnswerDrafts((prev) => ({ ...prev, [question.questionId]: { ...draft, code: event.target.value } }))} placeholder="// Write your solution..." spellCheck={false} />
                    <textarea rows={2} className="w-full rounded-2xl border border-white/10 bg-[#050505] p-5 text-sm text-slate-300 outline-none focus:border-cyan-500/50 transition-colors" value={draft.notes} onChange={(event) => setAnswerDrafts((prev) => ({ ...prev, [question.questionId]: { ...draft, notes: event.target.value } }))} placeholder="Explain your approach (optional)..." />
                    <div className="flex justify-end pt-2">
                      <button className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 font-bold text-white hover:bg-white/10 hover:border-white/20 transition-all" disabled={actionLoadingId === `save-${question.questionId}`} onClick={() => handleSaveAnswer(activeAssessment.contest._id, question.questionId)}>
                        {actionLoadingId === `save-${question.questionId}` ? "Saving..." : "Save Draft"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="mt-10 flex justify-end border-t border-white/5 pt-8">
              <button className="rounded-xl bg-emerald-500 px-8 py-3.5 font-black text-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] hover:bg-emerald-400 transition-all" disabled={actionLoadingId === "submit-assessment"} onClick={handleSubmitAssessment}>
                {actionLoadingId === "submit-assessment" ? "Submitting..." : "Submit Assessment"}
              </button>
            </div>
          </>}
        </div>}

        {tab === "attempts" && <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {myAttempts.length === 0 ? <div className="col-span-full rounded-3xl border border-white/5 bg-[#0d0d0d] p-12 text-center text-slate-400 font-medium">You haven't participated in any contests yet.</div> : myAttempts.map((attempt) => (
            <div key={attempt._id} className="relative overflow-hidden rounded-3xl border border-white/5 bg-[#0d0d0d] p-7 shadow-xl hover:border-white/10 transition-colors">
              <div className="absolute -right-4 -top-4 p-4 opacity-[0.02]"><Building2 size={100} /></div>
              <h3 className="relative z-10 text-xl font-black text-white leading-tight">{attempt.contestId?.title || "Unknown Contest"}</h3>
              <div className="relative z-10 mt-3 inline-flex items-center rounded-lg bg-white/[0.03] px-3 py-1 text-xs font-semibold text-slate-400 border border-white/5">
                {attempt.contestId?.companyName || "N/A"}
              </div>
              <div className="relative z-10 mt-8 flex items-end justify-between border-t border-white/5 pt-5">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</div>
                  <div className={`text-sm font-bold ${attempt.status === 'submitted' ? 'text-emerald-400' : 'text-amber-400'}`}>{attempt.status}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Score</div>
                  <div className="text-2xl font-black text-cyan-400">{Number.isFinite(attempt.score) ? `${attempt.score}` : "-"}</div>
                </div>
              </div>
            </div>
          ))}
        </div>}
        {tab === "lab" && renderCandidateCompanyTab()}
        {tab === "company" && isCompanyUser && renderCompanyOrganizerTab()}
        {tab === "live" && <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <form onSubmit={(event) => {
            event.preventDefault(); runLiveAction("create-live", async () => {
              if (!liveForm.contestId) throw new Error("Select a contest");
              await createLiveInterviewSession(liveForm.contestId, { interviewerName: liveForm.interviewerName, interviewerTitle: liveForm.interviewerTitle, taskTitle: liveForm.taskTitle, taskDescription: liveForm.taskDescription, scheduledStartTime: liveForm.scheduledStartTime, durationMinutes: Number(liveForm.durationMinutes), invitedCandidateEmail: liveForm.invitedCandidateEmail, allowedLanguages: liveForm.allowedLanguages.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean) }, token);
              setLiveForm(emptyLiveForm);
              setFlash("Live interview session created.");
            });
          }} className="space-y-4 rounded-3xl border border-white/5 bg-[#0d0d0d] p-8 shadow-2xl">
            <h2 className="flex items-center gap-3 text-2xl font-black text-cyan-300 mb-6"><Video size={24} />Create Live Interview</h2>
            <select className="w-full rounded-xl border border-white/10 bg-[#050505] p-3 text-white outline-none focus:border-cyan-500/50 transition-colors" value={liveForm.contestId} onChange={(event) => setLiveForm((state) => ({ ...state, contestId: event.target.value }))}><option value="">Select contest</option>{companyContests.map((contest) => <option key={contest._id} value={contest._id}>{contest.title}</option>)}</select>
            <input className="w-full rounded-xl border border-white/10 bg-[#050505] p-3 text-white outline-none focus:border-cyan-500/50 transition-colors" placeholder="Interviewer" value={liveForm.interviewerName} onChange={(event) => setLiveForm((state) => ({ ...state, interviewerName: event.target.value }))} required />
            <input className="w-full rounded-xl border border-white/10 bg-[#050505] p-3 text-white outline-none focus:border-cyan-500/50 transition-colors" placeholder="Task title" value={liveForm.taskTitle} onChange={(event) => setLiveForm((state) => ({ ...state, taskTitle: event.target.value }))} required />
            <textarea className="w-full rounded-xl border border-white/10 bg-[#050505] p-3 text-white outline-none focus:border-cyan-500/50 transition-colors" placeholder="Task description" value={liveForm.taskDescription} onChange={(event) => setLiveForm((state) => ({ ...state, taskDescription: event.target.value }))} required rows={3} />
            <div className="flex gap-4">
              <div className="flex-1"><label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Start Time</label><input type="datetime-local" className="w-full rounded-xl border border-white/10 bg-[#050505] p-3 text-white outline-none focus:border-cyan-500/50 transition-colors" value={liveForm.scheduledStartTime} onChange={(event) => setLiveForm((state) => ({ ...state, scheduledStartTime: event.target.value }))} required /></div>
              <div className="flex-1"><label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Duration (Min)</label><input type="number" min="1" className="w-full rounded-xl border border-white/10 bg-[#050505] p-3 text-white outline-none focus:border-cyan-500/50 transition-colors" value={liveForm.durationMinutes} onChange={(event) => setLiveForm((state) => ({ ...state, durationMinutes: event.target.value }))} required /></div>
            </div>
            <div><label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Candidate Email</label><input className="w-full rounded-xl border border-white/10 bg-[#050505] p-3 text-white outline-none focus:border-cyan-500/50 transition-colors" placeholder="invited@example.com" value={liveForm.invitedCandidateEmail} onChange={(event) => setLiveForm((state) => ({ ...state, invitedCandidateEmail: event.target.value }))} /></div>
            <button type="submit" className="w-full rounded-xl bg-cyan-500 py-3.5 font-black text-slate-900 hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] mt-4">
              {actionLoadingId === "create-live" ? "Creating..." : "Create Session"}
            </button>
          </form>
          <div className="rounded-3xl border border-white/5 bg-[#0d0d0d] p-8 shadow-2xl">
            <h2 className="mb-6 flex items-center gap-2 text-2xl font-black text-white"><Calendar size={24} className="text-cyan-400" /> Live Sessions</h2>
            {liveSessions.length === 0 ? <div className="text-center text-slate-500 py-10 font-medium">No active or scheduled sessions.</div> : liveSessions.map((session) => {
              const draft = liveDrafts[session._id] || { code: session.candidateCode || "", notes: session.candidateNotes || "" };
              const canJoin = !session.candidateUserId && (!session.invitedCandidateEmail || session.invitedCandidateEmail === userEmail);
              return (
                <div key={session._id} className="mb-4 rounded-2xl border border-white/5 bg-[#111] p-5 hover:border-white/10 transition-colors shadow-lg">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                    <div className="font-bold text-cyan-100 truncate">{session.taskTitle}</div>
                    <div className="flex shrink-0 items-center gap-2 text-xs font-semibold">
                      <span className={`${session.status === 'in_progress' ? 'text-amber-400 bg-amber-400/10' : 'text-emerald-400 bg-emerald-400/10'} px-2 py-1 rounded-md border border-current`}>{session.status}</span>
                      {session.remainingSeconds != null && <span className="text-amber-400 flex items-center gap-1"><Clock3 size={12} />{formatRemaining(session.remainingSeconds)}</span>}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-slate-400 line-clamp-2 leading-relaxed">{session.taskDescription}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {canJoin && <button className="rounded-xl border border-white/10 bg-white/5 px-6 py-2 font-bold text-white hover:bg-white/10 transition-all" onClick={() => runLiveAction(`join-live-${session._id}`, () => joinLiveInterview(session._id, token))}>{actionLoadingId === `join-live-${session._id}` ? "..." : "Join"}</button>}
                    {session.isOwner && session.status === "scheduled" && <button className="rounded-xl bg-emerald-500 px-6 py-2 font-bold text-slate-900 hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]" onClick={() => runLiveAction(`start-live-${session._id}`, () => startLiveInterview(session._id, token))}>{actionLoadingId === `start-live-${session._id}` ? "..." : "Start"}</button>}
                  </div>
                  {session.isCandidate && session.status === "in_progress" && <div className="mt-4 space-y-3"><textarea rows={5} className="w-full rounded-xl border border-white/10 bg-[#050505] p-4 font-mono text-sm text-slate-300 outline-none focus:border-cyan-500/50" value={draft.code} onChange={(event) => setLiveDrafts((prev) => ({ ...prev, [session._id]: { ...draft, code: event.target.value } }))} placeholder="Write code here..." /><textarea rows={2} className="w-full rounded-xl border border-white/10 bg-[#050505] p-3 text-sm text-slate-300 outline-none focus:border-cyan-500/50" value={draft.notes} onChange={(event) => setLiveDrafts((prev) => ({ ...prev, [session._id]: { ...draft, notes: event.target.value } }))} placeholder="Notes..." /><button className="rounded-xl border border-white/10 bg-white/5 px-6 py-2 font-bold text-white hover:bg-white/10 transition-all" onClick={() => runLiveAction(`update-live-${session._id}`, () => updateLiveInterviewCode(session._id, draft, token))}>{actionLoadingId === `update-live-${session._id}` ? "Saving..." : "Save Progress"}</button></div>}
                  {session.isOwner && session.status === "in_progress" && <div className="mt-4"><button className="rounded-xl bg-emerald-500 px-6 py-2 font-bold text-slate-900 hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]" onClick={() => runLiveAction(`complete-live-${session._id}`, () => completeLiveInterview(session._id, { interviewerFeedback: window.prompt("Feedback", "Good work") || "", interviewerRating: Number(window.prompt("Rating 0-10", "8") || 0) }, token))}>{actionLoadingId === `complete-live-${session._id}` ? "..." : "Complete"}</button></div>}
                  {session.interviewerFeedback && <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200"><span className="font-bold">Feedback:</span> {session.interviewerFeedback} <br /><span className="font-bold mt-1 inline-block">Rating:</span> {session.interviewerRating ?? 0}/10</div>}
                </div>
              );
            })}
          </div>
        </div>}
      </div>
    </div>
  );
}
