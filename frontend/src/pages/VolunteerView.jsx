import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/VolunteerView.css';
import { useTitle } from '../Hooks/useTitle';
import { getOptimizedUrl } from '../utils/imageUtils';
import { ACCESS_TOKEN } from '../constants';
import VolunteerRegistrationModal from '../components/VolunteerRegistrationModal';

function isDatePassed(dateValue) {
    if (!dateValue) return false;
    try {
        const parsed = new Date(`${dateValue}T23:59:59`);
        if (Number.isNaN(parsed.getTime())) return false;
        return parsed.getTime() < Date.now();
    } catch {
        return false;
    }
}

function VolunteerView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [showRegister, setShowRegister] = useState(false);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            setError(true);
            return;
        }
        api.get(`/api/volunteers/${id}/`)
            .then((res) => {
                setItem(res.data);
                setError(false);
            })
            .catch(() => {
                setItem(null);
                setError(true);
            })
            .finally(() => setLoading(false));
    }, [id]);

    useTitle(item ? item.title : 'Volunteer');

    if (loading) {
        return (
            <div className="volunteer-view-page">
                <Header />
                <main className="volunteer-view-main">
                    <p className="volunteer-view-not-found">Loading opportunity...</p>
                    <Link to="/volunteer" className="volunteer-view-back-link">« All Volunteer Opportunities</Link>
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !item) {
        return (
            <div className="volunteer-view-page">
                <Header />
                <main className="volunteer-view-main">
                    <p className="volunteer-view-not-found">Volunteer opportunity not found.</p>
                    <Link to="/volunteer" className="volunteer-view-back-link">« All Volunteer Opportunities</Link>
                </main>
                <Footer />
            </div>
        );
    }

    const imageUrl = getOptimizedUrl(item.cover_photo, 'hero');
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';
    const isLoggedIn = !!localStorage.getItem(ACCESS_TOKEN);
    const hasPassed =
        item.timeline_status === 'Completed' ||
        isDatePassed(item.end_date || item.start_date);

    const buildGoogleCalendarUrl = (volunteer) => {
        if (!volunteer?.start_date) return '#';
        const start = volunteer.start_date.replace(/-/g, '');
        const end = (volunteer.end_date || volunteer.start_date).replace(/-/g, '');
        const title = encodeURIComponent(volunteer.title || '');
        const location = encodeURIComponent(volunteer.location || '');
        const details = encodeURIComponent(volunteer.summary || volunteer.description || '');
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
    };

    const handleRegister = async () => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }
        setShowRegister(true);
    };

    const calendarUrl = buildGoogleCalendarUrl(item);

    return (
        <div className="volunteer-view-page">
            <Header />
            <main className="volunteer-view-main">
                <Link to="/volunteer" className="volunteer-view-all">« All Volunteer Opportunities</Link>
                <h1 className="volunteer-view-title">{item.title}</h1>
                <p className="volunteer-view-date-time">{fmtDate(item.start_date)} - {fmtDate(item.end_date)}</p>

                {imageUrl && (
                    <div className="volunteer-view-banner-wrap">
                        <img src={imageUrl} alt="" className="volunteer-view-banner" />
                    </div>
                )}

                {item.summary && <p className="volunteer-view-tagline">{item.summary}</p>}
                {item.description && <p className="volunteer-view-description">{item.description}</p>}

                {hasPassed ? (
                    <div className="volunteer-view-passed-note">• This event has passed.</div>
                ) : (
                    <>
                        <div className="volunteer-view-actions">
                            <button
                                type="button"
                                className="volunteer-view-btn volunteer-view-btn-register"
                                onClick={handleRegister}
                            >
                                {isLoggedIn ? 'Register' : 'Login to Register'}
                            </button>
                            <a
                                href={calendarUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="volunteer-view-btn volunteer-view-btn-calendar"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                <span>Add to Calendar</span>
                            </a>
                        </div>
                    </>
                )}

                <section className="volunteer-view-info">
                    <div className="volunteer-view-info-col">
                        <h3>DETAILS</h3>
                        <p><strong>Start:</strong> {fmtDate(item.start_date)}</p>
                        <p><strong>End:</strong> {fmtDate(item.end_date)}</p>
                    </div>
                    <div className="volunteer-view-info-col">
                        <h3>LOCATION</h3>
                        <p>{item.location || '—'}</p>
                    </div>
                    <div className="volunteer-view-info-col">
                        <h3>ORGANIZER</h3>
                        <p>{item.organizer || '—'}</p>
                    </div>
                    <div className="volunteer-view-info-col">
                        <h3>CATEGORY</h3>
                        <p>{item.category || '—'}</p>
                    </div>
                </section>
            </main>
            <Footer />
            {showRegister && (
                <VolunteerRegistrationModal
                    item={item}
                    onClose={() => setShowRegister(false)}
                />
            )}
        </div>
    );
}

export default VolunteerView;

