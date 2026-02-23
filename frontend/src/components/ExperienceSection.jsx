import { useState } from 'react';
import { FiPlus, FiEdit3 } from 'react-icons/fi';
import EditModal from './EditModal';
import ConfirmModal from './ConfirmModal';
import CompanyAutocomplete from './CompanyAutocomplete';
import { extractDomain, getCompanyLogoUrl, getFaviconUrl } from '../utils/autocomplete';
import '../styles/ProfileSection.css';
import '../styles/ExperienceModal.css';

const SITE_TYPES = [
    { value: '', label: 'Select' },
    { value: 'on_site', label: 'On-site' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' },
];

const EMPLOYMENT_TYPES = [
    { value: '', label: 'Please select' },
    { value: 'full_time', label: 'Full-time' },
    { value: 'part_time', label: 'Part-time' },
    { value: 'self_employed', label: 'Self-employed' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
    { value: 'apprenticeship', label: 'Apprenticeship' },
    { value: 'seasonal', label: 'Seasonal' },
    { value: 'volunteer', label: 'Volunteer' },
];

const DESC_MAX = 500;

const emptyExperience = () => ({
    job_title: '',
    company_name: '',
    company_logo_url: '',
    website: '',
    location: '',
    employment_type: '',
    site_type: '',
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

/** Guess domain from company name when website is not saved (e.g. typed manually) */
function guessDomainFromCompanyName(name) {
    if (!name || !name.trim()) return null;
    const n = name.trim().toLowerCase();
    const known = [
        ['microsoft', 'microsoft.com'],
        ['apple', 'apple.com'],
        ['meta', 'meta.com'],
        ['facebook', 'facebook.com'],
        ['netflix', 'netflix.com'],
        ['tesla', 'tesla.com'],
    ];
    for (const [key, domain] of known) {
        if (n.includes(key)) return domain;
    }
    const clean = n.replace(/[^a-z0-9]/g, '');
    return clean ? `${clean}.com` : null;
}

function ExperienceSection({ experiences, onAdd, onUpdate, onDelete, api }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyExperience());
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const openAdd = () => {
        setEditing(null);
        setForm(emptyExperience());
        setError('');
        setModalOpen(true);
    };

    const openEdit = (exp) => {
        setEditing(exp);
        let website = exp.website || '';
        setForm({
            job_title: exp.job_title || '',
            company_name: exp.company_name || '',
            company_logo_url: '',
            website: website.replace(/^https?:\/\//, '').replace(/^www\./, '') || '',
            location: exp.location || '',
            employment_type: exp.employment_type || '',
            site_type: exp.site_type || '',
            start_date: exp.start_date ? exp.start_date.slice(0, 10) : '',
            end_date: exp.end_date ? exp.end_date.slice(0, 10) : '',
            description: exp.description || '',
            is_current: exp.is_current || false,
        });
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
            setForm((prev) => ({
                ...prev,
                is_current: checked,
                end_date: checked ? '' : prev.end_date,
            }));
        } else {
            setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        }
    };

    const handleCompanySelect = ({ company_name, domain, logo }) => {
        setForm((prev) => ({
            ...prev,
            company_name: company_name || prev.company_name,
            company_logo_url: logo || '',
            website: domain || prev.website,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const raw = form.website.replace(/^https?:\/\//, '').replace(/^www\./, '').trim();
            const websiteVal = raw ? `https://${raw}` : '';
            const payload = {
                job_title: form.job_title,
                company_name: form.company_name,
                website: websiteVal,
                location: form.location?.trim() ?? '',
                employment_type: form.employment_type?.trim() ?? '',
                site_type: form.site_type?.trim() ?? '',
                start_date: form.start_date || null,
                end_date: form.is_current ? null : (form.end_date || null),
                description: form.description,
                is_current: form.is_current,
            };

            if (editing) {
                await api.patch(`/api/profile/experiences/${editing.id}/`, payload);
                onUpdate();
            } else {
                await api.post('/api/profile/experiences/', payload);
                onAdd();
            }
            closeModal();
        } catch (err) {
            let errText = 'Failed to save experience.';
            if (err.response?.status === 401) {
                errText = 'Given token not valid for any token type. Please log in again.';
            } else if (err.response?.data) {
                const d = err.response.data;
                if (typeof d.detail === 'string') errText = d.detail;
                else if (typeof d.detail === 'object') errText = JSON.stringify(d.detail);
                else if (typeof d === 'object') errText = Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' ');
            }
            setError(errText);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (id) => {
        setConfirmDeleteOpen(true);
        setConfirmDeleteId(id);
    };

    const handleDeleteConfirm = async () => {
        const id = confirmDeleteId;
        if (!id) return;
        try {
            await api.delete(`/api/profile/experiences/${id}/`);
            onDelete();
            closeModal();
        } catch {
            alert('Failed to delete.');
        } finally {
            setConfirmDeleteId(null);
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
                    {experiences.length === 0 ? (
                        <p className="section-empty">No experience added yet.</p>
                    ) : (
                        experiences.map((exp, idx) => {
                            const range = formatExpDateRange(exp.start_date, exp.end_date, exp.is_current);
                            const duration = formatDuration(exp.start_date, exp.end_date, exp.is_current);
                            const empLabel = EMPLOYMENT_TYPES.find((t) => t.value === exp.employment_type)?.label || '';
                            const siteLabel = SITE_TYPES.find((t) => t.value === exp.site_type)?.label || '';
                            const nameLower = exp.company_name?.toLowerCase() || '';
                            let src = null;
                            if (nameLower.includes('google')) {
                                src = 'https://www.gstatic.com/images/branding/product/2x/googleg_96dp.png';
                            } else if (nameLower.includes('amazon')) {
                                src = 'https://logo.clearbit.com/amazon.com';
                            } else {
                                const domain = extractDomain(exp.website) || guessDomainFromCompanyName(exp.company_name);
                                src = domain ? getCompanyLogoUrl(domain) : null;
                            }
                            const initials = getCompanyInitials(exp.company_name);

                            return (
                                <div key={exp.id} className={`profile-exp-item ${idx > 0 ? 'profile-exp-item-divider' : ''}`}>
                                    <div className="profile-exp-logo" style={{ backgroundColor: '#ffffff', border: 'none' }}>
                                        {src ? (
                                            <>
                                                <img
                                                    src={src}
                                                    alt={exp.company_name}
                                                    className="profile-exp-logo-img"
                                                    onError={(e) => {
                                                        const img = e.currentTarget;
                                                        const domain = extractDomain(exp.website) || guessDomainFromCompanyName(exp.company_name);
                                                        if (domain && !img.dataset.triedFavicon) {
                                                            img.dataset.triedFavicon = '1';
                                                            img.src = getFaviconUrl(domain);
                                                        } else {
                                                            img.style.display = 'none';
                                                            if (img.nextSibling) img.nextSibling.style.display = 'flex';
                                                        }
                                                    }}
                                                />
                                                <span className="profile-exp-logo-initials profile-exp-logo-fallback" style={{ display: 'none' }}>
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
                                            <p className="profile-exp-company">
                                                {exp.company_name}{empLabel ? ` · ${empLabel}` : ''}
                                            </p>
                                            <p className="profile-exp-meta">
                                                {range}
                                                {duration ? ` · ${duration}` : ''}
                                            </p>
                                            {(exp.location || siteLabel) && (
                                                <p className="profile-exp-meta">
                                                    {[exp.location, siteLabel].filter(Boolean).join(' · ')}
                                                </p>
                                            )}
                                            {exp.description && <p className="profile-exp-desc">{exp.description}</p>}
                                        </div>
                                        <button type="button" className="profile-exp-edit-icon" onClick={() => openEdit(exp)}>
                                            <FiEdit3 size={20} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <EditModal
                isOpen={modalOpen}
                onClose={closeModal}
                title={editing ? 'Edit experience' : 'Add experience'}
                subtitle="Share where you've worked on your profile."
            >
                <form onSubmit={handleSubmit} className="exp-form">
                    {error && (
                        <div className="exp-form-error" style={{ color: '#d32f2f', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px', marginBottom: '15px' }}>
                            {error}
                        </div>
                    )}

                    <div className="exp-form-row">
                        <label className="exp-form-label">Title *</label>
                        <input
                            type="text"
                            name="job_title"
                            value={form.job_title}
                            onChange={handleChange}
                            className="exp-form-input"
                            required
                            placeholder="e.g. Product Designer"
                        />
                    </div>

                    <div className="exp-form-row">
                        <label className="exp-form-label">Company or organization *</label>
                        <CompanyAutocomplete
                            value={form.company_name}
                            selectedDomain={form.website}
                            selectedLogoUrl={form.company_logo_url}
                            onChange={(e) => setForm((p) => ({ ...p, company_name: e.target.value }))}
                            onSelect={handleCompanySelect}
                            onClear={() => setForm((p) => ({ ...p, company_name: '', company_logo_url: '', website: '' }))}
                            placeholder="e.g. Webflow"
                            required
                        />
                    </div>

                    <div className="exp-form-row">
                        <label className="exp-form-label">Location</label>
                        <input
                            type="text"
                            name="location"
                            value={form.location}
                            onChange={handleChange}
                            className="exp-form-input"
                            placeholder="e.g. San Francisco"
                        />
                    </div>

                    <div className="exp-form-row">
                        <label className="exp-form-label">Employment</label>
                        <select
                            name="employment_type"
                            value={form.employment_type}
                            onChange={handleChange}
                            className="exp-form-input exp-form-select"
                        >
                            {EMPLOYMENT_TYPES.map((t) => (
                                <option key={t.value || 'empty'} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="exp-form-row">
                        <label className="exp-form-label">Site type</label>
                        <select
                            name="site_type"
                            value={form.site_type}
                            onChange={handleChange}
                            className="exp-form-input exp-form-select"
                        >
                            {SITE_TYPES.map((t) => (
                                <option key={t.value || 'st-empty'} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="exp-form-row">
                        <label className="exp-form-label">Description</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            className="exp-form-input exp-form-textarea"
                            rows={4}
                            placeholder="Describe your responsibilities and achievements..."
                        />
                        <span className={`exp-form-char-count ${form.description.length > DESC_MAX ? 'over' : ''}`}>
                            {DESC_MAX - form.description.length} characters left
                        </span>
                    </div>

                    <div className="exp-form-row exp-form-row-inline">
                        <div className="exp-form-row" style={{ flex: 1 }}>
                            <label className="exp-form-label">Start date</label>
                            <input
                                type="date"
                                name="start_date"
                                value={form.start_date}
                                onChange={handleChange}
                                className="exp-form-input"
                            />
                        </div>
                        {!form.is_current && (
                            <div className="exp-form-row" style={{ flex: 1 }}>
                                <label className="exp-form-label">End date</label>
                                <input
                                    type="date"
                                    name="end_date"
                                    value={form.end_date}
                                    onChange={handleChange}
                                    className="exp-form-input"
                                />
                            </div>
                        )}
                    </div>

                    <div className="exp-form-row">
                        <label className="exp-form-check">
                            <input
                                type="checkbox"
                                name="is_current"
                                checked={form.is_current}
                                onChange={handleChange}
                            />
                            I currently work here
                        </label>
                    </div>

                    <div className={`exp-form-actions ${editing ? 'exp-form-actions-space' : ''}`}>
                        {editing && (
                            <button type="button" className="exp-form-delete" onClick={() => handleDeleteClick(editing.id)}>
                                Delete experience
                            </button>
                        )}
                        <div className="exp-form-actions-right">
                            <button type="button" className="exp-form-draft" onClick={closeModal}>
                                Cancel
                            </button>
                            <button type="submit" className="exp-form-submit" disabled={saving}>
                                {saving ? 'Saving…' : editing ? 'Save' : 'Add experience'}
                            </button>
                        </div>
                    </div>
                </form>
            </EditModal>

            <ConfirmModal
                isOpen={confirmDeleteOpen}
                onClose={() => {
                    setConfirmDeleteOpen(false);
                    setConfirmDeleteId(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Delete experience"
                message="Are you sure you want to delete this experience? This cannot be undone."
                confirmLabel="Delete"
            />
        </section>
    );
}

export default ExperienceSection;
