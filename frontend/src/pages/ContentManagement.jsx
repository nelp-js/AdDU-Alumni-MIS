import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/ContentManagement.css';
import '../styles/AdminButtons.css';
import { useTitle } from '../Hooks/useTitle';

/* Split dropdown used for published articles */
function SplitDropdown({ article, onEdit, onToggleHide, onDelete, togglingId, deletingId }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    /* close on outside click */
    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div className="content-mgmt-btn-group" ref={ref}>
            {/* Left: Edit */}
            <button
                type="button"
                className="content-mgmt-split-main"
                onClick={() => { setOpen(false); onEdit(); }}
            >
                Edit
            </button>

            {/* Right: chevron toggle */}
            <button
                type="button"
                className="content-mgmt-split-toggle"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
            >
                ▾
            </button>

            {/* Dropdown menu */}
            {open && (
                <ul className="content-mgmt-dropdown-menu" role="menu">
                    <li>
                        <button
                            type="button"
                            className={`content-mgmt-dropdown-item ${article.is_hidden ? 'item-activate' : 'item-deactivate'}`}
                            onClick={() => { setOpen(false); onToggleHide(); }}
                            disabled={togglingId === article.id}
                        >
                            {togglingId === article.id ? '…' : (article.is_hidden ? 'Activate' : 'Deactivate')}
                        </button>
                    </li>
                    
                    <li>
                        <button
                            type="button"
                            className="content-mgmt-dropdown-item item-delete"
                            onClick={() => { setOpen(false); onDelete(); }}
                            disabled={deletingId === article.id}
                        >
                            {deletingId === article.id ? '…' : 'Delete'}
                        </button>
                    </li>
                </ul>
            )}
        </div>
    );
}

function ContentManagement() {
    useTitle('Manage Content');
    const navigate = useNavigate();
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [publishingId, setPublishingId] = useState(null);
    const [denyingId, setDenyingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [togglingId, setTogglingId] = useState(null);
    const [detailsArticle, setDetailsArticle] = useState(null);
    const [denyRemarks, setDenyRemarks] = useState('');
    const [showDenyInput, setShowDenyInput] = useState(null);

    useEffect(() => {
        api.get('/api/articles/')
            .then((res) => setArticles(res.data))
            .catch(() => setError('Failed to load content.'))
            .finally(() => setLoading(false));
    }, []);

    const formatDate = (isoStr) => {
        if (!isoStr) return '—';
        try {
            return new Date(isoStr).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
            });
        } catch {
            return isoStr;
        }
    };

    const handlePublish = (id) => {
        setPublishingId(id);
        api.post(`/api/articles/${id}/publish/`)
            .then(() => api.get('/api/articles/'))
            .then((res) => setArticles(res.data))
            .catch(() => {})
            .finally(() => setPublishingId(null));
    };

    const handleDeny = (id) => {
        setDenyingId(id);
        api.post(`/api/articles/${id}/deny/`, { remarks: denyRemarks })
            .then(() => api.get('/api/articles/'))
            .then((res) => {
                setArticles(res.data);
                setShowDenyInput(null);
                setDenyRemarks('');
            })
            .catch(() => {})
            .finally(() => setDenyingId(null));
    };

    const handleToggleHide = (id) => {
        setTogglingId(id);
        api.patch(`/api/articles/${id}/toggle-hide/`)
            .then((res) => {
                setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, is_hidden: res.data.is_hidden } : a)));
                if (detailsArticle?.id === id) setDetailsArticle((d) => (d ? { ...d, is_hidden: res.data.is_hidden } : null));
            })
            .catch(() => {})
            .finally(() => setTogglingId(null));
    };

    const getStatusClass = (a) => {
        if (a.status === 'published') return a.is_hidden ? 'denied' : 'published';
        if (a.status === 'denied') return 'denied';
        return 'draft';
    };

    const getStatusLabel = (a) => {
        if (a.status === 'published') return a.is_hidden ? 'Hidden' : 'Published';
        if (a.status === 'denied') return 'Denied';
        return 'Pending';
    };

    const handleDelete = (id) => {
        if (!window.confirm('Delete this article? This cannot be undone.')) return;
        setDeletingId(id);
        api.delete(`/api/articles/delete/${id}/`)
            .then(() => setArticles((prev) => prev.filter((a) => a.id !== id)))
            .catch(() => alert('Failed to delete.'))
            .finally(() => setDeletingId(null));
    };

    return (
        <div className="content-mgmt-page">
            <Header />
            <main className="content-mgmt-main">
                <h1 className="content-mgmt-title">Manage Content</h1>
                <p className="content-mgmt-subtitle">Review, publish, and manage news articles and stories.</p>

                <div className="content-mgmt-card">
                    {loading && <div className="content-mgmt-loading">Loading…</div>}
                    {error && <div className="content-mgmt-error">{error}</div>}
                    {!loading && !error && articles.length === 0 && (
                        <div className="content-mgmt-empty">No content yet.</div>
                    )}
                    {!loading && !error && articles.length > 0 && (
                        <div className="content-mgmt-table-wrap">
                            <table className="content-mgmt-table">
                                <thead>
                                    <tr>
                                        <th>TITLE</th>
                                        <th>AUTHOR</th>
                                        <th>LAST UPDATED</th>
                                        <th>DATE PUBLISHED</th>
                                        <th>STATUS</th>
                                        <th>DETAILS</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {articles.map((a) => (
                                        <tr key={a.id} className={a.is_hidden ? 'content-mgmt-row-hidden' : ''}>
                                            <td className="content-mgmt-cell-title" title={a.title || ''}>
                                                <span className="content-mgmt-cell-title-text">
                                                    {a.title || '—'}
                                                </span>
                                            </td>
                                            <td>{a.author_name || '—'}</td>
                                            <td>{formatDate(a.updated_at)}</td>
                                            <td>{formatDate(a.date_published || a.approved_at)}</td>
                                            <td>
                                                <span className={`content-mgmt-status content-mgmt-status-${getStatusClass(a)}`}>
                                                    {getStatusLabel(a)}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="content-mgmt-details-link"
                                                    onClick={() => setDetailsArticle(a)}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                            <td>
                                                <span className="content-mgmt-actions">

                                                    {/* ── Draft / Pending ── */}
                                                    {a.status === 'draft' && (
                                                        <>
                                                            {showDenyInput === a.id ? (
                                                                <div className="content-mgmt-deny-block">
                                                                    <textarea
                                                                        value={denyRemarks}
                                                                        onChange={(e) => setDenyRemarks(e.target.value)}
                                                                        maxLength={140}
                                                                        placeholder="Reason for denial... (max 140 chars)"
                                                                        className="content-mgmt-deny-textarea"
                                                                    />
                                                                    <div className="content-mgmt-deny-actions">
                                                                        <button
                                                                            type="button"
                                                                            className="content-mgmt-confirm-btn"
                                                                            onClick={() => handleDeny(a.id)}
                                                                            disabled={denyingId === a.id}
                                                                        >
                                                                            {denyingId === a.id ? '…' : 'Confirm'}
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="content-mgmt-deny-confirm-btn"
                                                                            onClick={() => { setShowDenyInput(null); setDenyRemarks(''); }}
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        className="content-mgmt-publish-btn"
                                                                        onClick={() => handlePublish(a.id)}
                                                                        disabled={publishingId === a.id}
                                                                    >
                                                                        {publishingId === a.id ? '…' : 'Publish'}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="content-mgmt-deny-confirm-btn"
                                                                        onClick={() => setShowDenyInput(a.id)}
                                                                    >
                                                                        Deny
                                                                    </button>
                                                                </>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* ── Published — split dropdown ── */}
                                                    {a.status === 'published' && (
                                                        <SplitDropdown
                                                            article={a}
                                                            onEdit={() => navigate(`/dashboard/content/edit/${a.id}`)}
                                                            onToggleHide={() => handleToggleHide(a.id)}
                                                            onDelete={() => handleDelete(a.id)}
                                                            togglingId={togglingId}
                                                            deletingId={deletingId}
                                                        />
                                                    )}

                                                    {/* ── Denied — single delete button ── */}
                                                    {a.status === 'denied' && (
                                                        <button
                                                            type="button"
                                                            className="content-mgmt-delete-btn"
                                                            onClick={() => handleDelete(a.id)}
                                                            disabled={deletingId === a.id}
                                                        >
                                                            {deletingId === a.id ? '…' : 'Delete'}
                                                        </button>
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

                <div className="content-mgmt-back">
                    <Link to="/dashboard" className="content-mgmt-back-link">← Back to Dashboard</Link>
                    <Link to="/dashboard/content/create" className="content-mgmt-back-link content-mgmt-create-link">
                        Create Content
                    </Link>
                </div>

                {/* View Details modal */}
                {detailsArticle && (
                    <div className="content-mgmt-modal-overlay" onClick={() => setDetailsArticle(null)}>
                        <div className="content-mgmt-modal" onClick={(e) => e.stopPropagation()}>
                            <h2 className="content-mgmt-modal-title">Article Details</h2>
                            <div className="content-mgmt-details">
                                <div className="content-mgmt-details-grid">
                                    {[
                                        { label: 'Title', value: detailsArticle.title || '—' },
                                        { label: 'Author', value: detailsArticle.author_name || '—' },
                                        { label: 'Subtitle', value: detailsArticle.subtitle || '—' },
                                        { label: 'Status', value: getStatusLabel(detailsArticle), isStatus: true },
                                        {
                                            label: 'Created',
                                            value: formatDate(detailsArticle.content_created_time || detailsArticle.created_at),
                                        },
                                        {
                                            label: 'Approved',
                                            value: detailsArticle.approved_at ? formatDate(detailsArticle.approved_at) : '—',
                                        },
                                    ].map((item) => (
                                        <div key={item.label} className="content-mgmt-details-item">
                                            <span className="content-mgmt-detail-label">{item.label}</span>
                                            {item.isStatus ? (
                                                <span className={`content-mgmt-status content-mgmt-status-${getStatusClass(detailsArticle)}`}>
                                                    {item.value}
                                                </span>
                                            ) : (
                                                <span className="content-mgmt-detail-value">{item.value}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {detailsArticle.cover_image && (
                                    <div className="content-mgmt-detail-row content-mgmt-detail-block">
                                        <span className="content-mgmt-detail-label">Cover Photo</span>
                                        <img
                                            src={detailsArticle.cover_image}
                                            alt="Cover"
                                            className="content-mgmt-detail-cover"
                                        />
                                    </div>
                                )}
                                {detailsArticle.content && (
                                    <div className="content-mgmt-detail-row content-mgmt-detail-block">
                                        <span className="content-mgmt-detail-label">Content</span>
                                        <div
                                            className="content-mgmt-detail-value content-mgmt-detail-rich"
                                            dangerouslySetInnerHTML={{ __html: detailsArticle.content }}
                                        />
                                    </div>
                                )}
                                {detailsArticle.remarks && (
                                    <div className="content-mgmt-detail-row content-mgmt-detail-block">
                                        <span className="content-mgmt-detail-label">Denial Remarks</span>
                                        <span className="content-mgmt-detail-value">{detailsArticle.remarks}</span>
                                    </div>
                                )}
                            </div>
                            <div className="content-mgmt-modal-actions">
                                <div className="content-mgmt-modal-actions-left">
                                    {detailsArticle.status === 'draft' && (
                                        <button
                                            type="button"
                                            className="content-mgmt-modal-details-neutral-btn"
                                            onClick={() => {
                                                setDetailsArticle(null);
                                                navigate(`/dashboard/content/edit/${detailsArticle.id}`);
                                            }}
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>
                                <div className="content-mgmt-modal-actions-right">
                                    <button
                                        type="button"
                                        className="content-mgmt-modal-details-neutral-btn content-mgmt-modal-details-close-deny"
                                        onClick={() => setDetailsArticle(null)}
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

export default ContentManagement;