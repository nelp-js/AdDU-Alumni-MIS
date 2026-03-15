import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/CreateEvent.css';
import '../styles/CreateCampaign.css';
import { useTitle } from '../Hooks/useTitle';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = ['Student Aid', 'Infrastructure', 'Research', 'Faculty'];

function CreateCampaign() {
    useTitle('Create Campaign');
    const navigate = useNavigate();
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title:       '',
        description: '',
        category:    'Student Aid',
        image_url:   '',
        goal_amount: '',
        end_date:    '',
    });

    const [coverPhoto, setCoverPhoto] = useState(null);

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === 'file') {
            setCoverPhoto(files[0] || null);
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.goal_amount || !formData.end_date) {
            alert('Please fill in all required fields.');
            return;
        }
        setLoading(true);
        try {
            const data = new FormData();
            data.append('title',       formData.title);
            data.append('description', formData.description);
            data.append('category',    formData.category);
            data.append('goal_amount', formData.goal_amount);
            data.append('end_date',    formData.end_date);
            data.append('is_active',   true);
            if (formData.image_url) data.append('image_url', formData.image_url);
            if (coverPhoto)         data.append('cover_image', coverPhoto);

            await api.post('/api/campaigns/', data);
            setSuccess(true);
            setTimeout(() => navigate('/dashboard/donations'), 3000);
        } catch (err) {
            const d = err.response?.data;
            alert(`Failed to create campaign: ${d?.detail || 'Please try again.'}`);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="create-event-page">
                <Header />
                <main className="create-event-main">
                    <div className="create-event-form-box">
                        <div className="ce-success-message">
                            <p>✓ Campaign created successfully!</p>
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
                <h1 className="create-event-title">Create Campaign</h1>
                <div className="create-event-form-box">
                    <form className="create-event-form" onSubmit={handleSubmit}>

                        {/* Title */}
                        <div className="ce-field-group">
                            <label className="ce-label-large">
                                Campaign Title <span className="ce-required">*</span>
                            </label>
                            <input type="text" name="title" value={formData.title}
                                onChange={handleChange} className="ce-input"
                                placeholder="e.g. Scholar Excellence Fund 2026" required />
                        </div>

                        {/* Description */}
                        <div className="ce-field-group">
                            <label className="ce-label-large">Description</label>
                            <textarea name="description" value={formData.description}
                                onChange={handleChange}
                                className="ce-textarea ce-textarea-large"
                                placeholder="Tell the story of this campaign..." />
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

                        {/* Cover Image Upload */}
                        <div className="ce-field-group">
                            <label className="ce-label-large">Cover Image</label>
                            {coverPhoto && (
                                <div className="cc-preview">
                                    <img src={URL.createObjectURL(coverPhoto)} alt="Preview" className="cc-preview-img" />
                                    <p className="cc-preview-name">{coverPhoto.name}</p>
                                </div>
                            )}
                            <label className="ce-file-input">
                                <span className="ce-file-placeholder">
                                    {coverPhoto ? coverPhoto.name : 'Upload Image (optional)'}
                                </span>
                                <input type="file" name="cover_image" accept="image/*"
                                    onChange={handleChange} style={{ display: 'none' }} />
                                <span className="ce-upload-btn">Browse</span>
                            </label>
                        </div>

                        <div className="ce-actions">
                            <button type="button" className="ce-cancel-btn" onClick={() => navigate(-1)}>
                                Cancel
                            </button>
                            <button type="submit" className="ce-submit-btn" disabled={loading}>
                                <span>{loading ? 'Creating...' : 'Create Campaign'}</span>
                            </button>
                        </div>

                    </form>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default CreateCampaign;