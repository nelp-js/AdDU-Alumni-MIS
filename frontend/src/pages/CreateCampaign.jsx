import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/CreateEvent.css';
import '../styles/CreateCampaign.css';
import { useTitle } from '../Hooks/useTitle';
import { useNavigate, useParams } from 'react-router-dom';

const CATEGORIES = ['Student Aid', 'Infrastructure', 'Research', 'Faculty', 'Community'];
const MAX_CAMPAIGN_TITLE = 60;
const MAX_DESCRIPTION_WORDS = 1200;

function countWords(text) {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
}

function trimToWordLimit(text, maxWords) {
    const words = (text || '').trim().split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ');
}

function CreateCampaign() {
    const { id } = useParams();
    const isEditMode = Boolean(id);
    useTitle(isEditMode ? 'Edit Campaign' : 'Create Campaign');
    const navigate = useNavigate();

    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [submitError, setSubmitError] = useState('');

    const [formData, setFormData] = useState({
        title:       '',
        description: '',
        category:    'Student Aid',
        image_url:   '',
        goal_amount: '',
        end_date:    '',
    });

    const [coverPhoto, setCoverPhoto] = useState(null);
    const [existingCoverUrl, setExistingCoverUrl] = useState(null);
    const titleCount = formData.title.length;
    const descriptionWords = countWords(formData.description);

    useEffect(() => {
        if (!isEditMode || !id) return;
        setFetchLoading(true);
        api.get(`/api/campaigns/${id}/`)
            .then((res) => {
                const c = res.data;
                setFormData({
                    title:       c.title || '',
                    description: c.description || '',
                    category:    c.category || 'Student Aid',
                    image_url:   '',
                    goal_amount: c.goal_amount != null ? String(c.goal_amount) : '',
                    end_date:    c.end_date ? c.end_date.slice(0, 10) : '',
                });
                if (c.cover_image) setExistingCoverUrl(c.cover_image);
            })
            .catch(() => setLoadError('Failed to load campaign.'))
            .finally(() => setFetchLoading(false));
    }, [isEditMode, id]);

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === 'file') {
            setCoverPhoto(files[0] || null);
            setSubmitError('');
        } else if (name === 'description') {
            const next = trimToWordLimit(value, MAX_DESCRIPTION_WORDS);
            setFormData((prev) => ({ ...prev, description: next }));
            setSubmitError('');
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
            setSubmitError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const issues = [];
        if (!formData.title.trim()) issues.push('Campaign title is required.');
        if (!formData.description.trim()) issues.push('Description is required.');
        if (!coverPhoto && !existingCoverUrl) issues.push('Cover image is required.');
        if (!formData.goal_amount) issues.push('Goal amount is required.');
        if (!formData.end_date) issues.push('End date is required.');
        if (titleCount > MAX_CAMPAIGN_TITLE) issues.push(`Campaign title must be ${MAX_CAMPAIGN_TITLE} characters or less.`);
        if (descriptionWords > MAX_DESCRIPTION_WORDS) issues.push(`Description must be ${MAX_DESCRIPTION_WORDS} words or less.`);
        if (issues.length > 0) {
            setSubmitError(`Campaign submission failed: ${issues.join(' ')}`);
            return;
        }

        setSubmitError('');
        setLoading(true);
        try {
            const data = new FormData();
            data.append('title',       formData.title.trim());
            data.append('description', formData.description.trim());
            data.append('category',    formData.category);
            data.append('goal_amount', formData.goal_amount);
            data.append('end_date',    formData.end_date);
            if (!isEditMode) data.append('is_active', true);
            if (coverPhoto) data.append('cover_image', coverPhoto);

            if (isEditMode) {
                await api.patch(`/api/campaigns/${id}/`, data);
            } else {
                await api.post('/api/campaigns/', data);
            }
            setSuccess(true);
            setTimeout(() => navigate('/dashboard/campaigns'), 3000);
        } catch (err) {
            const d = err.response?.data;
            if (d && typeof d === 'object') {
                const entries = Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
                setSubmitError(`Campaign submission failed: ${entries.join(' ')}`);
            } else {
                setSubmitError(`Campaign submission failed: ${d?.detail || 'Please try again.'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const coverPreviewUrl = coverPhoto
        ? URL.createObjectURL(coverPhoto)
        : existingCoverUrl;

    if (success) {
        return (
            <div className="create-event-page">
                <Header />
                <main className="create-event-main">
                    <div className="create-event-form-box">
                        <div className="ce-success-message">
                            <p>✓ {isEditMode ? 'Campaign updated successfully!' : 'Campaign submitted and pending approval.'}</p>
                            <p>Redirecting to dashboard...</p>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="create-event-page">
            <Header />
            <main className="create-event-main">
                <h1 className="create-event-title">{isEditMode ? 'Edit Campaign' : 'Create Campaign'}</h1>
                <div className="create-event-form-box">
                    {fetchLoading && <div className="ce-loading-msg">Loading campaign data...</div>}
                    {loadError && <div className="ce-submit-error">{loadError}</div>}

                    {!fetchLoading && !loadError && (
                    <form className="create-event-form" onSubmit={handleSubmit}>
                        {submitError && <div className="ce-submit-error">{submitError}</div>}

                        {/* Title */}
                        <div className="ce-field-group">
                            <div className="ce-label-row">
                                <label className="ce-label-large">
                                    Campaign Title <span className="ce-required">*</span>
                                </label>
                                <span className="ce-char-count">{titleCount}/{MAX_CAMPAIGN_TITLE}</span>
                            </div>
                            <input type="text" name="title" value={formData.title}
                                onChange={handleChange} className="ce-input"
                                maxLength={MAX_CAMPAIGN_TITLE}
                                placeholder="e.g. Scholar Excellence Fund 2026" required />
                        </div>

                        {/* Cover Image Upload */}
                        <div className="ce-field-group">
                            <label className="ce-label-large">Cover Photo <span className="ce-required">*</span></label>
                            {coverPreviewUrl && (
                                <div className="cc-preview">
                                    <img src={coverPreviewUrl} alt="Preview" className="cc-preview-img" />
                                    {coverPhoto && <p className="cc-preview-name">{coverPhoto.name}</p>}
                                </div>
                            )}
                            <label className="ce-file-input">
                                <span className="ce-file-placeholder">
                                    {coverPhoto ? coverPhoto.name : (existingCoverUrl ? 'Change cover photo' : 'Upload Image (required)')}
                                </span>
                                <input type="file" name="cover_image" accept="image/*"
                                    onChange={handleChange} style={{ display: 'none' }}
                                    {...(!isEditMode && !coverPhoto ? { required: true } : {})} />
                                <span className="ce-upload-btn">Browse</span>
                            </label>
                        </div>

                        {/* Description */}
                        <div className="ce-field-group">
                            <div className="ce-label-row">
                                <label className="ce-label-large">Description <span className="ce-required">*</span></label>
                                <span className="ce-char-count">{descriptionWords} / {MAX_DESCRIPTION_WORDS} words</span>
                            </div>
                            <textarea name="description" value={formData.description}
                                onChange={handleChange}
                                className="ce-textarea ce-textarea-large"
                                placeholder="Tell the story of this campaign..."
                                required />
                        </div>

                        {/* Category & Goal */}
                        <div className="ce-row">
                            <div className="ce-field-group ce-field-half">
                                <label className="ce-label-large">Category</label>
                                <select name="category" value={formData.category}
                                    onChange={handleChange} className="ce-input">
                                    {CATEGORIES.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="ce-field-group ce-field-half">
                                <label className="ce-label-large">
                                    Goal Amount (₱) <span className="ce-required">*</span>
                                </label>
                                <input type="number" name="goal_amount" value={formData.goal_amount}
                                    onChange={handleChange} className="ce-input"
                                    placeholder="e.g. 500000" min="1" required />
                            </div>
                        </div>

                        {/* End Date */}
                        <div className="ce-field-group">
                            <label className="ce-label-large">
                                End Date <span className="ce-required">*</span>
                            </label>
                            <input type="date" name="end_date" value={formData.end_date}
                                onChange={handleChange} className="ce-input"
                                style={{ maxWidth: '280px' }} required />
                        </div>

                        <div className="ce-actions">
                            <button type="button" className="ce-cancel-btn" onClick={() => navigate('/dashboard/campaigns')}>
                                Cancel
                            </button>
                            <button type="submit" className="ce-submit-btn" disabled={loading}>
                                <span>{loading
                                    ? (isEditMode ? 'Saving...' : 'Creating...')
                                    : (isEditMode ? 'Save Changes' : 'Create Campaign')
                                }</span>
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

export default CreateCampaign;