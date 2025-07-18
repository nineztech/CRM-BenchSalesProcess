import React, { useState, useEffect } from 'react';
import { FaEdit } from 'react-icons/fa';
import { FaUserCheck, FaUserXmark } from 'react-icons/fa6';
import Layout from '../../common/layout/Layout';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import SpecialUserRolesPopup from './SpecialUserRolesPopup';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import usePermissions from '../../../hooks/usePermissions';
const API_BASE_URL=import.meta.env.VITE_API_URL|| "http://localhost:5006/api"

// Add the tooltip styles
const tooltipStyles = `
  .status-tooltip {
    visibility: hidden;
    position: fixed;
    background-color: white;
    border: 1px solid #e2e8f0;
    border-radius: 0.375rem;
    padding: 0.75rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    opacity: 0;
    z-index: 9999;
    min-width: max-content;
    transition: all 0.2s ease-in-out;
  }

  .status-cell {
    position: relative;
  }

  .status-cell:hover .status-tooltip {
    visibility: visible;
    opacity: 1;
  }

  .tooltip-content {
    white-space: nowrap;
    text-align: left;
  }
`;

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

const UserRegister: React.FC = () => {
  const { checkPermission, loading: permissionsLoading } = usePermissions();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    department: "",
    subrole: "",
    mobileNumber: "",
    usphonenumber: "",
    linkedin: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    designation: "",
    is_special: false
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [users, setUsers] = useState<any[]>([]);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [subroles, setSubroles] = useState<string[]>([]);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [showSpecialUserPopup, setShowSpecialUserPopup] = useState(false);
  const [newUserId, setNewUserId] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Authentication token not found. Please login again.');
        return;
      }

      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/user/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log(response)
      setUsers(response.data.data.users || []);
    } catch (error: any) {
      console.error('Fetch error:', error);
      toast.error(error.response?.data?.message || 'Error fetching users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/department/all`);
      if (response.data.success) {
        setDepartments(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchRoles = async (departmentId: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/department/${departmentId}`);
      if (response.data.success) {
        const department = response.data.data;
        if (department && Array.isArray(department.subroles)) {
          setSubroles(department.subroles);
        } else {
          setSubroles([]);
        }
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
      setSubroles([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
   

    // If department is changed, fetch subroles
    if (name === 'department') {
      const selectedDepartment = departments.find(dept => String(dept.id) === value);
      if (selectedDepartment) {
        fetchRoles(selectedDepartment.id);
      } else {
        setSubroles([]);
      }
      // Reset subrole when department changes
      setFormData(prev => ({ ...prev, [name]: value, subrole: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    let errorMsg = "";
    if (!value.trim() && name !== 'linkedin' && name !== 'usphonenumber') {
      errorMsg = "This field is required";
    } else if (name === "mobileNumber" && !/^\d{10}$/.test(value)) {
      errorMsg = "Enter a valid 10-digit mobile number";
    } else if (name === "confirmPassword" && value !== formData.password) {
      errorMsg = "Passwords do not match";
    } else if (name === "linkedin" && value.trim() !== "") {
      try {
        new URL(value);
      } catch (e) {
        errorMsg = "Please enter a valid URL";
      }
    }

    setErrors({ ...errors, [name]: errorMsg });
  };

  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, mobileNumber: value });
    if (errors.mobileNumber) {
      setErrors({ ...errors, mobileNumber: '' });
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Authentication token not found. Please login again.');
        return;
      }

      setIsLoading(true);
      const userData = {
        email: formData.email,
        password: formData.password,
        firstname: formData.firstName,
        lastname: formData.lastName,
        departmentId: Number(formData.department),
        subrole: formData.subrole,
        phoneNumber: formData.mobileNumber,
        usphonenumber: formData.usphonenumber || null,
        linkedin: formData.linkedin || null,
        username: formData.username,
        designation: formData.designation,
        is_special: formData.is_special
      } as { [key: string]: any };

      // For edit, only send password if it's been changed
      if (editingUserId) {
        if (!userData.password) {
          delete userData.password;
        }
        // Only include these fields if they have values
        if (!userData.usphonenumber) delete userData.usphonenumber;
        if (!userData.linkedin) delete userData.linkedin;
      }

      if (editingUserId) {
        await toast.promise(
          axios.put(`${API_BASE_URL}/user/${editingUserId}`, userData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          {
            loading: 'Updating user...',
            success: () => {
              handleReset();
              fetchUsers();
              return 'User updated successfully!';
            },
            error: (err) => err.response?.data?.message || 'Failed to update user'
          }
        );
      } else {
        await toast.promise(
          axios.post(`${API_BASE_URL}/user/register`, userData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          {
            loading: 'Creating user...',
            success: (response) => {
              if (formData.is_special) {
                setNewUserId(response.data.data.user.id);
                setShowSpecialUserPopup(true);
              } else {
                handleReset();
              }
              fetchUsers();
              const message = response.data.data.emailSent 
                ? 'User created successfully and welcome email sent!'
                : 'User created successfully but failed to send welcome email.';
              return message;
            },
            error: (err) => err.response?.data?.message || 'Failed to create user'
          }
        );
      }
    } catch (err: any) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      firstName: "",
      lastName: "",
      department: "",
      subrole: "",
      mobileNumber: "",
      usphonenumber: "",
      linkedin: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      designation: "",
      is_special: false
    });
    setErrors({});
    setEditingUserId(null);
  };

  // const handleDelete = async (id: number) => {
  //   if (window.confirm('Are you sure you want to deactivate this user?')) {
  //     const token = localStorage.getItem('token');
      
  //     if (!token) {
  //       toast.error('Authentication token not found. Please login again.');
  //       return;
  //     }

  //     toast.promise(
  //       axios.delete(`${API_BASE_URL}/user/${id}`, {
  //         headers: {
  //           'Authorization': `Bearer ${token}`
  //         }
  //       }),
  //       {
  //         loading: 'Deactivating user...',
  //         success: () => {
  //           fetchUsers();
  //           return 'User deactivated successfully!';
  //         },
  //         error: (err) => err.response?.data?.message || 'Failed to deactivate user'
  //       }
  //     );
  //   }
  // };

  const handleEdit = (user: any) => {
    setFormData({
      firstName: user.firstname || "",
      lastName: user.lastname || "",
      department: user.departmentId ? String(user.departmentId) : (typeof user.department === 'object' && user.department?.id ? String(user.department.id) : ""),
      subrole: user.subrole || "",
      mobileNumber: user.phoneNumber || "",
      usphonenumber: user.usphonenumber || "",
      linkedin: user.linkedin || "",
      username: user.username || "",
      email: user.email || "",
      password: "",
      confirmPassword: "",
      designation: user.designation || "",
      is_special: Boolean(user.is_special)
    });
    setEditingUserId(user.id);
    setErrors({});
  };

  const handleStatusChange = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    
    setConfirmDialog({
      isOpen: true,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      message: `Are you sure you want to ${action} this user?`,
      onConfirm: async () => {
        const token = localStorage.getItem('token');
        
        if (!token) {
          toast.error('Authentication token not found. Please login again.');
          return;
        }

        const message = newStatus === 'active' ? 'Activating' : 'Deactivating';
        
        toast.promise(
          axios.patch(`${API_BASE_URL}/user/${id}/status`, 
            { status: newStatus },
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          ),
          {
            loading: `${message} user...`,
            success: () => {
              fetchUsers();
              return `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`;
            },
            error: (err) => err.response?.data?.message || `Failed to ${action} user`
          }
        );
      }
    });
  };

  const handleSpecialUserPopupClose = () => {
    setShowSpecialUserPopup(false);
    handleReset();
  };

  const filteredUsers = Array.isArray(users) ? users.filter((user) => {
    const search = searchTerm.toLowerCase();
    return (
      user.firstname?.toLowerCase().includes(search) ||
      user.lastname?.toLowerCase().includes(search) ||
      user.department?.toLowerCase().includes(search) ||
      user.subrole?.toLowerCase().includes(search) ||
      user.phoneNumber?.toLowerCase().includes(search) ||
      user.username?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search)
    );
  }) : [];

  return (
    <Layout>
      <style>{tooltipStyles}</style>
      <div className="flex flex-col gap-5 max-w-[98%]">
        {/* Show loader while checking permissions */}
        {permissionsLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          </div>
        ) : (
          <>
            {/* Form Container - Only show if user has add permission */}
            {checkPermission('User Management', 'add') && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 w-full"
              >
                {/* Title and Buttons in one row */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-medium text-gray-800">
                    {editingUserId ? "Edit User" : "User Registration"}
                  </h2>
                  
                  <div className="flex gap-3">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                        type="submit"
                        onClick={handleSubmit}
                      disabled={isLoading}
                      className={`px-4 py-2 text-sm font-medium border-none cursor-pointer rounded-md text-white transition-colors duration-200 ${
                        isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                      >
                        {editingUserId ? "Update" : "Save"}
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                        type="reset"
                        onClick={handleReset}
                      disabled={isLoading}
                      className={`px-4 py-2 text-sm font-medium border-none cursor-pointer rounded-md text-white transition-colors duration-200 ${
                        isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'
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
                          className="w-full p-2 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
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
                          className="w-full p-2 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
                        />
                        {errors.lastName && <div className="text-red-500 text-xs mt-1">{errors.lastName}</div>}
                      </div>
                      
                      <div className="form-group">
                        <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                          Department <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          className="w-full p-2 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
                        >
                          <option value="">Select Department</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.departmentName}
                            </option>
                          ))}
                        </select>
                        {errors.department && <div className="text-red-500 text-xs mt-1">{errors.department}</div>}
                      </div>
                      
                      <div className="form-group">
                        <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                          Roles <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="subrole"
                          value={formData.subrole}
                          onChange={handleChange}
                          className="w-full p-2 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
                        >
                          <option value="">Select Roles</option>
                          {subroles.filter((role) => typeof role === 'string').map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        {errors.subrole && <div className="text-red-500 text-xs mt-1">{errors.subrole}</div>}
                      </div>
                    </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="form-group">
                        <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                          Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <div className="max-w-[180px]">
                          <PhoneInput
                            country={'us'}
                            value={formData.mobileNumber}
                            onChange={handlePhoneChange}
                            inputClass={`p-2 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed`}
                            disabled={isLoading}
                          />
                        </div>
                        {errors.mobileNumber && <div className="text-red-500 text-xs mt-1">{errors.mobileNumber}</div>}
                      </div>

                      <div className="form-group">
                        <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                          US Phone Number
                        </label>
                        <div className="max-w-[180px]">
                          <PhoneInput
                            country={'us'}
                            value={formData.usphonenumber}
                            onChange={(value) => setFormData(prev => ({ ...prev, usphonenumber: value }))}
                            inputClass={`p-2 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed`}
                            disabled={isLoading}
                          />
                        </div>
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
                          className="w-full p-2 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
                        />
                        {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
                      </div>

                      <div className="form-group">
                        <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                          LinkedIn URL
                        </label>
                        <input
                          type="url"
                          name="linkedin"
                          placeholder="Enter LinkedIn URL"
                          value={formData.linkedin}
                          onChange={handleChange}
                          className="w-full p-2 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
                        />
                        {errors.linkedin && <div className="text-red-500 text-xs mt-1">{errors.linkedin}</div>}
                      </div>
                  </div>

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
                          disabled={editingUserId !== null}
                          className="w-full p-2 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
                        />
                        {errors.username && <div className="text-red-500 text-xs mt-1">{errors.username}</div>}
                      </div>

                      <div className="form-group">
                        <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                          Designation <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="designation"
                          placeholder="Enter Designation"
                          value={formData.designation}
                          onChange={handleChange}
                          className="w-full p-2 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
                        />
                        {errors.designation && <div className="text-red-500 text-xs mt-1">{errors.designation}</div>}
                      </div>

                      <div className="form-group flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            name="is_special"
                            checked={formData.is_special}
                            onChange={(e) => setFormData(prev => ({ ...prev, is_special: e.target.checked }))}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-xs font-medium text-gray-600">Special User</span>
                        </label>
                      </div>
                  </div>

                  <h3 className="text-lg font-medium text-gray-800 pt-2">User Credentials</h3>
                    
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                            className="w-full p-2 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                          >
                            {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
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
                            className="w-full p-2 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                          >
                            {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                          </button>
                        </div>
                        {errors.confirmPassword && <div className="text-red-500 text-xs mt-1">{errors.confirmPassword}</div>}
                      </div>
                    </div>
                </div>
              </motion.div>
            )}

            {checkPermission('User Management', 'view') ? (
              <>
                {/* Search Container */}
                <div className="flex mb-4">
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="text"
                    placeholder="Search users..."
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
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Registered Users</h3>
                  {isLoading ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-600">Loading...</p>
                    </div>
                  ) : filteredUsers.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="p-1.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">#</th>
                            <th className="p-1.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">First Name</th>
                            <th className="p-1.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">Last Name</th>
                            <th className="p-1.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">Department</th>
                            <th className="p-1.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">Roles</th>
                            <th className="p-1.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">Mobile</th>
                            <th className="p-1.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">Username</th>
                            <th className="p-1.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">Email</th>
                            <th className="p-1.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">Designation</th>
                            <th className="p-1.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">US Phone</th>
                            <th className="p-1.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">LinkedIn</th>
                            <th className="p-1.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">Special</th>
                            <th className="p-1.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">Status</th>
                            <th className="p-1.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">Created At</th>
                            {(checkPermission('User Management', 'edit') || checkPermission('User Management', 'delete')) && (
                              <th className="p-1.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-center">Actions</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((user, index) => (
                            <motion.tr 
                              key={user.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className={`hover:bg-gray-50 transition-colors duration-150`}
                            >
                              <td className="p-1.5 text-sm text-start text-gray-600 border-b border-gray-100">{index + 1}</td>
                              <td className="p-1.5 text-sm text-start text-gray-600 border-b border-gray-100">{user.firstname}</td>
                              <td className="p-1.5 text-sm text-start text-gray-600 border-b border-gray-100">{user.lastname}</td>
                              <td className="p-1.5 text-sm text-start text-gray-600 border-b border-gray-100">{user.userDepartment?.departmentName || ''}</td>
                              <td className="p-1.5 text-sm text-start text-gray-600 border-b border-gray-100">{user.subrole || ''}</td>
                              <td className="p-1.5 text-sm text-start text-gray-600 border-b border-gray-100">{user.phoneNumber}</td>
                              <td className="p-1.5 text-sm text-start text-gray-600 border-b border-gray-100">{user.username}</td>
                              <td className="p-1.5 text-sm text-start text-gray-600 border-b border-gray-100">{user.email}</td>
                              <td className="p-1.5 text-sm text-start text-gray-600 border-b border-gray-100">{user.designation || ''}</td>
                              <td className="p-1.5 text-sm text-start text-gray-600 border-b border-gray-100">
                                {user.usphonenumber ? (
                                  <div className="max-w-[180px]">
                                    <PhoneInput
                                      country={'us'}
                                      value={user.usphonenumber}
                                      disabled={true}
                                      inputClass="!w-full !h-8 !text-sm !bg-transparent !border-none !cursor-default"
                                      containerClass="!w-full"
                                      buttonClass="!hidden"
                                    />
                                  </div>
                                ) : '-'}
                              </td>
                              <td className="p-1.5 text-sm text-start text-gray-600 border-b border-gray-100">
                                {user.linkedin ? (
                                  <a 
                                    href={user.linkedin} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                  >
                                    View Profile
                                  </a>
                                ) : '-'}
                              </td>
                              <td className="p-1.5 text-sm text-start text-gray-600 border-b border-gray-100">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.is_special 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {user.is_special ? 'Yes' : 'No'}
                                </span>
                              </td>
                              <td className="p-1.5 text-sm text-start border-b border-gray-100 status-cell relative">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.status === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}
                                onMouseEnter={(e) => {
                                  const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (tooltip) {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    tooltip.style.left = `${rect.left}px`;
                                    tooltip.style.top = `${rect.top - tooltip.offsetHeight - 5}px`;
                                  }
                                }}>
                                  {user.status}
                                </span>
                                <div className="status-tooltip">
                                  <div className="tooltip-content text-xs text-gray-800">
                                    <p className="mb-1">Updated By: {user.updater ? `${user.updater.firstname} ${user.updater.lastname}` : 'N/A'}</p>
                                    <p>Updated At: {user.updatedAt ? new Date(user.updatedAt).toLocaleString('en-US', {
                                      month: 'short',
                                      day: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true
                                    }) : 'N/A'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-1.5 text-sm text-start text-gray-600 border-b border-gray-100 whitespace-nowrap">
                                {user.createdAt ? new Date(user.createdAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                  hour12: false
                                }) : ''}
                              </td>
                              {(checkPermission('User Management', 'edit') || checkPermission('User Management', 'delete')) && (
                                <td className="p-2.5 text-start text-sm border-b border-gray-100">
                                  <div className="flex gap-3 justify-center">
                                    {checkPermission('User Management', 'edit') && (
                                      <motion.button 
                                        whileHover={{ scale: user.status === 'active' ? 1.1 : 1 }}
                                        whileTap={{ scale: user.status === 'active' ? 0.9 : 1 }}
                                        className={`text-blue-600 transition-colors duration-200 ${
                                          isLoading || user.status !== 'active' ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-700'
                                        }`}
                                        onClick={() => user.status === 'active' && handleEdit(user)}
                                        disabled={isLoading || user.status !== 'active'}
                                        title={user.status !== 'active' ? 'Cannot edit inactive user' : ''}
                                      >
                                        <FaEdit size={16} />
                                      </motion.button>
                                    )}
                                    {checkPermission('User Management', 'delete') && (
                                      <motion.button 
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className={`transition-colors duration-200 ${
                                          user.status === 'active' 
                                            ? 'text-red-500 hover:text-red-600'
                                            : 'text-green-500 hover:text-green-600'
                                        } ${
                                          isLoading ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                        onClick={() => handleStatusChange(user.id, user.status)}
                                        disabled={isLoading}
                                        title={user.status === 'active' ? 'Deactivate user' : 'Activate user'}
                                      >
                                        {user.status === 'active' ? (
                                          <FaUserXmark size={16} />
                                        ) : (
                                          <FaUserCheck size={16} />
                                        )}
                                      </motion.button>
                                    )}
                                  </div>
                                </td>
                              )}
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 text-center py-4">No users found.</p>
                  )}
                </motion.div>
              </>
            ) : (
              <div className="text-center p-4 bg-yellow-50 border-l-4 border-yellow-400">
                <p className="text-yellow-700">You don't have permission to view user information.</p>
              </div>
            )}

            {/* Add the SpecialUserRolesPopup */}
            <SpecialUserRolesPopup
              isOpen={showSpecialUserPopup}
              onClose={handleSpecialUserPopupClose}
              userName={`${formData.firstName} ${formData.lastName}`}
              userId={newUserId || 0}
              departmentId={Number(formData.department)}
              userRole={formData.subrole}
            />

            {/* Confirmation Dialog */}
            <ConfirmationDialog
              isOpen={confirmDialog.isOpen}
              onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
              onConfirm={confirmDialog.onConfirm}
              title={confirmDialog.title}
              message={confirmDialog.message}
            />
          </>
        )}
      </div>
    </Layout>
  );
};

export default UserRegister;