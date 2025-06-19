import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiLogOut, FiLock } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5006/api";

interface UserData {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  phoneNumber: string;
  username: string;
  role: string;
  departmentId: string | null;
  subrole: string | null;
  department?: { departmentName: string } | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const AdminProfile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<UserData>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Password reset states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showNewPasswordModal, setShowNewPasswordModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
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
      toast.error('OTP expired. Please request a new one.');
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // First try to get from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUserData(parsedUser);
          setEditedData(parsedUser);
          setIsLoading(false);
          return;
        }

        // If not in localStorage, fetch from API
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }

        const response = await axios.get(`${BASE_URL}/admin/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.user) {
          setUserData(response.data.user);
          setEditedData(response.data.user);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        toast.error('Failed to load profile data');
        setError('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${BASE_URL}/admin/${userData?.id}`,
        editedData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Profile updated successfully');
        setSuccess('Profile updated successfully');
        setUserData(prev => ({ ...prev!, ...editedData }));
        localStorage.setItem('user', JSON.stringify({ ...userData, ...editedData }));
        setIsEditing(false);
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update profile';
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BASE_URL}/admin/logout`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.success('Logged out successfully');
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Failed to logout');
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setSuccess('');
    if (!userData?.email) {
      toast.error('Email not found');
      return;
    }
    setEmail(userData.email);
    setShowPasswordModal(true);
  };

  const handleSendOtp = async () => {
    try {
      setOtpError('');
      const response = await axios.post(`${BASE_URL}/admin/send-otp`, { email });
      if (response.data.message) {
        toast.success('OTP sent to your email');
        setShowPasswordModal(false);
        setShowOtpModal(true);
        setTimer(120);
        setIsTimerRunning(true);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to send OTP';
      toast.error(errorMessage);
      setOtpError(errorMessage);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setOtpError('');
      if (!otp || otp.length !== 6) {
        setOtpError('Please enter a valid 6-digit OTP');
        return;
      }
      const response = await axios.post(`${BASE_URL}/admin/verify-otp`, { email, otp });
      if (response.data.message) {
        toast.success('OTP verified successfully');
        setShowOtpModal(false);
        setShowNewPasswordModal(true);
        setIsTimerRunning(false);
        setOtpError(''); // Clear OTP error when successful
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Invalid OTP';
      setOtpError(errorMessage);
      setOtp(''); // Clear OTP input on error
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
      const response = await axios.post(`${BASE_URL}/admin/reset-password`, {
        email,
        otp,
        newPassword
      });
      if (response.data.message) {
        toast.success(response.data.message);
        setShowNewPasswordModal(false);
        // Reset all states
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setOtpError('');
        setPasswordError('');
        // Optional: Redirect to login page after successful password reset
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to reset password';
      setPasswordError(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl font-semibold">No user data found</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Admin Profile</h1>
          <div className="flex gap-4">
            {!isEditing && (
              <>
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  <FiEdit2 /> Edit Profile
                </button>
                <button
                  onClick={handleForgotPassword}
                  className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                >
                  <FiLock /> Change Password
                </button>
              </>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              <FiLogOut /> Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="firstname"
                  value={editedData.firstname || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              ) : (
                <p className="mt-1 text-gray-900">{userData.firstname}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="lastname"
                  value={editedData.lastname || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              ) : (
                <p className="mt-1 text-gray-900">{userData.lastname}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={editedData.email || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              ) : (
                <p className="mt-1 text-gray-900">{userData.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              {isEditing ? (
                <input
                  type="text"
                  name="phoneNumber"
                  value={editedData.phoneNumber || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              ) : (
                <p className="mt-1 text-gray-900">{userData.phoneNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <p className="mt-1 text-gray-900">{userData.username}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <p className="mt-1 text-gray-900 capitalize">{userData.role}</p>
            </div>

            {userData.department && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <p className="mt-1 text-gray-900">{userData.department.departmentName}</p>
              </div>
            )}

            {userData.subrole && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Sub Role</label>
                <p className="mt-1 text-gray-900 capitalize">{userData.subrole}</p>
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditedData(userData);
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Save Changes
              </button>
            </div>
          )}
        </form>

        {/* Password Reset Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg w-96">
              <h2 className="text-xl font-bold mb-4">Reset Password</h2>
              <p className="mb-4">Send OTP to your email: {email}</p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setOtpError('');
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendOtp}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Send OTP
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OTP Verification Modal */}
        {showOtpModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg w-96">
              <h2 className="text-xl font-bold mb-4">Enter OTP</h2>
              <p className="text-sm text-gray-600 mb-4">
                Please enter the 6-digit OTP sent to your email
              </p>
              <p className="mb-2 text-sm text-gray-600">
                Time remaining: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
              </p>
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value.length <= 6) setOtp(value);
                }}
                placeholder="Enter 6-digit OTP"
                className="w-full p-2 border rounded mb-4"
                maxLength={6}
              />
              {otpError && (
                <p className="text-red-500 text-sm mb-4">{otpError}</p>
              )}
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={handleSendOtp}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  Resend OTP
                </button>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowOtpModal(false);
                    setIsTimerRunning(false);
                    setOtp('');
                    setOtpError('');
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyOtp}
                  disabled={otp.length !== 6}
                  className={`px-4 py-2 rounded text-white ${
                    otp.length === 6 
                      ? 'bg-blue-500 hover:bg-blue-600' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  Verify OTP
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New Password Modal */}
        {showNewPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg w-96">
              <h2 className="text-xl font-bold mb-4">Set New Password</h2>
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
                    className="w-full p-2 border rounded"
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
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              {passwordError && (
                <p className="text-red-500 text-sm mt-2">{passwordError}</p>
              )}
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => {
                    setShowNewPasswordModal(false);
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError('');
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={!newPassword || !confirmPassword || newPassword.length < 6}
                  className={`px-4 py-2 rounded text-white ${
                    newPassword && confirmPassword && newPassword.length >= 6
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProfile;
