import React from "react";
import { Github, Code2, Star, GitBranch } from "lucide-react";

const Contribute = () => {
  const githubRepo = "https://github.com/Sonu-Kumhar"; // 🔹 change this to your repo link

  return (
    <div className="min-h-screen bg-[#0d1117] text-white px-6 py-12">
      <div className="max-w-4xl mx-auto bg-[#1e1e1e] border border-gray-700 rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Github className="w-12 h-12 text-cyan-400 mb-3" />
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">
            💡 Contribute to Programming+
          </h1>
          <p className="text-gray-400 max-w-2xl">
            We’re building a community-driven coding platform! Whether you’re a beginner or a pro, 
            your contributions can make a huge impact — from improving docs to adding new features 🚀
          </p>
        </div>

        {/* Contribution Template */}
        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-cyan-300 flex items-center gap-2 mb-2">
              <Code2 className="w-5 h-5" /> How to Contribute
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>🍴 Fork the repository on GitHub.</li>
              <li>🌱 Create a new branch for your feature or fix.</li>
              <li>💻 Make your changes and commit with a clear message.</li>
              <li>📤 Push to your fork and open a Pull Request.</li>
              <li>🎉 Wait for review and merge approval!</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-cyan-300 flex items-center gap-2 mb-2">
              <GitBranch className="w-5 h-5" /> Areas You Can Help With
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>🧩 Adding new coding problems or learning paths.</li>
              <li>⚙️ Improving UI/UX or fixing frontend bugs.</li>
              <li>🧠 Enhancing backend APIs and MongoDB models.</li>
              <li>📚 Writing better documentation and setup guides.</li>
              <li>🚀 Suggesting new features or integrations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-cyan-300 flex items-center gap-2 mb-2">
              <Star className="w-5 h-5" /> Contribution Guidelines
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Follow clean code and commit message conventions.</li>
              <li>Write comments for complex logic.</li>
              <li>Ensure no sensitive data is pushed.</li>
              <li>Be respectful and collaborate positively 💬</li>
            </ul>
          </section>
        </div>

        {/* GitHub Button */}
        <div className="text-center mt-10">
          <button
            onClick={() => window.open(githubRepo, "_blank")}
            className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 px-6 py-3 rounded-lg text-lg font-medium transition-all shadow-md"
          >
            <Github className="w-5 h-5" />
            Contribute on GitHub
          </button>
        </div>
      </div>
    </div>
  );
};

export default Contribute;
