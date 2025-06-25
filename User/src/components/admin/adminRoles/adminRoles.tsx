import  { useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import { FaEdit } from 'react-icons/fa';
import Layout from '../../common/layout/Layout';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

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
  dept_ids: number[];
  status: string;
  viewRoute: string;
  addRoute: string;
  editRoute: string;
  deleteRoute: string;
  description: string;
  createdBy: number;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
  };
}

interface RoleEntry {
  role: string;
  createdAt: string;
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

interface Rights {
  [activity: string]: {
    canView: boolean;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
}

type PermissionType = 'canView' | 'canAdd' | 'canEdit' | 'canDelete';


interface AdminPermissionResponse {
  permissionActivity: {
    id: number;
    name: string;
  };
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const AdminRoles = (): ReactElement => {
  const location = useLocation();
  const specialUserData = location.state as { 
    isSpecialUser: boolean; 
    specialUserId: number; 
    specialUserName: string;
    departmentId?: number;
    userRole?: string;
  } | null;

  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedAdminUser, setSelectedAdminUser] = useState('');
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [rights, setRights] = useState<Rights>({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentDepartmentSubroles, setCurrentDepartmentSubroles] = useState<string[]>([]);

  const [showNewRoleForm, setShowNewRoleForm] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [roleList, setRoleList] = useState<RoleEntry[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);


  const [isSpecial, setIsSpecial] = useState(false);
  const [selectedSpecialUser, setSelectedSpecialUser] = useState('');
  const [specialUsers, setSpecialUsers] = useState<AdminUser[]>([]);

  // Add loading state
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all departments and permissions on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch departments
        const deptResponse = await axios.get(`${import.meta.env.VITE_API_URL}/department/all`);
        if (deptResponse.data.success) {
          console.log('Departments fetched:', deptResponse.data.data);
          // Filter only active departments
          const activeDepartments = deptResponse.data.data.filter(
            (dept: Department) => dept.status === 'active'
          );
          setDepartments(activeDepartments);
        }


      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Update admin users fetch to get all admins
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

  // Update useEffect to handle special user data with department and role
  useEffect(() => {
    if (specialUserData?.isSpecialUser) {
      setIsSpecial(true);
      setSelectedSpecialUser(specialUserData.specialUserId.toString());
      
      // Set department and role if provided
      if (specialUserData.departmentId) {
        setSelectedDepartment(specialUserData.departmentId.toString());
      }
      if (specialUserData.userRole) {
        setSelectedRole(specialUserData.userRole);
      }
    }
  }, [specialUserData]);

  // Update subroles when department changes
  useEffect(() => {
    if (selectedDepartment) {
      const selectedDept = departments.find(dept => dept.id.toString() === selectedDepartment);
      if (selectedDept) {
        setCurrentDepartmentSubroles(selectedDept.subroles || []);
        // Only reset selected role if not coming from special user creation
        if (!specialUserData?.userRole) {
          setSelectedRole('');
        }
      } else {
        setCurrentDepartmentSubroles([]);
      }
    } else {
      setCurrentDepartmentSubroles([]);
    }
  }, [selectedDepartment, departments, specialUserData]);

  // Fetch activities when component mounts instead of when department changes
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        console.log('Fetching all activities');
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/activity/all`);
        
        if (response.data.success) {
          console.log('All activities:', response.data.data);
          // Get all active activities
          const activeActivities = response.data.data.filter(
            (activity: Activity) => activity.status === 'active'
          );
          console.log('Active activities:', activeActivities);
          setActivities(activeActivities);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
        setActivities([]);
      }
    };

    fetchActivities();
  }, []); // Only run once when component mounts

  // Update the fetchExistingPermissions function
  useEffect(() => {
    const fetchExistingPermissions = async () => {
      // Reset rights when conditions are not met
      if ((!selectedDepartment || !selectedRole) && (!isSpecial || !selectedSpecialUser)) {
        setRights({});
        return;
      }

      try {
        let response;
        
        if (isSpecial && selectedSpecialUser) {
          // Fetch special user permissions
          response = await axios.get(
            `${import.meta.env.VITE_API_URL}/special-user-permission/${selectedSpecialUser}`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );

          if (response.data.success) {
            const specialPermissions = response.data.data;
            const initialRights: Rights = {};
            
            activities.forEach(activity => {
              // Find permission for this activity
              const permission = specialPermissions.find(
                (sp: any) => sp.activity_id === activity.id
              );
              
              initialRights[activity.name] = {
                canView: permission?.canView || false,
                canAdd: permission?.canAdd || false,
                canEdit: permission?.canEdit || false,
                canDelete: permission?.canDelete || false
              };
            });
            setRights(initialRights);
          }
        } else {
          // Fetch role permissions
          response = await axios.get(
            `${import.meta.env.VITE_API_URL}/role-permissions/department/${selectedDepartment}`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );

          if (response.data.success) {
            const rolePermissions = (response.data.data).filter(
              (rp: any) => rp.dept_id.toString() === selectedDepartment && rp.subrole === selectedRole
            );

            const initialRights: Rights = {};
            activities.forEach(activity => {
              // Find permission for this activity
              const permission = rolePermissions.find(
                (rp: any) => rp.activity_id === activity.id
              );
              
              initialRights[activity.name] = {
                canView: permission?.canView || false,
                canAdd: permission?.canAdd || false,
                canEdit: permission?.canEdit || false,
                canDelete: permission?.canDelete || false
              };
            });
            setRights(initialRights);
          }
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
        // Initialize empty rights on error
        const emptyRights: Rights = {};
        activities.forEach(activity => {
          emptyRights[activity.name] = {
            canView: false,
            canAdd: false,
            canEdit: false,
            canDelete: false
          };
        });
        setRights(emptyRights);
      }
    };

    fetchExistingPermissions();
  }, [selectedDepartment, selectedRole, isSpecial, selectedSpecialUser, activities]);

  // Add new effect to fetch special users
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
          // Set special users directly from the response
          setSpecialUsers(response.data.data.users);
        }
      } catch (error) {
        console.error('Error fetching special users:', error);
      }
    };

    if (isSpecial) {
      fetchSpecialUsers();
    }
  }, [isSpecial]);

  // Update subroles and reset selections when isAdmin changes
  useEffect(() => {
    if (isAdmin) {
      setSelectedDepartment('');
      setSelectedRole('');
      setCurrentDepartmentSubroles([]);
      setIsSpecial(false);
      setSelectedSpecialUser('');
    } else {
      setSelectedAdminUser('');
    }
  }, [isAdmin]);

  // Update fetchAdminPermissions function
  const fetchAdminPermissions = async () => {
    if (!selectedAdminUser) return;

    try {
      setIsLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin-permissions/admin/${selectedAdminUser}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        const initialRights: Rights = {};
        activities.forEach(activity => {
          const permission = response.data.data.find(
            (p: AdminPermissionResponse) => p.permissionActivity.id === activity.id
          );
          
          initialRights[activity.name] = {
            canView: permission?.canView || false,
            canAdd: permission?.canAdd || false,
            canEdit: permission?.canEdit || false,
            canDelete: permission?.canDelete || false
          };
        });
        setRights(initialRights);
      }
    } catch (error) {
      console.error('Error fetching admin permissions:', error);
      alert('Failed to fetch admin permissions');
    } finally {
      setIsLoading(false);
    }
  };

  // Update useEffect to use the extracted function
  useEffect(() => {
    if (isAdmin && selectedAdminUser) {
      fetchAdminPermissions();
    }
  }, [selectedAdminUser, isAdmin, activities]);

  // Update handlePermissionChange to work with both admin and role permissions
  const handlePermissionChange = (activity: string, permission: PermissionType) => {
    setRights(prev => {
      const newRights: Rights = { ...prev };
      if (!newRights[activity]) {
        newRights[activity] = {
          canView: false,
          canAdd: false,
          canEdit: false,
          canDelete: false
        };
      }
      newRights[activity] = {
        ...newRights[activity],
        [permission]: !newRights[activity][permission]
      };
      return newRights;
    });
  };

  // Update handleSelectAllRow to work with both admin and role permissions
  const handleSelectAllRow = (activityName: string) => {
    setRights(prev => {
      const newRights: Rights = { ...prev };
      if (!newRights[activityName]) {
        newRights[activityName] = {
          canView: false,
          canAdd: false,
          canEdit: false,
          canDelete: false
        };
      }
      
      const currentRow = newRights[activityName];
      const allChecked = currentRow.canView && currentRow.canAdd && currentRow.canEdit && currentRow.canDelete;
      
      newRights[activityName] = {
        canView: !allChecked,
        canAdd: !allChecked,
        canEdit: !allChecked,
        canDelete: !allChecked
      };
      
      return newRights;
    });
  };

  // Update handleAssign function
  const handleAssign = async () => {
    if (isAdmin && !selectedAdminUser) {
      alert('Please select an admin user');
      return;
    }

    if (!isAdmin && (!selectedDepartment || !selectedRole)) {
      alert('Please select both department and role');
      return;
    }

    try {
      setIsLoading(true);
      if (isAdmin) {
        // Handle admin permissions
        await Promise.all(
          activities.map(activity => {
            const permission = {
              admin_id: parseInt(selectedAdminUser),
              activity_id: activity.id,
              canView: rights[activity.name]?.canView || false,
              canAdd: rights[activity.name]?.canAdd || false,
              canEdit: rights[activity.name]?.canEdit || false,
              canDelete: rights[activity.name]?.canDelete || false
            };

            return axios.post(
              `${import.meta.env.VITE_API_URL}/admin-permissions/add`,
              permission,
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              }
            );
          })
        );

        alert('Admin permissions updated successfully!');
        await fetchAdminPermissions();
      } else {
        // Handle role or special user permissions based on isSpecial checkbox
        const permissions = activities.map(activity => ({
          activity_id: activity.id,
          dept_id: parseInt(selectedDepartment),
          subrole: selectedRole,
          canView: rights[activity.name]?.canView || false,
          canAdd: rights[activity.name]?.canAdd || false,
          canEdit: rights[activity.name]?.canEdit || false,
          canDelete: rights[activity.name]?.canDelete || false
        }));

        if (isSpecial && selectedSpecialUser) {
          // Handle special user permissions
          for (const permission of permissions) {
            await axios.post(
              `${import.meta.env.VITE_API_URL}/special-user-permission/create/${selectedSpecialUser}`,
              permission,
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              }
            );
          }
          alert('Special user permissions updated successfully!');
        } else {
          // Handle regular role permissions
          for (const permission of permissions) {
            await axios.post(
              `${import.meta.env.VITE_API_URL}/role-permissions/add`,
              permission,
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              }
            );
          }
          alert('Role permissions assigned successfully!');
        }
        setRights({});
        setSelectedRole('');
      }
    } catch (error: any) {
      console.error('Error assigning permissions:', error);
      alert(error.response?.data?.message || 'Failed to assign permissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNewRole = () => {
    if (newRoleName.trim() === '') {
      alert('Please enter a role name.');
      return;
    }

    const now = new Date();
    const formattedTime = now.toLocaleString();

    const newEntry: RoleEntry = {
      role: newRoleName.trim(),
      createdAt: formattedTime,
    };

    if (editIndex !== null) {
      const updatedList = [...roleList];
      updatedList[editIndex] = newEntry;
      setRoleList(updatedList);
      setEditIndex(null);
    } else {
      setRoleList(prev => [...prev, newEntry]);
    }

    setNewRoleName('');
  };

  const handleEditRole = (index: number) => {
    setEditIndex(index);
    setNewRoleName(roleList[index].role);
  };

  // Check if all permissions in a row are selected
  const isAllSelected = (activityName: string): boolean => {
    const activityRights = rights[activityName];
    if (!activityRights) return false;
    return activityRights.canView && activityRights.canAdd && activityRights.canEdit && activityRights.canDelete;
  };

  return (
    <Layout>
      <div className="flex flex-col gap-4 max-w-[98%]">
        <div className="flex justify-between items-center border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
          <h2 className="text-xl font-medium text-gray-800 m-0">Roles & Rights</h2>
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-3">
              {/* Is Admin Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="isAdmin" className="text-sm text-gray-600">
                  Is Admin
                </label>
              </div>

              {/* Admin Users Dropdown - Moved next to checkbox */}
              {isAdmin && (
                <select 
                  value={selectedAdminUser} 
                  onChange={(e) => setSelectedAdminUser(e.target.value)}
                  className="px-3 py-1.5 min-w-[200px] border border-gray-300 rounded-md text-[13px] outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200"
                >
                  <option value="" disabled hidden>Select Admin User *</option>
                  {adminUsers.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.firstname} {admin.lastname}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Department Dropdown */}
            <select 
              value={selectedDepartment} 
              onChange={(e) => {
                console.log('Selected department:', e.target.value);
                setSelectedDepartment(e.target.value);
                setSelectedRole(''); // Reset role when department changes
                setRights({}); // Reset rights when department changes
              }}
              className="px-3 py-1.5 min-w-[160px] border border-gray-300 rounded-md text-[13px] outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200"
              disabled={isAdmin}
            >
              <option value="" disabled hidden>Select Department *</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.departmentName}</option>
              ))}
            </select>

            {/* Role Dropdown */}
            <select 
              value={selectedRole} 
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-1.5 min-w-[160px] border border-gray-300 rounded-md text-[13px] outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200"
              disabled={isAdmin || !selectedDepartment}
            >
              <option value="" disabled hidden>Select Role *</option>
              {currentDepartmentSubroles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>

            {/* Is Special Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isSpecial"
                checked={isSpecial}
                onChange={(e) => {
                  setIsSpecial(e.target.checked);
                  if (!e.target.checked) {
                    setSelectedSpecialUser('');
                  }
                }}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                disabled={isAdmin}
              />
              <label htmlFor="isSpecial" className="text-sm text-gray-600">
                Is Special
              </label>
            </div>

            {/* Special Users Dropdown */}
            {isSpecial && (
              <select 
                value={selectedSpecialUser} 
                onChange={(e) => setSelectedSpecialUser(e.target.value)}
                className="px-3 py-1.5 min-w-[200px] border border-gray-300 rounded-md text-[13px] outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200"
              >
                <option value="" disabled hidden>Select Special User *</option>
                {specialUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstname} {user.lastname}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {showNewRoleForm && (
          <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-[999]">
            <div className="relative bg-white py-4 px-6 rounded-lg w-[480px] max-h-[90vh] overflow-y-auto shadow-xl">
              <span
                onClick={() => {
                  setShowNewRoleForm(false);
                  setNewRoleName('');
                  setEditIndex(null);
                }}
                className="absolute top-2 right-3 text-xl font-medium text-gray-600 cursor-pointer select-none hover:text-gray-800"
                title="Close"
              >
                &times;
              </span>

              <h3 className="text-lg font-medium mb-4 text-gray-800">Add New Role</h3>

              <div className="flex gap-2.5 mb-4">
                <input
                  type="text"
                  placeholder="Enter new role name"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="h-8 text-[13px] w-[280px] rounded-md border border-gray-300 px-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                />
                <button 
                  className="px-4 py-1.5 bg-blue-600 text-white border-none rounded-md text-[13px] cursor-pointer block ml-auto hover:bg-blue-700 transition-colors duration-200"
                  onClick={handleAddNewRole}
                >
                  {editIndex !== null ? 'Update Role' : 'Add Role'}
                </button>
              </div>

              {roleList.length > 0 && (
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2.5 border border-gray-200 text-center text-[13px] bg-gray-50 font-medium text-gray-700">Sr. No.</th>
                      <th className="p-2.5 border border-gray-200 text-center text-[13px] bg-gray-50 font-medium text-gray-700">Created At</th>
                      <th className="p-2.5 border border-gray-200 text-center text-[13px] bg-gray-50 font-medium text-gray-700">Role Name</th>
                      <th className="p-2.5 border border-gray-200 text-center text-[13px] bg-gray-50 font-medium text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roleList.map((item, index) => (
                      <tr key={index} className="even:bg-gray-50 hover:bg-gray-50 transition-colors duration-150">
                        <td className="p-2.5 border border-gray-200 text-center text-[13px] text-gray-600">{index + 1}</td>
                        <td className="p-2.5 border border-gray-200 text-center text-[13px] text-gray-600">{item.createdAt}</td>
                        <td className="p-2.5 border border-gray-200 text-center text-[13px] text-gray-600">{item.role}</td>
                        <td className="p-2.5 border border-gray-200 text-center text-[13px]">
                          <button 
                            className="bg-transparent border-none cursor-pointer text-gray-600 hover:text-blue-600 transition-colors duration-200"
                            onClick={() => handleEditRole(index)}
                          >
                            <FaEdit className="text-sm" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Show activities table */}
        {activities.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
            {/* Group activities by category */}
            {Array.from(new Set(activities.map(a => a.category))).map(category => {
              const categoryActivities = activities.filter(a => a.category === category);
              return (
                <div key={category} className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-medium text-gray-800 border-b-2 border-blue-100 inline-block">
                      {category}
                    </h2>
                  </div>

                  {/* Activities Table */}
                  <table className="w-full border-collapse min-w-[600px] mb-4">
                    <thead>
                      <tr>
                        <th className="p-2.5 border border-gray-200 text-left text-[13px] bg-gray-50 font-medium text-gray-700 w-[35%]">Activity</th>
                        <th className="p-2.5 border border-gray-200 text-center text-[13px] bg-gray-50 font-medium text-gray-700">Select All</th>
                        <th className="p-2.5 border border-gray-200 text-center text-[13px] bg-gray-50 font-medium text-gray-700">Read</th>
                        <th className="p-2.5 border border-gray-200 text-center text-[13px] bg-gray-50 font-medium text-gray-700">Create</th>
                        <th className="p-2.5 border border-gray-200 text-center text-[13px] bg-gray-50 font-medium text-gray-700">Update</th>
                        <th className="p-2.5 border border-gray-200 text-center text-[13px] bg-gray-50 font-medium text-gray-700">Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryActivities.map((activity) => (
                        <tr key={activity.id} className="even:bg-gray-50 hover:bg-gray-50 transition-colors duration-150">
                          <td className="p-2.5 border border-gray-200 text-left text-[13px] text-gray-600 w-[35%]">
                            {activity.name}
                            {activity.description && (
                              <span className="block text-[11px] text-gray-500 mt-1">{activity.description}</span>
                            )}
                          </td>
                          <td className="p-2.5 border border-gray-200 text-center">
                            <input
                              type="checkbox"
                              checked={isAllSelected(activity.name)}
                              onChange={() => handleSelectAllRow(activity.name)}
                              className="w-3.5 h-3.5 cursor-pointer accent-blue-600"
                              disabled={!selectedRole && !selectedAdminUser}
                            />
                          </td>
                          <td className="p-2.5 border border-gray-200 text-center">
                            <input
                              type="checkbox"
                              checked={rights[activity.name]?.canView || false}
                              onChange={() => handlePermissionChange(activity.name, 'canView')}
                              className="w-3.5 h-3.5 cursor-pointer accent-blue-600"
                              disabled={!selectedRole && !selectedAdminUser}
                            />
                          </td>
                          <td className="p-2.5 border border-gray-200 text-center">
                            <input
                              type="checkbox"
                              checked={rights[activity.name]?.canAdd || false}
                              onChange={() => handlePermissionChange(activity.name, 'canAdd')}
                              className="w-3.5 h-3.5 cursor-pointer accent-blue-600"
                              disabled={!selectedRole && !selectedAdminUser}
                            />
                          </td>
                          <td className="p-2.5 border border-gray-200 text-center">
                            <input
                              type="checkbox"
                              checked={rights[activity.name]?.canEdit || false}
                              onChange={() => handlePermissionChange(activity.name, 'canEdit')}
                              className="w-3.5 h-3.5 cursor-pointer accent-blue-600"
                              disabled={!selectedRole && !selectedAdminUser}
                            />
                          </td>
                          <td className="p-2.5 border border-gray-200 text-center">
                            <input
                              type="checkbox"
                              checked={rights[activity.name]?.canDelete || false}
                              onChange={() => handlePermissionChange(activity.name, 'canDelete')}
                              className="w-3.5 h-3.5 cursor-pointer accent-blue-600"
                              disabled={!selectedRole && !selectedAdminUser}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}

            {/* Show Assign button when either role or admin is selected */}
            {(selectedRole || (isAdmin && selectedAdminUser)) && (
              <button 
                className={`mt-4 px-5 py-1.5 bg-blue-600 text-white border-none rounded-md text-[13px] cursor-pointer block ml-auto hover:bg-blue-700 transition-colors duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleAssign}
                disabled={(!selectedDepartment || !selectedRole) && (!isAdmin || !selectedAdminUser) || isLoading}
              >
                {isLoading ? 'Updating...' : 'Assign'}
              </button>
            )}
          </div>
        )}

        {/* Show message when no activities are found */}
        {activities.length === 0 && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No activities found.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminRoles;