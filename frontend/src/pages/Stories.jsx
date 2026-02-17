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

const CARDS_PER_PAGE = 3;

function cleanText(text) {
    if (!text) return "";
    return text.normalize("NFKD");
}

function Stories() {
    useTitle('News and Stories');
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('none');
    const [currentPage, setCurrentPage] = useState(1);

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
                // 👇 Apply cleanText here too so search works on "bold" text
                const title = cleanText(a.title || '').toLowerCase();
                const subtitle = cleanText(a.subtitle || '').toLowerCase();
                const author = (a.author_name || '').toLowerCase();
                return title.includes(q) || subtitle.includes(q) || author.includes(q);
            })
            : [...articles];

        if (sortBy === 'alphabetical') {
            list.sort((a, b) => cleanText(a.title || '').localeCompare(cleanText(b.title || ''), undefined, { sensitivity: 'base' }));
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

    const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / CARDS_PER_PAGE));
    const paginatedArticles = filteredAndSorted.slice(
        (currentPage - 1) * CARDS_PER_PAGE,
        currentPage * CARDS_PER_PAGE
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, sortBy]);

    const handleSearchSubmit = (e) => {
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
                    <>
                    <section className="home-cards stories-cards">
                        {paginatedArticles.map((article) => {
                            const imageUrl = getOptimizedUrl(article.cover_image, 'card');
                            
                            // 👇 2. Clean the title before rendering
                            const displayTitle = cleanText(article.title || '—');

                            return (
                                <Link
                                    key={article.id}
                                    to={`/stories/${article.id}`}
                                    className="home-card"
                                >
                                    <div className="home-card-image-wrap">
                                        {imageUrl ? (
                                            <img 
                                                src={imageUrl} 
                                                alt={displayTitle} 
                                                className="home-card-image" 
                                            />
                                        ) : (
                                            <div className="home-card-image-placeholder" />
                                        )}
                                    </div>
                                    <div className="home-card-content">
                                        {/* 👇 3. Render cleaned title so CSS fonts apply! */}
                                        <h3 className="home-card-title">{displayTitle}</h3>
                                        <p className="home-card-description">{cleanText(article.subtitle || '')}</p>
														<span className="home-card-btn">Read More</span>
													</div>
											</Link>
										);
									})}
								</section>
								{totalPages > 1 && (
									<nav className="stories-pagination" aria-label="Article pages">
										{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
											<button
												key={page}
												type="button"
												className={`stories-page-btn ${currentPage === page ? 'stories-page-btn-active' : ''}`}
												onClick={() => setCurrentPage(page)}
												aria-current={currentPage === page ? 'page' : undefined}
												aria-label={`Page ${page}`}
											>
												{page}
											</button>
										))}
									</nav>
								)}
								</>
							)}
            </main>
            <Footer />
        </div>
    );
}

export default Stories;