// src/Components/AdminLogin/AdminLogin.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="flex  w-full overflow-hidden font-sans">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat -mt-20 -ml-10 w-[102.9%] h-[113.1%]"
        style={{ backgroundImage: `url(/Backgrondimg.jpeg)` }}
      >
        <div className="flex  items-center h-screen px-16 text-white mt-12">
          <div className="w-full max-w-md bg-black bg-opacity-40 backdrop-blur-sm p-8 rounded-xl shadow-2xl mr-96 h-160 mt-4">
            <div className="text-center mb-14 ">
              <img src={logo} alt="Logo" className="h-12 mx-auto" />
            </div>
            
            <h2 className="text-center mb-10 text-gray-100 text-2xl font-semibold -mt-8">
              Admin Login
            </h2>
            
            {error && (
              <div className="bg-red-500 p-3 rounded-md text-center text-white mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <label className="flex flex-col font-medium text-sm">
                User Name:
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="mt-1 p-2 border border-gray-300 rounded-md text-sm text-black focus:border-blue-500 focus:outline-none"
                />
              </label>
              
              <label className="flex flex-col font-medium text-sm">
                Password:
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 p-2 border border-gray-300 rounded-md text-sm text-black focus:border-blue-500 focus:outline-none"
                />
              </label>
              
              <button
                type="submit"
                className="mt-4 bg-blue-600 text-white p-3 rounded-md font-bold cursor-pointer transition-colors duration-300 hover:bg-teal-500"
              >
                Login
              </button>
              
              <p className="text-center mt-4 text-xs text-black bg-red-100 p-2 rounded">
                Hey, not able to login? Contact the Admin Staff.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};