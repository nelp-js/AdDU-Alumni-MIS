import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProfileHeader from '../components/ProfileHeader';
import ExperienceSection from '../components/ExperienceSection';
import EducationSection from '../components/EducationSection';
import EditModal from '../components/EditModal';
import LocationFields from '../components/LocationFields';
import api from '../api';
import { useTitle } from '../Hooks/useTitle';
import { useCountries } from '../Hooks/useCountries';
import '../styles/Profile.css';
import '../styles/ProfileSection.css';

const BIO_MAX = 500;
const MARRIED_STATUSES = ['married', 'separated', 'annulled', 'divorced', 'widowed'];

const RELIGIONS = [
    { value: 'roman_catholic',       label: 'Roman Catholic' },
    { value: 'protestant',           label: 'Protestant' },
    { value: 'iglesia_ni_cristo',    label: 'Iglesia ni Cristo' },
    { value: 'islam',                label: 'Islam' },
    { value: 'born_again_christian', label: 'Born Again Christian' },
    { value: 'buddhist',             label: 'Buddhist' },
    { value: 'other',                label: 'Other (please specify)' },
    { value: 'prefer_not_to_say',    label: 'Prefer not to say' },
];

const COURSES = [
    { value: 'CS', label: 'Computer Science' },
    { value: 'IT', label: 'Information Technology' },
    { value: 'IS', label: 'Information Systems' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1948 + 1 }, (_, i) => currentYear - i);

// ── Small form helpers ────────────────────────────────────────────────────────

const FormRow = ({ label, children }) => (
    <div className="profile-form-row">
        <label className="profile-form-label">{label}</label>
        {children}
    </div>
);

const FormSelect = ({ value, onChange, options, placeholder, disabled }) => (
    <select value={value} onChange={onChange} className="profile-form-input" disabled={disabled}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) =>
            typeof o === 'string'
                ? <option key={o} value={o}>{o}</option>
                : <option key={o.value} value={o.value}>{o.label}</option>
        )}
    </select>
);

// ── Section divider inside the modal ─────────────────────────────────────────
const ModalSection = ({ children }) => (
    <div className="profile-modal-section-label">{children}</div>
);

// ─────────────────────────────────────────────────────────────────────────────

function Profile() {
    useTitle('Profile');
    const navigate = useNavigate();

    const { countries, loading: loadingCountries } = useCountries();

    const [profile, setProfile]         = useState(null);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState(null);
    const [editingInfo, setEditingInfo] = useState(false);
    const [savingInfo, setSavingInfo]   = useState(false);
    const [infoError, setInfoError]     = useState('');
    const [profilePicFile, setProfilePicFile] = useState(null);
    const [coverFile, setCoverFile]           = useState(null);

    const [infoForm, setInfoForm] = useState({
        // Profile fields
        first_name: '', last_name: '', middle_name: '',
        bio: '', location: '', website: '',
        // User fields
        phone_number: '', telephone_number: '',
        current_address: '', country: 'Philippines', geocode: '',
        regionCode: '', region: '', provinceCode: '', province: '', city: '',
        birth_date: '', sex: '',
        religion: '', religion_other: '',
        marital_status: '', marriage_date: '',
        intend_to_marry: '', intended_marriage_age: '', no_marriage_reason: '',
        course: '', batch_year: '',
    });

    // ── Fetch profile + user data ─────────────────────────────────────────────

    const fetchProfile = useCallback(() => {
        Promise.all([
            api.get('/api/profile/'),
            api.get('/api/user/me/'),
        ])
            .then(([profileRes, userRes]) => {
                const p = profileRes.data;
                const u = userRes.data;
                setProfile(p);
                setInfoForm({
                    first_name:            p.first_name  || u.first_name  || '',
                    last_name:             p.last_name   || u.last_name   || '',
                    middle_name:           u.middle_name || '',
                    bio:                   p.bio         || '',
                    location:              p.location    || '',
                    website:               p.website     || '',
                    phone_number:          u.phone_number       || '',
                    telephone_number:      u.telephone_number   || '',
                    current_address:       u.current_address    || '',
                    country:               u.country            || 'Philippines',
                    geocode:               u.geocode            || '',
                    regionCode:            u.regionCode         || '',
                    region:                u.region             || '',
                    provinceCode:          u.provinceCode       || '',
                    province:              u.province           || '',
                    city:                  u.city               || '',
                    birth_date:            u.birth_date         || '',
                    sex:                   u.sex                || '',
                    religion:              u.religion           || '',
                    religion_other:        u.religion_other     || '',
                    marital_status:        u.marital_status     || '',
                    marriage_date:         u.marriage_date      || '',
                    intend_to_marry:       u.intend_to_marry    || '',
                    intended_marriage_age: u.intended_marriage_age || '',
                    no_marriage_reason:    u.no_marriage_reason || '',
                    course:                u.course             || '',
                    batch_year:            u.batch_year         || '',
                });
            })
            .catch(() => setError('Failed to load profile.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    // ── Cover / profile pic upload ────────────────────────────────────────────

    useEffect(() => {
        if (!profile || !coverFile) return;
        const fd = new FormData();
        fd.append('cover_photo', coverFile);
        api.patch('/api/profile/', fd)
            .then((res) => { setProfile(res.data); setCoverFile(null); })
            .catch(() => setCoverFile(null));
    }, [coverFile, profile]);

    useEffect(() => {
        if (!profile || !profilePicFile) return;
        const fd = new FormData();
        fd.append('profile_picture', profilePicFile);
        api.patch('/api/profile/', fd)
            .then((res) => { setProfile(res.data); setProfilePicFile(null); })
            .catch(() => setProfilePicFile(null));
    }, [profilePicFile, profile]);

    // ── Save ──────────────────────────────────────────────────────────────────

    const handleInfoSave = async (e) => {
        e.preventDefault();
        setSavingInfo(true);
        setInfoError('');
        const f = infoForm;
        const isSingle  = f.marital_status === 'single';
        const isMarried = MARRIED_STATUSES.includes(f.marital_status);

        try {
            // 1. Save profile fields
            await api.patch('/api/profile/', {
                first_name: f.first_name,
                last_name:  f.last_name,
                bio:        f.bio,
                location:   f.location,
                website:    f.website,
            });

            // 2. Save user fields
            await api.patch('/api/user/me/', {
                first_name:            f.first_name,
                middle_name:           f.middle_name || null,
                last_name:             f.last_name,
                phone_number:          f.phone_number,
                telephone_number:      f.telephone_number || null,
                current_address:       f.current_address,
                country:               f.country,
                geocode:               f.geocode,
                region:                f.country === 'Philippines' ? f.region   : null,
                province:              f.country === 'Philippines' ? f.province : null,
                city:                  f.country === 'Philippines' ? f.city     : null,
                birth_date:            f.birth_date || null,
                sex:                   f.sex || null,
                religion:              f.religion,
                religion_other:        f.religion === 'other' ? f.religion_other : null,
                marital_status:        f.marital_status,
                marriage_date:         isMarried ? f.marriage_date        : null,
                intend_to_marry:       isSingle  ? f.intend_to_marry      : null,
                intended_marriage_age: isSingle && f.intend_to_marry === 'yes' ? f.intended_marriage_age : null,
                no_marriage_reason:    isSingle && f.intend_to_marry === 'no'  ? f.no_marriage_reason    : null,
                course:                f.course,
                batch_year:            f.batch_year,
            });

            await fetchProfile();
            setEditingInfo(false);
        } catch (err) {
            const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to save.';
            setInfoError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setSavingInfo(false);
        }
    };

    const set = (field) => (e) => setInfoForm((p) => ({ ...p, [field]: e.target.value }));

    // ── Loading / error ───────────────────────────────────────────────────────

    if (loading) return (
        <div className="profile-page">
            <Header />
            <main className="profile-main"><div className="profile-wrapper"><p className="profile-loading">Loading…</p></div></main>
            <Footer />
        </div>
    );

    if (error || !profile) return (
        <div className="profile-page">
            <Header />
            <main className="profile-main">
                <div className="profile-wrapper">
                    <p className="profile-error">{error || 'Please log in to view your profile.'}</p>
                    <button type="button" className="profile-login-btn" onClick={() => navigate('/login')}>Go to Login</button>
                </div>
            </main>
            <Footer />
        </div>
    );

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="profile-page">
            <Header />
            <main className="profile-main">
                <div className="profile-wrapper">
                    <ProfileHeader
                        profile={profile}
                        onCoverChange={setCoverFile}
                        onProfilePicChange={setProfilePicFile}
                        onEditProfile={() => setEditingInfo(true)}
                        isEditing
                    />
                    <div className="profile-content">
                        <ExperienceSection
                            experiences={profile.experiences || []}
                            onAdd={fetchProfile} onUpdate={fetchProfile} onDelete={fetchProfile}
                            api={api}
                        />
                        <EducationSection
                            educations={profile.educations || []}
                            onAdd={fetchProfile} onUpdate={fetchProfile} onDelete={fetchProfile}
                            api={api}
                        />
                    </div>
                </div>
            </main>
            <Footer />

            {/* ── Edit Profile Modal ── */}
            <EditModal isOpen={editingInfo} onClose={() => setEditingInfo(false)} title="Edit Profile">
                <form onSubmit={handleInfoSave} className="profile-form">
                    {infoError && <div className="profile-form-error">{infoError}</div>}

                    {/* ── Personal ── */}
                    <ModalSection>Personal Information</ModalSection>
                    <div className="profile-form-grid">
                        <FormRow label="First Name *">
                            <input type="text" value={infoForm.first_name} onChange={set('first_name')} className="profile-form-input" required />
                        </FormRow>
                        <FormRow label="Middle Name">
                            <input type="text" value={infoForm.middle_name} onChange={set('middle_name')} className="profile-form-input" />
                        </FormRow>
                        <FormRow label="Last Name *">
                            <input type="text" value={infoForm.last_name} onChange={set('last_name')} className="profile-form-input" required />
                        </FormRow>
                        <FormRow label="Birth Date">
                            <input type="date" value={infoForm.birth_date} onChange={set('birth_date')} className="profile-form-input" />
                        </FormRow>
                        <FormRow label="Sex">
                            <FormSelect value={infoForm.sex} onChange={set('sex')} placeholder="Select sex"
                                options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'prefer_not_to_say', label: 'Prefer not to say' }]} />
                        </FormRow>
                    </div>

                    {/* ── Profile ── */}
                    <ModalSection>Profile</ModalSection>
                    <FormRow label="Bio">
                        <div className="profile-form-label-row">
                            <span className={`profile-form-counter ${infoForm.bio.length > BIO_MAX ? 'profile-form-counter-over' : ''}`}>
                                {infoForm.bio.length}/{BIO_MAX}
                            </span>
                        </div>
                        <textarea value={infoForm.bio} onChange={(e) => setInfoForm((p) => ({ ...p, bio: e.target.value.slice(0, BIO_MAX) }))}
                            className="profile-form-input profile-form-textarea" rows={3} maxLength={BIO_MAX + 1} />
                    </FormRow>
                    <FormRow label="Location">
                        <input type="text" value={infoForm.location} onChange={set('location')} className="profile-form-input" placeholder="e.g. Manila, Philippines" />
                    </FormRow>
                    <FormRow label="Website">
                        <input type="url" value={infoForm.website} onChange={set('website')} className="profile-form-input" placeholder="https://..." />
                    </FormRow>

                    {/* ── Contact ── */}
                    <ModalSection>Contact & Address</ModalSection>
                    <div className="profile-form-grid">
                        <FormRow label="Phone Number">
                            <input type="tel" value={infoForm.phone_number} onChange={set('phone_number')} className="profile-form-input" />
                        </FormRow>
                        <FormRow label="Telephone Number">
                            <input type="tel" value={infoForm.telephone_number} onChange={set('telephone_number')} className="profile-form-input" />
                        </FormRow>
                    </div>
                    <FormRow label="Current Address">
                        <input type="text" value={infoForm.current_address} onChange={set('current_address')} className="profile-form-input" />
                    </FormRow>
                    <div className="profile-form-grid">
                        <FormRow label="Country">
                            <select value={infoForm.country} onChange={set('country')} className="profile-form-input">
                                <option value="">{loadingCountries ? 'Loading...' : 'Select country'}</option>
                                {countries.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </FormRow>
                        <FormRow label="Zipcode">
                            <input type="text" value={infoForm.geocode} onChange={set('geocode')} className="profile-form-input" />
                        </FormRow>
                    </div>
                    {infoForm.country === 'Philippines' && (
                        <div className="profile-form-grid">
                            <LocationFields
                                regionCode={infoForm.regionCode}
                                provinceCode={infoForm.provinceCode}
                                cityName={infoForm.city}
                                onChange={(field, value) => setInfoForm((p) => ({ ...p, [field]: value }))}
                                fieldClass="profile-form-row"
                                labelClass="profile-form-label"
                                inputClass="profile-form-input"
                                required={false}
                            />
                        </div>
                    )}

                    {/* ── Background ── */}
                    <ModalSection>Background</ModalSection>
                    <div className="profile-form-grid">
                        <FormRow label="Religion">
                            <FormSelect value={infoForm.religion} onChange={set('religion')} placeholder="Select religion" options={RELIGIONS} />
                        </FormRow>
                        {infoForm.religion === 'other' && (
                            <FormRow label="Specify Religion">
                                <input type="text" value={infoForm.religion_other} onChange={set('religion_other')} className="profile-form-input" />
                            </FormRow>
                        )}
                        <FormRow label="Marital Status">
                            <FormSelect value={infoForm.marital_status} onChange={set('marital_status')} placeholder="Select status"
                                options={[
                                    { value: 'single',    label: 'Single' },
                                    { value: 'married',   label: 'Married' },
                                    { value: 'living_in', label: 'Living In' },
                                    { value: 'separated', label: 'Separated' },
                                    { value: 'annulled',  label: 'Annulled' },
                                    { value: 'divorced',  label: 'Divorced' },
                                    { value: 'widowed',   label: 'Widowed' },
                                ]} />
                        </FormRow>
                        {MARRIED_STATUSES.includes(infoForm.marital_status) && (
                            <FormRow label="Date of Marriage (YYYY-MM)">
                                <input type="month" value={infoForm.marriage_date} onChange={set('marriage_date')} className="profile-form-input" />
                            </FormRow>
                        )}
                        {infoForm.marital_status === 'single' && (
                            <FormRow label="Intend to Marry?">
                                <FormSelect value={infoForm.intend_to_marry} onChange={set('intend_to_marry')} placeholder="Select option"
                                    options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
                            </FormRow>
                        )}
                        {infoForm.marital_status === 'single' && infoForm.intend_to_marry === 'yes' && (
                            <FormRow label="Intended Marriage Age (18+)">
                                <input type="number" value={infoForm.intended_marriage_age} onChange={set('intended_marriage_age')} className="profile-form-input" min="18" max="100" />
                            </FormRow>
                        )}
                        {infoForm.marital_status === 'single' && infoForm.intend_to_marry === 'no' && (
                            <FormRow label="Reason (Optional)">
                                <input type="text" value={infoForm.no_marriage_reason} onChange={set('no_marriage_reason')} className="profile-form-input" />
                            </FormRow>
                        )}
                    </div>

                    {/* ── Academic ── */}
                    <ModalSection>Academic</ModalSection>
                    <div className="profile-form-grid">
                        <FormRow label="Course">
                            <FormSelect value={infoForm.course} onChange={set('course')} placeholder="Select course" options={COURSES} />
                        </FormRow>
                        <FormRow label="Batch Year">
                            <select value={infoForm.batch_year} onChange={set('batch_year')} className="profile-form-input">
                                <option value="">Select batch</option>
                                {years.map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </FormRow>
                    </div>

                    <div className="profile-form-actions">
                        <button type="button" className="profile-form-cancel" onClick={() => setEditingInfo(false)}>Cancel</button>
                        <button type="submit" className="profile-form-submit" disabled={savingInfo}>
                            {savingInfo ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                </form>
            </EditModal>
        </div>
    );
}

export default Profile;