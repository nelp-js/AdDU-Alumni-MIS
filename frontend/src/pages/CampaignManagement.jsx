import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/CampaignManagement.css';
import '../styles/AdminButtons.css';
import { useTitle } from '../Hooks/useTitle';

function SplitDropdown({ campaign, onToggleActive, onDelete, togglingId, deletingId }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const nav = useNavigate();

    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div className="campaign-mgmt-btn-group" ref={ref}>
            <button
                type="button"
                className="campaign-mgmt-split-main"
                onClick={() => { setOpen(false); nav(`/dashboard/campaigns/edit/${campaign.id}`); }}
            >
                Edit
            </button>
            <button
                type="button"
                className="campaign-mgmt-split-toggle"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
            >
                ▾
            </button>
            {open && (
                <ul className="campaign-mgmt-dropdown-menu" role="menu">
                    <li>
                        <button
                            type="button"
                            className={`campaign-mgmt-dropdown-item ${campaign.is_active ? 'item-deactivate' : 'item-activate'}`}
                            onClick={() => { setOpen(false); onToggleActive(); }}
                            disabled={togglingId === campaign.id}
                        >
                            {togglingId === campaign.id ? '…' : (campaign.is_active ? 'Deactivate' : 'Activate')}
                        </button>
                    </li>
                    <li>
                        <button
                            type="button"
                            className="campaign-mgmt-dropdown-item item-delete"
                            onClick={() => { setOpen(false); onDelete(); }}
                            disabled={deletingId === campaign.id}
                        >
                            {deletingId === campaign.id ? '…' : 'Delete'}
                        </button>
                    </li>
                </ul>
            )}
        </div>
    );
}

function formatMoney(n) {
    if (n == null || n === '') return '—';
    const num = typeof n === 'string' ? parseFloat(n, 10) : Number(n);
    if (Number.isNaN(num)) return '—';
    return `₱${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function getStatusClass(campaign) {
    const status = campaign.status || 'pending';
    if (status === 'approved') return campaign.is_active ? 'approved' : 'denied';
    if (status === 'denied') return 'denied';
    return 'pending';
}

function getStatusLabel(campaign) {
    const status = campaign.status || 'pending';
    if (status === 'approved') return campaign.is_active ? 'Approved' : 'Hidden';
    if (status === 'denied') return 'Denied';
    return 'Pending';
}

function shouldDimRow(campaign) {
    const status = campaign.status || 'pending';
    if (status === 'denied') return true;
    if (status === 'approved' && !campaign.is_active) return true;
    return false;
}

function CampaignManagement() {
    useTitle('Campaign Management');
    const navigate = useNavigate();

    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [detailsItem, setDetailsItem] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [togglingId, setTogglingId] = useState(null);
    const [approvingId, setApprovingId] = useState(null);
    const [denyingId, setDenyingId] = useState(null);
    const [denyRemarks, setDenyRemarks] = useState('');
    const [showDenyInput, setShowDenyInput] = useState(null);

    const load = () => {
        setLoading(true);
        api.get('/api/campaigns/', { params: { admin: 1 } })
            .then((res) => setCampaigns(Array.isArray(res.data) ? res.data : []))
            .catch(() => setError('Failed to load campaigns.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    const handleToggleActive = (id) => {
        setTogglingId(id);
        api.patch(`/api/campaigns/${id}/toggle-active/`)
            .then((res) => {
                setCampaigns((prev) =>
                    prev.map((c) =>
                        c.id === id ? { ...c, is_active: res.data.is_active } : c
                    )
                );
                if (detailsItem?.id === id) {
                    setDetailsItem((d) => (d ? { ...d, is_active: res.data.is_active } : null));
                }
            })
            .catch(() => {})
            .finally(() => setTogglingId(null));
    };

    const handleApprove = (id) => {
        setApprovingId(id);
        api.post(`/api/campaigns/${id}/approve/`)
            .then(() => {
                setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'approved', remarks: null } : c)));
                if (detailsItem?.id === id) setDetailsItem((d) => (d ? { ...d, status: 'approved', remarks: null } : null));
            })
            .catch(() => {})
            .finally(() => setApprovingId(null));
    };

    const handleDeny = (id) => {
        setDenyingId(id);
        api.post(`/api/campaigns/${id}/deny/`, { remarks: denyRemarks })
            .then(() => {
                setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'denied', remarks: denyRemarks } : c)));
                if (detailsItem?.id === id) setDetailsItem((d) => (d ? { ...d, status: 'denied', remarks: denyRemarks } : null));
                setShowDenyInput(null);
                setDenyRemarks('');
            })
            .catch(() => {})
            .finally(() => setDenyingId(null));
    };

    const handleDelete = (id) => {
        if (!window.confirm('Delete this campaign? This cannot be undone.')) return;
        setDeletingId(id);
        api.delete(`/api/campaigns/${id}/`)
            .then(() => {
                setCampaigns((prev) => prev.filter((c) => c.id !== id));
                if (detailsItem?.id === id) setDetailsItem(null);
            })
            .catch(() => alert('Failed to delete campaign.'))
            .finally(() => setDeletingId(null));
    };

    return (
        <div className="campaign-mgmt-page">
            <Header />
            <main className="campaign-mgmt-main">
                <h1 className="campaign-mgmt-title">Campaign Management</h1>
                <p className="campaign-mgmt-subtitle">
                    View, edit, activate or hide fundraising campaigns and track progress.
                </p>

                <div className="campaign-mgmt-card">
                    {loading && <div className="campaign-mgmt-loading">Loading...</div>}
                    {error && <div className="campaign-mgmt-error">{error}</div>}
                    {!loading && !error && campaigns.length === 0 && (
                        <div className="campaign-mgmt-empty">No campaigns yet.</div>
                    )}
                    {!loading && !error && campaigns.length > 0 && (
                        <div className="campaign-mgmt-table-wrap">
                            <table className="campaign-mgmt-table">
                                <thead>
                                    <tr>
                                        <th>TITLE</th>
                                        <th>CATEGORY</th>
                                        <th>GOAL</th>
                                        <th>RAISED</th>
                                        <th>END DATE</th>
                                        <th>STATUS</th>
                                        <th>DETAILS</th>
                                        <th>ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {campaigns.map((c) => (
                                        <tr key={c.id} className={shouldDimRow(c) ? 'campaign-mgmt-row-hidden' : ''}>
                                            {/* Removed manual truncation, CSS handles wrapping now */}
                                            <td>{c.title || '—'}</td>
                                            
                                            <td>{c.category || '—'}</td>
                                            <td>{formatMoney(c.goal_amount)}</td>
                                            <td>{formatMoney(c.raised_amount)}</td>
                                            <td>{formatDate(c.end_date)}</td>
                                            <td>
                                                <span className={`campaign-mgmt-status ${getStatusClass(c)}`}>
                                                    {getStatusLabel(c)}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="campaign-mgmt-details-link"
                                                    onClick={() => setDetailsItem(c)}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                            <td>
                                                <span className="campaign-mgmt-actions">
                                                    {c.status === 'pending' && (
                                                        <>
                                                            {showDenyInput !== c.id && (
                                                                <button
                                                                    type="button"
                                                                    className="campaign-mgmt-approve-btn"
                                                                    onClick={() => handleApprove(c.id)}
                                                                    disabled={approvingId === c.id}
                                                                >
                                                                    {approvingId === c.id ? '...' : 'Approve'}
                                                                </button>
                                                            )}
                                                            {showDenyInput === c.id ? (
                                                                <div className="campaign-mgmt-deny-block">
                                                                    <textarea
                                                                        value={denyRemarks}
                                                                        onChange={(e) => setDenyRemarks(e.target.value)}
                                                                        maxLength={140}
                                                                        placeholder="Reason for denial... (max 140 chars)"
                                                                        className="campaign-mgmt-deny-textarea"
                                                                    />
                                                                    <div className="campaign-mgmt-deny-actions">
                                                                        <button
                                                                            type="button"
                                                                            className="campaign-mgmt-confirm-btn"
                                                                            onClick={() => handleDeny(c.id)}
                                                                            disabled={denyingId === c.id}
                                                                        >
                                                                            {denyingId === c.id ? '...' : 'Confirm'}
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="campaign-mgmt-reject-btn"
                                                                            onClick={() => { setShowDenyInput(null); setDenyRemarks(''); }}
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    className="campaign-mgmt-reject-btn"
                                                                    onClick={() => setShowDenyInput(c.id)}
                                                                >
                                                                    Deny
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                    {c.status !== 'pending' && (
                                                        <>
                                                            {c.status === 'approved' && (
                                                                <SplitDropdown
                                                                    campaign={c}
                                                                    onToggleActive={() => handleToggleActive(c.id)}
                                                                    onDelete={() => handleDelete(c.id)}
                                                                    togglingId={togglingId}
                                                                    deletingId={deletingId}
                                                                />
                                                            )}
                                                            {c.status === 'denied' && (
                                                                <button
                                                                    type="button"
                                                                    className="campaign-mgmt-delete-btn"
                                                                    onClick={() => handleDelete(c.id)}
                                                                    disabled={deletingId === c.id}
                                                                >
                                                                    {deletingId === c.id ? '...' : 'Delete'}
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

                <div className="campaign-mgmt-back">
                    <Link to="/dashboard" className="campaign-mgmt-back-link">
                        ← Back to Dashboard
                    </Link>
                    <Link to="/dashboard/campaigns/contributors" className="campaign-mgmt-back-link campaign-mgmt-create-link">
                        View Contributors
                    </Link>
                    <Link to="/dashboard/donations/create" className="campaign-mgmt-back-link campaign-mgmt-create-link">
                        Create Campaign
                    </Link>
                </div>

                {/* Modals remain structurally identical, just with updated class prefixes */}
                {detailsItem && (
                    <div className="campaign-mgmt-modal-overlay" onClick={() => setDetailsItem(null)}>
                        <div className="campaign-mgmt-modal" onClick={(e) => e.stopPropagation()}>
                            <h2 className="campaign-mgmt-modal-title">Campaign Details</h2>
                            <div className="campaign-mgmt-details-content">
                                <div className="campaign-mgmt-details-grid">
                                    {[
                                        { label: 'Title', value: detailsItem.title },
                                        { label: 'Category', value: detailsItem.category },
                                        { label: 'Goal', value: formatMoney(detailsItem.goal_amount) },
                                        { label: 'Raised', value: formatMoney(detailsItem.raised_amount) },
                                        { label: 'Contributors', value: detailsItem.donors_count ?? '—' },
                                        { label: 'Contributions', value: detailsItem.donations_count ?? '—' },
                                        { label: 'End Date', value: formatDate(detailsItem.end_date) },
                                        { label: 'Created By', value: detailsItem.created_by_name || '—' },
                                        { label: 'Created', value: formatDate(detailsItem.created_at) },
                                        { label: 'Status', value: getStatusLabel(detailsItem), isStatus: true },
                                    ].map((item) => (
                                        <div key={item.label} className="campaign-mgmt-details-item">
                                            <span className="campaign-mgmt-details-label">{item.label}</span>
                                            {item.isStatus ? (
                                                <span className={`campaign-mgmt-status ${getStatusClass(detailsItem)}`}>
                                                    {item.value}
                                                </span>
                                            ) : (
                                                <span className="campaign-mgmt-details-value">{item.value ?? '—'}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {(detailsItem.cover_image || detailsItem.image_url) && (
                                    <div className="campaign-mgmt-details-row campaign-mgmt-details-block">
                                        <span className="campaign-mgmt-details-label">Cover Photo</span>
                                        <img
                                            src={detailsItem.cover_image || detailsItem.image_url}
                                            alt="Cover"
                                            className="campaign-mgmt-details-cover"
                                        />
                                    </div>
                                )}
                                <div className="campaign-mgmt-details-row campaign-mgmt-details-block">
                                    <span className="campaign-mgmt-details-label">Description</span>
                                    <span className="campaign-mgmt-details-value">
                                        {detailsItem.description || '—'}
                                    </span>
                                </div>
                                {detailsItem.remarks && (
                                    <div className="campaign-mgmt-details-row campaign-mgmt-details-block">
                                        <span className="campaign-mgmt-details-label">Denial Remarks</span>
                                        <span className="campaign-mgmt-details-value campaign-mgmt-remarks">{detailsItem.remarks}</span>
                                    </div>
                                )}
                            </div>
                            <div className="campaign-mgmt-modal-actions">
                                <div className="campaign-mgmt-modal-actions-left">
                                    {(!detailsItem.status || detailsItem.status === 'pending') && (
                                        <button
                                            type="button"
                                            className="campaign-mgmt-modal-details-neutral-btn"
                                            onClick={() => {
                                                setDetailsItem(null);
                                                navigate(`/dashboard/campaigns/edit/${detailsItem.id}`);
                                            }}
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>
                                <div className="campaign-mgmt-modal-actions-right">
                                        <button
                                            type="button"
                                            className="campaign-mgmt-modal-details-neutral-btn campaign-mgmt-modal-details-close-deny"
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

export default CampaignManagement;