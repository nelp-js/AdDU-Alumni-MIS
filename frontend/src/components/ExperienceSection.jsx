import { useState, useEffect } from 'react';
import { FiPlus, FiEdit3 } from 'react-icons/fi';
import EditModal from './EditModal'; 
import { extractDomain, getCompanyLogoUrl } from '../utils/autocomplete';
import '../styles/ProfileSection.css'; 
import '../styles/ExperienceModal.css';

const EMPLOYMENT_TYPES = [
    { value: 'full_time', label: 'Full-time' },
    { value: 'part_time', label: 'Part-time' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
    { value: 'volunteer', label: 'Volunteer' },
];

const DESC_MAX = 500;

const emptyExperience = () => ({
    job_title: '',
    company_name: '',
    website: '',
    location: '',
    employment_type: 'full_time',
    start_date: '',
    end_date: '',
    description: '',
    is_current: false,
});

const MONTH_ABBR = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatExpDateRange(start, end, isCurrent) {
    if (!start && !end && !isCurrent) return '';
    const sd = start ? new Date(start) : null;
    const ed = isCurrent ? new Date() : (end ? new Date(end) : null);
    const s = sd ? `${MONTH_ABBR[sd.getMonth() + 1]} ${sd.getFullYear()}` : '';
    const e = isCurrent ? 'Present' : (ed ? `${MONTH_ABBR[ed.getMonth() + 1]} ${ed.getFullYear()}` : '');
    return [s, e].filter(Boolean).join(' - ');
}

function formatDuration(start, end, isCurrent) {
    if (!start) return '';
    const startDate = new Date(start);
    const endDate = isCurrent ? new Date() : (end ? new Date(end) : new Date());
    let months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
    if (endDate.getDate() >= startDate.getDate()) months++;
    if (months < 1) months = 0;
    const yrs = Math.floor(months / 12);
    const mos = months % 12;
    const parts = [];
    if (yrs > 0) parts.push(`${yrs} yr${yrs !== 1 ? 's' : ''}`);
    if (mos > 0) parts.push(`${mos} mos`);
    return parts.join(' ');
}

function getCompanyInitials(name) {
    if (!name || !name.trim()) return '?';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase().slice(0, 2);
    return name.slice(0, 2).toUpperCase();
}

function ExperienceSection({ experiences, onAdd, onUpdate, onDelete, api, openAddTrigger, onOpenAddConsumed }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyExperience());
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showWebsite, setShowWebsite] = useState(false);

    const openAdd = () => {
        setEditing(null);
        setForm(emptyExperience());
        setShowWebsite(false);
        setError('');
        setModalOpen(true);
    };

    const openEdit = (exp) => {
        setEditing(exp);
        let website = exp.website || '';
        setForm({
            job_title: exp.job_title || '',
            company_name: exp.company_name || '',
            website: website.replace(/^https?:\/\//, '') || '',
            location: exp.location || '',
            employment_type: exp.employment_type || 'full_time',
            start_date: exp.start_date ? exp.start_date.slice(0, 10) : '',
            end_date: exp.end_date ? exp.end_date.slice(0, 10) : '',
            description: exp.description || '',
            is_current: exp.is_current || false,
        });
        setShowWebsite(!!website);
        setError('');
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
        setForm(emptyExperience());
        setError('');
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'description') {
            setForm((prev) => ({ ...prev, [name]: value.slice(0, DESC_MAX) }));
        } else if (name === 'is_current') {
            setForm((prev) => ({ ...prev, is_current: checked, end_date: checked ? '' : prev.end_date }));
        } else {
            setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const websiteVal = (showWebsite && form.website.trim()) 
                ? `https://${form.website.replace(/^https?:\/\//, '').trim()}` 
                : '';
            const payload = { ...form, website: websiteVal };

            if (editing) {
                await api.patch(`/api/profile/experiences/${editing.id}/`, payload);
                onUpdate();
            } else {
                await api.post('/api/profile/experiences/', payload);
                onAdd();
            }
            closeModal();
        } catch (err) {
            setError(err.response?.status === 401 
                ? 'Given token not valid for any token type. Please log in again.' 
                : 'Failed to save experience.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="profile-section">
            <div className="profile-card">
                <div className="card-header">
                    <h2 className="card-title">Experience</h2>
                    <div className="card-header-actions">
                        <button type="button" className="icon-btn" onClick={openAdd} title="Add Experience">
                            <FiPlus size={24} />
                        </button>
                    </div>
                </div>

                <div className="card-body">
                    {experiences.map((exp, idx) => {
                        const range = formatExpDateRange(exp.start_date, exp.end_date, exp.is_current);
                        const duration = formatDuration(exp.start_date, exp.end_date, exp.is_current);
                        const empLabel = EMPLOYMENT_TYPES.find((t) => t.value === exp.employment_type)?.label || '';
                        
                        // 👇 NORMALIZED MATCHING LOGIC
                        const nameLower = exp.company_name?.toLowerCase() || '';
                        let src = null;
                        
                        if (nameLower.includes("google")) {
                            src = "https://www.gstatic.com/images/branding/product/2x/googleg_96dp.png";
                        } else if (nameLower.includes("amazon")) {
                            src = "https://logo.clearbit.com/amazon.com";
                        } else {
                            const domain = extractDomain(exp.website);
                            src = domain ? getCompanyLogoUrl(domain) : null;
                        }

                        const initials = getCompanyInitials(exp.company_name);

                        return (
                            <div key={exp.id} className={`profile-exp-item ${idx > 0 ? 'profile-exp-item-divider' : ''}`}>
                                {/* Seamless background with no border */}
                                <div className="profile-exp-logo" style={{ backgroundColor: '#ffffff', border: 'none' }}>
                                    {src ? (
                                        <>
                                            <img
                                                src={src}
                                                alt={exp.company_name}
                                                className="profile-exp-logo-img"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                            <span className="profile-exp-logo-initials profile-exp-logo-fallback" style={{display: 'none'}}>
                                                {initials}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="profile-exp-logo-initials">{initials}</span>
                                    )}
                                </div>

                                <div className="profile-exp-body">
                                    <div className="profile-exp-content">
                                        <h3 className="profile-exp-title">{exp.job_title || '—'}</h3>
                                        <p className="profile-exp-company">{exp.company_name} · {empLabel}</p>
                                        <p className="profile-exp-meta">{range}{duration ? ` · ${duration}` : ''}</p>
                                    </div>
                                    <button type="button" className="profile-exp-edit-icon" onClick={() => openEdit(exp)}>
                                        <FiEdit3 size={20} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <EditModal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit experience' : 'Add experience'}>
                <form onSubmit={handleSubmit} className="exp-form">
                    {error && <div className="exp-form-error" style={{color: '#d32f2f', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px', marginBottom: '15px'}}>{error}</div>}
                    <div className="exp-form-row">
                        <label className="exp-form-label">Title *</label>
                        <input type="text" name="job_title" value={form.job_title} onChange={handleChange} className="exp-form-input" required />
                    </div>
                    <div className="exp-form-row">
                        <label className="exp-form-label">Company *</label>
                        <input type="text" name="company_name" value={form.company_name} onChange={handleChange} className="exp-form-input" required />
                    </div>
                    <div className="exp-form-row">
                        <label className="exp-form-check">
                            <input type="checkbox" checked={showWebsite} onChange={(e) => setShowWebsite(e.target.checked)} />
                            Add company website
                        </label>
                    </div>
                    {showWebsite && (
                        <div className="exp-form-row">
                            <label className="exp-form-label">Website</label>
                            <input type="text" name="website" value={form.website} onChange={handleChange} className="exp-form-input" placeholder="e.g. amazon.com" />
                        </div>
                    )}
                    <div className="exp-form-actions">
                        <button type="submit" className="exp-form-submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                    </div>
                </form>
            </EditModal>
        </section>
    );
}

export default ExperienceSection;