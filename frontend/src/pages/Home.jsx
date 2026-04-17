import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/Home.css';
import { useTitle } from '../Hooks/useTitle';
import { ACCESS_TOKEN } from '../constants';
import { getOptimizedUrl } from '../utils/imageUtils';

const MAX_FEATURE = 3;
const DEFAULT_VOLUNTEER_IMAGE = 'https://res.cloudinary.com/dwi7oftcs/image/upload/v1770564696/media/article_covers/cs_alumni_2_mrrw0h.jpg';

// Strips formatting from copy-pasted "Math Bold" text so CSS fonts apply
function cleanText(text) {
    if (!text) return "";
    return text.normalize("NFKD");
}

function formatMoney(n) {
    if (n == null || n === '') return '—';
    const num = Number(n);
    if (Number.isNaN(num)) return '—';
    return '\u20b1' + num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function clampPercent(raised, goal) {
    if (!goal || goal <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((raised / goal) * 100)));
}

function campaignImageSrc(campaign) {
    return campaign?.cover_image || campaign?.image_url || '';
}

function truncateTitle(text, maxChars = 72) {
    const raw = (text || '').trim();
    if (!raw) return '—';
    if (raw.length <= maxChars) return raw;
    return `${raw.slice(0, maxChars).trimEnd()}…`;
}

function Home() {
    useTitle('Home');
    const isLoggedIn = !!localStorage.getItem(ACCESS_TOKEN);
    const [latestArticles, setLatestArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [featuredVolunteers, setFeaturedVolunteers] = useState([]);
    const [featuredCampaigns, setFeaturedCampaigns] = useState([]);
    const [extrasLoaded, setExtrasLoaded] = useState(false);

    useEffect(() => {
        api.get('/api/articles/published/')
            .then((res) => {
                const list = Array.isArray(res.data) ? res.data : [];
                // Sort by approved_at (publish date) descending, fallback to created_at
                const sorted = [...list].sort((a, b) => {
                    const dateA = a.approved_at || a.created_at || '';
                    const dateB = b.approved_at || b.created_at || '';
                    return dateB.localeCompare(dateA);
                });
                setLatestArticles(sorted.slice(0, MAX_FEATURE));
            })
            .catch(() => setLatestArticles([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [vRes, cRes] = await Promise.all([
                    api.get('/api/volunteers/'),
                    api.get('/api/campaigns/', {
                        params: { page: 1, page_size: MAX_FEATURE, ordering: 'newest' },
                    }),
                ]);
                if (cancelled) return;
                const vList = Array.isArray(vRes.data) ? vRes.data : [];
                const sortedVolunteers = [...vList].sort(
                    (a, b) => new Date(a.start_date || 0) - new Date(b.start_date || 0)
                );
                setFeaturedVolunteers(sortedVolunteers.slice(0, MAX_FEATURE));
                const cPayload = cRes.data;
                const cList = Array.isArray(cPayload)
                    ? cPayload
                    : (cPayload?.results || []);
                setFeaturedCampaigns(cList.slice(0, MAX_FEATURE));
            } catch {
                if (!cancelled) {
                    setFeaturedVolunteers([]);
                    setFeaturedCampaigns([]);
                }
            } finally {
                if (!cancelled) setExtrasLoaded(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="home-page">
            <Header />

            <main className="home-main">
                {/* Hero */}
                <section className="home-hero">
                    <h1 className="hero-title">Ad Majorem Dei Gloriam!</h1>
                    <p className="hero-message">
                        Empowered by Fortes in Fide, we strive to inspire, lead, and give back.
                    </p>
                    {!isLoggedIn && (
                        <Link to="/login" className="hero-cta">
                            Reconnect Today
                        </Link>
                    )}
                </section>

                {/* Full-width image */}
                <section className="home-image-section">
                    <img
                        src={getOptimizedUrl('https://res.cloudinary.com/dwi7oftcs/image/upload/v1770416955/bg01_k3q7et.jpg', 'hero')}
                        alt="Ateneo campus"
                        className="home-hero-image"
                    />
                </section>

                {/* Welcome */}
                <section className="home-welcome">
                    <h2 className="welcome-title">WELCOME HOME.</h2>
                    <p className="welcome-subheading">
                        Alumni news, feature stories and live events.
                    </p>
                </section>

                {/* Cards – 3 latest published articles */}
                <section className="home-cards">
                    {loading && (
                        <p className="home-cards-loading">Loading…</p>
                    )}
                    {!loading && latestArticles.length === 0 && (
                        <p className="home-cards-empty">No stories yet.</p>
                    )}
                    {!loading && latestArticles.map((article) => {
                        const imageUrl = getOptimizedUrl(article.cover_image, 'card');
                        const displayTitle = cleanText(article.title || '—');
                        const displaySubtitle = cleanText(article.subtitle || '');
                        return (
                            <Link
                                key={article.id}
                                to={`/stories/${article.id}`}
                                className="home-card"
                            >
                                <div className="home-card-image-wrap">
                                    {imageUrl ? (
                                        <img src={imageUrl} alt={displayTitle} className="home-card-image" />
                                    ) : (
                                        <div className="home-card-image-placeholder" />
                                    )}
                                </div>
                                <div className="home-card-content">
                                    <h3 className="home-card-title">{displayTitle}</h3>
                                    <p className="home-card-description">{displaySubtitle}</p>
                                    <span className="home-card-btn">Read More</span>
                                </div>
                            </Link>
                        );
                    })}
                </section>

                {extrasLoaded && featuredVolunteers.length > 0 && (
                    <div className="home-feature-block">
                        <section className="home-welcome home-welcome--feature">
                            <h2 className="welcome-title">GIVE BACK YOUR TIME.</h2>
                            <p className="welcome-subheading">
                                Volunteer with the alumni community and make a direct impact.
                            </p>
                        </section>
                        <section className="home-cards">
                            {featuredVolunteers.map((item) => {
                                const imageUrl =
                                    getOptimizedUrl(item.cover_photo, 'card') ||
                                    getOptimizedUrl(DEFAULT_VOLUNTEER_IMAGE, 'card');
                                const title = item.title || '—';
                                const blurb = cleanText(item.summary || item.description || '');
                                return (
                                    <Link
                                        key={item.id}
                                        to={`/volunteer/${item.id}`}
                                        className="home-card"
                                    >
                                        <div className="home-card-image-wrap">
                                            {imageUrl ? (
                                                <img src={imageUrl} alt={title} className="home-card-image" />
                                            ) : (
                                                <div className="home-card-image-placeholder" />
                                            )}
                                        </div>
                                        <div className="home-card-content">
                                            <h3 className="home-card-title">{title}</h3>
                                            <p className="home-card-description">{blurb || '—'}</p>
                                            <span className="home-card-btn">Learn More</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </section>
                    </div>
                )}

                {extrasLoaded && featuredCampaigns.length > 0 && (
                    <div className="home-feature-block">
                        <section className="home-welcome home-welcome--feature">
                            <h2 className="welcome-title">GIVE BACK THROUGH SUPPORT.</h2>
                            <p className="welcome-subheading">
                                Explore active campaigns and help move community goals forward.
                            </p>
                        </section>
                        <section className="home-cards">
                            {featuredCampaigns.map((campaign) => {
                                const goal = Number(campaign.goal_amount || 0);
                                const raised = Number(campaign.raised_amount || 0);
                                const pct = clampPercent(raised, goal);
                                const imageSrc = campaignImageSrc(campaign);
                                const imageUrl = imageSrc ? getOptimizedUrl(imageSrc, 'card') : '';
                                const displayTitle = truncateTitle(campaign.title);
                                return (
                                    <Link
                                        key={campaign.id}
                                        to={`/campaigns/${campaign.id}`}
                                        className="home-card home-card--campaign"
                                    >
                                        <div className="home-card-image-wrap">
                                            {imageUrl ? (
                                                <img
                                                    src={imageUrl}
                                                    alt={campaign.title || 'Campaign'}
                                                    className="home-card-image"
                                                />
                                            ) : (
                                                <div className="home-card-image-placeholder" />
                                            )}
                                        </div>
                                        <div className="home-card-content">
                                            <h3 className="home-card-title">{displayTitle}</h3>
                                            <div className="home-card-progress-wrap" aria-hidden>
                                                <div className="home-card-progress-bar">
                                                    <div
                                                        className="home-card-progress-fill"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <p className="home-card-campaign-meta">
                                                {formatMoney(campaign.raised_amount)} raised of{' '}
                                                {formatMoney(campaign.goal_amount)} goal
                                            </p>
                                            <span className="home-card-btn">Show Support</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </section>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}

export default Home;