import { useEffect, useState } from 'react';
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

function Campaigns() {
    useTitle('Campaigns');
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        api.get('/api/campaigns/')
            .then((res) => setCampaigns(Array.isArray(res.data) ? res.data : []))
            .catch(() => setError('Failed to load campaigns.'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="opp-page">
            <Header />
            <main className="opp-main">
                <h1 className="opp-title">Campaigns</h1>
                <p className="opp-subtitle">Support approved fundraising campaigns from the alumni community.</p>

                {loading && <div className="opp-state">Loading...</div>}
                {error && <div className="opp-state opp-error">{error}</div>}
                {!loading && !error && campaigns.length === 0 && (
                    <div className="opp-state">No active campaigns at the moment.</div>
                )}

                {!loading && !error && campaigns.length > 0 && (
                    <div className="opp-grid">
                        {campaigns.map((campaign) => {
                            const goal = Number(campaign.goal_amount || 0);
                            const raised = Number(campaign.raised_amount || 0);
                            const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
                            return (
                                <article key={campaign.id} className="opp-card">
                                    <h2 className="opp-card-title">{campaign.title || '—'}</h2>
                                    <p className="opp-card-company">{campaign.category || '—'}</p>
                                    <p className="opp-card-meta">Ends on {formatDate(campaign.end_date)}</p>
                                    <p className="opp-card-meta">
                                        Raised {formatMoney(campaign.raised_amount)} / {formatMoney(campaign.goal_amount)}
                                    </p>
                                    <div className="opp-progress">
                                        <div className="opp-progress-bar" style={{ width: `${pct}%` }} />
                                    </div>
                                    <p className="opp-card-meta">{pct}% funded · {campaign.donors_count || 0} donors</p>
                                    <p className="opp-card-desc">{campaign.description || '—'}</p>
                                </article>
                            );
                        })}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}

export default Campaigns;
