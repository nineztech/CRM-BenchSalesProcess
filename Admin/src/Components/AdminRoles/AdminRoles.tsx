import React, { useState, useEffect } from 'react';
import { FaEdit } from 'react-icons/fa';
import Layout from '../Layout/Layout';
import axios from 'axios';

interface Department {
  id: number;
  departmentName: string;
  subroles: string[];
  status: string;
}

interface Activity {
  id: number;
  name: string;
  dept_id: number;
  status: string;
}

interface Permission {
  id: number;
  name: string;
}

interface RoleEntry {
  role: string;
  createdAt: string;
}

interface RolePermission {
  id: number;
  dept_id: number;
  subrole: string;
  hasAccessTo: {
    [key: string]: number[];
  };
}

interface Rights {
  [activity: string]: {
    [permission: string]: boolean;
  };
}

const AdminRoles: React.FC = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [rights, setRights] = useState<Rights>({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [currentDepartmentSubroles, setCurrentDepartmentSubroles] = useState<string[]>([]);

  const [showNewRoleForm, setShowNewRoleForm] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [roleList, setRoleList] = useState<RoleEntry[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // Add new state for loading existing permissions
  const [existingPermissions, setExistingPermissions] = useState<RolePermission | null>(null);

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

        // Fetch permissions
        const permResponse = await axios.get(`${import.meta.env.VITE_API_URL}/permissions/all`);
        if (permResponse.data.success) {
          console.log('Permissions fetched:', permResponse.data.data);
          setPermissions(permResponse.data.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Update subroles when department changes
  useEffect(() => {
    if (selectedDepartment) {
      const selectedDept = departments.find(dept => dept.id.toString() === selectedDepartment);
      if (selectedDept) {
        setCurrentDepartmentSubroles(selectedDept.subroles || []);
        setSelectedRole(''); // Reset selected role when department changes
      } else {
        setCurrentDepartmentSubroles([]);
      }
    } else {
      setCurrentDepartmentSubroles([]);
    }
  }, [selectedDepartment, departments]);

  // Fetch activities when department changes
  useEffect(() => {
    const fetchActivities = async () => {
      if (!selectedDepartment) return;
      
      try {
        console.log('Fetching activities for department:', selectedDepartment);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/activity/all`);
        if (response.data.success) {
          console.log('All activities:', response.data.data);
          // Filter activities for selected department
          const departmentActivities = response.data.data.filter(
            (activity: Activity) => activity.dept_id === parseInt(selectedDepartment) && activity.status === 'active'
          );
          console.log('Filtered activities:', departmentActivities);
          setActivities(departmentActivities);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
        setActivities([]);
      }
    };

    fetchActivities();
  }, [selectedDepartment]);

  // Fetch existing permissions when department and role are selected
  useEffect(() => {
    const fetchExistingPermissions = async () => {
      if (!selectedDepartment || !selectedRole) {
        setRights({}); // Reset rights when department or role changes
        return;
      }

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/role-permissions/department/${selectedDepartment}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (response.data.success) {
          const rolePermissions = response.data.data.find(
            (rp: RolePermission & { dept_id: number; subrole: string }) => 
              rp.dept_id.toString() === selectedDepartment && rp.subrole === selectedRole
          );

          if (rolePermissions) {
            setExistingPermissions(rolePermissions);
            
            // Set initial rights based on existing permissions
            const initialRights: Rights = {};
            activities.forEach(activity => {
              const permissionIds = rolePermissions.hasAccessTo[activity.id] || [];
              initialRights[activity.name] = {};
              permissions.forEach(permission => {
                initialRights[activity.name][permission.name] = permissionIds.includes(permission.id);
              });
            });
            setRights(initialRights);
          } else {
            // If no existing permissions found, initialize empty rights for all activities
            const emptyRights: Rights = {};
            activities.forEach(activity => {
              emptyRights[activity.name] = {};
              permissions.forEach(permission => {
                emptyRights[activity.name][permission.name] = false;
              });
            });
            setRights(emptyRights);
          }
        }
      } catch (error) {
        console.error('Error fetching existing permissions:', error);
        // Initialize empty rights on error
        const emptyRights: Rights = {};
        activities.forEach(activity => {
          emptyRights[activity.name] = {};
          permissions.forEach(permission => {
            emptyRights[activity.name][permission.name] = false;
          });
        });
        setRights(emptyRights);
      }
    };

    fetchExistingPermissions();
  }, [selectedDepartment, selectedRole, activities, permissions]);

  const handlePermissionChange = (activity: string, permission: string) => {
    setRights(prev => {
      const newRights: Rights = { ...prev };
      if (!newRights[activity]) {
        newRights[activity] = {};
      }
      newRights[activity] = {
        ...newRights[activity],
        [permission]: !newRights[activity][permission]
      };
      return newRights;
    });
  };

  const handleAssign = async () => {
    if (!selectedDepartment || !selectedRole) {
      alert('Please select both department and role');
      return;
    }

    try {
      // Transform the rights object into the format expected by the backend
      const hasAccessTo: Record<number, number[]> = {};
      
      activities.forEach(activity => {
        const activityPermissions: number[] = [];
        permissions.forEach(permission => {
          if (rights[activity.name]?.[permission.name]) {
            activityPermissions.push(permission.id);
          }
        });
        
        // Only include activities that have at least one permission assigned
        if (activityPermissions.length > 0) {
          hasAccessTo[activity.id] = activityPermissions;
        }
      });

      const payload = {
        dept_id: parseInt(selectedDepartment),
        subrole: selectedRole,
        hasAccessTo
      };

      console.log('Sending payload:', payload);

      let response;

      // Check if we have existing permissions
      if (existingPermissions) {
        // If exists, use PUT to update
        response = await axios.put(
          `${import.meta.env.VITE_API_URL}/role-permissions/${existingPermissions.id}`,
          { hasAccessTo },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
      } else {
        // If doesn't exist, use POST to create
        response = await axios.post(
          `${import.meta.env.VITE_API_URL}/role-permissions/add`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
      }

      if (response.data.success) {
        alert('Role permissions ' + (existingPermissions ? 'updated' : 'assigned') + ' successfully!');
        // Reset the form
        setRights({});
        setSelectedRole('');
      } else {
        alert(response.data.message || 'Failed to ' + (existingPermissions ? 'update' : 'assign') + ' permissions');
      }
    } catch (error: any) {
      console.error('Error ' + (existingPermissions ? 'updating' : 'assigning') + ' permissions:', error);
      alert(error.response?.data?.message || 'Failed to ' + (existingPermissions ? 'update' : 'assign') + ' permissions');
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

  // Handle select all for a row
  const handleSelectAllRow = (activityName: string) => {
    setRights(prev => {
      const newRights: Rights = { ...prev };
      if (!newRights[activityName]) {
        newRights[activityName] = {};
      }
      
      const currentRow = newRights[activityName];
      const allChecked = permissions.every(perm => currentRow[perm.name]);
      
      const updatedRow: { [key: string]: boolean } = {};
      permissions.forEach(permission => {
        updatedRow[permission.name] = !allChecked;
      });
      
      newRights[activityName] = updatedRow;
      return newRights;
    });
  };

  // Check if all permissions in a row are selected
  const isAllSelected = (activityName: string): boolean => {
    const activityRights = rights[activityName];
    if (!activityRights) return false;
    return permissions.every(perm => activityRights[perm.name]);
  };

  return (
    <Layout>
      <div className="flex flex-col gap-4 max-w-[98%]">
        <div className="flex justify-between items-center border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
          <h2 className="text-xl font-medium text-gray-800 m-0">Roles & Rights</h2>
          <div className="flex gap-3">
            <select 
              value={selectedDepartment} 
              onChange={(e) => {
                console.log('Selected department:', e.target.value);
                setSelectedDepartment(e.target.value);
              }}
              className="px-3 py-1.5 min-w-[160px] border border-gray-300 rounded-md text-[13px] outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200"
            >
              <option value="" disabled hidden>Select Department *</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.departmentName}</option>
              ))}
            </select>

            <select 
              value={selectedRole} 
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-1.5 min-w-[160px] border border-gray-300 rounded-md text-[13px] outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200"
            >
              <option value="" disabled hidden>Select Role *</option>
              {currentDepartmentSubroles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
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

        {activities.length > 0 && permissions.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr>
                  <th className="p-2.5 border border-gray-200 text-left text-[13px] bg-gray-50 font-medium text-gray-700 w-[35%]">Activity</th>
                  <th className="p-2.5 border border-gray-200 text-center text-[13px] bg-gray-50 font-medium text-gray-700">Select All</th>
                  {permissions.map((perm) => (
                    <th key={perm.id} className="p-2.5 border border-gray-200 text-center text-[13px] bg-gray-50 font-medium text-gray-700 w-[16.25%]">{perm.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr key={activity.id} className="even:bg-gray-50 hover:bg-gray-50 transition-colors duration-150">
                    <td className="p-2.5 border border-gray-200 text-left text-[13px] text-gray-600 w-[35%]">{activity.name}</td>
                    <td className="p-2.5 border border-gray-200 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected(activity.name)}
                        onChange={() => handleSelectAllRow(activity.name)}
                        className="w-3.5 h-3.5 cursor-pointer accent-blue-600"
                      />
                    </td>
                    {permissions.map((perm) => (
                      <td key={perm.id} className="p-2.5 border border-gray-200 text-center w-[16.25%]">
                        <input
                          type="checkbox"
                          checked={rights[activity.name]?.[perm.name] || false}
                          onChange={() => handlePermissionChange(activity.name, perm.name)}
                          className="w-3.5 h-3.5 cursor-pointer accent-blue-600"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <button 
              className="mt-4 px-5 py-1.5 bg-blue-600 text-white border-none rounded-md text-[13px] cursor-pointer block ml-auto hover:bg-blue-700 transition-colors duration-200"
              onClick={handleAssign}
            >
              Assign
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminRoles;