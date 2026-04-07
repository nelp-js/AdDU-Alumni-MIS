import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/JobManagement.css';
import '../styles/AdminButtons.css';
import { useTitle } from '../Hooks/useTitle';

function SplitDropdown({ item, onEdit, onToggleHide, onDelete, togglingId, deletingId }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div className="jm-btn-group" ref={ref}>
            <button
                type="button"
                className="jm-split-main"
                onClick={() => { setOpen(false); onEdit(); }}
            >
                Edit
            </button>
            <button
                type="button"
                className="jm-split-toggle"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
            >
                ▾
            </button>
            {open && (
                <ul className="jm-dropdown-menu" role="menu">
                    <li>
                        <button
                            type="button"
                            className={`jm-dropdown-item ${item.is_hidden ? 'item-activate' : 'item-deactivate'}`}
                            onClick={() => { setOpen(false); onToggleHide(); }}
                            disabled={togglingId === item.id}
                        >
                            {togglingId === item.id ? '…' : (item.is_hidden ? 'Activate' : 'Deactivate')}
                        </button>
                    </li>
                    <li>
                        <button
                            type="button"
                            className="jm-dropdown-item item-delete"
                            onClick={() => { setOpen(false); onDelete(); }}
                            disabled={deletingId === item.id}
                        >
                            {deletingId === item.id ? '…' : 'Delete'}
                        </button>
                    </li>
                </ul>
            )}
        </div>
    );
}

function JobManagement() {
    useTitle('Job & Internship Management');

    const [activeTab, setActiveTab]       = useState('jobs'); // 'jobs' | 'internships'
    const [jobs, setJobs]                 = useState([]);
    const [internships, setInternships]   = useState([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState(null);
    const [approvingId, setApprovingId]   = useState(null);
    const [denyingId, setDenyingId]       = useState(null);
    const [deletingId, setDeletingId]     = useState(null);
    const [togglingId, setTogglingId]     = useState(null);
    const [detailsItem, setDetailsItem]   = useState(null);
    const [detailsType, setDetailsType]   = useState(null); // 'job' | 'internship'
    const [denyRemarks, setDenyRemarks]   = useState('');
    const [showDenyInput, setShowDenyInput] = useState(null);
    const [editingItem, setEditingItem]   = useState(null);
    const [editingType, setEditingType]   = useState(null);
    const [editForm, setEditForm]         = useState({});
    const [savingEdit, setSavingEdit]     = useState(false);
    const [editError, setEditError]       = useState('');

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.get('/api/jobs/admin/'),
            api.get('/api/internships/admin/'),
        ])
            .then(([jobsRes, internshipsRes]) => {
                setJobs(jobsRes.data);
                setInternships(internshipsRes.data);
            })
            .catch(() => setError('Failed to load data.'))
            .finally(() => setLoading(false));
    }, []);

    const handleApprove = (id, type) => {
        setApprovingId(id);
        const endpoint = type === 'job' ? `/api/jobs/${id}/approve/` : `/api/internships/${id}/approve/`;
        api.post(endpoint)
            .then(() => {
                if (type === 'job') {
                    setJobs((prev) => prev.map((j) => j.id === id ? { ...j, status: 'approved' } : j));
                } else {
                    setInternships((prev) => prev.map((i) => i.id === id ? { ...i, status: 'approved' } : i));
                }
            })
            .catch(() => {})
            .finally(() => setApprovingId(null));
    };

    const handleDeny = (id, type) => {
        setDenyingId(id);
        const endpoint = type === 'job' ? `/api/jobs/${id}/deny/` : `/api/internships/${id}/deny/`;
        api.post(endpoint, { remarks: denyRemarks })
            .then(() => {
                if (type === 'job') {
                    setJobs((prev) => prev.map((j) => j.id === id ? { ...j, status: 'denied', remarks: denyRemarks } : j));
                } else {
                    setInternships((prev) => prev.map((i) => i.id === id ? { ...i, status: 'denied', remarks: denyRemarks } : i));
                }
                setShowDenyInput(null);
                setDenyRemarks('');
            })
            .catch(() => {})
            .finally(() => setDenyingId(null));
    };

    const handleToggleHide = (id, type, currentHidden) => {
        setTogglingId(id);
        const endpoint = type === 'job' ? `/api/jobs/${id}/toggle-hide/` : `/api/internships/${id}/toggle-hide/`;
        api.patch(endpoint)
            .then(() => {
                if (type === 'job') {
                    setJobs((prev) => prev.map((j) => j.id === id ? { ...j, is_hidden: !currentHidden } : j));
                } else {
                    setInternships((prev) => prev.map((i) => i.id === id ? { ...i, is_hidden: !currentHidden } : i));
                }
            })
            .catch(() => {})
            .finally(() => setTogglingId(null));
    };

    const handleDelete = (id, type) => {
        if (!window.confirm('Are you sure you want to delete this posting? This cannot be undone.')) return;
        setDeletingId(id);
        const endpoint = type === 'job' ? `/api/jobs/${id}/` : `/api/internships/${id}/`;
        api.delete(endpoint)
            .then(() => {
                if (type === 'job') {
                    setJobs((prev) => prev.filter((j) => j.id !== id));
                } else {
                    setInternships((prev) => prev.filter((i) => i.id !== id));
                }
                if (detailsItem?.id === id) setDetailsItem(null);
            })
            .catch(() => alert('Failed to delete.'))
            .finally(() => setDeletingId(null));
    };

    const openEdit = (item, type) => {
        setEditingType(type);
        setEditingItem(item);
        setEditError('');
        setEditForm({
            company: item.company || '',
            position: item.position || '',
            location: item.location || '',
            modality: item.modality || '',
            employment_type: item.employment_type || '',
            salary: item.salary || '',
            allowance: item.allowance || '',
            email: item.email || '',
            start_date: item.start_date ? item.start_date.slice(0, 10) : '',
            end_date: item.end_date ? item.end_date.slice(0, 10) : '',
            description: item.description || '',
        });
    };

    const closeEdit = () => {
        setEditingItem(null);
        setEditingType(null);
        setEditError('');
    };

    const handleEditSave = () => {
        if (!editingItem || !editingType) return;
        setSavingEdit(true);
        setEditError('');
        const endpoint = editingType === 'job' ? `/api/jobs/${editingItem.id}/` : `/api/internships/${editingItem.id}/`;
        const payload =
            editingType === 'job'
                ? {
                    company: editForm.company,
                    position: editForm.position,
                    location: editForm.location,
                    modality: editForm.modality,
                    employment_type: editForm.employment_type,
                    salary: editForm.salary || '',
                    email: editForm.email,
                    start_date: editForm.start_date || null,
                    end_date: editForm.end_date || null,
                    description: editForm.description,
                }
                : {
                    company: editForm.company,
                    position: editForm.position,
                    location: editForm.location,
                    modality: editForm.modality,
                    allowance: editForm.allowance || '',
                    email: editForm.email,
                    start_date: editForm.start_date || null,
                    end_date: editForm.end_date || null,
                    description: editForm.description,
                };
        api.patch(endpoint, payload)
            .then((res) => {
                if (editingType === 'job') {
                    setJobs((prev) => prev.map((j) => j.id === editingItem.id ? { ...j, ...res.data } : j));
                } else {
                    setInternships((prev) => prev.map((i) => i.id === editingItem.id ? { ...i, ...res.data } : i));
                }
                if (detailsItem?.id === editingItem.id) setDetailsItem((d) => (d ? { ...d, ...res.data } : null));
                closeEdit();
            })
            .catch((err) => {
                const d = err.response?.data;
                if (d?.detail) setEditError(d.detail);
                else if (d && typeof d === 'object') {
                    setEditError(Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' '));
                } else setEditError('Failed to save changes.');
            })
            .finally(() => setSavingEdit(false));
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        try { return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
        catch { return dateStr; }
    };

    const getStatusClass = (status) => {
        if (status === 'approved') return 'approved';
        if (status === 'denied')   return 'denied';
        return 'pending';
    };

    const items     = activeTab === 'jobs' ? jobs : internships;
    const itemType  = activeTab === 'jobs' ? 'job' : 'internship';

    return (
        <div className="jm-page">
            <Header />
            <main className="jm-main">
                <h1 className="jm-title">Job & Internship Management</h1>
                <p className="jm-subtitle">Review, approve, and manage job and internship postings.</p>

                {/* Tabs */}
                <div className="jm-tabs">
                    <button
                        type="button"
                        className={`jm-tab ${activeTab === 'jobs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('jobs')}
                    >
                        Jobs
                        {jobs.filter(j => j.status === 'pending').length > 0 && (
                            <span className="jm-tab-badge">{jobs.filter(j => j.status === 'pending').length}</span>
                        )}
                    </button>
                    <button
                        type="button"
                        className={`jm-tab ${activeTab === 'internships' ? 'active' : ''}`}
                        onClick={() => setActiveTab('internships')}
                    >
                        Internships
                        {internships.filter(i => i.status === 'pending').length > 0 && (
                            <span className="jm-tab-badge">{internships.filter(i => i.status === 'pending').length}</span>
                        )}
                    </button>
                </div>

                <div className="jm-card">
                    {loading && <div className="jm-state">Loading...</div>}
                    {error   && <div className="jm-state jm-error">{error}</div>}
                    {!loading && !error && items.length === 0 && (
                        <div className="jm-state">No {activeTab} yet.</div>
                    )}
                    {!loading && !error && items.length > 0 && (
                        <div className="jm-table-wrap">
                            <table className="jm-table">
                                <thead>
                                    <tr>
                                        <th>POSITION</th>
                                        <th>COMPANY</th>
                                        <th>LOCATION</th>
                                        <th>MODALITY</th>
                                        <th>POSTED BY</th>
                                        <th>DETAILS</th>
                                        <th>STATUS</th>
                                        <th>ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr key={item.id} className={item.is_hidden ? 'jm-row-hidden' : ''}>
                                            <td className="jm-cell-wrap-2">{item.position || '—'}</td>
                                            <td className="jm-cell-wrap-2">{item.company || '—'}</td>
                                            <td className="jm-cell-nowrap">{item.location || '—'}</td>
                                            <td className="jm-cell-nowrap">{item.modality || '—'}</td>
                                            <td className="jm-cell-nowrap">{item.posted_by_name || '—'}</td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="jm-details-link"
                                                    onClick={() => { setDetailsItem(item); setDetailsType(itemType); }}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                            <td>
                                                <span className={`jm-status ${getStatusClass(item.status)}`}>
                                                    {item.is_hidden ? 'Hidden' : item.status}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="jm-actions">
                                                    {item.status === 'pending' && (
                                                        <>
                                                            {showDenyInput !== item.id && (
                                                                <button
                                                                    type="button"
                                                                    className="jm-approve-btn"
                                                                    onClick={() => handleApprove(item.id, itemType)}
                                                                    disabled={approvingId === item.id}
                                                                >
                                                                    {approvingId === item.id ? '...' : 'Approve'}
                                                                </button>
                                                            )}
                                                            {showDenyInput === item.id ? (
                                                                <div className="jm-deny-block">
                                                                    <textarea
                                                                        placeholder="Reason for denial... (max 140 chars)"
                                                                        value={denyRemarks}
                                                                        onChange={(e) => setDenyRemarks(e.target.value)}
                                                                        maxLength={140}
                                                                        className="jm-deny-textarea"
                                                                    />
                                                                    <div className="jm-deny-actions">
                                                                        <button
                                                                            type="button"
                                                                            className="jm-confirm-btn"
                                                                            onClick={() => handleDeny(item.id, itemType)}
                                                                            disabled={denyingId === item.id}
                                                                        >
                                                                            {denyingId === item.id ? '...' : 'Confirm'}
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="jm-reject-btn"
                                                                            onClick={() => { setShowDenyInput(null); setDenyRemarks(''); }}
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    className="jm-reject-btn"
                                                                    onClick={() => setShowDenyInput(item.id)}
                                                                >
                                                                    Deny
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                    {item.status !== 'pending' && (
                                                        <>
                                                            {item.status === 'approved' && (
                                                                <SplitDropdown
                                                                    item={item}
                                                                    onEdit={() => openEdit(item, itemType)}
                                                                    onToggleHide={() => handleToggleHide(item.id, itemType, item.is_hidden)}
                                                                    onDelete={() => handleDelete(item.id, itemType)}
                                                                    togglingId={togglingId}
                                                                    deletingId={deletingId}
                                                                />
                                                            )}
                                                            {item.status === 'denied' && (
                                                                <button
                                                                    type="button"
                                                                    className="jm-delete-btn"
                                                                    onClick={() => handleDelete(item.id, itemType)}
                                                                    disabled={deletingId === item.id}
                                                                >
                                                                    {deletingId === item.id ? '...' : 'Delete'}
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="jm-back">
                    <Link to="/dashboard" className="jm-back-link">← Back to Dashboard</Link>
                    <Link to="/dashboard/jobs/create" className="jm-back-link jm-create-link">Create Job / Internship</Link>
                </div>

                {/* View Details Modal */}
                {detailsItem && (
                    <div className="jm-modal-overlay" onClick={() => setDetailsItem(null)}>
                        <div className="jm-modal" onClick={(e) => e.stopPropagation()}>
                            <h2 className="jm-modal-title">
                                {detailsType === 'job' ? 'Job' : 'Internship'} Details
                            </h2>
                            <div className="jm-details-content">
                                {[
                                    ['Position',       detailsItem.position],
                                    ['Company',        detailsItem.company],
                                    ['Location',       detailsItem.location],
                                    ['Modality',       detailsItem.modality],
                                    detailsType === 'job'
                                        ? ['Employment Type', detailsItem.employment_type]
                                        : ['Allowance',       detailsItem.allowance || '—'],
                                    detailsType === 'job'
                                        ? ['Salary',          detailsItem.salary || '—']
                                        : null,
                                    ['Email',          detailsItem.email],
                                    ['Start Date',     formatDate(detailsItem.start_date)],
                                    ['End Date',       formatDate(detailsItem.end_date)],
                                    ['Posted By',      detailsItem.posted_by_name],
                                    ['Date Posted',    formatDate(detailsItem.created_at)],
                                ].filter(Boolean).map(([label, value]) => (
                                    <div key={label} className="jm-details-row">
                                        <span className="jm-details-label">{label}</span>
                                        <span className="jm-details-value">{value || '—'}</span>
                                    </div>
                                ))}
                                <div className="jm-details-row jm-details-block">
                                    <span className="jm-details-label">Description</span>
                                    <span className="jm-details-value">{detailsItem.description || '—'}</span>
                                </div>
                                {detailsItem.remarks && (
                                    <div className="jm-details-row jm-details-block">
                                        <span className="jm-details-label">Denial Remarks</span>
                                        <span className="jm-details-value jm-remarks">{detailsItem.remarks}</span>
                                    </div>
                                )}
                                <div className="jm-details-row">
                                    <span className="jm-details-label">Status</span>
                                    <span className={`jm-status ${getStatusClass(detailsItem.status)}`}>
                                        {detailsItem.is_hidden ? 'Hidden' : detailsItem.status}
                                    </span>
                                </div>
                            </div>
                            <div className="jm-modal-actions">
                                <div />
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {(detailsItem.status === 'pending') && (
                                        <button
                                            type="button"
                                            className="jm-modal-details-neutral-btn"
                                            onClick={() => {
                                                setDetailsItem(null);
                                                openEdit(detailsItem, detailsType);
                                            }}
                                        >
                                            Edit
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="jm-modal-details-neutral-btn jm-modal-details-close-deny"
                                        onClick={() => setDetailsItem(null)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {editingItem && (
                    <div className="jm-modal-overlay" onClick={closeEdit}>
                        <div className="jm-modal" onClick={(e) => e.stopPropagation()}>
                            <h2 className="jm-modal-title">Edit {editingType === 'job' ? 'Job' : 'Internship'}</h2>
                            {editError && <div className="jm-state jm-error">{editError}</div>}
                            <div className="jm-details-content" style={{ display: 'grid', gap: '10px' }}>
                                <input className="jm-deny-input" maxLength={140} placeholder="Position" value={editForm.position || ''} onChange={(e) => setEditForm((f) => ({ ...f, position: e.target.value }))} />
                                <input className="jm-deny-input" placeholder="Company" value={editForm.company || ''} onChange={(e) => setEditForm((f) => ({ ...f, company: e.target.value }))} />
                                <input className="jm-deny-input" placeholder="Location" value={editForm.location || ''} onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))} />
                                <select className="jm-deny-input" value={editForm.modality || ''} onChange={(e) => setEditForm((f) => ({ ...f, modality: e.target.value }))}>
                                    <option value="">Select modality</option>
                                    <option value="On-site">On-site</option>
                                    <option value="Remote">Remote</option>
                                    <option value="Hybrid">Hybrid</option>
                                </select>
                                {editingType === 'job' ? (
                                    <>
                                        <select className="jm-deny-input" value={editForm.employment_type || ''} onChange={(e) => setEditForm((f) => ({ ...f, employment_type: e.target.value }))}>
                                            <option value="">Select employment type</option>
                                            <option value="Full-time">Full-time</option>
                                            <option value="Part-time">Part-time</option>
                                            <option value="Contract">Contract</option>
                                            <option value="Freelance">Freelance</option>
                                        </select>
                                        <input className="jm-deny-input" placeholder="Salary (optional)" value={editForm.salary || ''} onChange={(e) => setEditForm((f) => ({ ...f, salary: e.target.value }))} />
                                    </>
                                ) : (
                                    <input className="jm-deny-input" placeholder="Allowance (optional)" value={editForm.allowance || ''} onChange={(e) => setEditForm((f) => ({ ...f, allowance: e.target.value }))} />
                                )}
                                <input className="jm-deny-input" type="email" placeholder="Contact email" value={editForm.email || ''} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
                                <div className="jm-deny-inline">
                                    <input className="jm-deny-input" type="date" value={editForm.start_date || ''} onChange={(e) => setEditForm((f) => ({ ...f, start_date: e.target.value }))} />
                                    <input className="jm-deny-input" type="date" value={editForm.end_date || ''} onChange={(e) => setEditForm((f) => ({ ...f, end_date: e.target.value }))} />
                                </div>
                                <textarea className="jm-deny-input" rows={4} placeholder="Description" value={editForm.description || ''} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
                            </div>
                            <div className="jm-modal-actions">
                                <button type="button" className="jm-modal-close btn btn-close" onClick={closeEdit}>Cancel</button>
                                <button type="button" className="jm-approve-btn btn btn-edit" onClick={handleEditSave} disabled={savingEdit}>
                                    {savingEdit ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </main>
            <Footer />
        </div>
    );
}

export default JobManagement;