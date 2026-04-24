import React, { useState } from "react";
import { GitMerge, Database, Sparkles, ExternalLink, Activity } from "lucide-react";

const ALGORITHM_CATEGORIES = [
  {
    category: "Interactive Sorting",
    icon: <GitMerge className="w-5 h-5" />,
    items: [
      { id: "merge-sort", name: "Merge Sort", url: "https://see-algorithms.com/sorting/embed/MergeSort" },
      { id: "quick-sort", name: "Quick Sort", url: "https://see-algorithms.com/sorting/embed/QuickSort" },
      { id: "bubble-sort", name: "Bubble Sort", url: "https://see-algorithms.com/sorting/embed/BubbleSort" },
      { id: "insertion-sort", name: "Insertion Sort", url: "https://see-algorithms.com/sorting/embed/InsertionSort" },
      { id: "selection-sort", name: "Selection Sort", url: "https://see-algorithms.com/sorting/embed/SelectionSort" },
    ]
  },
  {
    category: "Data Structures",
    icon: <Database className="w-5 h-5" />,
    items: [
      { id: "bst", name: "Binary Search Tree", url: "https://mudassarmemon.github.io/Binary-Search-Tree-Visualizer/" },
    ]
  }
];

export default function Visualizer() {
  const [activeAlgo, setActiveAlgo] = useState(ALGORITHM_CATEGORIES[0].items[0]);

  return (
    <div className="min-h-screen bg-[#020202] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(34,211,238,0.15),rgba(255,255,255,0))] p-4 md:p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 relative overflow-hidden rounded-3xl border border-cyan-500/20 p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0b1220] to-[#041c26]"></div>
          <div className="absolute -right-20 -top-20 h-[300px] w-[300px] rounded-full bg-cyan-500/10 blur-[100px]"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-cyan-300 shadow-inner">
                <Activity size={14} className="animate-pulse" /> Algorithm Studio
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                Interactive <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Visualizer</span>
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-slate-400 font-medium">
                Watch algorithms execute in real-time. Understand complex data structures and traversals through interactive animations.
              </p>
            </div>
            <Sparkles className="hidden md:block text-cyan-500/20" size={120} />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/4 shrink-0 space-y-6">
            {ALGORITHM_CATEGORIES.map((cat, idx) => (
              <div key={idx} className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 shadow-xl backdrop-blur-md">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-300">
                  {cat.icon} {cat.category}
                </h3>
                <div className="space-y-2">
                  {cat.items.map((algo) => (
                    <button
                      key={algo.id}
                      onClick={() => setActiveAlgo(algo)}
                      className={`w-full text-left rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                        activeAlgo.id === algo.id
                          ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                          : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
                      }`}
                    >
                      {algo.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 rounded-3xl border border-white/10 bg-[#0a0a0a] shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] p-4 lg:px-8">
              <h2 className="text-xl font-black text-white flex items-center gap-3">
                <Sparkles size={20} className="text-cyan-400" />
                {activeAlgo.name}
              </h2>
              <button 
                onClick={() => window.open(activeAlgo.url, "_blank")}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-cyan-400 px-4 py-2 rounded-xl border border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all"
              >
                Open Tab <ExternalLink size={14} />
              </button>
            </div>
            
            <div className="relative w-full flex-1 min-h-[600px] bg-[#050505]">
              <iframe
                src={activeAlgo.url}
                className="absolute inset-0 h-full w-full border-0"
                title={activeAlgo.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
