import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import './Auth.css';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/login', { username, password });
      const token = response.data.access_token;
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      const userData = JSON.parse(jsonPayload);

      onLogin(token, {
        user_id: userData.sub,
        username: userData.username,
        user_type: userData.user_type,
      });

      navigate('/');
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>🌊 Hydrological Dashboard</h1>
        <h2>Login</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Enter your username" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter your password" />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        </form>
        <div className="auth-footer"><p>Don't have an account? <Link to="/register">Register here</Link></p></div>
      </div>
    </div>
  );
}

export default Login;
