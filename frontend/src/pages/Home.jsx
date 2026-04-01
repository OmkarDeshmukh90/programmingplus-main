import React from "react";
import { Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { BookOpen, Code2, Brain, Trophy, Target, Hourglass, Video, FileSpreadsheet } from "lucide-react";
import ReactBitsButton from "../components/ui/ReactBitsButton";

const highlights = [
  {
    title: "Structured Learning",
    description: "Follow curated DSA paths that build fundamentals, speed, and interview fluency.",
  },
  {
    title: "Contest + Hiring Flow",
    description: "Compete in role-based assessments and move into real-time interview sessions.",
  },
  {
    title: "AI Assistant Everywhere",
    description: "Guided hints, study plans, and interview prep without giving away full code.",
  },
];

const metrics = [
  { value: "120+", label: "Practice problems" },
  { value: "25+", label: "Hiring partners" },
  { value: "8K+", label: "Community learners" },
  { value: "92%", label: "Completion satisfaction" },
];

const testimonials = [
  {
    name: "Anika - Candidate",
    quote: "The AI hints feel like a mentor without spoiling the solution. Huge confidence boost.",
  },
  {
    name: "Rohan - Recruiter",
    quote: "We can watch real-time code and AI guidance together. The signal quality is strong.",
  },
  {
    name: "Sam - Student",
    quote: "Learning paths + contests in one place finally made my prep consistent.",
  },
];

const learnerPathSteps = [
  { label: "Foundations", icon: BookOpen, desc: "Language basics & syntax" },
  { label: "Core DSA", icon: Code2, desc: "Data structures & algorithms" },
  { label: "Advanced Patterns", icon: Brain, desc: "Complex problem solving techniques" },
  { label: "Mock Interviews", icon: Trophy, desc: "Simulated peer & AI assessments" },
];

const candidateChallengeSteps = [
  { label: "Eligibility screening", icon: Target, desc: "Role-specific criteria & prerequisites" },
  { label: "Timed assessments", icon: Hourglass, desc: "Live coding contests & quizzes" },
  { label: "Live interviews", icon: Video, desc: "Real-time technical evaluation" },
  { label: "Feedback summary", icon: FileSpreadsheet, desc: "Detailed performance & action steps" },
];

export default function Home() {
  return (
    <div className="app-page">
      <div className="relative overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-96 w-[680px] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-[140px]" />
        <div className="absolute -bottom-40 right-10 h-96 w-96 rounded-full bg-cyan-600/15 blur-[140px]" />

        <motion.section 
          className="max-w-6xl mx-auto px-6 pt-28 pb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight tracking-tight text-white mt-2">
                Learn. Compete. Hire.
                <span className="block text-indigo-400 mt-2">All in one live coding platform.</span>
              </h1>
              <p className="text-base md:text-lg text-slate-300 mt-6 max-w-xl leading-relaxed">
                Built for students, job seekers, and hiring teams. Practice DSA, run contests,
                and conduct live interviews with an AI assistant that guides, not solves.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full">
                <Link to="/register?role=candidate" className="w-full sm:w-auto block">
                  <ReactBitsButton variant="primary" className="w-full flex justify-center">Start Learning</ReactBitsButton>
                </Link>
                <Link to="/register?role=company" className="w-full sm:w-auto block">
                  <ReactBitsButton variant="success" className="w-full flex justify-center">Run Hiring Challenge</ReactBitsButton>
                </Link>
                <Link to="/ai-chat" className="w-full sm:w-auto block">
                  <ReactBitsButton variant="neutral" className="w-full flex justify-center">AI Assistant</ReactBitsButton>
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-400">
                {metrics.slice(0, 2).map((item) => (
                  <div key={item.label}>
                    <div className="text-2xl font-semibold text-white">{item.value}</div>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#0a0a0a]/80 p-6 shadow-[0_30px_80px_rgba(5,5,5,0.8)] backdrop-blur-sm relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 rounded-3xl pointer-events-none" />
              <div className="flex items-center justify-between mb-5 relative">
                <div>
                  <h2 className="text-xl font-semibold text-white">Live Interview Workspace</h2>
                  <p className="text-sm text-slate-400 mt-1">Code + video + shared AI hints</p>
                </div>
                <span className="rounded-full bg-indigo-500/15 border border-indigo-500/30 px-3 py-1 text-xs text-indigo-300 font-medium">
                  In Progress
                </span>
              </div>
              <div className="space-y-4 relative">
                <div className="rounded-xl border border-[rgba(255,255,255,0.04)] bg-[#111111]/80 p-4 text-sm text-slate-300 font-mono">
                  <span className="text-indigo-400">const</span> <span className="text-cyan-400">designEditor</span> = () =&gt; &#123;<br/>
                  &nbsp;&nbsp;<span className="text-slate-500">// scalable collaborative editor</span><br/>
                  &nbsp;&nbsp;<span className="text-slate-500">// auto-save & playback</span><br/>
                  &#125;;
                </div>
                <div className="rounded-xl border border-[rgba(255,255,255,0.04)] bg-[#111111]/80 p-4">
                  <div className="text-xs text-slate-400 mb-3 font-semibold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" /> AI Hint Stream
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-3/4 rounded-full bg-indigo-500/20" />
                    <div className="h-2 w-1/2 rounded-full bg-indigo-500/10" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-2">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Auto-save enabled</span>
                  <span>Synced 2s ago</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* TRUSTED BY SECTION - MOVED UP */}
        <motion.section 
          className="border-y border-[rgba(255,255,255,0.04)] bg-[#050505]/50"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8 }}
        >
          <div className="max-w-6xl mx-auto px-6 py-10">
            <p className="text-center text-sm font-semibold text-slate-500 uppercase tracking-widest mb-8">
              Trusted by tech teams at
            </p>
            <div className="flex flex-wrap justify-center gap-10 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              {["Fintech", "EdTech", "Product", "Systems", "Frontend", "Backend"].map((logo) => (
                <div key={logo} className="text-xl font-bold text-slate-300 whitespace-nowrap hidden sm:block">
                  {logo}<span className="text-indigo-500">.</span>Corp
                </div>
              ))}
              {/* Mobile fallback format */}
              <div className="w-full flex sm:hidden justify-center gap-6 px-4 text-base font-bold text-slate-300 flex-wrap">
                <span>Fintech<span className="text-indigo-500">.</span></span>
                <span>Product<span className="text-indigo-500">.</span></span>
                <span>Systems<span className="text-indigo-500">.</span></span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* INTRO SECTION - ADDED */}
        <motion.section 
          className="max-w-4xl mx-auto px-6 py-24 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            The standard for technical evaluation
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed mb-10">
            Whether you're mastering algorithms for your next interview, or building a world-class engineering team. 
            Programming+ provides the unified environment where preparation meets evaluation. No context switching, just code.
          </p>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-indigo-500 to-transparent mx-auto" />
        </motion.section>

        <section id="learn" className="max-w-6xl mx-auto px-6 py-16">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.15 }
              }
            }}
          >
            {highlights.map((feature) => (
              <motion.div 
                key={feature.title} 
                className="app-card p-6"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
              >
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-slate-300 mt-2">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <motion.section 
          id="ai" 
          className="max-w-6xl mx-auto px-6 py-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7 }}
        >
          <div className="app-card p-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold">AI Assistant that coaches, not codes</h2>
              <p className="text-slate-300 mt-4 leading-relaxed">
                Use AI for learning paths, problem breakdowns, and interview hints. During live interviews,
                the candidate can ask for guidance and the interviewer sees the same hint feed, providing deeper signal on their thought process.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-4">
                <Link to="/ai-chat" className="w-full sm:w-auto block">
                  <ReactBitsButton variant="primary" className="w-full flex justify-center">Explore AI Studio</ReactBitsButton>
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0a0a0a] p-6 shadow-2xl relative z-10">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[rgba(255,255,255,0.04)]">
                <div className="w-8 h-8 rounded bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">AI Coach</p>
                  <p className="text-sm font-medium text-slate-300">Targeted Guidance</p>
                </div>
              </div>
              <p className="text-slate-200 mt-2 leading-relaxed text-sm">
                "Instead of brute-forcing, consider what invariant you can maintain in the stack. Track when a value becomes the maximum seen so far,
                and reason about transitions state-by-state."
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section 
          id="compete" 
          className="max-w-7xl mx-auto px-6 py-20"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
        >
          <div className="text-center mb-16">
            <motion.h2 variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="text-4xl font-bold text-white tracking-tight">
              Paths to Success
            </motion.h2>
            <motion.p variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="text-lg text-slate-400 mt-4 max-w-2xl mx-auto">
              Whether you are preparing for your next big role or assessing top talent, we provide a unified workflow mapped to real-world expectations.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Learner Path Side */}
            <motion.div variants={{ hidden: { opacity: 0, x: -30 }, show: { opacity: 1, x: 0 } }} className="relative">
              <div className="absolute left-6 top-10 bottom-10 w-px bg-gradient-to-b from-indigo-500/50 via-indigo-500/20 to-transparent pointer-events-none hidden sm:block" />
              <h3 className="text-2xl font-semibold text-white mb-2 pl-0 sm:pl-16">Learner Path</h3>
              <p className="text-slate-400 mb-8 pl-0 sm:pl-16 text-sm">
                Follow a structured curriculum: fundamentals → core DSA → advanced patterns → mock interviews.
              </p>
              
              <div className="space-y-6">
                {learnerPathSteps.map((step, index) => (
                  <motion.div 
                    key={step.label} 
                    className="relative flex items-start gap-5 pl-0 sm:pl-16 group"
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                  >
                    <div className="absolute left-[20px] top-1.5 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-[#050505] hidden sm:block group-hover:scale-125 transition-transform" />
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.1)] group-hover:bg-indigo-500/20 transition-colors">
                      <step.icon size={22} className="stroke-[1.5]" />
                    </div>
                    <div className="pt-1">
                      <div className="text-xs uppercase tracking-wider font-semibold text-indigo-400/80 mb-1">Step 0{index + 1}</div>
                      <h4 className="text-lg font-medium text-white mb-1">{step.label}</h4>
                      <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Candidate Challenges Side */}
            <motion.div variants={{ hidden: { opacity: 0, x: 30 }, show: { opacity: 1, x: 0 } }} className="relative">
              <div className="absolute left-6 top-10 bottom-10 w-px bg-gradient-to-b from-cyan-500/50 via-cyan-500/20 to-transparent pointer-events-none hidden sm:block" />
              <h3 className="text-2xl font-semibold text-white mb-2 pl-0 sm:pl-16">Candidate Challenges</h3>
              <p className="text-slate-400 mb-8 pl-0 sm:pl-16 text-sm">
                Join contests tailored to roles, track eligibility, and unlock live interview invites.
              </p>
              
              <div className="space-y-6">
                {candidateChallengeSteps.map((step, index) => (
                  <motion.div 
                    key={step.label} 
                    className="relative flex items-start gap-5 pl-0 sm:pl-16 group"
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                  >
                    <div className="absolute left-[20px] top-1.5 w-3 h-3 rounded-full bg-cyan-500 ring-4 ring-[#050505] hidden sm:block group-hover:scale-125 transition-transform" />
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.1)] group-hover:bg-cyan-500/20 transition-colors">
                      <step.icon size={22} className="stroke-[1.5]" />
                    </div>
                    <div className="pt-1">
                      <div className="text-xs uppercase tracking-wider font-semibold text-cyan-400/80 mb-1">Phase 0{index + 1}</div>
                      <h4 className="text-lg font-medium text-white mb-1">{step.label}</h4>
                      <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.section>

        <motion.section 
          id="hire" 
          className="max-w-6xl mx-auto px-6 py-16"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7 }}
        >
          <div className="app-card p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-semibold">Company Hiring Flow</h2>
              <p className="text-slate-300 mt-3">
                Create role-based contests, shortlist with real performance, and conduct live interviews
                with shared AI hints visible to the panel.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
                <ReactBitsButton variant="success" className="w-full sm:w-auto flex justify-center">Create Contest</ReactBitsButton>
                <ReactBitsButton variant="neutral" className="w-full sm:w-auto flex justify-center">See Candidate Funnel</ReactBitsButton>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {metrics.map((item) => (
                <div key={item.label} className="app-panel p-4 text-center">
                  <div className="text-2xl font-semibold text-white">{item.value}</div>
                  <div className="text-xs text-slate-400">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* LOGOS REMOVED FROM HERE, MOVED UP */}

        <motion.section 
          className="max-w-6xl mx-auto px-6 py-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-semibold text-center">What teams say</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="app-card p-6">
                <p className="text-slate-200">“{t.quote}”</p>
                <div className="mt-4 text-sm text-slate-400">{t.name}</div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section 
          id="pricing" 
          className="max-w-6xl mx-auto px-6 py-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
        >
          <div className="app-card p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-semibold">Ready to experience Programming+?</h2>
              <p className="text-slate-300 mt-2">
                Start learning today or launch a hiring challenge in minutes.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full md:w-auto">
              <Link to="/register?role=candidate" className="w-full sm:w-auto block">
                <ReactBitsButton variant="primary" className="w-full flex justify-center">Start Learning</ReactBitsButton>
              </Link>
              <Link to="/register?role=company" className="w-full sm:w-auto block">
                <ReactBitsButton variant="success" className="w-full flex justify-center">Run a Hiring Challenge</ReactBitsButton>
              </Link>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
