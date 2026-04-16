import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/Volunteer.css';
import { useTitle } from '../Hooks/useTitle';
import { getOptimizedUrl } from '../utils/imageUtils';

function Volunteer() {
    useTitle('Volunteer');
    const [searchQuery, setSearchQuery] = useState('');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const defaultImage = getOptimizedUrl('https://res.cloudinary.com/dwi7oftcs/image/upload/v1770564696/media/article_covers/cs_alumni_2_mrrw0h.jpg', 'hero');
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
        'August', 'September', 'October', 'November', 'December'];

    useEffect(() => {
        api.get('/api/volunteers/')
            .then((res) => setItems(Array.isArray(res.data) ? res.data : []))
            .catch(() => setError('Unable to load volunteer opportunities.'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = items.filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (item.title || '').toLowerCase().includes(q) ||
            (item.summary || '').toLowerCase().includes(q) ||
            (item.description || '').toLowerCase().includes(q) ||
            (item.location || '').toLowerCase().includes(q) ||
            (item.organizer || '').toLowerCase().includes(q) ||
            (item.category || '').toLowerCase().includes(q)
        );
    }).sort((a, b) => new Date(a.start_date || 0) - new Date(b.start_date || 0));

    const groupKey = (dateStr) => {
        if (!dateStr) return 'Unknown';
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return 'Unknown';
        return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    };

    const grouped = filtered.reduce((acc, item) => {
        const key = groupKey(item.start_date);
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});

    const keys = Object.keys(grouped);

    const dateParts = (dateStr) => {
        if (!dateStr) return { dayName: '—', dayNum: '—' };
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return { dayName: '—', dayNum: '—' };
        return {
            dayName: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()],
            dayNum: String(d.getDate()),
        };
    };

    const dateRange = (item) => {
        const start = item.start_date ? new Date(item.start_date).toLocaleDateString() : '—';
        const end = item.end_date ? new Date(item.end_date).toLocaleDateString() : '—';
        return `${start} - ${end}`;
    };

    return (
        <div className="volunteer-page">
            <Header />
            <main className="volunteer-main">
                <section className="volunteer-hero">
                    <img src={defaultImage} alt="Volunteer opportunities" className="volunteer-hero-image" />
                </section>

                <section className="volunteer-search-section">
                    <form className="volunteer-search-box" onSubmit={(e) => e.preventDefault()}>
                        <input
                            type="search"
                            className="volunteer-search-input"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            aria-label="Search volunteer opportunities"
                        />
                        <button type="submit" className="volunteer-find-btn" aria-label="Search">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="7" />
                                <line x1="16.5" y1="16.5" x2="21" y2="21" />
                            </svg>
                        </button>
                    </form>
                </section>

                {loading && <p className="volunteer-list-empty">Loading opportunities...</p>}
                {error && <p className="volunteer-list-empty">{error}</p>}
                {!loading && !error && filtered.length === 0 && (
                    <p className="volunteer-list-empty">No available results found.</p>
                )}

                {!loading && !error && keys.map((monthYear) => (
                    <div key={monthYear}>
                        <header className="volunteer-month-year-header">
                            <span className="volunteer-month-year-text">{monthYear}</span>
                            <span className="volunteer-month-year-line" aria-hidden />
                        </header>
                        <section className="volunteer-list">
                            {grouped[monthYear].map((item) => {
                                const { dayName, dayNum } = dateParts(item.start_date);
                                const image = getOptimizedUrl(item.cover_photo, 'card') || defaultImage;
                                return (
                                    <Link key={item.id} to={`/volunteer/${item.id}`} className="volunteer-list-item">
                                        <div className="volunteer-list-date">
                                            <span className="volunteer-list-day-name">{dayName}</span>
                                            <span className="volunteer-list-day-num">{dayNum}</span>
                                        </div>
                                        <div className="volunteer-list-content">
                                            <p className="volunteer-list-datetime">{dateRange(item)}</p>
                                            <h3 className="volunteer-list-title">{item.title || '—'}</h3>
                                            <p className="volunteer-list-location">{item.location || '—'}</p>
                                            <p className="volunteer-list-description">{item.summary || item.description || '—'}</p>
                                        </div>
                                        <div className="volunteer-list-image-wrap">
                                            <img src={image} alt="" className="volunteer-list-image" />
                                        </div>
                                    </Link>
                                );
                            })}
                        </section>
                    </div>
                ))}
            </main>
            <Footer />
        </div>
    );
}

export default Volunteer;

