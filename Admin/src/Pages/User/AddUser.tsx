import React, { useState, useEffect } from 'react';
import './adduser.css';
import Sidebar from '../../Components/Sidebar/Sidebar';
import { FaEdit, FaTrash } from 'react-icons/fa';

const AddUser: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    department: "",
    mobileNumber: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [users, setUsers] = useState<any[]>(() => {
    const savedUsers = localStorage.getItem("users");
    return savedUsers ? JSON.parse(savedUsers) : [];
  });
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const departments = [
    "Lead Generation", "Sales", "Resume Making", "Training", "Marketing", "Onboarding BGC"
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    let errorMsg = "";
    if (!value.trim()) {
      errorMsg = "This field is required";
    } else if (name === "mobileNumber" && (!/^\d+$/.test(value) || value.length !== 10)) {
      errorMsg = "Enter a valid 10-digit mobile number";
    } else if (name === "confirmPassword" && value !== formData.password) {
      errorMsg = "Passwords do not match";
    }

    setErrors({ ...errors, [name]: errorMsg });
  };

  const handleSubmit = (e: React.FormEvent) => {
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

    const currentDateTime = new Date().toLocaleString();

    if (editIndex !== null) {
      const updatedUsers = [...users];
      updatedUsers[editIndex] = {
        ...formData,
        id: updatedUsers[editIndex].id,
        dateTime: currentDateTime,
      };
      setUsers(updatedUsers);
      setEditIndex(null);
    } else {
      const newUser = {
        ...formData,
        id: users.length + 1,
        dateTime: currentDateTime,
      };
      setUsers([...users, newUser]);
    }

    handleReset();
  };

  const handleEdit = (index: number) => {
    const user = users[index];
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      department: user.department,
      mobileNumber: user.mobileNumber,
      username: user.username,
      email: user.email,
      password: user.password,
      confirmPassword: user.password,
    });
    setEditIndex(index);
  };

  const handleDelete = (id: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this user?");
    if (confirmDelete) {
      const filteredUsers = users.filter(user => user.id !== id);
      const reindexedUsers = filteredUsers.map((user, i) => ({ ...user, id: i + 1 }));
      setUsers(reindexedUsers);
    }
  };

  const handleReset = () => {
    setFormData({
      firstName: "",
      lastName: "",
      department: "",
      mobileNumber: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setErrors({});
    setEditIndex(null);
  };

  useEffect(() => {
    localStorage.setItem("users", JSON.stringify(users));
  }, [users]);

  return (
    <>
      <Sidebar />

      <div className="form-container">
        <h2 className="form-title">User Creation</h2>

        <form className="user-form" onSubmit={handleSubmit} onReset={handleReset}>
          <div className="form-buttons">
            <button type="submit">{editIndex !== null ? "Update" : "Save"}</button>
            <button type="reset">Discard</button>
          </div>

          <div className="form-row">
            <div className="form-group">
              <input type="text" name="firstName" placeholder="First Name *" value={formData.firstName} onChange={handleChange} />
              {errors.firstName && <div className="error">{errors.firstName}</div>}
            </div>
            <div className="form-group">
              <input type="text" name="lastName" placeholder="Last Name *" value={formData.lastName} onChange={handleChange} />
              {errors.lastName && <div className="error">{errors.lastName}</div>}
            </div>
            <div className="form-group">
              <select name="department" value={formData.department} onChange={handleChange}>
                <option value="">Select Department *</option>
                {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </select>
              {errors.department && <div className="error">{errors.department}</div>}
            </div>
            <div className="form-group">
              <input type="text" name="mobileNumber" placeholder="Mobile Number *" value={formData.mobileNumber} onChange={handleChange} maxLength={10} />
              {errors.mobileNumber && <div className="error">{errors.mobileNumber}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <input type="text" name="username" placeholder="Username *" value={formData.username} onChange={handleChange} />
              {errors.username && <div className="error">{errors.username}</div>}
            </div>
            <div className="form-group">
              <input type="email" name="email" placeholder="Email ID *" value={formData.email} onChange={handleChange} />
              {errors.email && <div className="error">{errors.email}</div>}
            </div>
            <div className="form-group">
              <input type="password" name="password" placeholder="Password *" value={formData.password} onChange={handleChange} />
              {errors.password && <div className="error">{errors.password}</div>}
            </div>
            <div className="form-group">
              <input type="password" name="confirmPassword" placeholder="Confirm Password *" value={formData.confirmPassword} onChange={handleChange} />
              {errors.confirmPassword && <div className="error">{errors.confirmPassword}</div>}
            </div>
          </div>
        </form>
      </div>

      <div className="table-container">
        <h3>Submitted Users</h3>
        {users.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Sr.No</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Department</th>
                <th>Mobile Number</th>
                <th>Username</th>
                <th>Email</th>
                <th>Date & Time</th>
                <th style={{ width: '80px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.firstName}</td>
                  <td>{user.lastName}</td>
                  <td>{user.department}</td>
                  <td>{user.mobileNumber}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.dateTime}</td>
                  <td style={{ width: '80px', whiteSpace: 'nowrap' }}>
                    <button className="edit-btn" onClick={() => handleEdit(index)}><FaEdit /></button>
                    <button className="delete-btn" onClick={() => handleDelete(user.id)}><FaTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No users found</p>
        )}
      </div>
    </>
  );
};

export default AddUser;
