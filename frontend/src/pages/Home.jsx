import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/Home.css';
import { useTitle } from '../Hooks/useTitle';
import { ACCESS_TOKEN } from '../constants';
import { getOptimizedUrl } from '../utils/imageUtils';

// Strips formatting from copy-pasted "Math Bold" text so CSS fonts apply
function cleanText(text) {
    if (!text) return "";
    return text.normalize("NFKD");
}

function Home() {
    useTitle('Home');
    const isLoggedIn = !!localStorage.getItem(ACCESS_TOKEN);
    const [latestArticles, setLatestArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/articles/published/')
            .then((res) => {
                const list = Array.isArray(res.data) ? res.data : [];
                // Sort by approved_at (publish date) descending, fallback to created_at
                const sorted = [...list].sort((a, b) => {
                    const dateA = a.approved_at || a.created_at || '';
                    const dateB = b.approved_at || b.created_at || '';
                    return dateB.localeCompare(dateA);
                });
                setLatestArticles(sorted.slice(0, 3));
            })
            .catch(() => setLatestArticles([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="home-page">
            <Header />

            <main className="home-main">
                {/* Hero */}
                <section className="home-hero">
                    <h1 className="hero-title">Ad Majorem Dei Gloriam!</h1>
                    <p className="hero-message">
                        Empowered by Fortes in Fide, we strive to inspire, lead, and give back.
                    </p>
                    {!isLoggedIn && (
                        <Link to="/login" className="hero-cta">
                            Reconnect Today
                        </Link>
                    )}
                </section>

                {/* Full-width image */}
                <section className="home-image-section">
                    <img
                        src={getOptimizedUrl('https://res.cloudinary.com/dwi7oftcs/image/upload/v1770416955/bg01_k3q7et.jpg', 'hero')}
                        alt="Ateneo campus"
                        className="home-hero-image"
                    />
                </section>

                {/* Welcome */}
                <section className="home-welcome">
                    <h2 className="welcome-title">WELCOME HOME.</h2>
                    <p className="welcome-subheading">
                        Alumni news, feature stories and live events.
                    </p>
                </section>

                {/* Cards – 3 latest published articles */}
                <section className="home-cards">
                    {loading && (
                        <p className="home-cards-loading">Loading…</p>
                    )}
                    {!loading && latestArticles.length === 0 && (
                        <p className="home-cards-empty">No stories yet.</p>
                    )}
                    {!loading && latestArticles.map((article) => {
                        const imageUrl = getOptimizedUrl(article.cover_image, 'card');
                        const displayTitle = cleanText(article.title || '—');
                        const displaySubtitle = cleanText(article.subtitle || '');
                        return (
                            <Link
                                key={article.id}
                                to={`/stories/${article.id}`}
                                className="home-card"
                            >
                                <div className="home-card-image-wrap">
                                    {imageUrl ? (
                                        <img src={imageUrl} alt={displayTitle} className="home-card-image" />
                                    ) : (
                                        <div className="home-card-image-placeholder" />
                                    )}
                                </div>
                                <div className="home-card-content">
                                    <h3 className="home-card-title">{displayTitle}</h3>
                                    <p className="home-card-description">{displaySubtitle}</p>
                                    <span className="home-card-btn">Read More</span>
                                </div>
                            </Link>
                        );
                    })}
                </section>
            </main>

            <Footer />
        </div>
    );
}

export default Home;