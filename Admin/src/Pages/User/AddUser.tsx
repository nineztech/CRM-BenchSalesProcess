import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import Layout from '../../Components/Layout/Layout';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
const API_BASE_URL=import.meta.env.VITE_API_URL|| "http://localhost:5006/api"

const UserRegister: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    department: "",
    subrole: "",
    mobileNumber: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [users, setUsers] = useState<any[]>([]);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [subroles, setSubroles] = useState<string[]>([]);

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
    if (!value.trim()) {
      errorMsg = "This field is required";
    } else if (name === "mobileNumber" && !/^\d{10}$/.test(value)) {
      errorMsg = "Enter a valid 10-digit mobile number";
    } else if (name === "confirmPassword" && value !== formData.password) {
      errorMsg = "Passwords do not match";
    }

    setErrors({ ...errors, [name]: errorMsg });
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
        username: formData.username
      };

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
            success: () => {
              handleReset();
              fetchUsers();
              return 'User created successfully!';
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
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setErrors({});
    setEditingUserId(null);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Authentication token not found. Please login again.');
        return;
      }

      toast.promise(
        axios.delete(`${API_BASE_URL}/user/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        {
          loading: 'Deactivating user...',
          success: () => {
            fetchUsers();
            return 'User deactivated successfully!';
          },
          error: (err) => err.response?.data?.message || 'Failed to deactivate user'
        }
      );
    }
  };

  const handleEdit = (user: any) => {
    setFormData({
      firstName: user.firstname || "",
      lastName: user.lastname || "",
      department: user.departmentId ? String(user.departmentId) : (typeof user.department === 'object' && user.department?.id ? String(user.department.id) : ""),
      subrole: user.subrole || "",
      mobileNumber: user.phoneNumber || "",
      username: user.username || "",
      email: user.email || "",
      password: "",
      confirmPassword: "",
    });
    setEditingUserId(user.id);
    setErrors({});
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
                  <input
                    type="text"
                    name="mobileNumber"
                    placeholder="Mobile Number"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    maxLength={10}
                    className="w-full p-2 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
                  />
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
                    className="w-full p-2 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
                  />
                  {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
                </div>
                </div>

            <h3 className="text-lg font-medium text-gray-800 pt-2">User Credentials</h3>
              
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
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full p-2 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
                  />
                  {errors.password && <div className="text-red-500 text-xs mt-1">{errors.password}</div>}
                </div>
                
                <div className="form-group">
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full p-2 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
                  />
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
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">ID</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">First Name</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">Last Name</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">Department</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">Roles</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">Mobile</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">Username</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">Email</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">Status</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">Created At</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-center">Actions</th>
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
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100">{user.id}</td>
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100">{user.firstname}</td>
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100">{user.lastname}</td>
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100">{typeof user.department === 'string' ? user.department : user.department?.departmentName || ''}</td>
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100">{user.subrole || ''}</td>
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100">{user.phoneNumber}</td>
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100">{user.username}</td>
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100">{user.email}</td>
                      <td className="p-2.5 text-sm border-b border-gray-100">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        }) : ''}
                      </td>
                      <td className="p-2.5 text-sm border-b border-gray-100">
                        <div className="flex gap-3 justify-center">
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`text-blue-600 hover:text-blue-700 transition-colors duration-200 ${
                              isLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          onClick={() => handleEdit(user)}
                            disabled={isLoading}
                        >
                            <FaEdit size={16} />
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`text-red-500 hover:text-red-600 transition-colors duration-200 ${
                              isLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          onClick={() => handleDelete(user.id)}
                            disabled={isLoading || user.status === 'inactive'}
                            title={user.status === 'inactive' ? 'User is already inactive' : 'Deactivate user'}
                        >
                            <FaTrash size={16} />
                          </motion.button>
                      </div>
                    </td>
                    </motion.tr>
                ))}
              </tbody>
            </table>
            </div>
          ) : (
            <p className="text-sm text-gray-600 text-center py-4">No users found.</p>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default UserRegister;