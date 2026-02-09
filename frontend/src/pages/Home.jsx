import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/Home.css';
import { useTitle } from '../Hooks/useTitle';
import { ACCESS_TOKEN } from '../constants';
import { getOptimizedUrl } from '../utils/imageUtils';

function Home() {
    useTitle('Home');
    const isLoggedIn = !!localStorage.getItem(ACCESS_TOKEN);
    
    const cards = [
        {
            image: '/cs alumni.jpg',
            title: 'CS Alumni Gathering Kickoff 2025',
            description: 'Computer Studies Alumni heaped together to celebrate, reunited at the Calungsod San-Vitores Center for an unforgettable evening of connection and celebration.',
        },
        {
            image: '/mugna ui.jpg',
            title: 'Talks & Workshops | UI/UX as a Career in 2025',
            description: 'Mr. Erbert Ryan Moralde shared valuable insights and tips on pursuing UI/UX as a career with the CS Cluster students at Bapa Benny Tudtud Auditorium.',
        },
        {
            image: '/aws talk.jpg',
            title: 'Talks & Workshops | Securing Serverless Applications',
            description: 'Mr. Ike Yuson shows the CS Cluster students at F600/601 how to secure serverless applications for their web projects.',
        },
    ];

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
                        // 👇 Optimized using 'hero' type (w_1200)
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

                {/* Cards */}
                <section className="home-cards">
                    {cards.map((card, index) => (
                        <article key={index} className="home-card">
                            <div className="home-card-image-wrap">
                                <img
                    
                                    src={getOptimizedUrl(card.image, 'card')}
                                    alt=""
                                    className="home-card-image"
                                />
                            </div>
                            <div className="home-card-content">
                                <h3 className="home-card-title">{card.title}</h3>
                                <p className="home-card-description">{card.description}</p>
                                <button type="button" className="home-card-btn">
                                    Read More
                                </button>
                            </div>
                        </article>
                    ))}
                </section>
            </main>

            <Footer />
        </div>
    );
}

export default Home;