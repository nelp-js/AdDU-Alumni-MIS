import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState({ total: 0, users: 0, events: 0, articles: 0 });

    const fetchStats = async () => {
        try {
            const res = await api.get('/api/dashboard/stats/');
            setNotifications(res.data);
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 1 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <NotificationContext.Provider value={{ notifications, refreshStats: fetchStats }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);