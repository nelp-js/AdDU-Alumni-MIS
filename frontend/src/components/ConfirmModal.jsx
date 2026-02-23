import { useEffect } from 'react';
import '../styles/EditModal.css';
import '../styles/ExperienceModal.css';

function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', confirmDanger = true }) {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="edit-modal-overlay confirm-modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
            <div className="edit-modal confirm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
                <div className="edit-modal-header">
                    <h2 className="edit-modal-title">{title}</h2>
                    <button type="button" className="edit-modal-close" onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </div>
                <div className="edit-modal-body">
                    <p className="confirm-modal-message">{message}</p>
                    <div className="exp-form-actions exp-form-actions-space" style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #e5e7eb' }}>
                        <button type="button" className="exp-form-draft" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className={confirmDanger ? 'exp-form-submit confirm-modal-delete' : 'exp-form-submit'}
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;
