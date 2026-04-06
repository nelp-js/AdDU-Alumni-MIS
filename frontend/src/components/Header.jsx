import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import '../styles/Layout.css';
import { ACCESS_TOKEN, USER_IS_ADMIN } from '../constants';
import api from '../api';
import { FiInfo, FiLogOut, FiChevronDown, FiUser } from 'react-icons/fi';
import { useNotifications } from '../Hooks/NotificationContext'; 

function Header() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [user, setUser] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    
    const { notifications } = useNotifications();
    
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) {
            setIsAdmin(false);
            setUser(null);
            return;
        }

        api.get('/api/user/me/')
            .then((res) => {
                const userData = res.data;
                setUser(userData);
                const adminStatus = Boolean(userData?.is_superuser);
                setIsAdmin(adminStatus);
                localStorage.setItem(USER_IS_ADMIN, adminStatus ? 'true' : 'false');
            })
            .catch(() => {
                setIsAdmin(false);
                setUser(null);
            });
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

    const handleProfileClick = () => {
        if (!user) {
            navigate('/login');
        } else {
            setShowDropdown(!showDropdown);
        }
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
                    <Link to="/jobs">Engage</Link>
                    <Link to="/campaigns">Support</Link>
                    <a href="#volunteer">Volunteer</a>

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
                        <button className={`profile-btn header-nav-link ${user ? 'profile-btn-avatar' : ''}`} onClick={handleProfileClick}>
                            {user ? (
                                <>
                                    <span className="profile-initials">{getInitials()}</span>
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