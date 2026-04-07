import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/EventManagement.css';
import '../styles/AdminButtons.css';
import { useTitle } from '../Hooks/useTitle';

function SplitDropdown({ eventItem, onEdit, onToggleHide, onDelete, togglingId, deletingId }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div className="event-mgmt-btn-group" ref={ref}>
            <button
                type="button"
                className="event-mgmt-split-main"
                onClick={() => { setOpen(false); onEdit(); }}
            >
                Edit
            </button>
            <button
                type="button"
                className="event-mgmt-split-toggle"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
            >
                ▾
            </button>
            {open && (
                <ul className="event-mgmt-dropdown-menu" role="menu">
                    <li>
                        <button
                            type="button"
                            className={`event-mgmt-dropdown-item ${eventItem.is_hidden ? 'item-activate' : 'item-deactivate'}`}
                            onClick={() => { setOpen(false); onToggleHide(); }}
                            disabled={togglingId === eventItem.id}
                        >
                            {togglingId === eventItem.id ? '…' : (eventItem.is_hidden ? 'Activate' : 'Deactivate')}
                        </button>
                    </li>
                    <li>
                        <button
                            type="button"
                            className="event-mgmt-dropdown-item item-delete"
                            onClick={() => { setOpen(false); onDelete(); }}
                            disabled={deletingId === eventItem.id}
                        >
                            {deletingId === eventItem.id ? '…' : 'Delete'}
                        </button>
                    </li>
                </ul>
            )}
        </div>
    );
}

function EventManagement() {
    useTitle('Event Management');
    const navigate = useNavigate();

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [approvingId, setApprovingId] = useState(null);
    const [denyingId, setDenyingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [detailsEvent, setDetailsEvent] = useState(null);
    const [togglingId, setTogglingId] = useState(null);
    const [denyRemarks, setDenyRemarks] = useState('');
    const [showDenyInput, setShowDenyInput] = useState(null);

    useEffect(() => {
        api.get('/api/events/')
            .then((res) => setEvents(res.data))
            .catch((err) =>
                setError(
                    err.response?.status === 403
                        ? 'Admin access required.'
                        : 'Failed to load events.'
                )
            )
            .finally(() => setLoading(false));
    }, []);

    const handleApprove = (eventId) => {
        setApprovingId(eventId);

        api.post(`/api/events/${eventId}/approve/`)
            .then(() =>
                setEvents((prev) =>
                    prev.map((e) =>
                        e.id === eventId
                            ? { ...e, status: 'approved', is_approved: true, remarks: null }
                            : e
                    )
                )
            )
            .catch(() => {})
            .finally(() => setApprovingId(null));
    };

    const handleDeny = (eventId) => {
        setDenyingId(eventId);

        api.post(`/api/events/${eventId}/deny/`, { remarks: denyRemarks })
            .then(() => {
                setEvents((prev) =>
                    prev.map((e) =>
                        e.id === eventId
                            ? {
                                  ...e,
                                  status: 'denied',
                                  is_approved: false,
                                  remarks: denyRemarks,
                              }
                            : e
                    )
                );
                setShowDenyInput(null);
                setDenyRemarks('');
            })
            .catch(() => {})
            .finally(() => setDenyingId(null));
    };

    const handleToggleHide = (eventId) => {
        setTogglingId(eventId);

        api.patch(`/api/events/${eventId}/toggle-hide/`)
            .then((res) => {
                setEvents((prev) =>
                    prev.map((e) =>
                        e.id === eventId ? { ...e, is_hidden: res.data.is_hidden } : e
                    )
                );

                if (detailsEvent?.id === eventId) {
                    setDetailsEvent((prev) =>
                        prev ? { ...prev, is_hidden: res.data.is_hidden } : null
                    );
                }
            })
            .catch(() => {})
            .finally(() => setTogglingId(null));
    };

    const handleDelete = (eventId) => {
        if (!window.confirm('Are you sure you want to delete this event? This cannot be undone.')) {
            return;
        }

        setDeletingId(eventId);

        api.delete(`/api/events/delete/${eventId}/`)
            .then(() => setEvents((prev) => prev.filter((e) => e.id !== eventId)))
            .catch(() => alert('Failed to delete event.'))
            .finally(() => setDeletingId(null));
    };

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

    const formatTime = (timeStr) => {
        if (!timeStr || typeof timeStr !== 'string') return '';
        return timeStr.slice(0, 5) || '';
    };

    const formatDateTime = (date, time) => {
        const d = formatDate(date);
        const t = formatTime(time);
        return t ? `${d} at ${t}` : d;
    };

    const getStatusClass = (event) => {
        const status = event.status || (event.is_approved ? 'approved' : 'pending');

        if (status === 'approved') return event.is_hidden ? 'denied' : 'approved';
        if (status === 'denied') return 'denied';
        return 'pending';
    };

    const getStatusLabel = (event) => {
        const status = event.status || (event.is_approved ? 'approved' : 'pending');

        if (status === 'approved') return event.is_hidden ? 'Hidden' : 'Approved';
        if (status === 'denied') return 'Denied';
        return 'Pending';
    };

    const isPending = (event) =>
        (event.status || (!event.is_approved ? 'pending' : 'approved')) === 'pending';

    return (
        <div className="event-mgmt-page">
            <Header />

            <main className="event-mgmt-main">
                <h1 className="event-mgmt-title">Event Management</h1>
                <p className="event-mgmt-subtitle">Create, manage, and approve events.</p>

                <div className="event-mgmt-card">
                    {loading && <div className="event-mgmt-loading">Loading events...</div>}
                    {error && <div className="event-mgmt-error">{error}</div>}
                    {!loading && !error && events.length === 0 && (
                        <div className="event-mgmt-empty">No events yet.</div>
                    )}

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
                                                <button
                                                    type="button"
                                                    className="event-mgmt-details-link"
                                                    onClick={() => setDetailsEvent(ev)}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                            <td>
                                                <span className={`event-mgmt-status ${getStatusClass(ev)}`}>
                                                    {getStatusLabel(ev)}
                                                </span>
                                            </td>
                                            <td>
                                                {isPending(ev) ? (
                                                    <span className="event-mgmt-actions">
                                                        <button
                                                            type="button"
                                                            className="event-mgmt-approve-btn"
                                                            onClick={() => handleApprove(ev.id)}
                                                            disabled={approvingId === ev.id}
                                                        >
                                                            {approvingId === ev.id ? '...' : 'Approve'}
                                                        </button>

                                                        {showDenyInput === ev.id ? (
                                                            <span className="event-mgmt-actions">
                                                                <input
                                                                    type="text"
                                                                    value={denyRemarks}
                                                                    onChange={(e) =>
                                                                        setDenyRemarks(e.target.value)
                                                                    }
                                                                    placeholder="Reason for denial..."
                                                                    className="event-mgmt-deny-input"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    className="event-mgmt-confirm-btn"
                                                                    onClick={() => handleDeny(ev.id)}
                                                                    disabled={denyingId === ev.id}
                                                                >
                                                                    {denyingId === ev.id ? '...' : 'Confirm'}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="event-mgmt-reject-btn btn btn-deactivate"
                                                                    onClick={() => {
                                                                        setShowDenyInput(null);
                                                                        setDenyRemarks('');
                                                                    }}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                className="event-mgmt-reject-btn"
                                                                onClick={() => setShowDenyInput(ev.id)}
                                                            >
                                                                Deny
                                                            </button>
                                                        )}
                                                    </span>
                                                ) : ev.status === 'approved' || ev.is_approved ? (
                                                    <SplitDropdown
                                                        eventItem={ev}
                                                        onEdit={() => navigate(`/dashboard/events/edit/${ev.id}`)}
                                                        onToggleHide={() => handleToggleHide(ev.id)}
                                                        onDelete={() => handleDelete(ev.id)}
                                                        togglingId={togglingId}
                                                        deletingId={deletingId}
                                                    />
                                                ) : (
                                                    <span className="event-mgmt-actions">
                                                        <button
                                                            type="button"
                                                            className="event-mgmt-delete-btn"
                                                            onClick={() => handleDelete(ev.id)}
                                                            disabled={deletingId === ev.id}
                                                        >
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
                    <Link to="/dashboard" className="event-mgmt-back-link">
                        ← Back to Dashboard
                    </Link>
                    <Link
                        to="/dashboard/events/registrations"
                        className="event-mgmt-back-link event-mgmt-create-link"
                    >
                        View Registrations
                    </Link>
                    <Link
                        to="/create-event"
                        className="event-mgmt-back-link event-mgmt-create-link"
                    >
                        Create Event
                    </Link>
                </div>

                {detailsEvent && (
                    <div
                        className="event-mgmt-modal-overlay"
                        onClick={() => setDetailsEvent(null)}
                    >
                        <div
                            className="event-mgmt-modal event-mgmt-details-modal"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="event-mgmt-modal-title">Event Details</h2>

                            <div className="event-mgmt-details-content">
                                {detailsEvent.event_image && (
                                    <div className="event-mgmt-details-row">
                                        <span className="event-mgmt-details-label">Cover Photo</span>
                                        <img
                                            src={detailsEvent.event_image}
                                            alt="Cover"
                                            style={{
                                                maxHeight: '140px',
                                                borderRadius: '8px',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    </div>
                                )}

                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">Event Name</span>
                                    <span className="event-mgmt-details-value">
                                        {detailsEvent.event_name || '—'}
                                    </span>
                                </div>

                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">Category</span>
                                    <span className="event-mgmt-details-value">
                                        {detailsEvent.category || '—'}
                                    </span>
                                </div>

                                {detailsEvent.preview_text && (
                                    <div className="event-mgmt-details-row event-mgmt-details-row-block">
                                        <span className="event-mgmt-details-label">Short Preview</span>
                                        <span className="event-mgmt-details-value">
                                            {detailsEvent.preview_text}
                                        </span>
                                    </div>
                                )}

                                <div className="event-mgmt-details-row event-mgmt-details-row-block">
                                    <span className="event-mgmt-details-label">Description</span>
                                    <span className="event-mgmt-details-value">
                                        {detailsEvent.event_description || '—'}
                                    </span>
                                </div>

                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">Venue</span>
                                    <span className="event-mgmt-details-value">
                                        {detailsEvent.venue || '—'}
                                    </span>
                                </div>

                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">Start</span>
                                    <span className="event-mgmt-details-value">
                                        {formatDateTime(detailsEvent.start_date, detailsEvent.start_time)}
                                    </span>
                                </div>

                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">End</span>
                                    <span className="event-mgmt-details-value">
                                        {detailsEvent.end_date
                                            ? formatDateTime(
                                                  detailsEvent.end_date,
                                                  detailsEvent.end_time
                                              )
                                            : '—'}
                                    </span>
                                </div>

                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">Cost</span>
                                    <span className="event-mgmt-details-value">
                                        {detailsEvent.cost || '—'}
                                    </span>
                                </div>

                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">Capacity</span>
                                    <span className="event-mgmt-details-value">
                                        {detailsEvent.participants || '—'}
                                    </span>
                                </div>

                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">Organizers</span>
                                    <span className="event-mgmt-details-value">
                                        {detailsEvent.organizer_names || '—'}
                                    </span>
                                </div>

                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">Status</span>
                                    <span
                                        className={`event-mgmt-status ${getStatusClass(detailsEvent)}`}
                                    >
                                        {getStatusLabel(detailsEvent)}
                                    </span>
                                </div>

                                {detailsEvent.remarks && (
                                    <div className="event-mgmt-details-row event-mgmt-details-row-block">
                                        <span className="event-mgmt-details-label">Denial Remarks</span>
                                        <span className="event-mgmt-details-value">
                                            {detailsEvent.remarks}
                                        </span>
                                    </div>
                                )}

                                {detailsEvent.created_at && (
                                    <div className="event-mgmt-details-row">
                                        <span className="event-mgmt-details-label">Created</span>
                                        <span className="event-mgmt-details-value">
                                            {formatDate(detailsEvent.created_at)}
                                        </span>
                                    </div>
                                )}

                                {detailsEvent.updated_at && (
                                    <div className="event-mgmt-details-row">
                                        <span className="event-mgmt-details-label">Last Updated</span>
                                        <span className="event-mgmt-details-value">
                                            {formatDate(detailsEvent.updated_at)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="event-mgmt-modal-actions event-mgmt-details-actions">
                                <div />
                                <button
                                    type="button"
                                    className="event-mgmt-modal-cancel btn btn-close"
                                    onClick={() => setDetailsEvent(null)}
                                >
                                    Close
                                </button>
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