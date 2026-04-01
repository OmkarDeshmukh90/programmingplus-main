import React, { useEffect, useState } from "react";
import LearningPathPage from "../components/LearningPathPage";
import { getActiveLearningPath, updateLearningTask } from "../api/learningPaths";

export default function LearningPath() {
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      setLoading(true);
      try {
        const res = await getActiveLearningPath(token);
        setPath(res.data);
      } catch {
        setPath(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleToggleTask = async (milestoneIndex, taskIndex, done) => {
    const token = localStorage.getItem("token");
    if (!token || !path) return;
    try {
      const res = await updateLearningTask(token, path._id, {
        milestoneIndex,
        taskIndex,
        done,
      });
      setPath(res.data);
    } catch {
      // ignore
    }
  };

  return (
    <div className="app-page">
      <div className="app-shell max-w-5xl">
        {loading ? (
          <div className="app-card p-6 text-slate-300">Loading learning path...</div>
        ) : (
          <LearningPathPage path={path} onToggleTask={handleToggleTask} />
        )}
      </div>
    </div>
  );
}
