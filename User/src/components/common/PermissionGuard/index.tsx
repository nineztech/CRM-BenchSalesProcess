import React from 'react';
import usePermissions from '../../../hooks/usePermissions';

interface PermissionGuardProps {
  activityName: string;
  action: 'view' | 'add' | 'edit' | 'delete';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLoadingSkeleton?: boolean;
}

// Simple loading skeleton component
const LoadingSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  </div>
);

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  activityName,
  action,
  children,
  fallback = null,
  showLoadingSkeleton = false
}) => {
  const { checkPermission, loading, error } = usePermissions();

  // Show loading skeleton or null while loading
  if (loading) {
    return showLoadingSkeleton ? <LoadingSkeleton /> : null;
  }

  // Hide content on error
  if (error) return null;

  // Check permission and render accordingly
  return checkPermission(activityName, action) ? <>{children}</> : <>{fallback}</>;
};

// Optimized multi-permission guard for components with many permission checks
interface MultiPermissionGuardProps {
  permissions: Array<{
    activityName: string;
    action: 'view' | 'add' | 'edit' | 'delete';
  }>;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, requires all permissions. If false, requires at least one
}

export const MultiPermissionGuard: React.FC<MultiPermissionGuardProps> = ({
  permissions,
  children,
  fallback = null,
  requireAll = true
}) => {
  const { checkPermission, loading, error } = usePermissions();

  if (loading || error) return null;

  const hasPermission = requireAll
    ? permissions.every(({ activityName, action }) => checkPermission(activityName, action))
    : permissions.some(({ activityName, action }) => checkPermission(activityName, action));

  return hasPermission ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGuard; 