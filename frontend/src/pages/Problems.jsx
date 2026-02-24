// frontend/src/pages/Problems.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllQuestions } from "../api/questions";
import QuestionCard from "../components/Dashboard/QuestionCard";

export default function Problems() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    getAllQuestions(token)
      .then((data) => setQuestions(data.data || data))
      .catch((err) => console.error("Error fetching questions:", err));
  }, [token, navigate]);

  const filteredQuestions = questions.filter((q) => {
    return (
      (filter === "all" || q.difficulty.toLowerCase() === filter) &&
      q.title.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Problems</h1>

      {/* Search & Filter */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 rounded flex-1 text-white bg-[#1a1a1a] hover:bg-[#2a2a2a] px-5  border border-white/20 transition  placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="p-2 rounded text-white bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="all">All Levels</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Questions Grid */}
      {filteredQuestions.length === 0 ? (
        <p className="text-gray-400">No questions found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuestions.map((q) => (
            <Link to={`/question/${q.id || q._id}`} key={q.id || q._id}>
              <QuestionCard question={q} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
