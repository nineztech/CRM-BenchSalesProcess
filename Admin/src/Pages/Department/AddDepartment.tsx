import React, { useState, useEffect } from 'react';
import Layout from '../../Components/Layout/Layout';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { motion } from 'framer-motion';
import axios, { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';

interface Department {
  id: number;
  departmentName: string;
  subroles: string[];
  status: string;
  createdAt: string;
  creator: {
    firstname: string;
    lastname: string;
    email: string;
  };
}

const AddDepartment: React.FC = () => {
  const navigate = useNavigate();
  const [departmentName, setDepartmentName] = useState('');
  const [subroles, setSubroles] = useState<string[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRole, setCurrentRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

 const API_BASE_URL=import.meta.env.VITE_API_URL|| "http://localhost:5006/api"

  // Create axios instance with default config
  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Add request interceptor to add token
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor to handle 401 errors
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    fetchDepartments();
  }, [navigate]);

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get('/department/all');
      if (response.data.success) {
        setDepartments(response.data.data);
      }
    } catch (error: unknown) {
      console.error('Error fetching departments:', error);
      const axiosError = error as AxiosError;
      if (axiosError.response?.status !== 401) {
        alert('Failed to fetch departments');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubrole = () => {
    if (currentRole.trim()) {
      setSubroles([...subroles, currentRole.trim()]);
      setCurrentRole('');
    }
  };

  const handleRemoveSubrole = (index: number) => {
    setSubroles(subroles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentName.trim()) {
      alert('Please enter a department name');
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        departmentName: departmentName.trim(),
        subroles: subroles
      };

      if (editingDepartment) {
        await axiosInstance.put(`/department/${editingDepartment.id}`, payload);
      } else {
        await axiosInstance.post('/department/add', payload);
      }

      setDepartmentName('');
      setSubroles([]);
      setEditingDepartment(null);
      fetchDepartments();
      alert(editingDepartment ? 'Department updated successfully' : 'Department created successfully');
    } catch (error) {
      console.error('Error:', error);
      alert('Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (dept: Department) => {
    setEditingDepartment(dept);
    setDepartmentName(dept.departmentName);
    setSubroles(dept.subroles || []);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;

    try {
      setIsLoading(true);
      await axiosInstance.delete(`/department/${id}`);
      fetchDepartments();
      alert('Department deleted successfully');
    } catch (error) {
      console.error('Error:', error);
      alert('Delete operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.creator?.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.creator?.lastname.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-medium text-gray-800">
              {editingDepartment ? "Edit Department" : "Add Department"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  placeholder="Enter department name"
                  className="w-full p-2 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">Add Roles</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentRole}
                    onChange={(e) => setCurrentRole(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && currentRole.trim()) {
                        e.preventDefault();
                        setSubroles([...subroles, currentRole.trim()]);
                        setCurrentRole('');
                      }
                    }}
                    placeholder="Enter subrole"
                    className="flex-1 p-2 text-sm rounded-md border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
                    disabled={isLoading}
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleAddSubrole}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400"
                  >
                    <FaPlus />
                  </motion.button>
                </div>
                {subroles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 p-2 bg-gray-50 rounded-md border border-gray-100">
                    {subroles.map((subrole, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full text-sm shadow-sm border border-gray-200"
                      >
                        <span className="text-gray-700">{subrole}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubrole(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          ×
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium rounded-md text-white transition-colors duration-200 ${
                  isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? 'Processing...' : (editingDepartment ? 'Update' : 'Save')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => {
                  setDepartmentName('');
                  setSubroles([]);
                  setEditingDepartment(null);
                }}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium rounded-md text-white bg-red-500 hover:bg-red-600 transition-colors duration-200 disabled:bg-gray-400"
              >
                Cancel
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* Search Container */}
        <div className="flex mb-4">
          <motion.input
            whileFocus={{ scale: 1.01 }}
            type="text"
            placeholder="Search departments..."
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
          <h3 className="text-lg font-medium text-gray-800 mb-4">Departments List</h3>
          
          {isLoading ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600">Loading...</p>
            </div>
          ) : filteredDepartments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">Department Name</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">Roles</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">Created By</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left">Created At</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDepartments.map((dept, index) => (
                    <motion.tr 
                      key={dept.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100">{dept.departmentName}</td>
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100">
                        <div className="flex flex-wrap gap-1">
                          {dept.subroles?.map((subrole, i) => (
                            <span key={i} className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                              {subrole}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100">
                        {dept.creator ? `${dept.creator.firstname} ${dept.creator.lastname}` : 'N/A'}
                      </td>
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100">
                        {new Date(dept.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-2.5 text-sm border-b border-gray-100">
                        <div className="flex gap-3 justify-center">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEdit(dept)}
                            disabled={isLoading}
                            className="text-blue-600 hover:text-blue-700 transition-colors duration-200 disabled:opacity-50"
                          >
                            <FaEdit size={16} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(dept.id)}
                            disabled={isLoading}
                            className="text-red-500 hover:text-red-600 transition-colors duration-200 disabled:opacity-50"
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
            <p className="text-sm text-gray-600 text-center py-4">No departments found.</p>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default AddDepartment;