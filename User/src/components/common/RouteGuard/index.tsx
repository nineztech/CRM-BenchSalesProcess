import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import usePermissions from '../../../hooks/usePermissions';

interface RouteGuardProps {
  activityName: string;
  children: React.ReactNode;
}

const RouteGuard: React.FC<RouteGuardProps> = ({ activityName, children }) => {
  const location = useLocation();
  const { checkPermission, loading, error } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Error loading permissions</div>
      </div>
    );
  }

  if (!checkPermission(activityName, 'view')) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default RouteGuard; 