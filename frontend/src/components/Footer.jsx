import React from "react";

const Footer = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/80 text-slate-400">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p>&copy; {new Date().getFullYear()} Programming+. All rights reserved.</p>
          <p className="text-sm text-slate-500">Built for learning, contests, and hiring workflows.</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <a href="/#learn" className="hover:text-slate-200">Learn</a>
          <a href="/#compete" className="hover:text-slate-200">Compete</a>
          <a href="/#hire" className="hover:text-slate-200">Hire</a>
          <a href="/ai-chat" className="hover:text-slate-200">AI Assistant</a>
          <a href="/contribute" className="hover:text-slate-200">Contribute</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
