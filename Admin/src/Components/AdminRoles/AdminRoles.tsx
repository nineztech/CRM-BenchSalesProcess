import React, { useState } from 'react';
import './adminroles.css';
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

      <div className="roles-header-container">
        <h2 className="roles-header-title">Roles & Rights</h2>
        <div className="dropdown-actions">
          <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
            <option value="" disabled hidden>Select Department *</option>
            <option value="lead">Lead Generation</option>
            <option value="sales">Sales</option>
            <option value="resume">Resume Making</option>
            <option value="training">Training</option>
            <option value="marketing">Marketing</option>
            <option value="onboarding">Onboarding BGC</option>
          </select>

          <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
            <option value="" disabled hidden>Select Role *</option>
            <option value="manager">Manager</option>
            <option value="executive">Executive</option>
          </select>

          <button onClick={() => setShowNewRoleForm(true)}>+ New Role</button>
        </div>
      </div>

      {showNewRoleForm && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000
        }}>
          <div
            className="modal-content"
            style={{
              position: 'relative', // Important for positioning the close icon
              background: '#fff',
              borderRadius: '8px',
              padding: '20px',
              maxWidth: '600px',
              margin: '80px auto',
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}
          >
            {/* Close icon inside the modal-content, top right corner */}
            <span
              onClick={() => {
                setShowNewRoleForm(false);
                setNewRoleName('');
                setEditIndex(null);
              }}
              style={{
                position: 'absolute',
                top: '10px',
                right: '15px',
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#333',
                cursor: 'pointer',
                userSelect: 'none',
              }}
              title="Close"
            >
              &times;
            </span>

            <h3>Add New Role</h3>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input
                type="text"
                placeholder="Enter new role name"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                  style={{
  height:"35px",  // reduced height
  fontSize: '14px',     // smaller text
  width: '300px',
  borderRadius: '5px',
  border: '1px solid #ccc',
}}

              />
              <button className="close-button" onClick={handleAddNewRole}>
                {editIndex !== null ? 'Update Role' : 'Add Role'}
              </button>
            </div>

            {roleList.length > 0 && (
              <table>
                <thead>
                  <tr>
                    <th>Sr. No.</th>
                    <th>Created At</th>

                    <th>Role Name</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {roleList.map((item, index) => (
                    <tr key={index}>

                      <td>{index + 1}</td>
                      <td>{item.createdAt}</td>

                      <td>{item.role}</td>
                      <td>
                        <button className="edit-btn" onClick={() => handleEditRole(index)}>
                          <FaEdit />
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
        <div className="rights-table">
          <table>
            <thead>
              <tr>
                <th>Activity</th>
                {permissions.map((perm) => (
                  <th key={perm}>{perm}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity}>
                  <td>{activity}</td>
                  {permissions.map((perm) => (
                    <td key={perm}>
                      <input
                        type="checkbox"
                        checked={rights[activity]?.[perm] || false}
                        onChange={() => handlePermissionChange(activity, perm)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <button className="assign-button" onClick={handleAssign}>Assign</button>
        </div>
      )}
    </>
  );
};

export default AdminRoles;
