import axios from "axios";
import BASE_URL from "../config";

const API_URL = `${BASE_URL}/questions`;

export const getAllQuestions = async (token) => {
  const res = await axios.get(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

export const getQuestionById = async (id, token) => {
  const res = await axios.get(`${API_URL}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};
