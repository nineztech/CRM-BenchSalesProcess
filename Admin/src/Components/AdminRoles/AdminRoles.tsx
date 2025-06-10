import React, { useState } from 'react';
import { FaEdit } from 'react-icons/fa';
import Layout from '../Layout/Layout';

const departmentActivities: Record<string, string[]> = {
  lead: ['Lead Create', 'Sales Executive Assign', 'Bulk Upload'],
  sales: ['Client Follow-up'],
  resume: ['Resume Upload', 'Resume Review'],
};

const permissions = ['View', 'Create', 'Edit', 'Delete'];

interface RoleEntry {
  role: string;
  createdAt: string;
}

const AdminRoles: React.FC = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('lead');
  const [selectedRole, setSelectedRole] = useState('');
  const [rights, setRights] = useState<Record<string, Record<string, boolean>>>({});

  const [showNewRoleForm, setShowNewRoleForm] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [roleList, setRoleList] = useState<RoleEntry[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const handlePermissionChange = (activity: string, permission: string) => {
    setRights(prev => ({
      ...prev,
      [activity]: {
        ...prev[activity],
        [permission]: !prev[activity]?.[permission],
      },
    }));
  };

  const handleAssign = () => {
    console.log('Assigned Rights:', {
      department: selectedDepartment,
      rights,
    });
    alert('Roles & Rights assigned successfully!');
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

  const activities = departmentActivities[selectedDepartment] || [];

  return (
    <Layout>
      <div className="flex flex-col gap-4 max-w-[98%]">
        <div className="flex justify-between items-center border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
          <h2 className="text-xl font-medium text-gray-800 m-0">Roles & Rights</h2>
          <div className="flex gap-3">
            <select 
              value={selectedDepartment} 
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-1.5 min-w-[160px] border border-gray-300 rounded-md text-[13px] outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200"
            >
              <option value="" disabled hidden>Select Department *</option>
              <option value="lead">Lead Generation</option>
              <option value="sales">Sales</option>
              <option value="resume">Resume Making</option>
              <option value="training">Training</option>
              <option value="marketing">Marketing</option>
              <option value="onboarding">Onboarding BGC</option>
            </select>

            <select 
              value={selectedRole} 
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-1.5 min-w-[160px] border border-gray-300 rounded-md text-[13px] outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200"
            >
              <option value="" disabled hidden>Select Role *</option>
              <option value="manager">Manager</option>
              <option value="executive">Executive</option>
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

        {activities.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr>
                  <th className="p-2.5 border border-gray-200 text-left text-[13px] bg-gray-50 font-medium text-gray-700 w-[35%]">Activity</th>
                  {permissions.map((perm) => (
                    <th key={perm} className="p-2.5 border border-gray-200 text-center text-[13px] bg-gray-50 font-medium text-gray-700 w-[16.25%]">{perm}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr key={activity} className="even:bg-gray-50 hover:bg-gray-50 transition-colors duration-150">
                    <td className="p-2.5 border border-gray-200 text-left text-[13px] text-gray-600 w-[35%]">{activity}</td>
                    {permissions.map((perm) => (
                      <td key={perm} className="p-2.5 border border-gray-200 text-center w-[16.25%]">
                        <input
                          type="checkbox"
                          checked={rights[activity]?.[perm] || false}
                          onChange={() => handlePermissionChange(activity, perm)}
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