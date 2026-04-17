import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/VolunteerManagement.css';
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
        <div className="vm-btn-group" ref={ref}>
            <button type="button" className="vm-split-main" onClick={() => { setOpen(false); onEdit(); }}>
                Edit
            </button>
            <button type="button" className="vm-split-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
                ▾
            </button>
            {open && (
                <ul className="vm-dropdown-menu" role="menu">
                    <li>
                        <button
                            type="button"
                            className={`vm-dropdown-item ${item.is_hidden ? 'item-activate' : 'item-deactivate'}`}
                            onClick={() => { setOpen(false); onToggleHide(); }}
                            disabled={togglingId === item.id}
                        >
                            {togglingId === item.id ? '...' : (item.is_hidden ? 'Activate' : 'Deactivate')}
                        </button>
                    </li>
                    <li>
                        <button
                            type="button"
                            className="vm-dropdown-item item-delete"
                            onClick={() => { setOpen(false); onDelete(); }}
                            disabled={deletingId === item.id}
                        >
                            {deletingId === item.id ? '...' : 'Delete'}
                        </button>
                    </li>
                </ul>
            )}
        </div>
    );
}

function VolunteerManagement() {
    useTitle('Volunteer Management');
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [approvingId, setApprovingId] = useState(null);
    const [denyingId, setDenyingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [togglingId, setTogglingId] = useState(null);
    const [detailsItem, setDetailsItem] = useState(null);
    const [showDenyInput, setShowDenyInput] = useState(null);
    const [denyRemarks, setDenyRemarks] = useState('');

    useEffect(() => {
        api.get('/api/volunteers/admin/')
            .then((res) => setItems(Array.isArray(res.data) ? res.data : []))
            .catch((err) => setError(err.response?.status === 403 ? 'Admin access required.' : 'Failed to load volunteers.'))
            .finally(() => setLoading(false));
    }, []);

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    const getStatusClass = (item) => {
        if (item.status === 'approved') return item.is_hidden ? 'denied' : 'approved';
        if (item.status === 'denied') return 'denied';
        return 'pending';
    };

    const getStatusLabel = (item) => {
        if (item.status === 'approved') return item.is_hidden ? 'Hidden' : 'Approved';
        if (item.status === 'denied') return 'Denied';
        return 'Pending';
    };

    const handleApprove = (id) => {
        setApprovingId(id);
        api.post(`/api/volunteers/${id}/approve/`)
            .then(() => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: 'approved', remarks: null } : it))))
            .catch(() => {})
            .finally(() => setApprovingId(null));
    };

    const handleDeny = (id) => {
        setDenyingId(id);
        api.post(`/api/volunteers/${id}/deny/`, { remarks: denyRemarks })
            .then(() => {
                setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: 'denied', remarks: denyRemarks } : it)));
                setShowDenyInput(null);
                setDenyRemarks('');
            })
            .catch(() => {})
            .finally(() => setDenyingId(null));
    };

    const handleToggleHide = (id) => {
        setTogglingId(id);
        api.patch(`/api/volunteers/${id}/toggle-hide/`)
            .then((res) => {
                setItems((prev) => prev.map((it) => (it.id === id ? { ...it, is_hidden: res.data.is_hidden } : it)));
                if (detailsItem?.id === id) setDetailsItem((prev) => ({ ...prev, is_hidden: res.data.is_hidden }));
            })
            .catch(() => {})
            .finally(() => setTogglingId(null));
    };

    const handleDelete = (id) => {
        if (!window.confirm('Are you sure you want to delete this volunteer opportunity?')) return;
        setDeletingId(id);
        api.delete(`/api/volunteers/${id}/`)
            .then(() => {
                setItems((prev) => prev.filter((it) => it.id !== id));
                if (detailsItem?.id === id) setDetailsItem(null);
            })
            .catch(() => alert('Failed to delete volunteer opportunity.'))
            .finally(() => setDeletingId(null));
    };

    return (
        <div className="vm-page">
            <Header />
            <main className="vm-main">
                <h1 className="vm-title">Volunteer Management</h1>
                <p className="vm-subtitle">Review, approve, and manage volunteer opportunities.</p>

                <div className="vm-card">
                    {loading && <div className="vm-state">Loading...</div>}
                    {error && <div className="vm-state vm-error">{error}</div>}
                    {!loading && !error && items.length === 0 && <div className="vm-state">No volunteer opportunities yet.</div>}

                    {!loading && !error && items.length > 0 && (
                        <div className="vm-table-wrap">
                            <table className="vm-table">
                                <thead>
                                    <tr>
                                        <th>TITLE</th>
                                        <th>CATEGORY</th>
                                        <th>LOCATION</th>
                                        <th>ORGANIZER</th>
                                        <th>DATE RANGE</th>
                                        <th>DETAILS</th>
                                        <th>STATUS</th>
                                        <th>ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr key={item.id} className={item.is_hidden ? 'vm-row-hidden' : ''}>
                                            <td className="vm-cell-wrap-2">{item.title || '—'}</td>
                                            <td className="vm-cell-nowrap">{item.category || '—'}</td>
                                            <td className="vm-cell-nowrap">{item.location || '—'}</td>
                                            <td className="vm-cell-nowrap">{item.organizer || '—'}</td>
                                            <td className="vm-cell-nowrap">{formatDate(item.start_date)} - {formatDate(item.end_date)}</td>
                                            <td>
                                                <button type="button" className="vm-details-link" onClick={() => setDetailsItem(item)}>
                                                    View Details
                                                </button>
                                            </td>
                                            <td>
                                                <span className={`vm-status ${getStatusClass(item)}`}>{getStatusLabel(item)}</span>
                                            </td>
                                            <td>
                                                <span className="vm-actions">
                                                    {item.status === 'pending' && (
                                                        <>
                                                            {showDenyInput !== item.id && (
                                                                <button type="button" className="vm-approve-btn" onClick={() => handleApprove(item.id)} disabled={approvingId === item.id}>
                                                                    {approvingId === item.id ? '...' : 'Approve'}
                                                                </button>
                                                            )}
                                                            {showDenyInput === item.id ? (
                                                                <div className="vm-deny-block">
                                                                    <textarea
                                                                        value={denyRemarks}
                                                                        onChange={(e) => setDenyRemarks(e.target.value)}
                                                                        maxLength={140}
                                                                        placeholder="Reason for denial... (max 140 chars)"
                                                                        className="vm-deny-textarea"
                                                                    />
                                                                    <div className="vm-deny-actions">
                                                                        <button type="button" className="vm-confirm-btn" onClick={() => handleDeny(item.id)} disabled={denyingId === item.id}>
                                                                            {denyingId === item.id ? '...' : 'Confirm'}
                                                                        </button>
                                                                        <button type="button" className="vm-reject-btn" onClick={() => { setShowDenyInput(null); setDenyRemarks(''); }}>
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <button type="button" className="vm-reject-btn" onClick={() => setShowDenyInput(item.id)}>
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
                                                                onEdit={() => navigate(`/dashboard/volunteer/edit/${item.id}`)}
                                                                    onToggleHide={() => handleToggleHide(item.id)}
                                                                    onDelete={() => handleDelete(item.id)}
                                                                    togglingId={togglingId}
                                                                    deletingId={deletingId}
                                                                />
                                                            )}
                                                            {item.status === 'denied' && (
                                                                <button type="button" className="vm-delete-btn" onClick={() => handleDelete(item.id)} disabled={deletingId === item.id}>
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

                <div className="vm-back">
                    <Link to="/dashboard" className="vm-back-link">← Back to Dashboard</Link>
                    <Link to="/dashboard/volunteer/create" className="vm-back-link vm-create-link">Create Volunteer Opportunity</Link>
                </div>

                {detailsItem && (
                    <div className="vm-modal-overlay" onClick={() => setDetailsItem(null)}>
                        <div className="vm-modal" onClick={(e) => e.stopPropagation()}>
                            <h2 className="vm-modal-title">Volunteer Opportunity Details</h2>
                            <div className="vm-details-content">
                                <div className="vm-details-grid">
                                    {[
                                        { label: 'Title', value: detailsItem.title },
                                        { label: 'Category', value: detailsItem.category },
                                        { label: 'Location', value: detailsItem.location },
                                        { label: 'Organizer', value: detailsItem.organizer },
                                        { label: 'Start Date', value: formatDate(detailsItem.start_date) },
                                        { label: 'End Date', value: formatDate(detailsItem.end_date) },
                                        { label: 'Summary', value: detailsItem.summary },
                                        { label: 'Status', value: getStatusLabel(detailsItem), isStatus: true },
                                        { label: 'Created', value: formatDate(detailsItem.created_at) },
                                        { label: 'Updated', value: formatDate(detailsItem.updated_at) },
                                    ].map((item) => (
                                        <div key={item.label} className="vm-details-item">
                                            <span className="vm-details-label">{item.label}</span>
                                            {item.isStatus ? (
                                                <span className={`vm-status ${getStatusClass(detailsItem)}`}>
                                                    {item.value}
                                                </span>
                                            ) : (
                                                <span className="vm-details-value">{item.value || '—'}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {detailsItem.cover_photo && (
                                    <div className="vm-details-row vm-details-block">
                                        <span className="vm-details-label">Cover Photo</span>
                                        <img src={detailsItem.cover_photo} alt="Cover" style={{ maxHeight: '140px', borderRadius: '8px', objectFit: 'cover' }} />
                                    </div>
                                )}

                                <div className="vm-details-row vm-details-block">
                                    <span className="vm-details-label">Description</span>
                                    <span className="vm-details-value">{detailsItem.description || '—'}</span>
                                </div>
                                {detailsItem.remarks && (
                                    <div className="vm-details-row vm-details-block">
                                        <span className="vm-details-label">Denial Remarks</span>
                                        <span className="vm-details-value vm-remarks">{detailsItem.remarks}</span>
                                    </div>
                                )}
                            </div>
                            <div className="vm-modal-actions">
                                <div className="vm-modal-actions-left">
                                    {detailsItem.status === 'pending' && (
                                        <button
                                            type="button"
                                            className="vm-modal-details-neutral-btn"
                                            onClick={() => {
                                                const id = detailsItem.id;
                                                setDetailsItem(null);
                                                navigate(`/dashboard/volunteer/edit/${id}`);
                                            }}
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>
                                <div className="vm-modal-actions-right">
                                    <button type="button" className="vm-modal-details-neutral-btn vm-modal-details-close-deny" onClick={() => setDetailsItem(null)}>
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

export default VolunteerManagement;

