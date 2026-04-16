import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/CreateVolunteer.css';
import { useTitle } from '../Hooks/useTitle';

const MAX_TITLE = 60;
const MAX_SUMMARY = 240;
const MAX_LOCATION = 60;
const MAX_ORGANIZER = 60;
const MAX_DESCRIPTION_WORDS = 1200;

const CATEGORY_OPTIONS = [
    'Alumni teaching',
    'Mentorship',
    'Projects',
    'Community Engagement',
    'Volunteer Activities',
];

function countWords(text) {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
}

function trimToWordLimit(text, maxWords) {
    const words = (text || '').trim().split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ');
}

function CreateVolunteer() {
    useTitle('Create Volunteer');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        description: '',
        startDate: '',
        endDate: '',
        coverPhoto: null,
        summary: '',
        location: '',
        organizer: '',
    });

    const descriptionWords = countWords(formData.description);

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        let nextValue = value;
        if (type === 'file') nextValue = files[0] || null;
        if (name === 'description') nextValue = trimToWordLimit(value, MAX_DESCRIPTION_WORDS);
        setFormData((prev) => ({ ...prev, [name]: nextValue }));
    };

    useEffect(() => {
        if (!formData.coverPhoto) {
            setCoverPreviewUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(formData.coverPhoto);
        setCoverPreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [formData.coverPhoto]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSubmitError('');

        const payload = new FormData();
        payload.append('title', formData.title.trim());
        payload.append('category', formData.category);
        payload.append('description', formData.description.trim());
        payload.append('start_date', formData.startDate);
        payload.append('end_date', formData.endDate);
        payload.append('summary', formData.summary.trim());
        payload.append('location', formData.location.trim());
        payload.append('organizer', formData.organizer.trim());
        if (formData.coverPhoto) payload.append('cover_photo', formData.coverPhoto);

        try {
            await api.post('/api/volunteers/', payload);
            setSuccess(true);
            setTimeout(() => navigate('/dashboard'), 2500);
        } catch (error) {
            const responseData = error.response?.data;
            if (typeof responseData === 'string') {
                setSubmitError(responseData);
            } else if (responseData?.detail) {
                setSubmitError(responseData.detail);
            } else {
                const firstError = responseData && Object.values(responseData)[0];
                setSubmitError(Array.isArray(firstError) ? firstError[0] : 'Failed to create volunteer opportunity.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-volunteer-page">
            <Header />
            <main className="create-event-main">
                <h1 className="create-event-title">Create Volunteer Opportunity</h1>
                <div className="create-event-form-box">
                    {success ? (
                        <div className="ce-success-message">
                            <p>✓ Volunteer opportunity created successfully.</p>
                            <p>Redirecting to dashboard...</p>
                        </div>
                    ) : (
                        <form className="create-event-form" onSubmit={handleSubmit}>
                            {submitError && (
                                <div className="ce-success-message" style={{ background: '#fee2e2', borderColor: '#fecaca' }}>
                                    <p style={{ color: '#b91c1c', marginBottom: 0 }}>{submitError}</p>
                                </div>
                            )}
                            <div className="ce-field-group">
                                <div className="ce-label-row">
                                    <label className="ce-label-large">Title <span className="ce-required">*</span></label>
                                    <span className="ce-char-count">{formData.title.length}/{MAX_TITLE}</span>
                                </div>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="ce-input"
                                    maxLength={MAX_TITLE}
                                    placeholder="Enter volunteer opportunity title"
                                    required
                                />
                            </div>

                            <div className="ce-field-group">
                                <label className="ce-label-large">Category <span className="ce-required">*</span></label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="ce-input"
                                    required
                                >
                                    <option value="">Select category</option>
                                    {CATEGORY_OPTIONS.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="ce-field-group">
                                <label className="ce-label-large">Cover Photo <span className="ce-required">*</span></label>
                                {coverPreviewUrl && (
                                    <div className="ce-upload-preview">
                                        <img src={coverPreviewUrl} alt="Preview" className="ce-upload-preview-img" />
                                        <p className="ce-upload-preview-name">{formData.coverPhoto?.name}</p>
                                    </div>
                                )}
                                <label className="ce-file-input">
                                    <span className="ce-file-placeholder">
                                        {formData.coverPhoto ? formData.coverPhoto.name : 'Upload Image (Required)'}
                                    </span>
                                    <input
                                        type="file"
                                        name="coverPhoto"
                                        accept="image/*"
                                        onChange={handleChange}
                                        style={{ display: 'none' }}
                                        required
                                    />
                                    <span className="ce-upload-btn">Browse</span>
                                </label>
                            </div>

                            <div className="ce-field-group">
                                <div className="ce-label-row">
                                    <label className="ce-label-large">Summary <span className="ce-required">*</span></label>
                                    <span className="ce-char-count">{formData.summary.length}/{MAX_SUMMARY}</span>
                                </div>
                                <textarea
                                    name="summary"
                                    value={formData.summary}
                                    onChange={handleChange}
                                    className="summary-ce-textarea ce-textarea-small"
                                    maxLength={MAX_SUMMARY}
                                    placeholder="Short summary for volunteer listing"
                                    required
                                />
                            </div>

                            <div className="ce-field-group">
                                <div className="ce-label-row">
                                    <label className="ce-label-large">Description <span className="ce-required">*</span></label>
                                    <span className="ce-char-count">{descriptionWords}/{MAX_DESCRIPTION_WORDS}</span>
                                </div>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="ce-textarea ce-textarea-large"
                                    placeholder="Provide full details of the volunteer opportunity"
                                    required
                                />
                            </div>

                            <div className="ce-row">
                                <div className="ce-field-group ce-field-half">
                                    <label className="ce-label-small">Start Date <span className="ce-required">*</span></label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        className="ce-input"
                                        placeholder="mm/dd/yyyy"
                                        required
                                    />
                                </div>
                                <div className="ce-field-group ce-field-half">
                                    <label className="ce-label-small">End Date <span className="ce-required">*</span></label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        className="ce-input"
                                        placeholder="mm/dd/yyyy"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="ce-row">
                                <div className="ce-field-group ce-field-half">
                                    <div className="ce-label-row">
                                        <label className="ce-label-small">Location <span className="ce-required">*</span></label>
                                        <span className="ce-char-count">{formData.location.length}/{MAX_LOCATION}</span>
                                    </div>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        className="ce-input"
                                        maxLength={MAX_LOCATION}
                                        placeholder="Enter location"
                                        required
                                    />
                                </div>
                                <div className="ce-field-group ce-field-half">
                                    <div className="ce-label-row">
                                        <label className="ce-label-small">Organizer <span className="ce-required">*</span></label>
                                        <span className="ce-char-count">{formData.organizer.length}/{MAX_ORGANIZER}</span>
                                    </div>
                                    <input
                                        type="text"
                                        name="organizer"
                                        value={formData.organizer}
                                        onChange={handleChange}
                                        className="ce-input"
                                        maxLength={MAX_ORGANIZER}
                                        placeholder="Enter organizer"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="ce-actions">
                                <button type="button" className="ce-cancel-btn" onClick={() => navigate(-1)}>
                                    Cancel
                                </button>
                                <button type="submit" className="ce-submit-btn" disabled={loading}>
                                    <span>{loading ? 'Creating...' : 'Create Volunteer Opportunity'}</span>
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

export default CreateVolunteer;
