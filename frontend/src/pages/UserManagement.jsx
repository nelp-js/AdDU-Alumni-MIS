import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/UserManagement.css';
import '../styles/ContentManagement.css';
import { useTitle } from '../Hooks/useTitle';
import LocationFields from '../components/LocationFields';
import MarriageYearMonthFields from '../components/MarriageYearMonthFields';
import { useCountries } from '../Hooks/useCountries';

// ─── Static option lists ────────────────────────────────────────────────────

const RELIGIONS = [
    { value: 'roman_catholic',       label: 'Roman Catholic' },
    { value: 'protestant',           label: 'Protestant' },
    { value: 'iglesia_ni_cristo',    label: 'Iglesia ni Cristo' },
    { value: 'islam',                label: 'Islam' },
    { value: 'born_again_christian', label: 'Born Again Christian' },
    { value: 'buddhist',             label: 'Buddhist' },
    { value: 'other',                label: 'Other (please specify)' },
    { value: 'prefer_not_to_say',    label: 'Prefer not to say' },
];

const MARITAL_STATUSES = [
    { value: 'single',     label: 'Single' },
    { value: 'married',    label: 'Married' },
    { value: 'living_in',  label: 'Living In' },
    { value: 'separated',  label: 'Separated' },
    { value: 'annulled',   label: 'Annulled' },
    { value: 'divorced',   label: 'Divorced' },
    { value: 'widowed',    label: 'Widowed' },
];

const MARRIED_STATUSES = ['married', 'separated', 'annulled', 'divorced', 'widowed'];

const COURSES = [
    { value: 'CS', label: 'Computer Science' },
    { value: 'IT', label: 'Information Technology' },
    { value: 'IS', label: 'Information Systems' },
];

const EMPTY_FORM = {
    first_name: '', middle_name: '', last_name: '',
    username: '', email: '',
    phone_number: '', telephone_number: '',
    current_address: '', country: 'Philippines', geocode: '',
    regionCode: '', region: '', provinceCode: '', province: '', city: '',
    religion: '', religion_other: '',
    marital_status: '', marriage_date: '',
    intend_to_marry: '', intended_marriage_age: '', no_marriage_reason: '',
    course: '', batch_year: '',
    is_superuser: false,
};

// ─── Reusable UI helpers ─────────────────────────────────────────────────────

const SectionLabel = ({ children }) => (
    <div className="user-mgmt-modal-section-label">{children}</div>
);

const DetailRow = ({ label, value }) => (
    <div className="content-mgmt-detail-row">
        <span className="content-mgmt-detail-label">{label}</span>
        <span className="content-mgmt-detail-value">{value || '—'}</span>
    </div>
);

const Field = ({ label, children }) => (
    <div className="user-mgmt-modal-field">
        <label>{label}</label>
        {children}
    </div>
);

const SelectInput = ({ name, value, onChange, placeholder, options }) => (
    <select name={name} value={value} onChange={onChange}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) =>
            typeof o === 'string'
                ? <option key={o} value={o}>{o}</option>
                : <option key={o.value} value={o.value}>{o.label}</option>
        )}
    </select>
);

// ─── Main component ──────────────────────────────────────────────────────────

function UserManagement() {
    useTitle('User Management');

    const [users, setUsers]             = useState([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState(null);
    const [approvingId, setApprovingId] = useState(null);
    const [denyingId, setDenyingId]     = useState(null);
    const [deletingId, setDeletingId]   = useState(null);
    const [detailsUser, setDetailsUser] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm]       = useState(EMPTY_FORM);
    const [editError, setEditError]     = useState(null);
    const [savingEdit, setSavingEdit]   = useState(false);
    const [denyRemarks, setDenyRemarks]         = useState('');
    const [showDenyInput, setShowDenyInput]     = useState(null);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1948 + 1 }, (_, i) => currentYear - i).filter(year => year <= 2025);
    const { countries, loading: loadingCountries } = useCountries();

    // ── Fetch ────────────────────────────────────────────────────────────────

    useEffect(() => {
        api.get('/api/users/')
            .then((res) => setUsers(res.data))
            .catch((err) => setError(err.response?.status === 403 ? 'Admin access required.' : 'Failed to load users.'))
            .finally(() => setLoading(false));
    }, []);

    // ── Actions ──────────────────────────────────────────────────────────────

    const handleApprove = (userId) => {
        setApprovingId(userId);
        api.post(`/api/users/${userId}/approve/`)
            .then(() => setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_approved: true, is_active: true } : u)))
            .catch(() => {})
            .finally(() => setApprovingId(null));
    };

    const handleDeny = (userId, remarks = '') => {
        setDenyingId(userId);
        api.post(`/api/users/${userId}/deny/`, { remarks })
            .then(() => {
                setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_approved: false, is_active: false } : u));
                setShowDenyInput(null);
                setDenyRemarks('');
            })
            .catch(() => {})
            .finally(() => setDenyingId(null));
    };

    const handleDelete = (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        setDeletingId(userId);
        api.patch(`/api/users/${userId}/`, { is_active: false })
            .then(() => { setUsers((prev) => prev.filter((u) => u.id !== userId)); closeEdit(); setDetailsUser(null); })
            .catch(() => alert('Failed to delete user.'))
            .finally(() => setDeletingId(null));
    };

    // ── Helpers ──────────────────────────────────────────────────────────────

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleString(undefined, {
                month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
            });
        } catch { return dateStr; }
    };

    const fullName  = (u) => [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(' ') || '—';
    const getStatus = (u) => u.is_approved ? 'Approved' : 'Pending';
    const isPending = (u) => !u.is_approved;

    // ── Edit modal ───────────────────────────────────────────────────────────

    const openEdit = (u) => {
        setEditingUser(u.id);
        setEditForm({
            first_name: u.first_name || '', middle_name: u.middle_name || '', last_name: u.last_name || '',
            username: u.username || '', email: u.email || '',
            phone_number: u.phone_number || '', telephone_number: u.telephone_number || '',
            current_address: u.current_address || '', country: u.country || 'Philippines', geocode: u.geocode || '',
            regionCode: u.regionCode || '', region: u.region || '',
            provinceCode: u.provinceCode || '', province: u.province || '', city: u.city || '',
            religion: u.religion || '', religion_other: u.religion_other || '',
            marital_status: u.marital_status || '', marriage_date: u.marriage_date || '',
            intend_to_marry: u.intend_to_marry || '', intended_marriage_age: u.intended_marriage_age || '',
            no_marriage_reason: u.no_marriage_reason || '',
            course: u.course || '', batch_year: u.batch_year || '',
            is_superuser: !!u.is_superuser,
        });
        setEditError(null);
    };

    const closeEdit = () => { setEditingUser(null); setEditError(null); };

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleEditSave = () => {
        if (!editingUser) return;
        setEditError(null);
        setSavingEdit(true);
        const f = editForm;
        const isSingle  = f.marital_status === 'single';
        const isMarried = MARRIED_STATUSES.includes(f.marital_status);
        const payload = {
            first_name: f.first_name, middle_name: f.middle_name || null, last_name: f.last_name,
            username: f.username, email: f.email,
            phone_number: f.phone_number, telephone_number: f.telephone_number || null,
            current_address: f.current_address, country: f.country, geocode: f.geocode,
            region: f.region || null, province: f.province || null, city: f.city || null,
            religion: f.religion, religion_other: f.religion === 'other' ? f.religion_other : null,
            marital_status: f.marital_status,
            marriage_date:         isMarried                            ? f.marriage_date         : null,
            intend_to_marry:       isSingle                             ? f.intend_to_marry        : null,
            intended_marriage_age: isSingle && f.intend_to_marry==='yes'? f.intended_marriage_age  : null,
            no_marriage_reason:    isSingle && f.intend_to_marry==='no' ? f.no_marriage_reason     : null,
            course: f.course, batch_year: f.batch_year,
            is_superuser: f.is_superuser, is_staff: f.is_superuser,
        };
        api.patch(`/api/users/${editingUser}/`, payload)
            .then(() => api.get(`/api/users/${editingUser}/`))
            .then((res) => { setUsers((prev) => prev.map((u) => u.id === editingUser ? res.data : u)); closeEdit(); })
            .catch((err) => { const d = err.response?.data; setEditError(d && typeof d === 'object' ? (d.detail || Object.values(d).flat().join(' ')) : 'Failed to save.'); })
            .finally(() => setSavingEdit(false));
    };

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="user-mgmt-page">
            <Header />
            <main className="user-mgmt-main">
                <h1 className="user-mgmt-title">User Management</h1>
                <p className="user-mgmt-subtitle">Registered users and approval status.</p>

                {/* ── Table card ── */}
                <div className="user-mgmt-card">
                    {loading && <div className="user-mgmt-loading">Loading users...</div>}
                    {error   && <div className="user-mgmt-error">{error}</div>}
                    {!loading && !error && users.length === 0 && <div className="user-mgmt-empty">No registered users yet.</div>}
                    {!loading && !error && users.length > 0 && (
                        <div className="user-mgmt-table-wrap">
                            <table className="user-mgmt-table">
                                <thead>
                                    <tr>
                                        <th>NAME</th><th>USERNAME</th><th>EMAIL</th><th>PHONE</th>
                                        <th>BATCH</th><th>PROGRAM</th><th>DATE REGISTERED</th>
                                        <th>STATUS</th><th>DETAILS</th><th>ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u.id}>
                                            <td>{fullName(u)}</td>
                                            <td>{u.username}</td>
                                            <td>{u.email || '—'}</td>
                                            <td>{u.phone_number || '—'}</td>
                                            <td>{u.batch_year || u.batch || '—'}</td>
                                            <td>{u.course || u.program || '—'}</td>
                                            <td>{formatDate(u.date_joined)}</td>
                                            <td>
                                                <span className={`user-mgmt-status ${u.is_approved ? 'approved' : 'pending'}`}>
                                                    {getStatus(u)}
                                                </span>
                                            </td>
                                            <td>
                                                <button type="button" className="content-mgmt-details-link" onClick={() => setDetailsUser(u)}>
                                                    View Details
                                                </button>
                                            </td>
                                            <td>
                                                {isPending(u) ? (
                                                    <span className="user-mgmt-actions">
                                                        {showDenyInput !== u.id && (
                                                            <button type="button" className="user-mgmt-approve-btn" onClick={() => handleApprove(u.id)} disabled={approvingId === u.id}>
                                                                {approvingId === u.id ? '...' : 'Approve'}
                                                            </button>
                                                        )}
                                                        {showDenyInput === u.id ? (
                                                            <div className="user-mgmt-deny-block">
                                                                <textarea
                                                                    placeholder="Reason for denial... (max 140 chars)"
                                                                    value={denyRemarks}
                                                                    onChange={(e) => setDenyRemarks(e.target.value)}
                                                                    maxLength={140}
                                                                    className="user-mgmt-deny-textarea"
                                                                />
                                                                <div className="user-mgmt-deny-actions">
                                                                    <button
                                                                        type="button"
                                                                        className="user-mgmt-confirm-btn"
                                                                        onClick={() => handleDeny(u.id, denyRemarks.trim())}
                                                                        disabled={denyingId === u.id}
                                                                    >
                                                                        {denyingId === u.id ? '...' : 'Confirm'}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="user-mgmt-deny-btn"
                                                                        onClick={() => { setShowDenyInput(null); setDenyRemarks(''); }}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                className="user-mgmt-deny-btn"
                                                                onClick={() => { setShowDenyInput(u.id); setDenyRemarks(''); }}
                                                            >
                                                                Deny
                                                            </button>
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="user-mgmt-actions user-mgmt-actions--single">
                                                        <button type="button" className="user-mgmt-edit-btn" onClick={() => openEdit(u)}>
                                                            Edit
                                                        </button>
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="user-mgmt-back">
                    <Link to="/dashboard" className="user-mgmt-back-link">← Back to Dashboard</Link>
                </div>

                {/* ── View Details modal ── */}
                {detailsUser && (
                    <div className="content-mgmt-modal-overlay" onClick={() => setDetailsUser(null)}>
                        <div className="content-mgmt-modal user-details-modal" onClick={(e) => e.stopPropagation()}>
                            <h2 className="content-mgmt-modal-title">User Details</h2>
                            <div className="content-mgmt-details">

                                <SectionLabel>Personal Information</SectionLabel>
                                <div className="user-details-grid">
                                    <DetailRow label="Full Name"  value={fullName(detailsUser)} />
                                    <DetailRow label="Username"   value={detailsUser.username} />
                                    <DetailRow label="Email"      value={detailsUser.email} />
                                    <DetailRow label="Birth Date" value={detailsUser.birth_date} />
                                    <DetailRow label="Sex"        value={detailsUser.sex} />
                                </div>

                                <SectionLabel>Contact & Address</SectionLabel>
                                <div className="user-details-grid">
                                    <DetailRow label="Phone"           value={detailsUser.phone_number} />
                                    <DetailRow label="Telephone"       value={detailsUser.telephone_number} />
                                    <DetailRow label="Current Address" value={detailsUser.current_address} />
                                    <DetailRow label="Country"         value={detailsUser.country} />
                                    <DetailRow label="Zipcode"         value={detailsUser.geocode} />
                                    {detailsUser.region   && <DetailRow label="Region"    value={detailsUser.region} />}
                                    {detailsUser.province && <DetailRow label="Province"  value={detailsUser.province} />}
                                    {detailsUser.city     && <DetailRow label="City/Town" value={detailsUser.city} />}
                                </div>

                                <SectionLabel>Background</SectionLabel>
                                <div className="user-details-grid">
                                    <DetailRow label="Religion"
                                        value={detailsUser.religion === 'other' ? detailsUser.religion_other || 'Other' : detailsUser.religion} />
                                    <DetailRow label="Marital Status" value={detailsUser.marital_status} />
                                    {detailsUser.marriage_date         && <DetailRow label="Marriage Date"         value={detailsUser.marriage_date} />}
                                    {detailsUser.marital_status === 'single' && <DetailRow label="Intends to Marry" value={detailsUser.intend_to_marry} />}
                                    {detailsUser.intended_marriage_age && <DetailRow label="Intended Marriage Age" value={detailsUser.intended_marriage_age} />}
                                    {detailsUser.no_marriage_reason    && <DetailRow label="Reason (No Marriage)"  value={detailsUser.no_marriage_reason} />}
                                </div>

                                <SectionLabel>Academic</SectionLabel>
                                <div className="user-details-grid">
                                    <DetailRow label="Course"      value={detailsUser.course} />
                                    <DetailRow label="Batch Year"  value={detailsUser.batch_year} />
                                    <DetailRow label="Has Diploma" value={detailsUser.has_diploma} />
                                </div>

                                <SectionLabel>Documents</SectionLabel>
                                <div className="user-details-grid">
                                    <DetailRow label="ID Type" value={detailsUser.id_type} />
                                    {detailsUser.valid_id_file && (
                                        <div className="user-details-valid-id-row">
                                            <span className="content-mgmt-detail-label">Valid ID</span>
                                            <div className="user-details-valid-id-media">
                                                <a
                                                    href={detailsUser.valid_id_file}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="user-details-valid-id-link"
                                                >
                                                    <img
                                                        src={detailsUser.valid_id_file}
                                                        alt="Valid ID"
                                                        className="user-details-valid-id-img"
                                                    />
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    {detailsUser.diploma_file && (
                                        <div className="content-mgmt-detail-row">
                                            <span className="content-mgmt-detail-label">Diploma</span>
                                            <a href={detailsUser.diploma_file} target="_blank" rel="noreferrer" className="user-details-file-link">View Diploma</a>
                                        </div>
                                    )}
                                </div>

                                <SectionLabel>Role & Status</SectionLabel>
                                <div className="user-details-grid">
                                    <div className="content-mgmt-detail-row">
                                        <span className="content-mgmt-detail-label">Status</span>
                                        <span className={`user-mgmt-status ${detailsUser.is_approved ? 'approved' : 'pending'}`}>
                                            {getStatus(detailsUser)}
                                        </span>
                                    </div>
                                    <DetailRow label="Admin"           value={detailsUser.is_superuser ? 'Yes' : 'No'} />
                                    <DetailRow label="Date Registered" value={formatDate(detailsUser.date_joined)} />
                                </div>

                            </div>
                            <div className="content-mgmt-modal-actions">
                                <div />
                                <button
                                    type="button"
                                    className="user-details-modal-close-deny"
                                    onClick={() => setDetailsUser(null)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Edit modal ── */}
                {editingUser != null && (
                    <div className="user-mgmt-modal-overlay" onClick={closeEdit}>
                        <div className="user-mgmt-modal" onClick={(e) => e.stopPropagation()}>
                            <h2 className="user-mgmt-modal-title">Edit User</h2>
                            {editError && <div className="user-mgmt-modal-error">{editError}</div>}

                            <div className="user-mgmt-modal-form">

                                <SectionLabel>Personal Information</SectionLabel>
                                <div className="user-mgmt-modal-row">
                                    <Field label="First Name *"><input name="first_name" value={editForm.first_name} onChange={handleEditChange} /></Field>
                                    <Field label="Middle Name"><input name="middle_name" value={editForm.middle_name} onChange={handleEditChange} /></Field>
                                    <Field label="Last Name *"><input name="last_name" value={editForm.last_name} onChange={handleEditChange} /></Field>
                                </div>
                                <div className="user-mgmt-modal-row">
                                    <Field label="Username *"><input name="username" value={editForm.username} onChange={handleEditChange} /></Field>
                                    <Field label="Email *"><input type="email" name="email" value={editForm.email} onChange={handleEditChange} /></Field>
                                </div>

                                <SectionLabel>Contact & Address</SectionLabel>
                                <div className="user-mgmt-modal-row">
                                    <Field label="Phone Number *"><input name="phone_number" value={editForm.phone_number} onChange={handleEditChange} /></Field>
                                    <Field label="Telephone Number"><input name="telephone_number" value={editForm.telephone_number} onChange={handleEditChange} /></Field>
                                </div>
                                <Field label="Current Address *"><input name="current_address" value={editForm.current_address} onChange={handleEditChange} /></Field>
                                <div className="user-mgmt-modal-row">
                                    <Field label="Country *">
                                        <select name="country" value={editForm.country} onChange={handleEditChange}>
                                            <option value="">{loadingCountries ? 'Loading countries...' : 'Select country'}</option>
                                            {countries.map((c) => (
                                                <option key={c.value} value={c.value}>{c.label}</option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="Zipcode *"><input name="geocode" value={editForm.geocode} onChange={handleEditChange} /></Field>
                                </div>
                                {editForm.country === 'Philippines' && (
                                    <div className="user-mgmt-modal-row">
                                        <LocationFields
                                            regionCode={editForm.regionCode}
                                            provinceCode={editForm.provinceCode}
                                            cityName={editForm.city}
                                            onChange={(field, value) =>
                                                setEditForm((prev) => ({ ...prev, [field]: value }))
                                            }
                                            fieldClass="user-mgmt-modal-field"
                                            labelClass=""
                                            inputClass=""
                                        />
                                    </div>
                                )}

                                <SectionLabel>Background</SectionLabel>
                                <div className="user-mgmt-modal-row">
                                    <Field label="Religion *">
                                        <SelectInput name="religion" value={editForm.religion} onChange={handleEditChange} placeholder="Select religion" options={RELIGIONS} />
                                    </Field>
                                    {editForm.religion === 'other' && (
                                        <Field label="Specify Religion *"><input name="religion_other" value={editForm.religion_other} onChange={handleEditChange} /></Field>
                                    )}
                                </div>
                                <Field label="Marital Status *">
                                    <SelectInput name="marital_status" value={editForm.marital_status} onChange={handleEditChange} placeholder="Select Marital Status" options={MARITAL_STATUSES} />
                                </Field>
                                {MARRIED_STATUSES.includes(editForm.marital_status) && (
                                    <Field label="Date of marriage (year & month) *">
                                        <MarriageYearMonthFields
                                            key={editingUser}
                                            value={editForm.marriage_date}
                                            onChange={(v) =>
                                                setEditForm((prev) => ({ ...prev, marriage_date: v }))
                                            }
                                            required
                                        />
                                    </Field>
                                )}
                                {editForm.marital_status === 'single' && (
                                    <Field label="Do you intend to marry? *">
                                        <SelectInput name="intend_to_marry" value={editForm.intend_to_marry} onChange={handleEditChange}
                                            placeholder="Select Option" options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
                                    </Field>
                                )}
                                {editForm.marital_status === 'single' && editForm.intend_to_marry === 'yes' && (
                                    <Field label="Intended Marriage Age (18+) *">
                                        <input type="number" name="intended_marriage_age" value={editForm.intended_marriage_age} onChange={handleEditChange} min="18" max="100" />
                                    </Field>
                                )}
                                {editForm.marital_status === 'single' && editForm.intend_to_marry === 'no' && (
                                    <Field label="Reason (Optional)">
                                        <input name="no_marriage_reason" value={editForm.no_marriage_reason} onChange={handleEditChange} />
                                    </Field>
                                )}

                                <SectionLabel>Academic</SectionLabel>
                                <div className="user-mgmt-modal-row">
                                    <Field label="Course *">
                                        <SelectInput name="course" value={editForm.course} onChange={handleEditChange} placeholder="Select Course" options={COURSES} />
                                    </Field>
                                    <Field label="Batch Year *">
                                        <SelectInput name="batch_year" value={editForm.batch_year} onChange={handleEditChange} placeholder="Select Batch"
                                            options={years.map((y) => ({ value: y, label: y }))} />
                                    </Field>
                                </div>

                                <SectionLabel>Role</SectionLabel>
                                <div className="user-mgmt-modal-field user-mgmt-modal-checkbox">
                                    <label>
                                        <input type="checkbox" name="is_superuser" checked={editForm.is_superuser} onChange={handleEditChange} />
                                        <span>Admin (superuser)</span>
                                    </label>
                                </div>

                            </div>

                            <div className="user-mgmt-modal-actions">
                                <button type="button" className="user-mgmt-modal-delete" onClick={() => handleDelete(editingUser)} disabled={deletingId === editingUser}>
                                    {deletingId === editingUser ? 'Deleting...' : 'Delete User'}
                                </button>
                                <div className="user-mgmt-modal-actions-right">
                                    <button type="button" className="user-mgmt-modal-cancel" onClick={closeEdit}>Cancel</button>
                                    <button type="button" className="user-mgmt-modal-save" onClick={handleEditSave} disabled={savingEdit}>
                                        {savingEdit ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

            </main>
            <Footer />
        </div>
    );
}

export default UserManagement;