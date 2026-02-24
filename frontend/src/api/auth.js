import axios from "axios";
import BASE_URL from "../config";

const API_URL = BASE_URL;

export const registerSendOtp = (data) => axios.post(`${API_URL}/register/send-otp`, data);
export const registerVerifyOtp = (data) => axios.post(`${API_URL}/register/verify-otp`, data);
export const login = (data) => axios.post(`${API_URL}/login`, data);
export const forgotPassword = (data) => axios.post(`${API_URL}/forgot-password`, data);
export const verifyOtp = (data) => axios.post(`${API_URL}/forgot-password/verify-otp`, data);
export const resetPassword = (data) => axios.post(`${API_URL}/reset-password`, data);
