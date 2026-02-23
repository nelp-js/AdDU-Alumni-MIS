import axios from "axios";
import { ACCESS_TOKEN } from "./constants";

//for local
// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
// });

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://sia-2.onrender.com",
});

/** Public GET endpoints: we still add auth when available so admins see full data (e.g. Event Management). */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;