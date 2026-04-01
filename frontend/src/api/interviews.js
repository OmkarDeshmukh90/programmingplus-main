import axios from "axios";
import BASE_URL from "../config";

const API = `${BASE_URL}/interviews`;
const authHeaders = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export const createInterview = (payload, token) =>
  axios.post(API, payload, authHeaders(token));

export const listInterviews = (token) =>
  axios.get(API, authHeaders(token));

export const getInterview = (id, token) =>
  axios.get(`${API}/${id}`, authHeaders(token));

export const getInterviewByRoom = (roomToken) =>
  axios.get(`${API}/room/${roomToken}`);

export const updateInterview = (id, payload, token) =>
  axios.put(`${API}/${id}`, payload, authHeaders(token));

export const updateInterviewStatus = (id, status, token) =>
  axios.put(`${API}/${id}/status`, { status }, authHeaders(token));

export const evaluateInterview = (id, payload, token) =>
  axios.post(`${API}/${id}/evaluate`, payload, authHeaders(token));

export const getInterviewReport = (id, token) =>
  axios.get(`${API}/${id}/report`, authHeaders(token));

export const deleteInterview = (id, token) =>
  axios.delete(`${API}/${id}`, authHeaders(token));

export const listMyInterviews = (token) =>
  axios.get(`${API}/my-interviews`, authHeaders(token));
