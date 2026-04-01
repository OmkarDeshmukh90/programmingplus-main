import React, { useEffect, useState } from "react";
import { getUserSubmissions } from "../../api/submissions";

const SubmissionList = () => {
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      const res = await getUserSubmissions(token);
      setSubmissions(res.data);
    };
    fetchData();
  }, []);

  return (
    <div className="app-card p-5">
      <h2 className="text-xl font-semibold mb-4">My Submissions</h2>
      {submissions.length === 0 ? (
        <div className="app-empty">No submissions yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-950/70 text-slate-300">
              <tr>
                <th className="px-3 py-2 text-left">Question</th>
                <th className="px-3 py-2 text-left">Language</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s._id} className="border-b border-slate-800 text-slate-200">
                  <td className="px-3 py-2">{s.questionId?.title}</td>
                  <td className="px-3 py-2">{s.language}</td>
                  <td className="px-3 py-2">{s.status}</td>
                  <td className="px-3 py-2">{new Date(s.submittedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SubmissionList;
