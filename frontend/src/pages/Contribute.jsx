import React from "react";
import { Github, Code2, Star, GitBranch } from "lucide-react";

const Contribute = () => {
  const githubRepo = "https://github.com/Sonu-Kumhar";

  return (
    <div className="app-page">
      <div className="app-shell max-w-4xl">
        <div className="app-card p-8">
        <div className="flex flex-col items-center text-center mb-8">
          <Github className="w-12 h-12 text-cyan-300 mb-3" />
          <h1 className="text-3xl font-semibold text-white mb-2">
            Contribute to Programming+
          </h1>
          <p className="text-slate-300 max-w-2xl">
            Join the community building a hiring-ready coding platform. Improve the product,
            share ideas, and help shape the future of technical assessment.
          </p>
        </div>

        <div className="space-y-6 text-slate-300">
          <section className="app-panel p-5">
            <h2 className="text-xl font-semibold text-cyan-200 flex items-center gap-2 mb-2">
              <Code2 className="w-5 h-5" /> How to Contribute
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Fork the repository on GitHub.</li>
              <li>Create a feature branch with a clear focus.</li>
              <li>Ship improvements with concise, descriptive commits.</li>
              <li>Open a pull request with a short summary and screenshots if applicable.</li>
            </ul>
          </section>

          <section className="app-panel p-5">
            <h2 className="text-xl font-semibold text-cyan-200 flex items-center gap-2 mb-2">
              <GitBranch className="w-5 h-5" /> Areas You Can Help With
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Adding new problems, topics, or learning paths.</li>
              <li>Improving UI/UX quality and accessibility.</li>
              <li>Enhancing backend APIs or data models.</li>
              <li>Writing documentation and onboarding guides.</li>
            </ul>
          </section>

          <section className="app-panel p-5">
            <h2 className="text-xl font-semibold text-cyan-200 flex items-center gap-2 mb-2">
              <Star className="w-5 h-5" /> Contribution Guidelines
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Keep changes focused and well-scoped.</li>
              <li>Document UX changes with clear screenshots or notes.</li>
              <li>Avoid committing secrets or local configuration.</li>
              <li>Be respectful and collaborative in review threads.</li>
            </ul>
          </section>
        </div>

        <div className="text-center mt-10">
          <button
            onClick={() => window.open(githubRepo, "_blank")}
            className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 px-6 py-3 rounded-xl text-lg font-medium transition-all shadow-md"
          >
            <Github className="w-5 h-5" />
            Contribute on GitHub
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Contribute;
