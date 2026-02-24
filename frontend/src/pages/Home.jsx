import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#] text-white">
      <h1 className="text-5xl font-bold mb-4 text-[#61e5f9]">Welcome to Programming+</h1>
      <p className="text-lg mb-6">A next-gen coding platform for all levels</p>
      <div className="flex gap-4">
        <Link
          to="/login"
          className="bg-[#61e5f9] text-black px-6 py-3 rounded hover:bg-blue-400"
        >
          Login
        </Link>
        <Link
          to="/register"
          className="border border-[#61e5f9] px-6 py-3 rounded hover:bg-[#1f2937]"
        >
          Register
        </Link>
      </div>
    </div>
  );
}
