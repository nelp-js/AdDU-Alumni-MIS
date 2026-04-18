import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/CreateEvent.css';
import '../styles/CreateJob.css';
import '../styles/ContentManagement.css';
import { useTitle } from '../Hooks/useTitle';

const MAX_TEXT_60 = 60;
const MAX_DESCRIPTION_WORDS = 1200;

const JOB_FIELDS = {
    company:         '',
    position:        '',
    location:        '',
    modality:        '',
    employmentType:  '',
    salary:          '',
    contactName:     '',
    contactPosition: '',
    email:           '',
    startDate:       '', // Posting Start
    endDate:         '', // Posting End
    description:     '',
};

const INTERNSHIP_FIELDS = {
    company:             '',
    position:            '',
    location:            '',
    modality:            '',
    allowance:           '',
    contactName:         '',
    contactPosition:     '',
    email:               '',
    startDate:           '', // Posting Start
    endDate:             '', // Posting End
    internshipStartDate: '', // Actual Internship Start
    internshipEndDate:   '', // Actual Internship End
    description:         '',
};

function countWords(text) {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
}

function trimToWordLimit(text, maxWords) {
    const words = (text || '').trim().split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ');
}

function CreateJob() {
    const { kind, id } = useParams();
    const routeType = kind === 'job' || kind === 'internship' ? kind : null;
    const isEditMode = Boolean(routeType && id);
    useTitle(isEditMode ? `Edit ${routeType === 'job' ? 'Job' : 'Internship'}` : 'Create Job & Internship');
    const navigate  = useNavigate();
    const [type, setType]       = useState(routeType); // 'job' | 'internship'
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingInitial, setLoadingInitial] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [formData, setFormData] = useState({});
    
    // Character Counters
    const descriptionWords = countWords(formData.description);
    const companyCount = (formData.company || '').length;
    const positionCount = (formData.position || '').length;
    const locationCount = (formData.location || '').length;
    const salaryCount = (formData.salary || '').length;
    const allowanceCount = (formData.allowance || '').length;
    const contactNameCount = (formData.contactName || '').length;
    const contactPositionCount = (formData.contactPosition || '').length;
    const emailCount = (formData.email || '').length;

    const handleSelectType = (t) => {
        setType(t);
        setFormData(t === 'job' ? { ...JOB_FIELDS } : { ...INTERNSHIP_FIELDS });
    };

    useEffect(() => {
        if (!isEditMode || !routeType || !id) return;
        setType(routeType);
        setLoadingInitial(true);
        setLoadError('');

        const endpoint = routeType === 'job' ? `/api/jobs/${id}/` : `/api/internships/${id}/`;
        api.get(endpoint)
            .then((res) => {
                const item = res.data || {};
                if (routeType === 'job') {
                    setFormData({
                        company: item.company || '',
                        position: item.position || '',
                        location: item.location || '',
                        modality: item.modality || '',
                        employmentType: item.employment_type || '',
                        salary: item.salary || '',
                        contactName: item.contact_name || '',
                        contactPosition: item.contact_position || '',
                        email: item.email || '',
                        startDate: item.start_date ? item.start_date.slice(0, 10) : '',
                        endDate: item.end_date ? item.end_date.slice(0, 10) : '',
                        description: item.description || '',
                    });
                } else {
                    setFormData({
                        company: item.company || '',
                        position: item.position || '',
                        location: item.location || '',
                        modality: item.modality || '',
                        allowance: item.allowance || '',
                        contactName: item.contact_name || '',
                        contactPosition: item.contact_position || '',
                        email: item.email || '',
                        startDate: item.start_date ? item.start_date.slice(0, 10) : '',
                        endDate: item.end_date ? item.end_date.slice(0, 10) : '',
                        internshipStartDate: item.internship_start_date ? item.internship_start_date.slice(0, 10) : '',
                        internshipEndDate: item.internship_end_date ? item.internship_end_date.slice(0, 10) : '',
                        description: item.description || '',
                    });
                }
            })
            .catch(() => setLoadError(`Failed to load ${routeType}.`))
            .finally(() => setLoadingInitial(false));
    }, [isEditMode, routeType, id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'description') {
            const next = trimToWordLimit(value, MAX_DESCRIPTION_WORDS);
            setFormData((prev) => ({ ...prev, description: next }));
            return;
        }
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');
        
        if (!formData.company || !formData.position || !formData.location || !formData.contactName || !formData.contactPosition || !formData.email || !formData.description || !formData.startDate || !formData.endDate) {
            setSubmitError('Please fill in all required fields.');
            return;
        }

        if (type === 'internship' && (!formData.internshipStartDate || !formData.internshipEndDate)) {
            setSubmitError('Please fill in the internship duration dates.');
            return;
        }
        
        setLoading(true);
        try {
            const payload =
                type === 'job'
                    ? {
                          company: formData.company,
                          position: formData.position,
                          location: formData.location,
                          modality: formData.modality,
                          employment_type: formData.employmentType,
                          salary: formData.salary || '',
                          contact_name: formData.contactName,
                          contact_position: formData.contactPosition,
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
                          contact_name: formData.contactName,
                          contact_position: formData.contactPosition,
                          email: formData.email,
                          start_date: formData.startDate,
                          end_date: formData.endDate,
                          internship_start_date: formData.internshipStartDate,
                          internship_end_date: formData.internshipEndDate,
                          description: formData.description,
                      };
                      
            if (isEditMode && id) {
                const endpoint = type === 'job' ? `/api/jobs/${id}/` : `/api/internships/${id}/`;
                await api.patch(endpoint, payload);
            } else {
                const endpoint = type === 'job' ? '/api/jobs/' : '/api/internships/';
                await api.post(endpoint, payload);
            }
            setSuccess(true);
            setTimeout(() => navigate('/dashboard/jobs'), 2200);
        } catch (err) {
            const data = err.response?.data;
            if (typeof data === 'string') setSubmitError(data);
            else if (data?.detail) setSubmitError(data.detail);
            else setSubmitError(`Failed to ${isEditMode ? 'save changes' : 'submit'}: Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    if (!type && !isEditMode) {
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
                            <p>
                                ✓ {isEditMode
                                    ? `Your ${type === 'job' ? 'job posting' : 'internship'} has been updated successfully.`
                                    : `Your ${type === 'job' ? 'job posting' : 'internship'} has been submitted and is pending approval.`}
                            </p>
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
                    {isEditMode ? `Edit ${type === 'job' ? 'Job' : 'Internship'}` : `Post ${type === 'job' ? 'a Job' : 'an Internship'}`}
                </h1>
                <div className="create-event-form-box">
                    {!isEditMode && (
                        <button type="button" className="cj-back-type" onClick={() => setType(null)}>
                            ← Change type
                        </button>
                    )}
                    {loadingInitial && <div className="jm-state">Loading details...</div>}
                    {loadError && <div className="jm-state jm-error">{loadError}</div>}
                    {!loadingInitial && !loadError && (

                    <form className="create-event-form" onSubmit={handleSubmit}>
                        {submitError && <div className="jm-state jm-error" style={{ padding: '8px 0 4px', textAlign: 'left' }}>{submitError}</div>}

                        {/* Company & Position */}
                        <div className="ce-row">
                            <div className="ce-field-group ce-field-half">
                                <div className="ce-label-row">
                                    <label className="ce-label-large">Company Name <span className="ce-required">*</span></label>
                                    <span className="ce-char-count">{companyCount}/{MAX_TEXT_60}</span>
                                </div>
                                <input type="text" name="company" value={formData.company}
                                    onChange={handleChange} className="ce-input"
                                    maxLength={MAX_TEXT_60}
                                    placeholder="e.g. Ateneo de Davao University" required />
                            </div>
                            <div className="ce-field-group ce-field-half">
                                <div className="ce-label-row">
                                    <label className="ce-label-large">Position Title <span className="ce-required">*</span></label>
                                    <span className="ce-char-count">{positionCount}/{MAX_TEXT_60}</span>
                                </div>
                                <input type="text" name="position" value={formData.position}
                                    onChange={handleChange} className="ce-input"
                                    maxLength={MAX_TEXT_60}
                                    placeholder={type === 'job' ? 'e.g. Senior Software Engineer' : 'e.g. UI/UX Intern'} required />
                            </div>
                        </div>

                        {/* Location & Modality */}
                        <div className="ce-row">
                            <div className="ce-field-group ce-field-half">
                                <div className="ce-label-row">
                                    <label className="ce-label-large">Location <span className="ce-required">*</span></label>
                                    <span className="ce-char-count">{locationCount}/{MAX_TEXT_60}</span>
                                </div>
                                <input type="text" name="location" value={formData.location}
                                    onChange={handleChange} className="ce-input"
                                    maxLength={MAX_TEXT_60}
                                    placeholder="e.g. Davao City" required />
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
                                    <div className="ce-label-row">
                                        <label className="ce-label-large">Salary Range (optional)</label>
                                        <span className="ce-char-count">{salaryCount}/{MAX_TEXT_60}</span>
                                    </div>
                                    <input type="text" name="salary" value={formData.salary}
                                        onChange={handleChange} className="ce-input"
                                        maxLength={MAX_TEXT_60}
                                        placeholder="e.g. ₱50,000 - ₱80,000" />
                                </div>
                            </div>
                        )}

                        {/* Allowance (internship only) */}
                        {type === 'internship' && (
                            <div className="ce-field-group">
                                <div className="ce-label-row">
                                    <label className="ce-label-large">Allowance (optional)</label>
                                    <span className="ce-char-count">{allowanceCount}/{MAX_TEXT_60}</span>
                                </div>
                                <input type="text" name="allowance" value={formData.allowance}
                                    onChange={handleChange} className="ce-input"
                                    maxLength={MAX_TEXT_60}
                                    placeholder="e.g. ₱5,000/month or Unpaid" />
                            </div>
                        )}

                        {/* Posting Dates (Visible for both) */}
                        <div className="ce-row">
                            <div className="ce-field-group ce-field-half">
                                <label className="ce-label-small">
                                    {type === 'job' ? 'Start Date' : 'Posting Start Date'} <span className="ce-required">*</span>
                                </label>
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
                                <label className="ce-label-small">
                                    {type === 'job' ? 'End Date' : 'Posting End Date'} <span className="ce-required">*</span>
                                </label>
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

                        {/* Internship Duration Dates (Only for Internship) */}
                        {type === 'internship' && (
                            <div className="ce-row">
                                <div className="ce-field-group ce-field-half">
                                    <label className="ce-label-small">
                                        Internship Start Date <span className="ce-required">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="internshipStartDate"
                                        value={formData.internshipStartDate}
                                        onChange={handleChange}
                                        className="ce-input"
                                        placeholder="mm/dd/yyyy"
                                        required
                                    />
                                </div>
                                <div className="ce-field-group ce-field-half">
                                    <label className="ce-label-small">
                                        Internship End Date <span className="ce-required">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="internshipEndDate"
                                        value={formData.internshipEndDate}
                                        onChange={handleChange}
                                        className="ce-input"
                                        placeholder="mm/dd/yyyy"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {/* Contact Name & Position */}
                        <div className="ce-row">
                            <div className="ce-field-group ce-field-half">
                                <div className="ce-label-row">
                                    <label className="ce-label-large">Contact Name <span className="ce-required">*</span></label>
                                    <span className="ce-char-count">{contactNameCount}/{MAX_TEXT_60}</span>
                                </div>
                                <input type="text" name="contactName" value={formData.contactName}
                                    onChange={handleChange} className="ce-input"
                                    maxLength={MAX_TEXT_60}
                                    placeholder="e.g. Juan Dela Cruz" required />
                            </div>
                            <div className="ce-field-group ce-field-half">
                                <div className="ce-label-row">
                                    <label className="ce-label-large">Company Position <span className="ce-required">*</span></label>
                                    <span className="ce-char-count">{contactPositionCount}/{MAX_TEXT_60}</span>
                                </div>
                                <input type="text" name="contactPosition" value={formData.contactPosition}
                                    onChange={handleChange} className="ce-input"
                                    maxLength={MAX_TEXT_60}
                                    placeholder="e.g. HR Manager" required />
                            </div>
                        </div>

                        {/* Contact Email */}
                        <div className="ce-field-group">
                            <div className="ce-label-row">
                                <label className="ce-label-large">Contact Email <span className="ce-required">*</span></label>
                                <span className="ce-char-count">{emailCount}/{MAX_TEXT_60}</span>
                            </div>
                            <input type="email" name="email" value={formData.email}
                                onChange={handleChange} className="ce-input"
                                maxLength={MAX_TEXT_60}
                                placeholder="careers@company.com" required />
                        </div>

                        {/* Description */}
                        <div className="ce-field-group">
                            <div className="ce-label-row">
                                <label className="ce-label-large">
                                    {type === 'job' ? 'Job Description' : 'Internship Description'} <span className="ce-required">*</span>
                                </label>
                                <span className="ce-char-count">{descriptionWords} / {MAX_DESCRIPTION_WORDS} words</span>
                            </div>
                            <textarea name="description" value={formData.description}
                                onChange={handleChange}
                                className="ce-textarea ce-textarea-large"
                                placeholder="Describe the role, responsibilities, and requirements..."
                                required />
                        </div>

                        <div className="ce-actions">
                            <button type="button" className="ce-cancel-btn" onClick={() => navigate('/dashboard/jobs')}>
                                Cancel
                            </button>
                            <button type="submit" className="ce-submit-btn" disabled={loading}>
                                <span>{loading ? (isEditMode ? 'Saving...' : 'Submitting...') : (isEditMode ? 'Save Changes' : 'Submit for Approval')}</span>
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

export default CreateJob;