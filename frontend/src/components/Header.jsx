import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import '../styles/Layout.css';
import { ACCESS_TOKEN, USER_IS_ADMIN, USER_PROFILE_CACHE } from '../constants';
import api, { clearClientAuthSession } from '../api';
import { FiInfo, FiLogOut, FiChevronDown, FiUser } from 'react-icons/fi';
import { useNotifications } from '../Hooks/NotificationContext';

function readCachedProfile() {
    try {
        const raw = localStorage.getItem(USER_PROFILE_CACHE);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        return parsed;
    } catch {
        return null;
    }
}

function initialAuthFromStorage() {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
        return { user: null, isAdmin: false };
    }
    return {
        user: readCachedProfile(),
        isAdmin: localStorage.getItem(USER_IS_ADMIN) === 'true',
    };
}

function Header() {
    const [{ user, isAdmin }, setAuth] = useState(initialAuthFromStorage);
    /** False until first /api/user/me/ attempt finishes (success or failure). */
    const [authResolved, setAuthResolved] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMoreDropdown, setShowMoreDropdown] = useState(false);
    const moreDropdownRef = useRef(null);
    
    const { notifications } = useNotifications();
    
    const navigate = useNavigate();

    useEffect(() => {
        if (!showMoreDropdown) return;
        const handleOutside = (e) => {
            if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target)) {
                setShowMoreDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, [showMoreDropdown]);

    useEffect(() => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) {
            setAuth({ user: null, isAdmin: false });
            setAuthResolved(true);
            return;
        }

        api.get('/api/user/me/')
            .then((res) => {
                const userData = res.data;
                const adminStatus = Boolean(userData?.is_superuser);
                localStorage.setItem(USER_IS_ADMIN, adminStatus ? 'true' : 'false');
                try {
                    localStorage.setItem(
                        USER_PROFILE_CACHE,
                        JSON.stringify({
                            first_name: userData.first_name,
                            last_name: userData.last_name,
                            username: userData.username,
                            email: userData.email,
                        })
                    );
                } catch {
                    /* ignore quota / private mode */
                }
                setAuth({ user: userData, isAdmin: adminStatus });
            })
            .catch(() => {
                clearClientAuthSession();
                setAuth({ user: null, isAdmin: false });
            })
            .finally(() => setAuthResolved(true));
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
        window.location.reload(); 
    };

    const handleProfileNav = () => {
        setShowDropdown(false);
        navigate('/profile');
    };

    const hasToken = !!localStorage.getItem(ACCESS_TOKEN);
    const sessionPending = hasToken && !user && !authResolved;

    const handleProfileClick = () => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) {
            navigate('/login');
            return;
        }
        if (!user) {
            navigate('/login');
            return;
        }
        setShowDropdown(!showDropdown);
    };

    const getInitials = () => {
        if (!user) return '?';
        const first = (user.first_name || '').trim().charAt(0).toUpperCase();
        const last = (user.last_name || '').trim().charAt(0).toUpperCase();
        if (first && last) return `${first}${last}`;
        if (first) return first;
        if (last) return last;
        return (user.username || '?').charAt(0).toUpperCase();
    };

    return (
        <header className="site-header">
            <div className="header-content">
                <Link to="/" className="header-logo-section">
                    <img src="https://res.cloudinary.com/dwi7oftcs/image/upload/v1770416948/addu-logo-white_y2yroy.png" alt="ADDU Logo" className="header-logo" />
                    <span className="header-title">Ateneo Alumni</span>
                </Link>
                
                <nav className="header-nav">
                    <Link to="/">Home</Link>
                    <Link to="/stories">News &amp; Stories</Link>
                    <Link to="/events">Events</Link>
                    <Link to="/campaigns">Support</Link>
                    <div className="header-more" ref={moreDropdownRef}>
                        <button
                            type="button"
                            className="header-more-btn header-nav-link"
                            onClick={() => setShowMoreDropdown((v) => !v)}
                            aria-expanded={showMoreDropdown}
                        >
                            More
                            <FiChevronDown className={`header-more-chevron ${showMoreDropdown ? 'open' : ''}`} />
                        </button>
                        {showMoreDropdown && (
                            <div className="header-more-menu">
                                <Link to="/jobs" onClick={() => setShowMoreDropdown(false)}>Jobs & Interships</Link>
                                <Link to="/volunteer" onClick={() => setShowMoreDropdown(false)}>Volunteer</Link>
                                <Link to="/alumni" onClick={() => setShowMoreDropdown(false)}>Find an Alumni</Link>
                                <Link to="/" onClick={() => setShowMoreDropdown(false)}>Feedback & Surveys</Link>
                            </div>
                        )}
                    </div>

                    {isAdmin && (
                        <NavLink 
                            to="/dashboard" 
                            className={({ isActive }) => isActive ? 'header-nav-link active' : 'header-nav-link'}
                            style={{ position: 'relative' }} 
                        >
                            Dashboard

                            {notifications.total > 0 && (
                                <span className="header-badge">{notifications.total}</span>
                            )}
                        </NavLink>
                    )}

                    <div className="profile-container">
                        <button
                            type="button"
                            className={`profile-btn header-nav-link ${hasToken ? 'profile-btn-avatar' : ''}`}
                            onClick={handleProfileClick}
                            aria-busy={sessionPending || undefined}
                        >
                            {hasToken ? (
                                <>
                                    <span
                                        className={`profile-initials${sessionPending ? ' profile-initials-pending' : ''}`}
                                    >
                                        {sessionPending ? '…' : getInitials()}
                                    </span>
                                    <FiChevronDown className="profile-chevron" />
                                </>
                            ) : (
                                <>Log In</>
                            )}
                        </button>

                        {showDropdown && user && (
                            <div className="profile-dropdown">
                                <div className="dropdown-info">
                                    <div className="user-fullname" style={{ textTransform: 'capitalize' }}>
                                        {user.first_name} {user.last_name}
                                    </div>
                                    <div className="user-email">{user.email}</div>
                                    <div className="user-username">
                                        <FiInfo className="info-icon" /> {user.username}
                                    </div>
                                </div>
                                <div className="dropdown-divider"></div>
                                <button onClick={handleProfileNav} className="dropdown-item">
                                    <FiUser className="dropdown-icon" /> Profile
                                </button>
                                <div className="dropdown-divider"></div>
                                <button onClick={handleLogout} className="dropdown-logout">
                                    <FiLogOut className="logout-icon" /> Log out
                                </button>
                            </div>
                        )}
                    </div>
                </nav>
            </div>
        </header>
    );
}

export default Header;