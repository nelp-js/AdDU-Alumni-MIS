import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProfileHeader from '../components/ProfileHeader';
import ExperienceSection from '../components/ExperienceSection';
import EducationSection from '../components/EducationSection';
import EditModal from '../components/EditModal';
import api from '../api';
import { useTitle } from '../Hooks/useTitle';
import '../styles/Profile.css';
import '../styles/ProfileSection.css';

const BIO_MAX = 500;

function Profile() {
    useTitle('Profile');
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingInfo, setEditingInfo] = useState(false);
    const [infoForm, setInfoForm] = useState({
        first_name: '',
        last_name: '',
        bio: '',
        location: '',
        website: '',
    });
    const [savingInfo, setSavingInfo] = useState(false);
    const [infoError, setInfoError] = useState('');
    const [profilePicFile, setProfilePicFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [dismissEnhance, setDismissEnhance] = useState(false);
    const [openExperienceAdd, setOpenExperienceAdd] = useState(false);

    const fetchProfile = useCallback(() => {
        api.get('/api/profile/')
            .then((res) => {
                const data = res.data;
                setProfile(data);
                setInfoForm({
                    first_name: data.first_name || '',
                    last_name: data.last_name || '',
                    bio: data.bio || '',
                    location: data.location || '',
                    website: data.website || '',
                });
            })
            .catch(() => setError('Failed to load profile.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    useEffect(() => {
        if (!profile || !coverFile) return;
        const formData = new FormData();
        formData.append('cover_photo', coverFile);
        api.patch('/api/profile/', formData)
            .then((res) => {
                setProfile(res.data);
                setCoverFile(null);
            })
            .catch(() => setCoverFile(null));
    }, [coverFile, profile]);

    useEffect(() => {
        if (!profile || !profilePicFile) return;
        const formData = new FormData();
        formData.append('profile_picture', profilePicFile);
        api.patch('/api/profile/', formData)
            .then((res) => {
                setProfile(res.data);
                setProfilePicFile(null);
            })
            .catch(() => setProfilePicFile(null));
    }, [profilePicFile, profile]);

    const handleInfoSave = async (e) => {
        e.preventDefault();
        setSavingInfo(true);
        setInfoError('');
        try {
            const res = await api.patch('/api/profile/', {
                first_name: infoForm.first_name,
                last_name: infoForm.last_name,
                bio: infoForm.bio,
                location: infoForm.location,
                website: infoForm.website,
            });
            setProfile(res.data);
            setEditingInfo(false);
        } catch (err) {
            const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to save.';
            setInfoError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setSavingInfo(false);
        }
    };

    const fullName = [profile?.first_name, profile?.middle_name, profile?.last_name]
        .filter(Boolean)
        .join(' ') || '—';

    if (loading) {
        return (
            <div className="profile-page">
                <Header />
                <main className="profile-main">
                    <div className="profile-wrapper">
                        <p className="profile-loading">Loading…</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="profile-page">
                <Header />
                <main className="profile-main">
                    <div className="profile-wrapper">
                        <p className="profile-error">{error || 'Please log in to view your profile.'}</p>
                        <button type="button" className="profile-login-btn" onClick={() => navigate('/login')}>
                            Go to Login
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="profile-page">
            <Header />
            <main className="profile-main">
                <div className="profile-wrapper">
                    <ProfileHeader
                        profile={profile}
                        onCoverChange={setCoverFile}
                        onProfilePicChange={setProfilePicFile}
                        isEditing
                    />

                    <div className="profile-content">
                    <div className="profile-info-card">
                        <div className="profile-info-top">
                            <div className="profile-info-main">
                                <h1 className="profile-info-name" style={{ textTransform: 'capitalize' }}>
                                    {fullName}
                                </h1>
                                {profile.bio && (
                                    <p className="profile-info-title">{profile.bio}</p>
                                )}
                                <div className="profile-info-meta">
                                    {profile.location && (
                                        <span className="profile-info-meta-item">{profile.location}</span>
                                    )}
                                    {profile.website && (
                                        <a
                                            href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="profile-info-meta-item profile-info-contact"
                                        >
                                            Contact Info
                                        </a>
                                    )}
                                </div>
                            </div>
                            <div className="profile-info-actions">
                                <button
                                    type="button"
                                    className="profile-info-edit-btn"
                                    onClick={() => setEditingInfo(true)}
                                    title="Edit profile"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                    Edit Profile
                                </button>
                            </div>
                        </div>
                    </div>

                    {!dismissEnhance && (profile.experiences || []).length === 0 && (
                        <div className="profile-enhance">
                            <p className="profile-enhance-text">
                                Enhance your own profile by adding a work experience.{' '}
                                <button
                                    type="button"
                                    className="profile-enhance-link"
                                    onClick={() => setOpenExperienceAdd(true)}
                                >
                                    Add Experience
                                </button>
                            </p>
                            <button
                                type="button"
                                className="profile-enhance-dismiss"
                                onClick={() => setDismissEnhance(true)}
                                aria-label="Dismiss"
                            >
                                ×
                            </button>
                        </div>
                    )}

                    <ExperienceSection
                        experiences={profile.experiences || []}
                        onAdd={fetchProfile}
                        onUpdate={fetchProfile}
                        onDelete={fetchProfile}
                        api={api}
                        openAddTrigger={openExperienceAdd}
                        onOpenAddConsumed={() => setOpenExperienceAdd(false)}
                    />

                    <EducationSection
                        educations={profile.educations || []}
                        onAdd={fetchProfile}
                        onUpdate={fetchProfile}
                        onDelete={fetchProfile}
                        api={api}
                    />
                    </div>
                </div>
            </main>
            <Footer />

            <EditModal
                isOpen={editingInfo}
                onClose={() => setEditingInfo(false)}
                title="Edit Profile"
            >
                <form onSubmit={handleInfoSave} className="profile-form">
                    {infoError && <div className="profile-form-error">{infoError}</div>}
                    <div className="profile-form-row">
                        <label className="profile-form-label">First Name *</label>
                        <input
                            type="text"
                            value={infoForm.first_name}
                            onChange={(e) => setInfoForm((p) => ({ ...p, first_name: e.target.value }))}
                            className="profile-form-input"
                            required
                        />
                    </div>
                    <div className="profile-form-row">
                        <label className="profile-form-label">Last Name *</label>
                        <input
                            type="text"
                            value={infoForm.last_name}
                            onChange={(e) => setInfoForm((p) => ({ ...p, last_name: e.target.value }))}
                            className="profile-form-input"
                            required
                        />
                    </div>
                    <div className="profile-form-row">
                        <div className="profile-form-label-row">
                            <label className="profile-form-label">Bio</label>
                            <span className={`profile-form-counter ${infoForm.bio.length > BIO_MAX ? 'profile-form-counter-over' : ''}`}>
                                {infoForm.bio.length}/{BIO_MAX}
                            </span>
                        </div>
                        <textarea
                            value={infoForm.bio}
                            onChange={(e) => setInfoForm((p) => ({ ...p, bio: e.target.value.slice(0, BIO_MAX) }))}
                            className="profile-form-input profile-form-textarea"
                            rows={4}
                            maxLength={BIO_MAX + 1}
                        />
                    </div>
                    <div className="profile-form-row">
                        <label className="profile-form-label">Location</label>
                        <input
                            type="text"
                            value={infoForm.location}
                            onChange={(e) => setInfoForm((p) => ({ ...p, location: e.target.value }))}
                            className="profile-form-input"
                            placeholder="e.g. Manila, Philippines"
                        />
                    </div>
                    <div className="profile-form-row">
                        <label className="profile-form-label">Website</label>
                        <input
                            type="url"
                            value={infoForm.website}
                            onChange={(e) => setInfoForm((p) => ({ ...p, website: e.target.value }))}
                            className="profile-form-input"
                            placeholder="https://..."
                        />
                    </div>
                    <div className="profile-form-actions">
                        <button type="button" className="profile-form-cancel" onClick={() => setEditingInfo(false)}>
                            Cancel
                        </button>
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
