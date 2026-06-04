import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import './UserManagement.css';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/manager/users');
      setUsers(response.data);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      setError('');
      setSuccess('');
      await api.put(`/manager/users/${userId}/status`, { is_active: !currentStatus });
      setSuccess('User status updated successfully');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update user status');
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>👥 User Management</h1>
        <button className="btn btn-primary" onClick={fetchUsers}>Refresh</button>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      {loading ? (
        <div className="spinner"></div>
      ) : users.length === 0 ? (
        <div className="alert alert-info">No users found</div>
      ) : (
        <div className="card">
          <table className="table">
            <thead><tr><th>User ID</th><th>Username</th><th>Email</th><th>User Type</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.UserID}>
                  <td>{user.UserID}</td>
                  <td>{user.Username}</td>
                  <td>{user.Email}</td>
                  <td><span className={`badge badge-${user.UserType.toLowerCase()}`}>{user.UserType}</span></td>
                  <td><span className={`badge ${user.IsActive ? 'badge-success' : 'badge-danger'}`}>{user.IsActive ? 'Active' : 'Inactive'}</span></td>
                  <td><button className={`btn ${user.IsActive ? 'btn-danger' : 'btn-success'} btn-sm`} onClick={() => handleToggleStatus(user.UserID, user.IsActive)}>{user.IsActive ? 'Deactivate' : 'Activate'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
