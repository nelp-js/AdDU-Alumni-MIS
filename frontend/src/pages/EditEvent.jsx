import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/CreateEvent.css';
import { useTitle } from '../Hooks/useTitle';

function EditEvent() {
    useTitle('Edit Event');
    const navigate = useNavigate();
    const { id } = useParams();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError]     = useState(null);

    const [formData, setFormData] = useState({
        eventName: '',
        category: '',
        previewText: '',
        coverPhoto: null,
        existingCoverPhoto: '',
        description: '',
        capacity: '',
        actionButtonEnabled: false,
        actionButtonLabel: '',
        actionButtonLink: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        cost: '',
        venue: '',
        organizer1: '',
        organizer2: '',
        organizer3: '',
    });

    // ── Load existing event ───────────────────────────────────────────────────

    useEffect(() => {
        api.get(`/api/events/${id}/`)
            .then((res) => {
                const e = res.data;
                const organizers = (e.organizer_names || '').split(',').map((s) => s.trim());
                setFormData({
                    eventName:           e.event_name || '',
                    category:            e.category || '',
                    previewText:         e.preview_text || '',
                    coverPhoto:          null,
                    existingCoverPhoto:  e.event_image || '',
                    description:         e.event_description || '',
                    capacity:            e.participants || '',
                    actionButtonEnabled: !!(e.action_button_label || e.action_button_link),
                    actionButtonLabel:   e.action_button_label || '',
                    actionButtonLink:    e.action_button_link || '',
                    startDate:           e.start_date ? e.start_date.slice(0, 10) : '',
                    endDate:             e.end_date   ? e.end_date.slice(0, 10)   : '',
                    startTime:           e.start_time ? e.start_time.slice(0, 5)  : '',
                    endTime:             e.end_time   ? e.end_time.slice(0, 5)    : '',
                    cost:                e.cost || '',
                    venue:               e.venue || '',
                    organizer1:          organizers[0] || '',
                    organizer2:          organizers[1] || '',
                    organizer3:          organizers[2] || '',
                });
            })
            .catch(() => setError('Failed to load event.'))
            .finally(() => setLoading(false));
    }, [id]);

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        let val = value;
        if (type === 'checkbox') val = checked;
        if (type === 'file') val = files[0] || null;
        setFormData((prev) => ({ ...prev, [name]: val }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.eventName || !formData.category || !formData.startDate || !formData.startTime || !formData.venue) {
            alert('Please fill in all required fields.');
            return;
        }

        setSaving(true);
        const dataToSend = new FormData();

        dataToSend.append('event_name',       formData.eventName);
        dataToSend.append('category',          formData.category);
        dataToSend.append('preview_text',      formData.previewText);
        dataToSend.append('event_description', formData.description);
        dataToSend.append('start_date',        formData.startDate);
        dataToSend.append('start_time',        formData.startTime);
        dataToSend.append('venue',             formData.venue);

        if (formData.capacity) dataToSend.append('participants', formData.capacity);
        if (formData.endDate)  dataToSend.append('end_date',     formData.endDate);
        if (formData.endTime)  dataToSend.append('end_time',     formData.endTime);
        if (formData.cost)     dataToSend.append('cost',         formData.cost);

        if (formData.coverPhoto) {
            dataToSend.append('event_image', formData.coverPhoto);
        }

        const organizersList = [formData.organizer1, formData.organizer2, formData.organizer3]
            .filter((n) => n && n.trim() !== '')
            .join(', ');
        dataToSend.append('organizer_names', organizersList);

        if (formData.actionButtonEnabled) {
            dataToSend.append('action_button_label', formData.actionButtonLabel);
            dataToSend.append('action_button_link',  formData.actionButtonLink);
        } else {
            dataToSend.append('action_button_label', '');
            dataToSend.append('action_button_link',  '');
        }

        try {
            await api.patch(`/api/events/${id}/`, dataToSend);
            setSuccess(true);
            setTimeout(() => navigate('/dashboard/events'), 2000);
        } catch (err) {
            const data = err.response?.data;
            alert(`Failed to save event: ${data?.detail || 'Please check your connection.'}`);
        } finally {
            setSaving(false);
        }
    };

    // ── Loading / error states ────────────────────────────────────────────────

    if (loading) return (
        <div className="create-event-page">
            <Header />
            <main className="create-event-main">
                <p style={{ textAlign: 'center', color: '#6d7280', paddingTop: '60px' }}>Loading event…</p>
            </main>
            <Footer />
        </div>
    );

    if (error) return (
        <div className="create-event-page">
            <Header />
            <main className="create-event-main">
                <p style={{ textAlign: 'center', color: '#dc2626', paddingTop: '60px' }}>{error}</p>
            </main>
            <Footer />
        </div>
    );

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="create-event-page">
            <Header />
            <main className="create-event-main">
                <h1 className="create-event-title">Edit Event</h1>
                <div className="create-event-form-box">
                    {success && (
                        <div className="ce-success-message">
                            <p>✓ Event updated successfully.</p>
                            <p>Redirecting to dashboard...</p>
                        </div>
                    )}

                    {!success && (
                        <form className="create-event-form" onSubmit={handleSubmit}>

                            <div className="ce-field-group">
                                <label className="ce-label-large">Event Name <span className="ce-required">*</span></label>
                                <input type="text" name="eventName" value={formData.eventName}
                                    onChange={handleChange} className="ce-input" placeholder="Enter event name" required />
                            </div>

                            <div className="ce-field-group">
                                <label className="ce-label-large">Category <span className="ce-required">*</span></label>
                                <select name="category" value={formData.category} onChange={handleChange} className="ce-input" required>
                                    <option value="">Select category</option>
                                    <option value="Networking">Networking</option>
                                    <option value="Professional Dev">Professional Development</option>
                                    <option value="Academic">Academic</option>
                                    <option value="Social Event">Social Event</option>
                                    <option value="Career">Career</option>
                                    <option value="Technology">Technology</option>
                                </select>
                            </div>

                            <div className="ce-field-group">
                                <div className="ce-label-row">
                                    <label className="ce-label-large">Short Preview <span className="ce-required">*</span></label>
                                    <span className="ce-char-count">{formData.previewText.length}/280</span>
                                </div>
                                <textarea name="previewText" value={formData.previewText} onChange={handleChange}
                                    className="summary-ce-textarea ce-textarea-small"
                                    placeholder="Short summary for the card view" maxLength={280} required />
                            </div>

                            <div className="ce-field-group">
                                <label className="ce-label-large">Cover Photo</label>
                                {formData.existingCoverPhoto && !formData.coverPhoto && (
                                    <div style={{ marginBottom: '8px' }}>
                                        <img src={formData.existingCoverPhoto} alt="Current cover"
                                            style={{ maxHeight: '120px', borderRadius: '8px', objectFit: 'cover' }} />
                                        <p style={{ fontSize: '12px', color: '#6d7280', marginTop: '4px' }}>
                                            Current cover — upload a new one to replace it.
                                        </p>
                                    </div>
                                )}
                                <label className="ce-file-input">
                                    <span className="ce-file-placeholder">
                                        {formData.coverPhoto ? formData.coverPhoto.name : 'Upload New Image (optional)'}
                                    </span>
                                    <input type="file" name="coverPhoto" accept="image/*"
                                        onChange={handleChange} style={{ display: 'none' }} />
                                    <span className="ce-upload-btn">Browse</span>
                                </label>
                            </div>

                            <div className="ce-field-group">
                                <label className="ce-label-large">Full Description <span className="ce-required">*</span></label>
                                <textarea name="description" value={formData.description} onChange={handleChange}
                                    className="ce-textarea ce-textarea-large"
                                    placeholder="Provide a detailed description of the event" required />
                            </div>

                            <div className="ce-row">
                                <div className="ce-field-group ce-field-half">
                                    <label className="ce-label-small">Start Date <span className="ce-required">*</span></label>
                                    <input type="date" name="startDate" value={formData.startDate}
                                        onChange={handleChange} className="ce-input" required />
                                </div>
                                <div className="ce-field-group ce-field-half">
                                    <label className="ce-label-small">Event Capacity</label>
                                    <input type="number" name="capacity" value={formData.capacity}
                                        onChange={handleChange} className="ce-input" placeholder="Max number of attendees" />
                                </div>
                            </div>

                            <div className="ce-row">
                                <div className="ce-field-group ce-field-half">
                                    <label className="ce-label-small">Start Time <span className="ce-required">*</span></label>
                                    <input type="time" name="startTime" value={formData.startTime}
                                        onChange={handleChange} className="ce-input" required />
                                </div>
                                <div className="ce-field-group ce-field-half">
                                    <label className="ce-label-small">End Time</label>
                                    <input type="time" name="endTime" value={formData.endTime}
                                        onChange={handleChange} className="ce-input" />
                                </div>
                            </div>

                            <div className="ce-row">
                                <div className="ce-field-group ce-field-half">
                                    <label className="ce-label-small">Cost</label>
                                    <input type="text" name="cost" value={formData.cost}
                                        onChange={handleChange} className="ce-input" placeholder="Free or 3000 PHP" />
                                </div>
                                <div className="ce-field-group ce-field-half">
                                    <label className="ce-label-small">Venue <span className="ce-required">*</span></label>
                                    <input type="text" name="venue" value={formData.venue}
                                        onChange={handleChange} className="ce-input" placeholder="Enter event location" required />
                                </div>
                            </div>

                            <div className="ce-field-group">
                                <label className="ce-label-small">End Date</label>
                                <input type="date" name="endDate" value={formData.endDate}
                                    onChange={handleChange} className="ce-input" />
                            </div>

                            <div className="ce-field-group">
                                <label className="ce-label-small">Organizers (Optional)</label>
                                <div className="ce-row ce-organizers-row">
                                    <div className="ce-field-half">
                                        <input type="text" name="organizer1" value={formData.organizer1}
                                            onChange={handleChange} className="ce-input" placeholder="Organizer Name 1" />
                                    </div>
                                    <div className="ce-field-half">
                                        <input type="text" name="organizer2" value={formData.organizer2}
                                            onChange={handleChange} className="ce-input" placeholder="Organizer Name 2" />
                                    </div>
                                    <div className="ce-field-half">
                                        <input type="text" name="organizer3" value={formData.organizer3}
                                            onChange={handleChange} className="ce-input" placeholder="Organizer Name 3" />
                                    </div>
                                </div>
                            </div>

                            <div className="ce-field-group">
                                <label className="ce-label-small" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input type="checkbox" name="actionButtonEnabled"
                                        checked={formData.actionButtonEnabled} onChange={handleChange} />
                                    Enable Action Button
                                </label>
                            </div>
                            {formData.actionButtonEnabled && (
                                <div className="ce-row">
                                    <div className="ce-field-group ce-field-half">
                                        <label className="ce-label-small">Button Label</label>
                                        <input type="text" name="actionButtonLabel" value={formData.actionButtonLabel}
                                            onChange={handleChange} className="ce-input" placeholder="e.g. Register Now" />
                                    </div>
                                    <div className="ce-field-group ce-field-half">
                                        <label className="ce-label-small">Button Link</label>
                                        <input type="text" name="actionButtonLink" value={formData.actionButtonLink}
                                            onChange={handleChange} className="ce-input" placeholder="https://..." />
                                    </div>
                                </div>
                            )}

                            <div className="ce-actions">
                                <button type="button" className="ce-cancel-btn" onClick={() => navigate('/dashboard/events')}>
                                    Cancel
                                </button>
                                <button type="submit" className="ce-submit-btn" disabled={saving}>
                                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                                </button>
                            </div>

                        </form>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default EditEvent;