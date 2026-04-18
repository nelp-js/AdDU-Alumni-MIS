import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/Opportunities.css';
import { useTitle } from '../Hooks/useTitle';

const METHOD_OPTIONS = [
    { id: 'gcash', label: 'GCash', logo: 'G' },
    { id: 'maya', label: 'Maya', logo: 'M' },
    { id: 'credit_debit', label: 'Credit or debit', logo: '💳' },
    { id: 'cash', label: 'Cash (University Cashier)', logo: '₱' },
];

const PRESET_AMOUNTS = [100, 500, 1000];

function formatMoney(n) {
    if (n == null || n === '') return '—';
    const num = Number(n);
    if (Number.isNaN(num)) return '—';
    return `₱${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function clampPercent(raised, goal) {
    if (!goal || goal <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((raised / goal) * 100)));
}

function formatReceiptDate(isoDate) {
    if (!isoDate) return '—';
    try {
        return new Date(isoDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
        return isoDate;
    }
}

function CampaignDonate() {
    useTitle('Give Back');
    const { id } = useParams();
    const [campaign, setCampaign] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [donationFrequency, setDonationFrequency] = useState('one-time');
    const [selectedPresetAmount, setSelectedPresetAmount] = useState(100);
    const [customAmountInput, setCustomAmountInput] = useState('');

    const [paymentMethod, setPaymentMethod] = useState('gcash');
    const [submitting, setSubmitting] = useState(false);
    const [donationFeedback, setDonationFeedback] = useState('');
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState(null);

    const [ewalletAccount, setEwalletAccount] = useState('');
    const [cardFields, setCardFields] = useState({
        email: '',
        firstName: '',
        lastName: '',
        cardNumber: '',
        expiry: '',
        cvv: '',
        cardName: '',
        country: 'Philippines',
        postalCode: '',
    });

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError('');
        api.get(`/api/campaigns/public/${id}/`)
            .then((res) => setCampaign(res.data))
            .catch(() => {
                setCampaign(null);
                setError('Failed to load campaign.');
            })
            .finally(() => setLoading(false));
    }, [id]);

    const customTrim = String(customAmountInput || '').replace(/,/g, '').trim();
    const customParsed = parseFloat(customTrim);
    const safeDonation =
        customTrim === ''
            ? selectedPresetAmount
            : Number.isFinite(customParsed) && customParsed > 0
              ? customParsed
              : 0;

    const presetMatchesAmount = (amt) => customTrim === '' && selectedPresetAmount === amt;

    const handleCustomAmountChange = (e) => {
        const raw = e.target.value;
        if (raw === '' || raw === '.') {
            setCustomAmountInput(raw);
            setDonationFeedback('');
            return;
        }
        if (/^\d*\.?\d{0,2}$/.test(raw)) {
            setCustomAmountInput(raw);
            setDonationFeedback('');
        }
    };

    const raised = Number(campaign?.raised_amount || 0);
    const goal = Number(campaign?.goal_amount || 0);
    const pct = clampPercent(raised, goal);

    const handleDonateSubmit = async () => {
        if (safeDonation <= 0 || submitting) return;

        if ((paymentMethod === 'gcash' || paymentMethod === 'maya') && !ewalletAccount.trim()) {
            setDonationFeedback(`Please enter your ${paymentMethod === 'gcash' ? 'GCash' : 'Maya'} Account Number.`);
            return;
        }
        if (paymentMethod === 'credit_debit' && (!cardFields.cardNumber || !cardFields.expiry || !cardFields.cvv || !cardFields.cardName)) {
            setDonationFeedback('Please fill in all credit card details.');
            return;
        }

        setSubmitting(true);
        setDonationFeedback('');
        try {
            const res = await api.post(`/api/campaigns/${id}/donate/`, {
                amount: safeDonation,
                frequency: donationFrequency,
                payment_method: paymentMethod,
                first_name: cardFields.firstName || undefined,
                last_name: cardFields.lastName || undefined,
                email: cardFields.email || undefined,
                payment_account: (paymentMethod === 'gcash' || paymentMethod === 'maya') ? ewalletAccount : undefined,
            });

            setCampaign((c) =>
                c
                    ? {
                          ...c,
                          raised_amount: res.data.campaign_raised_amount ?? c.raised_amount,
                          donors_count: res.data.campaign_donors_count ?? c.donors_count,
                      }
                    : c
            );

            const statusLabel = (res.data.payment_status || '').toLowerCase();
            if (statusLabel === 'success') {
                setDonationFeedback('Payment successful. Thank you for your donation!');
                setReceiptData({
                    status: statusLabel,
                    donorName: res.data.donor_name || `${cardFields.firstName || 'Guest'} ${cardFields.lastName || 'Donor'}`.trim(),
                    donationDate: res.data.donated_at || new Date().toISOString(),
                    campaignTitle: campaign?.title || 'Campaign',
                    receivedBy: campaign?.created_by_name || 'Campaign organizer',
                    amount: safeDonation,
                    totalAmount: safeDonation,
                    frequency: donationFrequency,
                });
                setShowReceipt(true);
            } else if (statusLabel === 'pending') {
                setDonationFeedback('Payment is pending. Campaign progress updates after success.');
            } else {
                setDonationFeedback('Payment failed. Campaign progress was not updated.');
            }
        } catch (err) {
            const message = err.response?.data?.detail || 'Donation failed. Please try again.';
            setDonationFeedback(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="opp-page">
            <Header />
            <main className="opp-main">
                <div className="campaign-route-head">
                    <Link to={`/campaigns/${id}`} className="campaign-route-back">← Back to Campaign</Link>
                </div>

                {loading && <div className="opp-state">Loading...</div>}
                {error && <div className="opp-state opp-error">{error}</div>}
                {!loading && !error && !campaign && <div className="opp-state">Campaign not found.</div>}

                {!loading && !error && campaign && (
                    <div className="campaign-donate-page">
                        <div className="campaign-donate-hero">
                            <div className="campaign-detail-percent-ring" style={{ '--pct': `${pct}%` }}>
                                <span>{pct}%</span>
                            </div>
                            <div>
                                <h1 className="campaign-donate-page-title">{campaign.title || 'Campaign'}</h1>
                                <p className="campaign-donate-page-meta">
                                    {formatMoney(campaign.raised_amount)} raised of {formatMoney(campaign.goal_amount)}
                                </p>
                            </div>
                        </div>

                        <div className="campaign-donate-modal campaign-donate-modal-page">
                            <h2 className="campaign-donate-section-title">Give Back</h2>
                            <p className="campaign-donate-section-hint">Enter your contribution</p>

                            <div className="campaign-donate-segment" role="group" aria-label="Donation frequency">
                                <button
                                    type="button"
                                    className={donationFrequency === 'one-time' ? 'active' : ''}
                                    onClick={() => setDonationFrequency('one-time')}
                                >
                                    Give Once
                                </button>
                                <button
                                    type="button"
                                    className={donationFrequency === 'monthly' ? 'active' : ''}
                                    onClick={() => setDonationFrequency('monthly')}
                                >
                                    Give Monthly
                                </button>
                            </div>

                            <div className="campaign-donate-amounts campaign-donate-amounts-presets">
                                {PRESET_AMOUNTS.map((amt) => (
                                    <button
                                        key={amt}
                                        type="button"
                                        className={`campaign-donate-amount-btn ${presetMatchesAmount(amt) ? 'active' : ''}`}
                                        onClick={() => {
                                            setSelectedPresetAmount(amt);
                                            setCustomAmountInput('');
                                            setDonationFeedback('');
                                        }}
                                    >
                                        ₱{amt.toLocaleString()}
                                    </button>
                                ))}
                            </div>

                            <div className="campaign-donate-custom-field">
                                <span className="campaign-donate-custom-field-prefix" aria-hidden="true">
                                    ₱
                                </span>
                                <input
                                    id="campaign-donate-amount"
                                    type="text"
                                    inputMode="decimal"
                                    autoComplete="off"
                                    value={customAmountInput}
                                    onChange={handleCustomAmountChange}
                                    className="campaign-donate-custom-field-input"
                                    placeholder="Enter amount"
                                    aria-label="Contribution amount in pesos"
                                />
                            </div>

                            <p className="campaign-donate-total-line">TOTAL: {formatMoney(safeDonation)}</p>

                            <div className="campaign-donate-methods">
                                <p className="campaign-donate-label">Payment method</p>
                                {METHOD_OPTIONS.map((method) => (
                                    <label key={method.id} className="campaign-donate-method-row">
                                        <input
                                            type="radio"
                                            name="payment-method"
                                            checked={paymentMethod === method.id}
                                            onChange={() => setPaymentMethod(method.id)}
                                        />
                                        <span className="campaign-donate-method-logo">{method.logo}</span>
                                        <span>{method.label}</span>
                                    </label>
                                ))}
                            </div>

                            {(paymentMethod === 'gcash' || paymentMethod === 'maya') && (
                                <div className="campaign-card-fields">
                                    <input
                                        type="text"
                                        placeholder={`${paymentMethod === 'gcash' ? 'GCash' : 'Maya'} Account Number * (09XX XXX XXXX)`}
                                        maxLength="11"
                                        value={ewalletAccount}
                                        onChange={(e) => setEwalletAccount(e.target.value)}
                                    />
                                </div>
                            )}

                            {paymentMethod === 'credit_debit' && (
                                <div className="campaign-card-fields">
                                    <input
                                        type="email"
                                        placeholder="Email address"
                                        value={cardFields.email}
                                        onChange={(e) => setCardFields((p) => ({ ...p, email: e.target.value }))}
                                    />
                                    <div className="campaign-card-fields-two">
                                        <input
                                            type="text"
                                            placeholder="First name"
                                            value={cardFields.firstName}
                                            onChange={(e) => setCardFields((p) => ({ ...p, firstName: e.target.value }))}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Last name"
                                            value={cardFields.lastName}
                                            onChange={(e) => setCardFields((p) => ({ ...p, lastName: e.target.value }))}
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Card number *"
                                        value={cardFields.cardNumber}
                                        onChange={(e) => setCardFields((p) => ({ ...p, cardNumber: e.target.value }))}
                                    />
                                    <div className="campaign-card-fields-two">
                                        <input
                                            type="text"
                                            placeholder="MM/YY *"
                                            value={cardFields.expiry}
                                            onChange={(e) => setCardFields((p) => ({ ...p, expiry: e.target.value }))}
                                        />
                                        <input
                                            type="text"
                                            placeholder="CVV *"
                                            value={cardFields.cvv}
                                            onChange={(e) => setCardFields((p) => ({ ...p, cvv: e.target.value }))}
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Name on card *"
                                        value={cardFields.cardName}
                                        onChange={(e) => setCardFields((p) => ({ ...p, cardName: e.target.value }))}
                                    />
                                    <div className="campaign-card-fields-two">
                                        <select
                                            value={cardFields.country}
                                            onChange={(e) => setCardFields((p) => ({ ...p, country: e.target.value }))}
                                        >
                                            <option value="Philippines">Philippines</option>
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="Postal code"
                                            value={cardFields.postalCode}
                                            onChange={(e) => setCardFields((p) => ({ ...p, postalCode: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="campaign-donate-summary">
                                <p>
                                    <span>Your contribution {donationFrequency === 'monthly' && '(Monthly)'}</span>
                                    <strong>{formatMoney(safeDonation)}</strong>
                                </p>
                                <p className="total">
                                    <span>Total due today</span>
                                    <strong>{formatMoney(safeDonation)}</strong>
                                </p>
                            </div>

                            <button
                                type="button"
                                className="campaign-donate-submit"
                                disabled={safeDonation <= 0 || submitting}
                                onClick={handleDonateSubmit}
                            >
                                {submitting ? 'Processing...' : 'Give Back Today'}
                            </button>

                            {donationFeedback && (
                                <p
                                    className="campaign-donate-note"
                                    style={{
                                        color:
                                            donationFeedback.includes('Please enter') || donationFeedback.includes('fill in')
                                                ? '#b91c1c'
                                                : '#6b7280',
                                    }}
                                >
                                    {donationFeedback}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </main>
            <Footer />

            {showReceipt && receiptData && (
                <div className="campaign-receipt-overlay" onClick={() => setShowReceipt(false)}>
                    <div className="campaign-receipt-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="campaign-receipt-sheet">
                            <h2 className="campaign-receipt-title">
                                Thank you for your <span className="campaign-receipt-amount">{formatMoney(receiptData.amount)}</span> donation to{' '}
                                <span className="campaign-receipt-campaign-link">{receiptData.campaignTitle}</span>
                            </h2>

                            <h3 className="campaign-receipt-subtitle">Here is your donation receipt:</h3>

                            <p className="campaign-receipt-row"><strong>Donor name:</strong> {receiptData.donorName || '—'}</p>
                            <p className="campaign-receipt-row"><strong>Frequency:</strong> {receiptData.frequency === 'monthly' ? 'Monthly Pledge' : 'One-time Donation'}</p>
                            <p className="campaign-receipt-row"><strong>Donation date:</strong> {formatReceiptDate(receiptData.donationDate)}</p>
                            <p className="campaign-receipt-row"><strong>Donation to:</strong> {receiptData.campaignTitle}</p>

                            <p className="campaign-receipt-row campaign-receipt-row-gap">
                                <strong>Donation will be received by:</strong> {receiptData.receivedBy}
                            </p>
                            <p className="campaign-receipt-row"><strong>Donation amount:</strong> {formatMoney(receiptData.amount)}</p>
                            <p className="campaign-receipt-row campaign-receipt-total"><strong>Total amount:</strong> {formatMoney(receiptData.totalAmount)}</p>
                        </div>
                        <div className="campaign-receipt-actions">
                            <button type="button" className="campaign-receipt-close" onClick={() => setShowReceipt(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CampaignDonate;
