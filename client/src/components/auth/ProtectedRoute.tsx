import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '@ats/shared';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  fallback,
}) => {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will trigger login render in parent
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return (
      fallback || (
        <div className="p-12 text-center text-zinc-400">
          <p className="text-base font-bold text-white">Access Restricted</p>
          <p className="text-xs mt-1">
            Your account ({user.role}) does not have permission to view this section.
          </p>
        </div>
      )
    );
  }

  return <>{children}</>;
};

