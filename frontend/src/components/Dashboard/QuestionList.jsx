import { useEffect, useState, useContext } from "react";
import { getAllQuestions } from "../../api/questions";
import { AuthContext } from "../../context/AuthContext";
import QuestionCard from "./QuestionCard";

export default function QuestionList() {
  const { token } = useContext(AuthContext);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    if (token) {
      getAllQuestions(token)
        .then((res) => setQuestions(res.data))
        .catch((err) => console.error(err));
    }
  }, [token]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {questions.map((q) => (
        <QuestionCard key={q._id} question={q} />
      ))}
    </div>
  );
}
