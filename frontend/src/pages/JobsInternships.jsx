import { useEffect, useMemo, useState } from 'react';
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

function JobsInternships() {
    useTitle('Jobs & Internships');
    const [tab, setTab] = useState('jobs');
    const [jobs, setJobs] = useState([]);
    const [internships, setInternships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        Promise.all([api.get('/api/jobs/'), api.get('/api/internships/')])
            .then(([jRes, iRes]) => {
                setJobs(Array.isArray(jRes.data) ? jRes.data : []);
                setInternships(Array.isArray(iRes.data) ? iRes.data : []);
            })
            .catch(() => setError('Failed to load opportunities.'))
            .finally(() => setLoading(false));
    }, []);

    const list = useMemo(() => (tab === 'jobs' ? jobs : internships), [tab, jobs, internships]);

    return (
        <div className="opp-page">
            <Header />
            <main className="opp-main">
                <h1 className="opp-title">Jobs & Internships</h1>
                <p className="opp-subtitle">Browse approved opportunities from alumni and partners.</p>

                <div className="opp-tabs">
                    <button type="button" className={`opp-tab ${tab === 'jobs' ? 'active' : ''}`} onClick={() => setTab('jobs')}>
                        Jobs
                    </button>
                    <button type="button" className={`opp-tab ${tab === 'internships' ? 'active' : ''}`} onClick={() => setTab('internships')}>
                        Internships
                    </button>
                </div>

                {loading && <div className="opp-state">Loading...</div>}
                {error && <div className="opp-state opp-error">{error}</div>}
                {!loading && !error && list.length === 0 && (
                    <div className="opp-state">No {tab} available right now.</div>
                )}

                {!loading && !error && list.length > 0 && (
                    <div className="opp-grid">
                        {list.map((item) => (
                            <article key={`${tab}-${item.id}`} className="opp-card">
                                <h2 className="opp-card-title">{item.position || '—'}</h2>
                                <p className="opp-card-company">{item.company || '—'}</p>
                                <p className="opp-card-meta">{item.location || '—'} · {item.modality || '—'}</p>
                                <p className="opp-card-meta">
                                    {tab === 'jobs' ? (item.employment_type || '—') : (item.allowance || 'Allowance not specified')}
                                </p>
                                <p className="opp-card-dates">From {formatDate(item.start_date)} to {formatDate(item.end_date)}</p>
                                <p className="opp-card-desc">{item.description || '—'}</p>
                                <a className="opp-card-apply" href={`mailto:${item.email}`}>
                                    Apply via email
                                </a>
                            </article>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}

export default JobsInternships;
