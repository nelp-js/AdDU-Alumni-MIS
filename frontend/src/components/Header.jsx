import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import '../styles/Layout.css';
import { ACCESS_TOKEN, USER_IS_ADMIN } from '../constants';
import api from '../api';
import { FiInfo, FiLogOut, FiChevronDown } from 'react-icons/fi';

// 👇 IMPORT THE NEW HOOK
import { useNotifications } from '../Hooks/NotificationContext'; 

function Header() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [user, setUser] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    
    // 👇 NEW: Get notifications directly from the global context
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

    const handleProfileClick = () => {
        if (!user) {
            navigate('/login');
        } else {
            setShowDropdown(!showDropdown);
        }
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
                    <a href="#engage">Engage</a>
                    <a href="#support">Support</a>
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
                        <button className="profile-btn header-nav-link" onClick={handleProfileClick}>
                            Profile {user && <FiChevronDown style={{ fontSize: '1.1em' }} />}
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