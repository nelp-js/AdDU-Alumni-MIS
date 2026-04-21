import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/Opportunities.css';
import { useTitle } from '../Hooks/useTitle';

function formatMoney(n) {
    if (n == null || n === '') return '—';
    const num = Number(n);
    if (Number.isNaN(num)) return '—';
    return `₱${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function getImageSrc(campaign) {
    return campaign?.cover_image || campaign?.image_url || '';
}

function clampPercent(raised, goal) {
    if (!goal || goal <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((raised / goal) * 100)));
}

const CATEGORY_OPTIONS = ['Student Aid', 'Infrastructure', 'Research', 'Faculty', 'Community'];
const MAX_CAMPAIGN_TITLE_CHARS = 60;

function truncateText(text, maxChars = MAX_CAMPAIGN_TITLE_CHARS) {
    const raw = (text || '').trim();
    if (!raw) return '—';
    if (raw.length <= maxChars) return raw;
    return `${raw.slice(0, maxChars).trimEnd()}...`;
}

function Campaigns() {
    useTitle('Campaigns');
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
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
        api.get('/api/campaigns/', {
            params: {
                page,
                page_size: 12,
                q: search || undefined,
                category: category || undefined,
            },
        })
            .then((res) => {
                if (Array.isArray(res.data)) {
                    setCampaigns(res.data);
                    setTotalPages(1);
                    return;
                }
                const payload = res.data || {};
                setCampaigns(Array.isArray(payload.results) ? payload.results : []);
                setTotalPages(Math.max(1, Number(payload.total_pages) || 1));
            })
            .catch(() => setError('Failed to load campaigns.'))
            .finally(() => setLoading(false));
    }, [page, search, category]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
    };

    return (
        <div className="opp-page">
            <Header />
            <main className="opp-main campaign-main">
                <section className="campaign-hero">
                    <h1 className="opp-title">Campaigns</h1>
                    <p className="opp-subtitle">Support approved fundraising campaigns from the alumni community.</p>
                </section>
                <section className="campaign-search-toolbar">
                    <form className="campaign-search-pill" onSubmit={handleSearchSubmit}>
                        <input
                            type="text"
                            className="campaign-search-input"
                            placeholder="Search"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            aria-label="Search campaigns"
                        />
                        {searchInput && (
                            <button
                                type="button"
                                className="campaign-search-clear"
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
                        <button type="submit" className="campaign-search-button" aria-label="Search">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="7" />
                                <line x1="16.5" y1="16.5" x2="21" y2="21" />
                            </svg>
                        </button>
                    </form>
                    <div className="campaign-filter-wrap">
                        <select
                            className="campaign-filter-select"
                            value={category}
                            onChange={(e) => {
                                setCategory(e.target.value);
                                setPage(1);
                            }}
                            aria-label="Filter by category"
                        >
                            <option value="">All categories</option>
                            {CATEGORY_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                </section>

                {loading && <div className="opp-state">Loading...</div>}
                {error && <div className="opp-state opp-error">{error}</div>}
                {!loading && !error && campaigns.length === 0 && (
                    <div className="opp-state opp-empty-state">No available results found.</div>
                )}

                {!loading && !error && campaigns.length > 0 && (
                    <div className="campaign-public-grid">
                        {campaigns.map((campaign) => {
                            const goal = Number(campaign.goal_amount || 0);
                            const raised = Number(campaign.raised_amount || 0);
                            const pct = clampPercent(raised, goal);
                            const imageSrc = getImageSrc(campaign);
                            const displayTitle = truncateText(campaign.title);
                            return (
                                <button
                                    key={campaign.id}
                                    type="button"
                                    className="campaign-public-card"
                                    onClick={() => navigate(`/campaigns/${campaign.id}`)}
                                >
                                    <div className="campaign-public-media">
                                        {imageSrc ? (
                                            <img src={imageSrc} alt={campaign.title || 'Campaign'} className="campaign-public-image" />
                                        ) : (
                                            <div className="campaign-public-image-fallback" aria-label="No campaign image available" />
                                        )}
                                    </div>
                                    <h2 className="campaign-public-title" title={campaign.title || ''}>{displayTitle}</h2>
                                    <div className="opp-progress">
                                        <div className="opp-progress-bar" style={{ width: `${pct}%` }} />
                                    </div>
                                    <p className="campaign-public-meta">
                                        {formatMoney(campaign.raised_amount)} raised of {formatMoney(campaign.goal_amount)} goal
                                    </p>
                                </button>
                            );
                        })}
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

export default Campaigns;
