import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import Layout from '../Layout/Layout';
import { motion } from 'framer-motion';

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
  const [showPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Base URLs for API endpoints
  const API_BASE_URL = 'http://localhost:5006/api/admin';
  const API_URL = `${API_BASE_URL}/all`;
  const REGISTER_API_URL = `${API_BASE_URL}/register`;
  const UPDATE_API_URL = `${API_BASE_URL}/edit`;

  // Store the admin being edited
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(API_URL);
      if (response.data.success) {
        setAdmins(response.data.data);
      } else {
        console.error("Failed to fetch admins", response.data.message);
      }
    } catch (err) {
      console.error("API Error:", err);
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
        try {
          setIsLoading(true);
          const response = await axios.post(REGISTER_API_URL, formData);
          if (response.data.success) {
            // Reset form
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
            
            // Refresh admins list
            fetchAdmins();
            
            // Show success message
            alert('Admin registered successfully');
          } else {
            alert(response.data.message);
          }
        } catch (error) {
          console.error('Registration Error:', error);
          alert('Error registering admin');
        } finally {
          setIsLoading(false);
        }
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

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this admin?")) return;

    setIsLoading(true);
    
    try {
      const response = await axios.delete(`${API_BASE_URL}/${id}`);
      
      if (response.status === 200) {
        alert("Admin deleted successfully!");
        await fetchAdmins(); // Refresh the admin list
      }
    } catch (error: any) {
      console.error("Error deleting admin:", error);
      
      let errorMessage = "Failed to delete admin.";
      if (error.response?.data?.message) {
        errorMessage = `${error.response.data.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
    try {
      setIsLoading(true);
      
      // Prepare update data - exclude empty fields
      const updateData = {
        firstname: formData.firstName.trim() || undefined,
        lastname: formData.lastName.trim() || undefined,
        phoneNumber: formData.mobileNumber.trim() || undefined,
        username: formData.username.trim() || undefined,
        email: formData.email.trim() || undefined,
        password: formData.password.trim() || undefined,
        confirmPassword: formData.confirmPassword.trim() || undefined
      };
      
      // Remove undefined values
      const filteredData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );

      // Only make API call if there's data to update
      if (Object.keys(filteredData).length > 0) {
        const response = await axios.put(`${UPDATE_API_URL}/${editingAdmin.id}`, filteredData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (response.data.success) {
          // Update local state
          setAdmins(prevAdmins => 
            prevAdmins.map(admin => 
              admin.id === editingAdmin.id ? { ...admin, ...filteredData } : admin
            )
          );
          
          // Reset form and editing state
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
          
          // Show success message
          alert('Admin updated successfully');
        } else {
          alert('Failed to update admin');
        }
      } else {
        alert('No changes made to update');
      }
    } catch (error) {
      console.error('Error updating admin:', error);
      alert('Error updating admin');
    } finally {
      setIsLoading(false);
    }
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
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">First Name</label>
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
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">Last Name</label>
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
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">Mobile Number</label>
                <input
                  type="text"
                  name="mobileNumber"
                  placeholder="Mobile Number"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  minLength={10}
                  disabled={isLoading}
                  className="w-full p-2 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
                {errors.mobileNumber && <div className="text-red-500 text-xs mt-1">{errors.mobileNumber}</div>}
              </div>
              
              <div className="form-group">
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">Email</label>
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
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">Username</label>
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
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full p-2 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
                {errors.password && <div className="text-red-500 text-xs mt-1">{errors.password}</div>}
              </div>
              
              <div className="form-group">
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">Confirm Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full p-2 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
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
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100">{admin.createdAt}</td>
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
                            className={`text-red-500 hover:text-red-600 transition-colors duration-200 ${
                              isLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            onClick={() => handleDelete(admin.id)}
                            disabled={isLoading}
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
            <p className="text-sm text-gray-600 text-center py-4">No admins found.</p>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default AdminRegister;