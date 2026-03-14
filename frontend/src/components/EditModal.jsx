import { useEffect } from 'react';
import '../styles/EditModal.css';

function EditModal({ isOpen, onClose, title, subtitle, children }) {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="edit-modal-overlay" onClick={onClose}>
            <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
                <div className="edit-modal-header">
                    <div className="edit-modal-header-text">
                        <h2 className="edit-modal-title">{title}</h2>
                        {subtitle && <p className="edit-modal-subtitle">{subtitle}</p>}
                    </div>
                    <button type="button" className="edit-modal-close" onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </div>
                <div className="edit-modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default EditModal;