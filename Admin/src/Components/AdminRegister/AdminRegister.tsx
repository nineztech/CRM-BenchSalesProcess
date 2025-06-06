import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
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

  useEffect(() => {
    // fetchAdmins(); // Commented out for demo
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/all');
      const data = await response.json();
      setAdmins(data);
    } catch (err) {
      console.error("Failed to fetch admins", err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

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

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (!value.trim()) newErrors[key] = "This field is required";
    });

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const method = editingAdminId ? 'PUT' : 'POST';
      const url = editingAdminId
        ? `http://localhost:5000/api/admin/${editingAdminId}`
        : 'http://localhost:5000/api/admin/register';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        alert(editingAdminId ? "✅ Admin updated successfully!" : "✅ Admin registered successfully!");
        handleReset();
        fetchAdmins();
      } else {
        alert(`❌ Failed: ${result.message}`);
      }
    } catch (err) {
      alert("❌ Error connecting to server.");
      console.error(err);
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

    try {
      const response = await fetch(`http://localhost:5000/api/admin/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        fetchAdmins();
      } else {
        alert(`❌ Failed: ${result.message}`);
      }
    } catch (err) {
      console.error("Error deleting admin:", err);
      alert("❌ Server error");
    }
  };

  const handleEdit = (admin: any) => {
    setFormData({
      firstName: admin.first_name,
      lastName: admin.last_name,
      mobileNumber: admin.mobile_number,
      username: admin.username,
      email: admin.email,
      password: admin.password || "password123", // Show actual value in edit mode
      confirmPassword: admin.password || "password123",
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
          <div className="border-2 border-gray-100 rounded-lg p-5 bg-white shadow-lg">
            {/* Title and Buttons in one row */}
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-2xl">
                {editingAdminId ? "Edit Admin" : "Admin Registration"}
              </h2>
              
              <div className="flex gap-2.5">  
                <button 
                  type="submit"
                  onClick={handleSubmit}
                  className="px-5 py-2.5 w-25 border-none cursor-pointer rounded-full bg-slate-600 text-white hover:bg-slate-700"
                >
                  {editingAdminId ? "Update" : "Save"}
                </button>
                <button 
                  type="reset"
                  onClick={handleReset}
                  className="px-5 py-2.5 w-25 border-none cursor-pointer rounded-full bg-red-600 text-white hover:bg-red-700"
                >
                  Discard
                </button>
              </div>
            </div>
            
            <div className="flex flex-col">
              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="form-group">
                  <label className="text-gray-600 font-medium text-left block mb-1">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name "
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none"
                  />
                  {errors.firstName && <div className="text-red-500 text-xs mt-1">{errors.firstName}</div>}
                </div>
                
                <div className="form-group">
                  <label className="text-gray-600 font-medium  text-left  block mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name "
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none"
                  />
                  {errors.lastName && <div className="text-red-500 text-xs mt-1">{errors.lastName}</div>}
                </div>
                
                <div className="form-group">
                  <label className="text-gray-600 font-medium text-left  block mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    name="mobileNumber"
                    placeholder="Mobile Number "
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    maxLength={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none"
                  />
                  {errors.mobileNumber && <div className="text-red-500 text-xs mt-1">{errors.mobileNumber}</div>}
                </div>
                
                <div className="form-group">
                  <label className="text-gray-600 font-medium text-left  block mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email ID *"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none"
                  />
                  {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
                </div>
              </div>

              <h2 className="text-2xl mb-5 text-left">Admin Credentials</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="form-group">
                  <label className="text-gray-600 font-medium text-left block mb-1 ">User Name *</label>
                  <input
                    type="text"
                    name="username"
                    placeholder="Username "
                    value={formData.username}
                    onChange={handleChange}
                    disabled={editingAdminId !== null}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none"
                  />
                  {errors.username && <div className="text-red-500 text-xs mt-1">{errors.username}</div>}
                </div>
                
                <div className="form-group">
                  <label className="text-gray-600 font-medium text-left  block mb-1">Password *</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password "
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none"
                  />
                  {errors.password && <div className="text-red-500 text-xs mt-1">{errors.password}</div>}
                </div>
                
                <div className="form-group">
                  <label className="text-gray-600 font-medium text-left  block mb-1 ">Confirm Password *</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm Password "
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none"
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
            className="p-2.5 w-60 rounded-lg border border-gray-300 outline-none text-sm focus:border-slate-500"
          />
        </div>

        {/* Table Container */}
        <div className="w-[120%] border-2 border-gray-100 rounded-lg p-5 bg-white shadow-lg">
          <h3 className="text-2xl mb-5 text-gray-800 text-left">Registered Admins</h3>
          {filteredAdmins.length > 0 ? (
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
                          className="bg-transparent border-none cursor-pointer text-base mr-1 text-gray-800 hover:text-blue-600"
                          onClick={() => handleEdit(admin)}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="bg-transparent border-none cursor-pointer text-base mr-1 text-red-600 hover:text-red-800"
                          onClick={() => handleDelete(admin.id)}
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