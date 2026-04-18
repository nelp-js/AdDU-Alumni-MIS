import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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

function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

function getImageSrc(campaign) {
    return campaign?.cover_image || campaign?.image_url || '';
}

function clampPercent(raised, goal) {
    if (!goal || goal <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((raised / goal) * 100)));
}

function CampaignView() {
    useTitle('Campaign Details');
    const navigate = useNavigate();
    const { id } = useParams();
    const [campaign, setCampaign] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError('');
        api.get(`/api/campaigns/public/${id}/`)
            .then((res) => setCampaign(res.data))
            .catch(() => {
                setCampaign(null);
                setError('Failed to load campaign.');
            })
            .finally(() => setLoading(false));
    }, [id]);

    const raised = Number(campaign?.raised_amount || 0);
    const goal = Number(campaign?.goal_amount || 0);
    const pct = clampPercent(raised, goal);

    return (
        <div className="opp-page">
            <Header />
            <main className="opp-main">
                <div className="campaign-route-head">
                    <Link to="/campaigns" className="campaign-route-back">← Back to Campaigns</Link>
                </div>

                {loading && <div className="opp-state">Loading...</div>}
                {error && <div className="opp-state opp-error">{error}</div>}
                {!loading && !error && !campaign && (
                    <div className="opp-state">Campaign not found.</div>
                )}

                {!loading && !error && campaign && (
                    <>
                        <h1 className="campaign-detail-title">{campaign.title || 'Campaign'}</h1>
                        <div className="campaign-detail-layout">
                            <section className="campaign-detail-main">
                                <div className="campaign-detail-media">
                                    {getImageSrc(campaign) ? (
                                        <img
                                            src={getImageSrc(campaign)}
                                            alt={campaign.title || 'Campaign'}
                                            className="campaign-detail-image"
                                        />
                                    ) : (
                                        <div className="campaign-detail-image-fallback" aria-label="No campaign image available" />
                                    )}
                                </div>

                                <div className="campaign-detail-copy">
                                    <h3>About this campaign</h3>
                                    <p>{campaign.description || 'No description provided.'}</p>
                                    <p className="campaign-detail-small">
                                        Category: {campaign.category || '—'} · Ends: {formatDate(campaign.end_date)}
                                    </p>
                                </div>
                            </section>

                            <aside className="campaign-detail-sidebar">
                                <div className="campaign-detail-percent-ring" style={{ '--pct': `${pct}%` }}>
                                    <span>{pct}%</span>
                                </div>
                                <p className="campaign-detail-raised">
                                    {formatMoney(campaign.raised_amount)} raised of {formatMoney(campaign.goal_amount)}
                                </p>
                                <p className="campaign-detail-small">{campaign.donors_count || 0} donations</p>
                                <button
                                    type="button"
                                    className="campaign-detail-donate-now"
                                    onClick={() => navigate(`/campaigns/${campaign.id}/donate`)}
                                >
                                    Give Back Today
                                </button>
                                <button type="button" className="campaign-detail-share-btn">Share</button>
                            </aside>
                        </div>
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
}

export default CampaignView;
