import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import './Dashboard.css';

function Dashboard({ user }) {
  const [stats, setStats] = useState({ totalStations: 0, totalRecords: 0, totalUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [stationsRes, hydrologicalRes, usersRes] = await Promise.all([
        api.get('/stations'),
        api.get('/hydrological'),
        user?.user_type === 'Admin' || user?.user_type === 'Manager' ? api.get('/manager/users') : Promise.resolve({ data: [] }),
      ]);
      setStats({
        totalStations: stationsRes.data.length,
        totalRecords: hydrologicalRes.data.length,
        totalUsers: usersRes.data.length,
      });
    } catch (err) {
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.username}!</h1>
        <p className="user-role">You are logged in as: <strong>{user?.user_type}</strong></p>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <div className="spinner"></div>
      ) : (
        <div className="grid">
          <div className="stats-card"><h3>Total Stations</h3><div className="value">{stats.totalStations}</div></div>
          <div className="stats-card"><h3>Hydrological Records</h3><div className="value">{stats.totalRecords}</div></div>
          {(user?.user_type === 'Admin' || user?.user_type === 'Manager') && <div className="stats-card"><h3>Total Users</h3><div className="value">{stats.totalUsers}</div></div>}
        </div>
      )}
      <div className="card dashboard-info">
        <h2>📊 Dashboard Overview</h2>
        <p>Welcome to the Hydrological Data Management Dashboard. Here you can:</p>
        <ul>
          <li>View and manage water stations</li>
          <li>Access hydrological data for each station</li>
          <li>Track water levels, inflow, and outflow</li>
          {user?.user_type === 'Admin' && <li>Upload bulk data and manage users</li>}
          {user?.user_type === 'Manager' && <li>Manage users and monitor data</li>}
        </ul>
      </div>
    </div>
  );
}

export default Dashboard;
