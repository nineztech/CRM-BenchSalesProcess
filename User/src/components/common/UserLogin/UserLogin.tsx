import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../../assets/Logo.webp';
import { FiMail, FiKey, FiShield, FiUser } from 'react-icons/fi';
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
      username: string;
      role: string;
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
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Password reset states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showNewPasswordModal, setShowNewPasswordModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [timer, setTimer] = useState(120); // 2 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Timer effect for OTP expiry
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerRunning(false);
      setShowOtpModal(false);
      setError('OTP expired. Please request a new one.');
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

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
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data: LoginResponse = await response.json();

      if (data.success && data.data?.token) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        const state = location.state as LocationState;
        // Redirect based on user role
        const redirectPath = data.data.user.role === 'admin' ? '/adminpackages' : '/dashboard';
        const from = state?.from || redirectPath;
        console.log('Login successful, redirecting to:', from);
        navigate(from);
      } else {
        setError(data.message || 'Invalid username or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    try {
      setOtpError('');
      if (!email) {
        setOtpError('Please enter your email');
        return;
      }
      const response = await fetch(`${BASE_URL}/user/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setShowPasswordModal(false);
        setShowOtpModal(true);
        setTimer(120);
        setIsTimerRunning(true);
        setError('');
      } else {
        setOtpError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setOtpError('Server error. Please try again later.');
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setOtpError('');
      if (!otp || otp.length !== 6) {
        setOtpError('Please enter a valid 6-digit OTP');
        return;
      }
      const response = await fetch(`${BASE_URL}/user/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
      if (response.ok) {
        setShowOtpModal(false);
        setShowNewPasswordModal(true);
        setIsTimerRunning(false);
        setOtpError('');
      } else {
        setOtpError(data.message || 'Invalid OTP');
        setOtp('');
      }
    } catch (err) {
      setOtpError('Server error. Please try again later.');
    }
  };

  const handleResetPassword = async () => {
    try {
      setPasswordError('');
      if (!newPassword || !confirmPassword) {
        setPasswordError('Please fill in all password fields');
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordError('Passwords do not match');
        return;
      }
      if (newPassword.length < 6) {
        setPasswordError('Password must be at least 6 characters long');
        return;
      }
      const response = await fetch(`${BASE_URL}/user/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setShowNewPasswordModal(false);
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setOtpError('');
        setPasswordError('');
        setError('Password reset successful. Please login with your new password.');
      } else {
        setPasswordError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setPasswordError('Server error. Please try again later.');
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
              Login
            </h2>
            
            {error && (
              <div className="bg-red-500 p-3 rounded-md text-center text-white mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <label className="flex flex-col font-medium text-sm">
                Username:
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="mt-1 pl-10 p-2 w-full border border-gray-300 rounded-md text-sm text-black focus:border-blue-500 focus:outline-none"
                    placeholder="Enter your username"
                  />
                </div>
              </label>
              
              <label className="flex flex-col font-medium text-sm">
                Password:
                <div className="relative">
                  <FiKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1 pl-10 p-2 w-full border border-gray-300 rounded-md text-sm text-black focus:border-blue-500 focus:outline-none"
                    placeholder="Enter your password"
                  />
                </div>
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

              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="text-sm text-gray-300 hover:text-white transition-colors duration-200 text-center mt-2"
              >
                Forgot Password?
              </button>
              
              <p className="text-center mt-4 text-xs text-black bg-red-100 p-2 rounded">
                Having trouble logging in? Please contact support.
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Reset Password</h2>
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="rounded-full bg-blue-50 p-3">
                  <FiMail className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              {otpError && (
                <p className="mt-2 text-sm text-red-500">{otpError}</p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setEmail('');
                  setOtpError('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendOtp}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <FiMail className="h-4 w-4" />
                Send OTP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Enter Verification Code</h2>
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="rounded-full bg-blue-50 p-3">
                  <FiKey className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-center text-sm text-gray-600 mb-4">
                Enter the 6-digit verification code sent to your email
              </p>
              <div className="flex justify-center mb-2">
                <div className="w-48">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      if (value.length <= 6) setOtp(value);
                    }}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-4 py-2 text-center text-lg tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    maxLength={6}
                  />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">
                  Time remaining: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                </p>
                {otpError && (
                  <p className="text-sm text-red-500 mb-2">{otpError}</p>
                )}
                <button
                  onClick={handleSendOtp}
                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Resend OTP
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowOtpModal(false);
                  setIsTimerRunning(false);
                  setOtp('');
                  setOtpError('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyOtp}
                disabled={otp.length !== 6}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2
                  ${otp.length === 6 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-400 cursor-not-allowed'}`}
              >
                <FiShield className="h-4 w-4" />
                Verify OTP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Password Modal */}
      {showNewPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Set New Password</h2>
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="rounded-full bg-blue-50 p-3">
                  <FiKey className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              {passwordError && (
                <p className="mt-2 text-sm text-red-500">{passwordError}</p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNewPasswordModal(false);
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={!newPassword || !confirmPassword || newPassword.length < 6}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2
                  ${newPassword && confirmPassword && newPassword.length >= 6
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'}`}
              >
                <FiKey className="h-4 w-4" />
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};