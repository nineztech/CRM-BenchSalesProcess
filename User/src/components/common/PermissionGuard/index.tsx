import React from 'react';
import usePermissions from '../../../hooks/usePermissions';

interface PermissionGuardProps {
  activityName: string;
  action: 'view' | 'add' | 'edit' | 'delete';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  activityName,
  action,
  children,
  fallback = null
}) => {
  const { checkPermission, loading, error } = usePermissions();

  if (loading) return null;
  if (error) return null;

  return checkPermission(activityName, action) ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGuard; 