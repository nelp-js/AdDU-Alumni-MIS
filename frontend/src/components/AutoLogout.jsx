import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ACCESS_TOKEN, REFRESH_TOKEN, USER_IS_ADMIN, USER_PROFILE_CACHE } from '../constants';

const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes of inactivity
const LAST_ACTIVITY_KEY = 'last_activity_at';

function AutoLogout() {
    const navigate = useNavigate();
    const location = useLocation();
    const timeoutRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) return;

        const handleLogout = () => {
            localStorage.removeItem(ACCESS_TOKEN);
            localStorage.removeItem(REFRESH_TOKEN);
            localStorage.removeItem(USER_IS_ADMIN);
            localStorage.removeItem(USER_PROFILE_CACHE);
            localStorage.removeItem(LAST_ACTIVITY_KEY);
            navigate('/login?inactivity=1', { replace: true });
            window.location.reload();
        };

        const getLastActivity = () => {
            const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
            const parsed = Number(raw);
            return Number.isFinite(parsed) ? parsed : Date.now();
        };

        const writeActivity = () => {
            localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
        };

        const resetTimer = () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            writeActivity();
            timeoutRef.current = setTimeout(() => {
                const idleFor = Date.now() - getLastActivity();
                if (idleFor >= TIMEOUT_MS) {
                    handleLogout();
                    return;
                }
                resetTimer();
            }, TIMEOUT_MS);
        };

        const windowEvents = ['mousemove', 'keydown', 'click', 'touchstart', 'touchmove', 'pointerdown', 'wheel'];
        const documentEvents = ['input', 'focusin', 'scroll'];
        windowEvents.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));
        documentEvents.forEach((ev) => document.addEventListener(ev, resetTimer, { capture: true, passive: true }));

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') resetTimer();
        };
        document.addEventListener('visibilitychange', handleVisibility);

        const handleStorage = (e) => {
            if (e.key === LAST_ACTIVITY_KEY) {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => {
                    const idleFor = Date.now() - getLastActivity();
                    if (idleFor >= TIMEOUT_MS) handleLogout();
                    else resetTimer();
                }, TIMEOUT_MS);
            }
        };
        window.addEventListener('storage', handleStorage);

        resetTimer();

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            windowEvents.forEach((ev) => window.removeEventListener(ev, resetTimer));
            documentEvents.forEach((ev) => document.removeEventListener(ev, resetTimer, true));
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('storage', handleStorage);
        };
    }, [navigate, location.pathname]);

    return null;
}

export default AutoLogout;