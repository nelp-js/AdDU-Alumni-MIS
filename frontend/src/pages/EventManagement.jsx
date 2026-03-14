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
        cost: '', is_approved: false, participants: 0
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
        return timeStr.slice(0, 5);
    };

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
            participants: e.participants || 0
        });
    };

    const closeEdit = () => setEditingEvent(null);
    const openDetails = (ev) => setDetailsEvent(ev);
    const closeDetails = () => setDetailsEvent(null);

    const handleEditChange = (ev) => {
        const { name, value, type, checked } = ev.target;
        setEditForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleEditSave = () => {
        if (!editingEvent) return;
        setSavingEdit(true);
        api.patch(`/api/events/${editingEvent}/`, editForm)
            .then((res) => {
                setEvents((prev) => prev.map((e) => (e.id === editingEvent ? { ...e, ...res.data } : e)));
                closeEdit();
            })
            .catch(() => setEditError('Failed to save.'))
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
                    {!loading && events.length > 0 && (
                        <div className="event-mgmt-table-wrap">
                            <table className="event-mgmt-table">
                                <thead>
                                    <tr>
                                        <th>EVENT NAME</th>
                                        <th>CATEGORY</th>
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
                                            <td className="event-mgmt-cell-title">{ev.event_name || '—'}</td>
                                            <td>{ev.category || '—'}</td>
                                            <td>{ev.venue || '—'}</td>
                                            <td>{formatDate(ev.start_date)}</td>
                                            <td>
                                                <button type="button" className="event-mgmt-details-link" onClick={() => openDetails(ev)}>
                                                    View Details
                                                </button>
                                            </td>
                                            <td>
                                                <span className={`event-mgmt-status ${ev.is_approved ? 'approved' : 'pending'}`}>
                                                    {ev.is_approved ? 'Approved' : 'Pending'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="event-mgmt-actions">
                                                    {!ev.is_approved && (
                                                        <button type="button" className="event-mgmt-approve-btn" onClick={() => handleApprove(ev.id)} disabled={approvingId === ev.id}>Approve</button>
                                                    )}
                                                    <button type="button" className="event-mgmt-edit-btn" onClick={() => openEdit(ev)}>Edit</button>
                                                </span>
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
                    <Link to="/dashboard/events/create" className="event-mgmt-back-link event-mgmt-create-link">Create Event</Link>
                </div>

                {/* --- UPDATED DETAILS MODAL --- */}
                {detailsEvent && (
                    <div className="event-mgmt-modal-overlay" onClick={closeDetails}>
                        <div className="event-mgmt-modal event-mgmt-details-modal" onClick={(e) => e.stopPropagation()}>
                            <h2 className="event-mgmt-modal-title">Event Details</h2>
                            <div className="event-mgmt-details-content">
                                {detailsEvent.event_image && (
                                    <div className="event-mgmt-details-row">
                                        <img src={detailsEvent.event_image} alt="Event" className="event-mgmt-details-img" style={{ width: '100%', borderRadius: '8px', marginBottom: '15px' }} />
                                    </div>
                                )}
                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">Title</span>
                                    <span className="event-mgmt-details-value">{detailsEvent.event_name}</span>
                                </div>
                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">Category</span>
                                    <span className="event-mgmt-details-value" style={{ fontWeight: 'bold', color: '#040354' }}>{detailsEvent.category}</span>
                                </div>
                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">Capacity</span>
                                    <span className="event-mgmt-details-value">{detailsEvent.participants || 'No limit'}</span>
                                </div>
                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">Venue</span>
                                    <span className="event-mgmt-details-value">{detailsEvent.venue}</span>
                                </div>
                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">Schedule</span>
                                    <span className="event-mgmt-details-value">
                                        {formatDate(detailsEvent.start_date)} at {formatTime(detailsEvent.start_time)}
                                    </span>
                                </div>
                                <div className="event-mgmt-details-row event-mgmt-details-row-block">
                                    <span className="event-mgmt-details-label">Description</span>
                                    <span className="event-mgmt-details-value">{detailsEvent.event_description}</span>
                                </div>
                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">Cost</span>
                                    <span className="event-mgmt-details-value">{detailsEvent.cost || 'Free'}</span>
                                </div>
                                <div className="event-mgmt-details-row">
                                    <span className="event-mgmt-details-label">Organizers</span>
                                    <span className="event-mgmt-details-value">{detailsEvent.organizer_names || '—'}</span>
                                </div>
                            </div>
                            <div className="event-mgmt-modal-actions">
                                <button type="button" className="event-mgmt-modal-cancel" onClick={closeDetails}>Close</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* EDIT MODAL */}
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
                        <label>Category</label>
                        <select name="category" value={editForm.category} onChange={handleEditChange}>
                            <option value="">Select Category</option>
                            <option value="Networking">Networking</option>
                            <option value="Workshop">Workshop</option>
                            <option value="Seminar">Seminar</option>
                            <option value="Social">Social</option>
                            <option value="Alumni Homecoming">Alumni Homecoming</option>
                        </select>
                    </div>
                    <div className="event-mgmt-modal-field">
                        <label>Capacity (Participants)</label>
                        <input type="number" name="participants" value={editForm.participants} onChange={handleEditChange} />
                    </div>
                </div>

                <div className="event-mgmt-modal-field">
                    <label>Cost</label>
                    <input name="cost" value={editForm.cost} onChange={handleEditChange} placeholder="e.g. P3000 or Free" />
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
                        {savingEdit ? 'Saving...' : 'Save Changes'}
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