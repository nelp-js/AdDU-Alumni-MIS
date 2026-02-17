import { useState } from 'react';
import EditModal from './EditModal';
import '../styles/ProfileSection.css';

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 50 }, (_, i) => currentYear - i);

const emptyEducation = () => ({
    school_name: '',
    degree: '',
    field_of_study: '',
    start_year: '',
    end_year: '',
    description: '',
});

function formatYearRange(start, end) {
    if (!start && !end) return '';
    return [start || '—', end || '—'].join(' – ');
}

function EducationSection({ educations, onAdd, onUpdate, onDelete, api }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyEducation());
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const openAdd = () => {
        setEditing(null);
        setForm(emptyEducation());
        setError('');
        setModalOpen(true);
    };

    const openEdit = (edu) => {
        setEditing(edu);
        setForm({
            school_name: edu.school_name || '',
            degree: edu.degree || '',
            field_of_study: edu.field_of_study || '',
            start_year: edu.start_year ? String(edu.start_year) : '',
            end_year: edu.end_year ? String(edu.end_year) : '',
            description: edu.description || '',
        });
        setError('');
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
        setForm(emptyEducation());
        setError('');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const payload = {
                ...form,
                start_year: form.start_year ? parseInt(form.start_year, 10) : null,
                end_year: form.end_year ? parseInt(form.end_year, 10) : null,
            };
            if (editing) {
                await api.patch(`/api/profile/educations/${editing.id}/`, payload);
                onUpdate();
            } else {
                await api.post('/api/profile/educations/', payload);
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
        if (!window.confirm('Delete this education?')) return;
        try {
            await api.delete(`/api/profile/educations/${id}/`);
            onDelete();
        } catch {
            alert('Failed to delete.');
        }
    };

    return (
        <section className="profile-section">
            <div className="profile-section-header">
                <h2 className="profile-section-title">Education</h2>
                <button type="button" className="profile-section-add" onClick={openAdd}>
                    + Add Education
                </button>
            </div>
            <div className="profile-section-cards">
                {educations.length === 0 ? (
                    <p className="profile-section-empty">No education added yet.</p>
                ) : (
                    educations.map((edu) => (
                        <div key={edu.id} className="profile-card">
                            <div className="profile-card-main">
                                <h3 className="profile-card-title">{edu.school_name || '—'}</h3>
                                <p className="profile-card-subtitle">
                                    {[edu.degree, edu.field_of_study].filter(Boolean).join(' · ') || '—'}
                                </p>
                                <p className="profile-card-meta">
                                    {formatYearRange(edu.start_year, edu.end_year)}
                                </p>
                                {edu.description && (
                                    <p className="profile-card-desc">{edu.description}</p>
                                )}
                            </div>
                            <div className="profile-card-actions">
                                <button type="button" className="profile-card-btn" onClick={() => openEdit(edu)}>
                                    Edit
                                </button>
                                <button type="button" className="profile-card-btn profile-card-btn-danger" onClick={() => handleDelete(edu.id)}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <EditModal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Education' : 'Add Education'}>
                <form onSubmit={handleSubmit} className="profile-form">
                    {error && <div className="profile-form-error">{error}</div>}
                    <div className="profile-form-row">
                        <label className="profile-form-label">School Name *</label>
                        <input
                            type="text"
                            name="school_name"
                            value={form.school_name}
                            onChange={handleChange}
                            className="profile-form-input"
                            required
                        />
                    </div>
                    <div className="profile-form-row">
                        <label className="profile-form-label">Degree</label>
                        <input
                            type="text"
                            name="degree"
                            value={form.degree}
                            onChange={handleChange}
                            className="profile-form-input"
                            placeholder="e.g. Bachelor of Science"
                        />
                    </div>
                    <div className="profile-form-row">
                        <label className="profile-form-label">Field of Study</label>
                        <input
                            type="text"
                            name="field_of_study"
                            value={form.field_of_study}
                            onChange={handleChange}
                            className="profile-form-input"
                            placeholder="e.g. Computer Science"
                        />
                    </div>
                    <div className="profile-form-row profile-form-row-inline">
                        <div>
                            <label className="profile-form-label">Start Year</label>
                            <select
                                name="start_year"
                                value={form.start_year}
                                onChange={handleChange}
                                className="profile-form-input"
                            >
                                <option value="">—</option>
                                {YEARS.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="profile-form-label">End Year</label>
                            <select
                                name="end_year"
                                value={form.end_year}
                                onChange={handleChange}
                                className="profile-form-input"
                            >
                                <option value="">—</option>
                                {YEARS.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
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

export default EducationSection;
