import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const API = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

API.interceptors.request.use(
  (req) => {
    const token = localStorage.getItem("token");
    if (token) req.headers.Authorization = `Bearer ${token}`;
    return req;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      err.message ||
      "Unknown API error";
    return Promise.reject({ ...err, message: msg });
  }
);

export const registerUser = (data) => API.post("/register", data);
export const loginUser = (data) => API.post("/login", data);
export const getProfile = () => API.get("/profile");

export const addSkill = (data) => API.post("/skills", data);
export const getSkills = () => API.get("/skills");
export const updateSkill = (id, data) => API.put(`/skills/${id}`, data);
export const deleteSkill = (id) => API.delete(`/skills/${id}`);

export const sendTradeRequest = (data) => API.post("/trade/request", data);
export const getTradeRequests = () => API.get("/trade/requests");
export const acceptTradeRequest = (id) => API.put(`/trade/requests/${id}/accept`);
export const rejectTradeRequest = (id) => API.put(`/trade/requests/${id}/reject`);

export const getChatHistory = (requestId) =>
  API.get(`/chat/${requestId}`);

export const sendChatMessage = (data) =>
  API.post("/chat/send", data);

export const pingServer = () => API.get("/profile").catch(() => null);

export default API;
