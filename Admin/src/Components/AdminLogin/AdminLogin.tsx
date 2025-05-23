// src/Components/AdminLogin/AdminLogin.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';
import logo from '../../assets/logo.webp'; // Optional logo

export const AdminLogin = () => {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const validAdmin = {
      name: 'admin',
      password: 'admin123',
    };

    if (adminName === validAdmin.name && password === validAdmin.password) {
      setError('');
      navigate('/dashboard');
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
     
    <div className="admin-login-wrapper">
      <div
        className="admin-login-right"
        style={{ backgroundImage: `url(public/images/Backgrondimg.jpeg)` }}
  >
      <div className="admin-login-left">
        <div className="admin-login-form-box">
          <div className="logo">
            <img src={logo} alt="Logo" />
          </div>
          <h2 className="admin-login-title">Admin Login</h2>
          {error && <div className="admin-login-error">{error}</div>}
          <form onSubmit={handleLogin} className="admin-login-form">
            <label>
              User Name:
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                required
              />
            </label>
            <label>
              Password:
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <button type="submit">Login</button>
            <p className="admin-login-help">
              Hey, not able to login? Contact the Admin Staff.
            </p>
          </form>
        </div>
      </div>
      </div>
       </div>
 
  );
};
