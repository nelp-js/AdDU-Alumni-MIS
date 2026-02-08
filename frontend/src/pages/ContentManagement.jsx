import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/ContentManagement.css';
import { useTitle } from '../Hooks/useTitle';

function ContentManagement() {
    useTitle('Manage Content');
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [publishingId, setPublishingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [detailsArticle, setDetailsArticle] = useState(null);

    useEffect(() => {
        api.get('/api/articles/')
            .then((res) => setArticles(res.data))
            .catch(() => setError('Failed to load content.'))
            .finally(() => setLoading(false));
    }, []);

    const handlePublish = (id) => {
        setPublishingId(id);
        api.post(`/api/articles/${id}/publish/`)
            .then(() => {
                setArticles((prev) =>
                    prev.map((a) => (a.id === id ? { ...a, status: 'published' } : a))
                );
            })
            .catch(() => {})
            .finally(() => setPublishingId(null));
    };

    const handleDelete = (id) => {
        if (!window.confirm('Delete this article? This cannot be undone.')) return;
        setDeletingId(id);
        api.delete(`/api/articles/delete/${id}/`)
            .then(() => setArticles((prev) => prev.filter((a) => a.id !== id)))
            .catch(() => alert('Failed to delete.'))
            .finally(() => setDeletingId(null));
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return dateStr;
        }
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
                                        <th>DATE</th>
                                        <th>STATUS</th>
                                        <th>DETAILS</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {articles.map((a) => (
                                        <tr key={a.id}>
                                            <td className="content-mgmt-cell-title">{a.title || '—'}</td>
                                            <td>{a.author_name || '—'}</td>
                                            <td>{formatDate(a.updated_at)}</td>
                                            <td>
                                                <span className={`content-mgmt-status content-mgmt-status-${a.status}`}>
                                                    {a.status === 'published' ? 'Published' : 'Draft'}
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
                                                    {a.status === 'draft' && (
                                                        <button
                                                            type="button"
                                                            className="content-mgmt-publish-btn"
                                                            onClick={() => handlePublish(a.id)}
                                                            disabled={publishingId === a.id}
                                                        >
                                                            {publishingId === a.id ? '…' : 'Publish'}
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="content-mgmt-delete-btn"
                                                        onClick={() => handleDelete(a.id)}
                                                        disabled={deletingId === a.id}
                                                    >
                                                        {deletingId === a.id ? '…' : 'Delete'}
                                                    </button>
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

                {detailsArticle && (
                    <div className="content-mgmt-modal-overlay" onClick={() => setDetailsArticle(null)}>
                        <div className="content-mgmt-modal" onClick={(e) => e.stopPropagation()}>
                            <h2 className="content-mgmt-modal-title">Article Details</h2>
                            <div className="content-mgmt-details">
                                <div className="content-mgmt-detail-row">
                                    <span className="content-mgmt-detail-label">Title</span>
                                    <span className="content-mgmt-detail-value">{detailsArticle.title || '—'}</span>
                                </div>
                                <div className="content-mgmt-detail-row">
                                    <span className="content-mgmt-detail-label">Author</span>
                                    <span className="content-mgmt-detail-value">{detailsArticle.author_name || '—'}</span>
                                </div>
                                {detailsArticle.subtitle && (
                                    <div className="content-mgmt-detail-row content-mgmt-detail-block">
                                        <span className="content-mgmt-detail-label">Subtitle</span>
                                        <span className="content-mgmt-detail-value">{detailsArticle.subtitle}</span>
                                    </div>
                                )}
                                {detailsArticle.cover_image && (
                                    <div className="content-mgmt-detail-row">
                                        <span className="content-mgmt-detail-label">Cover</span>
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
                                            className="content-mgmt-detail-html"
                                            dangerouslySetInnerHTML={{ __html: detailsArticle.content }}
                                        />
                                    </div>
                                )}
                                <div className="content-mgmt-detail-row">
                                    <span className="content-mgmt-detail-label">Status</span>
                                    <span className={`content-mgmt-status content-mgmt-status-${detailsArticle.status}`}>
                                        {detailsArticle.status === 'published' ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                            </div>
                            <div className="content-mgmt-modal-actions">
                                <div />
                                <button type="button" className="content-mgmt-modal-close" onClick={() => setDetailsArticle(null)}>
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

export default ContentManagement;
