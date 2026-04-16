import { useState } from 'react';
import { X, Users, CreditCard, Smartphone, Wallet } from 'lucide-react';
import '../styles/EventRegistrationModal.css';
import api from '../api';

function EventRegistrationModal({ event, onClose, pricePerGuest = 0 }) {
    const [step, setStep]               = useState('form');
    const [firstName, setFirstName]     = useState('');
    const [lastName, setLastName]       = useState('');
    const [guestCount, setGuestCount]   = useState(0);
    const [guests, setGuests]           = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('gcash');
    const [isProcessing, setIsProcessing]   = useState(false);
    const [error, setError]                 = useState('');
    const [registrationStatus, setRegistrationStatus] = useState('');

    const totalPrice = (1 + guestCount) * pricePerGuest;

    const handleGuestCountChange = (newCount) => {
        setGuestCount(newCount);
        if (newCount < guests.length) {
            setGuests(guests.slice(0, newCount));
        } else if (newCount > guests.length) {
            const newGuests = [...guests];
            for (let i = guests.length; i < newCount; i++) {
                newGuests.push({ firstName: '', lastName: '', relationship: 'friend' });
            }
            setGuests(newGuests);
        }
    };

    const handleGuestChange = (index, field, value) => {
        const newGuests = [...guests];
        newGuests[index] = { ...newGuests[index], [field]: value };
        setGuests(newGuests);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!firstName.trim() || !lastName.trim()) {
            setError('Please enter your first and last name.');
            return;
        }
        setError('');
        setStep('payment');
    };

    const handlePayment = async () => {
        setIsProcessing(true);
        setError('');
        setRegistrationStatus('');
        try {
            const res = await api.post(`/api/events/${event.id}/register/`, {
                first_name:     firstName,
                last_name:      lastName,
                guest_count:    guestCount,
                guests:         guests,
                payment_method: paymentMethod,
                total_amount:   totalPrice,
            });
            const status = res?.data?.payment_status || '';
            setRegistrationStatus(status);
            if (status !== 'success') {
                setError(res?.data?.detail || 'Registration submitted.');
            }
        } catch (err) {
            const msg = err.response?.data?.detail || 'Registration failed. Please try again.';
            setError(msg);
        } finally {
            setIsProcessing(false);
        }
    };

    const paymentOptions = [
        { value: 'gcash', label: 'GCash',             Icon: Smartphone, description: 'Pay via GCash mobile wallet' },
        { value: 'maya',  label: 'Maya',              Icon: Wallet,     description: 'Pay via Maya (formerly PayMaya)' },
        { value: 'card',  label: 'Credit/Debit Card', Icon: CreditCard, description: 'Pay via Visa, Mastercard, or AMEX' },
    ];

    // ── Result screens (success / pending / failed) ─────────────────────────
    if (registrationStatus) {
        const resultConfig = {
            success: {
                icon: '✓',
                title: 'Successfully Registered!',
                message: (
                    <>
                        You are confirmed for <strong>{event.event_name}</strong>.
                        {' '}Your QR code has been sent to your email.
                    </>
                ),
                toneClass: 'erm-result-success',
            },
            pending: {
                icon: '⏳',
                title: 'Registration Submitted',
                message: (
                    <>
                        Your registration for <strong>{event.event_name}</strong> is recorded.
                        {' '}Payment is currently pending.
                    </>
                ),
                toneClass: 'erm-result-pending',
            },
            failed: {
                icon: '!',
                title: 'Registration Submitted',
                message: (
                    <>
                        Your registration for <strong>{event.event_name}</strong> is recorded,
                        but the payment status is <strong>failed</strong>.
                    </>
                ),
                toneClass: 'erm-result-failed',
            },
        };
        const config = resultConfig[registrationStatus] || resultConfig.pending;

        return (
            <div className="erm-overlay" onClick={onClose}>
                <div className="erm-modal" onClick={(e) => e.stopPropagation()}>
                    <div className={`erm-success ${config.toneClass}`}>
                        <div className="erm-success-icon">{config.icon}</div>
                        <h2 className="erm-success-title">{config.title}</h2>
                        <p className="erm-success-msg">{config.message}</p>
                        <button type="button" className="erm-btn-pay" onClick={onClose}>Done</button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Payment Step ─────────────────────────────────────────────────────────
    if (step === 'payment') {
        return (
            <div className="erm-overlay" onClick={onClose}>
                <div className="erm-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="erm-header">
                        <h2 className="erm-title">Payment Method</h2>
                        <button type="button" className="erm-close" onClick={() => setStep('form')}>
                            <X size={22} />
                        </button>
                    </div>

                    <div className="erm-payment-options">
                        {paymentOptions.map(({ value, label, Icon, description }) => (
                            <label key={value} className={`erm-payment-option ${paymentMethod === value ? 'selected' : ''}`}>
                                <input type="radio" name="payment" value={value}
                                    checked={paymentMethod === value}
                                    onChange={(e) => setPaymentMethod(e.target.value)} />
                                <Icon size={24} className="erm-payment-icon" />
                                <div className="erm-payment-text">
                                    <p className="erm-payment-label">{label}</p>
                                    <p className="erm-payment-desc">{description}</p>
                                </div>
                            </label>
                        ))}
                    </div>

                    <div className="erm-summary">
                        <div className="erm-summary-row">
                            <span>Attendees</span>
                            <span>{1 + guestCount} ({guestCount} guest{guestCount !== 1 ? 's' : ''})</span>
                        </div>
                        <div className="erm-summary-row">
                            <span>Price per Person</span>
                            <span>₱{pricePerGuest.toLocaleString()}</span>
                        </div>
                        <div className="erm-summary-total">
                            <span>Total Amount</span>
                            <span className="erm-total-amount">₱{totalPrice.toLocaleString()}</span>
                        </div>
                    </div>

                    {error && <div className="erm-error">{error}</div>}

                    <div className="erm-footer">
                        <button type="button" className="erm-btn-back" onClick={() => setStep('form')}>Back</button>
                        <button type="button" className="erm-btn-pay" onClick={handlePayment} disabled={isProcessing}>
                            {isProcessing ? 'Submitting...' : `Submit Registration`}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Registration Form Step ────────────────────────────────────────────────
    return (
        <div className="erm-overlay" onClick={onClose}>
            <div className="erm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="erm-header">
                    <h2 className="erm-title">Event Registration</h2>
                    <button type="button" className="erm-close" onClick={onClose}>
                        <X size={22} />
                    </button>
                </div>

                <div className="erm-event-info">
                    <h3 className="erm-event-name">{event.event_name}</h3>
                    <div className="erm-event-meta">
                        {event.start_date && <span>📅 {event.start_date}</span>}
                        {event.start_time && <span>🕐 {event.start_time}</span>}
                        {event.venue      && <span>📍 {event.venue}</span>}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="erm-form">
                    {error && <div className="erm-error">{error}</div>}

                    <div className="erm-field">
                        <label className="erm-label">First Name *</label>
                        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Enter your first name" className="erm-input" />
                    </div>
                    <div className="erm-field">
                        <label className="erm-label">Last Name *</label>
                        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                            placeholder="Enter your last name" className="erm-input" />
                    </div>

                    <div className="erm-field">
                        <label className="erm-label">Number of Additional Guests</label>
                        <div className="erm-guest-counter">
                            <div className="erm-counter-control">
                                <button type="button" className="erm-counter-btn"
                                    onClick={() => guestCount > 0 && handleGuestCountChange(guestCount - 1)}>−</button>
                                <span className="erm-counter-value">{guestCount}</span>
                                <button type="button" className="erm-counter-btn"
                                    onClick={() => handleGuestCountChange(guestCount + 1)}>+</button>
                            </div>
                            <span className="erm-per-person">
                                <Users size={14} /> ₱{pricePerGuest.toLocaleString()} per person
                            </span>
                        </div>
                    </div>

                    {guestCount >= 1 && (
                        <div className="erm-guests-box">
                            <h4 className="erm-guests-title">Guest Details</h4>
                            {guests.map((guest, index) => (
                                <div key={index} className="erm-guest-card">
                                    <p className="erm-guest-number">Guest {index + 1}</p>
                                    <div className="erm-guest-row">
                                        <div className="erm-field">
                                            <label className="erm-label-sm">First Name</label>
                                            <input type="text" value={guest.firstName}
                                                onChange={(e) => handleGuestChange(index, 'firstName', e.target.value)}
                                                placeholder="First name" className="erm-input" />
                                        </div>
                                        <div className="erm-field">
                                            <label className="erm-label-sm">Last Name</label>
                                            <input type="text" value={guest.lastName}
                                                onChange={(e) => handleGuestChange(index, 'lastName', e.target.value)}
                                                placeholder="Last name" className="erm-input" />
                                        </div>
                                    </div>
                                    <div className="erm-field">
                                        <label className="erm-label-sm">Relationship</label>
                                        <select value={guest.relationship}
                                            onChange={(e) => handleGuestChange(index, 'relationship', e.target.value)}
                                            className="erm-input">
                                            <option value="friend">Friend</option>
                                            <option value="family">Family Member</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="erm-price-summary">
                        <span>Total Amount</span>
                        <span className="erm-total-amount">₱{totalPrice.toLocaleString()}</span>
                    </div>

                    <div className="erm-footer">
                        <button type="button" className="erm-btn-back" onClick={onClose}>Cancel</button>
                        <button type="submit" className="erm-btn-pay">Continue to Payment</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EventRegistrationModal;