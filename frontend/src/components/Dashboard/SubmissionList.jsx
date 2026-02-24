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
    <div>
      <h2 className="text-xl font-bold mb-4">My Submissions</h2>
      <table className="w-full border border-white/20">
        <thead>
          <tr className="bg-white/10">
            <th className="px-2 py-1">Question</th>
            <th className="px-2 py-1">Language</th>
            <th className="px-2 py-1">Status</th>
            <th className="px-2 py-1">Submitted At</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => (
            <tr key={s._id} className="border-b border-white/20">
              <td className="px-2 py-1">{s.questionId?.title}</td>
              <td className="px-2 py-1">{s.language}</td>
              <td className="px-2 py-1">{s.status}</td>
              <td className="px-2 py-1">{new Date(s.submittedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SubmissionList;
