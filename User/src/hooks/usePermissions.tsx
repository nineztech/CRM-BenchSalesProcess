import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Permission {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface Activity {
  id: number;
  name: string;
  category: string;
  description: string;
  routes: string[];
}

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5006/api";

const usePermissions = () => {
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState<{ [key: string]: Permission }>({});
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        const departmentId = localStorage.getItem('departmentId');
        const subrole = localStorage.getItem('subrole');
        const user = localStorage.getItem('user');

        // If any required data is missing, try to get it from the user object
        if ((!userId || !departmentId || !subrole) && user) {
          const userData = JSON.parse(user);
          if (!userId) localStorage.setItem('userId', userData.id.toString());
          if (!departmentId) localStorage.setItem('departmentId', userData.departmentId?.toString() || '');
          if (!subrole) localStorage.setItem('subrole', userData.role || '');
        }

        // Recheck after potential recovery
        const finalToken = localStorage.getItem('token');
        const finalUserId = localStorage.getItem('userId');
        const finalDepartmentId = localStorage.getItem('departmentId');
        const finalSubrole = localStorage.getItem('subrole');
        const finalUser = localStorage.getItem('user');
        const userRole = finalUser ? JSON.parse(finalUser).role : null;

        if (!finalToken || !finalUserId) {
          if (retryCount < 3) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 1000);
            return;
          }
          localStorage.clear();
          navigate('/login');
          throw new Error('Authentication information missing. Please log in again.');
        }

        // Reset retry count if we have all the data
        setRetryCount(0);

        // Fetch activities first
        const activitiesResponse = await axios.get(
          `${BASE_URL}/activity/all`,
          {
            headers: { Authorization: `Bearer ${finalToken}` }
          }
        );

        if (!activitiesResponse.data.success) {
          throw new Error(activitiesResponse.data.message || 'Failed to fetch activities');
        }

        setActivities(activitiesResponse.data.data);

        let permissionsResponse;
        
        // Check permissions based on user role
        if (userRole === 'admin') {
          // Fetch admin permissions
          permissionsResponse = await axios.get(
            `${BASE_URL}/admin-permissions/admin/${finalUserId}`,
            {
              headers: { Authorization: `Bearer ${finalToken}` }
            }
          );
        } else {
          // Fetch role permissions
          if (!finalDepartmentId || !finalSubrole) {
            throw new Error('Department or role information missing');
          }
          
          permissionsResponse = await axios.get(
            `${BASE_URL}/role-permissions/department/${finalDepartmentId}`,
            {
              headers: { Authorization: `Bearer ${finalToken}` },
              params: { role: finalSubrole }
            }
          );
        }

        if (!permissionsResponse.data.success) {
          throw new Error(permissionsResponse.data.message || 'Failed to fetch permissions');
        }

        const permissionsMap: { [key: string]: Permission } = {};
        
        permissionsResponse.data.data.forEach((permission: any) => {
          const activity = activitiesResponse.data.data.find(
            (a: Activity) => a.id === (userRole === 'admin' ? permission.activity_id : permission.activity_id)
          );
          
          if (activity) {
            permissionsMap[activity.name] = {
              canView: permission.canView || false,
              canAdd: permission.canAdd || false,
              canEdit: permission.canEdit || false,
              canDelete: permission.canDelete || false
            };
          }
        });

        setPermissions(permissionsMap);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching permissions:', err);
        setError(err.message || 'Failed to fetch permissions. Please try again.');
        // Set empty permissions to prevent complete lockout
        setPermissions({});
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [navigate, retryCount]);

  const checkPermission = (activityName: string, action: 'view' | 'add' | 'edit' | 'delete'): boolean => {
    // If there's an error, deny access by default
    if (error) return false;

    const permission = permissions[activityName];
    if (!permission) {
      console.log(`No permissions found for activity: ${activityName}`);
      return false;
    }

    console.log(`Checking ${action} permission for ${activityName}:`, permission);

    switch (action) {
      case 'view':
        return permission.canView;
      case 'add':
        return permission.canAdd;
      case 'edit':
        return permission.canEdit;
      case 'delete':
        return permission.canDelete;
      default:
        return false;
    }
  };

  const getActivityByName = (name: string): Activity | undefined => {
    return activities.find(activity => activity.name === name);
  };

  return {
    checkPermission,
    getActivityByName,
    loading,
    error,
    permissions,
    activities
  };
};

export default usePermissions; 