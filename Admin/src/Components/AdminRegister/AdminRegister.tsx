import React, { useState } from 'react';
import './adminregister.css';
import Sidebar from '../../Components/Sidebar/Sidebar';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <>
      <Sidebar />
      <div className="form-container">
        <h2 className="form-title">Admin Registration</h2>
        <form className="user-form">
          <div className="form-buttons">
            <button type="submit">Save</button>
            <button type="reset">Discard</button>
          </div>

          {/* Row 1 */}
          <div className="form-row">
            <div className="form-group">
              <input type="text" name="firstName" placeholder="First Name *" onChange={handleChange} />
            </div>
            <div className="form-group">
              <input type="text" name="lastName" placeholder="Last Name *" onChange={handleChange} />
            </div>
            <div className="form-group">
              <input type="text" name="mobileNumber" placeholder="Mobile Number *" onChange={handleChange} maxLength={10} />
            </div>
            <div className="form-group">
              <input type="text" name="username" placeholder="Username *" onChange={handleChange} />
            </div>
          </div>

          {/* Row 2 */}
          <div className="form-row">
            <div className="form-group">
              <input type="email" name="email" placeholder="Email ID *" onChange={handleChange} />
            </div>
            <div className="form-group">
              <input type="password" name="password" placeholder="Password *" onChange={handleChange} />
            </div>
            <div className="form-group">
              <input type="password" name="confirmPassword" placeholder="Confirm Password *" onChange={handleChange} />
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default AdminRegister;
