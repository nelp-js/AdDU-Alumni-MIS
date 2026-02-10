import axios from "axios";
import { ACCESS_TOKEN } from "./constants";

//for local
// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
// });

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://sia-2.onrender.com",
});

/** Public GET endpoints: no auth header so unauthenticated users and expired tokens don't cause 401. */
function isPublicReadOnly(config) {
  if (config.method && config.method.toLowerCase() !== "get") return false;
  const path = (config.url || "");
  if (path.startsWith("/api/events") && !path.includes("/approve") && !path.includes("/reject") && !path.includes("/delete")) return true;
  if (path.startsWith("/api/articles/published")) return true;
  return false;
}

api.interceptors.request.use(
  (config) => {
    if (isPublicReadOnly(config)) return config;
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