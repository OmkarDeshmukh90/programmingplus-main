import axios from "axios";
import BASE_URL from "../config";

const API = `${BASE_URL}/submissions`;

export const submitCode = async (submission, token) => {
  return axios.post(API, submission, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getQuestionSubmissions = async (questionId, token) => {
  return axios.get(`${API}/${questionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
