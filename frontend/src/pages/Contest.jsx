import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Calendar, Clock3, Filter, ShieldCheck, Users, Video } from "lucide-react";
import ReactBitsButton from "../components/ui/ReactBitsButton";
import {
  completeLiveInterview,
  createContest,
  createLiveInterviewSession,
  getAssessment,
  getCompanyContests,
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

const emptyContestForm = {
  title: "",
  companyName: "",
  roleTitle: "",
  description: "",
  skills: "",
  startsAt: "",
  endsAt: "",
  durationMinutes: 60,
  totalQuestions: 3,
  maxScore: 100,
  instructions: "",
  minSolvedQuestions: 0,
  minSuccessRate: 0,
  allowedEmailDomains: "",
};

const emptyLiveForm = {
  contestId: "",
  interviewerName: "",
  interviewerTitle: "",
  taskTitle: "",
  taskDescription: "",
  durationMinutes: 60,
  invitedCandidateEmail: "",
  allowedLanguages: "javascript,python,cpp,java",
};

const formatDate = (date) => {
  try {
    return new Date(date).toLocaleString();
  } catch {
    return String(date || "-");
  }
};

const formatRemaining = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "Time over";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs > 0 ? `${hrs}h ` : ""}${mins}m ${secs}s`;
};

export default function Contest() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userEmail = (localStorage.getItem("userEmail") || "").toLowerCase();

  const [tab, setTab] = useState("discover");
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [contests, setContests] = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);
  const [companyContests, setCompanyContests] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);

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
      const [contestRes, attemptsRes, companyRes, liveRes] = await Promise.all([
        getContests(token),
        getMyContestAttempts(token),
        getCompanyContests(token),
        getMyLiveInterviews(token),
      ]);
      setContests(contestRes.data || []);
      setMyAttempts(attemptsRes.data || []);
      setCompanyContests(companyRes.data || []);
      setLiveSessions(liveRes.data || []);
    } catch (err) {
      setFlash(err.response?.data?.message || "Failed to load contest data", true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const activeContests = useMemo(() => contests.filter((c) => c.status === "published"), [contests]);

  const openAiHint = (title, description) => {
    const context = encodeURIComponent(`${title}\n${description}`);
    navigate(`/ai-chat?mode=hint&context=${context}`);
  };

  const openAssessment = async (contestId) => {
    try {
      const res = await getAssessment(contestId, token);
      setActiveAssessment(res.data);
      const drafts = {};
      (res.data.answers || []).forEach((a) => {
        drafts[a.questionId] = { code: a.code || "", notes: a.notes || "", language: a.language || "javascript" };
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

  const handleCreateContest = async (e) => {
    e.preventDefault();
    setActionLoadingId("create-contest");
    try {
      await createContest(
        {
          title: contestForm.title,
          companyName: contestForm.companyName,
          roleTitle: contestForm.roleTitle,
          description: contestForm.description,
          startsAt: contestForm.startsAt,
          endsAt: contestForm.endsAt,
          skills: contestForm.skills.split(",").map((x) => x.trim()).filter(Boolean),
          assessment: {
            durationMinutes: Number(contestForm.durationMinutes),
            totalQuestions: Number(contestForm.totalQuestions),
            maxScore: Number(contestForm.maxScore),
            instructions: contestForm.instructions,
          },
          eligibility: {
            minSolvedQuestions: Number(contestForm.minSolvedQuestions),
            minSuccessRate: Number(contestForm.minSuccessRate),
            allowedEmailDomains: contestForm.allowedEmailDomains.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean),
          },
        },
        token
      );
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
    try {
      await fn();
      await refresh();
    } catch (err) {
      setFlash(err.response?.data?.message || "Action failed", true);
    } finally {
      setActionLoadingId("");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0b1220] text-white p-8">Loading contests...</div>;

  return (
    <div className="min-h-screen bg-[#0b1220] text-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950 p-6">
          <h1 className="text-3xl font-bold text-cyan-300">Company Hiring Contests + Live Interviews</h1>
          <p className="text-slate-300 mt-2">Join criteria-based contests, solve timed assessments, and participate in interviewer-led live rounds.</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          {["discover", "assessment", "attempts", "company", "live"].map((item) => (
            <ReactBitsButton key={item} variant={tab === item ? "primary" : "neutral"} onClick={() => setTab(item)}>
              {item}
            </ReactBitsButton>
          ))}
        </div>

        {message && <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-emerald-200">{message}</div>}
        {error && <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-rose-200">{error}</div>}
        {tab === "discover" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {activeContests.map((contest) => {
              const attempt = contest.viewerAttempt;
              const loadingKey = actionLoadingId.includes(contest._id);
              return (
                <div key={contest._id} className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
                  <h2 className="text-xl font-semibold text-cyan-200">{contest.title}</h2>
                  <p className="text-slate-400 mb-2">{contest.companyName} • {contest.roleTitle}</p>
                  <p className="text-sm text-slate-300 mb-3">{contest.description}</p>
                  <div className="space-y-1 text-xs text-slate-300 mb-4">
                    <div className="flex items-center gap-2"><Calendar size={14} className="text-cyan-400" /> {formatDate(contest.startsAt)} - {formatDate(contest.endsAt)}</div>
                    <div className="flex items-center gap-2"><Clock3 size={14} className="text-cyan-400" /> {contest.assessment?.durationMinutes} min • {contest.assessment?.totalQuestions} questions</div>
                    <div className="flex items-center gap-2"><Filter size={14} className="text-cyan-400" /> solved = {contest.eligibility?.minSolvedQuestions || 0}, success = {contest.eligibility?.minSuccessRate || 0}%</div>
                    <div className="flex items-center gap-2"><ShieldCheck size={14} className="text-cyan-400" /> domains: {(contest.eligibility?.allowedEmailDomains || []).join(", ") || "Any"}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!attempt && <ReactBitsButton loading={loadingKey} onClick={() => handleJoin(contest._id)}>Join</ReactBitsButton>}
                    {attempt?.status === "registered" && <ReactBitsButton variant="success" loading={loadingKey} onClick={() => handleStartAssessment(contest._id)}>Start</ReactBitsButton>}
                    {attempt?.status === "in_progress" && (
                      <>
                        <span className="text-xs bg-amber-500/20 text-amber-200 px-2 py-1 rounded">{formatRemaining(attempt.remainingSeconds)}</span>
                        <ReactBitsButton variant="neutral" onClick={() => openAssessment(contest._id)}>Open</ReactBitsButton>
                      </>
                    )}
                    {attempt?.status === "submitted" && <span className="text-xs bg-emerald-500/20 text-emerald-200 px-2 py-1 rounded">Submitted • {attempt.score ?? 0}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "assessment" && (
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
            {!activeAssessment ? (
              <div className="text-slate-300">Open an active assessment from Discover tab.</div>
            ) : (
              <>
                <div className="flex flex-wrap justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-cyan-200">{activeAssessment.contest?.title}</h2>
                    <p className="text-slate-400">{activeAssessment.contest?.companyName} • {activeAssessment.contest?.roleTitle}</p>
                  </div>
                  <div className="text-amber-300">{formatRemaining(activeAssessment.attempt?.remainingSeconds)}</div>
                </div>
                {(activeAssessment.questions || []).map((q, idx) => {
                  const draft = answerDrafts[q.questionId] || { code: "", notes: "", language: "javascript" };
                  return (
                    <div key={q.questionId} className="rounded-xl border border-slate-700 bg-slate-800/70 p-4 mb-4">
                      <h3 className="font-semibold text-cyan-100 mb-1">Q{idx + 1}. {q.title}</h3>
                      <p className="text-sm text-slate-300 mb-2">{q.description}</p>
                      <select value={draft.language} onChange={(e) => setAnswerDrafts((p) => ({ ...p, [q.questionId]: { ...draft, language: e.target.value } }))} className="rounded bg-slate-900 border border-slate-700 p-2 mb-2">
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="cpp">C++</option>
                        <option value="java">Java</option>
                      </select>
                      <textarea rows={7} className="w-full rounded bg-slate-900 border border-slate-700 p-2 font-mono text-sm mb-2" value={draft.code} onChange={(e) => setAnswerDrafts((p) => ({ ...p, [q.questionId]: { ...draft, code: e.target.value } }))} placeholder="Write code..." />
                      <textarea rows={2} className="w-full rounded bg-slate-900 border border-slate-700 p-2 text-sm mb-2" value={draft.notes} onChange={(e) => setAnswerDrafts((p) => ({ ...p, [q.questionId]: { ...draft, notes: e.target.value } }))} placeholder="Notes" />
                      <div className="flex gap-2 flex-wrap">
                        <ReactBitsButton variant="neutral" loading={actionLoadingId === `save-${q.questionId}`} onClick={() => handleSaveAnswer(activeAssessment.contest._id, q.questionId)}>Save</ReactBitsButton>
                        <ReactBitsButton onClick={() => openAiHint(q.title, q.description)}>Ask AI Hint</ReactBitsButton>
                      </div>
                    </div>
                  );
                })}
                <ReactBitsButton variant="success" loading={actionLoadingId === "submit-assessment"} onClick={handleSubmitAssessment}>Submit Assessment</ReactBitsButton>
              </>
            )}
          </div>
        )}

        {tab === "attempts" && (
          <div className="space-y-3">
            {myAttempts.map((a) => (
              <div key={a._id} className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                <h3 className="text-cyan-200 font-semibold">{a.contestId?.title}</h3>
                <p className="text-xs text-slate-400">{a.contestId?.companyName} • {a.status} • score {Number.isFinite(a.score) ? a.score : "-"}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "company" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={handleCreateContest} className="rounded-2xl border border-slate-700 bg-slate-900 p-5 space-y-2">
              <h2 className="text-xl font-semibold text-cyan-200 flex items-center gap-2"><Briefcase size={18} /> Organize Hiring Contest</h2>
              <input className="w-full rounded bg-slate-800 border border-slate-700 p-2" placeholder="Title" value={contestForm.title} onChange={(e) => setContestForm((s) => ({ ...s, title: e.target.value }))} required />
              <input className="w-full rounded bg-slate-800 border border-slate-700 p-2" placeholder="Company" value={contestForm.companyName} onChange={(e) => setContestForm((s) => ({ ...s, companyName: e.target.value }))} required />
              <input className="w-full rounded bg-slate-800 border border-slate-700 p-2" placeholder="Role" value={contestForm.roleTitle} onChange={(e) => setContestForm((s) => ({ ...s, roleTitle: e.target.value }))} required />
              <textarea className="w-full rounded bg-slate-800 border border-slate-700 p-2" placeholder="Description" value={contestForm.description} onChange={(e) => setContestForm((s) => ({ ...s, description: e.target.value }))} required />
              <input className="w-full rounded bg-slate-800 border border-slate-700 p-2" placeholder="Skills" value={contestForm.skills} onChange={(e) => setContestForm((s) => ({ ...s, skills: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2"><input type="datetime-local" className="rounded bg-slate-800 border border-slate-700 p-2" value={contestForm.startsAt} onChange={(e) => setContestForm((s) => ({ ...s, startsAt: e.target.value }))} required /><input type="datetime-local" className="rounded bg-slate-800 border border-slate-700 p-2" value={contestForm.endsAt} onChange={(e) => setContestForm((s) => ({ ...s, endsAt: e.target.value }))} required /></div>
              <div className="grid grid-cols-4 gap-2"><input type="number" className="rounded bg-slate-800 border border-slate-700 p-2" value={contestForm.durationMinutes} onChange={(e) => setContestForm((s) => ({ ...s, durationMinutes: e.target.value }))} /><input type="number" className="rounded bg-slate-800 border border-slate-700 p-2" value={contestForm.totalQuestions} onChange={(e) => setContestForm((s) => ({ ...s, totalQuestions: e.target.value }))} /><input type="number" className="rounded bg-slate-800 border border-slate-700 p-2" value={contestForm.maxScore} onChange={(e) => setContestForm((s) => ({ ...s, maxScore: e.target.value }))} /><input type="number" className="rounded bg-slate-800 border border-slate-700 p-2" value={contestForm.minSolvedQuestions} onChange={(e) => setContestForm((s) => ({ ...s, minSolvedQuestions: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-2"><input type="number" className="rounded bg-slate-800 border border-slate-700 p-2" value={contestForm.minSuccessRate} onChange={(e) => setContestForm((s) => ({ ...s, minSuccessRate: e.target.value }))} /><input className="rounded bg-slate-800 border border-slate-700 p-2" placeholder="Allowed domains" value={contestForm.allowedEmailDomains} onChange={(e) => setContestForm((s) => ({ ...s, allowedEmailDomains: e.target.value }))} /></div>
              <textarea className="w-full rounded bg-slate-800 border border-slate-700 p-2" placeholder="Instructions" value={contestForm.instructions} onChange={(e) => setContestForm((s) => ({ ...s, instructions: e.target.value }))} />
              <ReactBitsButton type="submit" variant="success" loading={actionLoadingId === "create-contest"}>Publish Contest</ReactBitsButton>
            </form>
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5"><h2 className="text-xl font-semibold text-cyan-200 flex items-center gap-2 mb-3"><Users size={18} /> My Contests</h2>{companyContests.map((c) => <div key={c._id} className="rounded border border-slate-700 bg-slate-800/70 p-3 mb-2"><div className="font-semibold text-cyan-100">{c.title}</div><div className="text-xs text-slate-400">participants {c.stats?.participants || 0} • submitted {c.stats?.submitted || 0}</div></div>)}</div>
          </div>
        )}

        {tab === "live" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={(e) => {e.preventDefault(); runLiveAction("create-live", async () => {
              if (!liveForm.contestId) throw new Error("Select a contest");
              await createLiveInterviewSession(liveForm.contestId, {
                interviewerName: liveForm.interviewerName,
                interviewerTitle: liveForm.interviewerTitle,
                taskTitle: liveForm.taskTitle,
                taskDescription: liveForm.taskDescription,
                durationMinutes: Number(liveForm.durationMinutes),
                invitedCandidateEmail: liveForm.invitedCandidateEmail,
                allowedLanguages: liveForm.allowedLanguages.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean),
              }, token);
              setLiveForm(emptyLiveForm);
              setFlash("Live interview session created.");
            }); }} className="rounded-2xl border border-slate-700 bg-slate-900 p-5 space-y-2">
              <h2 className="text-xl font-semibold text-cyan-200 flex items-center gap-2"><Video size={18} /> Create Live Interview</h2>
              <select className="w-full rounded bg-slate-800 border border-slate-700 p-2" value={liveForm.contestId} onChange={(e) => setLiveForm((s) => ({ ...s, contestId: e.target.value }))}><option value="">Select contest</option>{companyContests.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}</select>
              <input className="w-full rounded bg-slate-800 border border-slate-700 p-2" placeholder="Interviewer" value={liveForm.interviewerName} onChange={(e) => setLiveForm((s) => ({ ...s, interviewerName: e.target.value }))} required />
              <input className="w-full rounded bg-slate-800 border border-slate-700 p-2" placeholder="Task title" value={liveForm.taskTitle} onChange={(e) => setLiveForm((s) => ({ ...s, taskTitle: e.target.value }))} required />
              <textarea className="w-full rounded bg-slate-800 border border-slate-700 p-2" placeholder="Task description" value={liveForm.taskDescription} onChange={(e) => setLiveForm((s) => ({ ...s, taskDescription: e.target.value }))} required />
              <input className="w-full rounded bg-slate-800 border border-slate-700 p-2" placeholder="Candidate email" value={liveForm.invitedCandidateEmail} onChange={(e) => setLiveForm((s) => ({ ...s, invitedCandidateEmail: e.target.value }))} />
              <ReactBitsButton type="submit" variant="success" loading={actionLoadingId === "create-live"}>Create Session</ReactBitsButton>
            </form>
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5"><h2 className="text-xl font-semibold text-cyan-200 mb-3">Live Sessions</h2>{liveSessions.map((s) => {const draft = liveDrafts[s._id] || { code: s.candidateCode || "", notes: s.candidateNotes || "" }; const canJoin = !s.candidateUserId && (!s.invitedCandidateEmail || s.invitedCandidateEmail === userEmail); return <div key={s._id} className="rounded border border-slate-700 bg-slate-800/70 p-3 mb-3"><div className="font-semibold text-cyan-100">{s.taskTitle}</div><div className="text-xs text-slate-400">{s.status} {s.remainingSeconds != null ? `• ${formatRemaining(s.remainingSeconds)}` : ""}</div><p className="text-sm text-slate-300 mt-1">{s.taskDescription}</p><div className="flex gap-2 flex-wrap mt-2">{canJoin && <ReactBitsButton loading={actionLoadingId === `join-live-${s._id}`} onClick={() => runLiveAction(`join-live-${s._id}`, () => joinLiveInterview(s._id, token))}>Join</ReactBitsButton>}{s.isOwner && s.status === "scheduled" && <ReactBitsButton variant="success" loading={actionLoadingId === `start-live-${s._id}`} onClick={() => runLiveAction(`start-live-${s._id}`, () => startLiveInterview(s._id, token))}>Start</ReactBitsButton>}<ReactBitsButton onClick={() => openAiHint(s.taskTitle, s.taskDescription)}>Ask AI Hint</ReactBitsButton></div>{s.isCandidate && s.status === "in_progress" && <div className="mt-2"><textarea rows={5} className="w-full rounded bg-slate-900 border border-slate-700 p-2 font-mono text-sm" value={draft.code} onChange={(e) => setLiveDrafts((p) => ({ ...p, [s._id]: { ...draft, code: e.target.value } }))} /><textarea rows={2} className="w-full rounded bg-slate-900 border border-slate-700 p-2 mt-2" value={draft.notes} onChange={(e) => setLiveDrafts((p) => ({ ...p, [s._id]: { ...draft, notes: e.target.value } }))} /><ReactBitsButton variant="neutral" loading={actionLoadingId === `update-live-${s._id}`} onClick={() => runLiveAction(`update-live-${s._id}`, () => updateLiveInterviewCode(s._id, draft, token))}>Save Progress</ReactBitsButton></div>}{s.isOwner && s.status === "in_progress" && <div className="mt-2"><ReactBitsButton variant="success" loading={actionLoadingId === `complete-live-${s._id}`} onClick={() => runLiveAction(`complete-live-${s._id}`, () => completeLiveInterview(s._id, { interviewerFeedback: window.prompt("Feedback", "Good work") || "", interviewerRating: Number(window.prompt("Rating 0-10", "8") || 0) }, token))}>Complete</ReactBitsButton></div>}{s.interviewerFeedback && <div className="mt-2 text-xs text-emerald-200 bg-emerald-500/10 border border-emerald-500/30 rounded p-2">Feedback: {s.interviewerFeedback} • Rating {s.interviewerRating ?? 0}/10</div>}</div>})}</div>
          </div>
        )}
      </div>
    </div>
  );
}

