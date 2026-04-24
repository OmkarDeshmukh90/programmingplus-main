/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useState, useEffect } from "react";
import axios from "axios";
import BASE_URL from "../config";
import { AuthContext } from "../context/AuthContext";
import { MessageSquare, Plus, Send, CornerDownRight, Trash2, Edit3, MessageCircle, Sparkles, X, Check } from "lucide-react";

const API_URL = `${BASE_URL}/discuss`;

export default function Discuss() {
  const [post, setPost] = useState("");
  const [category, setCategory] = useState("General");
  const [posts, setPosts] = useState([]);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostText, setEditPostText] = useState("");
  const [replyText, setReplyText] = useState({});
  const [sortBy, setSortBy] = useState("newest");
  const [filterCategory, setFilterCategory] = useState("All");
  const { token, userName } = useContext(AuthContext);

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

  const handleEditInit = (p) => {
    setEditingPostId(p._id);
    setEditPostText(p.text);
  };

  const handleEditSave = async (id) => {
    if (!editPostText.trim()) return;
    try {
      const res = await axios.put(
        `${API_URL}/${id}`,
        { text: editPostText },
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
    if (!replyText[id]?.trim()) return;
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

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "?");

  return (
    <div className="min-h-[calc(100vh-80px)] space-y-8 pb-10 max-w-5xl mx-auto">
      
      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-[#0b0f19] to-[#040816] p-8 lg:p-12 shadow-[0_0_40px_rgba(99,102,241,0.1)] backdrop-blur-xl">
        <div className="absolute -right-20 -top-20 h-[300px] w-[300px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none"></div>
        <div className="absolute left-10 bottom-10 h-[200px] w-[200px] rounded-full bg-violet-500/10 blur-[80px] pointer-events-none"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-6 shadow-inner">
            <MessageSquare className="text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]" size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Global <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Discussion</span>
          </h1>
          <p className="max-w-2xl text-lg text-slate-300 font-medium">
            Share interview experiences, ask for algorithmic help, or discuss system design strategies with the community.
          </p>
        </div>
      </div>

      {/* ── New Post Form ── */}
      <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6 shadow-xl backdrop-blur-md">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 rounded-t-3xl opacity-50"></div>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4">
            <textarea
              value={post}
              onChange={(e) => setPost(e.target.value)}
              placeholder="What's on your mind? Share a question or insight..."
              rows={3}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all shadow-inner"
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500 mr-2">Tag:</span>
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                      category === c
                        ? "bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                        : "bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                disabled={!post.trim()}
                className="group flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 font-black text-white hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                <Plus size={18} className="transition-transform group-hover:rotate-90" /> Post Thread
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ── Filters & Sorting ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 border-b border-white/5">
        <div className="flex flex-wrap items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner w-full sm:w-auto">
          {["All", ...categories].map((c) => (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filterCategory === c
                  ? "bg-white/10 text-white shadow-md"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="w-full sm:w-auto flex justify-end">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-300 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 min-w-[150px] cursor-pointer"
          >
            <option value="newest" className="bg-slate-900">Newest First</option>
            <option value="helpful" className="bg-slate-900">Most Replied</option>
            <option value="unanswered" className="bg-slate-900">Unanswered</option>
          </select>
        </div>
      </div>

      {/* ── Threads Feed ── */}
      <div className="space-y-6">
        {sortedPosts.map((p) => (
          <div key={p._id} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.03] transition-all duration-300 shadow-xl backdrop-blur-md">
            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-black text-lg shadow-[0_0_15px_rgba(99,102,241,0.15)] flex-shrink-0">
                    {getInitial(p.user?.name)}
                  </div>
                  <div>
                    <div className="text-base font-bold text-white flex items-center gap-2">
                      {p.user?.name || "Anonymous"} 
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 text-slate-400">
                        {p.category || "General"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      {new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                {userName === p.user?.name && (
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                    <button onClick={() => handleEditInit(p)} className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleDelete(p._id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Body */}
              {editingPostId === p._id ? (
                <div className="mt-4 mb-6">
                  <textarea
                    autoFocus
                    value={editPostText}
                    onChange={(e) => setEditPostText(e.target.value)}
                    className="w-full bg-black/40 border border-indigo-500/50 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    rows={4}
                  />
                  <div className="flex gap-2 justify-end mt-3">
                    <button onClick={() => setEditingPostId(null)} className="px-4 py-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors text-sm font-bold">
                      <X size={16} className="inline mr-1" /> Cancel
                    </button>
                    <button onClick={() => handleEditSave(p._id)} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors text-sm font-bold">
                      <Check size={16} className="inline mr-1" /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{p.text}</p>
              )}
            </div>

            {/* Replies Section */}
            <div className="bg-black/30 border-t border-white/5 p-6 sm:px-8">
              <div className="flex items-center gap-2 mb-6">
                <MessageCircle size={16} className="text-slate-500" />
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  {p.replies?.length || 0} {(p.replies?.length === 1) ? "Reply" : "Replies"}
                </h4>
              </div>

              <div className="space-y-4">
                {p.replies?.map((r) => (
                  <div key={r._id} className="relative pl-6 border-l-2 border-indigo-500/20 hover:border-indigo-500/50 transition-colors">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-bold text-indigo-200">{r.user?.name || "Anonymous"}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{r.text}</p>
                  </div>
                ))}
              </div>

              {/* Reply Input */}
              <div className="mt-6 relative flex items-center">
                <CornerDownRight size={18} className="absolute left-0 text-slate-600 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Write a reply..."
                  value={replyText[p._id] || ""}
                  onChange={(e) => setReplyText({ ...replyText, [p._id]: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleReply(p._id)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-8 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-all ml-2"
                />
                <button
                  onClick={() => handleReply(p._id)}
                  disabled={!replyText[p._id]?.trim()}
                  className="absolute right-2 p-2 rounded-lg text-indigo-400 hover:bg-indigo-500/20 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {sortedPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl border border-dashed border-white/10 bg-white/[0.01]">
            <Sparkles className="w-12 h-12 text-indigo-500/50 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">It's quiet in here...</h3>
            <p className="text-sm text-slate-500 max-w-md">
              There are no discussions in this category yet. Be the first to start a conversation, share a tip, or ask a question!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
