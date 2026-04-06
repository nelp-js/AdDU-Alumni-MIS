import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/CreateEvent.css';
import '../styles/CreateJob.css';
import '../styles/ContentManagement.css';
import { useTitle } from '../Hooks/useTitle';

const currentDate = new Date();
const threeYearsLater = new Date();
threeYearsLater.setFullYear(currentDate.getFullYear() + 3);
const DEFAULT_START = currentDate.toISOString().split('T')[0];
const DEFAULT_END   = threeYearsLater.toISOString().split('T')[0];

const JOB_FIELDS = {
    company:        '',
    position:       '',
    location:       '',
    modality:       '',
    employmentType: '',
    salary:         '',
    email:          '',
    startDate:      DEFAULT_START,
    endDate:        DEFAULT_END,
    description:    '',
};

const INTERNSHIP_FIELDS = {
    company:     '',
    position:    '',
    location:    '',
    modality:    '',
    allowance:   '',
    email:       '',
    startDate:   DEFAULT_START,
    endDate:     DEFAULT_END,
    description: '',
};

function CreateJob() {
    useTitle('Create Job & Internship');
    const navigate  = useNavigate();
    const [type, setType]       = useState(null); // 'job' | 'internship'
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({});

    const handleSelectType = (t) => {
        setType(t);
        setFormData(t === 'job' ? { ...JOB_FIELDS } : { ...INTERNSHIP_FIELDS });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.company || !formData.position || !formData.location || !formData.email || !formData.description) {
            alert('Please fill in all required fields.');
            return;
        }
        setLoading(true);
        try {
            const endpoint = type === 'job' ? '/api/jobs/' : '/api/internships/';
            const payload =
                type === 'job'
                    ? {
                          company: formData.company,
                          position: formData.position,
                          location: formData.location,
                          modality: formData.modality,
                          employment_type: formData.employmentType,
                          salary: formData.salary || '',
                          email: formData.email,
                          start_date: formData.startDate,
                          end_date: formData.endDate,
                          description: formData.description,
                      }
                    : {
                          company: formData.company,
                          position: formData.position,
                          location: formData.location,
                          modality: formData.modality,
                          allowance: formData.allowance || '',
                          email: formData.email,
                          start_date: formData.startDate,
                          end_date: formData.endDate,
                          description: formData.description,
                      };
            await api.post(endpoint, payload);
            setSuccess(true);
            setTimeout(() => navigate('/dashboard/jobs'), 3000);
        } catch (err) {
            const data = err.response?.data;
            alert(`Failed to submit: ${data?.detail || 'Please try again.'}`);
        } finally {
            setLoading(false);
        }
    };

    if (!type) {
        return (
            <div className="create-event-page">
                <Header />
                <main className="create-event-main">
                    <h1 className="create-event-title">Create Job & Internship</h1>
                    <div className="create-event-form-box">
                        <p className="cj-picker-label">What would you like to post?</p>
                        <div className="cj-type-grid">
                            <button type="button" className="cj-type-card" onClick={() => handleSelectType('job')}>
                                <svg className="cj-type-icon" viewBox="0 0 24 24" fill="none" stroke="#040354" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                                    <line x1="12" y1="12" x2="12" y2="12"/>
                                    <path d="M2 12h20"/>
                                </svg>
                                <span className="cj-type-title">Job</span>
                                <span className="cj-type-desc">Full-time, part-time, or contract position</span>
                            </button>
                            <button type="button" className="cj-type-card" onClick={() => handleSelectType('internship')}>
                                <svg className="cj-type-icon" viewBox="0 0 24 24" fill="none" stroke="#040354" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                                </svg>
                                <span className="cj-type-title">Internship</span>
                                <span className="cj-type-desc">Short-term opportunity for students or fresh grads</span>
                            </button>
                        </div>
                    </div>
                    <div className="cj-back-row">
                        <Link to="/dashboard" className="content-mgmt-back-link">← Back to Dashboard</Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // ── Success ──────────────────────────────────────────────────────────────
    if (success) {
        return (
            <div className="create-event-page">
                <Header />
                <main className="create-event-main">
                    <div className="create-event-form-box">
                        <div className="ce-success-message">
                            <p>✓ Your {type === 'job' ? 'job posting' : 'internship'} has been submitted and is pending approval.</p>
                            <p>Redirecting to dashboard...</p>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // ── Form ─────────────────────────────────────────────────────────────────
    return (
        <div className="create-event-page">
            <Header />
            <main className="create-event-main">
                <h1 className="create-event-title">
                    Post {type === 'job' ? 'a Job' : 'an Internship'}
                </h1>
                <div className="create-event-form-box">
                    <button type="button" className="cj-back-type" onClick={() => setType(null)}>
                        ← Change type
                    </button>

                    <form className="create-event-form" onSubmit={handleSubmit}>

                        {/* Company & Position */}
                        <div className="ce-row">
                            <div className="ce-field-group ce-field-half">
                                <label className="ce-label-large">Company Name <span className="ce-required">*</span></label>
                                <input type="text" name="company" value={formData.company}
                                    onChange={handleChange} className="ce-input"
                                    placeholder="e.g. Ateneo de Davao University" required />
                            </div>
                            <div className="ce-field-group ce-field-half">
                                <label className="ce-label-large">Position Title <span className="ce-required">*</span></label>
                                <input type="text" name="position" value={formData.position}
                                    onChange={handleChange} className="ce-input"
                                    placeholder={type === 'job' ? 'e.g. Senior Software Engineer' : 'e.g. UI/UX Intern'} required />
                            </div>
                        </div>

                        {/* Location & Modality */}
                        <div className="ce-row">
                            <div className="ce-field-group ce-field-half">
                                <label className="ce-label-large">Location <span className="ce-required">*</span></label>
                                <input type="text" name="location" value={formData.location}
                                    onChange={handleChange} className="ce-input"
                                    placeholder="e.g. Davao City or Remote" required />
                            </div>
                            <div className="ce-field-group ce-field-half">
                                <label className="ce-label-large">Work Modality <span className="ce-required">*</span></label>
                                <select name="modality" value={formData.modality} onChange={handleChange} className="ce-input" required>
                                    <option value="">Select modality</option>
                                    <option value="On-site">On-site</option>
                                    <option value="Remote">Remote</option>
                                    <option value="Hybrid">Hybrid</option>
                                </select>
                            </div>
                        </div>

                        {/* Employment Type (job only) */}
                        {type === 'job' && (
                            <div className="ce-row">
                                <div className="ce-field-group ce-field-half">
                                    <label className="ce-label-large">Employment Type <span className="ce-required">*</span></label>
                                    <select name="employmentType" value={formData.employmentType} onChange={handleChange} className="ce-input" required>
                                        <option value="">Select type</option>
                                        <option value="Full-time">Full-time</option>
                                        <option value="Part-time">Part-time</option>
                                        <option value="Contract">Contract</option>
                                        <option value="Freelance">Freelance</option>
                                    </select>
                                </div>
                                <div className="ce-field-group ce-field-half">
                                    <label className="ce-label-large">Salary Range (optional)</label>
                                    <input type="text" name="salary" value={formData.salary}
                                        onChange={handleChange} className="ce-input"
                                        placeholder="e.g. ₱50,000 - ₱80,000" />
                                </div>
                            </div>
                        )}

                        {/* Allowance (internship only) */}
                        {type === 'internship' && (
                            <div className="ce-field-group">
                                <label className="ce-label-large">Allowance (optional)</label>
                                <input type="text" name="allowance" value={formData.allowance}
                                    onChange={handleChange} className="ce-input"
                                    placeholder="e.g. ₱5,000/month or Unpaid" />
                            </div>
                        )}

                        {/* Start & End Date */}
                        <div className="ce-row">
                            <div className="ce-field-group ce-field-half">
                                <label className="ce-label-small">
                                    {type === 'job' ? 'Start Date' : 'Internship Start'} <span className="ce-required">*</span>
                                </label>
                                <input type="date" name="startDate" value={formData.startDate}
                                    onChange={handleChange} className="ce-input" required />
                            </div>
                            <div className="ce-field-group ce-field-half">
                                <label className="ce-label-small">
                                    {type === 'job' ? 'End Date' : 'Internship End'} <span className="ce-required">*</span>
                                </label>
                                <input type="date" name="endDate" value={formData.endDate}
                                    onChange={handleChange} className="ce-input" required />
                            </div>
                        </div>

                        {/* Contact Email */}
                        <div className="ce-field-group">
                            <label className="ce-label-large">Contact / Application Email <span className="ce-required">*</span></label>
                            <input type="email" name="email" value={formData.email}
                                onChange={handleChange} className="ce-input"
                                placeholder="careers@company.com" required />
                        </div>

                        {/* Description */}
                        <div className="ce-field-group">
                            <label className="ce-label-large">
                                {type === 'job' ? 'Job Description' : 'Internship Description'} <span className="ce-required">*</span>
                            </label>
                            <textarea name="description" value={formData.description}
                                onChange={handleChange}
                                className="ce-textarea ce-textarea-large"
                                placeholder="Describe the role, responsibilities, and requirements..."
                                required />
                        </div>

                        <div className="ce-actions">
                            <button type="button" className="ce-cancel-btn" onClick={() => navigate(-1)}>
                                Cancel
                            </button>
                            <button type="submit" className="ce-submit-btn" disabled={loading}>
                                <span>{loading ? 'Submitting...' : 'Submit for Approval'}</span>
                            </button>
                        </div>

                    </form>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default CreateJob;