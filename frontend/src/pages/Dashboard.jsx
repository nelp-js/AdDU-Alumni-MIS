import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import {
    FiUsers, FiCalendar, FiBriefcase, FiDollarSign, FiFileText
} from 'react-icons/fi';
import { FaHandHoldingHeart, FaHeart } from 'react-icons/fa';
import '../styles/Dashboard.css';
import { useTitle } from '../Hooks/useTitle';
import { useNotifications } from '../Hooks/NotificationContext';
import StatCarousel from '../components/StatCarousel';

const ICON_COLOR = '#040354';

const MODULE_CARDS = [
    { icon: 'users',       title: 'User Management',         description: 'Manage registration and accounts of users.',                                       button: 'Manage Users',     to: '/dashboard/users' },
    { icon: 'document',    title: 'CMS & News Feed',         description: 'Manage website content, news articles, and information dissemination.',             button: 'Manage Content',   to: '/dashboard/content',  secondaryButton: 'Create Content',    secondaryTo: '/dashboard/content/create' },
    { icon: 'calendar',    title: 'Event Management',        description: 'Create, manage, and track alumni events and attendance.',                           button: 'Manage Events',    to: '/dashboard/events',   secondaryButton: 'Create Event',      secondaryTo: '/create-event' },
    { icon: 'briefcase',   title: 'Job & Internship',        description: 'Job postings, applications, and career tracking.',                                  button: 'Manage Jobs & Internships',      to: '/dashboard/jobs',     secondaryButton: 'Create Job or Internship',        secondaryTo: '/dashboard/jobs/create' },
    { icon: 'survey',      title: 'Volunteer',               description: 'Manage volunteer opportunities and community engagement activities.',                button: 'Manage Volunteer', to: '/dashboard/volunteers', secondaryButton: 'Create Volunteer Opportunity', secondaryTo: '/dashboard/volunteer/create' },
    { icon: 'fundraising', title: 'Fundraising & Campaigns', description: 'Campaign management, contributions, and financial support.',                        button: 'Manage Campaigns', to: '/dashboard/campaigns', secondaryButton: 'Create Campaign',   secondaryTo: '/dashboard/donations/create' },
];

const STAT_ICON_MAP   = { people: FiUsers, calendar: FiCalendar, briefcase: FiBriefcase, donation: FaHeart, document: FiFileText, volunteer: FaHandHoldingHeart };
const MODULE_ICON_MAP = { users: FiUsers, document: FiFileText, calendar: FiCalendar, briefcase: FiBriefcase, survey: FaHandHoldingHeart, fundraising: FaHeart };

function StatIcon({ type, color }) {
    const Icon = STAT_ICON_MAP[type];
    const c = color || ICON_COLOR;
    return Icon ? <Icon size={48} color={c} strokeWidth={1.5} /> : null;
}

function ModuleIcon({ type }) {
    const Icon = MODULE_ICON_MAP[type];
    return Icon ? <Icon size={28} color={ICON_COLOR} strokeWidth={1.5} /> : null;
}

function Dashboard() {
    useTitle('Admin Dashboard');

    const { notifications } = useNotifications();

    const [alumniCount,      setAlumniCount]      = useState(0);
    const [eventsCount,      setEventsCount]       = useState(0);
    const [articlesCount,    setArticlesCount]     = useState(0);
    const [jobsCount,        setJobsCount]         = useState(0);
    const [internshipsCount, setInternshipsCount]  = useState(0);
    const [volunteerCount,   setVolunteerCount]    = useState(0);
    const [campaignsCount,   setCampaignsCount]    = useState(0);
    const [statsLoading,     setStatsLoading]      = useState(true);
    const [activities,       setActivities]        = useState([]);
    const [activitiesLoading, setActivitiesLoading] = useState(true);

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleString(undefined, {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: 'numeric', minute: '2-digit',
            });
        } catch { return dateStr; }
    };

    useEffect(() => {
        Promise.all([
            api.get('/api/users/').then((res) => {
                const active = (res.data || []).filter(u => !u.is_superuser && u.is_active !== false && u.is_approved);
                setAlumniCount(active.length);
            }),
            api.get('/api/events/').then((res) => {
                setEventsCount((res.data || []).filter(e => e.status === 'approved' && e.is_hidden !== true).length);
            }),
            api.get('/api/articles/published/').then((res) => {
                setArticlesCount(Array.isArray(res.data) ? res.data.length : 0);
            }),
            api.get('/api/jobs/admin/').then((res) => {
                setJobsCount((res.data || []).filter(j => j.status === 'approved').length);
            }).catch(() => {}),
            api.get('/api/internships/admin/').then((res) => {
                setInternshipsCount((res.data || []).filter(i => i.status === 'approved').length);
            }).catch(() => {}),
            api.get('/api/volunteers/admin/').then((res) => {
                setVolunteerCount((res.data || []).filter(v => v.status === 'approved' && v.is_hidden !== true).length);
            }).catch(() => {}),
            api.get('/api/campaigns/').then((res) => {
                setCampaignsCount((res.data || []).filter(c => c.is_active && c.status === 'approved').length);
            }).catch(() => {}),
        ])
        .catch(err => console.error(err))
        .finally(() => setStatsLoading(false));

        api.get('/api/activities/')
            .then((res) => setActivities(res.data))
            .catch(() => {})
            .finally(() => setActivitiesLoading(false));
    }, []);

    const statCards = [
        { icon: 'people',    value: statsLoading ? '...' : alumniCount.toLocaleString(),      label: 'Total Alumni' },
        { icon: 'calendar',  value: statsLoading ? '...' : eventsCount.toLocaleString(),      label: 'Total Events' },
        { icon: 'document',  value: statsLoading ? '...' : articlesCount.toLocaleString(),    label: 'News and Stories Posted' },
        { icon: 'briefcase', value: statsLoading ? '...' : jobsCount.toLocaleString(),        label: 'Total Jobs' },
        { icon: 'briefcase', value: statsLoading ? '...' : internshipsCount.toLocaleString(), label: 'Total Internships' },
        { icon: 'volunteer', value: statsLoading ? '...' : volunteerCount.toLocaleString(),   label: 'Volunteer Opportunities' },
        { icon: 'donation',  value: statsLoading ? '...' : campaignsCount.toLocaleString(),   label: 'Active Campaigns' },
    ];

    return (
        <div className="dashboard-page">
            <Header />
            <main className="dashboard-main">
                <div className="dashboard-title-row">
                    <h1 className="dashboard-title">Admin Dashboard</h1>
                    {notifications.total > 0 && (
                        <span className="dashboard-total-badge">
                            {notifications.total} pending
                        </span>
                    )}
                </div>

                <section className="dashboard-stats">
                    <StatCarousel
                        items={statCards}
                        autoRotate={true}
                        rotateInterval={4000}
                        renderCard={(card) => (
                            <div className="dashboard-stat-card">
                                <div className="dashboard-stat-icon"><StatIcon type={card.icon} color="#ffffff" /></div>
                                <div className="dashboard-stat-value">{card.value}</div>
                                <div className="dashboard-stat-label">{card.label}</div>
                            </div>
                        )}
                    />
                </section>

                <section className="dashboard-modules">
                    {MODULE_CARDS.map((card) => {
                        let badgeValue = 0;
                        if (card.title === 'User Management')         badgeValue = notifications.users;
                        if (card.title === 'Event Management')        badgeValue = notifications.events;
                        if (card.title === 'CMS & News Feed')         badgeValue = notifications.articles;
                        if (card.title === 'Job & Internship')        badgeValue = (notifications.jobs || 0) + (notifications.internships || 0);
                        if (card.title === 'Volunteer')               badgeValue = notifications.volunteers || 0;
                        if (card.icon === 'fundraising')              badgeValue = (notifications.campaigns || 0);

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
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
                                ) : activities.length === 0 ? (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#6d7280' }}>No recent activities.</td></tr>
                                ) : (
                                    activities.map((row) => (
                                        <tr key={row.id}>
                                            <td>{formatDate(row.timestamp)}</td>
                                            <td>{row.action}</td>
                                            <td>{row.module}</td>
                                            <td>{row.user}</td>
                                            <td>
                                                {row.status === 'Rejected' || row.status === 'Denied' ? (
                                                    <span className="dashboard-status dashboard-status-rejected">✕ {row.status}</span>
                                                ) : row.status === 'Pending' ? (
                                                    <span className="dashboard-status dashboard-status-pending">{row.status}</span>
                                                ) : (
                                                    <span className="dashboard-status">✓ {row.status}</span>
                                                )}
                                            </td>
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