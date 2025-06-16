import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.webp';
const BASE_URL=import.meta.env.VITE_API_URL|| "http://localhost:5006/api"
interface LocationState {
  from?: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: number;
      email: string;
      status: string;
      createdAt: string;
      updatedAt: string;
    };
    token: string;
  };
}

export const UserLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/user/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include', // Important for CORS
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await response.json();

      if (data.success && data.data?.token) {
        // Store JWT token in localStorage
        localStorage.setItem('token', data.data.token);
        
        // Store user data if needed
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Get the redirect path from location state or default to dashboard
        const state = location.state as LocationState;
        const from = state?.from || '/dashboard';
        
        console.log('Login successful, redirecting to:', from);
        navigate(from);
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full overflow-hidden font-sans">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat -mt-20 -ml-10 w-[102.9%] h-[113.1%]"
        style={{ backgroundImage: `url(/Backgrondimg.jpeg)` }}
      >
        <div className="flex items-center h-screen px-16 text-white mt-12">
          <div className="w-full max-w-md bg-black bg-opacity-40 backdrop-blur-sm p-8 rounded-xl shadow-2xl mr-96 h-160 mt-4">
            <div className="text-center mb-14">
              <img src={logo} alt="Logo" className="h-12 mx-auto" />
            </div>
            
            <h2 className="text-center mb-10 text-gray-100 text-2xl font-semibold -mt-8">
              User Login
            </h2>
            
            {error && (
              <div className="bg-red-500 p-3 rounded-md text-center text-white mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <label className="flex flex-col font-medium text-sm">
                Email:
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                disabled={loading}
                className={`mt-4 text-white p-3 rounded-md font-bold cursor-pointer transition-colors duration-300 ${
                  loading 
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
              
              <p className="text-center mt-4 text-xs text-black bg-red-100 p-2 rounded">
                Having trouble logging in? Please contact support.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};