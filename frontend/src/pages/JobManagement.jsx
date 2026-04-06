import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/JobManagement.css';
import { useTitle } from '../Hooks/useTitle';

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
        const endpoint = type === 'job' ? `/api/jobs/${id}/toggle-hide/` : `/api/internships/${id}/toggle-hide/`;
        api.patch(endpoint)
            .then(() => {
                if (type === 'job') {
                    setJobs((prev) => prev.map((j) => j.id === id ? { ...j, is_hidden: !currentHidden } : j));
                } else {
                    setInternships((prev) => prev.map((i) => i.id === id ? { ...i, is_hidden: !currentHidden } : i));
                }
            })
            .catch(() => {});
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
                                        <th>DETAILS</th>
                                        <th>STATUS</th>
                                        <th>ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr key={item.id} className={item.is_hidden ? 'jm-row-hidden' : ''}>
                                            <td>{item.position || '—'}</td>
                                            <td>{item.company || '—'}</td>
                                            <td>{item.location || '—'}</td>
                                            <td>{item.modality || '—'}</td>
                                            <td>{item.posted_by_name || '—'}</td>
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
                                                            <button
                                                                type="button"
                                                                className="jm-approve-btn"
                                                                onClick={() => handleApprove(item.id, itemType)}
                                                                disabled={approvingId === item.id}
                                                            >
                                                                {approvingId === item.id ? '...' : 'Approve'}
                                                            </button>
                                                            {showDenyInput === item.id ? (
                                                                <div className="jm-deny-inline">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Reason for denial..."
                                                                        value={denyRemarks}
                                                                        onChange={(e) => setDenyRemarks(e.target.value)}
                                                                        className="jm-deny-input"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        className="jm-reject-btn"
                                                                        onClick={() => handleDeny(item.id, itemType)}
                                                                        disabled={denyingId === item.id}
                                                                    >
                                                                        {denyingId === item.id ? '...' : 'Confirm'}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="jm-cancel-deny-btn"
                                                                        onClick={() => { setShowDenyInput(null); setDenyRemarks(''); }}
                                                                    >
                                                                        Cancel
                                                                    </button>
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
                                                            <button
                                                                type="button"
                                                                className="jm-hide-btn"
                                                                onClick={() => handleToggleHide(item.id, itemType, item.is_hidden)}
                                                            >
                                                                {item.is_hidden ? 'Restore' : 'Hide'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="jm-delete-btn"
                                                                onClick={() => handleDelete(item.id, itemType)}
                                                                disabled={deletingId === item.id}
                                                            >
                                                                {deletingId === item.id ? '...' : 'Delete'}
                                                            </button>
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
                                <button
                                    type="button"
                                    className="jm-delete-btn"
                                    onClick={() => handleDelete(detailsItem.id, detailsType)}
                                    disabled={deletingId === detailsItem.id}
                                >
                                    {deletingId === detailsItem.id ? '...' : 'Delete'}
                                </button>
                                <button
                                    type="button"
                                    className="jm-modal-close"
                                    onClick={() => setDetailsItem(null)}
                                >
                                    Close
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