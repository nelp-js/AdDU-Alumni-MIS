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
    
    const [approvingId, setApprovingId] = useState(null);
    const [rejectingId, setRejectingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const [editingUser, setEditingUser] = useState(null);
    const [detailsUser, setDetailsUser] = useState(null); // NEW: State for details modal

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

    const handleApprove = (userId) => {
        setApprovingId(userId);
        api.post(`/api/users/${userId}/approve/`)
            .then(() => {
                setUsers((prev) =>
                    prev.map((u) => (u.id === userId ? { ...u, is_approved: true, is_active: true } : u))
                );
            })
            .catch(() => {})
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
            .catch(() => {})
            .finally(() => setRejectingId(null));
    };

    const handleDelete = (userId) => {
        if (!window.confirm("Are you sure?")) return;
        setDeletingId(userId);
        api.patch(`/api/users/${userId}/`, { is_active: false })
            .then(() => {
                setUsers((prev) => prev.filter((u) => u.id !== userId));
                setEditingUser(null); 
            })
            .catch(() => alert("Failed to delete user."))
            .finally(() => setDeletingId(null));
    };

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
    };

    const handleEditSave = () => {
        setSavingEdit(true);
        api.patch(`/api/users/${editingUser}/`, editForm)
            .then((res) => {
                setUsers((prev) => prev.map((u) => (u.id === editingUser ? { ...u, ...res.data } : u)));
                setEditingUser(null);
            })
            .finally(() => setSavingEdit(false));
    };

    return (
        <div className="user-mgmt-page">
            <Header />
            <main className="user-mgmt-main">
                <h1 className="user-mgmt-title">User Management</h1>
                
                <div className="user-mgmt-card">
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
                                                {/* NEW: Details link to match other management pages */}
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
                                                {!u.is_approved ? (
                                                    <span className="user-mgmt-actions">
                                                        <button type="button" className="user-mgmt-approve-btn" onClick={() => handleApprove(u.id)} disabled={approvingId === u.id}>Approve</button>
                                                        <button type="button" className="user-mgmt-reject-btn" onClick={() => handleReject(u.id)} disabled={rejectingId === u.id}>Reject</button>
                                                    </span>
                                                ) : (
                                                    <button type="button" className="user-mgmt-edit-btn" onClick={() => openEdit(u)}>Edit</button>
                                                )}
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

                {/* --- 1. VIEW DETAILS MODAL --- */}
                {detailsUser && (
                    <div className="user-mgmt-modal-overlay" onClick={() => setDetailsUser(null)}>
                        <div className="user-mgmt-modal" onClick={(e) => e.stopPropagation()}>
                            <h2 className="user-mgmt-modal-title">User Details</h2>
                            <div className="user-mgmt-details-content" style={{ padding: '10px 0' }}>
                                <div className="user-mgmt-detail-row">
                                    <span className="user-mgmt-label">Full Name</span>
                                    <span className="user-mgmt-value">{fullName(detailsUser)}</span>
                                </div>
                                <div className="user-mgmt-detail-row">
                                    <span className="user-mgmt-label">Username</span>
                                    <span className="user-mgmt-value">{detailsUser.username}</span>
                                </div>
                                <div className="user-mgmt-detail-row">
                                    <span className="user-mgmt-label">Email</span>
                                    <span className="user-mgmt-value">{detailsUser.email || '—'}</span>
                                </div>
                                <div className="user-mgmt-detail-row">
                                    <span className="user-mgmt-label">Phone</span>
                                    <span className="user-mgmt-value">{detailsUser.phone_number || '—'}</span>
                                </div>
                                <div className="user-mgmt-detail-row">
                                    <span className="user-mgmt-label">Batch & Program</span>
                                    <span className="user-mgmt-value">{detailsUser.batch} - {detailsUser.program || '—'}</span>
                                </div>
                                <div className="user-mgmt-detail-row">
                                    <span className="user-mgmt-label">Roles</span>
                                    <span className="user-mgmt-value">
                                        {detailsUser.is_superuser ? 'Admin' : 'Alumni'}
                                        {detailsUser.is_staff ? ' (Staff)' : ''}
                                    </span>
                                </div>
                                <div className="user-mgmt-detail-row">
                                    <span className="user-mgmt-label">Joined On</span>
                                    <span className="user-mgmt-value">{formatDate(detailsUser.date_joined)}</span>
                                </div>
                                <div className="user-mgmt-detail-row">
                                    <span className="user-mgmt-label">Status</span>
                                    <span className={`user-mgmt-status ${detailsUser.is_approved ? 'approved' : 'pending'}`}>
                                        {detailsUser.is_approved ? 'Approved' : 'Pending Approval'}
                                    </span>
                                </div>
                            </div>
                            <div className="user-mgmt-modal-actions" style={{ justifyContent: 'flex-end' }}>
                                <button type="button" className="user-mgmt-modal-cancel" onClick={() => setDetailsUser(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* EDIT MODAL */}
                {editingUser != null && (
                    <div className="user-mgmt-modal-overlay" onClick={closeEdit}>
                        <div className="user-mgmt-modal" onClick={(e) => e.stopPropagation()}>
                            <h2 className="user-mgmt-modal-title">Edit User</h2>
                            {editError && <div className="user-mgmt-modal-error">{editError}</div>}
                            
                            <div className="user-mgmt-modal-form">
                                <div className="user-mgmt-modal-row">
                                    <div className="user-mgmt-modal-field">
                                        <label>First Name *</label>
                                        <input name="first_name" value={editForm.first_name} onChange={handleEditChange} />
                                    </div>
                                    <div className="user-mgmt-modal-field">
                                        <label>Middle Name</label>
                                        <input name="middle_name" value={editForm.middle_name} onChange={handleEditChange} />
                                    </div>
                                    <div className="user-mgmt-modal-field">
                                        <label>Last Name *</label>
                                        <input name="last_name" value={editForm.last_name} onChange={handleEditChange} />
                                    </div>
                                </div>
                                <div className="user-mgmt-modal-field">
                                    <label>Username *</label>
                                    <input name="username" value={editForm.username} onChange={handleEditChange} />
                                </div>
                                <div className="user-mgmt-modal-field">
                                    <label>Email *</label>
                                    <input type="email" name="email" value={editForm.email} onChange={handleEditChange} />
                                </div>
                                <div className="user-mgmt-modal-field">
                                    <label>Phone Number</label>
                                    <input name="phone_number" value={editForm.phone_number} onChange={handleEditChange} />
                                </div>
                                <div className="user-mgmt-modal-row">
                                    <div className="user-mgmt-modal-field">
                                        <label>Batch</label>
                                        <input name="batch" value={editForm.batch} onChange={handleEditChange} />
                                    </div>
                                    <div className="user-mgmt-modal-field">
                                        <label>Program</label>
                                        <select name="program" value={editForm.program} onChange={handleEditChange}>
                                            <option value="">Select</option>
                                            <option value="CS">Computer Science</option>
                                            <option value="IT">Information Technology</option>
                                            <option value="IS">Information Systems</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="user-mgmt-modal-field user-mgmt-modal-checkbox">
                                    <label>
                                        <input type="checkbox" name="is_superuser" checked={editForm.is_superuser} onChange={handleEditChange} />
                                        <span>Admin (superuser)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="user-mgmt-modal-actions"> {/* Removed the inline style here */}
                                {/* LEFT: Delete Button */}
                                <button 
                                    type="button" 
                                    className="user-mgmt-modal-delete" 
                                    onClick={() => handleDelete(editingUser)}
                                    disabled={deletingId === editingUser}
                                >
                                    {deletingId === editingUser ? 'Deleting...' : 'Delete User'}
                                </button>

                                {/* RIGHT: Cancel & Save Buttons */}
                                <div className="user-mgmt-modal-actions-right">
                                    <button type="button" className="user-mgmt-modal-cancel" onClick={closeEdit}>Cancel</button>
                                    <button type="button" className="user-mgmt-modal-save" onClick={handleEditSave} disabled={savingEdit}>
                                        {savingEdit ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
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