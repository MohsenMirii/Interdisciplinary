import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navigation.css';

function Navigation({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">🌊 Hydrological Dashboard</Link>
        <ul className="navbar-menu">
          <li><Link to="/stations" className="nav-link">Stations</Link></li>
          <li><Link to="/hydrological" className="nav-link">Hydrological Data</Link></li>
          {user?.user_type === 'Admin' && <li><Link to="/admin/bulk-upload" className="nav-link">Admin - Bulk Upload</Link></li>}
          {(user?.user_type === 'Admin' || user?.user_type === 'Manager') && <li><Link to="/manager/users" className="nav-link">User Management</Link></li>}
          <li className="navbar-user">
            <span className="user-info">{user?.username} <span className="badge">{user?.user_type}</span></span>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navigation;
