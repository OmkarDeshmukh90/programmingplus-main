import React from "react";
import ReactBitsButton from "../components/ui/ReactBitsButton";

const formatDuration = (weeks) => `${weeks} week${weeks === 1 ? "" : "s"}`;

export default function LearningPathCard({ path, onToggleTask, onViewAll }) {
  if (!path) return null;

  const milestones = path.milestones || [];
  const tasks = milestones.flatMap((m, mi) =>
    (m.tasks || []).map((t, ti) => ({ ...t, milestoneIndex: mi, taskIndex: ti }))
  );
  const total = tasks.length || 1;
  const completed = tasks.filter((t) => t.done).length;
  const progress = Math.round((completed / total) * 100);

  return (
    <div className="app-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{path.title}</h2>
          <p className="text-sm text-slate-400">
            {path.timePerWeek ? `${path.timePerWeek} / week` : "Custom pace"} • {formatDuration(path.durationWeeks || 8)}
          </p>
        </div>
        <ReactBitsButton variant="neutral" onClick={onViewAll}>View Path</ReactBitsButton>
      </div>

      <div className="mb-3 text-xs text-slate-400">Progress {progress}%</div>
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
        <div className="h-full bg-cyan-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="space-y-3">
        {tasks.slice(0, 5).map((task) => (
          <label key={`${task.milestoneIndex}-${task.taskIndex}`} className="flex items-center gap-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={task.done}
              onChange={(e) => onToggleTask(task.milestoneIndex, task.taskIndex, e.target.checked)}
              className="accent-cyan-400"
            />
            {task.title}
          </label>
        ))}
        {tasks.length === 0 && (
          <div className="text-sm text-slate-400">No tasks available yet.</div>
        )}
      </div>
    </div>
  );
}
