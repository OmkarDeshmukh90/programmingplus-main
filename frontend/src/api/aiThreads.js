import axios from "axios";
import BASE_URL from "../config";

const API = `${BASE_URL}/ai/threads`;
const authHeaders = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export const listAIThreads = (token, limit = 20) =>
  axios.get(`${API}?limit=${limit}`, authHeaders(token));

export const createAIThread = (token, payload) =>
  axios.post(API, payload, authHeaders(token));

export const updateAIThread = (token, id, payload) =>
  axios.patch(`${API}/${id}`, payload, authHeaders(token));

export const deleteAIThread = (token, id) =>
  axios.delete(`${API}/${id}`, authHeaders(token));
