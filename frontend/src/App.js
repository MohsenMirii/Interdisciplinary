import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Stations from './pages/Stations';
import StationDetail from './pages/StationDetail';
import HydrologicalData from './pages/HydrologicalData';
import HydrologicalDetail from './pages/HydrologicalDetail';
import AdminBulkUpload from './pages/AdminBulkUpload';
import UserManagement from './pages/UserManagement';
import Navigation from './components/Navigation';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      {isAuthenticated && <Navigation user={user} onLogout={handleLogout} />}
      <div className="app-container">
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={isAuthenticated ? <Dashboard user={user} /> : <Navigate to="/login" />} />
          <Route path="/stations" element={<PrivateRoute isAuthenticated={isAuthenticated}><Stations /></PrivateRoute>} />
          <Route path="/stations/:id" element={<PrivateRoute isAuthenticated={isAuthenticated}><StationDetail /></PrivateRoute>} />
          <Route path="/hydrological" element={<PrivateRoute isAuthenticated={isAuthenticated}><HydrologicalData /></PrivateRoute>} />
          <Route path="/hydrological/:id" element={<PrivateRoute isAuthenticated={isAuthenticated}><HydrologicalDetail /></PrivateRoute>} />
          <Route path="/admin/bulk-upload" element={<PrivateRoute isAuthenticated={isAuthenticated} requiredRole="Admin"><AdminBulkUpload /></PrivateRoute>} />
          <Route path="/manager/users" element={<PrivateRoute isAuthenticated={isAuthenticated} requiredRole={['Admin', 'Manager']}><UserManagement /></PrivateRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
