import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/EventManagement.css';
import { useTitle } from '../Hooks/useTitle';

function EventManagement() {
    useTitle('Event Management');
    const navigate = useNavigate();

    const [events, setEvents]             = useState([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState(null);
    const [approvingId, setApprovingId]   = useState(null);
    const [rejectingId, setRejectingId]   = useState(null);
    const [deletingId, setDeletingId]     = useState(null);
    const [detailsEvent, setDetailsEvent] = useState(null);

    useEffect(() => {
        api.get('/api/events/')
            .then((res) => setEvents(res.data))
            .catch((err) => setError(err.response?.status === 403 ? 'Admin access required.' : 'Failed to load events.'))
            .finally(() => setLoading(false));
    }, []);

    const handleApprove = (eventId) => {
        setApprovingId(eventId);
        api.post(`/api/events/${eventId}/approve/`)
            .then(() => setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, is_approved: true } : e)))
            .catch(() => {})
            .finally(() => setApprovingId(null));
    };

    const handleReject = (eventId) => {
        setRejectingId(eventId);
        api.post(`/api/events/${eventId}/reject/`)
            .then(() => setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, is_approved: false } : e)))
            .catch(() => {})
            .finally(() => setRejectingId(null));
    };

    const handleDelete = (eventId) => {
        if (!window.confirm('Are you sure you want to delete this event? This cannot be undone.')) return;
        setDeletingId(eventId);
        api.delete(`/api/events/delete/${eventId}/`)
            .then(() => setEvents((prev) => prev.filter((e) => e.id !== eventId)))
            .catch(() => alert('Failed to delete event.'))
            .finally(() => setDeletingId(null));
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        try { return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
        catch { return dateStr; }
    };

    const formatTime = (timeStr) => {
        if (!timeStr || typeof timeStr !== 'string') return '';
        return timeStr.slice(0, 5) || '';
    };

    const formatDateTime = (date, time) => {
        const d = formatDate(date);
        const t = formatTime(time);
        return t ? `${d} at ${t}` : d;
    };

    const getStatus = (e) => e.is_approved ? 'Approved' : 'Pending';
    const isPending = (e) => !e.is_approved;

    return (
        <div className="event-mgmt-page">
            <Header />
            <main className="event-mgmt-main">
                <h1 className="event-mgmt-title">Event Management</h1>
                <p className="event-mgmt-subtitle">Create, manage, and approve events.</p>

                <div className="event-mgmt-card">
                    {loading && <div className="event-mgmt-loading">Loading events...</div>}
                    {error   && <div className="event-mgmt-error">{error}</div>}
                    {!loading && !error && events.length === 0 && <div className="event-mgmt-empty">No events yet.</div>}
                    {!loading && !error && events.length > 0 && (
                        <div className="event-mgmt-table-wrap">
                            <table className="event-mgmt-table">
                                <thead>
                                    <tr>
                                        <th>EVENT NAME</th>
                                        <th>VENUE</th>
                                        <th>DATE</th>
                                        <th>DETAILS</th>
                                        <th>STATUS</th>
                                        <th>ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.map((ev) => (
                                        <tr key={ev.id}>
                                            <td>{ev.event_name || '—'}</td>
                                            <td>{ev.venue || '—'}</td>
                                            <td>{formatDateTime(ev.start_date, ev.start_time)}</td>
                                            <td>
                                                <button type="button" className="event-mgmt-details-link" onClick={() => setDetailsEvent(ev)}>
                                                    View Details
                                                </button>
                                            </td>
                                            <td>
                                                <span className={`event-mgmt-status ${ev.is_approved ? 'approved' : 'pending'}`}>
                                                    {getStatus(ev)}
                                                </span>
                                            </td>
                                            <td>
                                                {isPending(ev) ? (
                                                    <span className="event-mgmt-actions">
                                                        <button type="button" className="event-mgmt-approve-btn" onClick={() => handleApprove(ev.id)} disabled={approvingId === ev.id}>
                                                            {approvingId === ev.id ? '...' : 'Approve'}
                                                        </button>
                                                        <button type="button" className="event-mgmt-reject-btn" onClick={() => handleReject(ev.id)} disabled={rejectingId === ev.id}>
                                                            {rejectingId === ev.id ? '...' : 'Reject'}
                                                        </button>
                                                    </span>
                                                ) : (
                                                    <span className="event-mgmt-actions">
                                                        <button type="button" className="event-mgmt-edit-btn" onClick={() => navigate(`/dashboard/events/edit/${ev.id}`)}>
                                                            Edit
                                                        </button>
                                                        <button type="button" className="event-mgmt-delete-btn" onClick={() => handleDelete(ev.id)} disabled={deletingId === ev.id}>
                                                            {deletingId === ev.id ? '...' : 'Delete'}
                                                        </button>
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="event-mgmt-back">
                    <Link to="/dashboard" className="event-mgmt-back-link">← Back to Dashboard</Link>
                    <Link to="/dashboard/events/registrations" className="event-mgmt-back-link event-mgmt-create-link">View Registrations</Link>
                    <Link to="/create-event" className="event-mgmt-back-link event-mgmt-create-link">Create Event</Link>
                </div>

                {/* View Details modal */}
                {detailsEvent && (
                    <div className="event-mgmt-modal-overlay" onClick={() => setDetailsEvent(null)}>
                        <div className="event-mgmt-modal event-mgmt-details-modal" onClick={(e) => e.stopPropagation()}>
                            <h2 className="event-mgmt-modal-title">Event Details</h2>
                            <div className="event-mgmt-details-content">

                                {detailsEvent.event_image && (
                                    <div className="event-mgmt-details-row">
                                        <span className="event-mgmt-details-label">Cover Photo</span>
                                        <img src={detailsEvent.event_image} alt="Cover"
                                            style={{ maxHeight: '140px', borderRadius: '8px', objectFit: 'cover' }} />
                                    </div>
                                )}
                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">Event Name</span>
                                    <span className="event-mgmt-details-value">{detailsEvent.event_name || '—'}</span>
                                </div>
                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">Category</span>
                                    <span className="event-mgmt-details-value">{detailsEvent.category || '—'}</span>
                                </div>
                                {detailsEvent.preview_text && (
                                    <div className="event-mgmt-details-row event-mgmt-details-row-block">
                                        <span className="event-mgmt-details-label">Short Preview</span>
                                        <span className="event-mgmt-details-value">{detailsEvent.preview_text}</span>
                                    </div>
                                )}
                                <div className="event-mgmt-details-row event-mgmt-details-row-block">
                                    <span className="event-mgmt-details-label">Description</span>
                                    <span className="event-mgmt-details-value">{detailsEvent.event_description || '—'}</span>
                                </div>
                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">Venue</span>
                                    <span className="event-mgmt-details-value">{detailsEvent.venue || '—'}</span>
                                </div>
                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">Start</span>
                                    <span className="event-mgmt-details-value">{formatDateTime(detailsEvent.start_date, detailsEvent.start_time)}</span>
                                </div>
                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">End</span>
                                    <span className="event-mgmt-details-value">
                                        {detailsEvent.end_date ? formatDateTime(detailsEvent.end_date, detailsEvent.end_time) : '—'}
                                    </span>
                                </div>
                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">Cost</span>
                                    <span className="event-mgmt-details-value">{detailsEvent.cost || '—'}</span>
                                </div>
                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">Capacity</span>
                                    <span className="event-mgmt-details-value">{detailsEvent.participants || '—'}</span>
                                </div>
                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">Organizers</span>
                                    <span className="event-mgmt-details-value">{detailsEvent.organizer_names || '—'}</span>
                                </div>
                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">Status</span>
                                    <span className={`event-mgmt-status ${detailsEvent.is_approved ? 'approved' : 'pending'}`}>
                                        {detailsEvent.is_approved ? 'Approved' : 'Pending'}
                                    </span>
                                </div>
                                {detailsEvent.created_at && (
                                    <div className="event-mgmt-details-row">
                                        <span className="event-mgmt-details-label">Created</span>
                                        <span className="event-mgmt-details-value">{formatDate(detailsEvent.created_at)}</span>
                                    </div>
                                )}
                                {detailsEvent.updated_at && (
                                    <div className="event-mgmt-details-row">
                                        <span className="event-mgmt-details-label">Last Updated</span>
                                        <span className="event-mgmt-details-value">{formatDate(detailsEvent.updated_at)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="event-mgmt-modal-actions event-mgmt-details-actions">
                                <div />
                                <button type="button" className="event-mgmt-modal-cancel" onClick={() => setDetailsEvent(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                )}

            </main>
            <Footer />
        </div>
    );
}

export default EventManagement;