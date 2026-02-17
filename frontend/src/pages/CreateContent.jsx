import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle, FontSize } from '@tiptap/extension-text-style';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/CreateContent.css';
import { useTitle } from '../Hooks/useTitle';

const MAX_SUBTITLE = 280;
const MAX_WORDS = 1200;

const FONT_SIZES = [12, 14, 16, 18, 20, 24];

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

function TiptapToolbar({ editor }) {
    if (!editor) return null;

    return (
        <div className="cc-tiptap-toolbar">
            <span className="cc-tb-group">
                <select
                    className="cc-tb-select"
                    value=""
                    onChange={(e) => {
                        const px = e.target.value;
                        if (px) editor.chain().focus().setFontSize(`${px}px`).run();
                        e.target.value = '';
                    }}
                    aria-label="Font size"
                >
                    <option value="">Size</option>
                    {FONT_SIZES.map((n) => (
                        <option key={n} value={n}>{n}</option>
                    ))}
                </select>
            </span>
            <span className="cc-tb-group">
                <button type="button" className="cc-tb-btn" onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
                    <b>B</b>
                </button>
                <button type="button" className="cc-tb-btn" onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
                    <i>I</i>
                </button>
                <button type="button" className="cc-tb-btn" onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
                    <u>U</u>
                </button>
            </span>
            <span className="cc-tb-group">
                <select
                    className="cc-tb-select"
                    value=""
                    onChange={(e) => {
                        const v = e.target.value;
                        if (v === '') editor.chain().focus().setParagraph().run();
                        else editor.chain().focus().toggleHeading({ level: Number(v) }).run();
                        e.target.value = '';
                    }}
                    aria-label="Heading"
                >
                    <option value="">Paragraph</option>
                    <option value="2">H2</option>
                    <option value="3">H3</option>
                </select>
            </span>
            <span className="cc-tb-group">
                <button type="button" className="cc-tb-btn" onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">•</button>
                <button type="button" className="cc-tb-btn" onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">1.</button>
                <button type="button" className="cc-tb-btn" onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">"</button>
            </span>
            <span className="cc-tb-group">
                <button type="button" className="cc-tb-btn" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear formatting">Clear</button>
            </span>
        </div>
    );
}

function CreateContent() {
    const { id } = useParams();
    const isEditMode = Boolean(id);
    useTitle(isEditMode ? 'Edit Content' : 'Create Content');
    const navigate = useNavigate();
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [submitError, setSubmitError] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    const [title, setTitle] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [coverImage, setCoverImage] = useState(null);
    const [existingCoverUrl, setExistingCoverUrl] = useState(null);
    const [content, setContent] = useState('');

    const subtitleCount = subtitle.length;
    const wordCount = useMemo(() => countWords(content), [content]);
    const overSubtitle = subtitleCount > MAX_SUBTITLE;
    const overWords = wordCount > MAX_WORDS;
    const hasCover = coverImage || existingCoverUrl;
    const canSubmit = Boolean(
        title.trim() &&
        authorName.trim() &&
        subtitle.trim() &&
        hasCover &&
        !overSubtitle &&
        !overWords
    );

    const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);
    useEffect(() => {
        if (coverImage) {
            const url = URL.createObjectURL(coverImage);
            setCoverPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        setCoverPreviewUrl(existingCoverUrl);
    }, [coverImage, existingCoverUrl]);

    useEffect(() => {
        if (!isEditMode || !id) return;
        setFetchLoading(true);
        setLoadError(null);
        api.get(`/api/articles/${id}/`)
            .then((res) => {
                const a = res.data;
                setTitle(a.title || '');
                setAuthorName(a.author_name || '');
                setSubtitle(a.subtitle || '');
                setContent(a.content || '');
                if (a.cover_image) setExistingCoverUrl(a.cover_image);
            })
            .catch(() => setLoadError('Failed to load article.'))
            .finally(() => setFetchLoading(false));
    }, [isEditMode, id]);

    const onUpdate = useCallback(({ editor }) => {
        setContent(editor.getHTML());
    }, []);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextStyle,
            FontSize,
            Placeholder.configure({ placeholder: 'Write your article…' }),
        ],
        content: content || '',
        editorProps: {
            attributes: {
                class: 'cc-tiptap-editor-body',
            },
        },
        onUpdate,
    });

    const initialContentSet = useRef(false);
    useEffect(() => {
        if (editor && isEditMode && content && !initialContentSet.current) {
            editor.commands.setContent(content);
            initialContentSet.current = true;
        }
    }, [editor, isEditMode, content]);

    const handleSubmit = (status) => {
        if (!canSubmit) return;
        if (!hasCover) {
            setSubmitError('Cover image is required.');
            return;
        }
        const html = editor?.getHTML() ?? content;
        setSubmitError('');
        setLoading(true);
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('author_name', authorName.trim());
        formData.append('subtitle', subtitle.trim().slice(0, MAX_SUBTITLE));
        formData.append('content', html);
        if (isEditMode) {
            if (coverImage) formData.append('cover_image', coverImage);
            api.patch(`/api/articles/${id}/`, formData)
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
        } else {
            formData.append('status', status);
            formData.append('cover_image', coverImage);
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
        }
    };

    const previewContent = editor?.getHTML() ?? content;

    return (
        <div className="create-content-page">
            <Header />
            <main className="create-content-main">
                <h1 className="create-content-title">{isEditMode ? 'Edit Content' : 'Create Content'}</h1>
                <p className="create-content-subtitle">
                    {isEditMode ? 'Update the article. Changes will be saved.' : 'Add a news article or story. Save as draft or publish.'}
                </p>

                <div className="create-content-form-box">
                    {success && (
                        <div className="create-content-success">
                            <p>✓ Content saved successfully. Redirecting to Manage Content…</p>
                        </div>
                    )}

                    {loadError && <div className="create-content-error">{loadError}</div>}
                    {fetchLoading && <div className="create-content-loading">Loading article…</div>}
                    {!success && !fetchLoading && (
                            <form
                            className="create-content-form"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSubmit(isEditMode ? null : 'draft');
                            }}
                        >
                            {submitError && <div className="create-content-error">{submitError}</div>}

                            <div className="cc-field">
                                <label className="cc-label">Title <span className="cc-required">*</span></label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onPaste={(e) => {
                                        e.preventDefault();
                                        const plain = e.clipboardData.getData('text/plain');
                                        const input = e.target;
                                        const start = input.selectionStart;
                                        const end = input.selectionEnd;
                                        setTitle(title.slice(0, start) + plain + title.slice(end));
                                    }}
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
                                    onPaste={(e) => {
                                        e.preventDefault();
                                        const plain = e.clipboardData.getData('text/plain');
                                        const input = e.target;
                                        setAuthorName(authorName.slice(0, input.selectionStart) + plain + authorName.slice(input.selectionEnd));
                                    }}
                                    className="cc-input"
                                    placeholder="Author name"
                                    required
                                />
                            </div>

                            <div className="cc-field">
                                <div className="cc-label-row">
                                    <label className="cc-label">Subtitle / Deck <span className="cc-required">*</span></label>
                                    <span className={`cc-counter ${overSubtitle ? 'cc-counter-over' : ''}`}>
                                        {subtitleCount}/{MAX_SUBTITLE}
                                    </span>
                                </div>
                                <textarea
                                    value={subtitle}
                                    onChange={(e) => setSubtitle(e.target.value)}
                                    onPaste={(e) => {
                                        e.preventDefault();
                                        const plain = e.clipboardData.getData('text/plain');
                                        const ta = e.target;
                                        const start = ta.selectionStart;
                                        const end = ta.selectionEnd;
                                        const next = subtitle.slice(0, start) + plain + subtitle.slice(end);
                                        if (next.length <= MAX_SUBTITLE + 1) setSubtitle(next);
                                    }}
                                    className="cc-textarea cc-subtitle"
                                    placeholder="Short deck or subtitle"
                                    maxLength={MAX_SUBTITLE + 1}
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="cc-field">
                                <label className="cc-label">Cover Image <span className="cc-required">*</span></label>
                                <label className="cc-file-wrap">
                                    <span className="cc-file-label">
                                        {coverImage ? coverImage.name : (existingCoverUrl ? 'Change cover (JPG or PNG)' : 'Choose JPG or PNG')}
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/jpg"
                                        onChange={(e) => setCoverImage(e.target.files[0] || null)}
                                        className="cc-file-input"
                                    />
                                    <span className="cc-browse">Browse</span>
                                </label>
                                {coverPreviewUrl && (
                                    <div className="cc-preview-wrap">
                                        <img
                                            src={coverPreviewUrl}
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
                                <div className="cc-editor-wrap cc-tiptap-wrap">
                                    <TiptapToolbar editor={editor} />
                                    <EditorContent editor={editor} />
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
                                        className="cc-btn cc-preview-btn"
                                        onClick={() => setShowPreview(true)}
                                    >
                                        Open Preview
                                    </button>
                                    {isEditMode ? (
                                        <button
                                            type="button"
                                            className="cc-btn cc-draft"
                                            disabled={!canSubmit || loading}
                                            onClick={() => handleSubmit(null)}
                                        >
                                            {loading ? 'Saving…' : 'Save'}
                                        </button>
                                    ) : (
                                        <>
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
                                                {loading ? 'Publishing…' : 'Publish'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </main>
            <Footer />

            {showPreview && (
                <div className="cc-preview-overlay" onClick={() => setShowPreview(false)}>
                    <div className="cc-preview-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="cc-preview-article">
                            {coverPreviewUrl && (
                                <div className="cc-preview-image-wrap">
                                    <img src={coverPreviewUrl} alt="" className="cc-preview-image" />
                                </div>
                            )}
                            <h1 className="cc-preview-title">{title || 'Untitled'}</h1>
                            {subtitle && <p className="cc-preview-deck">{subtitle}</p>}
                            <p className="cc-preview-author">{authorName || '—'}</p>
                            <div
                                className="cc-preview-content avenir-book"
                                dangerouslySetInnerHTML={{ __html: previewContent || '<p></p>' }}
                            />
                        </div>
                        <button type="button" className="cc-preview-close" onClick={() => setShowPreview(false)}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CreateContent;
