import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import { useTitle } from '../Hooks/useTitle';
import '../styles/VolunteerRegistrations.css';

function VolunteerRegistrations() {
    useTitle('Volunteer Registrations');

    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterVolunteer, setFilterVolunteer] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    useEffect(() => {
        api.get('/api/volunteers/registrations/all/')
            .then((res) => setRegistrations(Array.isArray(res.data) ? res.data : []))
            .catch((err) =>
                setError(
                    err.response?.status === 403
                        ? 'Admin access required.'
                        : 'Failed to load volunteer registrations.'
                )
            )
            .finally(() => setLoading(false));
    }, []);

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    const formatDateRange = (start, end) => {
        const startValue = formatDate(start);
        const endValue = formatDate(end);
        return `${startValue} - ${endValue}`;
    };

    const getInitials = (firstName, lastName) => {
        const first = (firstName || '').charAt(0);
        const last = (lastName || '').charAt(0);
        return `${first}${last}`.toUpperCase() || '?';
    };

    const volunteerTitles = useMemo(
        () => [...new Set(registrations.map((r) => r.volunteer_title).filter(Boolean))],
        [registrations]
    );
    const categories = useMemo(
        () => [...new Set(registrations.map((r) => r.volunteer_category).filter(Boolean))],
        [registrations]
    );

    const filtered = useMemo(
        () =>
            registrations.filter((r) => {
                if (filterVolunteer && r.volunteer_title !== filterVolunteer) return false;
                if (filterCategory && r.volunteer_category !== filterCategory) return false;
                return true;
            }),
        [registrations, filterVolunteer, filterCategory]
    );

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const totalRegistrations = registrations.length;
    const uniqueVolunteers = new Set(registrations.map((r) => r.volunteer)).size;
    const uniqueRegistrants = new Set(registrations.map((r) => r.user)).size;
    const thisMonth = registrations.filter((r) => {
        const date = new Date(r.registered_at);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;
    const upcomingOpportunities = new Set(
        registrations
            .filter((r) => r.volunteer_start_date && new Date(r.volunteer_start_date) > new Date())
            .map((r) => r.volunteer)
    ).size;

    return (
        <div className="vrg-page">
            <Header />
            <main className="vrg-main">
                <h1 className="vrg-title">Volunteer Registrations</h1>
                <p className="vrg-subtitle">All registrations across all volunteer opportunities.</p>

                <div className="vrg-metrics">
                    <div className="vrg-metric">
                        <div className="vrg-metric-label">Total Registrations</div>
                        <div className="vrg-metric-value">{totalRegistrations}</div>
                    </div>
                    <div className="vrg-metric">
                        <div className="vrg-metric-label">Unique Opportunities</div>
                        <div className="vrg-metric-value vrg-indigo">{uniqueVolunteers}</div>
                    </div>
                    <div className="vrg-metric">
                        <div className="vrg-metric-label">Unique Registrants</div>
                        <div className="vrg-metric-value vrg-green">{uniqueRegistrants}</div>
                    </div>
                    <div className="vrg-metric">
                        <div className="vrg-metric-label">Registered This Month</div>
                        <div className="vrg-metric-value vrg-amber">{thisMonth}</div>
                    </div>
                    <div className="vrg-metric">
                        <div className="vrg-metric-label">Upcoming Opportunities</div>
                        <div className="vrg-metric-value">{upcomingOpportunities}</div>
                    </div>
                </div>

                <div className="vrg-card">
                    <div className="vrg-card-header">
                        <span className="vrg-card-title">All registrations</span>
                        <div className="vrg-filters">
                            <select
                                value={filterVolunteer}
                                onChange={(e) => setFilterVolunteer(e.target.value)}
                                className="vrg-select"
                            >
                                <option value="">All opportunities</option>
                                {volunteerTitles.map((title) => (
                                    <option key={title} value={title}>
                                        {title}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="vrg-select"
                            >
                                <option value="">All categories</option>
                                {categories.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loading && <div className="vrg-state">Loading registrations...</div>}
                    {error && <div className="vrg-state vrg-error">{error}</div>}
                    {!loading && !error && filtered.length === 0 && (
                        <div className="vrg-state">No registrations found.</div>
                    )}

                    {!loading && !error && filtered.length > 0 && (
                        <div className="vrg-table-wrap">
                            <table className="vrg-table">
                                <thead>
                                    <tr>
                                        <th>Registrant</th>
                                        <th>Opportunity</th>
                                        <th>Category</th>
                                        <th>Location</th>
                                        <th>Organizer</th>
                                        <th>Date Range</th>
                                        <th>Registered</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((registration) => (
                                        <tr key={registration.id}>
                                            <td>
                                                <div className="vrg-name-cell">
                                                    <div className="vrg-avatar">
                                                        {getInitials(
                                                            registration.first_name,
                                                            registration.last_name
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div>
                                                            {registration.first_name || '—'}{' '}
                                                            {registration.last_name || ''}
                                                        </div>
                                                        <div className="vrg-email">
                                                            {registration.user_email || '—'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="vrg-opportunity-tag">
                                                    {registration.volunteer_title || '—'}
                                                </span>
                                            </td>
                                            <td className="vrg-muted">
                                                {registration.volunteer_category || '—'}
                                            </td>
                                            <td className="vrg-muted">
                                                {registration.volunteer_location || '—'}
                                            </td>
                                            <td className="vrg-muted">
                                                {registration.volunteer_organizer || '—'}
                                            </td>
                                            <td className="vrg-muted">
                                                {formatDateRange(
                                                    registration.volunteer_start_date,
                                                    registration.volunteer_end_date
                                                )}
                                            </td>
                                            <td className="vrg-muted">
                                                {formatDate(registration.registered_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="vrg-back">
                    <Link to="/dashboard" className="vrg-back-link">
                        ← Back to Dashboard
                    </Link>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default VolunteerRegistrations;
