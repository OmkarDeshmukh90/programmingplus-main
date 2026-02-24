import axios from "axios";
import BASE_URL from "../config";

const API = `${BASE_URL}/contests`;
const authHeaders = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export const getContests = (token) => axios.get(API, authHeaders(token));
export const createContest = (payload, token) => axios.post(API, payload, authHeaders(token));
export const joinContest = (contestId, token) => axios.post(`${API}/${contestId}/join`, {}, authHeaders(token));
export const startAssessment = (contestId, token) => axios.post(`${API}/${contestId}/start`, {}, authHeaders(token));
export const getAssessment = (contestId, token) => axios.get(`${API}/${contestId}/assessment`, authHeaders(token));
export const saveAssessmentAnswer = (contestId, payload, token) =>
  axios.post(`${API}/${contestId}/assessment/answer`, payload, authHeaders(token));
export const submitAssessment = (contestId, payload, token) =>
  axios.post(`${API}/${contestId}/submit`, payload, authHeaders(token));
export const getMyContestAttempts = (token) => axios.get(`${API}/me/attempts`, authHeaders(token));
export const getCompanyContests = (token) => axios.get(`${API}/company/mine`, authHeaders(token));

export const createLiveInterviewSession = (contestId, payload, token) =>
  axios.post(`${API}/${contestId}/live-interviews`, payload, authHeaders(token));
export const getMyLiveInterviews = (token) => axios.get(`${API}/live-interviews/mine`, authHeaders(token));
export const joinLiveInterview = (sessionId, token) =>
  axios.post(`${API}/live-interviews/${sessionId}/join`, {}, authHeaders(token));
export const startLiveInterview = (sessionId, token) =>
  axios.post(`${API}/live-interviews/${sessionId}/start`, {}, authHeaders(token));
export const updateLiveInterviewCode = (sessionId, payload, token) =>
  axios.post(`${API}/live-interviews/${sessionId}/update-code`, payload, authHeaders(token));
export const completeLiveInterview = (sessionId, payload, token) =>
  axios.post(`${API}/live-interviews/${sessionId}/complete`, payload, authHeaders(token));
