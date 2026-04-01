import React, { useEffect, useMemo, useState } from "react";
import { Briefcase, Building2, Calendar, Clock3, Filter, Lightbulb, ShieldCheck, Sparkles, Target, Users, Video } from "lucide-react";
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
  const token = localStorage.getItem("token");
  const userEmail = (localStorage.getItem("userEmail") || "").toLowerCase();
  const userRole = (localStorage.getItem("userRole") || "candidate").toLowerCase();
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

  const renderCandidateCompanyTab = () => (
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
    { id: "discover", label: "discover" },
    { id: "assessment", label: "assessment" },
    { id: "attempts", label: "attempts" },
    { id: "company", label: isCompanyUser ? "company" : "company lab" },
    { id: "live", label: "live" },
  ];

  return (
    <div className="min-h-screen bg-[#0b1220] p-6 text-white md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950 p-6">
          <h1 className="text-3xl font-bold text-cyan-300">Company Hiring Contests + Live Interviews</h1>
          <p className="mt-2 text-slate-300">Join contests, solve timed assessments, and practice with company-specific problem framing.</p>
        </div>
        <div className="mb-6 flex flex-wrap gap-3">{tabs.map((item) => <ReactBitsButton key={item.id} variant={tab === item.id ? "primary" : "neutral"} onClick={() => setTab(item.id)}>{item.label}</ReactBitsButton>)}</div>
        {message && <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-emerald-200">{message}</div>}
        {error && <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-rose-200">{error}</div>}

        {tab === "discover" && <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">{activeContests.map((contest) => {
          const attempt = contest.viewerAttempt;
          const loadingKey = actionLoadingId.includes(contest._id);
          return (
            <div key={contest._id} className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
              <h2 className="text-xl font-semibold text-cyan-200">{contest.title}</h2>
              <p className="mb-2 text-slate-400">{contest.companyName} | {contest.roleTitle}</p>
              <p className="mb-3 text-sm text-slate-300">{contest.description}</p>
              <div className="mb-4 space-y-1 text-xs text-slate-300">
                <div className="flex items-center gap-2"><Calendar size={14} className="text-cyan-400" />{formatDate(contest.startsAt)} - {formatDate(contest.endsAt)}</div>
                <div className="flex items-center gap-2"><Clock3 size={14} className="text-cyan-400" />{contest.assessment?.durationMinutes} min | {contest.assessment?.totalQuestions} questions</div>
                <div className="flex items-center gap-2"><Filter size={14} className="text-cyan-400" />solved = {contest.eligibility?.minSolvedQuestions || 0}, success = {contest.eligibility?.minSuccessRate || 0}%</div>
                <div className="flex items-center gap-2"><ShieldCheck size={14} className="text-cyan-400" />domains: {(contest.eligibility?.allowedEmailDomains || []).join(", ") || "Any"}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {!attempt && <ReactBitsButton loading={loadingKey} onClick={() => handleJoin(contest._id)}>Join</ReactBitsButton>}
                {attempt?.status === "registered" && <ReactBitsButton variant="success" loading={loadingKey} onClick={() => handleStartAssessment(contest._id)}>Start</ReactBitsButton>}
                {attempt?.status === "in_progress" && <><span className="rounded bg-amber-500/20 px-2 py-1 text-xs text-amber-200">{formatRemaining(attempt.remainingSeconds)}</span><ReactBitsButton variant="neutral" onClick={() => openAssessment(contest._id)}>Open</ReactBitsButton></>}
                {attempt?.status === "submitted" && <span className="rounded bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200">Submitted | {attempt.score ?? 0}</span>}
              </div>
            </div>
          );
        })}</div>}

        {tab === "assessment" && <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
          {!activeAssessment ? <div className="text-slate-300">Open an active assessment from the Discover tab.</div> : <>
            <div className="mb-4 flex flex-wrap justify-between gap-3">
              <div><h2 className="text-2xl font-semibold text-cyan-200">{activeAssessment.contest?.title}</h2><p className="text-slate-400">{activeAssessment.contest?.companyName} | {activeAssessment.contest?.roleTitle}</p></div>
              <div className="text-amber-300">{formatRemaining(activeAssessment.attempt?.remainingSeconds)}</div>
            </div>
            {(activeAssessment.questions || []).map((question, idx) => {
              const draft = answerDrafts[question.questionId] || { code: "", notes: "", language: "javascript" };
              return (
                <div key={question.questionId} className="mb-4 rounded-xl border border-slate-700 bg-slate-800/70 p-4">
                  <h3 className="mb-1 font-semibold text-cyan-100">Q{idx + 1}. {question.title}</h3>
                  <p className="mb-2 text-sm text-slate-300">{question.description}</p>
                  <select value={draft.language} onChange={(event) => setAnswerDrafts((prev) => ({ ...prev, [question.questionId]: { ...draft, language: event.target.value } }))} className="mb-2 rounded border border-slate-700 bg-slate-900 p-2">
                    <option value="javascript">JavaScript</option><option value="python">Python</option><option value="cpp">C++</option><option value="java">Java</option>
                  </select>
                  <textarea rows={7} className="mb-2 w-full rounded border border-slate-700 bg-slate-900 p-2 font-mono text-sm" value={draft.code} onChange={(event) => setAnswerDrafts((prev) => ({ ...prev, [question.questionId]: { ...draft, code: event.target.value } }))} placeholder="Write code..." />
                  <textarea rows={2} className="mb-2 w-full rounded border border-slate-700 bg-slate-900 p-2 text-sm" value={draft.notes} onChange={(event) => setAnswerDrafts((prev) => ({ ...prev, [question.questionId]: { ...draft, notes: event.target.value } }))} placeholder="Notes" />
                  <ReactBitsButton variant="neutral" loading={actionLoadingId === `save-${question.questionId}`} onClick={() => handleSaveAnswer(activeAssessment.contest._id, question.questionId)}>Save</ReactBitsButton>
                </div>
              );
            })}
            <ReactBitsButton variant="success" loading={actionLoadingId === "submit-assessment"} onClick={handleSubmitAssessment}>Submit Assessment</ReactBitsButton>
          </>}
        </div>}

        {tab === "attempts" && <div className="space-y-3">{myAttempts.map((attempt) => <div key={attempt._id} className="rounded-xl border border-slate-700 bg-slate-900 p-4"><h3 className="font-semibold text-cyan-200">{attempt.contestId?.title}</h3><p className="text-xs text-slate-400">{attempt.contestId?.companyName} | {attempt.status} | score {Number.isFinite(attempt.score) ? attempt.score : "-"}</p></div>)}</div>}
        {tab === "company" && (isCompanyUser ? renderCompanyOrganizerTab() : renderCandidateCompanyTab())}
        {tab === "live" && <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <form onSubmit={(event) => { event.preventDefault(); runLiveAction("create-live", async () => {
            if (!liveForm.contestId) throw new Error("Select a contest");
            await createLiveInterviewSession(liveForm.contestId, { interviewerName: liveForm.interviewerName, interviewerTitle: liveForm.interviewerTitle, taskTitle: liveForm.taskTitle, taskDescription: liveForm.taskDescription, scheduledStartTime: liveForm.scheduledStartTime, durationMinutes: Number(liveForm.durationMinutes), invitedCandidateEmail: liveForm.invitedCandidateEmail, allowedLanguages: liveForm.allowedLanguages.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean) }, token);
            setLiveForm(emptyLiveForm);
            setFlash("Live interview session created.");
          }); }} className="space-y-2 rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-cyan-200"><Video size={18} />Create Live Interview</h2>
            <select className="w-full rounded border border-slate-700 bg-slate-800 p-2" value={liveForm.contestId} onChange={(event) => setLiveForm((state) => ({ ...state, contestId: event.target.value }))}><option value="">Select contest</option>{companyContests.map((contest) => <option key={contest._id} value={contest._id}>{contest.title}</option>)}</select>
            <input className="w-full rounded border border-slate-700 bg-slate-800 p-2" placeholder="Interviewer" value={liveForm.interviewerName} onChange={(event) => setLiveForm((state) => ({ ...state, interviewerName: event.target.value }))} required />
            <input className="w-full rounded border border-slate-700 bg-slate-800 p-2" placeholder="Task title" value={liveForm.taskTitle} onChange={(event) => setLiveForm((state) => ({ ...state, taskTitle: event.target.value }))} required />
            <textarea className="w-full rounded border border-slate-700 bg-slate-800 p-2" placeholder="Task description" value={liveForm.taskDescription} onChange={(event) => setLiveForm((state) => ({ ...state, taskDescription: event.target.value }))} required />
            <div className="flex gap-4">
              <div className="flex-1"><label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Scheduled Start Time (IST)</label><input type="datetime-local" className="w-full rounded border border-slate-700 bg-slate-800 p-2" value={liveForm.scheduledStartTime} onChange={(event) => setLiveForm((state) => ({ ...state, scheduledStartTime: event.target.value }))} required /></div>
              <div className="flex-1"><label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Duration (Mins)</label><input type="number" min="1" className="w-full rounded border border-slate-700 bg-slate-800 p-2" value={liveForm.durationMinutes} onChange={(event) => setLiveForm((state) => ({ ...state, durationMinutes: event.target.value }))} required /></div>
            </div>
            <input className="w-full rounded border border-slate-700 bg-slate-800 p-2" placeholder="Candidate email" value={liveForm.invitedCandidateEmail} onChange={(event) => setLiveForm((state) => ({ ...state, invitedCandidateEmail: event.target.value }))} />
            <ReactBitsButton type="submit" variant="success" loading={actionLoadingId === "create-live"}>Create Session</ReactBitsButton>
          </form>
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <h2 className="mb-3 text-xl font-semibold text-cyan-200">Live Sessions</h2>
            {liveSessions.map((session) => {
              const draft = liveDrafts[session._id] || { code: session.candidateCode || "", notes: session.candidateNotes || "" };
              const canJoin = !session.candidateUserId && (!session.invitedCandidateEmail || session.invitedCandidateEmail === userEmail);
              return (
                <div key={session._id} className="mb-3 rounded border border-slate-700 bg-slate-800/70 p-3">
                  <div className="font-semibold text-cyan-100">{session.taskTitle}</div>
                  <div className="text-xs text-slate-400">{session.status} {session.remainingSeconds != null ? `| ${formatRemaining(session.remainingSeconds)}` : ""}</div>
                  <p className="mt-1 text-sm text-slate-300">{session.taskDescription}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {canJoin && <ReactBitsButton loading={actionLoadingId === `join-live-${session._id}`} onClick={() => runLiveAction(`join-live-${session._id}`, () => joinLiveInterview(session._id, token))}>Join</ReactBitsButton>}
                    {session.isOwner && session.status === "scheduled" && <ReactBitsButton variant="success" loading={actionLoadingId === `start-live-${session._id}`} onClick={() => runLiveAction(`start-live-${session._id}`, () => startLiveInterview(session._id, token))}>Start</ReactBitsButton>}
                  </div>
                  {session.isCandidate && session.status === "in_progress" && <div className="mt-2"><textarea rows={5} className="w-full rounded border border-slate-700 bg-slate-900 p-2 font-mono text-sm" value={draft.code} onChange={(event) => setLiveDrafts((prev) => ({ ...prev, [session._id]: { ...draft, code: event.target.value } }))} /><textarea rows={2} className="mt-2 w-full rounded border border-slate-700 bg-slate-900 p-2" value={draft.notes} onChange={(event) => setLiveDrafts((prev) => ({ ...prev, [session._id]: { ...draft, notes: event.target.value } }))} /><ReactBitsButton variant="neutral" loading={actionLoadingId === `update-live-${session._id}`} onClick={() => runLiveAction(`update-live-${session._id}`, () => updateLiveInterviewCode(session._id, draft, token))}>Save Progress</ReactBitsButton></div>}
                  {session.isOwner && session.status === "in_progress" && <div className="mt-2"><ReactBitsButton variant="success" loading={actionLoadingId === `complete-live-${session._id}`} onClick={() => runLiveAction(`complete-live-${session._id}`, () => completeLiveInterview(session._id, { interviewerFeedback: window.prompt("Feedback", "Good work") || "", interviewerRating: Number(window.prompt("Rating 0-10", "8") || 0) }, token))}>Complete</ReactBitsButton></div>}
                  {session.interviewerFeedback && <div className="mt-2 rounded border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-200">Feedback: {session.interviewerFeedback} | Rating {session.interviewerRating ?? 0}/10</div>}
                </div>
              );
            })}
          </div>
        </div>}
      </div>
    </div>
  );
}
