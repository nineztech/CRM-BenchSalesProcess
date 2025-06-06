import React, { useState } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import { FaEdit } from 'react-icons/fa';

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
    <>
      <Sidebar />

      <div className="flex border-2 border-gray-100 rounded-lg p-5 bg-white shadow-lg  mt-10 ">
        <h2 className="flex text-2xl text-gray-800 m-0 ">Roles & Rights</h2>
        <div className="flex gap-2.5  ">
          <select 
            value={selectedDepartment} 
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 min-w-[180px] border border-gray-300 rounded text-sm outline-none"
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
            className="px-3 py-2 min-w-[180px] border border-gray-300 rounded text-sm outline-none"
          >
            <option value="" disabled hidden>Select Role *</option>
            <option value="manager">Manager</option>
            <option value="executive">Executive</option>
          </select>

          <button 
            onClick={() => setShowNewRoleForm(true)}
            className="px-5 py-2 bg-slate-700 text-white border-none rounded-full text-sm cursor-pointer transition-colors duration-300 hover:bg-slate-800"
          >
            + New Role
          </button>
        </div>
      </div>

      {showNewRoleForm && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-[999]">
          <div className="relative bg-white py-5 px-8 rounded-lg w-[500px] max-h-[90vh] overflow-y-auto shadow-2xl">
            <span
              onClick={() => {
                setShowNewRoleForm(false);
                setNewRoleName('');
                setEditIndex(null);
              }}
              className="absolute top-2.5 right-4 text-2xl font-bold text-gray-800 cursor-pointer select-none"
              title="Close"
            >
              &times;
            </span>

            <h3 className="mb-4">Add New Role</h3>

            <div className="flex gap-2.5 mb-4">
              <input
                type="text"
                placeholder="Enter new role name"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="h-9 text-sm w-[300px] rounded border border-gray-300 px-2"
              />
              <button 
                className="px-6 py-2.5 bg-slate-700 text-white border-none rounded-full text-base cursor-pointer block ml-auto transition-colors duration-300"
                onClick={handleAddNewRole}
              >
                {editIndex !== null ? 'Update Role' : 'Add Role'}
              </button>
            </div>

            {roleList.length > 0 && (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 border border-gray-300 text-center text-sm bg-gray-100 font-semibold text-gray-800">Sr. No.</th>
                    <th className="p-3 border border-gray-300 text-center text-sm bg-gray-100 font-semibold text-gray-800">Created At</th>
                    <th className="p-3 border border-gray-300 text-center text-sm bg-gray-100 font-semibold text-gray-800">Role Name</th>
                    <th className="p-3 border border-gray-300 text-center text-sm bg-gray-100 font-semibold text-gray-800">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {roleList.map((item, index) => (
                    <tr key={index} className="even:bg-gray-50">
                      <td className="p-3 border border-gray-300 text-center text-sm">{index + 1}</td>
                      <td className="p-3 border border-gray-300 text-center text-sm">{item.createdAt}</td>
                      <td className="p-3 border border-gray-300 text-center text-sm">{item.role}</td>
                      <td className="p-3 border border-gray-300 text-center text-sm">
                        <button 
                          className="bg-transparent border-none cursor-pointer text-base text-gray-800"
                          onClick={() => handleEditRole(index)}
                        >
                          <FaEdit className="text-sm bg-transparent border-none cursor-pointer text-base" />
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
        <div className=" border-2 border-gray-100 rounded-lg p-5 bg-white shadow-lg  mt-10">
          <table className="w-full border-collapse min-w-[600px]">
            <thead>
              <tr>
                <th className="p-3 border border-gray-300 text-left text-sm bg-gray-100 font-semibold text-gray-800 w-[35%] text-left">Activity</th>
                {permissions.map((perm) => (
                  <th key={perm} className="p-3 border border-gray-300 text-center text-sm bg-gray-100 font-semibold text-gray-800 w-[16.25%]">{perm}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity} className="even:bg-gray-50">
                  <td className="p-3 border border-gray-300 text-left text-sm w-[35%] text-left">{activity}</td>
                  {permissions.map((perm) => (
                    <td key={perm} className="p-3 border border-gray-300 text-center text-sm w-[16.25%]">
                      <input
                        type="checkbox"
                        checked={rights[activity]?.[perm] || false}
                        onChange={() => handlePermissionChange(activity, perm)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <button 
            className="mt-5 px-6 py-2.5 bg-slate-700 text-white border-none rounded-full text-base cursor-pointer block ml-auto transition-colors duration-300 hover:bg-slate-800 md:w-30"
            onClick={handleAssign}
          >
            Assign
          </button>
        </div>
      )}
    </>
  );
};

export default AdminRoles;