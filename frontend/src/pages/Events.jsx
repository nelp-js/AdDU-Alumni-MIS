import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { events } from '../data/eventsData';
import '../styles/Events.css';
import { useTitle } from '../Hooks/useTitle';

function Events() {
    useTitle('Events');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredEvents = events.filter(
        (e) =>
            !searchQuery.trim() ||
            e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (e.location && e.location.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleFindEvents = (e) => {
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

    const getDateTimeLine = (event) => {
        const parts = [event.date];
        if (event.startTime) parts.push(` at ${event.startTime}`);
        if (event.endTime) parts.push(` – ${event.endTime}`);
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

    const monthYearLabel = filteredEvents.length > 0 ? getMonthYear(filteredEvents[0].date) : null;

    return (
        <div className="events-page">
            <Header />

            <main className="events-main">
                {/* Hero banner - cs alumni 2.jpg */}
                <section className="events-hero">
                    <img
                        src="/cs alumni 2.jpg"
                        alt="Alumni events - interior conference scene"
                        className="events-hero-image"
                    />
                </section>

                {/* Search bar - Caltech-style: search input with icon + Find Events button */}
                <section className="events-search-section">
                    <form className="events-search-box" onSubmit={handleFindEvents}>
                        <span className="events-search-icon-wrap" aria-hidden>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </span>
                        <input
                            type="search"
                            placeholder="Search for events"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="events-search-input"
                            aria-label="Search for events"
                        />
                        <button type="submit" className="events-find-events-btn">
                            Find Events
                        </button>
                    </form>
                </section>

                {/* Month & Year header – indicates events below belong to this month */}
                {monthYearLabel && (
                    <header className="events-month-year-header">
                        <span className="events-month-year-text">{monthYearLabel}</span>
                        <span className="events-month-year-line" aria-hidden />
                    </header>
                )}

                {/* Event list: Date | Text content | Image */}
                <section className="events-list">
                    {filteredEvents.length === 0 ? (
                        <p className="events-list-empty">No events match your search.</p>
                    ) : (
                        filteredEvents.map((event) => {
                            const { dayName, dayNum } = getDateParts(event.date);
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
                                        <h3 className="events-list-title">{event.title}</h3>
                                        <p className="events-list-location">{event.location || '—'}</p>
                                        {event.description && (
                                            <p className="events-list-description">{event.description}</p>
                                        )}
                                    </div>
                                    <div className="events-list-image-wrap">
                                        <img src={event.image} alt="" className="events-list-image" />
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </section>
            </main>

            <Footer />
        </div>
    );
}

export default Events;
