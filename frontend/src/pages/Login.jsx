import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Checks location
import '../styles/Login.css';
import { ACCESS_TOKEN, REFRESH_TOKEN, USER_IS_ADMIN } from '../constants';
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
 
    const from = location.state?.from?.pathname || "/";

    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.username || !formData.password) {
            setErrors({ general: 'Username and password are required.' });
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            const response = await fetch('https://sia-2.onrender.com/api/token/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

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

                navigate(from, { replace: true }); 

            } else {
                console.log('Error details:', data);
                if (data.detail) {
                    setErrors({ general: data.detail });
                } else {
                    setErrors(data);
                }
            }
        } catch (error) {
            setErrors({ general: 'Unable to connect to server.' });
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