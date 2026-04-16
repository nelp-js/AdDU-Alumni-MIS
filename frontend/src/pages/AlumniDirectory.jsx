import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import { useTitle } from '../Hooks/useTitle';
import '../styles/Alumni.css';

function initialsFromName(name = '') {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

function AlumniDirectory() {
    useTitle('Find Alumni');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        setLoading(true);
        setError('');
        api.get('/api/users/public/', {
            params: {
                q: search || undefined,
            },
        })
            .then((res) => setItems(Array.isArray(res.data) ? res.data : []))
            .catch(() => setError('Failed to load alumni directory.'))
            .finally(() => setLoading(false));
    }, [search]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
    };

    return (
        <div className="alumni-page">
            <Header />
            <main className="alumni-main">
                <h1 className="alumni-title">Find Alumni</h1>
                <p className="alumni-subtitle">Search alumni by name, program, graduation year, company, location, or email.</p>

                <section className="alumni-search-section">
                    <form className="alumni-search-pill" onSubmit={handleSearchSubmit}>
                        <input
                            type="search"
                            className="alumni-search-input"
                            placeholder="Search alumni..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            aria-label="Search alumni"
                        />
                        <button type="submit" className="alumni-search-button" aria-label="Search">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="7" />
                                <line x1="16.5" y1="16.5" x2="21" y2="21" />
                            </svg>
                        </button>
                    </form>
                </section>

                {loading && <div className="alumni-state">Loading...</div>}
                {error && <div className="alumni-state alumni-error">{error}</div>}
                {!loading && !error && items.length === 0 && (
                    <div className="alumni-state">No alumni found.</div>
                )}

                {!loading && !error && items.length > 0 && (
                    <div className="alumni-grid">
                        {items.map((alumni) => (
                            <Link key={alumni.id} to={`/alumni/${alumni.id}`} className="alumni-card">
                                {alumni.profile_picture ? (
                                    <img
                                        src={alumni.profile_picture}
                                        alt={alumni.full_name || alumni.username}
                                        className="alumni-avatar"
                                    />
                                ) : (
                                    <div className="alumni-avatar-fallback">
                                        {initialsFromName(alumni.full_name || alumni.username)}
                                    </div>
                                )}
                                <h2 className="alumni-name">{alumni.full_name || alumni.username}</h2>
                                <p className="alumni-meta">
                                    {(alumni.program || 'Program N/A')} {alumni.batch_year ? `· Batch ${alumni.batch_year}` : ''}
                                </p>
                                {alumni.current_job_title && (
                                    <p className="alumni-meta">{alumni.current_job_title}{alumni.current_company ? ` · ${alumni.current_company}` : ''}</p>
                                )}
                                <p className="alumni-meta">{alumni.country || 'Country not specified'}</p>
                                {alumni.email && <p className="alumni-meta">{alumni.email}</p>}
                                {alumni.bio && <p className="alumni-card-bio">{alumni.bio}</p>}
                            </Link>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}

export default AlumniDirectory;
