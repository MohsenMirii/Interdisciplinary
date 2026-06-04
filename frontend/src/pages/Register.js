import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import './Auth.css';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('Normal');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await api.post('/register', { username, email, password, user_type: userType });
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>🌊 Hydrological Dashboard</h1>
        <h2>Register</h2>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Choose a username" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Enter your email" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Create a password" />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Confirm your password" />
          </div>
          <div className="form-group">
            <label>User Type</label>
            <select value={userType} onChange={(e) => setUserType(e.target.value)}>
              <option value="Normal">Normal User</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
        </form>
        <div className="auth-footer"><p>Already have an account? <Link to="/login">Login here</Link></p></div>
      </div>
    </div>
  );
}

export default Register;
