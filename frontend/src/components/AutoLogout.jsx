import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ACCESS_TOKEN } from '../constants';

const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes of inactivity

function AutoLogout() {
    const navigate = useNavigate();
    const location = useLocation();
    const timeoutRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) return;

        const handleLogout = () => {
            localStorage.clear();
            navigate('/login?inactivity=1', { replace: true });
            window.location.reload();
        };

        const resetTimer = () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(handleLogout, TIMEOUT_MS);
        };

        const events = ['mousemove', 'keydown', 'keypress', 'click', 'scroll', 'touchstart', 'touchmove'];
        events.forEach((ev) => window.addEventListener(ev, resetTimer));

        resetTimer();

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            events.forEach((ev) => window.removeEventListener(ev, resetTimer));
        };
    }, [navigate, location.pathname]);

    return null;
}

export default AutoLogout;