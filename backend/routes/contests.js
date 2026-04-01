const express = require("express");
const verifyToken = require("../middleware/auth");
const Contest = require("../models/Contest");
const ContestAttempt = require("../models/ContestAttempt");
const LiveInterviewSession = require("../models/LiveInterviewSession");
const User = require("../models/User");
const Submission = require("../models/Submission");
const questionsData = require("../data/questions.json");

const router = express.Router();

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeDomain = (domain) => String(domain || "").trim().toLowerCase();

const getEmailDomain = (email) => {
  const parts = String(email || "").split("@");
  return parts.length === 2 ? parts[1].toLowerCase() : "";
};

const now = () => new Date();

const isContestActive = (contest) => {
  const current = now();
  return contest.status === "published" && current >= new Date(contest.startsAt) && current <= new Date(contest.endsAt);
};

const extractQuestionPayload = (question) => ({
  questionId: Number(question.id),
  title: question.title,
  difficulty: String(question.difficulty || "medium").toLowerCase(),
  description: question.description || "",
  inputFormat: question.inputFormat || "",
  outputFormat: question.outputFormat || "",
  constraints: question.constraints || "",
});

const pickAssessmentQuestions = (contest) => {
  const totalQuestions = Math.max(1, toNumber(contest?.assessment?.totalQuestions, 3));
  const desiredSkills = Array.isArray(contest.skills)
    ? contest.skills.map((s) => String(s).trim().toLowerCase()).filter(Boolean)
    : [];

  const pool = Array.isArray(questionsData) ? questionsData : [];

  const matchBySkill = pool.filter((q) => {
    if (desiredSkills.length === 0) return true;
    const tags = Array.isArray(q.tags) ? q.tags.map((t) => String(t).toLowerCase()) : [];
    return desiredSkills.some((skill) => tags.some((tag) => tag.includes(skill) || skill.includes(tag)));
  });

  const source = matchBySkill.length > 0 ? matchBySkill : pool;
  if (source.length === 0) return [];

  const shuffled = [...source].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, totalQuestions).map(extractQuestionPayload);
};

const fallbackCompanySeeds = [
  {
    _id: "seed-swiggy",
    title: "Swiggy Backend Hiring Sprint",
    companyName: "Swiggy",
    roleTitle: "Software Engineer",
    skills: ["graphs", "dynamic-programming", "arrays"],
    assessment: { totalQuestions: 3 },
    status: "published",
  },
  {
    _id: "seed-uber",
    title: "Uber Marketplace Coding Round",
    companyName: "Uber",
    roleTitle: "Platform Engineer",
    skills: ["graphs", "heap", "greedy"],
    assessment: { totalQuestions: 3 },
    status: "published",
  },
  {
    _id: "seed-amazon",
    title: "Amazon Fulfillment Assessment",
    companyName: "Amazon",
    roleTitle: "SDE 1",
    skills: ["arrays", "binary-search", "dynamic-programming"],
    assessment: { totalQuestions: 3 },
    status: "published",
  },
  {
    _id: "seed-paytm",
    title: "Paytm Payments Challenge",
    companyName: "Paytm",
    roleTitle: "Backend Developer",
    skills: ["hashmap", "graphs", "strings"],
    assessment: { totalQuestions: 3 },
    status: "published",
  },
];

const companyThemePresets = [
  {
    keywords: ["swiggy", "zomato"],
    domain: "hyperlocal delivery",
    workload: "orders",
    network: "delivery zones",
    queue: "rider dispatch queues",
    catalog: "restaurant search results",
    schedule: "peak-hour slots",
    grid: "city heatmaps",
    hierarchy: "hub hierarchy",
  },
  {
    keywords: ["uber", "ola"],
    domain: "mobility dispatch",
    workload: "rides",
    network: "pickup clusters",
    queue: "driver matching queues",
    catalog: "pickup suggestions",
    schedule: "surge windows",
    grid: "coverage maps",
    hierarchy: "city dispatch hierarchy",
  },
  {
    keywords: ["amazon", "flipkart", "meesho"],
    domain: "fulfillment and logistics",
    workload: "shipments",
    network: "warehouses",
    queue: "packing queues",
    catalog: "catalog search results",
    schedule: "cutoff windows",
    grid: "warehouse grids",
    hierarchy: "inventory tree",
  },
  {
    keywords: ["paytm", "phonepe", "razorpay"],
    domain: "payments infrastructure",
    workload: "transactions",
    network: "merchant nodes",
    queue: "settlement queues",
    catalog: "merchant lookups",
    schedule: "settlement windows",
    grid: "risk matrices",
    hierarchy: "merchant hierarchy",
  },
  {
    keywords: ["google", "meta", "microsoft"],
    domain: "large-scale consumer platforms",
    workload: "requests",
    network: "service regions",
    queue: "serving queues",
    catalog: "search suggestions",
    schedule: "traffic windows",
    grid: "latency grids",
    hierarchy: "service dependency tree",
  },
];

const normalizeWords = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const prettifyTag = (value) =>
  String(value || "")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const readableList = (items) => {
  const clean = items.map((item) => String(item || "").trim()).filter(Boolean);
  if (clean.length <= 1) return clean[0] || "";
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")}, and ${clean[clean.length - 1]}`;
};

const matchesSkill = (tag, skill) => tag.includes(skill) || skill.includes(tag);

const questionDifficultyWeight = {
  hard: 3,
  medium: 2,
  easy: 1,
};

const scoreQuestionForContest = (question, desiredSkills = []) => {
  const tags = Array.isArray(question?.tags) ? question.tags.map((tag) => String(tag).toLowerCase()) : [];
  if (desiredSkills.length === 0) {
    return tags.length > 0 ? 1 : 0;
  }

  return desiredSkills.reduce((score, skill) => {
    const matched = tags.some((tag) => matchesSkill(tag, skill));
    return score + (matched ? 4 : 0);
  }, 0);
};

const pickCompanyPreviewQuestions = (contest, limit = 2) => {
  const desiredSkills = Array.isArray(contest?.skills)
    ? contest.skills.map((skill) => String(skill).trim().toLowerCase()).filter(Boolean)
    : [];

  const pool = Array.isArray(questionsData) ? questionsData : [];

  const ranked = pool
    .map((question, index) => {
      const difficulty = String(question?.difficulty || "medium").toLowerCase();
      return {
        question,
        index,
        score: scoreQuestionForContest(question, desiredSkills),
        difficultyWeight: questionDifficultyWeight[difficulty] || 1,
      };
    })
    .filter((entry) => desiredSkills.length === 0 || entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (right.difficultyWeight !== left.difficultyWeight) return right.difficultyWeight - left.difficultyWeight;
      return left.index - right.index;
    });

  const source = ranked.length > 0 ? ranked : pool.map((question, index) => ({ question, index, score: 0, difficultyWeight: 1 }));
  return source.slice(0, Math.max(1, limit)).map((entry) => entry.question);
};

const getCompanyTheme = (companyName = "") => {
  const normalized = normalizeWords(companyName);
  return (
    companyThemePresets.find((preset) => preset.keywords.some((keyword) => normalized.includes(keyword))) || {
      domain: "production systems",
      workload: "events",
      network: "service clusters",
      queue: "processing queues",
      catalog: "search results",
      schedule: "traffic windows",
      grid: "ops dashboards",
      hierarchy: "dependency tree",
    }
  );
};

const detectPattern = (tags = []) => {
  const normalized = tags.map((tag) => String(tag).toLowerCase());
  if (normalized.some((tag) => tag.includes("dynamic") || tag === "dp")) return "dp";
  if (normalized.some((tag) => ["graph", "breadth-first-search", "dfs", "union-find"].includes(tag))) return "graph";
  if (normalized.some((tag) => tag.includes("heap") || tag.includes("priority"))) return "priority";
  if (normalized.some((tag) => tag.includes("binary-search"))) return "binary-search";
  if (normalized.some((tag) => tag.includes("trie") || tag === "string")) return "search";
  if (normalized.some((tag) => tag.includes("tree"))) return "tree";
  if (normalized.some((tag) => tag.includes("stack"))) return "stack";
  if (normalized.some((tag) => tag.includes("matrix"))) return "matrix";
  if (normalized.some((tag) => tag.includes("linked-list"))) return "linked-list";
  if (normalized.some((tag) => tag.includes("greedy"))) return "greedy";
  return "array";
};

const buildProblemNarrative = ({ pattern, companyName, roleTitle, theme, baseQuestion }) => {
  switch (pattern) {
    case "dp":
      return {
        title: `Optimize ${theme.workload} across ${theme.schedule} for ${companyName}`,
        prompt: `You are working on ${companyName}'s ${theme.domain} stack as a ${roleTitle}. Each decision window carries a gain or penalty, and choices now change what remains possible later. Design the best strategy to maximize the total business impact under the operating constraints.`,
        interviewerLens: "This checks whether you slow down, define state clearly, and reason through transitions instead of rushing into brute force.",
      };
    case "graph":
      return {
        title: `Route ${theme.workload} efficiently across ${theme.network} for ${companyName}`,
        prompt: `Your team needs to move information or work items through a network of ${theme.network}. Find the shortest or most efficient way to connect the right nodes while honoring the rules in the prompt and scaling to production-sized inputs.`,
        interviewerLens: "Interviewers want to see if you can translate an operations network into graph primitives, then choose the right traversal or connectivity strategy.",
      };
    case "priority":
      return {
        title: `Prioritize ${theme.workload} inside ${companyName}'s ${theme.queue}`,
        prompt: `During a traffic spike, ${companyName} needs to decide which ${theme.workload} should be processed first. Build a scheduler that always chooses the most urgent or most valuable item fast enough for live production traffic.`,
        interviewerLens: "This reveals whether you recognize when ordered extraction matters more than repeated rescans of the entire dataset.",
      };
    case "binary-search":
      return {
        title: `Find the scaling threshold for ${companyName}'s ${theme.domain}`,
        prompt: `The platform team is tuning a control knob such as capacity, latency, or cutoff size. Determine the smallest or largest feasible threshold that keeps the system inside the required service-level target.`,
        interviewerLens: "Strong candidates notice the hidden monotonic property quickly and avoid linear simulation.",
      };
    case "search":
      return {
        title: `Improve ${companyName}'s ${theme.catalog} experience`,
        prompt: `You are building a smarter lookup path for ${theme.catalog}. Requests arrive in messy real-world form, but the system still needs to answer quickly and consistently at scale.`,
        interviewerLens: "This tests whether you can model lookup-heavy problems with the right structure instead of bolting logic onto repeated string scans.",
      };
    case "tree":
      return {
        title: `Analyze ${companyName}'s ${theme.hierarchy}`,
        prompt: `A critical decision depends on information spread across a hierarchy of services, managers, or locations. Traverse the structure efficiently and compute the requested result without duplicating work.`,
        interviewerLens: "Interviewers are looking for disciplined traversal choices, base cases, and clean propagation of partial results.",
      };
    case "stack":
      return {
        title: `Validate workflow transitions for ${companyName}`,
        prompt: `An internal workflow emits actions that must open, close, or reverse in the right order. Detect invalid sequences early and keep the logic robust even when the input stream becomes noisy.`,
        interviewerLens: "This checks whether you recognize nested structure and use a stack instead of complicated ad hoc branching.",
      };
    case "matrix":
      return {
        title: `Optimize coverage on ${companyName}'s ${theme.grid}`,
        prompt: `Operations data arrives as a two-dimensional view of the business. Compute the best path, region, or transformation while keeping both correctness and runtime under control.`,
        interviewerLens: "This shows whether you can spot grid invariants and avoid recomputing overlapping work.",
      };
    case "linked-list":
      return {
        title: `Rewire ${companyName}'s processing handoff chain`,
        prompt: `A processing pipeline hands work from one stage to the next. Reorder or repair the chain safely while preserving the required invariants and minimizing extra memory use.`,
        interviewerLens: "Interviewers use this to see if pointer updates stay precise when the data structure stops being index-friendly.",
      };
    case "greedy":
      return {
        title: `Make the best immediate dispatch choices for ${companyName}`,
        prompt: `You are tuning a system that repeatedly takes the locally best action. Decide whether a greedy rule is enough, prove the intuition through invariants, and implement it cleanly under contest constraints.`,
        interviewerLens: "This tests whether you can justify a greedy choice instead of relying on instinct alone.",
      };
    default:
      return {
        title: `Optimize ${theme.workload} signals for ${companyName}`,
        prompt: `You are analyzing a production stream of ${theme.workload} for ${companyName}. Transform the raw business wording into the right core data structure or invariant, then solve it within the required limits.`,
        interviewerLens: "This is mainly about spotting the underlying pattern early and reducing a real product scenario to a clean algorithmic core.",
      };
  }
};

const buildCompanyProblemCard = (contest, question, index = 0) => {
  const companyName = contest.companyName || "This company";
  const roleTitle = contest.roleTitle || "Software Engineer";
  const tags = Array.isArray(question?.tags) ? question.tags.map((tag) => String(tag).toLowerCase()) : [];
  const pattern = detectPattern(tags);
  const theme = getCompanyTheme(companyName);
  const narrative = buildProblemNarrative({
    pattern,
    companyName,
    roleTitle,
    theme,
    baseQuestion: question,
  });
  const difficulty = String(question?.difficulty || "medium").toLowerCase();
  const timeEstimateMinutes = difficulty === "hard" ? 50 : difficulty === "easy" ? 20 : 35;
  const focusAreas = (tags.length ? tags : contest.skills || []).slice(0, 4).map(prettifyTag);
  const skillSummary = readableList(focusAreas);

  return {
    id: `${contest._id || contest.companyName}-${question?.id || index}-${index}`,
    contestId: contest._id,
    contestTitle: contest.title,
    companyName,
    roleTitle,
    title: narrative.title,
    prompt: narrative.prompt,
    difficulty,
    timeEstimateMinutes,
    focusAreas,
    hiddenPattern: question?.title || "Classic DSA pattern",
    aiInsight: `AI insight: this is a company-flavored version of "${question?.title || "a core DSA problem"}". If you abstract the business story into ${skillSummary || "the right data structure"}, the implementation becomes much cleaner.`,
    interviewerLens: narrative.interviewerLens,
    sourceNote: `Generated from ${companyName}'s contest signal for ${roleTitle}.`,
  };
};

const computeProvisionalScore = (attempt, maxScore) => {
  const questions = Array.isArray(attempt.assessmentQuestions) ? attempt.assessmentQuestions : [];
  const answers = Array.isArray(attempt.answers) ? attempt.answers : [];
  if (questions.length === 0) return 0;

  const answeredCount = questions.reduce((count, q) => {
    const answer = answers.find((a) => Number(a.questionId) === Number(q.questionId));
    const hasCode = answer && String(answer.code || "").trim().length > 20;
    return count + (hasCode ? 1 : 0);
  }, 0);

  return Math.round((answeredCount / questions.length) * Math.max(1, toNumber(maxScore, 100)));
};

const getRemainingSeconds = (attempt) => {
  if (!attempt?.endsAt) return null;
  return Math.max(0, Math.floor((new Date(attempt.endsAt).getTime() - Date.now()) / 1000));
};

const buildEligibilityStats = async (userId) => {
  const [user, submissions] = await Promise.all([
    User.findById(userId).lean(),
    Submission.find({ userId }, { status: 1 }).lean(),
  ]);

  if (!user) {
    return null;
  }

  const solvedCount = (user.solvedQuestions || []).filter((q) => q.status === "solved").length;
  const totalSubs = submissions.length;
  const successSubs = submissions.filter((s) => s.status === "success").length;
  const successRate = totalSubs > 0 ? Math.round((successSubs / totalSubs) * 100) : 0;

  return {
    user,
    solvedCount,
    successRate,
    totalSubs,
  };
};

const evaluateEligibility = (contest, stats) => {
  const rules = contest.eligibility || {};
  const minSolvedQuestions = toNumber(rules.minSolvedQuestions, 0);
  const minSuccessRate = toNumber(rules.minSuccessRate, 0);
  const allowedDomains = Array.isArray(rules.allowedEmailDomains)
    ? rules.allowedEmailDomains.map(normalizeDomain).filter(Boolean)
    : [];

  const reasons = [];

  if (stats.solvedCount < minSolvedQuestions) reasons.push(`Requires at least ${minSolvedQuestions} solved questions`);
  if (stats.successRate < minSuccessRate) reasons.push(`Requires at least ${minSuccessRate}% submission success rate`);

  if (allowedDomains.length > 0) {
    const domain = getEmailDomain(stats.user.email);
    if (!allowedDomains.includes(domain)) reasons.push(`Email domain must be one of: ${allowedDomains.join(", ")}`);
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    stats: {
      solvedCount: stats.solvedCount,
      successRate: stats.successRate,
    },
  };
};

const enrichContestForUser = (contest, attempt) => {
  const contestObj = contest.toObject ? contest.toObject() : contest;
  const active = isContestActive(contestObj);

  return {
    ...contestObj,
    active,
    viewerAttempt: attempt
      ? {
          _id: attempt._id,
          status: attempt.status,
          joinedAt: attempt.joinedAt,
          startedAt: attempt.startedAt,
          endsAt: attempt.endsAt,
          submittedAt: attempt.submittedAt,
          score: attempt.score,
          feedback: attempt.feedback,
          remainingSeconds: getRemainingSeconds(attempt),
          answeredCount: Array.isArray(attempt.answers)
            ? attempt.answers.filter((a) => String(a.code || "").trim().length > 0).length
            : 0,
          totalQuestions: Array.isArray(attempt.assessmentQuestions) ? attempt.assessmentQuestions.length : 0,
        }
      : null,
  };
};

// Contest listing and management
router.get("/", verifyToken, async (req, res) => {
  try {
    const contests = await Contest.find({ status: { $in: ["published", "closed"] } }).sort({ startsAt: 1 }).lean();
    const contestIds = contests.map((c) => c._id);
    const attempts = await ContestAttempt.find({ userId: req.userId, contestId: { $in: contestIds } }).lean();
    const attemptByContest = new Map(attempts.map((a) => [String(a.contestId), a]));

    return res.json(contests.map((c) => enrichContestForUser(c, attemptByContest.get(String(c._id)))));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      title,
      companyName,
      description,
      roleTitle,
      skills = [],
      startsAt,
      endsAt,
      assessment = {},
      eligibility = {},
      status = "published",
    } = req.body;

    if (!title || !companyName || !description || !roleTitle || !startsAt || !endsAt) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return res.status(400).json({ message: "Invalid contest dates" });
    }
    if (startDate >= endDate) {
      return res.status(400).json({ message: "Contest end must be after start" });
    }

    const contest = await Contest.create({
      title,
      companyName,
      description,
      roleTitle,
      skills: Array.isArray(skills) ? skills : [],
      startsAt: startDate,
      endsAt: endDate,
      assessment: {
        durationMinutes: toNumber(assessment.durationMinutes, 60),
        totalQuestions: toNumber(assessment.totalQuestions, 3),
        instructions: assessment.instructions || "",
        maxScore: toNumber(assessment.maxScore, 100),
      },
      eligibility: {
        minSolvedQuestions: toNumber(eligibility.minSolvedQuestions, 0),
        minSuccessRate: toNumber(eligibility.minSuccessRate, 0),
        allowedEmailDomains: Array.isArray(eligibility.allowedEmailDomains)
          ? eligibility.allowedEmailDomains.map(normalizeDomain).filter(Boolean)
          : [],
      },
      status: ["draft", "published", "closed"].includes(status) ? status : "published",
      createdBy: req.userId,
    });

    return res.status(201).json(contest);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/company/mine", verifyToken, async (req, res) => {
  try {
    const contests = await Contest.find({ createdBy: req.userId }).sort({ createdAt: -1 }).lean();
    const contestIds = contests.map((c) => c._id);
    const attempts = await ContestAttempt.find({ contestId: { $in: contestIds } }).lean();

    const grouped = attempts.reduce((acc, attempt) => {
      const key = String(attempt.contestId);
      if (!acc[key]) acc[key] = { participants: 0, inProgress: 0, submitted: 0 };
      acc[key].participants += 1;
      if (attempt.status === "in_progress") acc[key].inProgress += 1;
      if (attempt.status === "submitted") acc[key].submitted += 1;
      return acc;
    }, {});

    return res.json(
      contests.map((contest) => ({
        ...contest,
        stats: grouped[String(contest._id)] || { participants: 0, inProgress: 0, submitted: 0 },
      }))
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/company/problems", verifyToken, async (req, res) => {
  try {
    const contests = await Contest.find({ status: "published" }).sort({ startsAt: 1, createdAt: -1 }).limit(8).lean();
    const sourceContests = contests.length > 0 ? contests : fallbackCompanySeeds;
    const problems = [];

    sourceContests.forEach((contest) => {
      const previewQuestions = pickCompanyPreviewQuestions(contest, contests.length > 0 ? 2 : 1);
      previewQuestions.forEach((question, index) => {
        problems.push(buildCompanyProblemCard(contest, question, index));
      });
    });

    return res.json(problems.slice(0, 8));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Candidate contest flow
router.post("/:contestId/join", verifyToken, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.contestId);
    if (!contest) return res.status(404).json({ message: "Contest not found" });
    if (contest.status !== "published") return res.status(400).json({ message: "Contest is not open for registration" });

    const stats = await buildEligibilityStats(req.userId);
    if (!stats) return res.status(404).json({ message: "User not found" });

    const eligibilityResult = evaluateEligibility(contest, stats);
    if (!eligibilityResult.eligible) {
      return res.status(400).json({ message: "Eligibility criteria not met", eligibility: eligibilityResult });
    }

    const attempt = await ContestAttempt.findOneAndUpdate(
      { contestId: contest._id, userId: req.userId },
      { $setOnInsert: { status: "registered", joinedAt: now() } },
      { new: true, upsert: true }
    );

    return res.json({ message: "Joined contest successfully", attempt, eligibility: eligibilityResult });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/:contestId/start", verifyToken, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.contestId);
    if (!contest) return res.status(404).json({ message: "Contest not found" });

    const current = now();
    if (current < new Date(contest.startsAt) || current > new Date(contest.endsAt)) {
      return res.status(400).json({ message: "Contest is not currently active" });
    }

    const attempt = await ContestAttempt.findOne({ contestId: contest._id, userId: req.userId });
    if (!attempt) return res.status(404).json({ message: "Join the contest before starting assessment" });
    if (attempt.status === "submitted") return res.status(400).json({ message: "Assessment already submitted" });
    if (attempt.status === "expired") return res.status(400).json({ message: "Assessment time window already expired" });

    if (attempt.status !== "in_progress") {
      const startedAt = now();
      const endsAt = new Date(startedAt.getTime() + contest.assessment.durationMinutes * 60 * 1000);

      if (!Array.isArray(attempt.assessmentQuestions) || attempt.assessmentQuestions.length === 0) {
        attempt.assessmentQuestions = pickAssessmentQuestions(contest);
      }

      attempt.status = "in_progress";
      attempt.startedAt = startedAt;
      attempt.endsAt = endsAt;
      await attempt.save();
    }

    return res.json({
      message: "Assessment started",
      attempt: {
        ...attempt.toObject(),
        remainingSeconds: getRemainingSeconds(attempt),
      },
      questions: attempt.assessmentQuestions || [],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/:contestId/assessment", verifyToken, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.contestId).lean();
    if (!contest) return res.status(404).json({ message: "Contest not found" });

    const attempt = await ContestAttempt.findOne({ contestId: contest._id, userId: req.userId }).lean();
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });

    if (attempt.status === "in_progress" && attempt.endsAt && new Date() > new Date(attempt.endsAt)) {
      await ContestAttempt.updateOne({ _id: attempt._id }, { $set: { status: "expired" } });
      attempt.status = "expired";
    }

    return res.json({
      contest: {
        _id: contest._id,
        title: contest.title,
        companyName: contest.companyName,
        roleTitle: contest.roleTitle,
        instructions: contest.assessment?.instructions || "",
        maxScore: contest.assessment?.maxScore || 100,
      },
      attempt: {
        _id: attempt._id,
        status: attempt.status,
        startedAt: attempt.startedAt,
        endsAt: attempt.endsAt,
        remainingSeconds: getRemainingSeconds(attempt),
        score: attempt.score,
      },
      questions: attempt.assessmentQuestions || [],
      answers: attempt.answers || [],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/:contestId/assessment/answer", verifyToken, async (req, res) => {
  try {
    const { questionId, code = "", notes = "", language = "javascript" } = req.body;
    if (!questionId) return res.status(400).json({ message: "questionId is required" });

    const attempt = await ContestAttempt.findOne({ contestId: req.params.contestId, userId: req.userId });
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (attempt.status !== "in_progress") return res.status(400).json({ message: "Assessment is not active" });

    if (attempt.endsAt && new Date() > new Date(attempt.endsAt)) {
      attempt.status = "expired";
      await attempt.save();
      return res.status(400).json({ message: "Assessment time limit exceeded" });
    }

    const qExists = (attempt.assessmentQuestions || []).some((q) => Number(q.questionId) === Number(questionId));
    if (!qExists) return res.status(400).json({ message: "Question does not belong to this assessment" });

    const idx = (attempt.answers || []).findIndex((a) => Number(a.questionId) === Number(questionId));
    const payload = {
      questionId: Number(questionId),
      language,
      code: String(code || ""),
      notes: String(notes || ""),
      updatedAt: new Date(),
    };

    if (idx >= 0) {
      attempt.answers[idx] = payload;
    } else {
      attempt.answers.push(payload);
    }

    await attempt.save();

    return res.json({
      message: "Answer saved",
      answer: payload,
      remainingSeconds: getRemainingSeconds(attempt),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/:contestId/submit", verifyToken, async (req, res) => {
  try {
    const { answersSummary = "", feedback = "" } = req.body;

    const contest = await Contest.findById(req.params.contestId);
    if (!contest) return res.status(404).json({ message: "Contest not found" });

    const attempt = await ContestAttempt.findOne({ contestId: contest._id, userId: req.userId });
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });

    if (attempt.status === "submitted") return res.status(400).json({ message: "Assessment already submitted" });
    if (!attempt.endsAt || !attempt.startedAt) return res.status(400).json({ message: "Start assessment before submitting" });

    if (new Date() > new Date(attempt.endsAt)) {
      attempt.status = "expired";
      await attempt.save();
      return res.status(400).json({ message: "Assessment time limit exceeded" });
    }

    attempt.status = "submitted";
    attempt.submittedAt = now();
    attempt.score = computeProvisionalScore(attempt, contest.assessment?.maxScore || 100);
    attempt.answersSummary = String(answersSummary || "").trim();
    attempt.feedback = String(feedback || "").trim();
    await attempt.save();

    return res.json({ message: "Assessment submitted successfully", attempt });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/me/attempts", verifyToken, async (req, res) => {
  try {
    const attempts = await ContestAttempt.find({ userId: req.userId })
      .populate("contestId", "title companyName roleTitle assessment startsAt endsAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.json(
      attempts.map((attempt) => ({
        ...attempt,
        remainingSeconds: attempt.status === "in_progress" ? getRemainingSeconds(attempt) : null,
      }))
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Live interview endpoints
router.post("/:contestId/live-interviews", verifyToken, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.contestId);
    if (!contest) return res.status(404).json({ message: "Contest not found" });
    if (String(contest.createdBy) !== String(req.userId)) {
      return res.status(403).json({ message: "Only contest organizer can create interview sessions" });
    }

    const {
      interviewerName,
      interviewerTitle = "",
      taskTitle,
      taskDescription,
      durationMinutes = 60,
      scheduledStartTime,
      invitedCandidateEmail = "",
      allowedLanguages = ["javascript", "python", "cpp", "java"],
    } = req.body;

    if (!interviewerName || !taskTitle || !taskDescription || !scheduledStartTime) {
      return res.status(400).json({ message: "Missing required interview fields including scheduled start time" });
    }

    let startTimeObj;
    if (String(scheduledStartTime).includes("+") || String(scheduledStartTime).includes("Z")) {
      startTimeObj = new Date(scheduledStartTime);
    } else {
      startTimeObj = new Date(`${scheduledStartTime}+05:30`);
    }

    if (Number.isNaN(startTimeObj.getTime())) {
      return res.status(400).json({ message: "Invalid scheduled start time" });
    }

    const session = await LiveInterviewSession.create({
      contestId: contest._id,
      companyUserId: req.userId,
      interviewerName,
      interviewerTitle,
      taskTitle,
      taskDescription,
      durationMinutes: toNumber(durationMinutes, 60),
      scheduledStartTime: startTimeObj,
      invitedCandidateEmail: String(invitedCandidateEmail || "").trim().toLowerCase(),
      allowedLanguages: Array.isArray(allowedLanguages) ? allowedLanguages : ["javascript", "python", "cpp", "java"],
    });

    return res.status(201).json(session);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/live-interviews/mine", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    const email = String(user?.email || "").toLowerCase();

    const sessions = await LiveInterviewSession.find({
      $or: [{ companyUserId: req.userId }, { candidateUserId: req.userId }, { invitedCandidateEmail: email }],
    })
      .populate("contestId", "title companyName roleTitle")
      .sort({ createdAt: -1 })
      .lean();

    return res.json(
      sessions.map((s) => ({
        ...s,
        aiChat: Array.isArray(s.aiChat) ? s.aiChat.slice(-50) : [],
        remainingSeconds:
          s.status === "in_progress" && s.endsAt
            ? Math.max(0, Math.floor((new Date(s.endsAt).getTime() - Date.now()) / 1000))
            : null,
        isOwner: String(s.companyUserId) === String(req.userId),
        isCandidate: s.candidateUserId ? String(s.candidateUserId) === String(req.userId) : false,
      }))
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/live-interviews/:sessionId/join", verifyToken, async (req, res) => {
  try {
    const session = await LiveInterviewSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: "Interview session not found" });

    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    if (session.scheduledStartTime) {
      const currentTime = Date.now();
      const startTime = new Date(session.scheduledStartTime).getTime();
      const durationMs = toNumber(session.durationMinutes, 60) * 60 * 1000;
      const endWindowTime = startTime + durationMs + durationMs; // Duration + Buffer (same as duration)

      if (currentTime < startTime) {
        return res.status(403).json({ message: "not_started" });
      }

      if (currentTime > endWindowTime) {
        return res.status(403).json({ message: "expired" });
      }
    }

    if (String(session.companyUserId) === String(req.userId)) {
      return res.status(400).json({ message: "Organizer cannot join as candidate" });
    }

    const email = String(user.email || "").toLowerCase();
    if (session.invitedCandidateEmail && session.invitedCandidateEmail !== email) {
      return res.status(403).json({ message: "This interview is assigned to another candidate" });
    }

    if (session.candidateUserId && String(session.candidateUserId) !== String(req.userId)) {
      return res.status(403).json({ message: "Candidate already assigned" });
    }

    session.candidateUserId = req.userId;
    await session.save();

    return res.json({ message: "Joined live interview", session });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/live-interviews/:sessionId/start", verifyToken, async (req, res) => {
  try {
    const session = await LiveInterviewSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: "Interview session not found" });

    if (String(session.companyUserId) !== String(req.userId)) {
      return res.status(403).json({ message: "Only interviewer can start this session" });
    }

    if (session.scheduledStartTime) {
      const currentTime = Date.now();
      const startTime = new Date(session.scheduledStartTime).getTime();
      const durationMs = toNumber(session.durationMinutes, 60) * 60 * 1000;
      const endWindowTime = startTime + durationMs + durationMs;

      if (currentTime < startTime) {
        return res.status(403).json({ message: "not_started" });
      }

      if (currentTime > endWindowTime) {
        return res.status(403).json({ message: "expired" });
      }
    }

    if (!session.candidateUserId) {
      return res.status(400).json({ message: "Candidate must join before session start" });
    }

    if (session.status !== "in_progress") {
      session.status = "in_progress";
      session.startsAt = now();
      session.endsAt = new Date(session.startsAt.getTime() + toNumber(session.durationMinutes, 60) * 60 * 1000);
      await session.save();
    }

    return res.json({ message: "Live interview started", session, remainingSeconds: getRemainingSeconds(session) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/live-interviews/:sessionId/update-code", verifyToken, async (req, res) => {
  try {
    const { code = "", notes = "" } = req.body;
    const session = await LiveInterviewSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: "Interview session not found" });

    if (!session.candidateUserId || String(session.candidateUserId) !== String(req.userId)) {
      return res.status(403).json({ message: "Only assigned candidate can update live solution" });
    }

    if (session.status !== "in_progress") {
      return res.status(400).json({ message: "Session is not in progress" });
    }

    if (session.endsAt && new Date() > new Date(session.endsAt)) {
      session.status = "completed";
      await session.save();
      return res.status(400).json({ message: "Session time is over" });
    }

    session.candidateCode = String(code || "");
    session.candidateNotes = String(notes || "");
    await session.save();

    return res.json({ message: "Live solution updated", session, remainingSeconds: getRemainingSeconds(session) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/live-interviews/:sessionId/complete", verifyToken, async (req, res) => {
  try {
    const { interviewerFeedback = "", interviewerRating = 0 } = req.body;
    const session = await LiveInterviewSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: "Interview session not found" });

    if (String(session.companyUserId) !== String(req.userId)) {
      return res.status(403).json({ message: "Only interviewer can complete this session" });
    }

    session.status = "completed";
    session.endsAt = session.endsAt || now();
    session.interviewerFeedback = String(interviewerFeedback || "").trim();
    session.interviewerRating = Math.max(0, Math.min(toNumber(interviewerRating, 0), 10));
    await session.save();

    return res.json({ message: "Live interview completed", session });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
