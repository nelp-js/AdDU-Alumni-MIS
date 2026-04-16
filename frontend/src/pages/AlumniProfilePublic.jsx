import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import { useTitle } from '../Hooks/useTitle';
import '../styles/Alumni.css';

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
                                <p className="alumni-meta">{profile.location || 'Location not specified'}</p>
                                {profile.email && <p className="alumni-meta">{profile.email}</p>}
                                {(profile.phone_number || profile.telephone_number) && (
                                    <p className="alumni-meta">{profile.phone_number || profile.telephone_number}</p>
                                )}
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
                                <div className="alumni-list">
                                    {profile.experiences.map((exp) => (
                                        <div key={exp.id} className="alumni-list-item">
                                            <h3>{exp.job_title || '—'}</h3>
                                            <p>{exp.company_name || '—'}</p>
                                            {exp.location && <p>{exp.location}</p>}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="alumni-empty">No experience shared.</p>
                            )}
                        </div>

                        <div className="alumni-section">
                            <h2>Education</h2>
                            {Array.isArray(profile.educations) && profile.educations.length > 0 ? (
                                <div className="alumni-list">
                                    {profile.educations.map((edu) => (
                                        <div key={edu.id} className="alumni-list-item">
                                            <h3>{edu.school_name || '—'}</h3>
                                            <p>{edu.degree || '—'}{edu.field_of_study ? ` · ${edu.field_of_study}` : ''}</p>
                                        </div>
                                    ))}
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
