import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

interface PermissionsContextType {
  checkPermission: (activityName: string, action: 'view' | 'add' | 'edit' | 'delete') => boolean;
  getActivityByName: (name: string) => Activity | undefined;
  loading: boolean;
  error: string | null;
  permissions: { [key: string]: Permission };
  activities: Activity[];
  refreshPermissions: () => Promise<void>;
}

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5006/api";

// Create context
const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

// Cache for storing permissions and activities
interface CacheData {
  permissions: { [key: string]: Permission };
  activities: Activity[];
  timestamp: number;
  userId: string;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
const CACHE_KEY = 'permissions_cache';

// Permissions Provider Component
export const PermissionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState<{ [key: string]: Permission }>({});
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cache helper functions
  const getCachedData = (): CacheData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const data: CacheData = JSON.parse(cached);
      const now = Date.now();
      const userId = localStorage.getItem('userId');
      
      // Check if cache is valid (not expired and same user)
      if (data.timestamp + CACHE_DURATION > now && data.userId === userId) {
        return data;
      }
      
      // Clear expired cache
      localStorage.removeItem(CACHE_KEY);
      return null;
    } catch {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  };

  const setCachedData = (permissions: { [key: string]: Permission }, activities: Activity[]) => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    
    const cacheData: CacheData = {
      permissions,
      activities,
      timestamp: Date.now(),
      userId
    };
    
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch {
      // Handle localStorage quota exceeded
      localStorage.removeItem(CACHE_KEY);
    }
  };

  const fetchPermissions = async (useCache = true) => {
    try {
      setLoading(true);
      setError(null);

      // Try to use cached data first
      if (useCache) {
        const cachedData = getCachedData();
        if (cachedData) {
          setPermissions(cachedData.permissions);
          setActivities(cachedData.activities);
          setLoading(false);
          return;
        }
      }

      // Get stored user data
      const userId = localStorage.getItem('userId');
      const departmentId = localStorage.getItem('departmentId');
      const subrole = localStorage.getItem('subrole');
      const user = localStorage.getItem('user');
      const authToken = localStorage.getItem('token');

      // If any required data is missing, try to get it from the user object
      if ((!userId || !departmentId || !subrole) && user) {
        const userData = JSON.parse(user);
        if (!userId) localStorage.setItem('userId', userData.id.toString());
        if (!departmentId) localStorage.setItem('departmentId', userData.departmentId?.toString() || '');
        if (!subrole) localStorage.setItem('subrole', userData.role || '');
      }

      // Recheck after potential recovery
      const finalUserId = localStorage.getItem('userId');
      const finalDepartmentId = localStorage.getItem('departmentId');
      const finalSubrole = localStorage.getItem('subrole');
      const finalUser = localStorage.getItem('user');
      const userRole = finalUser ? JSON.parse(finalUser).role : null;
      const isSpecial = finalUser ? JSON.parse(finalUser).isSpecial : false;

      if (!authToken || !finalUserId) {
        localStorage.clear();
        navigate('/login');
        throw new Error('Authentication information missing. Please log in again.');
      }

      // Create axios instance with auth header for reuse
      const axiosConfig = {
        headers: { Authorization: `Bearer ${authToken}` }
      };

      // Fetch activities and permissions in parallel for better performance
      const [activitiesResponse, permissionsResponse] = await Promise.all([
        axios.get(`${BASE_URL}/activity/all`, axiosConfig),
        // Fetch permissions based on user role and special status
        userRole === 'admin'
          ? axios.get(`${BASE_URL}/admin-permissions/admin/${finalUserId}`, axiosConfig)
          : isSpecial
          ? axios.get(`${BASE_URL}/special-user-permission/${finalUserId}`, axiosConfig)
          : axios.get(
              `${BASE_URL}/role-permissions/department/${finalDepartmentId}`,
              { ...axiosConfig, params: { role: finalSubrole } }
            )
      ]);

      if (!activitiesResponse.data.success) {
        throw new Error(activitiesResponse.data.message || 'Failed to fetch activities');
      }

      if (!permissionsResponse.data.success) {
        throw new Error(permissionsResponse.data.message || 'Failed to fetch permissions');
      }

      const fetchedActivities = activitiesResponse.data.data;
      
      // Create permissions map with optimized lookup
      const permissionsMap: { [key: string]: Permission } = {};
      const activityMap = new Map(fetchedActivities.map((a: Activity) => [a.id, a]));
      
      permissionsResponse.data.data.forEach((permission: any) => {
        const activity = activityMap.get(permission.activity_id);
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
      setActivities(fetchedActivities);
      
      // Cache the fetched data
      setCachedData(permissionsMap, fetchedActivities);
      
    } catch (err: any) {
      console.error('Error fetching permissions:', err);
      setError(err.message || 'Failed to fetch permissions. Please try again.');
      setPermissions({});
    } finally {
      setLoading(false);
    }
  };

  // Initialize permissions on mount
  useEffect(() => {
    fetchPermissions();
  }, [navigate]);

  // Memoized permission check function
  const checkPermission = React.useCallback(
    (activityName: string, action: 'view' | 'add' | 'edit' | 'delete'): boolean => {
      if (error || loading) return false;

      const permission = permissions[activityName];
      if (!permission) return false;

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
    },
    [permissions, error, loading]
  );

  // Memoized activity lookup function
  const getActivityByName = React.useCallback(
    (name: string): Activity | undefined => {
      return activities.find(activity => activity.name === name);
    },
    [activities]
  );

  // Refresh function for manual refresh (force bypass cache)
  const refreshPermissions = React.useCallback(async () => {
    await fetchPermissions(false);
  }, []);

  const contextValue = React.useMemo(
    () => ({
      checkPermission,
      getActivityByName,
      loading,
      error,
      permissions,
      activities,
      refreshPermissions,
    }),
    [checkPermission, getActivityByName, loading, error, permissions, activities, refreshPermissions]
  );

  return (
    <PermissionsContext.Provider value={contextValue}>
      {children}
    </PermissionsContext.Provider>
  );
};

// Optimized usePermissions hook
const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

export default usePermissions; 