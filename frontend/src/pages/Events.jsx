import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/Events.css';
import { useTitle } from '../Hooks/useTitle';
import { getOptimizedUrl } from '../utils/imageUtils';

function Events() {
    useTitle('Events');
    const [searchQuery, setSearchQuery] = useState('');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const DEFAULT_EVENT_IMAGE = "https://res.cloudinary.com/dwi7oftcs/image/upload/f_auto,q_auto/v1770564696/media/article_covers/cs_alumni_2_mrrw0h.jpg";

    useEffect(() => {
        api.get('/api/events/')
            .then((res) => setEvents(Array.isArray(res.data) ? res.data : []))
            .catch(() => setError('Unable to load events.'))
            .finally(() => setLoading(false));
    }, []);

    const sortedEvents = [...events].sort((a, b) => {
        const aDate = new Date(a.start_date || a.end_date || 0).getTime();
        const bDate = new Date(b.start_date || b.end_date || 0).getTime();
        return aDate - bDate;
    });

    const filteredEvents = sortedEvents.filter(
        (e) =>
            !searchQuery.trim() ||
            (e.event_name && e.event_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (e.venue && e.venue.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (e.preview_text && e.preview_text.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleFindEvents = (e) => {
        // Keep the button usable, but filtering happens live as you type
        e.preventDefault();
    };

    const getDateParts = (dateStr) => {
        if (!dateStr) return { dayName: '—', dayNum: '—' };
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return { dayName: '—', dayNum: '—' };
            const dayName = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()];
            const dayNum = d.getDate();
            return { dayName, dayNum: String(dayNum) };
        } catch {
            return { dayName: '—', dayNum: '—' };
        }
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const s = String(timeStr);
        const match = s.match(/^(\d{1,2}):(\d{2})/);
        if (!match) return s;
        let h = parseInt(match[1], 10);
        const m = match[2];
        const ampm = h >= 12 ? 'pm' : 'am';
        if (h > 12) h -= 12;
        if (h === 0) h = 12;
        return `${h}:${m} ${ampm}`;
    };

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '';
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
        } catch {
            return '';
        }
    };

    const getDateTimeLine = (event) => {
        const datePart = formatDisplayDate(event.start_date);
        if (!datePart) return '—';
        const parts = [datePart];
        if (event.start_time) parts.push(` at ${formatTime(event.start_time)}`);
        if (event.end_time) parts.push(` – ${formatTime(event.end_time)}`);
        return parts.join('');
    };

    const getMonthYear = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '';
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            return `${months[d.getMonth()]} ${d.getFullYear()}`;
        } catch {
            return '';
        }
    };
    
    const monthYearLabel = filteredEvents.length > 0 && filteredEvents[0].start_date
        ? getMonthYear(filteredEvents[0].start_date)
        : null;

    return (
        <div className="events-page">
            <Header />

            <main className="events-main">
                
                <section className="events-hero">
                    {/* 👇 Hardcoded optimized parameters for the static hero image */}
                    <img
                        src="https://res.cloudinary.com/dwi7oftcs/image/upload/w_1200,q_auto,f_auto/v1770564696/media/article_covers/cs_alumni_2_mrrw0h.jpg"
                        alt="Alumni events - interior conference scene"
                        className="events-hero-image"
                    />
                </section>

                <section className="events-search-section">
                    <form className="events-search-box" onSubmit={handleFindEvents}>
                        <input
                            type="search"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="events-search-input"
                            aria-label="Search for events"
                        />
                        <button type="submit" className="events-find-events-btn" aria-label="Search">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="7" />
                                <line x1="16.5" y1="16.5" x2="21" y2="21" />
                            </svg>
                        </button>
                    </form>
                </section>
                
                {monthYearLabel && (
                    <header className="events-month-year-header">
                        <span className="events-month-year-text">{monthYearLabel}</span>
                        <span className="events-month-year-line" aria-hidden />
                    </header>
                )}
                
                <section className="events-list">
                    {loading && <p className="events-list-empty">Loading events…</p>}
                    {error && <p className="events-list-empty">{error}</p>}
                    {!loading && !error && filteredEvents.length === 0 && (
                        <p className="events-list-empty">No available results found.</p>
                    )}
                    
                    {!loading && !error && filteredEvents.length > 0 && filteredEvents.map((event) => {
                        const { dayName, dayNum } = getDateParts(event.start_date);
                        
                        // 👇 USE THE UTILITY HERE
                        // 1. Try to get the optimized Cloudinary URL
                        // 2. If null (no image), fallback to DEFAULT_EVENT_IMAGE
                        const displayImage = getOptimizedUrl(event.event_image, 'card') || DEFAULT_EVENT_IMAGE;

                        return (
                            <Link
                                key={event.id}
                                to={`/events/${event.id}`}
                                className="events-list-item"
                            >
                                <div className="events-list-date">
                                    <span className="events-list-day-name">{dayName}</span>
                                    <span className="events-list-day-num">{dayNum}</span>
                                </div>
                                <div className="events-list-content">
                                    <p className="events-list-datetime">{getDateTimeLine(event)}</p>
                                    <h3 className="events-list-title">{event.event_name || '—'}</h3>
                                    <p className="events-list-location">{event.venue || '—'}</p>
                                    {(event.preview_text || event.event_description) && (
                                        <p className="events-list-description">
                                            {event.preview_text || event.event_description}
                                        </p>
                                    )}
                                </div>
                                <div className="events-list-image-wrap">
                                    <img src={displayImage} alt="" className="events-list-image" />
                                </div>
                            </Link>
                        );
                    })}
                </section>
            </main>

            <Footer />
        </div>
    );
}

export default Events;