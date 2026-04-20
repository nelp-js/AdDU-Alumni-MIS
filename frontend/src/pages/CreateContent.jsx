import { useState, useMemo, useEffect, useRef } from 'react';
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
const MAX_TITLE = 140;
const MAX_AUTHOR = 70;
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

    // Sync dropdown with current selection
    const currentSize = editor.getAttributes('textStyle').fontSize?.replace('px', '') || '';
    const currentHeading = editor.isActive('heading', { level: 2 }) ? '2' : editor.isActive('heading', { level: 3 }) ? '3' : '';

    return (
        <div className="cc-tiptap-toolbar">
            <span className="cc-tb-group">
                <select
                    className="cc-tb-select"
                    value={currentSize}
                    onChange={(e) => {
                        const px = e.target.value;
                        // .focus() ensures the style is applied to the cursor position immediately
                        if (px) editor.chain().focus().setFontSize(`${px}px`).run();
                        else editor.chain().focus().unsetFontSize().run();
                    }}
                    aria-label="Font size"
                >
                    <option value="">Size</option>
                    {FONT_SIZES.map((n) => (
                        <option key={n} value={n.toString()}>{n}</option>
                    ))}
                </select>
            </span>

            <span className="cc-tb-group">
                <button type="button" className={`cc-tb-btn ${editor.isActive('bold') ? 'is-active' : ''}`} onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></button>
                <button type="button" className={`cc-tb-btn ${editor.isActive('italic') ? 'is-active' : ''}`} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></button>
                <button type="button" className={`cc-tb-btn ${editor.isActive('underline') ? 'is-active' : ''}`} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></button>
            </span>

            <span className="cc-tb-group">
                <select
                    className="cc-tb-select"
                    value={currentHeading}
                    onChange={(e) => {
                        const v = e.target.value;
                        if (v === '') editor.chain().focus().setParagraph().run();
                        else editor.chain().focus().toggleHeading({ level: Number(v) }).run();
                    }}
                >
                    <option value="">Paragraph</option>
                    <option value="2">H2</option>
                    <option value="3">H3</option>
                </select>
            </span>

            <span className="cc-tb-group">
                <button type="button" className="cc-tb-btn" onClick={() => editor.chain().focus().toggleBulletList().run()}>•</button>
                <button type="button" className="cc-tb-btn" onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.</button>
                <button type="button" className="cc-tb-btn" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>Clear</button>
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
    const [_loadError, setLoadError] = useState(null);
    const [submitError, setSubmitError] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    // Form States
    const [title, setTitle] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [category, setCategory] = useState('');
    const [isFeatured, setIsFeatured] = useState(false);
    const [coverImage, setCoverImage] = useState(null);
    const [existingCoverUrl, setExistingCoverUrl] = useState(null);
    const [content, setContent] = useState('');
    const lastValidContentRef = useRef('');
    const isRevertingEditorRef = useRef(false);

    const wordCount = useMemo(() => countWords(content), [content]);
    const overTitle = title.length > MAX_TITLE;
    const overAuthor = authorName.length > MAX_AUTHOR;
    const overSubtitle = subtitle.length > MAX_SUBTITLE;
    const overWords = wordCount > MAX_WORDS;
    
    const canSubmit = Boolean(
        title.trim() && 
        authorName.trim() && 
        subtitle.trim() && 
        category && 
        (coverImage || existingCoverUrl) &&
        !overTitle &&
        !overAuthor &&
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
        api.get(`/api/articles/${id}/`)
            .then((res) => {
                const a = res.data;
                setTitle(a.title || '');
                setAuthorName(a.author_name || '');
                setSubtitle(a.subtitle || '');
                setCategory(a.category || '');
                setIsFeatured(a.is_featured || false);
                setContent(a.content || '');
                lastValidContentRef.current = a.content || '';
                if (a.cover_image) setExistingCoverUrl(a.cover_image);
            })
            .catch(() => setLoadError('Failed to load article.'))
            .finally(() => setFetchLoading(false));
    }, [isEditMode, id]);

    const editor = useEditor({
        extensions: [
            StarterKit, 
            Underline, 
            TextStyle, 
            FontSize, 
            Placeholder.configure({ placeholder: 'Write your article…' })
        ],
        content: content || '',
        onUpdate: ({ editor }) => {
            if (isRevertingEditorRef.current) return;
            const nextHtml = editor.getHTML();
            const nextWords = countWords(nextHtml);

            if (nextWords <= MAX_WORDS) {
                setContent(nextHtml);
                lastValidContentRef.current = nextHtml;
                return;
            }

            // Hard-cap full content at MAX_WORDS by restoring last accepted value.
            isRevertingEditorRef.current = true;
            editor.commands.setContent(lastValidContentRef.current || '<p></p>', false);
            isRevertingEditorRef.current = false;
        },
    });

    const initialContentSet = useRef(false);
    useEffect(() => {
        if (editor && isEditMode && content && !initialContentSet.current) {
            editor.commands.setContent(content);
            initialContentSet.current = true;
        }
    }, [editor, isEditMode, content]);

    const handleSubmit = ({ forcePending = false } = {}) => {
        setSubmitError('');
        const issues = [];
        if (!title.trim()) issues.push('Article title is required.');
        if (!authorName.trim()) issues.push('Author name is required.');
        if (!subtitle.trim()) issues.push('Summary is required.');
        if (!category) issues.push('Category is required.');
        if (!(coverImage || existingCoverUrl)) issues.push('Cover image is required.');
        if (overTitle) issues.push(`Article title must be ${MAX_TITLE} characters or less.`);
        if (overAuthor) issues.push(`Author name must be ${MAX_AUTHOR} characters or less.`);
        if (overSubtitle) issues.push(`Summary must be ${MAX_SUBTITLE} characters or less.`);
        if (overWords) issues.push(`Full content must be ${MAX_WORDS} words or less.`);

        if (issues.length > 0) {
            setSubmitError(`Publishing failed: ${issues.join(' ')}`);
            return;
        }
        setLoading(true);
        const html = editor?.getHTML() ?? content;
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('author_name', authorName.trim());
        formData.append('subtitle', subtitle.trim());
        formData.append('category', category);
        formData.append('is_featured', isFeatured);
        formData.append('content', html);
        if (!isEditMode && forcePending) {
            // New submissions enter admin review queue (shown as "Pending" in management UI).
            formData.append('status', 'draft');
        }

        if (coverImage) formData.append('cover_image', coverImage);

        const request = isEditMode ? api.patch(`/api/articles/${id}/`, formData) : api.post('/api/articles/', formData);

        request
            .then(() => {
                setSuccess(true);
                setTimeout(() => navigate('/dashboard/content'), 3000);
            })
            .catch((err) => {
                const data = err.response?.data;
                if (data && typeof data === 'object') {
                    const entries = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
                    setSubmitError(`Publishing failed: ${entries.join(' ')}`);
                } else {
                    setSubmitError('Publishing failed. Please check highlighted limits and required fields.');
                }
            })
            .finally(() => setLoading(false));
    };

    return (
        <div className="create-content-page">
            <Header />
            <main className="create-content-main">
                <h1 className="create-content-title">{isEditMode ? 'Edit Content' : 'Create Content'}</h1>
                <div className="create-content-form-box">
                    {success && (
                        <div className="create-content-success">
                            <p>
                                ✓ {isEditMode
                                    ? 'Article updated successfully!'
                                    : 'Your content has been submitted and is pending approval.'}
                            </p>
                            <p>Redirecting to dashboard...</p>
                        </div>
                    )}
                    {fetchLoading && <div className="create-content-loading">Loading article data...</div>}

                    {!success && !fetchLoading && (
                        <form className="create-content-form" onSubmit={(e) => e.preventDefault()}>
                            {submitError && <div className="create-content-error">{submitError}</div>}

                            <div className="cc-field">
                                <div className="cc-label-row">
                                    <label className="cc-label">Article Title <span className="cc-required">*</span></label>
                                    <span className={`cc-counter ${overTitle ? 'cc-counter-over' : ''}`}>
                                        {title.length}/{MAX_TITLE}
                                    </span>
                                </div>
                                <textarea
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    maxLength={MAX_TITLE}
                                    className="cc-textarea cc-title-input"
                                    placeholder="Enter article title"
                                    rows={2}
                                    required
                                />
                            </div>

                            <div className="cc-field">
                                <div className="cc-label-row">
                                    <label className="cc-label">Author Name <span className="cc-required">*</span></label>
                                    <span className={`cc-counter ${overAuthor ? 'cc-counter-over' : ''}`}>
                                        {authorName.length}/{MAX_AUTHOR}
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    value={authorName}
                                    onChange={(e) => setAuthorName(e.target.value)}
                                    maxLength={MAX_AUTHOR}
                                    className="cc-input"
                                    placeholder="Enter author name"
                                    required
                                />
                            </div>

                            <div className="cc-field">
                                <label className="cc-label">Category <span className="cc-required">*</span></label>
                                <select value={category} onChange={(e) => setCategory(e.target.value)} className="cc-input" required>
                                    <option value="">Select category</option>
                                    <option value="Giving">Giving</option>
                                    <option value="Programs">Programs</option>
                                    <option value="Community">Community</option>
                                    <option value="Events">Events</option>
                                    <option value="Achievements">Achievements</option>
                                    <option value="Scholarship">Scholarship</option>
                                </select>
                            </div>

                            <div className="cc-field">
                                <div className="cc-label-row">
                                    <label className="cc-label">Summary <span className="cc-required">*</span></label>
                                    <span className={`cc-counter ${overSubtitle ? 'cc-counter-over' : ''}`}>
                                        {subtitle.length}/{MAX_SUBTITLE}
                                    </span>
                                </div>
                                <textarea
                                    value={subtitle}
                                    onChange={(e) => setSubtitle(e.target.value)}
                                    maxLength={MAX_SUBTITLE}
                                    className="cc-textarea cc-subtitle"
                                    placeholder="Brief summary"
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="cc-field">
                                <label className="cc-label">Cover Photo <span className="cc-required">*</span></label>
                                {coverPreviewUrl && (
                                    <div className="cc-upload-preview">
                                        <img src={coverPreviewUrl} alt="Preview" className="cc-upload-preview-img" />
                                        {coverImage && <p className="cc-upload-preview-name">{coverImage.name}</p>}
                                    </div>
                                )}
                                <label className="cc-file-upload">
                                    <span className="cc-file-placeholder">
                                        {coverImage ? coverImage.name : (existingCoverUrl ? 'Change cover photo' : 'Upload Image (Required)')}
                                    </span>
                                    <input type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files[0] || null)} className="cc-file-input" />
                                    <span className="cc-upload-btn">Browse</span>
                                </label>
                            </div>

                            <div className="cc-field">
                                <div className="cc-label-row">
                                    <label className="cc-label">Full Content <span className="cc-required">*</span></label>
                                    <span className={`cc-counter ${overWords ? 'cc-counter-over' : ''}`}>
                                        {wordCount} / {MAX_WORDS} words
                                    </span>
                                </div>
                                <div className="cc-editor-wrap cc-tiptap-wrap">
                                    <TiptapToolbar editor={editor} />
                                    <EditorContent editor={editor} />
                                </div>
                            </div>

                            <div className="cc-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                                <input type="checkbox" id="featured" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                                <label htmlFor="featured" className="cc-label">Mark as featured article</label>
                            </div>

                            <div className="cc-actions">
                                <button type="button" className="cc-btn cc-cancel" onClick={() => navigate('/dashboard/content')}>Cancel</button>
                                <div className="cc-actions-right">
                                    <button type="button" className="cc-btn cc-preview-btn" onClick={() => setShowPreview(true)}>Open Preview</button>
                                    {isEditMode ? (
                                        <button type="button" className="cc-btn cc-publish" disabled={!canSubmit || loading} onClick={() => handleSubmit()}>{loading ? 'Saving...' : 'Save Changes'}</button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="cc-btn cc-publish"
                                            disabled={loading}
                                            onClick={() => handleSubmit({ forcePending: true })}
                                        >
                                            {loading ? 'Submitting...' : 'Publish'}
                                        </button>
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
                            {coverPreviewUrl && <div className="cc-preview-image-wrap"><img src={coverPreviewUrl} alt="" className="cc-preview-image" /></div>}
                            <h1 className="cc-preview-title">{title || 'Untitled'}</h1>
                            {subtitle && <p className="cc-preview-deck">{subtitle}</p>}
                            <p className="cc-preview-author">By {authorName || '—'}</p>
                            <div className="cc-preview-content avenir-book" dangerouslySetInnerHTML={{ __html: content || '<p></p>' }} />
                        </div>
                        <button type="button" className="cc-preview-close" onClick={() => setShowPreview(false)}>Close Preview</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CreateContent;