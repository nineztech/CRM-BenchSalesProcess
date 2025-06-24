import  { useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import Layout from '../../common/layout/Layout';
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

const DepartmentPermissions = (): ReactElement => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

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

  // Update available roles when department changes
  useEffect(() => {
    if (selectedDepartment) {
      const department = departments.find(dept => dept.id.toString() === selectedDepartment);
      if (department) {
        setAvailableRoles(department.subroles);
        setSelectedRole(''); // Reset role selection when department changes
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

  // Fetch permissions when department or role is selected/changed
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!selectedDepartment) return;

      try {
        let url = `${import.meta.env.VITE_API_URL}/role-permissions/department/${selectedDepartment}`;
        if (selectedRole) {
          url += `?role=${selectedRole}`;
        }
        const response = await axios.get(url);
        if (response.data.success) {
          setPermissions(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
      }
    };

    fetchPermissions();
  }, [selectedDepartment, selectedRole]);

  return (
    <Layout>
      <div className="flex flex-col gap-4 max-w-[98%]">
        <div className="flex justify-between items-center border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
          <h2 className="text-xl font-medium text-gray-800 m-0">Department Permissions</h2>
          <div className="flex gap-4">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-1.5 min-w-[200px] border border-gray-300 rounded-md text-[13px] outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.departmentName}
                </option>
              ))}
            </select>
            
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-1.5 min-w-[200px] border border-gray-300 rounded-md text-[13px] outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200"
              disabled={!selectedDepartment}
            >
              <option value="">All Roles</option>
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedDepartment && activities.length > 0 && (
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

                  <table className="w-full border-collapse min-w-[600px] mb-4">
                    <thead>
                      <tr>
                        <th className="p-2.5 border border-gray-200 text-left text-[13px] bg-gray-50 font-medium text-gray-700">Activity</th>
                        <th className="p-2.5 border border-gray-200 text-left text-[13px] bg-gray-50 font-medium text-gray-700">Role</th>
                        <th className="p-2.5 border border-gray-200 text-center text-[13px] bg-gray-50 font-medium text-gray-700">View</th>
                        <th className="p-2.5 border border-gray-200 text-center text-[13px] bg-gray-50 font-medium text-gray-700">Add</th>
                        <th className="p-2.5 border border-gray-200 text-center text-[13px] bg-gray-50 font-medium text-gray-700">Edit</th>
                        <th className="p-2.5 border border-gray-200 text-center text-[13px] bg-gray-50 font-medium text-gray-700">Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryActivities.map((activity) => {
                        const activityPermissions = permissions.filter(p => p.activity_id === activity.id);
                        return activityPermissions.map((permission, idx) => (
                          <tr key={`${activity.id}-${idx}`} className="even:bg-gray-50 hover:bg-gray-50 transition-colors duration-150">
                            <td className="p-2.5 border border-gray-200 text-left text-[13px] text-gray-600">
                              {activity.name}
                              {activity.description && (
                                <span className="block text-[11px] text-gray-500 mt-1">{activity.description}</span>
                              )}
                            </td>
                            <td className="p-2.5 border border-gray-200 text-left text-[13px] text-gray-600">
                              {permission.subrole}
                            </td>
                            <td className="p-2.5 border border-gray-200 text-center">
                              <span className={permission.canView ? 'text-green-600' : 'text-red-600'}>
                                {permission.canView ? '✓' : '✗'}
                              </span>
                            </td>
                            <td className="p-2.5 border border-gray-200 text-center">
                              <span className={permission.canAdd ? 'text-green-600' : 'text-red-600'}>
                                {permission.canAdd ? '✓' : '✗'}
                              </span>
                            </td>
                            <td className="p-2.5 border border-gray-200 text-center">
                              <span className={permission.canEdit ? 'text-green-600' : 'text-red-600'}>
                                {permission.canEdit ? '✓' : '✗'}
                              </span>
                            </td>
                            <td className="p-2.5 border border-gray-200 text-center">
                              <span className={permission.canDelete ? 'text-green-600' : 'text-red-600'}>
                                {permission.canDelete ? '✓' : '✗'}
                              </span>
                            </td>
                          </tr>
                        ));
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}

        {!selectedDepartment && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Please select a department to view permissions.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DepartmentPermissions; 