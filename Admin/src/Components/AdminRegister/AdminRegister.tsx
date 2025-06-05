// src/Pages/AdminRegister/AdminRegister.tsx
import React, { useState, useEffect } from 'react';
import './adminregister.css'
import Sidebar from '../../Components/Sidebar/Sidebar';
import { FaEdit, FaUserSlash, FaUserCheck } from 'react-icons/fa';

const AdminRegister: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    mobileNumber: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [admins, setAdmins] = useState<any[]>([]);
  const [editingAdminId, setEditingAdminId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPassword] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/all');
      const data = await response.json();
      setAdmins(data);
    } catch (err) {
      console.error("Failed to fetch admins", err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    let errorMsg = "";
    if (!value.trim()) {
      errorMsg = "This field is required";
    } else if (name === "mobileNumber" && !/^\d{10}$/.test(value)) {
      errorMsg = "Enter a valid 10-digit mobile number";
    } else if (name === "confirmPassword" && value !== formData.password) {
      errorMsg = "Passwords do not match";
    }

    setErrors({ ...errors, [name]: errorMsg });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    
    // Validation for required fields
    Object.entries(formData).forEach(([key, value]) => {
      // Skip password validation in edit mode if password is empty
      if (editingAdminId && (key === 'password' || key === 'confirmPassword') && !value.trim()) {
        return; // Allow empty passwords in edit mode
      }
      if (!value.trim()) newErrors[key] = "This field is required";
    });

    // Only check password match if passwords are provided
    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const method = editingAdminId ? 'PUT' : 'POST';
      const url = editingAdminId
        ? `http://localhost:5000/api/admin/${editingAdminId}`
        : 'http://localhost:5000/api/admin/register';

      // For edit mode, only send password if it's not empty
      let submitData;
      if (editingAdminId && !formData.password.trim()) {
        // Destructure to exclude password fields
        const { password: _, confirmPassword: __, ...dataWithoutPassword } = formData;
        submitData = dataWithoutPassword;
      } else {
        submitData = { ...formData };
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (response.ok) {
        alert(editingAdminId ? "✅ Admin updated successfully!" : "✅ Admin registered successfully!");
        handleReset();
        fetchAdmins();
      } else {
        alert(`❌ Failed: ${result.message}`);
      }
    } catch (err) {
      alert("❌ Error connecting to server.");
      console.error(err);
    }
  };

  const handleReset = () => {
    setFormData({
      firstName: "",
      lastName: "",
      mobileNumber: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setErrors({});
    setEditingAdminId(null);
  };

  // Toggle admin status (disable/enable)
  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    const action = currentStatus ? "enable" : "disable";
    if (!window.confirm(`Are you sure you want to ${action} this admin?`)) return;

    try {
      const response = await fetch(`http://localhost:5000/api/admin/${id}/toggle-status`, {
        method: 'PATCH',
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ ${result.message}`);
        fetchAdmins();
      } else {
        alert(`❌ Failed: ${result.message}`);
      }
    } catch (err) {
      console.error("Error toggling admin status:", err);
      alert("❌ Server error");
    }
  };

  const handleEdit = (admin: any) => {
    setFormData({
      firstName: admin.first_name,
      lastName: admin.last_name,
      mobileNumber: admin.mobile_number,
      username: admin.username,
      email: admin.email,
      password: "", // Always empty for security
      confirmPassword: "",
    });
    setEditingAdminId(admin.id);
    setErrors({});
  };

  const filteredAdmins = admins.filter((admin) => {
    const search = searchTerm.toLowerCase();
    return (
      admin.first_name.toLowerCase().includes(search) ||
      admin.last_name.toLowerCase().includes(search) ||
      admin.mobile_number.toLowerCase().includes(search) ||
      admin.username.toLowerCase().includes(search) ||
      admin.email.toLowerCase().includes(search)
    );
  });

  return (
    <>
      <Sidebar />
      <div className="form-container">
        <h2 className="form-title">{editingAdminId ? "Edit Admin" : "Admin Registration"}</h2>
        <form className="user-form" onSubmit={handleSubmit} onReset={handleReset}>
          <div className="form-buttons">
            <button type="submit">{editingAdminId ? "Update" : "Save"}</button>
            <button type="reset">Discard</button>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                placeholder="First Name *"
                value={formData.firstName}
                onChange={handleChange}
              />
              {errors.firstName && <div className="error">{errors.firstName}</div>}
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                placeholder="Last Name *"
                value={formData.lastName}
                onChange={handleChange}
              />
              {errors.lastName && <div className="error">{errors.lastName}</div>}
            </div>
            <div className="form-group">
              <label>Mobile Number</label>
              <input
                type="text"
                name="mobileNumber"
                placeholder="Mobile Number *"
                value={formData.mobileNumber}
                onChange={handleChange}
                maxLength={10}
              />
              {errors.mobileNumber && <div className="error">{errors.mobileNumber}</div>}
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="Email ID *"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <div className="error">{errors.email}</div>}
            </div>
          </div>

          <h2 className="form-title-2">Admin Credentials</h2>
          <div className="form-row">
            <div className="form-group">
              <label>User Name</label>
              <input
                type="text"
                name="username"
                placeholder="Username *"
                value={formData.username}
                onChange={handleChange}
                disabled={editingAdminId !== null}
              />
              {errors.username && <div className="error">{errors.username}</div>}
            </div>
            <div className="form-group">
              <label>Password {editingAdminId && "(Leave empty to keep current)"}</label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder={editingAdminId ? "New Password (optional)" : "Password *"}
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <div className="error">{errors.password}</div>}
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder={editingAdminId ? "Confirm New Password" : "Confirm Password *"}
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && <div className="error">{errors.confirmPassword}</div>}
            </div>
            <div className="form-group">
            </div>
          </div>
        </form>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search Here..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-container">
        <h3>Registered Admins</h3>
        {filteredAdmins.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Mobile</th>
                <th>Username</th>
                <th>Email</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.map((admin) => (
                <tr key={admin.id} className={admin.is_disabled ? 'disabled-row' : ''}>
                  <td>{admin.id}</td>
                  <td>{admin.first_name}</td>
                  <td>{admin.last_name}</td>
                  <td>{admin.mobile_number}</td>
                  <td>{admin.username}</td>
                  <td>{admin.email}</td>
                  <td>
                    <span className={`status-badge ${admin.is_disabled ? 'disabled' : 'active'}`}>
                      {admin.is_disabled ? '🔴 Disabled' : '🟢 Active'}
                    </span>
                  </td>
                  <td>{admin.created_at}</td>
                  <td>
                    <button 
                      className="action-btn edit-btn" 
                      onClick={() => handleEdit(admin)}
                      disabled={admin.is_disabled}
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className={`action-btn edit-btn ${admin.is_disabled ? 'enable-btn' : 'disable-btn'}`}
                      onClick={() => handleToggleStatus(admin.id, admin.is_disabled)}
                    >
                      {admin.is_disabled ? <FaUserSlash /> :<FaUserCheck />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No admins found.</p>
        )}
      </div>
    </>
  );
};

export default AdminRegister;