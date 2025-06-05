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
  const [admins, setAdmins] = useState<any[]>([
    // Sample data for demonstration
    {
      id: 1,
      first_name: "John",
      last_name: "Doe",
      mobile_number: "1234567890",
      username: "johndoe",
      email: "john@example.com",
      created_at: "2025-01-15"
    },
    {
      id: 2,
      first_name: "Jane",
      last_name: "Smith",
      mobile_number: "0987654321",
      username: "janesmith",
      email: "jane@example.com",
      created_at: "2025-01-16"
    }
  ]);
  const [editingAdminId, setEditingAdminId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Base URLs for API endpoints
  const API_BASE_URL = 'http://localhost:5000/api/admin';
  const REGISTER_API_URL = 'http://localhost:5006/api/admin/register';

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/all`);
      setAdmins(response.data);
    } catch (err) {
      console.error("Failed to fetch admins", err);
      // Keep sample data if API fails
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
    const newErrors: { [key: string]: string } = {};
    
    // Check required fields
    Object.entries(formData).forEach(([key, value]) => {
      if (!value.trim()) {
        newErrors[key] = "This field is required";
      }
    });

    // Validate mobile number (matching backend validation)
    if (formData.mobileNumber && (!/^\d{10,}$/.test(formData.mobileNumber) || formData.mobileNumber.length < 10)) {
      newErrors.mobileNumber = "Phone number must be at least 10 digits";
    }

    // Validate email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    // Validate password
    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    // Check password match
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();

    const validationErrors = validateForm();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Prepare data for API (matching backend field names)
      const apiData = {
        firstname: formData.firstName,
        lastname: formData.lastName,
        phoneNumber: formData.mobileNumber,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      };

      let response;
      
      if (editingAdminId) {
        // Update existing admin
        response = await axios.put(`${API_BASE_URL}/${editingAdminId}`, apiData, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } else {
        // Register new admin
        response = await axios.post(REGISTER_API_URL, apiData, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      // Success handling
      if (response.status === 200 || response.status === 201) {
        alert(editingAdminId ? "✅ Admin updated successfully!" : "✅ Admin registered successfully!");
        handleReset();
        await fetchAdmins(); // Refresh the admin list
      }

    } catch (error: any) {
      console.error('API Error:', error);
      
      let errorMessage = "❌ An error occurred. Please try again.";
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 400) {
          // Handle validation errors from backend
          if (data.errors && Array.isArray(data.errors)) {
            // Sequelize validation errors
            const backendErrors: { [key: string]: string } = {};
            data.errors.forEach((err: any) => {
              // Map backend field names to frontend field names
              const fieldMap: { [key: string]: string } = {
                'firstname': 'firstName',
                'lastname': 'lastName', 
                'phoneNumber': 'mobileNumber'
              };
              const frontendField = fieldMap[err.field] || err.field;
              backendErrors[frontendField] = err.message;
            });
            setErrors(backendErrors);
            return; // Don't show alert for validation errors
          } else {
            errorMessage = `❌ ${data.message || 'Invalid data provided'}`;
          }
        } else if (status === 409) {
          errorMessage = `❌ ${data.message || 'Username or email already exists'}`;
        } else if (status === 500) {
          errorMessage = "❌ Server error. Please try again later.";
        } else {
          errorMessage = `❌ ${data.message || 'Something went wrong'}`;
        }
      } else if (error.request) {
        // Network error
        errorMessage = "❌ Network error. Please check your connection and try again.";
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
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
    setEditingAdminId(null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this admin?")) return;

    setIsLoading(true);
    
    try {
      const response = await axios.delete(`${API_BASE_URL}/${id}`);
      
      if (response.status === 200) {
        alert("✅ Admin deleted successfully!");
        await fetchAdmins(); // Refresh the admin list
      }
    } catch (error: any) {
      console.error("Error deleting admin:", error);
      
      let errorMessage = "❌ Failed to delete admin.";
      if (error.response?.data?.message) {
        errorMessage = `❌ ${error.response.data.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (admin: any) => {
    setFormData({
      firstName: admin.first_name || admin.firstname,
      lastName: admin.last_name || admin.lastname,
      mobileNumber: admin.mobile_number || admin.phoneNumber,
      username: admin.username,
      email: admin.email,
      password: "", // Don't pre-fill password for security
      confirmPassword: "",
    });
    setEditingAdminId(admin.id);
    setErrors({});
  };

  const filteredAdmins = admins.filter((admin) => {
    const search = searchTerm.toLowerCase();
    return (
      admin.first_name.toLowerCase().includes(search) ||
      admin.last_name.toLowerCase().includes(search) ||
      admin.mobile_number.toLowerCase().includes(search) ||
      admin.username.toLowerCase().includes(search) ||
      admin.email.toLowerCase().includes(search)
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
                {editingAdminId ? "Edit Admin" : "Admin Registration"}
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
                  {isLoading ? "Processing..." : (editingAdminId ? "Update" : "Save")}
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
                    disabled={editingAdminId !== null || isLoading}
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
                    <td className="p-3 border border-gray-300 text-center text-sm">{admin.first_name}</td>
                    <td className="p-3 border border-gray-300 text-center text-sm">{admin.last_name}</td>
                    <td className="p-3 border border-gray-300 text-center text-sm">{admin.mobile_number}</td>
                    <td className="p-3 border border-gray-300 text-center text-sm">{admin.username}</td>
                    <td className="p-3 border border-gray-300 text-center text-sm">{admin.email}</td>
                    <td className="p-3 border border-gray-300 text-center text-sm">{admin.created_at}</td>
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