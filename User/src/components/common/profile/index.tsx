import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiLogOut, FiLock, FiMail, FiKey, FiShield, FiUser, FiPhone, FiAtSign, FiBriefcase, FiUsers } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import Avatar from 'react-avatar';

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

const modalVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    transition: { 
      type: "spring" as const,
      duration: 0.4,
      bounce: 0.3 
    } 
  },
  exit: { 
    opacity: 0, 
    y: 20, 
    scale: 0.95, 
    transition: { duration: 0.2 } 
  }
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { 
      duration: 0.3 
    } 
  },
  exit: { 
    opacity: 0, 
    transition: { 
      duration: 0.2 
    } 
  }
};

const inputVariants = {
  focus: { 
    scale: 1.02, 
    transition: { 
      type: "spring" as const, 
      stiffness: 300 
    } 
  }
};

const buttonVariants = {
  hover: { 
    scale: 1.05, 
    transition: { 
      type: "spring" as const,
      stiffness: 400,
      duration: 0.2
    } 
  },
  tap: { 
    scale: 0.95,
    transition: {
      duration: 0.1
    }
  }
};

const iconVariants = {
  hover: { 
    rotate: 15, 
    scale: 1.1,
    transition: {
      type: "spring" as const,
      duration: 0.2
    }
  },
  tap: { 
    scale: 0.9,
    transition: {
      duration: 0.1
    }
  }
};

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<UserData>>({});
  const [error, setError] = useState('');
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

        const response = await axios.get(`${BASE_URL}/user/profile`, {
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

    try {
      const token = localStorage.getItem('token');
      const endpoint = userData?.role === 'admin' 
        ? `${BASE_URL}/admin/${userData?.id}`
        : `${BASE_URL}/user/${userData?.id}`;

      const response = await axios.put(
        endpoint,
        editedData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || 'Profile updated successfully');
        setUserData(prev => ({ ...prev!, ...editedData }));
        localStorage.setItem('user', JSON.stringify({ ...userData, ...editedData }));
        setIsEditing(false);
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BASE_URL}/user/logout`, {}, {
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
      const response = await axios.post(`${BASE_URL}/user/send-otp`, { email });
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
      const response = await axios.post(`${BASE_URL}/user/verify-otp`, { email, otp });
      if (response.data.message) {
        toast.success('OTP verified successfully');
        setShowOtpModal(false);
        setShowNewPasswordModal(true);
        setIsTimerRunning(false);
        setOtpError('');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Invalid OTP';
      setOtpError(errorMessage);
      setOtp('');
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
      const response = await axios.post(`${BASE_URL}/user/reset-password`, {
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

  const renderModal = (
    isOpen: boolean,
    onClose: () => void,
    title: string,
    content: React.ReactNode
  ) => (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={overlayVariants}
        >
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
              variants={modalVariants}
            >
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
              </div>
              {content}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const passwordModalContent = (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-center mb-4">
          <div className="rounded-full bg-blue-50 p-3">
            <FiMail className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <p className="text-center text-sm text-gray-600">
          We'll send a verification code to your email:<br />
          <span className="font-medium text-gray-800">{email}</span>
        </p>
      </div>
      <div className="flex justify-end gap-3">
        <button
          onClick={() => setShowPasswordModal(false)}
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
    </>
  );

  const otpModalContent = (
    <>
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
    </>
  );

  const newPasswordModalContent = (
    <>
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
    </>
  );

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
    <div className="flex items-center justify-center min-h-screen bg-gray-100 py-6 font-inter">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8 mx-4"
      >
        <div className="flex justify-between items-center mb-8 border-b pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full"
              >
                <Avatar
                  name={`${userData?.firstname} ${userData?.lastname}`}
                  size="64"
                  round={true}
                  color="#6366F1"
                  textSizeRatio={2}
                />
              </motion.div>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">
                {userData?.firstname} {userData?.lastname}
              </h1>
            </div>
          </div>
          <div className="flex gap-3">
            {!isEditing && (
              <>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleEdit}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <motion.div variants={iconVariants}>
                    <FiEdit2 size={14} />
                  </motion.div>
                  Edit
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleForgotPassword}
                  className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-600 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <motion.div variants={iconVariants}>
                    <FiLock size={14} />
                  </motion.div>
                  Password
                </motion.button>
              </>
            )}
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <motion.div variants={iconVariants}>
                <FiLogOut size={14} />
              </motion.div>
              Logout
            </motion.button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <motion.div whileHover={{ scale: 1.01 }} className="group">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FiUser className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                First Name
              </label>
              {isEditing ? (
                <motion.input
                  variants={inputVariants}
                  whileFocus="focus"
                  type="text"
                  name="firstname"
                  value={editedData.firstname || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              ) : (
                <p className="text-gray-800 text-sm py-2.5 px-4 bg-gray-50 rounded-lg">{userData.firstname}</p>
              )}
            </motion.div>

            <motion.div whileHover={{ scale: 1.01 }} className="group">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FiUser className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                Last Name
              </label>
              {isEditing ? (
                <motion.input
                  variants={inputVariants}
                  whileFocus="focus"
                  type="text"
                  name="lastname"
                  value={editedData.lastname || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              ) : (
                <p className="text-gray-800 text-sm py-2.5 px-4 bg-gray-50 rounded-lg">{userData.lastname}</p>
              )}
            </motion.div>

            <motion.div whileHover={{ scale: 1.01 }} className="group">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FiMail className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                Email
              </label>
              {isEditing ? (
                <motion.input
                  variants={inputVariants}
                  whileFocus="focus"
                  type="email"
                  name="email"
                  value={editedData.email || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              ) : (
                <p className="text-gray-800 text-sm py-2.5 px-4 bg-gray-50 rounded-lg">{userData.email}</p>
              )}
            </motion.div>

            <motion.div whileHover={{ scale: 1.01 }} className="group">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FiPhone className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                Phone Number
              </label>
              {isEditing ? (
                <motion.input
                  variants={inputVariants}
                  whileFocus="focus"
                  type="text"
                  name="phoneNumber"
                  value={editedData.phoneNumber || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              ) : (
                <p className="text-gray-800 text-sm py-2.5 px-4 bg-gray-50 rounded-lg">{userData.phoneNumber}</p>
              )}
            </motion.div>

            <motion.div whileHover={{ scale: 1.01 }} className="group">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FiAtSign className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                Username
              </label>
              <p className="text-gray-800 text-sm py-2.5 px-4 bg-gray-50 rounded-lg">{userData.username}</p>
            </motion.div>

            {userData.department && (
              <motion.div whileHover={{ scale: 1.01 }} className="group">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FiBriefcase className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  Department
                </label>
                <p className="text-gray-800 text-sm py-2.5 px-4 bg-gray-50 rounded-lg">{userData.department.departmentName}</p>
              </motion.div>
            )}

            {userData.subrole && (
              <motion.div whileHover={{ scale: 1.01 }} className="group">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FiUsers className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  Sub Role
                </label>
                <p className="text-gray-800 text-sm py-2.5 px-4 bg-gray-50 rounded-lg capitalize">{userData.subrole}</p>
              </motion.div>
            )}
          </div>

          {isEditing && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-end gap-3 mt-8 pt-6 border-t"
            >
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditedData(userData);
                }}
                className="px-6 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200"
              >
                Cancel
              </motion.button>
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                type="submit"
                className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Save Changes
              </motion.button>
            </motion.div>
          )}
        </form>

        {/* Password Reset Button */}
        {/* {!isEditing && (
          <div className="mt-8 pt-4 border-t">
            <div className="flex flex-col items-center justify-center">
              <p className="text-sm text-gray-600 mb-3">Want to change your password?</p>
              <button
                onClick={handleForgotPassword}
                className="flex items-center gap-2 bg-white border-2 border-amber-500 text-amber-600 px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors duration-200 group"
              >
                <FiLock className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span>Forgot Password?</span>
              </button>
            </div>
          </div>
        )} */}

        {/* Modals */}
        {renderModal(
          showPasswordModal,
          () => setShowPasswordModal(false),
          "Reset Password",
          passwordModalContent
        )}

        {renderModal(
          showOtpModal,
          () => {
            setShowOtpModal(false);
            setIsTimerRunning(false);
            setOtp('');
            setOtpError('');
          },
          "Enter Verification Code",
          otpModalContent
        )}

        {renderModal(
          showNewPasswordModal,
          () => {
            setShowNewPasswordModal(false);
            setNewPassword('');
            setConfirmPassword('');
            setPasswordError('');
          },
          "Set New Password",
          newPasswordModalContent
        )}
      </motion.div>
    </div>
  );
};

export default Profile;
 