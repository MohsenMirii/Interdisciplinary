import React from 'react';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ isAuthenticated, requiredRole, children }) {
  if (!isAuthenticated) return <Navigate to="/login" />;

  if (requiredRole) {
    const user = JSON.parse(localStorage.getItem('user'));
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!user || !allowedRoles.includes(user.user_type)) {
      return <div className="container"><div className="alert alert-error">Access Denied: You do not have permission to access this page.</div></div>;
    }
  }

  return children;
}

export default PrivateRoute;
