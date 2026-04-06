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
    const DEFAULT_EVENT_IMAGE = getOptimizedUrl('https://res.cloudinary.com/dwi7oftcs/image/upload/v1770564696/media/article_covers/cs_alumni_2_mrrw0h.jpg', 'hero');

    useEffect(() => {
        api.get('/api/events/')
            .then((res) => setEvents(Array.isArray(res.data) ? res.data : []))
            .catch(() => setError('Unable to load events.'))
            .finally(() => setLoading(false));
    }, []);

    const today = new Date().setHours(0, 0, 0, 0);

    // Sort by closest to today first — future/today events first, then past
    const sortedEvents = [...events].sort((a, b) => {
        const aDate = new Date(a.start_date || a.end_date || 0).getTime();
        const bDate = new Date(b.start_date || b.end_date || 0).getTime();
        const aDiff = Math.abs(aDate - today);
        const bDiff = Math.abs(bDate - today);
        // Future events first (ascending from today), past events after
        const aIsFuture = aDate >= today;
        const bIsFuture = bDate >= today;
        if (aIsFuture && !bIsFuture) return -1;
        if (!aIsFuture && bIsFuture) return 1;
        if (aIsFuture && bIsFuture) return aDate - bDate; // nearest future first
        return bDate - aDate; // most recent past first
    });

    const filteredEvents = sortedEvents.filter((e) => {
    if (e.is_hidden) return false;
    if (!e.is_approved) return false;
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();

    return (
        (e.event_name && e.event_name.toLowerCase().includes(query)) ||
        (e.venue && e.venue.toLowerCase().includes(query)) ||
        (e.preview_text && e.preview_text.toLowerCase().includes(query))
    );
});

    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    const getMonthYearKey = (dateStr) => {
        if (!dateStr) return 'Unknown';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return 'Unknown';
            return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
        } catch { return 'Unknown'; }
    };

    // Group events by month/year — order is preserved since filteredEvents is already sorted
    const groupedEvents = filteredEvents.reduce((groups, event) => {
        const key = getMonthYearKey(event.start_date || event.end_date);
        if (!groups[key]) groups[key] = [];
        groups[key].push(event);
        return groups;
    }, {});

    const groupKeys = Object.keys(groupedEvents);

    const handleFindEvents = (e) => { e.preventDefault(); };

    const getDateParts = (dateStr) => {
        if (!dateStr) return { dayName: '—', dayNum: '—' };
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return { dayName: '—', dayNum: '—' };
            return {
                dayName: ['SUN','MON','TUE','WED','THU','FRI','SAT'][d.getDay()],
                dayNum:  String(d.getDate()),
            };
        } catch { return { dayName: '—', dayNum: '—' }; }
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const match = String(timeStr).match(/^(\d{1,2}):(\d{2})/);
        if (!match) return timeStr;
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
            return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
        } catch { return ''; }
    };

    const getDateTimeLine = (event) => {
        const datePart = formatDisplayDate(event.start_date);
        if (!datePart) return '—';
        let line = datePart;
        if (event.start_time) line += ` at ${formatTime(event.start_time)}`;
        if (event.end_time)   line += ` – ${formatTime(event.end_time)}`;
        return line;
    };

    return (
        <div className="events-page">
            <Header />
            <main className="events-main">

                <section className="events-hero">
                    <img
                        src={getOptimizedUrl('https://res.cloudinary.com/dwi7oftcs/image/upload/v1770564696/media/article_covers/cs_alumni_2_mrrw0h.jpg', 'hero')}
                        alt="Alumni events"
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

                {loading && <p className="events-list-empty">Loading events…</p>}
                {error   && <p className="events-list-empty">{error}</p>}
                {!loading && !error && filteredEvents.length === 0 && (
                    <p className="events-list-empty">No available results found.</p>
                )}

                {/* One header + list per month group */}
                {!loading && !error && groupKeys.map((monthYear, groupIndex) => (
                    <div key={monthYear}>
                        <header className="events-month-year-header">
                            <span className="events-month-year-text">{monthYear}</span>
                            <span className="events-month-year-line" aria-hidden />
                        </header>

                        <section className="events-list">
                            {groupedEvents[monthYear].map((event) => {
                                const { dayName, dayNum } = getDateParts(event.start_date);
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
                    </div>
                ))}

            </main>
            <Footer />
        </div>
    );
}

export default Events;