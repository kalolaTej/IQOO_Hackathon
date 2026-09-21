import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user || user.role === 'public') {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // If user's role isn't authorized for this route, redirect to their role home page
    const roleHomeMap = {
      farmer: '/dashboard',
      apmc: '/mandi/queue',
      buyer: '/buyer/bids',
      driver: '/driver/gate-pass',
      public: '/login'
    };
    return <Navigate to={roleHomeMap[user.role] || '/dashboard'} replace />;
  }

  return children;
};

export default ProtectedRoute;
