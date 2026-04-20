import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import { useTitle } from '../Hooks/useTitle';
import '../styles/CampaignContributors.css';

function CampaignContributors() {
    useTitle('Campaign Contributors');

    const [contributors, setContributors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterCampaign, setFilterCampaign] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    useEffect(() => {
        api.get('/api/campaigns/contributors/all/')
            .then((res) => setContributors(Array.isArray(res.data) ? res.data : []))
            .catch((err) =>
                setError(
                    err.response?.status === 403
                        ? 'Admin access required.'
                        : 'Failed to load contributors.'
                )
            )
            .finally(() => setLoading(false));
    }, []);

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    const formatMoney = (value) => {
        const amount = Number(value || 0);
        return `₱${amount.toLocaleString()}`;
    };

    const getInitials = (first, last) => `${(first || '').charAt(0)}${(last || '').charAt(0)}`.toUpperCase() || '?';

    const normalizeStatus = (status) => {
        if (status === 'paid') return 'success';
        if (status === 'cancelled') return 'failed';
        return status || 'pending';
    };

    const isPlaceholderEmail = (email) => {
        const normalized = String(email || '').trim().toLowerCase();
        return normalized === 'guest@example.com' || normalized === 'donor@example.com';
    };

    const getContributorName = (contributor) => {
        const fullName = `${contributor.first_name || ''} ${contributor.last_name || ''}`.trim();
        if (!fullName) return 'Guest Contributor';
        if (fullName.toLowerCase() === 'guest donor') return 'Guest Contributor';
        return fullName;
    };

    const getContributorEmail = (contributor) => {
        const submittedEmail = String(contributor.email || '').trim();
        if (!submittedEmail || isPlaceholderEmail(submittedEmail)) {
            return 'No email provided';
        }
        return submittedEmail;
    };

    const getContributorType = (contributor) => (contributor.user ? 'Alumni' : 'Guest');

    const campaignNames = useMemo(
        () => [...new Set(contributors.map((c) => c.campaign_title).filter(Boolean))],
        [contributors]
    );

    const filtered = useMemo(
        () =>
            contributors.filter((c) => {
                if (filterCampaign && c.campaign_title !== filterCampaign) return false;
                if (filterStatus && normalizeStatus(c.payment_status) !== filterStatus) return false;
                return true;
            }),
        [contributors, filterCampaign, filterStatus]
    );

    const totalContributions = contributors.length;
    const successCount = contributors.filter((c) => normalizeStatus(c.payment_status) === 'success').length;
    const pendingCount = contributors.filter((c) => normalizeStatus(c.payment_status) === 'pending').length;
    const failedCount = contributors.filter((c) => normalizeStatus(c.payment_status) === 'failed').length;
    const totalRaised = contributors
        .filter((c) => normalizeStatus(c.payment_status) === 'success')
        .reduce((sum, c) => sum + Number(c.amount || 0), 0);

    return (
        <div className="ccg-page">
            <Header />
            <main className="ccg-main">
                <h1 className="ccg-title">Campaign Contributors</h1>
                <p className="ccg-subtitle">All contributions across all campaigns.</p>

                <div className="ccg-metrics">
                    <div className="ccg-metric">
                        <div className="ccg-metric-label">Total Contributions</div>
                        <div className="ccg-metric-value">{totalContributions}</div>
                    </div>
                    <div className="ccg-metric">
                        <div className="ccg-metric-label">Successful Payments</div>
                        <div className="ccg-metric-value ccg-green">{successCount}</div>
                    </div>
                    <div className="ccg-metric">
                        <div className="ccg-metric-label">Pending Payments</div>
                        <div className="ccg-metric-value ccg-amber">{pendingCount}</div>
                    </div>
                    <div className="ccg-metric">
                        <div className="ccg-metric-label">Failed Payments</div>
                        <div className="ccg-metric-value ccg-red">{failedCount}</div>
                    </div>
                    <div className="ccg-metric">
                        <div className="ccg-metric-label">Total Raised</div>
                        <div className="ccg-metric-value">{formatMoney(totalRaised)}</div>
                    </div>
                </div>

                <div className="ccg-card">
                    <div className="ccg-card-header">
                        <span className="ccg-card-title">All contributors</span>
                        <div className="ccg-filters">
                            <select
                                value={filterCampaign}
                                onChange={(e) => setFilterCampaign(e.target.value)}
                                className="ccg-select"
                            >
                                <option value="">All campaigns</option>
                                {campaignNames.map((name) => (
                                    <option key={name} value={name}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="ccg-select"
                            >
                                <option value="">All statuses</option>
                                <option value="pending">Pending</option>
                                <option value="success">Success</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                    </div>

                    {loading && <div className="ccg-state">Loading contributors...</div>}
                    {error && <div className="ccg-state ccg-error">{error}</div>}
                    {!loading && !error && filtered.length === 0 && (
                        <div className="ccg-state">No contributors found.</div>
                    )}

                    {!loading && !error && filtered.length > 0 && (
                        <div className="ccg-table-wrap">
                            <table className="ccg-table">
                                <thead>
                                    <tr>
                                        <th>Contributor</th>
                                        <th>Type</th>
                                        <th>Campaign</th>
                                        <th>Amount</th>
                                        <th>Payment Method</th>
                                        <th>Status</th>
                                        <th>Date and Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((c) => {
                                        const status = normalizeStatus(c.payment_status);
                                        return (
                                            <tr key={c.id}>
                                                <td>
                                                    <div className="ccg-name-cell">
                                                        <div className="ccg-avatar">
                                                            {getInitials(c.first_name, c.last_name)}
                                                        </div>
                                                        <div>
                                                            <div>{getContributorName(c)}</div>
                                                            <div className="ccg-email">{getContributorEmail(c)}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`ccg-type ccg-type-${getContributorType(c).toLowerCase()}`}>
                                                        {getContributorType(c)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="ccg-campaign-tag">
                                                        {c.campaign_title || '—'}
                                                    </span>
                                                </td>
                                                <td className="ccg-amount">{formatMoney(c.amount)}</td>
                                                <td className="ccg-capitalize">{(c.payment_method || '—').replace('_', '/')}</td>
                                                <td>
                                                    <span className={`ccg-badge ccg-badge-${status}`}>
                                                        {status}
                                                    </span>
                                                </td>
                                                <td className="ccg-muted">{formatDateTime(c.donated_at)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="ccg-back">
                    <Link to="/dashboard" className="ccg-back-link">
                        ← Back to Dashboard
                    </Link>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default CampaignContributors;
