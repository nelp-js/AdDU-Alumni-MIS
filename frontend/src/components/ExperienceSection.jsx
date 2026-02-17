import { useState, useEffect } from 'react';
import EditModal from './EditModal';
import CompanyAutocomplete from './CompanyAutocomplete';
import { extractDomain, getCompanyLogoUrl, getFaviconUrl } from '../utils/autocomplete';
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
    const months = Math.max(0, (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()));
    if (months < 12) return `${months} mos`;
    const yrs = Math.floor(months / 12);
    const mos = months % 12;
    return mos ? `${yrs} yr${yrs !== 1 ? 's' : ''} ${mos} mos` : `${yrs} yr${yrs !== 1 ? 's' : ''}`;
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

    const openAdd = () => {
        setEditing(null);
        setForm(emptyExperience());
        setError('');
        setModalOpen(true);
    };

    useEffect(() => {
        if (openAddTrigger) {
            setEditing(null);
            setForm(emptyExperience());
            setError('');
            setModalOpen(true);
            onOpenAddConsumed?.();
        }
    }, [openAddTrigger, onOpenAddConsumed]);

    const openEdit = (exp) => {
        setEditing(exp);
        let website = exp.website || '';
        if (website && !website.startsWith('http')) website = `https://${website}`;
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const websiteVal = form.website.trim()
                ? `https://${form.website.replace(/^https?:\/\//, '').trim()}`
                : '';
            const payload = {
                job_title: form.job_title,
                company_name: form.company_name,
                website: websiteVal,
                location: form.location,
                employment_type: form.employment_type,
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
            const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to save.';
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this experience?')) return;
        try {
            await api.delete(`/api/profile/experiences/${id}/`);
            onDelete();
        } catch {
            alert('Failed to delete.');
        }
    };

    return (
        <section className="profile-section">
            <div className="profile-section-header">
                <h2 className="profile-section-title">Experience</h2>
                <button type="button" className="profile-section-add-outline" onClick={openAdd}>
                    Add experience
                </button>
            </div>
            <div className={`profile-section-cards ${experiences.length > 0 ? 'profile-experience-card' : ''}`}>
                {experiences.length === 0 ? (
                    <p className="profile-section-empty">No experience added yet.</p>
                ) : (
                    experiences.map((exp, idx) => {
                        const range = formatExpDateRange(exp.start_date, exp.end_date, exp.is_current);
                        const duration = formatDuration(exp.start_date, exp.end_date, exp.is_current);
                        const empLabel = EMPLOYMENT_TYPES.find((t) => t.value === exp.employment_type)?.label || '';
                        const companyLine = [exp.company_name, empLabel].filter(Boolean).join(' · ');
                        const dateLine = range ? (duration ? `${range} · ${duration}` : range) : '';
                        return (
                            <div key={exp.id} className={`profile-exp-item ${idx > 0 ? 'profile-exp-item-divider' : ''}`}>
                                <div className="profile-exp-logo">
                                    {(() => {
                                        const domain = extractDomain(exp.website);
                                        if (domain) {
                                            const logoUrl = getCompanyLogoUrl(domain);
                                            return (
                                                <>
                                                    <img
                                                        src={logoUrl}
                                                        alt=""
                                                        className="profile-exp-logo-img"
                                                        onError={(e) => {
                                                            const el = e.target;
                                                            el.onerror = null;
                                                            el.src = getFaviconUrl(domain);
                                                            el.onerror = () => { el.style.display = 'none'; };
                                                        }}
                                                    />
                                                    <span className="profile-exp-logo-initials profile-exp-logo-fallback">
                                                        {getCompanyInitials(exp.company_name)}
                                                    </span>
                                                </>
                                            );
                                        }
                                        return <span className="profile-exp-logo-initials">{getCompanyInitials(exp.company_name)}</span>;
                                    })()}
                                </div>
                                <div className="profile-exp-body">
                                    <div className="profile-exp-content">
                                        <h3 className="profile-exp-title">{exp.job_title || '—'}</h3>
                                        {companyLine && (
                                            <p className="profile-exp-company">{companyLine}</p>
                                        )}
                                        {dateLine && (
                                            <p className="profile-exp-meta">{dateLine}</p>
                                        )}
                                        {exp.description && (
                                            <p className="profile-exp-desc">{exp.description}</p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        className="profile-exp-edit-icon"
                                        onClick={() => openEdit(exp)}
                                        title="Edit"
                                        aria-label="Edit"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className={modalOpen ? 'exp-modal' : ''}>
                <EditModal
                    isOpen={modalOpen}
                    onClose={closeModal}
                    title={editing ? 'Edit experience' : 'Add experience'}
                    subtitle="Share where you've worked on your profile."
                >
                    <form onSubmit={handleSubmit} className="exp-form">
                        {error && <div className="exp-form-error">{error}</div>}
                        <div className="exp-form-row">
                            <label className="exp-form-label">Title *</label>
                            <input
                                type="text"
                                name="job_title"
                                value={form.job_title}
                                onChange={handleChange}
                                className="exp-form-input"
                                placeholder="e.g. Product Designer"
                                required
                            />
                        </div>
                        <div className="exp-form-row">
                            <label className="exp-form-label">Company *</label>
                            <CompanyAutocomplete
                                value={form.company_name}
                                onChange={handleChange}
                                onSelect={({ company_name: name, domain }) => {
                                    setForm((prev) => ({
                                        ...prev,
                                        company_name: name,
                                        website: domain ? domain.replace(/^https?:\/\//, '').replace(/^www\./, '') : prev.website,
                                    }));
                                }}
                                placeholder="e.g. Google"
                                required
                            />
                        </div>
                        <div className="exp-form-row">
                            <label className="exp-form-label">Website</label>
                            <div className="exp-form-url-wrap">
                                <span className="exp-form-url-prefix">https://</span>
                                <input
                                    type="text"
                                    name="website"
                                    value={form.website}
                                    onChange={handleChange}
                                    className="exp-form-input exp-form-url-input"
                                    placeholder="www.example.com"
                                />
                            </div>
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
                            <label className="exp-form-label">Employment *</label>
                            <select
                                name="employment_type"
                                value={form.employment_type}
                                onChange={handleChange}
                                className="exp-form-input exp-form-select"
                            >
                                {EMPLOYMENT_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
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
                            <div className="exp-form-row">
                                <label className="exp-form-label">Start date</label>
                                <input
                                    type="date"
                                    name="start_date"
                                    value={form.start_date}
                                    onChange={handleChange}
                                    className="exp-form-input"
                                />
                            </div>
                            <div className="exp-form-row">
                                <label className="exp-form-label">End date</label>
                                <input
                                    type="date"
                                    name="end_date"
                                    value={form.end_date}
                                    onChange={handleChange}
                                    className="exp-form-input"
                                    disabled={form.is_current}
                                    title={form.is_current ? 'Clear "I currently work here" to add end date' : ''}
                                />
                            </div>
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
                        <div className={`exp-form-actions ${editing ? 'exp-form-actions-edu' : ''}`}>
                            {editing && (
                                <button type="button" className="exp-form-delete" onClick={async () => {
                                    if (!window.confirm('Delete this experience?')) return;
                                    closeModal();
                                    try {
                                        await api.delete(`/api/profile/experiences/${editing.id}/`);
                                        onDelete();
                                    } catch { alert('Failed to delete.'); }
                                }}>
                                    Delete experience
                                </button>
                            )}
                            <div className="exp-form-actions-right">
                                <button type="button" className="exp-form-draft" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="exp-form-submit" disabled={saving}>
                                    {saving ? 'Saving…' : (editing ? 'Save' : 'Add experience')}
                                </button>
                            </div>
                        </div>
                    </form>
                </EditModal>
            </div>
        </section>
    );
}

export default ExperienceSection;
