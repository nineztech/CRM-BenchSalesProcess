import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';

export const AdminLogin = () => {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('');
  
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Hardcoded credentials (for demo purposes)
    const validAdmin = {
      name: 'admin',
      
      password: 'admin123',
    };

    if (
      adminName === validAdmin.name &&
       
      password === validAdmin.password
    ) {
      // Clear error and redirect to dashboard or home
      setError('');
      navigate('/dashboard');
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login-box">
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
        </form>

         
      </div>
    </div>
  );
};
