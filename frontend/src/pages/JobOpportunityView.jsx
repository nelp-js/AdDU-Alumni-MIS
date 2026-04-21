import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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

function buildGmailComposeUrl({ to = '', subject = '', body = '' }) {
    const params = new URLSearchParams({
        view: 'cm',
        fs: '1',
        to,
        su: subject,
        body,
    });
    return `https://mail.google.com/mail/?${params.toString()}`;
}

function JobOpportunityView() {
    useTitle('Opportunity Details');
    const { kind, id } = useParams();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const isJob = kind === 'jobs';
    const endpoint = isJob ? '/api/jobs/' : '/api/internships/';
    const backLabel = isJob ? 'Jobs' : 'Internships';

    useEffect(() => {
        setLoading(true);
        api.get(endpoint)
            .then((res) => {
                const data = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.results) ? res.data.results : []);
                setItems(data);
            })
            .catch(() => setError('Failed to load opportunity.'))
            .finally(() => setLoading(false));
    }, [endpoint]);

    const item = useMemo(
        () => items.find((it) => String(it.id) === String(id)) || null,
        [items, id]
    );

    const recipientEmail = String(item?.email || '').trim();
    const applySubject = item?.position
        ? `Application for ${item.position}`
        : 'Application';
    const applyBody = [
        `Hello ${item?.company || ''},`,
        '',
        `I am interested in applying for the ${item?.position || 'position'} (${isJob ? 'Job' : 'Internship'}).`,
        '',
        'Thank you.',
    ].join('\n');
    const gmailComposeUrl = buildGmailComposeUrl({
        to: recipientEmail,
        subject: applySubject,
        body: applyBody,
    });
    const fallbackMailto = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(applySubject)}&body=${encodeURIComponent(applyBody)}`;

    return (
        <div className="opp-page">
            <Header />
            <main className="opp-main">
                <div className="campaign-route-head">
                    <Link to="/jobs" className="campaign-route-back">← Back to {backLabel}</Link>
                </div>

                {loading && <div className="opp-state">Loading...</div>}
                {error && <div className="opp-state opp-error">{error}</div>}
                {!loading && !error && !item && <div className="opp-state">Opportunity not found.</div>}

                {!loading && !error && item && (
                    <div className="opp-modal opp-modal-page">
                        <h1 className="opp-modal-title">{item.position || '—'}</h1>
                        <p className="opp-modal-company">{item.company || '—'}</p>

                        <div className="opp-modal-grid">
                            <p><strong>Type:</strong> {isJob ? 'Job' : 'Internship'}</p>
                            <p><strong>Location:</strong> {item.location || '—'}</p>
                            <p><strong>Modality:</strong> {item.modality || '—'}</p>
                            <p>
                                <strong>{isJob ? 'Employment Type' : 'Allowance'}:</strong>{' '}
                                {isJob ? (item.employment_type || 'Not specified') : (item.allowance || 'Not specified')}
                            </p>
                            <p><strong>Posting Start Date:</strong> {formatDate(item.start_date)}</p>
                            <p><strong>Posting End Date:</strong> {formatDate(item.end_date)}</p>
                            {!isJob && (
                                <>
                                    <p><strong>Internship Start Date:</strong> {formatDate(item.internship_start_date)}</p>
                                    <p><strong>Internship End Date:</strong> {formatDate(item.internship_end_date)}</p>
                                </>
                            )}
                            <p><strong>Contact Name:</strong> {item.contact_name || '—'}</p>
                            <p><strong>Company Position:</strong> {item.contact_position || '—'}</p>
                            <p><strong>Contact Email:</strong> {item.email || '—'}</p>
                        </div>

                        <div className="opp-modal-description">
                            <h3>About this role</h3>
                            <p>{item.description || 'No description provided.'}</p>
                        </div>

                        <div className="opp-modal-actions">
                            <Link to="/jobs" className="opp-modal-close-link">Close</Link>
                            <a
                                className="opp-card-apply"
                                href={recipientEmail ? gmailComposeUrl : '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                    if (!recipientEmail) {
                                        e.preventDefault();
                                        return;
                                    }
                                    // If popups/new tabs are blocked, use local mail client as fallback.
                                    const opened = window.open(gmailComposeUrl, '_blank', 'noopener,noreferrer');
                                    if (!opened) window.location.href = fallbackMailto;
                                    e.preventDefault();
                                }}
                                aria-disabled={!recipientEmail}
                            >
                                Apply via email
                            </a>
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}

export default JobOpportunityView;
