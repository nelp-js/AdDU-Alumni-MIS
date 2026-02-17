import { useState } from 'react';
import EditModal from './EditModal';
import '../styles/ProfileSection.css';

const EMPLOYMENT_TYPES = [
    { value: 'full_time', label: 'Full-time' },
    { value: 'part_time', label: 'Part-time' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
    { value: 'volunteer', label: 'Volunteer' },
];

const emptyExperience = () => ({
    job_title: '',
    company_name: '',
    employment_type: 'full_time',
    start_date: '',
    end_date: '',
    description: '',
    is_current: false,
});

function formatDateRange(start, end, isCurrent) {
    if (!start && !end) return '';
    const s = start ? new Date(start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
    const e = isCurrent ? 'Present' : (end ? new Date(end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '');
    return [s, e].filter(Boolean).join(' – ');
}

function ExperienceSection({ experiences, onAdd, onUpdate, onDelete, api }) {
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

    const openEdit = (exp) => {
        setEditing(exp);
        setForm({
            job_title: exp.job_title || '',
            company_name: exp.company_name || '',
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
        setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const payload = {
                ...form,
                end_date: form.is_current ? null : (form.end_date || null),
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
                <button type="button" className="profile-section-add" onClick={openAdd}>
                    + Add Experience
                </button>
            </div>
            <div className="profile-section-cards">
                {experiences.length === 0 ? (
                    <p className="profile-section-empty">No experience added yet.</p>
                ) : (
                    experiences.map((exp) => (
                        <div key={exp.id} className="profile-card">
                            <div className="profile-card-main">
                                <h3 className="profile-card-title">{exp.job_title || '—'}</h3>
                                <p className="profile-card-subtitle">{exp.company_name || '—'}</p>
                                <p className="profile-card-meta">
                                    {EMPLOYMENT_TYPES.find((t) => t.value === exp.employment_type)?.label || exp.employment_type}
                                    {exp.start_date || exp.end_date || exp.is_current ? (
                                        <span> · {formatDateRange(exp.start_date, exp.end_date, exp.is_current)}</span>
                                    ) : null}
                                </p>
                                {exp.description && (
                                    <p className="profile-card-desc">{exp.description}</p>
                                )}
                            </div>
                            <div className="profile-card-actions">
                                <button type="button" className="profile-card-btn" onClick={() => openEdit(exp)}>
                                    Edit
                                </button>
                                <button type="button" className="profile-card-btn profile-card-btn-danger" onClick={() => handleDelete(exp.id)}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <EditModal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Experience' : 'Add Experience'}>
                <form onSubmit={handleSubmit} className="profile-form">
                    {error && <div className="profile-form-error">{error}</div>}
                    <div className="profile-form-row">
                        <label className="profile-form-label">Job Title *</label>
                        <input
                            type="text"
                            name="job_title"
                            value={form.job_title}
                            onChange={handleChange}
                            className="profile-form-input"
                            required
                        />
                    </div>
                    <div className="profile-form-row">
                        <label className="profile-form-label">Company Name *</label>
                        <input
                            type="text"
                            name="company_name"
                            value={form.company_name}
                            onChange={handleChange}
                            className="profile-form-input"
                            required
                        />
                    </div>
                    <div className="profile-form-row">
                        <label className="profile-form-label">Employment Type</label>
                        <select
                            name="employment_type"
                            value={form.employment_type}
                            onChange={handleChange}
                            className="profile-form-input"
                        >
                            {EMPLOYMENT_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="profile-form-row profile-form-row-inline">
                        <div>
                            <label className="profile-form-label">Start Date</label>
                            <input
                                type="date"
                                name="start_date"
                                value={form.start_date}
                                onChange={handleChange}
                                className="profile-form-input"
                            />
                        </div>
                        <div>
                            <label className="profile-form-label">End Date</label>
                            <input
                                type="date"
                                name="end_date"
                                value={form.end_date}
                                onChange={handleChange}
                                className="profile-form-input"
                                disabled={form.is_current}
                            />
                        </div>
                    </div>
                    <div className="profile-form-row">
                        <label className="profile-form-label profile-form-check">
                            <input
                                type="checkbox"
                                name="is_current"
                                checked={form.is_current}
                                onChange={handleChange}
                            />
                            Currently working here
                        </label>
                    </div>
                    <div className="profile-form-row">
                        <label className="profile-form-label">Description</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            className="profile-form-input profile-form-textarea"
                            rows={4}
                        />
                    </div>
                    <div className="profile-form-actions">
                        <button type="button" className="profile-form-cancel" onClick={closeModal}>
                            Cancel
                        </button>
                        <button type="submit" className="profile-form-submit" disabled={saving}>
                            {saving ? 'Saving…' : (editing ? 'Save' : 'Add')}
                        </button>
                    </div>
                </form>
            </EditModal>
        </section>
    );
}

export default ExperienceSection;
