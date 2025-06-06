import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import Sidebar from '../Sidebar/Sidebar';

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
    <div className="min-h-screen ">
      {/* Sidebar placeholder */}
      <div className=" left-0 top-10 mt-10 bg-slate-800"><Sidebar/></div>
      
      {/* Main content with left margin for sidebar */}
      <div className="mr-28">
        {/* Form Container */}
        <div className="w-[120%] mx-auto mt-10 ml-[10] flex flex-col gap-8">
          <div className="border-2 border-gray-300 rounded-lg p-5 bg-white shadow-lg">
            {/* Title and Buttons in one row */}
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-2xl">
                {editingAdmin ? "Edit Admin" : "Admin Registration"}
              </h2>
              
              <div className="flex gap-2.5">  
                <button 
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className={`px-5 py-2.5 w-25 border-none cursor-pointer rounded-full text-white ${
                    isLoading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-slate-600 hover:bg-slate-700'
                  }`}
                >
                  {isLoading ? "Processing..." : (editingAdmin ? "Update" : "Save")}
                </button>
                <button 
                  type="reset"
                  onClick={handleReset}
                  disabled={isLoading}
                  className={`px-5 py-2.5 w-25 border-none cursor-pointer rounded-full text-white ${
                    isLoading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Discard
                </button>
              </div>
            </div>
            
            <div className="flex flex-col">
              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="form-group">
                  <label className="text-gray-600 text-xs text-left ml-3 block mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name *"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-[90%] p-2 rounded border border-gray-300 focus:outline-none focus:border-slate-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  {errors.firstName && <div className="text-red-500 text-xs mt-1">{errors.firstName}</div>}
                </div>
                
                <div className="form-group">
                  <label className="text-gray-600 text-xs text-left ml-3 block mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name *"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-[90%] p-2 rounded border border-gray-300 focus:outline-none focus:border-slate-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  {errors.lastName && <div className="text-red-500 text-xs mt-1">{errors.lastName}</div>}
                </div>
                
                <div className="form-group">
                  <label className="text-gray-600 text-xs text-left ml-3 block mb-1">Mobile Number</label>
                  <input
                    type="text"
                    name="mobileNumber"
                    placeholder="Mobile Number *"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    minLength={10}
                    disabled={isLoading}
                    className="w-[90%] p-2 rounded border border-gray-300 focus:outline-none focus:border-slate-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  {errors.mobileNumber && <div className="text-red-500 text-xs mt-1">{errors.mobileNumber}</div>}
                </div>
                
                <div className="form-group">
                  <label className="text-gray-600 text-xs text-left ml-3 block mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email ID *"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-[90%] p-2 rounded border border-gray-300 focus:outline-none focus:border-slate-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
                </div>
              </div>

              <h2 className="text-2xl mb-5 text-left">Admin Credentials</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="form-group">
                  <label className="text-gray-600 text-xs text-left ml-3 block mb-1 ">User Name</label>
                  <input
                    type="text"
                    name="username"
                    placeholder="Username *"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={!!editingAdmin || isLoading}
                    className="w-[90%] p-2 rounded border border-gray-300 focus:outline-none focus:border-slate-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  {errors.username && <div className="text-red-500 text-xs mt-1">{errors.username}</div>}
                </div>
                
                <div className="form-group">
                  <label className="text-gray-600 text-xs text-left ml-3 block mb-1">Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password *"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-[90%] p-2 rounded border border-gray-300 focus:outline-none focus:border-slate-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  {errors.password && <div className="text-red-500 text-xs mt-1">{errors.password}</div>}
                </div>
                
                <div className="form-group">
                  <label className="text-gray-600 text-xs text-left ml-3 block mb-1">Confirm Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm Password *"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-[90%] p-2 rounded border border-gray-300 focus:outline-none focus:border-slate-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  {errors.confirmPassword && <div className="text-red-500 text-xs mt-1">{errors.confirmPassword}</div>}
                </div>
                
                <div className="form-group">
                  {/* Empty div for grid alignment */}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Container */}
        <div className="flex  mb-10  mt-5 justify-start">
          <input
            type="text"
            placeholder="Search Here..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading}
            className="p-2.5 w-60 rounded-lg border border-gray-300 outline-none text-sm focus:border-slate-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Table Container */}
        <div className="w-[120%] border-2 border-gray-300 rounded-lg p-5 bg-white shadow-lg">
          <h3 className="text-2xl mb-5 text-gray-800 text-left">Registered Admins</h3>
          {isLoading ? (
            <div className="text-center py-4">
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : filteredAdmins.length > 0 ? (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-3 border border-gray-300 text-center text-sm bg-gray-100 font-semibold text-gray-800">ID</th>
                  <th className="p-3 border border-gray-300 text-center text-sm bg-gray-100 font-semibold text-gray-800">First Name</th>
                  <th className="p-3 border border-gray-300 text-center text-sm bg-gray-100 font-semibold text-gray-800">Last Name</th>
                  <th className="p-3 border border-gray-300 text-center text-sm bg-gray-100 font-semibold text-gray-800">Mobile</th>
                  <th className="p-3 border border-gray-300 text-center text-sm bg-gray-100 font-semibold text-gray-800">Username</th>
                  <th className="p-3 border border-gray-300 text-center text-sm bg-gray-100 font-semibold text-gray-800">Email</th>
                  <th className="p-3 border border-gray-300 text-center text-sm bg-gray-100 font-semibold text-gray-800">Created At</th>
                  <th className="p-3 border border-gray-300 text-center text-sm bg-gray-100 font-semibold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map((admin, index) => (
                  <tr key={admin.id} className={index % 2 === 1 ? "bg-gray-50" : ""}>
                    <td className="p-3 border border-gray-300 text-center text-sm">{admin.id}</td>
                    <td className="p-3 border border-gray-300 text-center text-sm">{admin.firstname}</td>
                    <td className="p-3 border border-gray-300 text-center text-sm">{admin.lastname}</td>
                    <td className="p-3 border border-gray-300 text-center text-sm">{admin.phoneNumber}</td>
                    <td className="p-3 border border-gray-300 text-center text-sm">{admin.username}</td>
                    <td className="p-3 border border-gray-300 text-center text-sm">{admin.email}</td>
                    <td className="p-3 border border-gray-300 text-center text-sm">{admin.createdAt}</td>
                    <td className="p-3 border border-gray-300 text-center text-sm">
                      <div className="flex gap-2 justify-center">
                        <button 
                          className={`bg-transparent border-none cursor-pointer text-base mr-1 ${
                            isLoading ? 'text-gray-400 cursor-not-allowed' : 'text-gray-800 hover:text-blue-600'
                          }`}
                          onClick={() => handleEdit(admin)}
                          disabled={isLoading}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className={`bg-transparent border-none cursor-pointer text-base mr-1 ${
                            isLoading ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-800'
                          }`}
                          onClick={() => handleDelete(admin.id)}
                          disabled={isLoading}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-600">No admins found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;