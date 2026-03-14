import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/CreateEvent.css';
import { useTitle } from '../Hooks/useTitle';
import { useNavigate } from 'react-router-dom';

function CreateEvent() {
    useTitle('Create Event');
    const navigate = useNavigate();
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        eventName: '',
        category: '',
        previewText: '',
        coverPhoto: null,
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

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        let val = value;
        if (type === 'checkbox') val = checked;
        if (type === 'file') val = files[0] || null;

        setFormData((prev) => ({
            ...prev,
            [name]: val,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation check for required fields
        if (!formData.eventName || !formData.category || !formData.startDate || !formData.startTime || !formData.venue) {
            alert('Please fill in all required fields');
            return;
        }

        setLoading(true);
        const dataToSend = new FormData();
        
        // 1. Core Fields
        dataToSend.append('event_name', formData.eventName);
        dataToSend.append('category', formData.category);
        dataToSend.append('preview_text', formData.previewText);
        dataToSend.append('event_description', formData.description); 
        dataToSend.append('start_date', formData.startDate);
        dataToSend.append('start_time', formData.startTime);
        dataToSend.append('venue', formData.venue);

        // 2. Capacity & Optional Fields
        // mapping 'capacity' to your model's 'participants' field if applicable
        if (formData.capacity) dataToSend.append('participants', formData.capacity);
        if (formData.endDate) dataToSend.append('end_date', formData.endDate);
        if (formData.endTime) dataToSend.append('end_time', formData.endTime);
        if (formData.cost) dataToSend.append('cost', formData.cost);
        
        // 3. File Upload
        if (formData.coverPhoto) {
            dataToSend.append('event_image', formData.coverPhoto);
        }
        
        // 4. Manual Organizers List
        const organizersList = [formData.organizer1, formData.organizer2, formData.organizer3]
            .filter(name => name && name.trim() !== '') 
            .join(', ');
        dataToSend.append('organizer_names', organizersList);

        // 5. Action Button Logic
        if (formData.actionButtonEnabled) {
            dataToSend.append('action_button_label', formData.actionButtonLabel);
            dataToSend.append('action_button_link', formData.actionButtonLink);
        }

        try {
            await api.post('/api/events/', dataToSend);
            setSuccess(true);
            
            // Reset form
            setFormData({
                eventName: '', category: '', previewText: '', coverPhoto: null, description: '',
                capacity: '', actionButtonEnabled: false, actionButtonLabel: '', actionButtonLink: '',
                startDate: '', endDate: '', startTime: '', endTime: '', cost: '', venue: '',
                organizer1: '', organizer2: '', organizer3: '',
            });

            setTimeout(() => navigate('/dashboard/events'), 3000);
        } catch (error) {
            const data = error.response?.data;
            alert(`Failed to create event: ${data?.detail || 'Please check your connection.'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-event-page">
            <Header />

            <main className="create-event-main">
                <h1 className="create-event-title">Create Event</h1>
                <div className="create-event-form-box">
                    {success && (
                        <div className="ce-success-message">
                            <p>✓ Your event has been created and is pending approval.</p>
                            <p>Redirecting to dashboard...</p>
                        </div>
                    )}
                    
                    {!success && (
                        <form className="create-event-form" onSubmit={handleSubmit}>
                            {/* Event Name */}
                            <div className="ce-field-group">
                                <label className="ce-label-large">
                                    Event Name <span className="ce-required">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="eventName"
                                    value={formData.eventName}
                                    onChange={handleChange}
                                    className="ce-input"
                                    placeholder="Enter event name"
                                    required
                                />
                            </div>

                            {/* Category */}
                            <div className="ce-field-group">
                                <label className="ce-label-large">
                                    Category <span className="ce-required">*</span>
                                </label>
                                <select 
                                    name="category" 
                                    value={formData.category} 
                                    onChange={handleChange} 
                                    className="ce-input" 
                                    required
                                >
                                    <option value="">Select category</option>
                                    <option value="Networking">Networking</option>
                                    <option value="Professional Dev">Professional Development</option>
                                    <option value="Academic">Academic</option>
                                    <option value="Social Event">Social Event</option>
                                    <option value="Career">Career</option>
                                    <option value="Technology">Technology</option>
                                </select>
                            </div>

                            {/* Preview Text */}
                            <div className="ce-field-group">
                                <div className="ce-label-row">
                                    <label className="ce-label-large">
                                        Short Preview <span className="ce-required">*</span>
                                    </label>
                                    <span className="ce-char-count">{formData.previewText.length}/280</span>
                                </div>
                                <textarea
                                    name="previewText"
                                    value={formData.previewText}
                                    onChange={handleChange}
                                    className="summary-ce-textarea ce-textarea-small"
                                    placeholder="Short summary for the card view"
                                    maxLength={280}
                                    required
                                />
                            </div>

                            {/* Cover Photo */}
                            <div className="ce-field-group">
                                <label className="ce-label-large">
                                    Cover Photo <span className="ce-required">*</span>
                                </label>
                                <label className="ce-file-input">
                                    <span className="ce-file-placeholder">
                                        {formData.coverPhoto ? formData.coverPhoto.name : 'Upload Image'}
                                    </span>
                                    <input
                                        type="file"
                                        name="coverPhoto"
                                        accept="image/*"
                                        onChange={handleChange}
                                        style={{display: 'none'}} 
                                    />
                                    <span className="ce-upload-btn">Browse</span>
                                </label>
                            </div>

                            {/* Description */}
                            <div className="ce-field-group">
                                <label className="ce-label-large">
                                    Full Description <span className="ce-required">*</span>
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="ce-textarea ce-textarea-large"
                                    placeholder="Provide a detailed description of the event"
                                    required
                                />
                            </div>

                            {/* Date & Capacity Row */}
                            <div className="ce-row">
                                <div className="ce-field-group ce-field-half">
                                    <label className="ce-label-small">
                                        Start Date <span className="ce-required">*</span>
                                    </label>
                                    <input
                                        type="date" 
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        className="ce-input"
                                        required
                                    />
                                </div>
                                <div className="ce-field-group ce-field-half">
                                    <label className="ce-label-small">Event Capacity</label>
                                    <input
                                        type="number"
                                        name="capacity"
                                        value={formData.capacity}
                                        onChange={handleChange}
                                        className="ce-input"
                                        placeholder="Max number of attendees"
                                    />
                                </div>
                            </div>

                            {/* Time Row */}
                            <div className="ce-row">
                                <div className="ce-field-group ce-field-half">
                                    <label className="ce-label-small">
                                        Start Time <span className="ce-required">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        name="startTime"
                                        value={formData.startTime}
                                        onChange={handleChange}
                                        className="ce-input"
                                        required
                                    />
                                </div>
                                <div className="ce-field-group ce-field-half">
                                    <label className="ce-label-small">End Time</label>
                                    <input
                                        type="time"
                                        name="endTime"
                                        value={formData.endTime}
                                        onChange={handleChange}
                                        className="ce-input"
                                    />
                                </div>
                            </div>

                            {/* Cost & Venue Row */}
                            <div className="ce-row">
                                <div className="ce-field-group ce-field-half">
                                    <label className="ce-label-small">Cost</label>
                                    <input
                                        type="text"
                                        name="cost"
                                        value={formData.cost}
                                        onChange={handleChange}
                                        className="ce-input"
                                        placeholder="Free or 3000 PHP"
                                    />
                                </div>
                                <div className="ce-field-group ce-field-half">
                                    <label className="ce-label-small">
                                        Venue <span className="ce-required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="venue"
                                        value={formData.venue}
                                        onChange={handleChange}
                                        className="ce-input ce-venue-input"
                                        placeholder="Enter event location"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Organizers */}
                            <div className="ce-field-group">
                                <label className="ce-label-small">Organizers (Optional)</label>
                                <div className="ce-row ce-organizers-row">
                                    <div className="ce-field-half">
                                        <input
                                            type="text"
                                            name="organizer1"
                                            value={formData.organizer1}
                                            onChange={handleChange}
                                            className="ce-input"
                                            placeholder="Organizer Name 1"
                                        />
                                    </div>
                                    <div className="ce-field-half">
                                        <input
                                            type="text"
                                            name="organizer2"
                                            value={formData.organizer2}
                                            onChange={handleChange}
                                            className="ce-input"
                                            placeholder="Organizer Name 2"
                                        />
                                    </div>
                                    <div className="ce-field-half">
                                        <input
                                            type="text"
                                            name="organizer3"
                                            value={formData.organizer3}
                                            onChange={handleChange}
                                            className="ce-input"
                                            placeholder="Organizer Name 3"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="ce-actions">
                                <button 
                                    type="button" 
                                    className="ce-cancel-btn" 
                                    onClick={() => navigate(-1)} 
                                >
                                    Cancel
                                </button>

                                <button type="submit" className="ce-submit-btn" disabled={loading}>
                                    <span>{loading ? 'Posting...' : 'Post Event'}</span>
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

export default CreateEvent;