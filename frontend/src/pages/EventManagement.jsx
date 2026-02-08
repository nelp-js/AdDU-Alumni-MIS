import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/EventManagement.css';
import { useTitle } from '../Hooks/useTitle';

function EventManagement() {
    useTitle('Event Management');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [approvingId, setApprovingId] = useState(null);
    const [rejectingId, setRejectingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const [editingEvent, setEditingEvent] = useState(null);
    const [editForm, setEditForm] = useState({
        event_name: '', event_description: '', venue: '', category: '',
        start_date: '', start_time: '', end_date: '', end_time: '',
        cost: '', is_approved: false,
    });
    const [editError, setEditError] = useState(null);
    const [savingEdit, setSavingEdit] = useState(false);

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
            .then(() => {
                setEvents((prev) =>
                    prev.map((e) => (e.id === eventId ? { ...e, is_approved: true } : e))
                );
            })
            .catch(() => {})
            .finally(() => setApprovingId(null));
    };

    const handleReject = (eventId) => {
        setRejectingId(eventId);
        api.post(`/api/events/${eventId}/reject/`)
            .then(() => {
                setEvents((prev) =>
                    prev.map((e) => (e.id === eventId ? { ...e, is_approved: false } : e))
                );
            })
            .catch(() => {})
            .finally(() => setRejectingId(null));
    };

    const handleDelete = (eventId) => {
        if (!window.confirm('Are you sure you want to delete this event? This cannot be undone.')) return;
        setDeletingId(eventId);
        api.delete(`/api/events/delete/${eventId}/`)
            .then(() => {
                setEvents((prev) => prev.filter((e) => e.id !== eventId));
                if (editingEvent === eventId) setEditingEvent(null);
            })
            .catch(() => alert('Failed to delete event.'))
            .finally(() => setDeletingId(null));
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        if (typeof timeStr !== 'string') return '';
        const part = timeStr.slice(0, 5);
        return part || '';
    };

    const getStatus = (e) => (e.is_approved ? 'Approved' : 'Pending');
    const isPending = (e) => !e.is_approved;

    const openEdit = (e) => {
        setEditingEvent(e.id);
        setEditForm({
            event_name: e.event_name || '',
            event_description: e.event_description || '',
            venue: e.venue || '',
            category: e.category || '',
            start_date: e.start_date ? e.start_date.slice(0, 10) : '',
            start_time: e.start_time ? e.start_time.slice(0, 5) : '',
            end_date: e.end_date ? e.end_date.slice(0, 10) : '',
            end_time: e.end_time ? e.end_time.slice(0, 5) : '',
            cost: e.cost || '',
            is_approved: !!e.is_approved,
        });
        setEditError(null);
    };

    const closeEdit = () => {
        setEditingEvent(null);
        setEditError(null);
    };

    const openDetails = (ev) => setDetailsEvent(ev);
    const closeDetails = () => setDetailsEvent(null);

    const handleEditChange = (ev) => {
        const { name, value, type, checked } = ev.target;
        setEditForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleEditSave = () => {
        if (!editingEvent) return;
        setEditError(null);
        setSavingEdit(true);
        const payload = {
            event_name: editForm.event_name,
            event_description: editForm.event_description,
            venue: editForm.venue,
            category: editForm.category,
            start_date: editForm.start_date || null,
            start_time: editForm.start_time || null,
            end_date: editForm.end_date || null,
            end_time: editForm.end_time || null,
            cost: editForm.cost || null,
            is_approved: editForm.is_approved,
        };
        api.patch(`/api/events/${editingEvent}/`, payload)
            .then((res) => {
                setEvents((prev) => prev.map((e) => (e.id === editingEvent ? { ...e, ...res.data } : e)));
                closeEdit();
            })
            .catch((err) => {
                const data = err.response?.data;
                setEditError(data && typeof data === 'object' ? (data.detail || Object.values(data).flat().join(' ')) : 'Failed to save.');
            })
            .finally(() => setSavingEdit(false));
    };

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
                                            <td>{formatDate(ev.start_date)} {formatTime(ev.start_time) ? ` at ${formatTime(ev.start_time)}` : ''}</td>
                                            <td>
                                                <button type="button" className="event-mgmt-details-link" onClick={() => openDetails(ev)}>
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
                                                        <button type="button" className="event-mgmt-edit-btn" onClick={() => openEdit(ev)}>Edit</button>
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
                    <Link to="/create-event" className="event-mgmt-back-link event-mgmt-create-link">Create Event</Link>
                </div>

                {/* Details (read-only) popup */}
                {detailsEvent != null && (
                    <div className="event-mgmt-modal-overlay" onClick={closeDetails}>
                        <div className="event-mgmt-modal event-mgmt-details-modal" onClick={(e) => e.stopPropagation()}>
                            <h2 className="event-mgmt-modal-title">Event Details</h2>
                            <div className="event-mgmt-details-content">
                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">Event Name</span>
                                    <span className="event-mgmt-details-value">{detailsEvent.event_name || '—'}</span>
                                </div>
                                {(detailsEvent.preview_text != null && detailsEvent.preview_text !== '') && (
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
                                    <span className="event-mgmt-details-value">
                                        {formatDate(detailsEvent.start_date)}
                                        {formatTime(detailsEvent.start_time) ? ` at ${formatTime(detailsEvent.start_time)}` : ''}
                                    </span>
                                </div>
                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">End</span>
                                    <span className="event-mgmt-details-value">
                                        {detailsEvent.end_date ? formatDate(detailsEvent.end_date) : '—'}
                                        {detailsEvent.end_time && formatTime(detailsEvent.end_time) ? ` at ${formatTime(detailsEvent.end_time)}` : ''}
                                    </span>
                                </div>
                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">Category</span>
                                    <span className="event-mgmt-details-value">{detailsEvent.category || '—'}</span>
                                </div>
                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">Cost</span>
                                    <span className="event-mgmt-details-value">{detailsEvent.cost || '—'}</span>
                                </div>
                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">Organizers</span>
                                    <span className="event-mgmt-details-value">{detailsEvent.organizer_names || '—'}</span>
                                </div>
                                {(detailsEvent.action_button_label || detailsEvent.action_button_link) && (
                                    <>
                                        <div className="event-mgmt-details-row">
                                            <span className="event-mgmt-details-label">Action button label</span>
                                            <span className="event-mgmt-details-value">{detailsEvent.action_button_label || '—'}</span>
                                        </div>
                                        <div className="event-mgmt-details-row">
                                            <span className="event-mgmt-details-label">Action button link</span>
                                            <span className="event-mgmt-details-value">{detailsEvent.action_button_link || '—'}</span>
                                        </div>
                                    </>
                                )}
                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">Status</span>
                                    <span className={`event-mgmt-status ${detailsEvent.is_approved ? 'approved' : 'pending'}`}>
                                        {detailsEvent.is_approved ? 'Approved' : 'Pending'}
                                    </span>
                                </div>
                            </div>
                            <div className="event-mgmt-modal-actions event-mgmt-details-actions">
                                <div />
                                <button type="button" className="event-mgmt-modal-cancel" onClick={closeDetails}>Close</button>
                            </div>
                        </div>
                    </div>
                )}

                {editingEvent != null && (
                    <div className="event-mgmt-modal-overlay" onClick={closeEdit}>
                        <div className="event-mgmt-modal" onClick={(e) => e.stopPropagation()}>
                            <h2 className="event-mgmt-modal-title">Edit Event</h2>
                            {editError && <div className="event-mgmt-modal-error">{editError}</div>}
                            <div className="event-mgmt-modal-form">
                                <div className="event-mgmt-modal-field">
                                    <label>Event Name *</label>
                                    <input name="event_name" value={editForm.event_name} onChange={handleEditChange} />
                                </div>
                                <div className="event-mgmt-modal-field">
                                    <label>Description</label>
                                    <textarea name="event_description" value={editForm.event_description} onChange={handleEditChange} rows={3} />
                                </div>
                                <div className="event-mgmt-modal-field">
                                    <label>Venue</label>
                                    <input name="venue" value={editForm.venue} onChange={handleEditChange} />
                                </div>
                                <div className="event-mgmt-modal-row">
                                    <div className="event-mgmt-modal-field">
                                        <label>Start Date</label>
                                        <input type="date" name="start_date" value={editForm.start_date} onChange={handleEditChange} />
                                    </div>
                                    <div className="event-mgmt-modal-field">
                                        <label>Start Time</label>
                                        <input type="time" name="start_time" value={editForm.start_time} onChange={handleEditChange} />
                                    </div>
                                </div>
                                <div className="event-mgmt-modal-row">
                                    <div className="event-mgmt-modal-field">
                                        <label>End Date</label>
                                        <input type="date" name="end_date" value={editForm.end_date} onChange={handleEditChange} />
                                    </div>
                                    <div className="event-mgmt-modal-field">
                                        <label>End Time</label>
                                        <input type="time" name="end_time" value={editForm.end_time} onChange={handleEditChange} />
                                    </div>
                                </div>
                                <div className="event-mgmt-modal-row">
                                    <div className="event-mgmt-modal-field">
                                        <label>Category</label>
                                        <input name="category" value={editForm.category} onChange={handleEditChange} />
                                    </div>
                                    <div className="event-mgmt-modal-field">
                                        <label>Cost</label>
                                        <input name="cost" value={editForm.cost} onChange={handleEditChange} placeholder="e.g. P3000" />
                                    </div>
                                </div>
                                <div className="event-mgmt-modal-field event-mgmt-modal-checkbox">
                                    <label>
                                        <input type="checkbox" name="is_approved" checked={editForm.is_approved} onChange={handleEditChange} />
                                        <span>Approved (visible to public)</span>
                                    </label>
                                </div>
                            </div>
                            <div className="event-mgmt-modal-actions">
                                <button type="button" className="event-mgmt-modal-delete" onClick={() => handleDelete(editingEvent)} disabled={deletingId === editingEvent}>
                                    {deletingId === editingEvent ? 'Deleting...' : 'Delete Event'}
                                </button>
                                <div className="event-mgmt-modal-actions-right">
                                    <button type="button" className="event-mgmt-modal-cancel" onClick={closeEdit}>Cancel</button>
                                    <button type="button" className="event-mgmt-modal-save" onClick={handleEditSave} disabled={savingEdit}>
                                        {savingEdit ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
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
