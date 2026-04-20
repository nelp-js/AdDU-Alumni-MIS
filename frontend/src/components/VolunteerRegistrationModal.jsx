import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import api from '../api';
import '../styles/VolunteerRegistrationModal.css';

function VolunteerRegistrationModal({ item, onClose }) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        api.get('/api/user/me/')
            .then((res) => {
                const user = res.data || {};
                setFirstName(user.first_name || '');
                setLastName(user.last_name || '');
            })
            .catch(() => {});
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!firstName.trim() || !lastName.trim()) {
            setError('Please enter your first and last name.');
            return;
        }

        setError('');
        setIsSubmitting(true);
        try {
            const res = await api.post(`/api/volunteers/${item.id}/register/`);
            setSuccessMessage(res?.data?.detail || 'Successfully registered.');
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (successMessage) {
        return (
            <div className="vrm-overlay" onClick={onClose}>
                <div className="vrm-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="vrm-result">
                        <div className="vrm-result-icon">✓</div>
                        <h2 className="vrm-title">Successfully Registered!</h2>
                        <p className="vrm-result-message">{successMessage}</p>
                        <button type="button" className="vrm-primary-btn" onClick={onClose}>
                            Done
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="vrm-overlay" onClick={onClose}>
            <div className="vrm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="vrm-header">
                    <h2 className="vrm-title">Volunteer Registration</h2>
                    <button type="button" className="vrm-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="vrm-item-info">
                    <h3 className="vrm-item-title">{item.title}</h3>
                    <p className="vrm-item-meta">{item.location || '—'}</p>
                </div>

                <form className="vrm-form" onSubmit={handleSubmit}>
                    {error && <div className="vrm-error">{error}</div>}

                    <div className="vrm-field">
                        <label className="vrm-label">First Name *</label>
                        <input
                            type="text"
                            className="vrm-input"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Enter your first name"
                            required
                        />
                    </div>

                    <div className="vrm-field">
                        <label className="vrm-label">Last Name *</label>
                        <input
                            type="text"
                            className="vrm-input"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Enter your last name"
                            required
                        />
                    </div>

                    <div className="vrm-actions">
                        <button type="button" className="vrm-secondary-btn" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="vrm-primary-btn" disabled={isSubmitting}>
                            {isSubmitting ? 'Registering...' : 'Register'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default VolunteerRegistrationModal;
