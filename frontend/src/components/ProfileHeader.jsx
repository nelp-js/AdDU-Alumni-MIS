import { useRef } from 'react';
import { getOptimizedUrl } from '../utils/imageUtils';
import '../styles/ProfileHeader.css';

const API_BASE = import.meta.env.VITE_API_URL || 'https://sia-2.onrender.com';

function getFullImageUrl(url) {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

function ProfileHeader({ profile, onCoverChange, onProfilePicChange, isEditing }) {
    const coverInputRef = useRef(null);
    const profilePicInputRef = useRef(null);

    const coverUrl = profile?.cover_photo ? getFullImageUrl(profile.cover_photo) : null;
    const profilePicUrl = profile?.profile_picture ? getFullImageUrl(profile.profile_picture) : null;

    const fullName = [profile?.first_name, profile?.middle_name, profile?.last_name]
        .filter(Boolean)
        .join(' ') || '—';

    return (
        <header className="profile-header">
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
                            className="profile-cover-edit"
                            onClick={() => coverInputRef.current?.click()}
                        >
                            Change cover photo
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
                                className="profile-avatar-edit"
                                onClick={() => profilePicInputRef.current?.click()}
                            >
                                Edit
                            </button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

export default ProfileHeader;
