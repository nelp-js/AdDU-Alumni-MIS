import { useRef } from 'react';
import { FiCamera, FiEdit3, FiMail, FiPhone, FiMapPin, FiBook, FiCalendar } from 'react-icons/fi';
import { getOptimizedUrl } from '../utils/imageUtils';
import '../styles/ProfileHeader.css';

const API_BASE = import.meta.env.VITE_API_URL || 'https://sia-2.onrender.com';

function getFullImageUrl(url) {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

const COURSE_LABELS = {
    CS: 'Computer Science',
    IT: 'Information Technology',
    IS: 'Information Systems',
};

function ProfileHeader({ profile, userData, onCoverChange, onProfilePicChange, isEditing, onEditProfile }) {
    const coverInputRef      = useRef(null);
    const profilePicInputRef = useRef(null);

    const coverUrl      = profile?.cover_photo     ? getFullImageUrl(profile.cover_photo)     : null;
    const profilePicUrl = profile?.profile_picture ? getFullImageUrl(profile.profile_picture) : null;
    const fullName      = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '—';

    // Location string
    const locationParts = userData?.country === 'Philippines'
        ? [userData?.city, userData?.province, 'Philippines'].filter(Boolean)
        : [userData?.country].filter(Boolean);
    const locationStr = locationParts.join(', ') || profile?.location || null;

    // Course + batch
    const courseLabel = userData?.course ? (COURSE_LABELS[userData.course] || userData.course) : null;
    const batchYear   = userData?.batch_year || null;
    const academicStr = [courseLabel, batchYear ? `Class of ${batchYear}` : null].filter(Boolean).join(' · ');

    return (
        <header className="profile-header-card">
            {/* 1. Cover Photo */}
            <div
                className={`header-cover ${isEditing ? 'editable' : ''}`}
                onClick={() => isEditing && coverInputRef.current?.click()}
                style={{
                    backgroundImage: coverUrl ? `url(${getOptimizedUrl(coverUrl, 'hero')})` : 'none',
                    backgroundColor: coverUrl ? 'transparent' : '#a0b4b7'
                }}
            >
                {!coverUrl && <div className="header-cover-placeholder" />}
                {isEditing && (
                    <button className="header-edit-cover-btn">
                        <FiCamera size={16} />
                        <span>Edit cover</span>
                    </button>
                )}
                <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => e.target.files?.[0] && onCoverChange(e.target.files[0])}
                />
            </div>

            {/* 2. Profile Picture */}
            <div className="header-pic-wrapper">
                <div
                    className={`header-pic-inner ${isEditing ? 'editable' : ''}`}
                    onClick={() => isEditing && profilePicInputRef.current?.click()}
                >
                    {profilePicUrl ? (
                        <img
                            src={getOptimizedUrl(profilePicUrl, 'avatar')}
                            alt={fullName}
                            className="header-pic"
                        />
                    ) : (
                        <div className="header-pic-placeholder">
                            {fullName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <input
                        ref={profilePicInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => e.target.files?.[0] && onProfilePicChange(e.target.files[0])}
                    />
                </div>
            </div>

            {/* 3. Main Info Row */}
            <div className="header-content">
                <div className="header-row">

                    {/* LEFT: Info */}
                    <div className="header-info">
                        <h1 className="header-name">{fullName}</h1>

                        {/* Academic tagline */}
                        {academicStr && (
                            <p className="header-academic">{academicStr}</p>
                        )}

                        {/* Bio */}
                        {profile?.bio && (
                            <p className="header-headline">{profile.bio}</p>
                        )}

                        {/* Meta row — location, contact, website */}
                        <div className="header-meta">
                            {locationStr && (
                                <span className="header-meta-item">
                                    <FiMapPin size={13} className="header-meta-icon" />
                                    {locationStr}
                                </span>
                            )}
                            {userData?.phone_number && (
                                <span className="header-meta-item">
                                    <FiPhone size={13} className="header-meta-icon" />
                                    {userData.phone_number}
                                </span>
                            )}
                            {(profile?.website || userData?.email) && (
                                <a
                                    href={profile?.website || `mailto:${userData?.email}`}
                                    className="header-contact-btn"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Website
                                </a>
                            )}
                        </div>
                    </div>

                    {onEditProfile && (
                        <div className="header-right-action">
                            <button
                                type="button"
                                className="edit-profile-btn"
                                onClick={onEditProfile}
                            >
                                <FiEdit3 size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default ProfileHeader;