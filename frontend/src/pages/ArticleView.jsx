import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import { useTitle } from '../Hooks/useTitle';
import '../styles/ArticleView.css';

function ArticleView() {
    const { id } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useTitle(article ? article.title : 'Article');

    useEffect(() => {
        api.get(`/api/articles/published/${id}/`)
            .then((res) => setArticle(res.data))
            .catch(() => setError('Article not found.'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="article-view-page">
            <Header />
            <main className="article-view-main"><div className="article-view-loading">Loading…</div></main>
            <Footer />
        </div>
    );

    if (error || !article) return (
        <div className="article-view-page">
            <Header />
            <main className="article-view-main">
                <div className="article-view-error">{error || 'Article not found.'}</div>
                <Link to="/stories" className="article-view-back">← Back to News &amp; Stories</Link>
            </main>
            <Footer />
        </div>
    );

    return (
        <div className="article-view-page">
            <Header />
            <main className="article-view-main">
                <article className="article-view-article">
                    {article.cover_image && (
                        <div className="article-view-image-wrap">
                            <img src={article.cover_image} alt="" className="article-view-image" />
                        </div>
                    )}
                    <h1 className="article-view-title">{article.title}</h1>
                    {article.subtitle && <p className="article-view-deck">{article.subtitle}</p>}
                    <p className="article-view-author">By {article.author_name || '—'}</p>
                    <div
                        className="article-view-content avenir-book"
                        dangerouslySetInnerHTML={{ __html: article.content || '' }}
                    />
                </article>
                <Link to="/stories" className="article-view-back">← Back to News &amp; Stories</Link>
            </main>
            <Footer />
        </div>
    );
}

export default ArticleView;
