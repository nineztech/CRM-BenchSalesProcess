import  { useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import Layout from '../../common/layout/Layout';
import axios from 'axios';
import usePermissions from '../../../hooks/usePermissions';
import toast from 'react-hot-toast';

interface Department {
  id: number;
  departmentName: string;
  subroles: string[];
  status: string;
}

interface Activity {
  id: number;
  name: string;
  category: string;
  status: string;
  description: string;
}

interface RolePermission {
  id: number;
  activity_id: number;
  dept_id: number;
  subrole: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface AdminUser {
  id: number;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  status: string;
  is_special?: boolean;
}

interface SpecialUser extends AdminUser {
  departmentId: number;
  subrole: string;
  department?: {
    departmentName: string;
  };
}

// Add interface for admin permission response
interface AdminPermissionResponse {
  id: number;
  permissionActivity: {
    id: number;
    name: string;
  };
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

// interface PermissionRights {
//   [key: string]: {
//     canView: boolean;
//     canAdd: boolean;
//     canEdit: boolean;
//     canDelete: boolean;
//   };
// }

const DepartmentPermissions = (): ReactElement => {
  const { checkPermission } = usePermissions();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // New states for admin and special user functionality
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSpecial, setIsSpecial] = useState(false);
  const [selectedAdminUser, setSelectedAdminUser] = useState('');
  const [selectedSpecialUser, setSelectedSpecialUser] = useState('');
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [specialUsers, setSpecialUsers] = useState<SpecialUser[]>([]);
  const [selectedSpecialUserData, setSelectedSpecialUserData] = useState<SpecialUser | null>(null);

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/department/all`);
        if (response.data.success) {
          const activeDepartments = response.data.data.filter(
            (dept: Department) => dept.status === 'active'
          );
          setDepartments(activeDepartments);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };

    fetchDepartments();
  }, []);

  // Fetch admin users
  useEffect(() => {
    const fetchAdminUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/all`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.data.success) {
          setAdminUsers(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching admin users:', error);
      }
    };

    fetchAdminUsers();
  }, []);

  // Fetch special users
  useEffect(() => {
    const fetchSpecialUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/special`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.data.success) {
          setSpecialUsers(response.data.data.users);
        }
      } catch (error) {
        console.error('Error fetching special users:', error);
        toast.error('Failed to fetch special users');
      }
    };

    if (isSpecial) {
      fetchSpecialUsers();
    }
  }, [isSpecial]);

  // New effect to handle special user selection
  useEffect(() => {
    const fetchSpecialUserDetails = async () => {
      if (!selectedSpecialUser) {
        setSelectedSpecialUserData(null);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/special-user-permission/${selectedSpecialUser}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          const specialUser = specialUsers.find(user => user.id.toString() === selectedSpecialUser);
          if (specialUser) {
            setSelectedSpecialUserData(specialUser);
            // Auto-select department and role
            setSelectedDepartment(specialUser.departmentId.toString());
            setSelectedRole(specialUser.subrole);
          }
        }
      } catch (error) {
        console.error('Error fetching special user details:', error);
        toast.error('Failed to fetch special user details');
      }
    };

    if (isSpecial && selectedSpecialUser) {
      fetchSpecialUserDetails();
    }
  }, [selectedSpecialUser, specialUsers]);

  // Modified effect to reset selections
  useEffect(() => {
    if (isAdmin) {
      // Clear all other selections when admin is selected
      setSelectedDepartment('');
      setSelectedRole('');
      setIsSpecial(false);
      setSelectedSpecialUser('');
      setSelectedSpecialUserData(null);
    } else if (isSpecial) {
      // Clear admin selection when special is selected
      setIsAdmin(false);
      setSelectedAdminUser('');
    } else {
      // Clear both admin and special selections when neither is selected
      setSelectedAdminUser('');
      setSelectedSpecialUser('');
      setSelectedSpecialUserData(null);
      setSelectedDepartment('');
      setSelectedRole('');
    }
  }, [isAdmin, isSpecial]);

  // Update available roles when department changes
  useEffect(() => {
    if (selectedDepartment) {
      const department = departments.find(dept => dept.id.toString() === selectedDepartment);
      if (department) {
        setAvailableRoles(department.subroles);
        setSelectedRole('');
      }
    } else {
      setAvailableRoles([]);
      setSelectedRole('');
    }
  }, [selectedDepartment, departments]);

  // Fetch activities
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/activity/all`);
        if (response.data.success) {
          const activeActivities = response.data.data.filter(
            (activity: Activity) => activity.status === 'active'
          );
          setActivities(activeActivities);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
      }
    };

    fetchActivities();
  }, []);

  // Modify only the fetchPermissions useEffect
  useEffect(() => {
    const fetchPermissions = async () => {
      if ((!selectedDepartment && !isAdmin && !isSpecial) || 
          (isAdmin && !selectedAdminUser) || 
          (isSpecial && !selectedSpecialUser)) {
        setPermissions([]);
        return;
      }

      setLoading(true);
      try {
        let response: { data: { success: boolean; data: any[] } };
        
        if (isAdmin && selectedAdminUser) {
          response = await axios.get<{ success: boolean; data: AdminPermissionResponse[] }>(
            `${import.meta.env.VITE_API_URL}/admin-permissions/admin/${selectedAdminUser}`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );

          if (response.data.success) {
            const formattedPermissions = activities.map(activity => {
              const permission = response.data.data.find(
                (p: AdminPermissionResponse) => p.permissionActivity.id === activity.id
              );
              
              return {
                id: permission?.id || 0,
                activity_id: activity.id,
                dept_id: 0,
                subrole: 'admin',
                canView: permission?.canView || false,
                canAdd: permission?.canAdd || false,
                canEdit: permission?.canEdit || false,
                canDelete: permission?.canDelete || false
              };
            });

            setPermissions(formattedPermissions);
          }
        } else if (isSpecial && selectedSpecialUser) {
          interface SpecialUserPermission {
            id: number;
            activity_id: number;
            canView: boolean;
            canAdd: boolean;
            canEdit: boolean;
            canDelete: boolean;
          }

          response = await axios.get<{ success: boolean; data: SpecialUserPermission[] }>(
            `${import.meta.env.VITE_API_URL}/special-user-permission/${selectedSpecialUser}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            }
          );

          if (response.data.success) {
            // Format special user permissions to match our permissions structure
            const specialUserPermissions = response.data.data;
            const formattedPermissions = activities.map(activity => {
              const permission = specialUserPermissions.find(
                (p: SpecialUserPermission) => p.activity_id === activity.id
              );
              
              return {
                id: permission?.id || 0,
                activity_id: activity.id,
                dept_id: selectedSpecialUserData?.departmentId || 0,
                subrole: selectedSpecialUserData?.subrole || '',
                canView: permission?.canView || false,
                canAdd: permission?.canAdd || false,
                canEdit: permission?.canEdit || false,
                canDelete: permission?.canDelete || false
              };
            });

            setPermissions(formattedPermissions);
            // Auto-select department and role from special user data
            if (selectedSpecialUserData) {
              setSelectedDepartment(selectedSpecialUserData.departmentId.toString());
              setSelectedRole(selectedSpecialUserData.subrole);
            }
          }
        } else {
          let url = `${import.meta.env.VITE_API_URL}/role-permissions/department/${selectedDepartment}`;
          if (selectedRole && selectedRole.trim() !== '') {
            url += `?role=${encodeURIComponent(selectedRole)}`;
          }
          response = await axios.get(url, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });

          if (response.data.success) {
            setPermissions(response.data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
        setPermissions([]);
        toast.error('Failed to fetch permissions');
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [selectedDepartment, selectedRole, isAdmin, selectedAdminUser, isSpecial, selectedSpecialUser, activities, selectedSpecialUserData]);

  // Helper function to get permission for specific activity and role
  const getPermissionForActivityAndRole = (activityId: number, role: string): RolePermission | null => {
    if (isAdmin) {
      // For admin permissions, just match by activity_id
      return permissions.find(p => p.activity_id === activityId) || null;
    }
    // For other cases, use the existing logic
    return permissions.find(
      (p) =>
        p.activity_id === activityId &&
        p.subrole.trim().toLowerCase() === role.trim().toLowerCase()
    ) || null;
  };

  console.log("permissions", permissions);
  console.log("activities", activities);
  console.log("availableRoles", availableRoles);
  console.log("selectedRole", selectedRole);

  const renderPermissionsTable = (categoryActivities: Activity[]) => {
    return (
      <table className="w-full border-collapse min-w-[600px] mb-4">
        <thead>
          <tr>
            <th className="p-2.5 border border-gray-200 text-left text-[13px] bg-gray-50 font-medium text-gray-700 w-[45%]">Activity</th>
            <th className="p-2.5 border border-gray-200 text-left text-[13px] bg-gray-50 font-medium text-gray-700 w-[15%]">Role</th>
            <th className="p-2.5 border border-gray-200 text-center text-[13px] bg-gray-50 font-medium text-gray-700 w-[10%]">View</th>
            <th className="p-2.5 border border-gray-200 text-center text-[13px] bg-gray-50 font-medium text-gray-700 w-[10%]">Add</th>
            <th className="p-2.5 border border-gray-200 text-center text-[13px] bg-gray-50 font-medium text-gray-700 w-[10%]">Edit</th>
            <th className="p-2.5 border border-gray-200 text-center text-[13px] bg-gray-50 font-medium text-gray-700 w-[10%]">Delete</th>
          </tr>
        </thead>
        <tbody>
          {categoryActivities.map((activity) => {
            // For special users and admins, only show their specific role
            const rolesToShow = isAdmin 
              ? ['admin'] 
              : isSpecial && selectedSpecialUserData
                ? [selectedSpecialUserData.subrole]
                : selectedRole 
                  ? [selectedRole] 
                  : availableRoles;
            
            return rolesToShow.map((role) => {
              const permission = getPermissionForActivityAndRole(activity.id, role);
              return (
                <tr key={`${activity.id}-${role}`} className="even:bg-gray-50 hover:bg-gray-50 transition-colors duration-150">
                  <td className="p-2.5 border border-gray-200 text-left text-[13px] text-gray-600 w-[45%]">
                    {activity.name}
                    {activity.description && (
                      <span className="block text-[11px] text-gray-500 mt-1">{activity.description}</span>
                    )}
                  </td>
                  <td className="p-2.5 border border-gray-200 text-left text-[13px] text-gray-600 w-[15%]">
                    {role}
                  </td>
                  <td className="p-2.5 border border-gray-200 text-center w-[10%]">
                    <span className={permission?.canView ? 'text-green-600' : 'text-red-600'}>
                      {permission?.canView ? '✓' : '✗'}
                    </span>
                  </td>
                  <td className="p-2.5 border border-gray-200 text-center w-[10%]">
                    <span className={permission?.canAdd ? 'text-green-600' : 'text-red-600'}>
                      {permission?.canAdd ? '✓' : '✗'}
                    </span>
                  </td>
                  <td className="p-2.5 border border-gray-200 text-center w-[10%]">
                    <span className={permission?.canEdit ? 'text-green-600' : 'text-red-600'}>
                      {permission?.canEdit ? '✓' : '✗'}
                    </span>
                  </td>
                  <td className="p-2.5 border border-gray-200 text-center w-[10%]">
                    <span className={permission?.canDelete ? 'text-green-600' : 'text-red-600'}>
                      {permission?.canDelete ? '✓' : '✗'}
                    </span>
                  </td>
                </tr>
              );
            });
          })}
        </tbody>
      </table>
    );
  };

  return (
    <Layout>
      <div className="flex flex-col gap-4 max-w-[98%]">
        {checkPermission('Role Permission Management', 'view') ? (
          <>
            <div className="flex justify-between items-center border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
              <h2 className="text-xl font-medium text-gray-800 m-0">Department Permissions</h2>
              <div className="flex items-center space-x-4">
                {/* Admin Section */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <input
                      type="checkbox"
                      id="isAdmin"
                      checked={isAdmin}
                      onChange={(e) => setIsAdmin(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      disabled={isSpecial}
                    />
                    <label htmlFor="isAdmin" className="text-sm text-gray-600 whitespace-nowrap">
                      Is Admin
                    </label>
                  </div>

                  {isAdmin && (
                    <select
                      value={selectedAdminUser}
                      onChange={(e) => setSelectedAdminUser(e.target.value)}
                      className="px-3 py-1.5 w-[180px] border border-gray-300 rounded-md text-[13px] outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200"
                    >
                      <option value="">Select Admin User</option>
                      {adminUsers.map((admin) => (
                        <option key={admin.id} value={admin.id}>
                          {admin.firstname} {admin.lastname}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Special User Section */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <input
                      type="checkbox"
                      id="isSpecial"
                      checked={isSpecial}
                      onChange={(e) => setIsSpecial(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      disabled={isAdmin}
                    />
                    <label htmlFor="isSpecial" className="text-sm text-gray-600 whitespace-nowrap">
                      Is Special
                    </label>
                  </div>

                  {isSpecial && (
                    <select
                      value={selectedSpecialUser}
                      onChange={(e) => setSelectedSpecialUser(e.target.value)}
                      className="px-3 py-1.5 w-[180px] border border-gray-300 rounded-md text-[13px] outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200"
                    >
                      <option value="">Select Special User</option>
                      {specialUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.firstname} {user.lastname}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Department Dropdown */}
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className={`px-3 py-1.5 w-[180px] border border-gray-300 rounded-md text-[13px] outline-none transition-all duration-200 ${
                    isAdmin || isSpecial
                      ? 'bg-gray-100 cursor-not-allowed'
                      : 'focus:ring-2 focus:ring-blue-100 focus:border-blue-400'
                  }`}
                  disabled={isAdmin || isSpecial}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.departmentName}
                    </option>
                  ))}
                </select>

                {/* Role Dropdown */}
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className={`px-3 py-1.5 w-[180px] border border-gray-300 rounded-md text-[13px] outline-none transition-all duration-200 ${
                    isAdmin || isSpecial || !selectedDepartment
                      ? 'bg-gray-100 cursor-not-allowed'
                      : 'focus:ring-2 focus:ring-blue-100 focus:border-blue-400'
                  }`}
                  disabled={true}
                >
                  {isSpecial && selectedSpecialUserData ? (
                    <option value={selectedSpecialUserData.subrole}>
                      {selectedSpecialUserData.subrole}
                    </option>
                  ) : !isAdmin && selectedDepartment ? (
                    <>
                      <option value="">All Roles</option>
                      {availableRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </>
                  ) : (
                    <option value="">Select Role</option>
                  )}
                </select>
              </div>
            </div>

            {loading && (
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-gray-600">Loading permissions...</p>
              </div>
            )}

            {!loading && activities.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                {Array.from(new Set(activities.map(a => a.category))).map(category => {
                  const categoryActivities = activities.filter(a => a.category === category);
                  return (
                    <div key={category} className="mb-8">
                      <div className="mb-4">
                        <h2 className="text-xl font-medium text-gray-800 border-b-2 border-blue-100 inline-block">
                          {category}
                        </h2>
                      </div>
                      {renderPermissionsTable(categoryActivities)}
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && (
              <>
                {isAdmin && !selectedAdminUser && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">Please select an admin user to view permissions.</p>
                  </div>
                )}

                {isSpecial && !selectedSpecialUser && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">Please select a special user to view permissions.</p>
                  </div>
                )}

                {!isAdmin && !isSpecial && !selectedDepartment && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">Please select a department to view permissions.</p>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="text-center p-4 bg-yellow-50 border-l-4 border-yellow-400">
            <p className="text-yellow-700">You don't have permission to view department permissions.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DepartmentPermissions; 