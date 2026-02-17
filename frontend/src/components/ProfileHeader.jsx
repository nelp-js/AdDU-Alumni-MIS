import { useRef } from 'react';
import { FiSettings, FiEdit3 } from 'react-icons/fi';
import { getOptimizedUrl } from '../utils/imageUtils';
import { extractDomain, getCompanyLogoUrl, getFaviconUrl } from '../utils/autocomplete';
import '../styles/ProfileHeader.css';

const API_BASE = import.meta.env.VITE_API_URL || 'https://sia-2.onrender.com';

function getFullImageUrl(url) {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

/** Get primary institution (school or company) for headline display */
function getPrimaryInstitution(profile) {
    const educations = profile?.educations || [];
    const experiences = profile?.experiences || [];
    if (educations.length > 0) {
        const edu = educations[0];
        return {
            name: edu.school_name,
            logoUrl: edu.school_logo_url,
            website: edu.school_website,
        };
    }
    if (experiences.length > 0) {
        const exp = experiences[0];
        const domain = extractDomain(exp.website);
        return {
            name: exp.company_name,
            logoUrl: domain ? getCompanyLogoUrl(domain) : null,
            website: exp.website,
        };
    }
    return null;
}

function ProfileHeader({ profile, onCoverChange, onProfilePicChange, isEditing, onEditProfile }) {
    const coverInputRef = useRef(null);
    const profilePicInputRef = useRef(null);

    const coverUrl = profile?.cover_photo ? getFullImageUrl(profile.cover_photo) : null;
    const profilePicUrl = profile?.profile_picture ? getFullImageUrl(profile.profile_picture) : null;

    const fullName = [profile?.first_name, profile?.middle_name, profile?.last_name]
        .filter(Boolean)
        .join(' ') || '—';

    const institution = getPrimaryInstitution(profile);

    return (
        <header className="profile-header profile-header-linkedin">
            <div className="profile-cover-wrap">
                {coverUrl ? (
                    <img
                        src={getOptimizedUrl(coverUrl, 'hero')}
                        alt="Cover"
                        className="profile-cover"
                    />
                ) : (
                    <div className="profile-cover-placeholder" />
                )}
                {isEditing && (
                    <>
                        <input
                            ref={coverInputRef}
                            type="file"
                            accept="image/*"
                            className="profile-cover-input"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) onCoverChange(file);
                                e.target.value = '';
                            }}
                        />
                        <button
                            type="button"
                            className="profile-cover-gear"
                            onClick={() => coverInputRef.current?.click()}
                            title="Change cover photo"
                            aria-label="Change cover photo"
                        >
                            <FiSettings size={20} />
                        </button>
                    </>
                )}
            </div>
            <div className="profile-avatar-wrap">
                <div className="profile-avatar-inner">
                    {profilePicUrl ? (
                        <img
                            src={getOptimizedUrl(profilePicUrl, 'avatar')}
                            alt={fullName}
                            className="profile-avatar-img"
                        />
                    ) : (
                        <div className="profile-avatar-placeholder">
                            {fullName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    {isEditing && (
                        <>
                            <input
                                ref={profilePicInputRef}
                                type="file"
                                accept="image/*"
                                className="profile-avatar-input"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) onProfilePicChange(file);
                                    e.target.value = '';
                                }}
                            />
                            <button
                                type="button"
                                className="profile-avatar-pencil"
                                onClick={() => profilePicInputRef.current?.click()}
                                title="Edit profile picture"
                                aria-label="Edit profile picture"
                            >
                                <FiEdit3 size={16} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="profile-header-info">
                <div className="profile-header-info-inner">
                    <div className="profile-header-info-main">
                        <h1 className="profile-header-name" style={{ textTransform: 'capitalize' }}>
                            {fullName}
                        </h1>
                        {profile?.bio && (
                            <p className="profile-header-headline">{profile.bio}</p>
                        )}
                        <div className="profile-header-meta">
                            {profile?.location && (
                                <span className="profile-header-meta-item">{profile.location}</span>
                            )}
                            {(profile?.website || profile?.email) && (
                                <a
                                    href={profile.website
                                        ? (profile.website.startsWith('http') ? profile.website : `https://${profile.website}`)
                                        : `mailto:${profile.email || ''}`}
                                    target={profile.website ? '_blank' : undefined}
                                    rel={profile.website ? 'noopener noreferrer' : undefined}
                                    className="profile-header-contact"
                                >
                                    Contact info
                                </a>
                            )}
                        </div>
                        {onEditProfile && (
                            <div className="profile-header-actions">
                                <button
                                    type="button"
                                    className="profile-header-edit"
                                    onClick={onEditProfile}
                                    title="Edit profile"
                                >
                                    <FiEdit3 size={16} />
                                    Edit Profile
                                </button>
                            </div>
                        )}
                    </div>
                    {institution && (
                        <div className="profile-header-institution">
                            <div className="profile-header-institution-logo">
                                {(institution.logoUrl || institution.website) ? (
                                    <>
                                        <img
                                            src={institution.logoUrl || getFaviconUrl(extractDomain(institution.website))}
                                            alt=""
                                            onError={(e) => {
                                                const el = e.target;
                                                el.onerror = null;
                                                const d = extractDomain(institution.website);
                                                if (d) {
                                                    el.src = getFaviconUrl(d);
                                                    el.onerror = () => { el.style.display = 'none'; };
                                                } else {
                                                    el.style.display = 'none';
                                                }
                                            }}
                                        />
                                        <span className="profile-header-institution-initials profile-header-institution-fallback">
                                            {institution.name?.slice(0, 2).toUpperCase() || '?'}
                                        </span>
                                    </>
                                ) : (
                                    <span className="profile-header-institution-initials">
                                        {institution.name?.slice(0, 2).toUpperCase() || '?'}
                                    </span>
                                )}
                            </div>
                            <span className="profile-header-institution-name">{institution.name}</span>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default ProfileHeader;
