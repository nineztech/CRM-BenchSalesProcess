import React, { useState, useEffect } from 'react';
import Layout from '../../common/layout/Layout';
import { FaEdit, FaPlus, FaUserCheck, FaUserTimes } from 'react-icons/fa';
import { motion } from 'framer-motion';
import axios, { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DepartmentRolesPopup from './DepartmentRolesPopup';
import usePermissions from '../../../hooks/usePermissions';

// Add the styles
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

interface Department {
  id: number;
  departmentName: string;
  subroles: string[];
  isSalesTeam: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: number;
  creator: {
    firstname: string;
    lastname: string;
    email: string;
  };
  updater: {
    firstname: string;
    lastname: string;
    email: string;
  };
}

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

const AddDepartment: React.FC = () => {
  const navigate = useNavigate();
  const { checkPermission } = usePermissions();
  const [departmentName, setDepartmentName] = useState('');
  const [subroles, setSubroles] = useState<string[]>([]);
  const [isSalesTeam, setIsSalesTeam] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRole, setCurrentRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [salesTeamExists, setSalesTeamExists] = useState(false);
  const [existingSalesTeamDept, setExistingSalesTeamDept] = useState<{id: number, departmentName: string} | null>(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [showRolesPopup, setShowRolesPopup] = useState(false);
  const [savedDepartment, setSavedDepartment] = useState<{ id: number; name: string } | null>(null);

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
    checkSalesTeamExists();
  }, [navigate]);

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get('/department/all');
      
      if (response.data.success) {
        console.log('Departments response:', response.data.data);
        setDepartments(response.data.data);
        setSalesTeamExists(response.data.data.some((dept: Department) => dept.isSalesTeam));
        setExistingSalesTeamDept(response.data.data.find((dept: Department) => dept.isSalesTeam) as {id: number, departmentName: string} | null);
      } else {
        console.error("Failed to fetch departments", response.data.message);
        toast.error('Failed to fetch departments');
      }
    } catch (error) {
      console.error("API Error:", error);
      const axiosError = error as AxiosError;
      if (axiosError.response?.status !== 401) {
        toast.error('Error fetching departments');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const checkSalesTeamExists = async () => {
    try {
      const response = await axiosInstance.get('/department/check/sales-team');
      if (response.data.success) {
        setSalesTeamExists(response.data.data.exists);
        setExistingSalesTeamDept(response.data.data.department);
      }
    } catch (error: unknown) {
      console.error('Error checking sales team existence:', error);
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
      toast.error('Please enter a department name');
      return;
    }

    if (subroles.length === 0) {
      toast.error('Please add at least one role');
      return;
    }

    // Check if trying to create a new sales team when one already exists
    if (!editingDepartment && isSalesTeam && salesTeamExists) {
      alert('A sales team department already exists. Only one sales team department is allowed.');
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        departmentName: departmentName.trim(),
        subroles: subroles,
        isSalesTeam: isSalesTeam
      };

      if (editingDepartment) {
        await axiosInstance.put(`/department/${editingDepartment.id}`, payload);
        toast.success('Department updated successfully');
      } else {
        const response = await axiosInstance.post('/department/add', payload);
        if (response.data.success) {
          setSavedDepartment({
            id: response.data.data.id,
            name: departmentName.trim()
          });
          setShowRolesPopup(true);
        }
      }

      setDepartmentName('');
      setSubroles([]);
      setIsSalesTeam(false);
      setEditingDepartment(null);
      fetchDepartments();
      checkSalesTeamExists();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (dept: Department) => {
    setEditingDepartment(dept);
    setDepartmentName(dept.departmentName);
    setSubroles(dept.subroles || []);
    setIsSalesTeam(dept.isSalesTeam);
    
    // If editing the existing sales team department, update the state
    if (dept.isSalesTeam) {
      setSalesTeamExists(true);
      setExistingSalesTeamDept({ id: dept.id, departmentName: dept.departmentName });
    }
  };

  // const handleDelete = async (id: number) => {
  //   toast.promise(
  //     axiosInstance.delete(`/department/${id}`),
  //     {
  //       loading: 'Deleting department...',
  //       success: () => {
  //         fetchDepartments();
  //         return 'Department deleted successfully';
  //       },
  //       error: (err: any) => err.response?.data?.message || 'Failed to delete department'
  //     }
  //   );
  // };

  const handleStatusUpdate = async (id: number, status: string) => {
    const newStatus = status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    
    setConfirmDialog({
      isOpen: true,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Department`,
      message: `Are you sure you want to ${action} this department?`,
      onConfirm: async () => {
        try {
          setIsLoading(true);
          await axiosInstance.patch(`/department/${id}/status`, { status: newStatus });
          toast.success(`Department ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
          fetchDepartments();
        } catch (error) {
          console.error('Error updating department status:', error);
          toast.error('Failed to update department status');
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const filteredDepartments = departments.filter(dept =>
    dept.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.creator?.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.creator?.lastname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <style>{tooltipStyles}</style>
      <div className="flex flex-col gap-5 max-w-[98%]">
        {/* Form Container */}
        {checkPermission('Department Management', 'add') && (
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
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                    Add Roles <span className="text-red-500">*</span>
                  </label>
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
                  <span className="text-xs text-gray-500 mt-1 block">Minimum one role is required</span>
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

              <div className="form-group flex flex-row gap-2">
                  <input
                     type="checkbox"
                     checked={isSalesTeam}
                     onChange={(e) => setIsSalesTeam(e.target.checked)}
                     className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 "
                     disabled={isLoading || (salesTeamExists && !editingDepartment?.isSalesTeam)}
                   />
                     <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1.5">
                  
                    Is Sales Team
                  </label>
                  {salesTeamExists && !editingDepartment?.isSalesTeam && (
                    <span className="text-xs text-red-500 ml-2">
                      (Sales team already exists: {existingSalesTeamDept?.departmentName})
                    </span>
                  )}
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
                    setIsSalesTeam(false);
                    setEditingDepartment(null);
                    checkSalesTeamExists();
                  }}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium rounded-md text-white bg-red-500 hover:bg-red-600 transition-colors duration-200 disabled:bg-gray-400"
                >
                  Cancel
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}

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
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left w-[5%]">#</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left w-[12%]">Department Name</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left w-[12%]">Roles</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left w-[8%]">Is Sales Team</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left w-[10%]">Created By</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left w-[15%]">Created At</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left w-[10%]">Updated By</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left w-[15%]">Updated At</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-left w-[8%]">Status</th>
                    <th className="p-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 text-center w-[5%]">Actions</th>
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
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100 w-[5%] align-top">{index + 1}</td>
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100 w-[12%] align-top">{dept.departmentName}</td>
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100 w-[12%] align-top">
                        <div className="flex flex-wrap gap-1">
                          {dept.subroles?.map((subrole, i) => (
                            <span key={i} className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                              {subrole}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100 w-[8%] align-top">
                        {dept.isSalesTeam ? 'Yes' : 'No'}
                      </td>
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100 w-[10%] align-top">
                        {dept.creator ? `${dept.creator.firstname} ${dept.creator.lastname}` : 'N/A'}
                      </td>
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100 w-[15%] align-top whitespace-nowrap">
                        {dept.createdAt ? new Date(dept.createdAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        }) : 'N/A'}
                      </td>
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100 w-[10%] align-top">
                        {dept.updater ? `${dept.updater.firstname} ${dept.updater.lastname}` : '-'}
                      </td>
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100 w-[15%] align-top whitespace-nowrap">
                        {dept.updatedAt ? new Date(dept.updatedAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        }) : 'N/A'}
                      </td>
                      <td className="p-2.5 text-sm text-gray-600 border-b border-gray-100 status-cell relative w-[8%] align-top">
                        <span 
                          className={`px-2 py-1 rounded-full text-xs ${
                            dept.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {dept.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-sm border-b border-gray-100 w-[5%] align-top">
                        <div className="flex gap-3 justify-center">
                          {checkPermission('Department Management', 'edit') && (
                            <motion.button
                              whileHover={{ scale: dept.status === 'active' ? 1.1 : 1 }}
                              whileTap={{ scale: dept.status === 'active' ? 0.9 : 1 }}
                              onClick={() => dept.status === 'active' && handleEdit(dept)}
                              disabled={isLoading || dept.status !== 'active'}
                              className={`text-blue-600 transition-colors duration-200 ${
                                isLoading || dept.status !== 'active' ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-700'
                              }`}
                              title={dept.status !== 'active' ? 'Cannot edit inactive department' : ''}
                            >
                              <FaEdit size={16} />
                            </motion.button>
                          )}
                          {checkPermission('Department Management', 'delete') && (
                            dept.status === 'active' ? (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleStatusUpdate(dept.id, dept.status)}
                                disabled={isLoading}
                                className="text-red-500 hover:text-red-600 transition-colors duration-200 disabled:opacity-50"
                                title="Deactivate Department"
                              >
                                <FaUserTimes size={16} />
                              </motion.button>
                            ) : (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleStatusUpdate(dept.id, dept.status)}
                                disabled={isLoading}
                                className="text-green-500 hover:text-green-600 transition-colors duration-200 disabled:opacity-50"
                                title="Activate Department"
                              >
                                <FaUserCheck size={16} />
                              </motion.button>
                            )
                          )}
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

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
        />

        {/* Add the DepartmentRolesPopup */}
        {savedDepartment && (
          <DepartmentRolesPopup
            isOpen={showRolesPopup}
            onClose={() => {
              setShowRolesPopup(false);
              setSavedDepartment(null);
            }}
            departmentId={savedDepartment.id}
            departmentName={savedDepartment.name}
          />
        )}
      </div>
    </Layout>
  );
};

export default AddDepartment;