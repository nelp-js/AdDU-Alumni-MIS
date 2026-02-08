import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/CreateContent.css';
import { useTitle } from '../Hooks/useTitle';

const MAX_SUBTITLE = 280;
const MAX_WORDS = 1200;

function stripHtml(html) {
    if (!html || typeof html !== 'string') return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

function countWords(html) {
    const text = stripHtml(html).trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
}

function RichTextEditor({ value, onChange, placeholder }) {
    const editorRef = useRef(null);
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (!editorRef.current) return;
        if (isInitialMount.current) {
            editorRef.current.innerHTML = value || '';
            isInitialMount.current = false;
        }
        if (value === '') {
            editorRef.current.innerHTML = '';
        }
    }, [value]);

    const handleInput = useCallback(() => {
        const el = editorRef.current;
        if (!el) return;
        const html = el.innerHTML;
        onChange(html === '<br>' ? '' : html);
    }, [onChange]);

    const exec = useCallback((cmd, val = null) => {
        document.execCommand(cmd, false, val);
        editorRef.current?.focus();
        handleInput();
    }, [handleInput]);

    return (
        <div className="cc-rich-editor">
            <div className="cc-toolbar">
                <button type="button" className="cc-tb-btn" onClick={() => exec('bold')} title="Bold">
                    <b>B</b>
                </button>
                <button type="button" className="cc-tb-btn" onClick={() => exec('underline')} title="Underline">
                    <u>U</u>
                </button>
                <span className="cc-tb-sep" />
                <button type="button" className="cc-tb-btn" onClick={() => exec('formatBlock', 'h2')} title="Heading 2">
                    H2
                </button>
                <button type="button" className="cc-tb-btn" onClick={() => exec('formatBlock', 'h3')} title="Heading 3">
                    H3
                </button>
                <button type="button" className="cc-tb-btn" onClick={() => exec('formatBlock', 'p')} title="Paragraph">
                    P
                </button>
                <span className="cc-tb-sep" />
                <button type="button" className="cc-tb-btn" onClick={() => exec('insertUnorderedList')} title="Bullet list">
                    •
                </button>
                <button type="button" className="cc-tb-btn" onClick={() => exec('insertOrderedList')} title="Numbered list">
                    1.
                </button>
                <button type="button" className="cc-tb-btn" onClick={() => exec('formatBlock', 'blockquote')} title="Quote">
                    “
                </button>
            </div>
            <div
                ref={editorRef}
                className="cc-editor-body"
                contentEditable
                suppressContentEditableWarning
                data-placeholder={placeholder}
                onInput={handleInput}
            />
        </div>
    );
}

function CreateContent() {
    useTitle('Create Content');
    const navigate = useNavigate();
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const [title, setTitle] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [coverImage, setCoverImage] = useState(null);
    const [content, setContent] = useState('');

    const subtitleCount = subtitle.length;
    const wordCount = useMemo(() => countWords(content), [content]);
    const overSubtitle = subtitleCount > MAX_SUBTITLE;
    const overWords = wordCount > MAX_WORDS;
    const canSubmit = Boolean(
        title.trim() &&
        authorName.trim() &&
        !overSubtitle &&
        !overWords
    );

    const handleSubmit = (status) => {
        if (!canSubmit) return;
        setSubmitError('');
        setLoading(true);
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('author_name', authorName.trim());
        formData.append('subtitle', subtitle.trim().slice(0, MAX_SUBTITLE));
        formData.append('content', content);
        formData.append('status', status);
        if (coverImage) formData.append('cover_image', coverImage);

        api.post('/api/articles/', formData)
            .then(() => {
                setSuccess(true);
                setTimeout(() => navigate('/dashboard/content'), 3000);
            })
            .catch((err) => {
                const data = err.response?.data;
                setSubmitError(
                    data?.detail
                        ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail))
                        : 'Failed to save. Try again.'
                );
            })
            .finally(() => setLoading(false));
    };

    return (
        <div className="create-content-page">
            <Header />
            <main className="create-content-main">
                <h1 className="create-content-title">Create Content</h1>
                <p className="create-content-subtitle">Add a news article or story. Save as draft or publish.</p>

                <div className="create-content-form-box">
                    {success && (
                        <div className="create-content-success">
                            <p>✓ Content saved successfully. Redirecting to Manage Content…</p>
                        </div>
                    )}

                    {!success && (
                        <form
                            className="create-content-form"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSubmit('draft');
                            }}
                        >
                            {submitError && <div className="create-content-error">{submitError}</div>}

                            <div className="cc-field">
                                <label className="cc-label">Title <span className="cc-required">*</span></label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="cc-input"
                                    placeholder="Article title"
                                    required
                                />
                            </div>

                            <div className="cc-field">
                                <label className="cc-label">Author Name <span className="cc-required">*</span></label>
                                <input
                                    type="text"
                                    value={authorName}
                                    onChange={(e) => setAuthorName(e.target.value)}
                                    className="cc-input"
                                    placeholder="Author name"
                                    required
                                />
                            </div>

                            <div className="cc-field">
                                <div className="cc-label-row">
                                    <label className="cc-label">Subtitle / Deck (optional)</label>
                                    <span className={`cc-counter ${overSubtitle ? 'cc-counter-over' : ''}`}>
                                        {subtitleCount}/{MAX_SUBTITLE}
                                    </span>
                                </div>
                                <textarea
                                    value={subtitle}
                                    onChange={(e) => setSubtitle(e.target.value)}
                                    className="cc-textarea cc-subtitle"
                                    placeholder="Short deck or subtitle"
                                    maxLength={MAX_SUBTITLE + 1}
                                    rows={3}
                                />
                            </div>

                            <div className="cc-field">
                                <label className="cc-label">Cover Image (optional)</label>
                                <label className="cc-file-wrap">
                                    <span className="cc-file-label">
                                        {coverImage ? coverImage.name : 'Choose JPG or PNG'}
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/jpg"
                                        onChange={(e) => setCoverImage(e.target.files[0] || null)}
                                        className="cc-file-input"
                                    />
                                    <span className="cc-browse">Browse</span>
                                </label>
                                {coverImage && (
                                    <div className="cc-preview-wrap">
                                        <img
                                            src={URL.createObjectURL(coverImage)}
                                            alt="Cover preview"
                                            className="cc-cover-preview"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="cc-field">
                                <div className="cc-label-row">
                                    <label className="cc-label">Article Content</label>
                                    <span className={`cc-counter ${overWords ? 'cc-counter-over' : ''}`}>
                                        {wordCount} / {MAX_WORDS} words
                                    </span>
                                </div>
                                <div className="cc-editor-wrap">
                                    <RichTextEditor
                                        value={content}
                                        onChange={setContent}
                                        placeholder="Write your article…"
                                    />
                                </div>
                            </div>

                            <div className="cc-actions">
                                <button
                                    type="button"
                                    className="cc-btn cc-cancel"
                                    onClick={() => navigate('/dashboard/content')}
                                >
                                    Cancel
                                </button>
                                <div className="cc-actions-right">
                                    <button
                                        type="button"
                                        className="cc-btn cc-draft"
                                        disabled={!canSubmit || loading}
                                        onClick={() => handleSubmit('draft')}
                                    >
                                        {loading ? 'Saving…' : 'Save as Draft'}
                                    </button>
                                    <button
                                        type="button"
                                        className="cc-btn cc-publish"
                                        disabled={!canSubmit || loading}
                                        onClick={() => handleSubmit('published')}
                                    >
                                        {loading ? 'Publishing…' : 'Publish Article'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default CreateContent;
