import React, { useState, useEffect } from "react";
import axios from "axios";
import BASE_URL from "../config";
import ReactBitsButton from "../components/ui/ReactBitsButton";

const API_URL = `${BASE_URL}/discuss`;

const Discuss = () => {
  const [post, setPost] = useState("");
  const [category, setCategory] = useState("General");
  const [posts, setPosts] = useState([]);
  const [editingPostId, setEditingPostId] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [sortBy, setSortBy] = useState("newest");
  const [filterCategory, setFilterCategory] = useState("All");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(res.data);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!post.trim()) return;
    try {
      const res = await axios.post(
        API_URL,
        { text: post, category },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts([res.data, ...posts]);
      setPost("");
      setCategory("General");
    } catch (err) {
      console.error("Error posting:", err.response?.data || err.message);
    }
  };

  const handleEdit = async (id, text) => {
    try {
      const res = await axios.put(
        `${API_URL}/${id}`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts(posts.map((p) => (p._id === id ? res.data : p)));
      setEditingPostId(null);
    } catch (err) {
      console.error("Error editing:", err);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this post?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(posts.filter((p) => p._id !== id));
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  const handleReply = async (id) => {
    try {
      const res = await axios.post(
        `${API_URL}/${id}/replies`,
        { text: replyText[id] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts(posts.map((p) => (p._id === id ? res.data : p)));
      setReplyText({ ...replyText, [id]: "" });
    } catch (err) {
      console.error("Error replying:", err);
    }
  };

  const categories = ["General", "DSA", "System Design", "Interviews", "Careers"];

  const sortedPosts = [...posts]
    .filter((p) => filterCategory === "All" || (p.category || "General") === filterCategory)
    .sort((a, b) => {
      if (sortBy === "helpful") {
        return (b.replies?.length || 0) - (a.replies?.length || 0);
      }
      if (sortBy === "unanswered") {
        return (a.replies?.length || 0) - (b.replies?.length || 0);
      }
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  return (
    <div className="app-page">
      <div className="app-shell max-w-5xl">
        <div className="mb-8">
          <h1 className="app-section-title">Discuss</h1>
          <p className="app-subtitle mt-1">Share learnings, ask questions, and review solutions together.</p>
        </div>

        <div className="app-card p-4 mb-6 flex flex-wrap items-center gap-3">
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="app-select">
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="app-select">
            <option value="newest">Newest</option>
            <option value="helpful">Most Helpful</option>
            <option value="unanswered">Unanswered</option>
          </select>
        </div>

        <form onSubmit={handleSubmit} className="app-card p-5 mb-8">
          <h2 className="text-lg font-semibold text-slate-200 mb-3">Start a new thread</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`px-3 py-1 rounded-full text-xs border ${
                  category === c ? "border-cyan-400 text-cyan-200" : "border-slate-700 text-slate-300"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <textarea
            value={post}
            onChange={(e) => setPost(e.target.value)}
            placeholder="Share your question or insight..."
            rows={4}
            className="app-textarea"
          />
          <div className="mt-4 flex justify-end">
            <ReactBitsButton type="submit" variant="primary">Post</ReactBitsButton>
          </div>
        </form>

        <div className="space-y-4">
          {sortedPosts.map((p) => (
            <div key={p._id} className="app-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-cyan-200">{p.user?.name}</div>
                  <div className="text-xs text-slate-500">{p.user?.email}</div>
                  <div className="mt-2">
                    <span className="px-2 py-1 rounded-full text-xs border border-slate-700 text-slate-300">
                      {p.category || "General"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <ReactBitsButton variant="neutral" onClick={() => setEditingPostId(p._id)}>Edit</ReactBitsButton>
                  <ReactBitsButton variant="neutral" onClick={() => handleDelete(p._id)}>Delete</ReactBitsButton>
                </div>
              </div>

              {editingPostId === p._id ? (
                <textarea
                  defaultValue={p.text}
                  onBlur={(e) => handleEdit(p._id, e.target.value)}
                  className="mt-3 app-textarea"
                />
              ) : (
                <p className="mt-3 text-slate-200">{p.text}</p>
              )}

              <div className="mt-4 border-t border-slate-800 pt-4">
                <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-2">Replies</h4>
                <div className="space-y-2">
                  {p.replies?.map((r) => (
                    <div key={r._id} className="rounded-lg bg-slate-950/70 border border-slate-800 p-3 text-sm">
                      <div className="text-slate-300 font-semibold">{r.user?.name}</div>
                      <div className="text-slate-200">{r.text}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a reply..."
                    value={replyText[p._id] || ""}
                    onChange={(e) => setReplyText({ ...replyText, [p._id]: e.target.value })}
                    className="app-input flex-1"
                  />
                  <ReactBitsButton variant="neutral" onClick={() => handleReply(p._id)}>Reply</ReactBitsButton>
                </div>
              </div>
            </div>
          ))}
          {sortedPosts.length === 0 && (
            <div className="app-empty">
              No discussions yet. Start the first thread.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Discuss;
