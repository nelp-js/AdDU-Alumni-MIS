import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();

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
                                        <th>CONTACT EMAIL</th>
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
                                            <td className="jm-cell-nowrap">{item.posted_by_name || 'Guest'}</td>
                                            <td className="jm-cell-nowrap">{item.email || '—'}</td>
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
                                                                    onEdit={() => navigate(`/dashboard/jobs/edit/${itemType}/${item.id}`)}
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
                                <div className="jm-details-grid">
                                    {[
                                        { label: 'Position', value: detailsItem.position },
                                        { label: 'Company', value: detailsItem.company },
                                        { label: 'Location', value: detailsItem.location },
                                        { label: 'Modality', value: detailsItem.modality },
                                        detailsType === 'job'
                                            ? { label: 'Employment Type', value: detailsItem.employment_type }
                                            : { label: 'Allowance', value: detailsItem.allowance || '—' },
                                        detailsType === 'job'
                                            ? { label: 'Salary', value: detailsItem.salary || '—' }
                                            : null,
                                        { label: 'Email', value: detailsItem.email },
                                        { label: 'Start Date', value: formatDate(detailsItem.start_date) },
                                        { label: 'End Date', value: formatDate(detailsItem.end_date) },
                                        { label: 'Posted By', value: detailsItem.posted_by_name },
                                        { label: 'Date Posted', value: formatDate(detailsItem.created_at) },
                                        { label: 'Status', value: detailsItem.is_hidden ? 'Hidden' : detailsItem.status, isStatus: true },
                                    ].filter(Boolean).map((item) => (
                                        <div key={item.label} className="jm-details-item">
                                            <span className="jm-details-label">{item.label}</span>
                                            {item.isStatus ? (
                                                <span className={`jm-status ${getStatusClass(detailsItem.status)}`}>
                                                    {item.value}
                                                </span>
                                            ) : (
                                                <span className="jm-details-value">{item.value || '—'}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
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
                            </div>
                            <div className="jm-modal-actions">
                                <div className="jm-modal-actions-left">
                                    {(detailsItem.status === 'pending') && (
                                        <button
                                            type="button"
                                            className="jm-modal-details-neutral-btn"
                                            onClick={() => {
                                                const id = detailsItem.id;
                                                const kind = detailsType;
                                                setDetailsItem(null);
                                                navigate(`/dashboard/jobs/edit/${kind}/${id}`);
                                            }}
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>
                                <div className="jm-modal-actions-right">
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

            </main>
            <Footer />
        </div>
    );
}

export default JobManagement;