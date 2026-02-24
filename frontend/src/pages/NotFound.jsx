import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#111827] text-white">
      <h1 className="text-6xl font-bold mb-4 text-[#61e5f9]">404</h1>
      <p className="text-xl mb-6">Page not found</p>
      <Link
        to="/"
        className="bg-[#61e5f9] text-black px-6 py-3 rounded hover:bg-blue-400"
      >
        Go Home
      </Link>
    </div>
  );
}
