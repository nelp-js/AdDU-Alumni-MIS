import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import '../styles/Login.css';
import { ACCESS_TOKEN, REFRESH_TOKEN, USER_IS_ADMIN, USER_PROFILE_CACHE } from '../constants';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTitle } from '../Hooks/useTitle';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

function Login() {
    useTitle('Login');

    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    const from = location.state?.from?.pathname || "/";
    const [showInactivityMessage] = useState(() => searchParams.get('inactivity') === '1');

    useEffect(() => {
        if (searchParams.get('inactivity') === '1') {
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showSlowHint, setShowSlowHint] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);

    useEffect(() => {
        if (!loading) {
            setShowSlowHint(false);
            return;
        }
        const t = setTimeout(() => setShowSlowHint(true), 10000);
        return () => clearTimeout(t);
    }, [loading]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.username || !formData.password) {
            setErrors({ general: 'Email/username and password are required.' });
            return;
        }

        setLoading(true);
        setErrors({});

        const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000);

        try {
            const response = await fetch(`${apiBase}/api/token/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            let data;
            try {
                data = await response.json();
            } catch {
                data = { detail: 'Invalid server response.' };
            }

            if (response.ok) {
                localStorage.setItem(ACCESS_TOKEN, data.access);
                localStorage.setItem(REFRESH_TOKEN, data.refresh);

                try {
                    const decoded = jwtDecode(data.access);
                    const isAdmin = Boolean(decoded.is_superuser);
                    localStorage.setItem(USER_IS_ADMIN, isAdmin ? 'true' : 'false');
                } catch {
                    try {
                        const me = await api.get('/api/user/me/');
                        localStorage.setItem(USER_IS_ADMIN, me.data?.is_superuser ? 'true' : 'false');
                    } catch {
                        localStorage.setItem(USER_IS_ADMIN, 'false');
                    }
                }

                api.get('/api/user/me/')
                    .then((me) => {
                        const u = me.data;
                        localStorage.setItem(USER_IS_ADMIN, u?.is_superuser ? 'true' : 'false');
                        try {
                            localStorage.setItem(
                                USER_PROFILE_CACHE,
                                JSON.stringify({
                                    first_name: u.first_name,
                                    last_name: u.last_name,
                                    username: u.username,
                                    email: u.email,
                                })
                            );
                        } catch {
                            /* ignore */
                        }
                    })
                    .catch(() => {});

                navigate(from, { replace: true });

            } else {
                if (response.status === 502 || response.status === 503) {
                    setErrors({ general: 'Server is starting up. Please wait a moment and try again.' });
                } else if (data.detail) {
                    setErrors({ general: data.detail });
                } else {
                    setErrors(data);
                }
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                setErrors({ general: 'Request timed out. The server may be starting up—please try again.' });
            } else {
                setErrors({ general: 'Unable to connect to server. Please check your connection and try again.' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <Header />
            <main className="login-main">
                <div className="login-container">
                    <div className="login-form">
                        <div className="form-logo-section">
                            <img src="https://res.cloudinary.com/dwi7oftcs/image/upload/f_auto,q_auto/v1770416947/addulogo_gexxac.jpg" alt="ADDU Logo" className="form-logo" />
                            <h1 className="form-brand-title">Ateneo Alumni</h1>
                        </div>

                        {showInactivityMessage && (
                            <div className="login-inactivity-message">
                                You were logged out due to inactivity. Please log in again.
                            </div>
                        )}

                        {errors.general && (
                            <div className="error-message">
                                <p>{errors.general}</p>
                            </div>
                        )}

                        <form className="form-fields" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className={errors.username ? 'error' : ''}
                                    placeholder="Email or username"
                                />
                            </div>

                            <div className="form-group">
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={errors.password ? 'error' : ''}
                                        placeholder="Password"
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                <circle cx="12" cy="12" r="3"></circle>
                                            </svg>
                                        ) : (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                <line x1="1" y1="1" x2="23" y2="23"></line>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="submit-btn">
                                {loading ? 'Logging in...' : 'Log in'}
                            </button>
                            {showSlowHint && (
                                <p className="login-slow-hint">Server may be starting up. Please wait—this can take up to a minute.</p>
                            )}

                            <div className="form-links">
                                <a 
                                    href="#" 
                                    className="forgot-password-link"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowForgotModal(true);
                                    }}
                                >
                                    Forgot Password?
                                </a>
                                <p className="register-link">
                                    Don't have an account? <a href="/register">Register here</a>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>

                {showForgotModal && (
                    <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />
                )}
            </main>
            <Footer />
        </div>
    );
}

export default Login;