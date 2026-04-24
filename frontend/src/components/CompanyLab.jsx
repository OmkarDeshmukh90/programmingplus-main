/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from "react";
import { Building2, Clock, Code2, ChevronRight, X, Play, CheckCircle, Target, Briefcase, Bot, Send, User, Sparkles } from "lucide-react";

const COMPANIES = [
  { id:"google", name:"Google", domain:"google.com", bg:"#4285F4", role:"Software Engineer", desc:"Real-world system design and algorithms used at Google scale.", problems:[
    {
      id:1,
      title:"Search Autocomplete System",
      desc:"Design a search autocomplete system. Given a query string, return the top 3 most searched sentences with the same prefix from historical data. Implement using a Trie data structure.",
      detailedDesc: `### System Context\nGoogle processes over 8.5 billion searches per day. For search autocomplete, latency is strictly bounded—suggestions must appear within 50 milliseconds of the user typing a character.\n\n### The Problem\nYou are tasked with designing the core data structure that holds the historical search prefix data for a localized shard. Given a massive stream of historical query strings and a user's current typed prefix, you must return the top 3 most relevant sentences matching the prefix.\n\n### Constraints\n- \`queries.length <= 10^5\`\n- \`query.length <= 100\`\n- The system must handle millions of concurrent read requests, making \`O(N)\` scan approaches completely unviable.\n- Memory is constrained; storing duplicate prefixes redundantly will cause out-of-memory errors on the shard.\n\n### Expected Approach\nImplement a solution using an optimized **Trie** data structure. Consider how you will track the 'top 3' most searched queries at every node without traversing the entire subtree during every keystroke.`,
      diff:"Hard",mins:45,tags:["Trie","Design"]
    },
    {
      id:2,
      title:"Meeting Rooms Scheduler",
      desc:"Google Calendar needs to allocate rooms. Given intervals of meeting times, find the minimum number of conference rooms required so no two meetings overlap at the same time.",
      detailedDesc: `### System Context\nGoogle Workspace handles scheduling for millions of enterprise organizations globally. When users book meetings, the system must efficiently allocate physical resources across massive corporate campuses.\n\n### The Problem\nGiven an array of meeting time intervals \`intervals[i] = [start_i, end_i]\`, representing meeting start and end times, return the minimum number of conference rooms required to satisfy all meetings simultaneously.\n\n### Constraints\n- \`1 <= intervals.length <= 10^4\`\n- \`0 <= start_i < end_i <= 10^6\`\n\n### Expected Approach\nConsider using a **Min-Heap (Priority Queue)** to keep track of the end times of meetings currently occupying a room, or sort the start and end times independently using the **Two Pointers** approach.`,
      diff:"Medium",mins:30,tags:["Heap","Intervals"]
    },
    {
      id:3,
      title:"Distributed Rate Limiter",
      desc:"Design a rate limiter for Google APIs. Given user requests with timestamps, determine if each request is allowed based on a sliding window of 100 requests per minute.",
      detailedDesc: `### System Context\nGoogle Cloud APIs (like Maps and Vision) serve billions of requests per second. To prevent abuse and enforce pricing tiers, a highly resilient, distributed rate limiter sits in front of every endpoint.\n\n### The Problem\nImplement a sliding window rate limiter. You must track user requests based on integer timestamps (in seconds). If a user makes more than 100 requests in a strict 60-second window, subsequent requests must be rejected until the window slides forward.\n\n### Constraints\n- The timestamp stream is monotonically increasing.\n- The system must have an extremely low memory footprint per user (\`O(1)\` or very small \`O(K)\`).\n\n### Edge Cases\n- How do you handle bursts of 100 requests at the exact same millisecond?\n- What happens when old requests fall out of the 60-second window?`,
      diff:"Hard",mins:40,tags:["Sliding Window","Design"]
    },
  ]},
  { id:"meta", name:"Meta", domain:"meta.com", bg:"#0866FF", role:"Software Engineer", desc:"Social graph traversal and real-time feed ranking at Meta.", problems:[
    {
      id:1,
      title:"Friend Circles",
      desc:"In Meta's social graph, find the number of distinct friend circles. Users are connected if they share a mutual friend. Given an n×n adjacency matrix, return the count of circles.",
      detailedDesc: `### System Context\nMeta connects over 3 billion users. Understanding network clusters (friend circles) is crucial for content recommendation and identifying community boundaries.\n\n### The Problem\nThere are \`n\` users in the network. Some are directly connected, and others are connected indirectly through mutual friends. A "Friend Circle" is a group of users who are directly or indirectly connected. Given an \`n x n\` matrix \`isConnected\` where \`isConnected[i][j] = 1\` if user \`i\` and user \`j\` are directly connected, return the total number of friend circles.\n\n### Expected Approach\nThis is a classic connected components problem. You should utilize **Union-Find (Disjoint Set)** for optimal performance, or standard **Depth First Search (DFS)**.\n\n### Constraints\n- \`1 <= n <= 200\`\n- The matrix is symmetric (\`isConnected[i][j] == isConnected[j][i]\`).`,
      diff:"Medium",mins:25,tags:["Union-Find","Graph"]
    },
    {id:2,title:"News Feed Ranking",desc:"Design a news feed ranking system. Given posts with engagement scores and timestamps, return the top-k posts for a user using a priority queue with a time-decay engagement factor.",detailedDesc:"### System Context\nMeta's newsfeed algorithms rank millions of posts per user daily. Ranking isn't just about total likes; it's about time relevancy. Older posts decay in value.\n\n### The Problem\nGiven a stream of post objects containing `engagement_score` and `timestamp`, extract the top `k` most relevant posts. The true score is calculated as `engagement_score / (current_time - timestamp)`.\n\n### Expected Approach\nUse a **Max-Heap** constrained to size `k` to continuously track the highest value posts dynamically.",diff:"Hard",mins:40,tags:["Heap","Design"]},
    {id:3,title:"Shortest Path in Messenger",desc:"In Meta Messenger, find the shortest chain of friends connecting two users. Implement BFS on a social graph efficiently enough to handle graphs with millions of nodes.",detailedDesc:"### System Context\n'You might know this person because they are 2 degrees away.' Meta computes shortest path connections globally.\n\n### The Problem\nGiven a start node, an end node, and a function `getFriends(userId)` that returns adjacent nodes, find the shortest path length.\n\n### Expected Approach\nImplement **Bidirectional BFS** to massively reduce the search space from `O(B^d)` to `O(B^(d/2))`.",diff:"Medium",mins:30,tags:["BFS","Graph"]},
  ]},
  { id:"amazon", name:"Amazon", domain:"amazon.com", bg:"#FF9900", role:"SDE II", desc:"E-commerce logistics and AWS cloud problems at Amazon scale.", problems:[
    {
      id:1,
      title:"Product Recommendation Engine",
      desc:"Design Amazon's recommendation system. Given a user's purchase history and item similarity scores, return the top-5 recommended products using a collaborative filtering approach.",
      detailedDesc:"### System Context\nAmazon attributes 35% of its revenue to its recommendation engine. Given sparse matrices of user-item interactions, calculating similarities efficiently is paramount.\n\n### The Problem\nImplement a simplified collaborative filtering algorithm using a Min-Heap to maintain the top `K` highly correlated items for a specific target user.\n\n### Constraints\n- Time complexity must not exceed `O(N log K)`.",
      diff:"Hard",mins:45,tags:["Heap","Matrix"]
    },
    {id:2,title:"Warehouse Robot Navigation",desc:"Amazon warehouse robots navigate a grid. Find the shortest path from start to all delivery points, avoiding obstacles, while minimizing total distance traveled.",detailedDesc:"### System Context\nAmazon fulfillment centers use Kiva robots. They navigate grids while avoiding humans and shelves.\n\n### Expected Approach\nUse Breadth-First Search (BFS) in a matrix where `0` is empty, `1` is obstacle, and `2` is a target.",diff:"Medium",mins:35,tags:["BFS","DP"]},
    {id:3,title:"Flash Sale Inventory",desc:"During Amazon Prime Day, manage inventory for flash sales. Process concurrent buy requests ensuring no oversell while maximizing transaction throughput under high load.",detailedDesc:"### System Context\nPrime day causes massive read-write contention on inventory rows. You must ensure `stock >= 0` always.\n\n### Approach\nUse Redis distributed locks or atomic `DECR` operations.",diff:"Hard",mins:40,tags:["Concurrency","Design"]},
  ]},
  // Fallbacks for other companies
  { id:"microsoft", name:"Microsoft", domain:"microsoft.com", bg:"#00A4EF", role:"SWE II", desc:"Cloud infrastructure and enterprise software engineering at Microsoft.", problems:[
    {id:1,title:"Excel Formula Evaluator",desc:"Microsoft Excel needs to evaluate cell formulas. Given a grid where cells contain values or formulas referencing other cells, compute all values while detecting and rejecting circular dependencies.",diff:"Hard",mins:45,tags:["Graph","Topological Sort"]},
    {id:2,title:"Teams Call Scheduler",desc:"Microsoft Teams must schedule group calls. Given availability windows for n participants, find all time slots where at least k people are simultaneously available.",diff:"Medium",mins:30,tags:["Intervals","Sweep Line"]},
    {id:3,title:"Azure Load Balancer",desc:"Design Azure's load balancer. Distribute incoming requests across servers, tracking server load and response time, and automatically rerouting traffic around failed servers.",diff:"Hard",mins:40,tags:["Design","Heap"]},
  ]},
  { id:"netflix", name:"Netflix", domain:"netflix.com", bg:"#E50914", role:"Senior SWE", desc:"Streaming, content delivery, and recommendation algorithms at Netflix.", problems:[
    {id:1,title:"Adaptive Streaming Buffer",desc:"Netflix adapts video quality based on available bandwidth. Given bandwidth measurements over time and available quality levels, maximize viewing experience while minimizing rebuffering events.",diff:"Hard",mins:40,tags:["DP","Greedy"]},
    {id:2,title:"Content Chunk Deduplication",desc:"Netflix stores billions of encoded video chunks. Identify and remove duplicate chunks across different encodings using content-based hashing in a distributed deduplication pipeline.",diff:"Medium",mins:30,tags:["Hashing","Design"]},
    {id:3,title:"Watch History Recommender",desc:"Given a user's watch history with ratings and genres, and similar users' preferences, recommend the next 10 shows using matrix factorization and a collaborative filtering model.",diff:"Hard",mins:45,tags:["Matrix","Heap"]},
  ]},
  { id:"apple", name:"Apple", domain:"apple.com", bg:"#555555", role:"Software Engineer", desc:"iOS ecosystem, privacy-first and on-device computation at Apple.", problems:[
    {id:1,title:"Siri Intent Parser",desc:"Build an intent parser for Siri voice commands. Given natural language input, extract the intent (call, navigate, remind) and parameters (contact, location, time) using a state machine.",diff:"Hard",mins:45,tags:["FSM","Parsing"]},
    {id:2,title:"iCloud Sync Conflict Resolver",desc:"When the same file is edited offline on multiple devices, detect and resolve sync conflicts on reconnection. Design a vector-clock based conflict resolution system.",diff:"Hard",mins:40,tags:["Distributed Systems","Design"]},
    {id:3,title:"App Store Search Ranking",desc:"Rank App Store search results. Given query terms and app metadata including ratings, downloads, and relevance scores, return the top-10 most relevant apps efficiently.",diff:"Medium",mins:30,tags:["Heap","Ranking"]},
  ]},
  { id:"stripe", name:"Stripe", domain:"stripe.com", bg:"#635BFF", role:"Software Engineer", desc:"Payment infrastructure and financial data integrity at Stripe.", problems:[
    {id:1,title:"Real-Time Fraud Detection",desc:"Stripe processes millions of transactions. Build a fraud detection system that flags suspicious patterns using sliding window statistics and rule-based feature extraction in real time.",diff:"Hard",mins:45,tags:["Sliding Window","Design"]},
    {id:2,title:"Payment Retry Scheduler",desc:"Failed payments need intelligent retry scheduling. Given failure reasons and merchant retry policies, design an exponential backoff system with jitter to avoid thundering herd.",diff:"Medium",mins:30,tags:["Queues","Design"]},
    {id:3,title:"Idempotent Payment API",desc:"Stripe APIs must be idempotent. Design a system that safely retries payment requests without double-charging customers, using idempotency keys stored in a distributed cache.",diff:"Hard",mins:40,tags:["Distributed Systems","Design"]},
  ]},
  { id:"airbnb", name:"Airbnb", domain:"airbnb.com", bg:"#FF5A5F", role:"Software Engineer", desc:"Marketplace search, booking, and dynamic pricing at Airbnb.", problems:[
    {id:1,title:"Smart Listing Search",desc:"Airbnb search must return listings sorted by relevance, price, and availability. Given listings with geolocation, pricing, and calendar availability data, build an efficient search and ranking system.",diff:"Hard",mins:45,tags:["Spatial Index","Design"]},
    {id:2,title:"Dynamic Pricing Engine",desc:"Hosts want to optimize nightly rates. Given historical booking data, local events, and demand signals, compute the recommended price for each night to maximize occupancy revenue.",diff:"Hard",mins:40,tags:["DP","Statistics"]},
    {id:3,title:"Calendar Availability Merge",desc:"A listing has blocked date ranges from multiple sources. Given n calendar feeds with unavailable ranges, merge all blocked periods and return the available booking slots for a given window.",diff:"Medium",mins:25,tags:["Intervals","Merge"]},
  ]},
  { id:"uber", name:"Uber", domain:"uber.com", bg:"#1C1C1C", role:"Software Engineer", desc:"Real-time ride matching, routing, and surge pricing at Uber.", problems:[
    {id:1,title:"Driver-Rider Matching",desc:"Uber must match riders to the nearest available drivers in real time. Given geolocations of all active drivers and a new rider request, find the optimal match that minimizes wait time.",diff:"Hard",mins:45,tags:["Spatial Index","Greedy"]},
    {id:2,title:"Surge Pricing Calculator",desc:"When demand exceeds supply, calculate surge multipliers by zone. Given real-time ride requests and active driver counts per hexagonal grid cell, compute zone-level surge multipliers.",diff:"Medium",mins:30,tags:["Geospatial","Math"]},
    {id:3,title:"Dynamic ETA Prediction",desc:"Uber ETA must account for real-time traffic. Given a road network graph with dynamic edge weights from traffic sensors, compute shortest-time paths that update as traffic conditions change.",diff:"Hard",mins:40,tags:["Dijkstra","Graph"]},
  ]},
  { id:"linkedin", name:"LinkedIn", domain:"linkedin.com", bg:"#0A66C2", role:"Software Engineer", desc:"Professional network graph and job-candidate matching at LinkedIn.", problems:[
    {id:1,title:"Degrees of Connection",desc:"LinkedIn shows 1st, 2nd, 3rd-degree connections. Given a professional network graph with 500M nodes, efficiently compute connection degree between any two users in near real time.",diff:"Hard",mins:40,tags:["BFS","Graph"]},
    {id:2,title:"Job Recommendation Engine",desc:"Match jobs to candidates. Given candidate skills, experience level, and location alongside job requirements, score and rank the top-20 job recommendations using a multi-factor relevance model.",diff:"Hard",mins:45,tags:["Ranking","Design"]},
    {id:3,title:"Feed Post Deduplication",desc:"LinkedIn feed must not show the same post multiple times when reshared by connections. Given a stream of feed items with content hashes, deduplicate in real time within a 24-hour window.",diff:"Medium",mins:30,tags:["Hashing","Sliding Window"]},
  ]},
];

const DIFF_STYLE = {
  Easy: "border-emerald-400/30 bg-emerald-500/10 text-emerald-400",
  Medium: "border-amber-400/30 bg-amber-500/10 text-amber-400",
  Hard: "border-rose-400/30 bg-rose-500/10 text-rose-400",
};

function SessionTimer({ seconds, onExpire }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) { onExpire(); return; }
    const t = setTimeout(() => setLeft(l => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  const m = Math.floor(left / 60).toString().padStart(2, "0");
  const s = (left % 60).toString().padStart(2, "0");
  const pct = (left / seconds) * 100;
  const color = left < 120 ? "#ef4444" : left < 300 ? "#f59e0b" : "#22d3ee";
  const r = 22;
  const circ = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#050505] p-2 pr-4 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
      <div className="relative w-12 h-12 flex-shrink-0">
        <svg className="w-12 h-12 -rotate-90 drop-shadow-md" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4"/>
          <circle cx="25" cy="25" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
            style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s", filter: `drop-shadow(0 0 4px ${color})` }}/>
        </svg>
      </div>
      <div>
        <div className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-0.5">Time Remaining</div>
        <div className="text-xl font-mono font-black tabular-nums tracking-tight" style={{ color, textShadow: `0 0 10px ${color}66` }}>{m}:{s}</div>
      </div>
    </div>
  );
}

// ── AI Mentor Interface ──────────────────────────────────────────────────────
function AIGuide({ contextText, currentCode, onClose, companyName }) {
  const [messages, setMessages] = useState([{ 
    role: "ai", 
    content: `Hello. I am the AI Evaluator and Mentor for this ${companyName} session.\n\nI can review your current code, help you brainstorm algorithmic approaches, analyze time/space complexity, and identify hidden edge cases or bugs.\n\nHow can I guide you on this problem?` 
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  const token = localStorage.getItem("token");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    const userText = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userText }]);
    setInput("");
    setLoading(true);
    
    try {
      const res = await fetch("/api/ai/ask-ai", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          prompt: userText, 
          mode: "company_lab_guide", 
          context: `Problem Description:\n${contextText}\n\nCandidate's Current Code:\n\`\`\`\n${currentCode}\n\`\`\`` 
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch response");
      
      setMessages(prev => [...prev, { role: "ai", content: data.result }]);
    } catch(err) {
      setMessages(prev => [...prev, { role: "ai", content: "⚠️ Warning: Secure connection to AI mentor lost. Please check your network or try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#050505] shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
      {/* AI Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#0a0a0a] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.15)]">
            <Bot size={16} className="text-violet-400" />
          </div>
          <div>
            <div className="text-white font-black text-sm tracking-wide flex items-center gap-2">AI Mentor <Sparkles size={12} className="text-amber-400"/></div>
            <div className="text-violet-400 text-[10px] font-bold uppercase tracking-widest">Theoretical Guide</div>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all">
          <X size={16} />
        </button>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === "user" ? "bg-cyan-500/20 text-cyan-400" : "bg-violet-500/20 text-violet-400"}`}>
              {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className={`px-4 py-3 text-sm leading-relaxed max-w-[85%] rounded-2xl whitespace-pre-wrap ${m.role === "user" ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-50 rounded-tr-sm" : "bg-white/5 border border-white/10 text-slate-300 rounded-tl-sm"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 flex-row">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-violet-500/20 text-violet-400">
              <Bot size={14} />
            </div>
            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Form */}
      <div className="p-4 border-t border-white/5 bg-[#0a0a0a]">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask about edge cases or concepts..." 
            className="w-full bg-[#111] border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors disabled:opacity-50"
          />
          <button type="submit" disabled={!input.trim() || loading} className="absolute right-2 p-2 rounded-lg bg-violet-500 text-white disabled:opacity-30 disabled:bg-white/10 hover:bg-violet-400 transition-all">
            <Send size={14} />
          </button>
        </form>
        <div className="text-center mt-2 text-[9px] text-slate-500 uppercase tracking-widest font-semibold">
          AI Mentor will not provide code implementations.
        </div>
      </div>
    </div>
  );
}

// ── Problem Solver Modal (IDE Interface) ─────────────────────────────────────
function ProblemSolver({ company, problem, onBack }) {
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// Write your optimal solution here\n\n");
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(null);
  const [showAI, setShowAI] = useState(false);

  // Use detailedDesc if available, otherwise fallback to simple desc
  const problemContext = problem.detailedDesc || problem.desc;

  // Format the detailed description to handle markdown-like syntax simply
  const renderDescription = (text) => {
    return text.split('\n\n').map((paragraph, idx) => {
      if (paragraph.startsWith('###')) {
        return <h3 key={idx} className="text-xl font-black text-cyan-300 mt-6 mb-3">{paragraph.replace('### ', '')}</h3>;
      }
      if (paragraph.startsWith('- ')) {
        const items = paragraph.split('\n').map(item => item.replace('- ', ''));
        return (
          <ul key={idx} className="list-disc pl-5 space-y-2 text-slate-300 leading-relaxed text-[15px] mb-4">
            {items.map((item, i) => {
              // Basic bold/code parsing
              let formattedItem = item;
              // Very simple regex replacement for visual purposes
              const parts = formattedItem.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
              return <li key={i}>
                {parts.map((part, j) => {
                  if (part.startsWith('`')) return <code key={j} className="bg-white/10 px-1.5 py-0.5 rounded text-cyan-200 font-mono text-[13px]">{part.replace(/`/g, '')}</code>;
                  if (part.startsWith('**')) return <strong key={j} className="text-white">{part.replace(/\*\*/g, '')}</strong>;
                  return part;
                })}
              </li>
            })}
          </ul>
        );
      }
      return <p key={idx} className="text-slate-300 leading-relaxed text-[15px] mb-4">{paragraph}</p>;
    });
  };

  if (done) return (
    <div className="fixed inset-0 z-[600] bg-[#020202]/90 backdrop-blur-2xl flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6 rounded-3xl border border-white/10 bg-[#0a0a0a] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
        {done === "submitted"
          ? <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)]"><CheckCircle size={48} className="text-emerald-400"/></div>
          : <div className="w-24 h-24 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(244,63,94,0.2)]"><Clock size={48} className="text-rose-400"/></div>}
        
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">
            {done === "submitted" ? "Submission Recorded" : "Time Expired"}
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            {done === "submitted"
              ? `Your solution has been submitted to the ${company.name} evaluation queue. Strong work.`
              : `Your session for the ${company.name} challenge has ended. Review your logic and try again.`}
          </p>
        </div>
        
        <div className="flex gap-4 justify-center pt-4">
          <button onClick={() => { setCode("// Write your optimal solution here\n\n"); setStarted(false); setDone(null); setShowAI(false); }}
            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-all">
            Retry Challenge
          </button>
          <button onClick={onBack}
            className="flex-1 py-3 rounded-xl bg-cyan-500 border border-cyan-400 text-slate-900 text-sm font-black hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)]">
            Back to Hub
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[600] bg-[#050505] flex flex-col font-sans">
      {/* Top Navbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#0a0a0a] flex-shrink-0 shadow-md relative z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all flex items-center justify-center">
            <ChevronRight size={18} className="rotate-180"/>
          </button>
          <div className="h-6 w-px bg-white/10 mx-1"></div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white shadow-[0_0_15px_rgba(255,255,255,0.1)] flex-shrink-0 overflow-hidden">
              <img src={`https://logo.clearbit.com/${company.domain}`} alt={company.name} className="w-full h-full object-cover p-1" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
              <span className="hidden w-full h-full items-center justify-center font-black text-black text-xs" style={{ background: company.bg }}>{company.name[0]}</span>
            </div>
            <div>
              <div className="text-white font-bold text-[13px] tracking-wide">{problem.title}</div>
              <div className="text-slate-500 text-[11px] font-medium tracking-wider uppercase">{company.name} Assessment</div>
            </div>
          </div>
          <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full border font-black uppercase tracking-wider hidden md:inline-block ${DIFF_STYLE[problem.diff]}`}>{problem.diff}</span>
        </div>
        <div className="flex items-center gap-4">
          {started && (
            <button 
              onClick={() => setShowAI(!showAI)} 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${showAI ? 'bg-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'}`}>
              <Bot size={14}/> {showAI ? 'Close Mentor' : 'Ask AI Mentor'}
            </button>
          )}
          {started && <div className="h-6 w-px bg-white/10 mx-1"></div>}
          {started && <SessionTimer seconds={problem.mins * 60} onExpire={() => setDone("expired")}/>}
          {started && (
            <button onClick={() => setDone("submitted")}
              className="px-6 py-3 rounded-xl bg-emerald-500 border border-emerald-400 text-slate-900 text-sm font-black hover:bg-emerald-400 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              Submit Code
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Problem Statement */}
        <div className={`transition-all duration-300 ${showAI ? 'hidden lg:block lg:w-[28%]' : 'w-[40%] max-w-[600px]'} border-r border-white/5 overflow-y-auto bg-[#0a0a0a] flex-shrink-0 relative custom-scrollbar`}>
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
          <div className="p-8 lg:p-10 space-y-8 relative z-10">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight leading-tight">{problem.title}</h2>
              <div className="flex flex-wrap gap-2 mt-4">
                {problem.tags.map(t => (
                  <span key={t} className="text-[11px] px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 font-bold tracking-wide">{t}</span>
                ))}
              </div>
            </div>

            <div className="prose prose-invert prose-slate max-w-none">
              {renderDescription(problemContext)}
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-3 shadow-inner mt-8">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Environment Specs</div>
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-300"><Clock size={16} className="text-cyan-400"/>Strict {problem.mins}-minute allocation</div>
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-300"><Building2 size={16} className="text-cyan-400"/>Calibrated for {company.role}</div>
            </div>

            {!started && (
              <div className="pt-6 pb-20">
                <button onClick={() => setStarted(true)}
                  className="w-full py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black text-[15px] flex items-center justify-center gap-2 transition-all shadow-[0_0_30px_rgba(34,211,238,0.25)] hover:shadow-[0_0_40px_rgba(34,211,238,0.4)] hover:-translate-y-0.5">
                  <Play size={18} fill="currentColor" /> Begin Evaluation
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Middle Panel: Code Editor */}
        <div className={`transition-all duration-300 ${showAI ? 'w-full lg:w-[47%]' : 'flex-1'} flex flex-col bg-[#1e1e1e] relative`}>
          {!started && (
            <div className="absolute inset-0 z-10 bg-[#1e1e1e]/80 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <Code2 size={48} className="text-slate-600 mx-auto mb-4"/>
                <div className="text-slate-400 font-bold text-lg">Editor Locked</div>
                <div className="text-slate-500 text-sm mt-1">Start the evaluation to reveal the workspace.</div>
              </div>
            </div>
          )}
          
          <div className="flex items-center px-4 h-12 bg-[#252526] border-b border-[#333] flex-shrink-0">
            <div className="flex items-center bg-[#1e1e1e] h-full px-4 border-t-2 border-cyan-500 text-cyan-400 text-xs font-mono font-bold tracking-wide shadow-sm">
              solution.{language === 'javascript' ? 'js' : language === 'python' ? 'py' : 'cpp'}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mr-2 hidden sm:inline-block">Language</span>
              <select
                value={language}
                onChange={(e) => {
                  const newLang = e.target.value;
                  setLanguage(newLang);
                  if (!started) {
                    if (newLang === "python") setCode("# Write your optimal solution here\n\n");
                    else if (newLang === "cpp") setCode("// Write your optimal solution here in C++\n\n");
                    else setCode("// Write your optimal solution here\n\n");
                  }
                }}
                className="bg-[#333] border border-[#444] rounded p-1 text-xs text-slate-300 font-mono focus:outline-none cursor-pointer hover:bg-[#444] transition-colors"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
              </select>
            </div>
          </div>
          <div className="flex-1 relative">
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#1e1e1e] border-r border-[#333] flex flex-col items-end py-5 px-2 text-[#666] font-mono text-[13px] leading-6 select-none overflow-hidden">
              {code.split('\n').map((_, i) => <div key={i}>{i + 1}</div>)}
            </div>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              disabled={!started}
              className="absolute inset-0 pl-16 pr-4 py-5 w-full h-full bg-transparent font-mono text-[13px] text-[#d4d4d4] focus:outline-none resize-none leading-6 whitespace-pre custom-scrollbar"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Right Panel: AI Mentor */}
        {showAI && (
          <div className="transition-all duration-300 w-full lg:w-[25%] min-w-[320px] border-l border-white/5 bg-[#0a0a0a] flex flex-col relative z-20">
            <AIGuide contextText={problemContext} currentCode={code} companyName={company.name} onClose={() => setShowAI(false)} />
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}} />
    </div>
  );
}

// ── Company Problem List ─────────────────────────────────────────────────────
function CompanyProblems({ company, onBack }) {
  const [problem, setProblem] = useState(null);
  if (problem) return <ProblemSolver company={company} problem={problem} onBack={() => setProblem(null)}/>;
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button onClick={onBack} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white transition-all text-sm font-bold shadow-sm">
        <ChevronRight size={16} className="rotate-180"/> Back to Companies
      </button>

      {/* Massive Branded Hero */}
      <div className="relative overflow-hidden rounded-[2.5rem] p-10 lg:p-14 border border-white/10 shadow-2xl group">
        <div className="absolute inset-0 opacity-20 transition-opacity duration-700 group-hover:opacity-30" style={{ background: `radial-gradient(circle at 80% 50%, ${company.bg}, transparent 70%)` }}></div>
        <div className="absolute inset-0 bg-[#0a0a0a]/60 backdrop-blur-3xl z-0"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-28 h-28 lg:w-36 lg:h-36 rounded-3xl flex items-center justify-center bg-white shadow-[0_0_40px_rgba(255,255,255,0.1)] flex-shrink-0 overflow-hidden relative">
             <div className="absolute inset-0 opacity-20" style={{ background: company.bg }}></div>
             <img src={`https://logo.clearbit.com/${company.domain}`} alt={company.name} className="w-full h-full object-contain p-4 relative z-10" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
             <span className="hidden w-full h-full items-center justify-center font-black text-white text-5xl relative z-10" style={{ background: company.bg }}>{company.name[0]}</span>
          </div>
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white mb-4 backdrop-blur-md">
              <Target size={14}/> Interview Track
            </div>
            <h2 className="text-5xl lg:text-6xl font-black text-white tracking-tight mb-4">{company.name}</h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-bold text-slate-300">
              <span className="flex items-center gap-2"><Briefcase size={16} className="text-slate-400"/>{company.role}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
              <span className="flex items-center gap-2"><Code2 size={16} className="text-slate-400"/>{company.problems.length} Exclusive Problems</span>
            </div>
            <p className="text-slate-400 text-base mt-4 max-w-2xl leading-relaxed">{company.desc}</p>
          </div>
        </div>
      </div>

      {/* Problem List */}
      <div className="space-y-4">
        {company.problems.map((p, i) => (
          <div key={p.id} onClick={() => setProblem(p)}
            className="relative rounded-[2rem] border border-white/5 bg-[#0d0d0d] hover:border-white/20 hover:bg-[#111] transition-all p-6 lg:p-8 cursor-pointer group shadow-xl overflow-hidden">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500" style={{ background: `linear-gradient(90deg, ${company.bg}, transparent)` }}></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl font-black text-slate-400 group-hover:text-white group-hover:border-white/30 transition-all flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className={`text-[10px] px-2.5 py-1 rounded-md border font-black uppercase tracking-widest ${DIFF_STYLE[p.diff]}`}>{p.diff}</span>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/5 uppercase tracking-widest"><Clock size={12}/> {p.mins} MIN</span>
                  </div>
                  <h3 className="text-2xl font-black text-white group-hover:text-cyan-300 transition-colors mb-2">{p.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-3xl">{p.desc}</p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {p.tags.map(t => <span key={t} className="text-[11px] px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 font-bold tracking-wide">{t}</span>)}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 text-slate-400 group-hover:bg-cyan-500 group-hover:text-slate-900 group-hover:border-cyan-400 transition-all flex-shrink-0">
                <ChevronRight size={20} className="ml-0.5"/>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Company Lab Grid ────────────────────────────────────────────────────
export default function CompanyLab() {
  const [selected, setSelected] = useState(null);
  if (selected) return <CompanyProblems company={selected} onBack={() => setSelected(null)}/>;
  
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-cyan-500/20 p-10 lg:p-14 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0a0f18] to-cyan-950/40 z-0"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/20 blur-[100px] rounded-full"></div>
        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-cyan-300 mb-6 backdrop-blur-md">
            <Building2 size={14}/> Top Tier Engineering Lab
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Practice Like You're <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Already There.</span>
          </h2>
          <p className="text-slate-400 text-lg mt-6 leading-relaxed max-w-2xl">
            Immersive, scenario-based DSA challenges built exactly how industry leaders frame them. No generic textbooks—just raw, real-world constraints.
          </p>
          <div className="flex flex-wrap gap-8 mt-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center"><Building2 size={24} className="text-cyan-400"/></div>
              <div><div className="text-2xl font-black text-white">10</div><div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tech Giants</div></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><Code2 size={24} className="text-emerald-400"/></div>
              <div><div className="text-2xl font-black text-white">30+</div><div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Scenarios</div></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"><Clock size={24} className="text-amber-400"/></div>
              <div><div className="text-2xl font-black text-white">Strict</div><div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Time Limits</div></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {COMPANIES.map(c => (
          <button key={c.id} onClick={() => setSelected(c)}
            className="relative rounded-[2rem] border border-white/5 bg-[#0a0a0a] hover:border-white/20 hover:-translate-y-1 transition-all text-left p-8 group cursor-pointer shadow-xl overflow-hidden">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500" style={{ background: `radial-gradient(circle at top right, ${c.bg}, transparent 70%)` }}></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white shadow-[0_0_20px_rgba(255,255,255,0.05)] overflow-hidden relative group-hover:scale-110 transition-transform duration-500">
                  <div className="absolute inset-0 opacity-10" style={{ background: c.bg }}></div>
                  <img src={`https://logo.clearbit.com/${c.domain}`} alt={c.name} className="w-full h-full object-contain p-2.5 relative z-10" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                  <span className="hidden w-full h-full items-center justify-center font-black text-white text-2xl relative z-10" style={{ background: c.bg }}>{c.name[0]}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <ChevronRight size={18} className="text-slate-400 group-hover:text-white transition-colors"/>
                </div>
              </div>
              <h3 className="font-black text-white text-2xl mb-1">{c.name}</h3>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Briefcase size={12}/> {c.role}
              </div>
              <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 h-10 mb-6">{c.desc}</p>
              <div className="pt-5 border-t border-white/5 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5"><Code2 size={14} className="text-slate-400"/> {c.problems.length} Challenges</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
