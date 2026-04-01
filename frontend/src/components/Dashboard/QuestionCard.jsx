import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import ReactBitsButton from "../ui/ReactBitsButton";

const QuestionCard = ({ question, status = "new" }) => {
  const navigate = useNavigate();

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy": return "text-teal-400 border-teal-400/20 bg-teal-400/5";
      case "medium": return "text-amber-400 border-amber-400/20 bg-amber-400/5";
      case "hard": return "text-rose-500 border-rose-500/20 bg-rose-500/5";
      default: return "text-slate-400 border-slate-700/50 bg-slate-800/20";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "solved": return <CheckCircle2 className="text-emerald-400" size={16} />;
      case "attempted": return <Circle className="text-amber-400" size={16} />;
      default: return <Circle className="text-slate-600" size={16} />;
    }
  };

  return (
    <div 
      onClick={() => navigate(`/question/${question.id || question._id}`)}
      className="group relative flex flex-col h-full p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-indigo-500/30 transition-all cursor-pointer overflow-hidden backdrop-blur-sm"
    >
      {/* Top Section: ID and Difficulty */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <span>Problem #{question.id}</span>
          {status !== "new" && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              {getStatusIcon(status)}
            </>
          )}
        </div>
        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getDifficultyColor(question.difficulty)}`}>
          {question.difficulty}
        </span>
      </div>

      {/* Main Content: Title and Tags */}
      <div className="flex-grow flex flex-col gap-3">
        <h3 className="text-white font-bold group-hover:text-indigo-300 transition-colors line-clamp-2 min-h-[2.5rem]">
          {question.title}
        </h3>
        
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {(question.tags || []).slice(0, 3).map((tag) => (
            <span key={tag} className="text-[9px] font-bold text-slate-500 uppercase border border-white/[0.05] px-1.5 py-0.5 rounded bg-white/[0.01]">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Section: Category / Action */}
      <div className="flex items-center justify-between gap-3 pt-4 mt-4 border-t border-white/[0.04]">
        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
          {question.tags?.[0] || "General"}
        </span>
        
        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
          <ArrowRight size={14} />
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
