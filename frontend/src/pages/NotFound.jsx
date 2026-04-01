import React from "react";
import { Link } from "react-router-dom";
import ReactBitsButton from "../components/ui/ReactBitsButton";

export default function NotFound() {
  return (
    <div className="app-page">
      <div className="app-shell flex flex-col items-center justify-center text-center">
        <div className="app-card p-10 max-w-lg w-full">
          <h1 className="text-6xl font-bold mb-4 text-cyan-300">404</h1>
          <p className="text-xl mb-6 text-slate-300">Page not found</p>
          <Link to="/">
            <ReactBitsButton variant="primary">Go Home</ReactBitsButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
