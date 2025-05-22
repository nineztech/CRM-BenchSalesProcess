import React, { useState, useEffect } from 'react';
import './adminregister.css';
import Sidebar from '../../Components/Sidebar/Sidebar';
import { FaEdit, FaTrash } from 'react-icons/fa';

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
  
  // Initialize admins from localStorage
  const [admins, setAdmins] = useState<any[]>(() => {
    const saved = localStorage.getItem("admins");
    return saved ? JSON.parse(saved) : [];
  });

  const [editIndex, setEditIndex] = useState<number | null>(null);

  // Save to localStorage on any change to admins
  useEffect(() => {
    localStorage.setItem("admins", JSON.stringify(admins));
  }, [admins]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    let errorMsg = "";
    if (!value.trim()) {
      errorMsg = "This field is required";
    } else if (name === "mobileNumber" && (!/^\d{10}$/.test(value))) {
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
      const updatedAdmins = [...admins];
      updatedAdmins[editIndex] = {
        ...formData,
        id: updatedAdmins[editIndex].id,
        dateTime: currentDateTime,
      };
      setAdmins(updatedAdmins);
      setEditIndex(null);
    } else {
      const newAdmin = {
        ...formData,
        id: admins.length > 0 ? admins[admins.length - 1].id + 1 : 1,
        dateTime: currentDateTime,
      };
      setAdmins([...admins, newAdmin]);
    }

    handleReset();
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
    setEditIndex(null);
  };

  const handleEdit = (index: number) => {
    const admin = admins[index];
    setFormData({
      firstName: admin.firstName,
      lastName: admin.lastName,
      mobileNumber: admin.mobileNumber,
      username: admin.username,
      email: admin.email,
      password: admin.password,
      confirmPassword: admin.password,
    });
    setEditIndex(index);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this admin?")) {
      const filtered = admins.filter(admin => admin.id !== id);
      setAdmins(filtered);
    }
  };

  return (
    <>
      <Sidebar />
      <div className="form-container">
        <h2 className="form-title">Admin Registration</h2>
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
              <input type="text" name="mobileNumber" placeholder="Mobile Number *" value={formData.mobileNumber} onChange={handleChange} maxLength={10} />
              {errors.mobileNumber && <div className="error">{errors.mobileNumber}</div>}
            </div>
            <div className="form-group">
              <input type="text" name="username" placeholder="Username *" value={formData.username} onChange={handleChange} />
              {errors.username && <div className="error">{errors.username}</div>}
            </div>
          </div>

          <div className="form-row">
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
            <div className="form-group empty"></div>
          </div>
        </form>
      </div>

      <div className="table-container">
        <h3>Registered Admins</h3>
        {admins.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Mobile</th>
                <th>Username</th>
                <th>Email</th>
                <th>Date & Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin, index) => (
                <tr key={admin.id}>
                  <td>{admin.id}</td>
                  <td>{admin.firstName}</td>
                  <td>{admin.lastName}</td>
                  <td>{admin.mobileNumber}</td>
                  <td>{admin.username}</td>
                  <td>{admin.email}</td>
                  <td>{admin.dateTime}</td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEdit(index)}><FaEdit /></button>
                    <button className="delete-btn" onClick={() => handleDelete(admin.id)}><FaTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No admins registered yet.</p>
        )}
      </div>
    </>
  );
};

export default AdminRegister;
