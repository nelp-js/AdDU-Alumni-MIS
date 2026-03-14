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
    const [loadError, setLoadError] = useState(null);
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

    const wordCount = useMemo(() => countWords(content), [content]);
    const overSubtitle = subtitle.length > MAX_SUBTITLE;
    const overWords = wordCount > MAX_WORDS;
    
    const canSubmit = Boolean(
        title.trim() && 
        authorName.trim() && 
        subtitle.trim() && 
        category && 
        (coverImage || existingCoverUrl) &&
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
        onUpdate: ({ editor }) => setContent(editor.getHTML()),
    });

    const initialContentSet = useRef(false);
    useEffect(() => {
        if (editor && isEditMode && content && !initialContentSet.current) {
            editor.commands.setContent(content);
            initialContentSet.current = true;
        }
    }, [editor, isEditMode, content]);

    const handleSubmit = (status) => {
        if (!canSubmit) {
            alert('Please fill in all required fields');
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
        formData.append('status', status || 'published');

        if (coverImage) formData.append('cover_image', coverImage);

        const request = isEditMode ? api.patch(`/api/articles/${id}/`, formData) : api.post('/api/articles/', formData);

        request
            .then(() => {
                setSuccess(true);
                setTimeout(() => navigate('/dashboard/content'), 3000);
            })
            .catch((err) => setSubmitError('Failed to save article.'))
            .finally(() => setLoading(false));
    };

    return (
        <div className="create-content-page">
            <Header />
            <main className="create-content-main">
                <h1 className="create-content-title">{isEditMode ? 'Edit Content' : 'Create Content'}</h1>
                <div className="create-content-form-box">
                    {success && <div className="create-content-success"><p>✓ Article saved successfully! Redirecting...</p></div>}
                    {fetchLoading && <div className="create-content-loading">Loading article data...</div>}

                    {!success && !fetchLoading && (
                        <form className="create-content-form" onSubmit={(e) => e.preventDefault()}>
                            {submitError && <div className="create-content-error">{submitError}</div>}

                            <div className="cc-field">
                                <label className="cc-label">Article Title <span className="cc-required">*</span></label>
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="cc-input" placeholder="Enter article title" required />
                            </div>

                            <div className="cc-field">
                                <label className="cc-label">Author Name <span className="cc-required">*</span></label>
                                <input type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="cc-input" placeholder="Enter author name" required />
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
                                <textarea value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="cc-textarea cc-subtitle" placeholder="Brief summary" rows={3} required />
                            </div>

                            <div className="cc-field">
                                <label className="cc-label">Cover Image <span className="cc-required">*</span></label>
                                <label className="cc-file-wrap">
                                    <span className="cc-file-label">{coverImage ? coverImage.name : (existingCoverUrl ? 'Change cover photo' : 'Choose JPG or PNG')}</span>
                                    <input type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files[0] || null)} className="cc-file-input" />
                                    <span className="cc-browse">Browse</span>
                                </label>
                                {coverPreviewUrl && <div className="cc-preview-wrap"><img src={coverPreviewUrl} alt="Preview" className="cc-cover-preview" /></div>}
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
                                        <button type="button" className="cc-btn cc-publish" disabled={!canSubmit || loading} onClick={() => handleSubmit(null)}>{loading ? 'Saving...' : 'Save Changes'}</button>
                                    ) : (
                                        <>
                                            <button type="button" className="cc-btn cc-draft" disabled={!canSubmit || loading} onClick={() => handleSubmit('draft')}>{loading ? 'Saving...' : 'Save as Draft'}</button>
                                            <button type="button" className="cc-btn cc-publish" disabled={!canSubmit || loading} onClick={() => handleSubmit('published')}>{loading ? 'Publishing...' : 'Publish'}</button>
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