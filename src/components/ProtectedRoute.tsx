import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'user' | 'admin' | 'moderator';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true,
  requiredRole 
}) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requireAuth && !user) {
    // Redirect to auth page with return URL
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requiredRole && profile?.user_role !== requiredRole) {
    // Redirect to unauthorized page or home
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};