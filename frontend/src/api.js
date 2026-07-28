import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN, USER_IS_ADMIN, USER_PROFILE_CACHE } from "./constants";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
});

/** Clear tokens and cached profile so UI cannot get stuck (token present but /api/user/me/ failed). */
export function clearClientAuthSession() {
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(REFRESH_TOKEN);
  localStorage.removeItem(USER_IS_ADMIN);
  localStorage.removeItem(USER_PROFILE_CACHE);
}

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

/**
 * Expired/invalid JWT is still sent on AllowAny routes; DRF JWT can return 401 and break public pages.
 * Clear session and retry safe read-only requests once without Authorization.
 */
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error.response?.status;
    const cfg = error.config;
    if (status !== 401 || !cfg || cfg._authRetry) {
      return Promise.reject(error);
    }
    const hadAuth = !!cfg.headers?.Authorization;
    if (!hadAuth) {
      return Promise.reject(error);
    }
    clearClientAuthSession();
    cfg._authRetry = true;
    delete cfg.headers.Authorization;
    const method = (cfg.method || "get").toLowerCase();
    if (method === "get" || method === "head") {
      return api.request(cfg);
    }
    return Promise.reject(error);
  }
);

export default api;