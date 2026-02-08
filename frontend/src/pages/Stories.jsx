import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTitle } from '../Hooks/useTitle';
import '../styles/Stories.css';

function Stories() {
    useTitle('News and Stories');

    return (
        <div className="stories-page">
            <Header />
            <main className="stories-main">
                <section className="stories-hero">
                    <h1 className="stories-title">News and Stories</h1>
                    <p className="stories-subtitle">Alumni news, stories, and features from the community.</p>
                </section>
            </main>
            <Footer />
        </div>
    );
}

export default Stories;
