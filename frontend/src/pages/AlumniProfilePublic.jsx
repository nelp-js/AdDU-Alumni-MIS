import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import { useTitle } from '../Hooks/useTitle';
import '../styles/Alumni.css';
import '../styles/ProfileSection.css';
import {
    extractDomain,
    getCompanyLogoUrl,
    getFaviconUrl,
    guessDomainFromSchoolName,
    getSchoolLogoUrl,
} from '../utils/autocomplete';

const MONTH_ABBR = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const EMPLOYMENT_TYPES = {
    full_time: 'Full-time',
    part_time: 'Part-time',
    self_employed: 'Self-employed',
    freelance: 'Freelance',
    contract: 'Contract',
    internship: 'Internship',
    apprenticeship: 'Apprenticeship',
    seasonal: 'Seasonal',
    volunteer: 'Volunteer',
};
const SITE_TYPES = {
    on_site: 'On-site',
    remote: 'Remote',
    hybrid: 'Hybrid',
};
const ADDU_SEAL = 'https://res.cloudinary.com/dwi7oftcs/image/upload/v1770416948/UniversitySeal240px_zblv2w.png';

function getCompanyInitials(name) {
    if (!name || !name.trim()) return '?';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase().slice(0, 2);
    return name.slice(0, 2).toUpperCase();
}

function guessDomainFromCompanyName(name) {
    if (!name || !name.trim()) return null;
    const n = name.trim().toLowerCase();
    const known = [
        ['microsoft', 'microsoft.com'],
        ['apple', 'apple.com'],
        ['meta', 'meta.com'],
        ['facebook', 'meta.com'],
        ['netflix', 'netflix.com'],
        ['tesla', 'tesla.com'],
    ];
    for (const [key, domain] of known) {
        if (n.includes(key)) return domain;
    }
    const clean = n.replace(/[^a-z0-9]/g, '');
    return clean ? `${clean}.com` : null;
}

function formatExpDateRange(start, end, isCurrent) {
    if (!start && !end && !isCurrent) return '';
    const sd = start ? new Date(start) : null;
    const ed = isCurrent ? new Date() : (end ? new Date(end) : null);
    const s = sd ? `${MONTH_ABBR[sd.getMonth() + 1]} ${sd.getFullYear()}` : '';
    const e = isCurrent ? 'Present' : (ed ? `${MONTH_ABBR[ed.getMonth() + 1]} ${ed.getFullYear()}` : '');
    return [s, e].filter(Boolean).join(' - ');
}

function formatDuration(start, end, isCurrent) {
    if (!start) return '';
    const startDate = new Date(start);
    const endDate = isCurrent ? new Date() : (end ? new Date(end) : new Date());
    let months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
    if (endDate.getDate() >= startDate.getDate()) months++;
    if (months < 1) months = 0;
    const yrs = Math.floor(months / 12);
    const mos = months % 12;
    const parts = [];
    if (yrs > 0) parts.push(`${yrs} yr${yrs !== 1 ? 's' : ''}`);
    if (mos > 0) parts.push(`${mos} mos`);
    return parts.join(' ');
}

function formatEduDateRange(startMonth, startYear, endMonth, endYear) {
    const s = startYear ? `${MONTH_ABBR[Number(startMonth) || 0]} ${startYear}`.trim() : '';
    const e = endYear ? `${MONTH_ABBR[Number(endMonth) || 0]} ${endYear}`.trim() : '';
    if (!s && !e) return '';
    return [s || '—', e || '—'].join(' - ');
}

function AlumniProfilePublic() {
    useTitle('Alumni Profile');
    const { id } = useParams();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        setError('');
        api.get(`/api/users/public/${id}/`)
            .then((res) => setProfile(res.data || null))
            .catch(() => setError('Failed to load alumni profile.'))
            .finally(() => setLoading(false));
    }, [id]);

    return (
        <div className="alumni-page">
            <Header />
            <main className="alumni-main">
                <div className="alumni-back-row">
                    <Link to="/alumni" className="alumni-back-link">← Back to Find Alumni</Link>
                </div>

                {loading && <div className="alumni-state">Loading...</div>}
                {error && <div className="alumni-state alumni-error">{error}</div>}
                {!loading && !error && !profile && <div className="alumni-state">Profile not found.</div>}

                {!loading && !error && profile && (
                    <section className="alumni-profile-card">
                        {profile.cover_photo && (
                            <div className="alumni-cover-wrap">
                                <img src={profile.cover_photo} alt="" className="alumni-cover" />
                            </div>
                        )}
                        <div className="alumni-profile-header">
                            {profile.profile_picture ? (
                                <img src={profile.profile_picture} alt={profile.full_name || profile.username} className="alumni-profile-avatar" />
                            ) : (
                                <div className="alumni-profile-avatar-fallback">
                                    {(profile.full_name || profile.username || '?').charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h1 className="alumni-profile-name">{profile.full_name || profile.username}</h1>
                                <p className="alumni-meta">
                                    {(profile.program || 'Program N/A')} {profile.batch_year ? `· Batch ${profile.batch_year}` : ''}
                                </p>
                                <p className="alumni-meta">{profile.country || 'Country not specified'}</p>
                                {profile.email && <p className="alumni-meta">{profile.email}</p>}
                                {profile.website && (
                                    <a href={profile.website} target="_blank" rel="noreferrer" className="alumni-website">
                                        {profile.website}
                                    </a>
                                )}
                            </div>
                        </div>

                        {profile.bio && (
                            <div className="alumni-section">
                                <h2>About</h2>
                                <p>{profile.bio}</p>
                            </div>
                        )}

                        <div className="alumni-section">
                            <h2>Experience</h2>
                            {Array.isArray(profile.experiences) && profile.experiences.length > 0 ? (
                                <div className="alumni-list alumni-profile-rich-list">
                                    {profile.experiences.map((exp, idx) => {
                                        const range = formatExpDateRange(exp.start_date, exp.end_date, exp.is_current);
                                        const duration = formatDuration(exp.start_date, exp.end_date, exp.is_current);
                                        const empLabel = EMPLOYMENT_TYPES[exp.employment_type] || '';
                                        const siteLabel = SITE_TYPES[exp.site_type] || '';
                                        const nameLower = exp.company_name?.toLowerCase() || '';
                                        let src = null;
                                        if (nameLower.includes('google')) {
                                            src = 'https://www.gstatic.com/images/branding/product/2x/googleg_96dp.png';
                                        } else if (nameLower.includes('amazon')) {
                                            src = 'https://logo.clearbit.com/amazon.com';
                                        } else {
                                            const domain = extractDomain(exp.website) || guessDomainFromCompanyName(exp.company_name);
                                            src = domain ? getCompanyLogoUrl(domain) : null;
                                        }
                                        const initials = getCompanyInitials(exp.company_name);

                                        return (
                                            <div key={exp.id} className={`profile-exp-item ${idx > 0 ? 'profile-exp-item-divider' : ''}`}>
                                                <div className="profile-exp-logo" style={{ backgroundColor: '#ffffff', border: 'none' }}>
                                                    {src ? (
                                                        <>
                                                            <img
                                                                src={src}
                                                                alt={exp.company_name}
                                                                className="profile-exp-logo-img"
                                                                onError={(e) => {
                                                                    const img = e.currentTarget;
                                                                    const domain = extractDomain(exp.website) || guessDomainFromCompanyName(exp.company_name);
                                                                    if (domain && !img.dataset.triedFavicon) {
                                                                        img.dataset.triedFavicon = '1';
                                                                        img.src = getFaviconUrl(domain);
                                                                    } else {
                                                                        img.style.display = 'none';
                                                                        if (img.nextSibling) img.nextSibling.style.display = 'flex';
                                                                    }
                                                                }}
                                                            />
                                                            <span className="profile-exp-logo-initials profile-exp-logo-fallback" style={{ display: 'none' }}>
                                                                {initials}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="profile-exp-logo-initials">{initials}</span>
                                                    )}
                                                </div>
                                                <div className="profile-exp-body">
                                                    <div className="profile-exp-content">
                                                        <h3 className="profile-exp-title">{exp.job_title || '—'}</h3>
                                                        <p className="profile-exp-company">
                                                            {exp.company_name || '—'}{empLabel ? ` · ${empLabel}` : ''}
                                                        </p>
                                                        <p className="profile-exp-meta">
                                                            {range}
                                                            {duration ? ` · ${duration}` : ''}
                                                        </p>
                                                        {(exp.location || siteLabel) && (
                                                            <p className="profile-exp-meta">
                                                                {[exp.location, siteLabel].filter(Boolean).join(' · ')}
                                                            </p>
                                                        )}
                                                        {exp.description && <p className="profile-exp-desc">{exp.description}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="alumni-empty">No experience shared.</p>
                            )}
                        </div>

                        <div className="alumni-section">
                            <h2>Education</h2>
                            {Array.isArray(profile.educations) && profile.educations.length > 0 ? (
                                <div className="alumni-list alumni-profile-rich-list">
                                    {profile.educations.map((edu, idx) => {
                                        const dateStr = formatEduDateRange(edu.start_month, edu.start_year, edu.end_month, edu.end_year);
                                        const isAdDU = edu.school_name?.toLowerCase().includes('ateneo de davao');
                                        const domain = extractDomain(edu.school_website) || guessDomainFromSchoolName(edu.school_name);
                                        const logoUrl = edu.school_logo_url || (domain ? getSchoolLogoUrl(domain) : null);
                                        const faviconUrl = domain ? getFaviconUrl(domain) : null;
                                        const src = isAdDU ? ADDU_SEAL : (logoUrl || faviconUrl);

                                        return (
                                            <div key={edu.id} className={`profile-edu-item ${idx > 0 ? 'profile-edu-item-divider' : ''}`}>
                                                <div className="profile-edu-logo" style={{ backgroundColor: '#ffffff', padding: isAdDU ? '4px' : '0' }}>
                                                    {src ? (
                                                        <>
                                                            <img
                                                                src={src}
                                                                alt={edu.school_name}
                                                                className="profile-edu-logo-img"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                    if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                                                                }}
                                                            />
                                                            <span className="profile-edu-logo-fallback" style={{ display: 'none' }}>
                                                                {edu.school_name ? edu.school_name.slice(0, 1).toUpperCase() : '?'}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="profile-edu-logo-fallback">
                                                            {edu.school_name ? edu.school_name.slice(0, 1).toUpperCase() : '?'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="profile-edu-body">
                                                    <div className="profile-exp-content">
                                                        <h3 className="profile-edu-title">{edu.school_name || '—'}</h3>
                                                        <p className="profile-edu-subtitle">
                                                            {[edu.degree, edu.field_of_study].filter(Boolean).join(', ') || '—'}
                                                        </p>
                                                        {dateStr && <p className="profile-edu-meta">{dateStr}</p>}
                                                        {edu.activities && (
                                                            <p className="profile-edu-activities">Activities and societies: {edu.activities}</p>
                                                        )}
                                                        {edu.description && <p className="profile-edu-desc">{edu.description}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="alumni-empty">No education shared.</p>
                            )}
                        </div>
                    </section>
                )}
            </main>
            <Footer />
        </div>
    );
}

export default AlumniProfilePublic;
