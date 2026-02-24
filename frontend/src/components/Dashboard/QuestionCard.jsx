import React from "react";
import { useNavigate } from "react-router-dom";

const QuestionCard = ({ question }) => {
  const navigate = useNavigate();

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "text-teal-400"; // Easy
      case "medium":
        return "text-yellow-400"; // Medium
      case "hard":
        return "text-red-500"; // Hard
      default:
        return "text-gray-400";
    }
  };

  // const handleSolveClick = () => {
  //   navigate(`/editor/${question.id}`, { state: { question } });
  // };

  return (
    <div className="w-full flex justify-between items-center bg-[#1a1a1a] hover:bg-[#2a2a2a] px-5 py-3 border border-white/20 rounded-lg transition">
      {/* Left: ID + Title */}
      <div className="flex items-center gap-3">
        <p className="text-gray-400 w-12">{question.id}.</p>
        <h3
          className="text-white font-medium cursor-pointer hover:underline"
        >
          {question.title}
        </h3>
      </div>

      {/* Right: Difficulty */}
      <div>
        <p className={`${getDifficultyColor(question.difficulty)} text-sm`}>
          {question.difficulty || "Unknown"}
        </p>
      </div>
    </div>
  );
};

export default QuestionCard;
