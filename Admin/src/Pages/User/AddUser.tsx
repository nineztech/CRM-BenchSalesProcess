import React, { useState, useEffect } from 'react';
import './adduser.css';
import Sidebar from '../../Components/Sidebar/Sidebar';
import { FaEdit, FaTrash } from 'react-icons/fa';

const UserRegister: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    department: "",
    designation: "",
    mobileNumber: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [users, setUsers] = useState<any[]>([]);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/user');
    const data = await response.json();

    if (response.ok) {
      setUsers(data); // or whatever state holds the list
    } else {
      console.error('Failed to fetch users:', data.message);
      alert('Failed to load users');
    }
  } catch (err) {
    console.error('Fetch error:', err);
    alert('Error fetching users');
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
    Object.entries(formData).forEach(([key, value]) => {
      if (!value.trim()) newErrors[key] = "This field is required";
    });

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const method = editingUserId ? 'PUT' : 'POST';
      const url = editingUserId
        ? `http://localhost:5000/api/user/${editingUserId}`
        : 'http://localhost:5000/api/user/create';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        alert(editingUserId ? "✅ User updated successfully!" : "✅ User created successfully!");
        handleReset();
        fetchUsers();
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
      department: "",
      designation: "",
      mobileNumber: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setErrors({});
    setEditingUserId(null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`http://localhost:5000/api/user/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        fetchUsers();
      } else {
        alert(`❌ Failed: ${result.message}`);
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("❌ Server error");
    }
  };

  const handleEdit = (user: any) => {
    setFormData({
      firstName: user.first_name,
      lastName: user.last_name,
      department: user.department,
      designation: user.designation,
      mobileNumber: user.mobile_number,
      username: user.username,
      email: user.email,
      password: user.password,
      confirmPassword: user.password,
    });
    setEditingUserId(user.id);
    setErrors({});
  };

  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase();
    return (
      user.first_name.toLowerCase().includes(search) ||
      user.last_name.toLowerCase().includes(search) ||
      user.department.toLowerCase().includes(search) ||
      user.designation.toLowerCase().includes(search) ||
      user.mobile_number.toLowerCase().includes(search) ||
      user.username.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search)
    );
  });

  return (
    <>
      <Sidebar />
      <div className="form-container">
        <h2 className="form-title">{editingUserId ? "Edit User" : "User Registration"}</h2>
        <form className="user-form" onSubmit={handleSubmit} onReset={handleReset}>
          <div className="form-buttons">
            <button type="submit">{editingUserId ? "Update" : "Save"}</button>
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
              <label>Department</label>
              <input
                type="text"
                name="department"
                placeholder="Department *"
                value={formData.department}
                onChange={handleChange}
              />
              {errors.department && <div className="error">{errors.department}</div>}
            </div>
            <div className="form-group">
              <label>Designation (Role)</label>
              <input
                type="text"
                name="designation"
                placeholder="Designation *"
                value={formData.designation}
                onChange={handleChange}
              />
              {errors.designation && <div className="error">{errors.designation}</div>}
            </div>
          </div>

          <div className="form-row-2">
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

          <h2 className="form-title-2">User Credinsical's</h2>
          <div className="form-row-3">

             <div className="form-group">
              <label>User Name</label>
              <input
                type="text"
                name="username"
                placeholder="Username *"
                disabled={editingUserId !== null}
                value={formData.username}
                onChange={handleChange}
              />
              {errors.username && <div className="error">{errors.username}</div>}
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Password *"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <div className="error">{errors.password}</div>}
            </div>

              <div className="form-group-2">
                <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password *"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && <div className="error">{errors.confirmPassword}</div>}
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
        <h3>Registered Users</h3>
        {filteredUsers.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Mobile</th>
                <th>Username</th>
                <th>Email</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.first_name}</td>
                  <td>{user.last_name}</td>
                  <td>{user.department}</td>
                  <td>{user.designation}</td>
                  <td>{user.mobile_number}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.created_at}</td>
                  <td>
                    <button className="action-btn edit-btn" onClick={() => handleEdit(user)}>
                      <FaEdit />
                    </button>
                    <button className="action-btn delete-btn" onClick={() => handleDelete(user.id)}>
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No users found.</p>
        )}
      </div>
    </>
  );
};

export default UserRegister;
