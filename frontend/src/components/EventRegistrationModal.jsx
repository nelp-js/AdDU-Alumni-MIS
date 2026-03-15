import { useState } from 'react';
import { X, Users, CreditCard, Smartphone, Wallet } from 'lucide-react';
import '../styles/EventRegistrationModal.css';

function EventRegistrationModal({ event, onClose, pricePerGuest = 1000 }) {
    const [step, setStep]               = useState('form');
    const [firstName, setFirstName]     = useState('');
    const [lastName, setLastName]       = useState('');
    const [guestCount, setGuestCount]   = useState(0);
    const [guests, setGuests]           = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('gcash');
    const [isProcessing, setIsProcessing]   = useState(false);

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
            alert('Please enter your first and last name');
            return;
        }
        setStep('payment');
    };

    const handlePayment = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            alert('Registration successful!');
            onClose();
        }, 2000);
    };

    const paymentOptions = [
        { value: 'gcash', label: 'GCash',              Icon: Smartphone, description: 'Pay via GCash mobile wallet' },
        { value: 'maya',  label: 'Maya',               Icon: Wallet,     description: 'Pay via Maya (formerly PayMaya)' },
        { value: 'card',  label: 'Credit/Debit Card',  Icon: CreditCard, description: 'Pay via Visa, Mastercard, or AMEX' },
    ];

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
                            <span>Number of Guests</span>
                            <span>{guestCount}</span>
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

                    <div className="erm-footer">
                        <button type="button" className="erm-btn-back" onClick={() => setStep('form')}>Back</button>
                        <button type="button" className="erm-btn-pay" onClick={handlePayment} disabled={isProcessing}>
                            {isProcessing ? 'Processing...' : `Pay ₱${totalPrice.toLocaleString()}`}
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

                {/* Event Info */}
                <div className="erm-event-info">
                    <h3 className="erm-event-name">{event.event_name}</h3>
                    <div className="erm-event-meta">
                        {event.start_date && <span>📅 {event.start_date}</span>}
                        {event.start_time && <span>🕐 {event.start_time}</span>}
                        {event.venue     && <span>📍 {event.venue}</span>}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="erm-form">
                    {/* Name */}
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

                    {/* Guest Count */}
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

                    {/* Guest Details */}
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

                    {/* Price Summary */}
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