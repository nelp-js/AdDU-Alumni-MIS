import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import { useTitle } from '../Hooks/useTitle';
import '../styles/Stories.css';

function formatDate(isoStr) {
    if (!isoStr) return '';
    try {
        return new Date(isoStr).toLocaleDateString(undefined, {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    } catch {
        return isoStr;
    }
}

function Stories() {
    useTitle('News and Stories');
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        api.get('/api/articles/published/')
            .then((res) => setArticles(res.data))
            .catch(() => setError('Failed to load articles.'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="stories-page">
            <Header />
            <main className="stories-main">
                <section className="stories-hero">
                    <h1 className="stories-title">News and Stories</h1>
                    <p className="stories-subtitle">Alumni news, stories, and features from the community.</p>
                </section>

                {loading && <div className="stories-loading">Loading…</div>}
                {error && <div className="stories-error">{error}</div>}
                {!loading && !error && articles.length === 0 && (
                    <div className="stories-empty">No published articles yet.</div>
                )}
                {!loading && !error && articles.length > 0 && (
                    <section className="stories-grid">
                        {articles.map((article) => (
                            <Link
                                key={article.id}
                                to={`/stories/${article.id}`}
                                className="stories-card"
                            >
                                <div className="stories-card-image-wrap">
                                    {article.cover_image ? (
                                        <img
                                            src={article.cover_image}
                                            alt=""
                                            className="stories-card-image"
                                        />
                                    ) : (
                                        <div className="stories-card-image-placeholder" />
                                    )}
                                </div>
                                <h2 className="stories-card-title">{article.title || '—'}</h2>
                                <p className="stories-card-date">
                                    {formatDate(article.approved_at || article.content_created_time || article.created_at)}
                                </p>
                                <p className="stories-card-deck">{article.subtitle || ''}</p>
                            </Link>
                        ))}
                    </section>
                )}
            </main>
            <Footer />
        </div>
    );
}

export default Stories;
