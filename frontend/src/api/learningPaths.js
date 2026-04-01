import axios from "axios";
import BASE_URL from "../config";

const API = `${BASE_URL}/learning-paths`;
const authHeaders = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export const getActiveLearningPath = (token) =>
  axios.get(`${API}/active`, authHeaders(token));

export const createLearningPath = (token, payload) =>
  axios.post(API, payload, authHeaders(token));

export const updateLearningTask = (token, id, payload) =>
  axios.patch(`${API}/${id}/tasks`, payload, authHeaders(token));
