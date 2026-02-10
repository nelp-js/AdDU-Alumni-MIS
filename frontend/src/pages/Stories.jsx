import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import { useTitle } from '../Hooks/useTitle';
import '../styles/Stories.css';
import '../styles/Home.css';
import { getOptimizedUrl } from '../utils/imageUtils';

const SORT_OPTIONS = [
    { value: 'alphabetical', label: 'A–Z' },
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
];

function Stories() {
    useTitle('News and Stories');
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('none'); // UI shows "Sort by", behaves as Newest

    useEffect(() => {
        api.get('/api/articles/published/')
            .then((res) => {
                setArticles(Array.isArray(res.data) ? res.data : []);
            })
            .catch(() => setError('Failed to load articles.'))
            .finally(() => setLoading(false));
    }, []);

    const filteredAndSorted = useMemo(() => {
        const q = (searchQuery || '').trim().toLowerCase();
        let list = q
            ? articles.filter((a) => {
                const title = (a.title || '').toLowerCase();
                const subtitle = (a.subtitle || '').toLowerCase();
                const author = (a.author_name || '').toLowerCase();
                return title.includes(q) || subtitle.includes(q) || author.includes(q);
            })
            : [...articles];

        if (sortBy === 'alphabetical') {
            list.sort((a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' }));
        } else if (sortBy === 'newest' || sortBy === 'none') {
            list.sort((a, b) => {
                const dateA = a.approved_at || a.created_at || '';
                const dateB = b.approved_at || b.created_at || '';
                return dateB.localeCompare(dateA);
            });
        } else if (sortBy === 'oldest') {
            list.sort((a, b) => {
                const dateA = a.approved_at || a.created_at || '';
                const dateB = b.approved_at || b.created_at || '';
                return dateA.localeCompare(dateB);
            });
        }
        return list;
    }, [articles, searchQuery, sortBy]);

    const handleSearchSubmit = (e) => {
        // Keep submit button functional but filtering is live as you type
        e.preventDefault();
    };

    return (
        <div className="stories-page">
            <Header />
            <main className="stories-main">
                <section className="stories-hero">
                    <h1 className="stories-title">News and Stories</h1>
                    <p className="stories-subtitle">Alumni news, stories, and features from the community.</p>
                </section>

                {!loading && !error && articles.length > 0 && (
                    <section className="stories-toolbar">
                        <form className="stories-search-pill" onSubmit={handleSearchSubmit}>
                            <input
                                type="search"
                                placeholder="Search by title, author..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="stories-search-input"
                                aria-label="Search articles"
                            />
                            <button type="submit" className="stories-search-button" aria-label="Search">
                                <span className="stories-search-icon" aria-hidden>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="11" cy="11" r="7" />
                                        <line x1="16.5" y1="16.5" x2="21" y2="21" />
                                    </svg>
                                </span>
                            </button>
                        </form>
                        <div className="stories-sort-wrap">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="stories-sort-select"
                                aria-label="Sort articles"
                            >
                                <option value="none">Sort by</option>
                                {SORT_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </section>
                )}

                {loading && <div className="stories-loading">Loading…</div>}
                {error && <div className="stories-error">{error}</div>}
                {!loading && !error && articles.length === 0 && (
                    <div className="stories-empty">No published articles yet.</div>
                )}
                {!loading && !error && articles.length > 0 && filteredAndSorted.length === 0 && (
                    <div className="stories-empty">No available results found.</div>
                )}
                
                {!loading && !error && filteredAndSorted.length > 0 && (
                    <section className="home-cards stories-cards">
                        {filteredAndSorted.map((article) => {
                            const imageUrl = getOptimizedUrl(article.cover_image, 'card');
                            return (
                                <Link
                                    key={article.id}
                                    to={`/stories/${article.id}`}
                                    className="home-card"
                                >
                                    <div className="home-card-image-wrap">
                                        {imageUrl ? (
                                            <img src={imageUrl} alt="" className="home-card-image" />
                                        ) : (
                                            <div className="home-card-image-placeholder" />
                                        )}
                                    </div>
                                    <div className="home-card-content">
                                        <h3 className="home-card-title">{article.title || '—'}</h3>
                                        <p className="home-card-description">{article.subtitle || ''}</p>
                                        <span className="home-card-btn">Read More</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </section>
                )}
            </main>
            <Footer />
        </div>
    );
}

export default Stories;