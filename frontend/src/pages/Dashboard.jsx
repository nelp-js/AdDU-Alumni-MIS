import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import {
    FiUsers, FiCalendar, FiBriefcase, FiDollarSign, FiFileText, FiBarChart2
} from 'react-icons/fi';
import '../styles/Dashboard.css';
import { useTitle } from '../Hooks/useTitle';

// 👇 IMPORT THE CONTEXT HOOK
import { useNotifications } from '../Hooks/NotificationContext';

const ICON_COLOR = '#040354';

const MODULE_CARDS = [
    { icon: 'users', title: 'User Management', description: 'Manage registration and accounts of users.', button: 'Manage Users', to: '/dashboard/users' },
    { icon: 'document', title: 'CMS & News Feed', description: 'Manage website content, news articles, and information dissemination', button: 'Manage Content', to: '/dashboard/content', secondaryButton: 'Create Content', secondaryTo: '/dashboard/content/create' },
    { icon: 'calendar', title: 'Event Management', description: 'Create, manage, and track alumni events and attendance', button: 'Manage Events', to: '/dashboard/events', secondaryButton: 'Create Event', secondaryTo: '/create-event' },
    { icon: 'briefcase', title: 'Job & Internship', description: 'Job postings, applications, and career tracking', button: 'Manage Jobs', to: '#' },
    { icon: 'survey', title: 'Feedback & Surveys', description: 'Create surveys, collect feedback, and analyze tracer studies', button: 'Manage Surveys', to: '#' },
    { icon: 'fundraising', title: 'Fundraising & Donations', description: 'Campaign management, donations, and financial support', button: 'Manage Campaigns', to: '#' },
];

const STAT_ICON_MAP = { people: FiUsers, calendar: FiCalendar, briefcase: FiBriefcase, donation: FiDollarSign };
const MODULE_ICON_MAP = { users: FiUsers, document: FiFileText, calendar: FiCalendar, briefcase: FiBriefcase, survey: FiBarChart2, fundraising: FiDollarSign };

function StatIcon({ type }) {
    const Icon = STAT_ICON_MAP[type];
    return Icon ? <Icon size={48} color={ICON_COLOR} strokeWidth={1.5} /> : null;
}

function ModuleIcon({ type }) {
    const Icon = MODULE_ICON_MAP[type];
    return Icon ? <Icon size={28} color={ICON_COLOR} strokeWidth={1.5} /> : null;
}

function Dashboard() {
    useTitle('Admin Dashboard');
    
    const { notifications } = useNotifications();

    const [alumniCount, setAlumniCount] = useState(0);
    const [eventsCount, setEventsCount] = useState(0);
    const [statsLoading, setStatsLoading] = useState(true);
    const [activities, setActivities] = useState([]);
    const [activitiesLoading, setActivitiesLoading] = useState(true);
    
    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleString(undefined, {
                month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
            });
        } catch { return dateStr; }
    };

    useEffect(() => {

        Promise.all([
            api.get('/api/users/').then((res) => {
                const active = res.data.filter(u => !u.is_superuser && u.is_active !== false);
                setAlumniCount(active.length);
            }),
            api.get('/api/events/').then((res) => {
                const approved = (res.data || []).filter(e => e.is_approved === true);
                setEventsCount(approved.length);
            }),
        ]).catch(err => console.error(err)).finally(() => setStatsLoading(false));

        api.get('/api/activities/').then((res) => setActivities(res.data)).catch(() => {}).finally(() => setActivitiesLoading(false));

    }, []);

    const statCards = [
        { icon: 'people', value: statsLoading ? '...' : alumniCount.toLocaleString(), label: 'Total Alumni' },
        { icon: 'calendar', value: statsLoading ? '...' : eventsCount.toLocaleString(), label: 'Total Events' },
        { icon: 'briefcase', value: '156', label: 'Active Job Postings' },
    ];

    return (
        <div className="dashboard-page">
            <Header />
            <main className="dashboard-main">
                <h1 className="dashboard-title">Admin Dashboard</h1>

                <section className="dashboard-stats">
                    {statCards.map((card) => (
                        <div key={card.label} className="dashboard-stat-card">
                            <div className="dashboard-stat-icon"><StatIcon type={card.icon} /></div>
                            <div className="dashboard-stat-value">{card.value}</div>
                            <div className="dashboard-stat-label">{card.label}</div>
                        </div>
                    ))}
                </section>

                <section className="dashboard-modules">
                    {MODULE_CARDS.map((card) => {
                        let badgeValue = 0;
                        if (card.title === 'User Management') badgeValue = notifications.users;
                        if (card.title === 'Event Management') badgeValue = notifications.events;
                        if (card.title === 'CMS & News Feed') badgeValue = notifications.articles;

                        return (
                            <div key={card.title} className="dashboard-module-card" style={{ position: 'relative' }}>
                                {badgeValue > 0 && (
                                    <div className="dashboard-notification-badge">{badgeValue}</div>
                                )}
                                <div className="dashboard-module-icon"><ModuleIcon type={card.icon} /></div>
                                <h2 className="dashboard-module-title">{card.title}</h2>
                                <p className="dashboard-module-desc">{card.description}</p>
                                <div className="dashboard-module-actions">
                                    <Link to={card.to} className="dashboard-module-btn">{card.button}</Link>
                                    {card.secondaryButton && (
                                        <Link to={card.secondaryTo} className="dashboard-module-btn secondary">{card.secondaryButton}</Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </section>

                <section className="dashboard-activities">
                    <h2 className="dashboard-activities-title">Recent Activities</h2>
                    <div className="dashboard-table-wrap">
                        <table className="dashboard-table">
                            <thead>
                                <tr><th>DATE</th><th>ACTIVITY</th><th>MODULE</th><th>USER</th><th>STATUS</th></tr>
                            </thead>
                            <tbody>
                                {activitiesLoading ? (
                                    <tr><td colSpan="5" style={{textAlign:'center', padding:'20px'}}>Loading...</td></tr>
                                ) : (
                                    activities.map((row) => (
                                        <tr key={row.id}>
                                            <td>{formatDate(row.timestamp)}</td>
                                            <td>{row.action}</td>
                                            <td>{row.module}</td>
                                            <td>{row.user}</td>
                                            <td><span className="dashboard-status">✓ {row.status}</span></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}

export default Dashboard;