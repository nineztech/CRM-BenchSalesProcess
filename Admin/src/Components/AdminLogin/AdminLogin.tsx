// src/Components/AdminLogin/AdminLogin.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';
import logo from '../../assets/logo.webp'; // Optional logo
import { CgOverflow } from 'react-icons/cg';

export const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState(''); // renamed adminName to username
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login success - redirect to dashboard or wherever you want
        navigate('/dashboard');
      } else {
        // Login failed - show error message from backend
        setError(data.error || 'Invalid username or password');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Login error:', err);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div
        className="admin-login-right"
        style={{ backgroundImage: `url(/Backgrondimg.jpeg)`,  backgroundSize:'cover'}}
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
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
