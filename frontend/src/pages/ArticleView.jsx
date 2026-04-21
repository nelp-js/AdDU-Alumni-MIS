import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import { useTitle } from '../Hooks/useTitle';
import '../styles/ArticleView.css';
import { copyTextToClipboard, getCurrentUrl, getSocialShareUrl, shareContent } from '../utils/share';

function ArticleView() {
    const { id } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [shareMessage, setShareMessage] = useState('');

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
            <main className="article-view-main">
                <p className="article-view-loading">Loading…</p>
                <Link to="/stories" className="article-view-all-stories">« News &amp; Stories</Link>
            </main>
            <Footer />
        </div>
    );

    if (error || !article) return (
        <div className="article-view-page">
            <Header />
            <main className="article-view-main">
                <div className="article-view-error">{error || 'Article not found.'}</div>
                <Link to="/stories" className="article-view-all-stories">« News &amp; Stories</Link>
            </main>
            <Footer />
        </div>
    );

    const shareUrl = getCurrentUrl();
    const facebookShareUrl = getSocialShareUrl('facebook', shareUrl);
    const linkedInShareUrl = getSocialShareUrl('linkedin', shareUrl);

    async function handleNativeShare() {
        const result = await shareContent({
            title: article.title || 'Article',
            text: article.subtitle || 'Check out this article.',
            url: shareUrl,
        });
        if (result?.method === 'native') {
            setShareMessage('Shared.');
        } else if (result?.method === 'clipboard') {
            setShareMessage('Link copied.');
        } else if (!result?.cancelled) {
            setShareMessage('Unable to share right now.');
        }
    }

    async function handleCopyShareLink() {
        try {
            const copied = await copyTextToClipboard(shareUrl);
            setShareMessage(copied ? 'Link copied.' : 'Unable to copy link.');
        } catch {
            setShareMessage('Unable to copy link.');
        }
    }

    return (
        <div className="article-view-page">
            <Header />
            <main className="article-view-main">
                <Link to="/stories" className="article-view-all-stories">« News &amp; Stories</Link>
                <h1 className="article-view-title">{article.title}</h1>
                {article.cover_image && (
                    <div className="article-view-banner-wrap">
                        <img src={article.cover_image} alt="" className="article-view-banner" />
                    </div>
                )}
                {article.subtitle && <p className="article-view-deck">{article.subtitle}</p>}
                <p className="article-view-author">By {article.author_name || '—'}</p>
                <div className="article-view-share">
                    <h3>SHARE</h3>
                    <div className="article-view-share-icons">
                        <a href={facebookShareUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                        </a>
                        <a href={linkedInShareUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                        </a>
                        <button type="button" onClick={handleNativeShare} aria-label="Share this article">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="18" cy="5" r="3" />
                                <circle cx="6" cy="12" r="3" />
                                <circle cx="18" cy="19" r="3" />
                                <line x1="8.6" y1="10.7" x2="15.4" y2="6.3" />
                                <line x1="8.6" y1="13.3" x2="15.4" y2="17.7" />
                            </svg>
                        </button>
                        <button type="button" onClick={handleCopyShareLink} aria-label="Copy article link">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 5" />
                                <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 1 0 7.07 7.07L13 19" />
                            </svg>
                        </button>
                    </div>
                    {shareMessage && <p className="article-view-share-message">{shareMessage}</p>}
                </div>
                <div
                    className="article-view-content avenir-book"
                    dangerouslySetInnerHTML={{ __html: article.content || '' }}
                />
            </main>
            <Footer />
        </div>
    );
}

export default ArticleView;
