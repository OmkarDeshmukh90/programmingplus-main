import React, { useState, useEffect } from "react";
import axios from "axios";
import BASE_URL from "../config";

const API_URL = `${BASE_URL}/discuss`;

const Discuss = () => {
  const [post, setPost] = useState("");
  const [posts, setPosts] = useState([]);
  const [editingPostId, setEditingPostId] = useState(null);
  const [replyText, setReplyText] = useState({});
  const token = localStorage.getItem("token");

  // Fetch all posts
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

  // Create new post
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        API_URL,
        { text: post },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts([res.data, ...posts]);
      setPost("");
    } catch (err) {
      console.error("Error posting:", err.response?.data || err.message);
    }
  };

  // Edit post
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

  // Delete post with confirmation
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

  // Add reply
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

  // Common button style
  const buttonStyle = {
    background: "transparent",
    color: "white",
    border: "1px solid white",
    padding: "5px 12px",
    margin: "5px",
    borderRadius: "5px",
    cursor: "pointer",
  };

  return (
    <div style={{ padding: "20px", color: "white", backgroundColor: "black", minHeight: "100vh" }}>
      <h2>Discuss Page</h2>

      {/* Create post */}
      <form onSubmit={handleSubmit}>
        <textarea
          value={post}
          onChange={(e) => setPost(e.target.value)}
          placeholder="Write something..."
          rows="3"
          style={{
            width: "100%",
            marginBottom: "10px",
            background: "transparent",
            color: "white",
            border: "1px solid white",
            padding: "8px",
            borderRadius: "5px",
          }}
        />
        <button type="submit" style={buttonStyle}>Post</button>
      </form>

      {/* Posts */}
      <div style={{ marginTop: "20px" }}>
        <h3>All Posts</h3>
        {posts.map((p) => (
          <div
            key={p._id}
            style={{
              border: "1px solid #555",
              marginBottom: "15px",
              padding: "10px",
              borderRadius: "5px",
            }}
          >
            <strong>{p.user?.name} ({p.user?.email})</strong>

            {/* Edit mode */}
            {editingPostId === p._id ? (
              <>
                <textarea
                  defaultValue={p.text}
                  onBlur={(e) => handleEdit(p._id, e.target.value)}
                  style={{
                    width: "100%",
                    background: "transparent",
                    color: "white",
                    border: "1px solid white",
                    padding: "8px",
                    borderRadius: "5px",
                  }}
                />
                <button onClick={() => setEditingPostId(null)} style={buttonStyle}>Cancel</button>
              </>
            ) : (
              <p>{p.text}</p>
            )}

            <button onClick={() => setEditingPostId(p._id)} style={buttonStyle}>Edit</button>
            <button onClick={() => handleDelete(p._id)} style={buttonStyle}>Delete</button>

            {/* Replies */}
            <div style={{ marginTop: "10px", paddingLeft: "15px" }}>
              <h4>Replies:</h4>
              {p.replies?.map((r) => (
                <div key={r._id} style={{ borderTop: "1px solid #444", marginTop: "5px", paddingTop: "5px" }}>
                  <strong>{r.user?.name}</strong>: {r.text}
                </div>
              ))}

              <input
                type="text"
                placeholder="Write a reply..."
                value={replyText[p._id] || ""}
                onChange={(e) => setReplyText({ ...replyText, [p._id]: e.target.value })}
                style={{
                  background: "transparent",
                  color: "white",
                  border: "1px solid white",
                  padding: "5px",
                  borderRadius: "5px",
                  marginRight: "8px",
                }}
              />
              <button onClick={() => handleReply(p._id)} style={buttonStyle}>Reply</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Discuss;
