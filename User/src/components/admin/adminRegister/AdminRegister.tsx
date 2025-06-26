import React, { useState, useEffect } from 'react';
import { FaEdit, } from 'react-icons/fa';
import { FaUserCheck, FaUserXmark } from "react-icons/fa6";
import axios from 'axios';
import Layout from '../../common/layout/Layout';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

// Confirmation Dialog Component
const ConfirmationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
      >
        <h3 className="text-lg font-medium text-gray-900 mb-3">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  );
};

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
  const [admins, setAdmins] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Base URLs for API endpoints
  const API_BASE_URL=import.meta.env.VITE_API_URL || "http://localhost:5006/api"
  const API_URL = `${API_BASE_URL}/admin/all`;
  const REGISTER_API_URL = `${API_BASE_URL}/admin/register`;
  const UPDATE_API_URL = `${API_BASE_URL}/admin`;

  // Store the admin being edited
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Authentication token not found. Please login again.');
        return;
      }

      setIsLoading(true);
      const response = await axios.get(API_URL, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setAdmins(response.data.data);
      } else {
        console.error("Failed to fetch admins", response.data.message);
        toast.error(response.data.message || 'Failed to fetch admins');
      }
    } catch (error: any) {
      console.error("API Error:", error);
      toast.error(error.response?.data?.message || 'Error fetching admins');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    let errorMsg = "";
    if (!value.trim()) {
      errorMsg = "This field is required";
    } else if (name === "mobileNumber" && (!/^\d{10,}$/.test(value) || value.length < 10)) {
      errorMsg = "Phone number must be at least 10 digits";
    } else if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errorMsg = "Enter a valid email address";
    } else if (name === "confirmPassword" && value !== formData.password) {
      errorMsg = "Passwords do not match";
    } else if (name === "password" && value.length < 6) {
      errorMsg = "Password must be at least 6 characters long";
    }

    setErrors({ ...errors, [name]: errorMsg });
  };

  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, mobileNumber: value });
    if (errors.mobileNumber) {
      setErrors({ ...errors, mobileNumber: '' });
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!formData.mobileNumber.trim()) {
      errors.mobileNumber = 'Mobile number is required';
    }

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    }

    // Only validate password fields if they are being updated
    if (formData.password.trim() || formData.confirmPassword.trim()) {
      if (!formData.password.trim()) {
        errors.password = 'Password is required';
      }

      if (!formData.confirmPassword.trim()) {
        errors.confirmPassword = 'Confirm password is required';
      }

      if (formData.password.trim() && formData.password.trim() !== formData.confirmPassword.trim()) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      if (editingAdmin) {
        // Update existing admin
        updateAdmin();
      } else {
        // Create new admin
        const payload = {
          email: formData.email,
          password: formData.password,
          firstname: formData.firstName,
          lastname: formData.lastName,
          phoneNumber: formData.mobileNumber,
          username: formData.username
        };

        toast.promise(
          axios.post(REGISTER_API_URL, payload),
          {
            loading: 'Creating admin...',
            success: (response) => {
              if (response.data.success || response.status === 201) {
                setFormData({
                  firstName: "",
                  lastName: "",
                  mobileNumber: "",
                  username: "",
                  email: "",
                  password: "",
                  confirmPassword: ""
                });
                setErrors({});
                fetchAdmins();
                return 'Admin registered successfully';
              }
              throw new Error(response.data.message || 'Failed to register admin');
            },
            error: (err) => err.response?.data?.message || 'Error registering admin'
          }
        );
      }
    }
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
    setEditingAdmin(null);
  };

  // const handleDelete = async (id: number) => {
  //   if (window.confirm('Are you sure you want to deactivate this admin?')) {
  //     const token = localStorage.getItem('token');
      
  //     if (!token) {
  //       toast.error('Authentication token not found. Please login again.');
  //       return;
  //     }

  //     toast.promise(
  //       axios.delete(`${API_BASE_URL}/admin/${id}`, {
  //         headers: {
  //           'Authorization': `Bearer ${token}`
  //         }
  //       }),
  //       {
  //         loading: 'Deactivating admin...',
  //         success: () => {
  //           fetchAdmins();
  //           return 'Admin deactivated successfully!';
  //         },
  //         error: (err) => err.response?.data?.message || 'Failed to deactivate admin'
  //       }
  //     );
  //   }
  // };

  const handleEdit = (admin: any) => {
    setEditingAdmin(admin);
    setFormData({
      firstName: admin.firstname,
      lastName: admin.lastname,
      mobileNumber: admin.phoneNumber,
      username: admin.username,
      email: admin.email,
      password: '',
      confirmPassword: ''
    });
  };

  const updateAdmin = async () => {
    const updateData = {
      email: formData.email.trim() || undefined,
      firstname: formData.firstName.trim() || undefined,
      lastname: formData.lastName.trim() || undefined,
      phoneNumber: formData.mobileNumber.trim() || undefined,
      username: formData.username.trim() || undefined,
      password: formData.password.trim() || undefined,
      confirmPassword: formData.confirmPassword.trim() || undefined
    };

    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(filteredData).length > 0) {
      toast.promise(
        axios.put(`${UPDATE_API_URL}/${editingAdmin.id}`, filteredData, {
          headers: {
            'Content-Type': 'application/json'
          }
        }),
        {
          loading: 'Updating admin...',
          success: (response) => {
            if (response.data.success) {
              setAdmins(prevAdmins =>
                prevAdmins.map(admin =>
                  admin.id === editingAdmin.id ? { ...admin, ...filteredData } : admin
                )
              );
              setEditingAdmin(null);
              setFormData({
                firstName: "",
                lastName: "",
                mobileNumber: "",
                username: "",
                email: "",
                password: "",
                confirmPassword: ""
              });
              return 'Admin updated successfully';
            }
            throw new Error('Failed to update admin');
          },
          error: (err) => err.response?.data?.message || 'Error updating admin'
        }
      );
    } else {
      toast.error('No changes made to update');
    }
  };

  const handleStatusChange = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    
    setConfirmDialog({
      isOpen: true,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Admin`,
      message: `Are you sure you want to ${action} this admin?`,
      onConfirm: async () => {
        const token = localStorage.getItem('token');
        
        if (!token) {
          toast.error('Authentication token not found. Please login again.');
          return;
        }

        const message = newStatus === 'active' ? 'Activating' : 'Deactivating';
        
        toast.promise(
          axios.patch(`${API_BASE_URL}/admin/${id}/status`, 
            { status: newStatus },
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          ),
          {
            loading: `${message} admin...`,
            success: () => {
              fetchAdmins();
              return `Admin ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`;
            },
            error: (err) => err.response?.data?.message || `Failed to ${newStatus} admin`
          }
        );
      }
    });
  };

  const filteredAdmins = admins.filter((admin) => {
    const search = searchTerm.toLowerCase();
    return (
      (admin.firstname?.toLowerCase() || '').includes(search) ||
      (admin.lastname?.toLowerCase() || '').includes(search) ||
      (admin.phoneNumber?.toLowerCase() || '').includes(search) ||
      (admin.username?.toLowerCase() || '').includes(search) ||
      (admin.email?.toLowerCase() || '').includes(search)
    );
  });

  return (
    <Layout>
      <div className="flex flex-col gap-5 max-w-[98%]">
        {/* Form Container */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow duration-300"
        >
          {/* Title and Buttons in one row */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-medium text-gray-800">
              {editingAdmin ? "Edit Admin" : "Admin Registration"}
            </h2>
            
            <div className="flex gap-3">  
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium border-none cursor-pointer rounded-md text-white transition-colors duration-200 ${
                  isLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? "Processing..." : (editingAdmin ? "Update" : "Save")}
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="reset"
                onClick={handleReset}
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium border-none cursor-pointer rounded-md text-white transition-colors duration-200 ${
                  isLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                Discard
              </motion.button>
            </div>
          </div>
          
          <div className="flex flex-col space-y-6">
            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="form-group">
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full p-2 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
                {errors.firstName && <div className="text-red-500 text-xs mt-1">{errors.firstName}</div>}
              </div>
              
              <div className="form-group">
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full p-2 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
                {errors.lastName && <div className="text-red-500 text-xs mt-1">{errors.lastName}</div>}
              </div>
              
              <div className="form-group">
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="max-w-[180px]">
                  <PhoneInput
                    country={'us'}
                    value={formData.mobileNumber}
                    onChange={handlePhoneChange}
                    inputClass={` p-2 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed`}
                    disabled={isLoading}
                  />
                </div>
                {errors.mobileNumber && <div className="text-red-500 text-xs mt-1">{errors.mobileNumber}</div>}
              </div>
              
              <div className="form-group">
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Email ID"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full p-2 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
                {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
              </div>
            </div>

            <h3 className="text-lg font-medium text-gray-800 pt-2">Admin Credentials</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="form-group">
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={!!editingAdmin || isLoading}
                  className="w-full p-2 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
                {errors.username && <div className="text-red-500 text-xs mt-1">{errors.username}</div>}
              </div>
              
              <div className="form-group">
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                    className="w-full p-2 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed pr-10"
                />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && <div className="text-red-500 text-xs mt-1">{errors.password}</div>}
              </div>
              
              <div className="form-group">
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                <input
                    type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                    className="w-full p-2 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed pr-10"
                />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.confirmPassword && <div className="text-red-500 text-xs mt-1">{errors.confirmPassword}</div>}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search Container */}
        <div className="flex mb-4">
          <motion.input
            whileFocus={{ scale: 1.01 }}
            type="text"
            placeholder="Search admins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 w-64 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
          />
        </div>

        {/* Table Container */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm"
        >
          <h3 className="text-lg font-medium text-gray-800 mb-4">Registered Admins</h3>
          {isLoading ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600">Loading...</p>
            </div>
          ) : filteredAdmins.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">ID</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">First Name</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">Last Name</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">Mobile</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">Username</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">Email</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">Status</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">Created At</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmins.map((admin, index) => (
                    <motion.tr 
                      key={admin.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`hover:bg-gray-50 transition-colors duration-150`}
                    >
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100">{admin.id}</td>
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100">{admin.firstname}</td>
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100">{admin.lastname}</td>
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100">{admin.phoneNumber}</td>
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100">{admin.username}</td>
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100">{admin.email}</td>
                      <td className="p-2.5 text-sm border-b border-gray-100">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          admin.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {admin.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100">
                        {admin.createdAt ? new Date(admin.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false
                        }).replace(',', '') : ''}
                      </td>
                      <td className="p-2.5 text-sm border-b border-gray-100">
                        <div className="flex gap-3 justify-center">
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`text-blue-600 hover:text-blue-700 transition-colors duration-200 ${
                              isLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            onClick={() => handleEdit(admin)}
                            disabled={isLoading}
                          >
                            <FaEdit size={16} />
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`transition-colors duration-200 ${
                              admin.status === 'active' 
                                ? 'text-red-500 hover:text-red-600'
                                : 'text-green-500 hover:text-green-600'
                            } ${
                              isLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            onClick={() => handleStatusChange(admin.id, admin.status)}
                            disabled={isLoading}
                            title={admin.status === 'active' ? 'Deactivate admin' : 'Activate admin'}
                          >
                            {admin.status === 'active' ? (
                              <FaUserXmark  size={16} />
                            ) : (
                              <FaUserCheck size={16} />
                            )}
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-600 text-center py-4">No admins found.</p>
          )}
        </motion.div>

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
        />
      </div>
    </Layout>
  );
};

export default AdminRegister;