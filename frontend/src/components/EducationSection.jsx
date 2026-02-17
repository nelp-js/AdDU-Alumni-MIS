import { useState } from 'react';
import { FiPlus, FiEdit3 } from 'react-icons/fi';
import EditModal from './EditModal';
import UniversityAutocomplete from './UniversityAutocomplete';
import { extractDomain, getFaviconUrl } from '../utils/autocomplete';
import '../styles/ProfileSection.css';
import '../styles/ExperienceModal.css';

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 50 }, (_, i) => (currentYear + 5) - i); 
const MONTHS = [
    { value: '', label: 'Month' },
    { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
    { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
    { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

const DESC_MAX = 1000;
const ACTIVITIES_MAX = 500;

const emptyEducation = () => ({
    school_name: '',
    school_website: '',
    school_logo_url: '',
    degree: '',
    field_of_study: '',
    start_month: '',
    start_year: '',
    end_month: '',
    end_year: '',
    activities: '',
    description: '',
});

function formatEduDateRange(startMonth, startYear, endMonth, endYear) {
    const s = startYear ? String(startYear) : '';
    const e = endYear ? String(endYear) : '';
    if (!s && !e) return '';
    return [s || '—', e || '—'].join(' - ');
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
            school_website: edu.school_website || '',
            school_logo_url: edu.school_logo_url || '',
            degree: edu.degree || '',
            field_of_study: edu.field_of_study || '',
            start_month: edu.start_month ? String(edu.start_month) : '',
            start_year: edu.start_year ? String(edu.start_year) : '',
            end_month: edu.end_month ? String(edu.end_month) : '',
            end_year: edu.end_year ? String(edu.end_year) : '',
            activities: edu.activities || '',
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
        if (name === 'description') {
            setForm((prev) => ({ ...prev, [name]: value.slice(0, DESC_MAX) }));
        } else if (name === 'activities') {
            setForm((prev) => ({ ...prev, [name]: value.slice(0, ACTIVITIES_MAX) }));
        } else {
            setForm((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const payload = {
                school_name: form.school_name,
                school_website: form.school_website || '',
                school_logo_url: form.school_logo_url || '',
                degree: form.degree,
                field_of_study: form.field_of_study,
                start_month: form.start_month ? parseInt(form.start_month, 10) : null,
                start_year: form.start_year ? parseInt(form.start_year, 10) : null,
                end_month: form.end_month ? parseInt(form.end_month, 10) : null,
                end_year: form.end_year ? parseInt(form.end_year, 10) : null,
                activities: form.activities,
                description: form.description,
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
            closeModal();
        } catch {
            alert('Failed to delete.');
        }
    };

    return (
        <section className="profile-section">
            <div className="profile-card">
                <div className="card-header">
                    <h2 className="card-title">Education</h2>
                    <div className="card-header-actions">
                        <button 
                            type="button" 
                            className="icon-btn" 
                            onClick={openAdd}
                            title="Add Education"
                        >
                            <FiPlus size={24} />
                        </button>
                    </div>
                </div>

                <div className="card-body">
                    {educations.length === 0 ? (
                        <p className="section-empty">No education added yet.</p>
                    ) : (
                        educations.map((edu, idx) => {
                            const dateStr = formatEduDateRange(edu.start_month, edu.start_year, edu.end_month, edu.end_year);
                            
                            // AdDU Specific Seal Logic
                            const isAdDU = edu.school_name?.toLowerCase().includes("ateneo de davao");
                            const adduSeal = "https://res.cloudinary.com/dwi7oftcs/image/upload/v1770416948/UniversitySeal240px_zblv2w.png";
                            
                            const logoUrl = edu.school_logo_url;
                            const domain = extractDomain(edu.school_website);
                            const faviconUrl = domain ? getFaviconUrl(domain) : null;
                            const src = isAdDU ? adduSeal : (logoUrl || faviconUrl);

                            return (
                                <div key={edu.id} className={`profile-edu-item ${idx > 0 ? 'profile-edu-item-divider' : ''}`}>
                                    <div 
                                        className="profile-edu-logo" 
                                        style={{ 
                                            backgroundColor: isAdDU ? '#ffffff' : '#ffffff',
                                            padding: isAdDU ? '4px' : '0' 
                                        }}
                                    >
                                        {src ? (
                                            <>
                                                <img
                                                    src={src}
                                                    alt={edu.school_name}
                                                    className="profile-edu-logo-img"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                                <span className="profile-edu-logo-fallback" style={{ display: 'none' }}>
                                                    {edu.school_name ? edu.school_name.slice(0, 1).toUpperCase() : '?'}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="profile-edu-logo-fallback">
                                                {edu.school_name ? edu.school_name.slice(0, 1).toUpperCase() : '?'}
                                            </span>
                                        )}
                                    </div>

                                    <div className="profile-edu-body">
                                        <div className="profile-exp-content">
                                            <h3 className="profile-edu-title">{edu.school_name || '—'}</h3>
                                            <p className="profile-edu-subtitle">
                                                {[edu.degree, edu.field_of_study].filter(Boolean).join(', ') || '—'}
                                            </p>
                                            {dateStr && <p className="profile-edu-meta">{dateStr}</p>}
                                            {edu.activities && (
                                                <p className="profile-edu-activities">
                                                    <strong>Activities:</strong> {edu.activities}
                                                </p>
                                            )}
                                            {edu.description && <p className="profile-edu-desc">{edu.description}</p>}
                                        </div>
                                        
                                        <button
                                            type="button"
                                            className="profile-edu-edit-icon"
                                            onClick={() => openEdit(edu)}
                                            title="Edit Item"
                                        >
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
                title={editing ? 'Edit education' : 'Add education'}
            >
                <form onSubmit={handleSubmit} className="exp-form">
                    {error && <div className="exp-form-error">{error}</div>}
                    <div className="exp-form-row">
                        <label className="exp-form-label">School *</label>
                        <UniversityAutocomplete
                            value={form.school_name}
                            onChange={handleChange}
                            onSelect={({ school_name: name, school_logo_url: logoUrl, school_website: website }) => {
                                setForm((prev) => ({
                                    ...prev,
                                    school_name: name,
                                    school_logo_url: logoUrl || '',
                                    school_website: website || '',
                                }));
                            }}
                            placeholder="Ex: Ateneo de Davao University"
                            required
                        />
                    </div>
                    <div className="exp-form-row">
                        <label className="exp-form-label">Degree</label>
                        <input type="text" name="degree" value={form.degree} onChange={handleChange} className="exp-form-input" placeholder="Ex: Bachelor's" />
                    </div>
                    <div className="exp-form-row">
                        <label className="exp-form-label">Field of study</label>
                        <input type="text" name="field_of_study" value={form.field_of_study} onChange={handleChange} className="exp-form-input" placeholder="Ex: Business" />
                    </div>
                    <div className="exp-form-row exp-form-row-inline">
                        <div style={{flex: 1, marginRight: '16px'}}>
                            <label className="exp-form-label">Start date</label>
                            <div className="exp-form-date-row" style={{display: 'flex', gap: '8px'}}>
                                <select name="start_month" value={form.start_month} onChange={handleChange} className="exp-form-input exp-form-select">
                                    {MONTHS.map((m) => (<option key={m.value || 'm'} value={m.value}>{m.label}</option>))}
                                </select>
                                <select name="start_year" value={form.start_year} onChange={handleChange} className="exp-form-input exp-form-select">
                                    <option value="">Year</option>
                                    {YEARS.map((y) => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div style={{flex: 1}}>
                            <label className="exp-form-label">End date (expected)</label>
                            <div className="exp-form-date-row" style={{display: 'flex', gap: '8px'}}>
                                <select name="end_month" value={form.end_month} onChange={handleChange} className="exp-form-input exp-form-select">
                                    {MONTHS.map((m) => (<option key={m.value || 'em'} value={m.value}>{m.label}</option>))}
                                </select>
                                <select name="end_year" value={form.end_year} onChange={handleChange} className="exp-form-input exp-form-select">
                                    <option value="">Year</option>
                                    {YEARS.map((y) => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="exp-form-actions">
                        {editing && (
                            <button type="button" className="exp-form-delete" onClick={() => handleDelete(editing.id)}>
                                Delete education
                            </button>
                        )}
                        <div className="exp-form-actions-right">
                            <button type="button" className="exp-form-draft" onClick={closeModal}>Cancel</button>
                            <button type="submit" className="exp-form-submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                        </div>
                    </div>
                </form>
            </EditModal>
        </section>
    );
}

export default EducationSection;