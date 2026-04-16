import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import { useTitle } from '../Hooks/useTitle';
import '../styles/EventRegistrations.css';

function EventRegistrations() {
    useTitle('Event Registrations');

    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState(null);
    const [filterEvent, setFilterEvent]     = useState('');
    const [filterStatus, setFilterStatus]   = useState('');
    const [updatingId, setUpdatingId]       = useState(null);

    useEffect(() => {
        api.get('/api/events/registrations/all/')
            .then((res) => setRegistrations(res.data))
            .catch((err) => setError(err.response?.status === 403 ? 'Admin access required.' : 'Failed to load registrations.'))
            .finally(() => setLoading(false));
    }, []);

    const handleStatusChange = (id, newStatus) => {
        setUpdatingId(id);
        api.patch(`/api/events/registrations/${id}/status/`, { payment_status: newStatus })
            .then((res) => setRegistrations((prev) => prev.map((r) => r.id === id ? res.data : r)))
            .catch(() => alert('Failed to update status.'))
            .finally(() => setUpdatingId(null));
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        try { return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
        catch { return dateStr; }
    };

    const getInitials = (first, last) => `${(first || '').charAt(0)}${(last || '').charAt(0)}`.toUpperCase() || '?';
    const normalizeStatus = (status) => {
        if (status === 'paid') return 'success';
        if (status === 'cancelled') return 'failed';
        return status || 'pending';
    };

    // Unique event names for filter dropdown
    const eventNames = [...new Set(registrations.map((r) => r.event_name).filter(Boolean))];

    const filtered = registrations.filter((r) => {
        if (filterEvent  && r.event_name !== filterEvent)    return false;
        if (filterStatus && normalizeStatus(r.payment_status) !== filterStatus) return false;
        return true;
    });

    // Metrics
    const total     = registrations.length;
    const success   = registrations.filter((r) => normalizeStatus(r.payment_status) === 'success').length;
    const pending   = registrations.filter((r) => normalizeStatus(r.payment_status) === 'pending').length;
    const failed    = registrations.filter((r) => normalizeStatus(r.payment_status) === 'failed').length;
    const totalGuests = registrations.reduce((sum, r) => sum + (r.guest_count || 0), 0);

    return (
        <div className="erg-page">
            <Header />
            <main className="erg-main">
                <h1 className="erg-title">Event Registrations</h1>
                <p className="erg-subtitle">All registrations across all events.</p>

                {/* Metrics */}
                <div className="erg-metrics">
                    <div className="erg-metric">
                        <div className="erg-metric-label">Total Registrations</div>
                        <div className="erg-metric-value">{total}</div>
                    </div>
                    <div className="erg-metric">
                        <div className="erg-metric-label">Successful Payments</div>
                        <div className="erg-metric-value erg-green">{success}</div>
                    </div>
                    <div className="erg-metric">
                        <div className="erg-metric-label">Pending Payment</div>
                        <div className="erg-metric-value erg-amber">{pending}</div>
                    </div>
                    <div className="erg-metric">
                        <div className="erg-metric-label">Failed Payments</div>
                        <div className="erg-metric-value erg-red">{failed}</div>
                    </div>
                    <div className="erg-metric">
                        <div className="erg-metric-label">Total Guests</div>
                        <div className="erg-metric-value">{totalGuests}</div>
                    </div>
                </div>

                {/* Table card */}
                <div className="erg-card">
                    <div className="erg-card-header">
                        <span className="erg-card-title">All registrations</span>
                        <div className="erg-filters">
                            <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)} className="erg-select">
                                <option value="">All events</option>
                                {eventNames.map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="erg-select">
                                <option value="">All statuses</option>
                                <option value="pending">Pending</option>
                                <option value="success">Success</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                    </div>

                    {loading && <div className="erg-state">Loading registrations...</div>}
                    {error   && <div className="erg-state erg-error">{error}</div>}
                    {!loading && !error && filtered.length === 0 && (
                        <div className="erg-state">No registrations found.</div>
                    )}

                    {!loading && !error && filtered.length > 0 && (
                        <div className="erg-table-wrap">
                            <table className="erg-table">
                                <thead>
                                    <tr>
                                        <th>Registrant</th>
                                        <th>Event</th>
                                        <th>Guests</th>
                                        <th>Payment Method</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th>Registered</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((r) => {
                                        const status = normalizeStatus(r.payment_status);
                                        return (
                                        <tr key={r.id}>
                                            <td>
                                                <div className="erg-name-cell">
                                                    <div className="erg-avatar">
                                                        {getInitials(r.first_name, r.last_name)}
                                                    </div>
                                                    <div>
                                                        <div>{r.first_name} {r.last_name}</div>
                                                        <div className="erg-email">{r.user_email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="erg-event-tag">{r.event_name || '—'}</span>
                                            </td>
                                            <td className="erg-muted">
                                                {r.guest_count > 0 ? `+${r.guest_count} guest${r.guest_count !== 1 ? 's' : ''}` : 'No guests'}
                                            </td>
                                            <td className="erg-capitalize">{r.payment_method || '—'}</td>
                                            <td className="erg-amount">
                                                ₱{Number(r.total_amount || 0).toLocaleString()}
                                            </td>
                                            <td>
                                                <span className={`erg-badge erg-badge-${status}`}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="erg-muted">{formatDate(r.registered_at)}</td>
                                            <td>
                                                {status === 'pending' && (
                                                    <button
                                                        type="button"
                                                        className="erg-action-btn"
                                                        onClick={() => handleStatusChange(r.id, 'success')}
                                                        disabled={updatingId === r.id}
                                                    >
                                                        {updatingId === r.id ? '...' : 'Mark success'}
                                                    </button>
                                                )}
                                                {status === 'success' && (
                                                    <button
                                                        type="button"
                                                        className="erg-action-btn"
                                                        onClick={() => handleStatusChange(r.id, 'failed')}
                                                        disabled={updatingId === r.id}
                                                    >
                                                        {updatingId === r.id ? '...' : 'Mark failed'}
                                                    </button>
                                                )}
                                                {status === 'failed' && (
                                                    <button
                                                        type="button"
                                                        className="erg-action-btn"
                                                        onClick={() => handleStatusChange(r.id, 'pending')}
                                                        disabled={updatingId === r.id}
                                                    >
                                                        {updatingId === r.id ? '...' : 'Restore'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="erg-back">
                    <Link to="/dashboard" className="erg-back-link">← Back to Dashboard</Link>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default EventRegistrations;