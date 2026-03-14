import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/UserManagement.css';
import { useTitle } from '../Hooks/useTitle';

function UserManagement() {
    useTitle('User Management');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Action Loading States
    const [approvingId, setApprovingId] = useState(null);
    const [rejectingId, setRejectingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    // Modal States
    const [editingUser, setEditingUser] = useState(null);
    const [detailsUser, setDetailsUser] = useState(null);

    // Edit Form State
    const [editForm, setEditForm] = useState({
        username: '', first_name: '', middle_name: '', last_name: '',
        email: '', phone_number: '', batch: '', program: '', is_superuser: false, is_staff: false,
    });
    const [editError, setEditError] = useState(null);
    const [savingEdit, setSavingEdit] = useState(false);

    useEffect(() => {
        api.get('/api/users/')
            .then((res) => setUsers(res.data))
            .catch((err) => setError(err.response?.status === 403 ? 'Admin access required.' : 'Failed to load users.'))
            .finally(() => setLoading(false));
    }, []);

    // --- ACTIONS ---

    const handleApprove = (userId) => {
        setApprovingId(userId);
        api.post(`/api/users/${userId}/approve/`)
            .then(() => {
                setUsers((prev) =>
                    prev.map((u) => (u.id === userId ? { ...u, is_approved: true, is_active: true } : u))
                );
            })
            .finally(() => setApprovingId(null));
    };

    const handleReject = (userId) => {
        setRejectingId(userId);
        api.post(`/api/users/${userId}/reject/`)
            .then(() => {
                setUsers((prev) =>
                    prev.map((u) => (u.id === userId ? { ...u, is_approved: false, is_active: false } : u))
                );
            })
            .finally(() => setRejectingId(null));
    };

    const handleDelete = (userId) => {
        if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
        setDeletingId(userId);
        // Soft delete: sets is_active to False in backend
        api.patch(`/api/users/${userId}/`, { is_active: false })
            .then(() => {
                setUsers((prev) => prev.filter((u) => u.id !== userId));
            })
            .catch(() => alert("Failed to delete user."))
            .finally(() => setDeletingId(null));
    };

    // --- HELPERS ---

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleString(undefined, {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: 'numeric', minute: '2-digit',
            });
        } catch { return dateStr; }
    };

    const fullName = (u) => {
        const parts = [u.first_name, u.middle_name, u.last_name].filter(Boolean);
        return parts.join(' ') || '—';
    };

    const openEdit = (u) => {
        setEditingUser(u.id);
        setEditForm({
            username: u.username || '', first_name: u.first_name || '', middle_name: u.middle_name || '',
            last_name: u.last_name || '', email: u.email || '', phone_number: u.phone_number || '',
            batch: u.batch || '', program: u.program || '', is_superuser: !!u.is_superuser, is_staff: !!u.is_staff,
        });
        setEditError(null);
    };

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleEditSave = () => {
        setSavingEdit(true);
        api.patch(`/api/users/${editingUser}/`, editForm)
            .then((res) => {
                setUsers((prev) => prev.map((u) => (u.id === editingUser ? { ...u, ...res.data } : u)));
                setEditingUser(null);
            })
            .catch(() => setEditError('Failed to save changes.'))
            .finally(() => setSavingEdit(false));
    };

    return (
        <div className="user-mgmt-page">
            <Header />
            <main className="user-mgmt-main">
                <h1 className="user-mgmt-title">User Management</h1>
                <p className="user-mgmt-subtitle">Manage registered alumni and administrative roles.</p>

                <div className="user-mgmt-card">
                    {loading && <div className="user-mgmt-loading">Loading users...</div>}
                    {!loading && !error && (
                        <div className="user-mgmt-table-wrap">
                            <table className="user-mgmt-table">
                                <thead>
                                    <tr>
                                        <th>NAME</th><th>USERNAME</th><th>BATCH</th><th>PROGRAM</th>
                                        <th>DETAILS</th><th>STATUS</th><th>ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u.id}>
                                            <td>{fullName(u)}</td>
                                            <td>{u.username}</td>
                                            <td>{u.batch || '—'}</td>
                                            <td>{u.program || '—'}</td>
                                            <td>
                                                <button type="button" className="user-mgmt-details-link" onClick={() => setDetailsUser(u)}>
                                                    View Details
                                                </button>
                                            </td>
                                            <td>
                                                <span className={`user-mgmt-status ${u.is_approved ? 'approved' : 'pending'}`}>
                                                    {u.is_approved ? 'Approved' : 'Pending'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="user-mgmt-actions">
                                                    {!u.is_approved ? (
                                                        <>
                                                            <button type="button" className="user-mgmt-approve-btn" onClick={() => handleApprove(u.id)} disabled={approvingId === u.id}>
                                                                {approvingId === u.id ? '...' : 'Approve'}
                                                            </button>
                                                            <button type="button" className="user-mgmt-reject-btn" onClick={() => handleReject(u.id)} disabled={rejectingId === u.id}>
                                                                {rejectingId === u.id ? '...' : 'Reject'}
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button type="button" className="user-mgmt-edit-btn" onClick={() => openEdit(u)}>Edit</button>
                                                    )}
                                                    <button type="button" className="user-mgmt-delete-btn" onClick={() => handleDelete(u.id)} disabled={deletingId === u.id}>
                                                        {deletingId === u.id ? '...' : 'Delete'}
                                                    </button>
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="user-mgmt-back">
                    <Link to="/dashboard" className="user-mgmt-back-link">← Back to Dashboard</Link>
                </div>

                {/* VIEW DETAILS MODAL */}
                {detailsUser && (
                    <div className="user-mgmt-modal-overlay" onClick={() => setDetailsUser(null)}>
                        <div className="user-mgmt-modal" onClick={(e) => e.stopPropagation()}>
                            <h2 className="user-mgmt-modal-title">User Details</h2>
                            <div className="user-mgmt-details-content">
                                <div className="user-mgmt-detail-row">
                                    <span className="user-mgmt-label">Full Name</span>
                                    <span className="user-mgmt-value">{fullName(detailsUser)}</span>
                                </div>
                                <div className="user-mgmt-detail-row">
                                    <span className="user-mgmt-label">Email</span>
                                    <span className="user-mgmt-value">{detailsUser.email || '—'}</span>
                                </div>
                                <div className="user-mgmt-detail-row">
                                    <span className="user-mgmt-label">Program & Batch</span>
                                    <span className="user-mgmt-value">{detailsUser.program || 'N/A'} (Class of {detailsUser.batch || '—'})</span>
                                </div>
                                <div className="user-mgmt-detail-row">
                                    <span className="user-mgmt-label">Roles</span>
                                    <span className="user-mgmt-value">
                                        {detailsUser.is_superuser ? 'Superuser' : 'Standard User'}
                                    </span>
                                </div>
                            </div>
                            <div className="user-mgmt-modal-actions">
                                <button type="button" className="user-mgmt-modal-cancel" onClick={() => setDetailsUser(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* EDIT MODAL */}
                {editingUser && (
                    <div className="user-mgmt-modal-overlay" onClick={() => setEditingUser(null)}>
                        <div className="user-mgmt-modal" onClick={(e) => e.stopPropagation()}>
                            <h2 className="user-mgmt-modal-title">Edit User</h2>
                            {editError && <div className="user-mgmt-modal-error">{editError}</div>}
                            <div className="user-mgmt-modal-form">
                                <div className="user-mgmt-modal-row">
                                    <div className="user-mgmt-modal-field">
                                        <label>First Name</label>
                                        <input name="first_name" value={editForm.first_name} onChange={handleEditChange} />
                                    </div>
                                    <div className="user-mgmt-modal-field">
                                        <label>Last Name</label>
                                        <input name="last_name" value={editForm.last_name} onChange={handleEditChange} />
                                    </div>
                                </div>
                                <div className="user-mgmt-modal-field">
                                    <label>Email</label>
                                    <input name="email" value={editForm.email} onChange={handleEditChange} />
                                </div>
                                <div className="user-mgmt-modal-field">
                                    <label>Batch (Year)</label>
                                    <input name="batch" value={editForm.batch} onChange={handleEditChange} />
                                </div>
                                <div className="user-mgmt-modal-field checkbox-field">
                                    <input type="checkbox" id="is_superuser" name="is_superuser" checked={editForm.is_superuser} onChange={handleEditChange} />
                                    <label htmlFor="is_superuser">Grant Admin Access</label>
                                </div>
                            </div>
                            <div className="user-mgmt-modal-actions">
                                <button type="button" className="user-mgmt-modal-cancel" onClick={() => setEditingUser(null)}>Cancel</button>
                                <button type="button" className="user-mgmt-modal-save" onClick={handleEditSave} disabled={savingEdit}>{savingEdit ? 'Saving...' : 'Save Changes'}</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}

export default UserManagement;