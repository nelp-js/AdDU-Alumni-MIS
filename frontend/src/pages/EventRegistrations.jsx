import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
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
    const [guestsForRegistration, setGuestsForRegistration] = useState(null);

    useEffect(() => {
        api.get('/api/events/registrations/all/')
            .then((res) => setRegistrations(res.data))
            .catch((err) => setError(err.response?.status === 403 ? 'Admin access required.' : 'Failed to load registrations.'))
            .finally(() => setLoading(false));
    }, []);

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
    const canDownloadPdf = Boolean(filterEvent && filterStatus === 'success' && filtered.length > 0);

    // Metrics
    const total     = registrations.length;
    const success   = registrations.filter((r) => normalizeStatus(r.payment_status) === 'success').length;
    const pending   = registrations.filter((r) => normalizeStatus(r.payment_status) === 'pending').length;
    const failed    = registrations.filter((r) => normalizeStatus(r.payment_status) === 'failed').length;
    const totalGuests = registrations.reduce((sum, r) => sum + (r.guest_count || 0), 0);

    const getGuestNames = (registration) => {
        if (!Array.isArray(registration.guests) || registration.guests.length === 0) return [];
        return registration.guests
            .map((guest) => `${guest.firstName || ''} ${guest.lastName || ''}`.trim())
            .filter(Boolean);
    };

    const handleDownloadPdf = () => {
        if (!canDownloadPdf) return;
        const doc = new jsPDF();
        let y = 16;

        const writeLine = (text) => {
            if (y > 280) {
                doc.addPage();
                y = 16;
            }
            const lines = doc.splitTextToSize(text, 180);
            doc.text(lines, 14, y);
            y += lines.length * 6;
        };

        doc.setFontSize(14);
        writeLine(`Event Registrations - ${filterEvent}`);
        doc.setFontSize(11);
        writeLine(`Status: Success`);
        y += 2;

        filtered.forEach((registration, index) => {
            const fullName = `${registration.first_name || ''} ${registration.last_name || ''}`.trim() || '—';
            const guestNames = getGuestNames(registration);
            writeLine(`${index + 1}. Registrant: ${fullName}`);
            writeLine(`   Guests: ${guestNames.length ? guestNames.join(', ') : 'None'}`);
            y += 2;
        });

        doc.save(`event-registrations-${filterEvent.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    };

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
                                                <button
                                                    type="button"
                                                    className="erg-action-btn erg-guest-btn"
                                                    onClick={() => setGuestsForRegistration(r)}
                                                >
                                                    Guests
                                                </button>
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
                    {canDownloadPdf && (
                        <button type="button" className="erg-back-link erg-download-link" onClick={handleDownloadPdf}>
                            Download PDF
                        </button>
                    )}
                </div>
            </main>
            <Footer />

            {guestsForRegistration && (
                <div
                    className="erg-guests-overlay"
                    onClick={() => setGuestsForRegistration(null)}
                >
                    <div
                        className="erg-guests-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="erg-guests-title">Guest Details</h2>
                        <p className="erg-guests-subtitle">
                            {guestsForRegistration.first_name} {guestsForRegistration.last_name} - {guestsForRegistration.event_name}
                        </p>
                        {Array.isArray(guestsForRegistration.guests) && guestsForRegistration.guests.length > 0 ? (
                            <ul className="erg-guests-list">
                                {guestsForRegistration.guests.map((guest, index) => (
                                    <li key={`${guest.firstName || ''}-${guest.lastName || ''}-${index}`} className="erg-guest-item">
                                        <span className="erg-guest-name">
                                            {guest.firstName || '—'} {guest.lastName || ''}
                                        </span>
                                        <span className="erg-guest-relationship">
                                            {guest.relationship || '—'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="erg-guests-empty">
                                Guest count was recorded, but guest names were not provided.
                            </p>
                        )}

                        <div className="erg-guests-actions">
                            <button
                                type="button"
                                className="erg-action-btn"
                                onClick={() => setGuestsForRegistration(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EventRegistrations;