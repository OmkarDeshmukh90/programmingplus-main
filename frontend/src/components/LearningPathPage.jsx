import React from "react";

export default function LearningPathPage({ path, onToggleTask }) {
  if (!path) {
    return (
      <div className="app-empty">
        No active learning path. Build one in AI Studio to get started.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="app-section-title">Learning Path</h1>
        <p className="app-subtitle mt-1">Track your milestones and stay consistent.</p>
      </div>

      {path.milestones.map((milestone, mi) => (
        <div key={`${milestone.title}-${mi}`} className="app-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-white">{milestone.title}</h2>
              <p className="text-sm text-slate-400">{milestone.focus || "Focus on fundamentals"}</p>
            </div>
            <span className="text-xs text-slate-400">{milestone.durationWeeks} weeks</span>
          </div>
          <div className="space-y-2">
            {(milestone.tasks || []).map((task, ti) => (
              <label key={`${mi}-${ti}`} className="flex items-center gap-3 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={(e) => onToggleTask(mi, ti, e.target.checked)}
                  className="accent-cyan-400"
                />
                {task.title}
              </label>
            ))}
            {(milestone.tasks || []).length === 0 && (
              <div className="text-sm text-slate-400">No tasks listed for this milestone.</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
