import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import { REFRESH_TOKEN, ACCESS_TOKEN, USER_IS_ADMIN } from "../constants";
import { useState, useEffect } from "react";

function AdminProtectedRoute({ children }) {
    const [status, setStatus] = useState(null); // null = loading, true = admin, false = not admin

    useEffect(() => {
        let cancelled = false;

        const refreshToken = async () => {
            const refresh = localStorage.getItem(REFRESH_TOKEN);
            if (!refresh) return false;
            try {
                const res = await api.post("/api/token/refresh/", { refresh });
                if (res.status === 200) {
                    localStorage.setItem(ACCESS_TOKEN, res.data.access);
                    return true;
                }
            } catch (_) {}
            return false;
        };

        const check = async () => {
            let token = localStorage.getItem(ACCESS_TOKEN);
            if (!token) {
                if (!cancelled) setStatus(false);
                return;
            }

            try {
                let decoded = jwtDecode(token);
                const now = Date.now() / 1000;

                // Refresh if expired
                if (decoded.exp < now) {
                    const ok = await refreshToken();
                    if (!ok) {
                        if (!cancelled) setStatus(false);
                        return;
                    }
                    token = localStorage.getItem(ACCESS_TOKEN);
                    decoded = jwtDecode(token);
                }

                // Read is_superuser directly from JWT — backend always sets this
                const isAdmin = Boolean(decoded.is_superuser);
                localStorage.setItem(USER_IS_ADMIN, isAdmin ? "true" : "false");
                if (!cancelled) setStatus(isAdmin);

            } catch (_) {
                // Last resort: use cached value
                const cachedAdmin = localStorage.getItem(USER_IS_ADMIN) === "true";
                if (!cancelled) setStatus(cachedAdmin);
            }
        };

        check();
        return () => { cancelled = true; };
    }, []);

    if (status === null) {
        return (
            <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F7', color: '#6d7280' }}>
                Loading...
            </div>
        );
    }

    if (status === false) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default AdminProtectedRoute;