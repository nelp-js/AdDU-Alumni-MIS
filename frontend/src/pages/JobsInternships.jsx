import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/Opportunities.css';
import { useTitle } from '../Hooks/useTitle';

function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

const PAGE_SIZE = 20;

function JobsInternships() {
    useTitle('Jobs & Internships');
    const navigate = useNavigate();
    const [tab, setTab] = useState('jobs');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [modality, setModality] = useState('');
    const [ordering, setOrdering] = useState('newest');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 350);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        setLoading(true);
        setError('');
        const endpoint = tab === 'jobs' ? '/api/jobs/' : '/api/internships/';

        api.get(endpoint, {
            params: {
                page,
                page_size: PAGE_SIZE,
                q: search || undefined,
                modality: modality || undefined,
                ordering,
            },
        })
            .then((res) => {
                if (Array.isArray(res.data)) {
                    setItems(res.data);
                    setTotalPages(1);
                    return;
                }
                const payload = res.data || {};
                setItems(Array.isArray(payload.results) ? payload.results : []);
                setTotalPages(Math.max(1, Number(payload.total_pages) || 1));
            })
            .catch(() => setError('Failed to load opportunities.'))
            .finally(() => setLoading(false));
    }, [tab, page, search, modality, ordering]);

    return (
        <div className="opp-page">
            <Header />
            <main className="opp-main jobs-main">
                <section className="jobs-hero">
                    <h1 className="opp-title">Jobs & Internships</h1>
                    <p className="opp-subtitle">Browse approved opportunities from alumni and partners.</p>
                </section>

                <div className="opp-toolbar">
                    <div className="opp-search-pill">
                        <input
                            type="text"
                            className="opp-search-input"
                            placeholder="Search"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                        {searchInput && (
                            <button
                                type="button"
                                className="opp-search-clear"
                                onClick={() => {
                                    setSearchInput('');
                                    setSearch('');
                                    setPage(1);
                                }}
                                aria-label="Clear search"
                            >
                                ×
                            </button>
                        )}
                        <button
                            type="button"
                            className="opp-search-button"
                            onClick={() => {
                                setSearch(searchInput.trim());
                                setPage(1);
                            }}
                            aria-label="Search jobs and internships"
                        >
                            <span className="opp-search-icon" aria-hidden="true">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </span>
                        </button>
                    </div>

                    <div className="opp-sort-wrap">
                        <select
                            className="opp-sort-select"
                            value={modality}
                            onChange={(e) => {
                                setModality(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">All modalities</option>
                            <option value="On-site">On-site</option>
                            <option value="Remote">Remote</option>
                            <option value="Hybrid">Hybrid</option>
                        </select>
                    </div>

                    <div className="opp-sort-wrap">
                        <select
                            className="opp-sort-select"
                            value={ordering}
                            onChange={(e) => {
                                setOrdering(e.target.value);
                                setPage(1);
                            }}
                        >
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                        <option value="position_asc">Position A-Z</option>
                        <option value="company_asc">Company A-Z</option>
                        </select>
                    </div>
                </div>

                <div className="opp-tabs-container">
                    <div className="opp-tabs-row">
                        <div className="opp-tabs">
                            <button
                                type="button"
                                className={`opp-tab ${tab === 'jobs' ? 'active' : ''}`}
                                onClick={() => {
                                    setTab('jobs');
                                    setPage(1);
                                }}
                            >
                                Jobs
                            </button>
                            <button
                                type="button"
                                className={`opp-tab ${tab === 'internships' ? 'active' : ''}`}
                                onClick={() => {
                                    setTab('internships');
                                    setPage(1);
                                }}
                            >
                                Internships
                            </button>
                        </div>
                        <button
                            type="button"
                            className="opp-post-job-btn"
                            onClick={() => navigate('/jobs/create')}
                        >
                            Post a Job/Internship
                        </button>
                    </div>
                </div>

                {loading && <div className="opp-state">Loading...</div>}
                {error && <div className="opp-state opp-error">{error}</div>}
                {!loading && !error && items.length === 0 && (
                    <div className="opp-state opp-empty-state">No available results found.</div>
                )}

                {!loading && !error && items.length > 0 && (
                    <div className="opp-grid">
                        {items.map((item) => (
                            <article
                                key={`${tab}-${item.id}`}
                                className="opp-card opp-card-clickable"
                                role="link"
                                tabIndex={0}
                                onClick={() => navigate(`/jobs/${tab}/${item.id}`)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        navigate(`/jobs/${tab}/${item.id}`);
                                    }
                                }}
                            >
                                <h2 className="opp-card-title" title={item.position || ''}>{item.position || '—'}</h2>
                                <p className="opp-card-company">{item.company || '—'}</p>
                                <p className="opp-card-meta">{item.location || '—'} • {item.modality || '—'}</p>
                                <p className="opp-card-meta">
                                    {tab === 'jobs' ? (item.employment_type || 'Not specified') : (item.allowance || 'Not specified')}
                                </p>
                                <p className="opp-card-dates">From {formatDate(item.start_date)} to {formatDate(item.end_date)}</p>
                            </article>
                        ))}
                    </div>
                )}

                {!loading && !error && totalPages > 1 && (
                    <div className="opp-pagination">
                        <button
                            type="button"
                            className="opp-page-btn"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                        >
                            Previous
                        </button>
                        <span className="opp-page-label">Page {page} of {totalPages}</span>
                        <button
                            type="button"
                            className="opp-page-btn"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                        >
                            Next
                        </button>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}

export default JobsInternships;