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
import { copyTextToClipboard, getCurrentUrl, getSocialShareUrl, shareContent } from '../utils/share';

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
    const [shareMessage, setShareMessage] = useState('');

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
    const shareUrl = getCurrentUrl();
    const facebookShareUrl = getSocialShareUrl('facebook', shareUrl);
    const linkedInShareUrl = getSocialShareUrl('linkedin', shareUrl);

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

    async function handleNativeShare() {
        const result = await shareContent({
            title: item.title || 'Volunteer Opportunity',
            text: item.summary || 'Check out this volunteer opportunity.',
            url: shareUrl,
        });
        if (result?.method === 'native') {
            setShareMessage('Shared.');
        } else if (result?.method === 'clipboard') {
            setShareMessage('Link copied.');
        } else if (!result?.cancelled) {
            setShareMessage('Unable to share right now.');
        }
    }

    async function handleCopyShareLink() {
        try {
            const copied = await copyTextToClipboard(shareUrl);
            setShareMessage(copied ? 'Link copied.' : 'Unable to copy link.');
        } catch {
            setShareMessage('Unable to copy link.');
        }
    }

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
                    <div className="volunteer-view-info-col volunteer-view-share">
                        <h3>SHARE</h3>
                        <div className="volunteer-view-share-icons">
                            <a href={facebookShareUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                            </a>
                            <a href={linkedInShareUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
                            </a>
                            <button type="button" onClick={handleNativeShare} aria-label="Share this volunteer opportunity">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="18" cy="5" r="3" />
                                    <circle cx="6" cy="12" r="3" />
                                    <circle cx="18" cy="19" r="3" />
                                    <line x1="8.6" y1="10.7" x2="15.4" y2="6.3" />
                                    <line x1="8.6" y1="13.3" x2="15.4" y2="17.7" />
                                </svg>
                            </button>
                            <button type="button" onClick={handleCopyShareLink} aria-label="Copy volunteer link">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 5" />
                                    <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 1 0 7.07 7.07L13 19" />
                                </svg>
                            </button>
                        </div>
                        {shareMessage && <p>{shareMessage}</p>}
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

