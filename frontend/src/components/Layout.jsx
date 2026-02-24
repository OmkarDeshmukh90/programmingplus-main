// src/components/Layout.jsx
import React from "react";
import Navbar from "./Navbar"; // your existing navbar

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      {/* 👇 This ensures every page starts below navbar */}
      <main className="pt-20 px-6">
        {children}
      </main>
    </div>
  );
}
