import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaGift, FaMoneyBillWave, FaUserGraduate, FaClock, FaCheck, FaStar } from 'react-icons/fa';
import axios, { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import Layout from '../../Components/Layout/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import Countdown from 'react-countdown';

interface Package {
  id: number;
  planName: string;
  enrollmentCharge: number;
  initialPrice:number;
  offerLetterCharge: number;
  firstYearSalaryPercentage: number;
  features: string[];
  discounts: {
    planName: string;
    name: string;
    percentage: number;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
  }[];
  status: string;
  createdAt: string;
  discountedPrice?: number;
}

interface FormData {
  planName: string;
  initialPrice: number;
  enrollmentCharge: number;
  offerLetterCharge: number;
  firstYearSalaryPercentage: number;
  features: string[];
  discounts: {
    planName: string;
    name: string;
    percentage: number;
  }[];
}

interface DiscountFormData {
  planName: string;
  name: string;
  percentage: number;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  discountIndex?: number;
}

// Add new interface for countdown renderer
interface CountdownRendererProps {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  completed: boolean;
}

// Countdown renderer component
const countdownRenderer = ({ days, hours, minutes, seconds, completed }: CountdownRendererProps) => {
  if (completed) {
    return <span className="text-red-600 font-medium">Expired</span>;
  }

  return (
    <div className="flex items-center gap-1 text-red-600 font-medium">
      {days > 0 && <span>{days}d</span>}
      {hours > 0 && <span>{hours}h</span>}
      <span>{minutes}m</span>
      <span>{seconds}s</span>
    </div>
  );
};

// Function to get the nearest discount end date
const getNearestDiscountEndDate = (discounts: Package['discounts']): Date | null => {
  if (!discounts || discounts.length === 0) return null;

  const now = new Date();
  let nearestEndDate: Date | null = null;
  let minDifference = Infinity;

  discounts.forEach(discount => {
    if (!discount.endDate || !discount.endTime) return;
    
    const endDate = new Date(`${discount.endDate}T${discount.endTime}`);
    if (isNaN(endDate.getTime())) return;
    
    const difference = endDate.getTime() - now.getTime();
    
    if (difference > 0 && difference < minDifference) {
      minDifference = difference;
      nearestEndDate = endDate;
    }
  });

  return nearestEndDate;
};

const CountdownTimer: React.FC<{ endDate: string; endTime: string }> = ({ endDate, endTime }) => {
  const endDateTime = new Date(`${endDate}T${endTime}`);
  
  const renderer = ({ days, hours, minutes, seconds, completed }: CountdownRendererProps) => {
    if (completed) {
      return <span className="text-xs font-medium text-orange-600">Expired</span>;
    }

    if (days > 0) {
      return <span className="text-xs font-medium text-orange-600">{days}d {hours}h</span>;
    }
    
    if (hours > 0) {
      return <span className="text-xs font-medium text-orange-600">{hours}h {minutes}m</span>;
    }
    
    return <span className="text-xs font-medium text-orange-600">{minutes}m {seconds}s</span>;
  };

  return (
    <Countdown
      date={endDateTime}
      renderer={renderer}
    />
  );
};

const PackagesPage: React.FC = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [formData, setFormData] = useState<FormData>({
    planName: '',
    initialPrice: 0,
    enrollmentCharge: 0,
    offerLetterCharge: 0,
    firstYearSalaryPercentage: 0,
    features: [],
    discounts: []
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [featureInput, setFeatureInput] = useState('');
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [discountFormData, setDiscountFormData] = useState<DiscountFormData>({
    planName: '',
    name: '',
    percentage: 0,
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: ''
  });
  const [isAnyCardHovered, setIsAnyCardHovered] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [isEditingDiscount, setIsEditingDiscount] = useState(false);

  const API_BASE_URL = 'http://localhost:5006/api/packages';

  // Create axios instance with default config
  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  // Add request interceptor to add token
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
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
      if (axiosError.response?.status === 401 || axiosError.response?.status === 400) {
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
    fetchPackages();
  }, [navigate]);

  // Color themes for different cards
  const colorThemes = [
    {
      gradient: 'from-blue-50 to-indigo-100',
      border: 'border-blue-200',
      accent: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700',
      icon: 'text-blue-500',
      hover: 'hover:shadow-blue-100'
    },
    {
      gradient: 'from-purple-50 to-pink-100',
      border: 'border-purple-200',
      accent: 'text-purple-600',
      button: 'bg-purple-600 hover:bg-purple-700',
      icon: 'text-purple-500',
      hover: 'hover:shadow-purple-100'
    },
    {
      gradient: 'from-emerald-50 to-teal-100',
      border: 'border-emerald-200',
      accent: 'text-emerald-600',
      button: 'bg-emerald-600 hover:bg-emerald-700',
      icon: 'text-emerald-500',
      hover: 'hover:shadow-emerald-100'
    }
  ];

  const fetchPackages = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get('/all');
      if (response.data.success) {
        setPackages(response.data.data);
        console.log(packages)
      }
    } catch (error: unknown) {
      console.error('Error fetching packages:', error);
      const axiosError = error as AxiosError;
      if (axiosError.response?.status !== 401) {
        alert('Failed to fetch packages');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Charge') || name === 'firstYearSalaryPercentage' ? Number(value) : value
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.planName.trim()) {
      newErrors.planName = 'Plan name is required';
    }
    
    if (formData.initialPrice === undefined || formData.initialPrice === null || formData.initialPrice <= 0) {
      newErrors.initialPrice = 'Initial price is required and must be greater than 0';
    }
    
    if (!formData.enrollmentCharge || formData.enrollmentCharge <= 0) {
      newErrors.enrollmentCharge = 'Valid enrollment charge is required';
    }
    
    if (!formData.offerLetterCharge || formData.offerLetterCharge <= 0) {
      newErrors.offerLetterCharge = 'Valid offer letter charge is required';
    }

    if (!formData.firstYearSalaryPercentage || formData.firstYearSalaryPercentage < 0 || formData.firstYearSalaryPercentage > 100) {
      newErrors.firstYearSalaryPercentage = 'First year salary percentage must be between 0 and 100';
    }
    
    if (formData.features.length === 0) {
      newErrors.features = 'At least one feature is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, featureInput.trim()]
      }));
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      console.log('Validation errors:', errors);
      return;
    }

    try {
      setIsLoading(true);
      
      const packageData = {
        ...formData,
        initialPrice: Number(formData.initialPrice),
        enrollmentCharge: Number(formData.enrollmentCharge),
        offerLetterCharge: Number(formData.offerLetterCharge),
        features: formData.features.map(feature => feature.trim()).filter(Boolean),
        discounts: formData.discounts.map(discount => ({
          ...discount,
          percentage: Number(discount.percentage)
        }))
      };

      if (editingPackage) {
        const response = await axiosInstance.put(`/${editingPackage.id}`, packageData);
        if (response.data.success) {
          console.log('Package updated successfully:', response.data);
          await fetchPackages();
          resetForm();
          alert('Package updated successfully');
        }
      } else {
        const response = await axiosInstance.post('/add', packageData);
        if (response.data.success) {
          console.log('Package created successfully:', response.data);
          await fetchPackages();
          resetForm();
          alert('Package created successfully');
        }
      }
    } catch (error) {
      console.error('Error submitting package:', error);
      if (axios.isAxiosError(error) && error.response?.data) {
        // Handle validation errors from the server
        if (error.response.data.errors) {
          const serverErrors = error.response.data.errors.reduce((acc: {[key: string]: string}, curr: any) => {
            acc[curr.field] = curr.message;
            return acc;
          }, {});
          setErrors(serverErrors);
        } else {
          setErrors({
            submit: error.response.data.message || 'Failed to submit package'
          });
          alert(error.response.data.message || 'Operation failed');
        }
      } else {
        setErrors({
          submit: 'An unexpected error occurred'
        });
        alert('Operation failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setFormData({
      planName: pkg.planName,
      initialPrice: pkg.initialPrice || 0,
      enrollmentCharge: pkg.enrollmentCharge,
      offerLetterCharge: pkg.offerLetterCharge,
      firstYearSalaryPercentage: pkg.firstYearSalaryPercentage,
      features: pkg.features,
      discounts: pkg.discounts
    });
    setSelectedPackageId(pkg.id);
    
    if (pkg.discounts && pkg.discounts.length > 0) {
      const firstDiscount = pkg.discounts[0];
      setDiscountFormData({
        planName: pkg.planName,
        name: '',
        percentage: 0,
        startDate: firstDiscount.startDate,
        startTime: firstDiscount.startTime,
        endDate: firstDiscount.endDate,
        endTime: firstDiscount.endTime
      });
    } else {
      setDiscountFormData({
        planName: pkg.planName,
        name: '',
        percentage: 0,
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: ''
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this package?')) return;
    try {
      setIsLoading(true);
      await axiosInstance.delete(`/${id}`);
      fetchPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      planName: '',
      initialPrice: 0,
      enrollmentCharge: 0,
      offerLetterCharge: 0,
      firstYearSalaryPercentage: 0,
      features: [],
      discounts: []
    });
    setEditingPackage(null);
    setErrors({});
    setFeatureInput('');
    setDiscountFormData({
      planName: '',
      name: '',
      percentage: 0,
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: ''
    });
    setShowDiscountForm(false);
    setSelectedPackageId(null);
  };

  const handleEditDiscount = (pkg: Package, discountIndex: number) => {
    const discount = pkg.discounts[discountIndex];
    setSelectedPackageId(pkg.id);
    setShowDiscountForm(true);
    setIsEditingDiscount(true);
    setDiscountFormData({
      planName: pkg.planName,
      name: discount.name,
      percentage: discount.percentage,
      startDate: discount.startDate,
      startTime: discount.startTime,
      endDate: discount.endDate,
      endTime: discount.endTime,
      discountIndex
    });
  };

  const handleAddDiscount = async () => {
    if (!discountFormData.planName || !discountFormData.name || discountFormData.percentage <= 0 || 
        !discountFormData.startDate || !discountFormData.startTime || 
        !discountFormData.endDate || !discountFormData.endTime) {
      setErrors({ submit: 'Please fill all discount fields' });
      return;
    }

    try {
      setIsLoading(true);
      const selectedPackage = packages.find(p => p.planName === discountFormData.planName);
      
      if (!selectedPackage) {
        setErrors({ submit: 'Selected package not found' });
        return;
      }

      if (isEditingDiscount && discountFormData.discountIndex !== undefined) {
        // Update existing discount
        const updatedDiscounts = [...selectedPackage.discounts];
        updatedDiscounts[discountFormData.discountIndex] = {
          ...updatedDiscounts[discountFormData.discountIndex],
          name: discountFormData.name,
          percentage: discountFormData.percentage
        };

        const response = await axiosInstance.put(`/${selectedPackage.id}`, {
          ...selectedPackage,
          discounts: updatedDiscounts
        });

        if (response.data.success) {
          await fetchPackages();
          resetDiscountForm();
          alert('Discount updated successfully');
        }
      } else {
        // Add new discount
        const response = await axiosInstance.post(`/${selectedPackage.id}/discounts`, discountFormData);
        
        if (response.data.success) {
          await fetchPackages();
          resetDiscountForm();
          alert('Discount added successfully');
        }
      }
    } catch (error) {
      console.error('Error handling discount:', error);
      if (axios.isAxiosError(error) && error.response?.data) {
        setErrors({
          submit: error.response.data.message || 'Failed to handle discount'
        });
      } else {
        setErrors({
          submit: 'An unexpected error occurred'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetDiscountForm = () => {
    setDiscountFormData({
      planName: '',
      name: '',
      percentage: 0,
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: ''
    });
    setShowDiscountForm(false);
    setIsEditingDiscount(false);
    setSelectedPackageId(null);
  };

  // Add back the package selection handler
  const handlePackageSelect = (packageId: number) => {
    setSelectedPackageId(packageId);
    const selectedPackage = packages.find(p => p.id === packageId);
    if (selectedPackage) {
      if (selectedPackage.discounts && selectedPackage.discounts.length > 0) {
        const firstDiscount = selectedPackage.discounts[0];
        setDiscountFormData(prev => ({
          ...prev,
          planName: selectedPackage.planName,
          startDate: firstDiscount.startDate,
          startTime: firstDiscount.startTime,
          endDate: firstDiscount.endDate,
          endTime: firstDiscount.endTime
        }));
      } else {
        setDiscountFormData(prev => ({
          ...prev,
          planName: selectedPackage.planName,
          startDate: '',
          startTime: '',
          endDate: '',
          endTime: ''
        }));
      }
    }
  };

  // Add back the helper function for date/time fields
  const shouldDisableDateTimeFields = (packageId: number | null): boolean => {
    if (!packageId) return false;
    const selectedPackage = packages.find(p => p.id === packageId);
    return Boolean(selectedPackage?.discounts && selectedPackage.discounts.length > 0);
  };

  return (
    <Layout>
      <div className="flex flex-col gap-8 max-w-[98%] p-6 font-inter">
        {/* Form Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-100 p-8"
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
              {editingPackage ? 'Edit Package' : 'Add New Package'}
            </h2>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl font-medium disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : editingPackage ? 'Update Package' : 'Save Package'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetForm}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
              >
                Cancel
              </motion.button>
            </div>
          </div>

          {/* Display any submit error */}
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errors.submit}
            </div>
          )}

          {/* Basic Fields Section */}
          <div className="grid grid-cols-4 gap-6">
            <div className="form-group">
              <label className="block text-xs font-semibold text-gray-700 mb-2">Plan Name</label>
              <input
                type="text"
                name="planName"
                value={formData.planName}
                onChange={handleInputChange}
                className={`w-full p-2.5 text-sm border ${errors.planName ? 'border-red-300 bg-red-50' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300`}
                placeholder="Enter plan name"
              />
              {errors.planName && (
                <p className="mt-1 text-xs text-red-500">{errors.planName}</p>
              )}
            </div>

            <div className="form-group">
              <label className="block text-xs font-semibold text-gray-700 mb-2">Initial Price <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="initialPrice"
                value={formData.initialPrice || ''}
                onChange={handleInputChange}
                className={`w-full p-2.5 text-sm border ${errors.initialPrice ? 'border-red-300 bg-red-50' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300`}
                placeholder="Enter initial price"
                min="0"
                required
              />
              {errors.initialPrice && (
                <p className="mt-1 text-xs text-red-500">{errors.initialPrice}</p>
              )}
            </div>

            <div className="form-group">
              <label className="block text-xs font-semibold text-gray-700 mb-2">Enrollment Charge</label>
              <input
                type="number"
                name="enrollmentCharge"
                value={formData.enrollmentCharge || ''}
                onChange={handleInputChange}
                className={`w-full p-2.5 text-sm border ${errors.enrollmentCharge ? 'border-red-300 bg-red-50' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300`}
                placeholder="Enter enrollment charge"
                min="0"
              />
              {errors.enrollmentCharge && (
                <p className="mt-1 text-xs text-red-500">{errors.enrollmentCharge}</p>
              )}
            </div>

            <div className="form-group">
              <label className="block text-xs font-semibold text-gray-700 mb-2">Offer Letter Charge</label>
              <input
                type="number"
                name="offerLetterCharge"
                value={formData.offerLetterCharge || ''}
                onChange={handleInputChange}
                className={`w-full p-2.5 text-sm border ${errors.offerLetterCharge ? 'border-red-300 bg-red-50' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300`}
                placeholder="Enter offer letter charge"
                min="0"
              />
              {errors.offerLetterCharge && (
                <p className="mt-1 text-xs text-red-500">{errors.offerLetterCharge}</p>
              )}
            </div>
          </div>

          {/* Features error message */}
          {errors.features && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errors.features}
            </div>
          )}

          {/* First Year Percentage and Features Section */}
          <div className="mt-6 flex items-center gap-4">
            <div className="form-group w-1/4">
              <label className="block text-xs font-semibold text-gray-700 mb-2">First Year Salary Percentage</label>
              <input
                type="number"
                name="firstYearSalaryPercentage"
                value={formData.firstYearSalaryPercentage || ''}
                onChange={handleInputChange}
                className={`w-full p-2.5 text-sm border ${errors.firstYearSalaryPercentage ? 'border-red-300 bg-red-50' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300`}
                placeholder="Enter first year salary percentage"
                min="0"
                max="100"
                step="0.01"
              />
              {errors.firstYearSalaryPercentage && (
                <p className="mt-1 text-xs text-red-500">{errors.firstYearSalaryPercentage}</p>
              )}
            </div>

            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-700 mb-2">Features</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  className="flex-1 p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  placeholder="Add a feature"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={addFeature}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg flex items-center gap-2"
                >
                  <FaCheck size={14} />
                  Add Feature
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDiscountForm(!showDiscountForm)}
                  disabled={!editingPackage && !selectedPackageId}
                  className={`px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-lg flex items-center gap-2 ${(!editingPackage && !selectedPackageId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <FaGift size={14} />
                  {showDiscountForm ? 'Hide Discount' : 'Add Discount'}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Features Display */}
          <div className="flex flex-wrap gap-3 mt-4">
            {formData.features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-2 rounded-full"
              >
                <span className="text-sm font-medium text-blue-800">{feature}</span>
                <button
                  onClick={() => removeFeature(index)}
                  className="text-blue-600 hover:text-blue-800 font-bold text-lg leading-none"
                >
                  ×
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Discount Form */}
        <AnimatePresence>
          {showDiscountForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6 bg-purple-50 rounded-xl p-6 border border-purple-100"
            >
              <h3 className="text-lg font-semibold text-purple-800 mb-4">Add New Discount</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Select Package</label>
                    <select
                      value={editingPackage ? editingPackage.id : selectedPackageId || ''}
                      onChange={(e) => {
                        if (editingPackage) return; // Prevent changes in edit mode
                        handlePackageSelect(Number(e.target.value));
                      }}
                      className={`w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${editingPackage ? 'bg-gray-100' : ''}`}
                      required
                      disabled={editingPackage !== null}
                    >
                      <option value="">Select a package</option>
                      {packages.map((pkg) => (
                        <option 
                          key={pkg.id} 
                          value={pkg.id}
                          disabled={editingPackage !== null && pkg.id !== editingPackage.id}
                        >
                          {pkg.planName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Discount Name</label>
                    <input
                      type="text"
                      value={discountFormData.name}
                      onChange={(e) => setDiscountFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter discount name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Percentage (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountFormData.percentage}
                      onChange={(e) => setDiscountFormData(prev => ({ ...prev, percentage: Number(e.target.value) }))}
                      className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter percentage"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="form-group">
                    <label className="block text-xs font-medium text-gray-600 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={discountFormData.startDate}
                      onChange={(e) => setDiscountFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                      disabled={shouldDisableDateTimeFields(selectedPackageId)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-xs font-medium text-gray-600 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={discountFormData.startTime}
                      onChange={(e) => setDiscountFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                      disabled={shouldDisableDateTimeFields(selectedPackageId)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-xs font-medium text-gray-600 mb-2">End Date</label>
                    <input
                      type="date"
                      value={discountFormData.endDate}
                      onChange={(e) => setDiscountFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                      disabled={shouldDisableDateTimeFields(selectedPackageId)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-xs font-medium text-gray-600 mb-2">End Time</label>
                    <input
                      type="time"
                      value={discountFormData.endTime}
                      onChange={(e) => setDiscountFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                      disabled={shouldDisableDateTimeFields(selectedPackageId)}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddDiscount}
                    disabled={isLoading}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg flex items-center gap-2"
                  >
                    {isLoading ? (
                      'Processing...'
                    ) : (
                      <>
                        <FaCheck size={14} />
                        {isEditingDiscount ? 'Update Discount' : 'Add Discount'}
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {packages.map((pkg, index) => {
              const theme = colorThemes[index % colorThemes.length];
              const nearestEndDate = getNearestDiscountEndDate(pkg.discounts);
              const hasActiveDiscount = nearestEndDate instanceof Date && nearestEndDate > new Date();
              
              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.1 }}
                  onHoverStart={() => setIsAnyCardHovered(true)}
                  onHoverEnd={() => setIsAnyCardHovered(false)}
                  className={`group relative bg-gradient-to-br ${theme.gradient} rounded-xl shadow-md ${theme.border} border overflow-hidden transition-all duration-700 ease-in-out ${isAnyCardHovered ? 'hover:scale-[1.02]' : ''}`}
                >
                  {/* Countdown Timer - Only show if there are active discounts */}
                  {hasActiveDiscount && nearestEndDate && (
                    <div className="absolute top-0 left-0 right-0 bg-red-50 border-b border-red-100 px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FaClock className="text-red-500" size={14} />
                        <Countdown
                          date={nearestEndDate}
                          renderer={countdownRenderer}
                        />
                        <span className="text-xs text-red-600 font-medium ml-1">until offer ends</span>
                      </div>
                      {pkg.discountedPrice && (
                        <span className="text-sm font-bold text-red-600">${pkg.discountedPrice}</span>
                      )}
                    </div>
                  )}

                  {/* Add margin top to card content if countdown is present */}
                  <div className={`p-5 ${hasActiveDiscount ? 'mt-12' : ''}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className={`text-lg font-bold ${theme.accent} mb-1 tracking-tight`}>
                          {pkg.planName}
                        </h3>
                        <div className="flex items-center gap-1">
                          <FaStar className={`${theme.icon} text-xs`} />
                          <span className="text-xs text-gray-600 font-medium">Premium Plan</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <motion.button
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(pkg)}
                          className={`p-1.5 ${theme.icon} hover:bg-white hover:shadow-sm rounded-lg transition-all duration-300`}
                        >
                          <FaEdit size={14} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1, rotate: -5 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(pkg.id)}
                          className="p-1.5 text-red-500 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-300"
                        >
                          <FaTrash size={14} />
                        </motion.button>
                      </div>
                    </div>

                    {/* Pricing Section - Always Visible */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between p-2.5 bg-white/60 backdrop-blur-sm rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 ${theme.icon} bg-white rounded-lg shadow-sm`}>
                            <FaMoneyBillWave size={12} />
                          </div>
                          <span className="font-medium text-gray-700 text-xs">Enrollment</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 line-through">${pkg.initialPrice}</span>
                          <span className={`font-bold ${theme.accent} text-sm`}>${pkg.enrollmentCharge}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-2.5 bg-white/60 backdrop-blur-sm rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 ${theme.icon} bg-white rounded-lg shadow-sm`}>
                            <FaGift size={12} />
                          </div>
                          <span className="font-medium text-gray-700 text-xs">Offer Letter</span>
                        </div>
                        <span className={`font-bold ${theme.accent} text-sm`}>${pkg.offerLetterCharge}</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-white/60 backdrop-blur-sm rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 ${theme.icon} bg-white rounded-lg shadow-sm`}>
                            <FaMoneyBillWave size={12} />
                          </div>
                          <span className="font-medium text-gray-700 text-xs">First Year Salary</span>
                        </div>
                        <span className={`font-bold ${theme.accent} text-sm`}>{pkg.firstYearSalaryPercentage}%</span>
                      </div>
                    </div>

                    {/* Features Section - Always Visible */}
                    {pkg.features && pkg.features.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <h4 className={`text-xs font-bold ${theme.accent} mb-2 flex items-center gap-2`}>
                          <FaUserGraduate size={12} />
                          Package Features
                        </h4>
                        <div className="space-y-1.5">
                          {pkg.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-white/80">
                              <div className={`p-1 ${theme.icon} bg-white rounded-lg shadow-sm`}>
                                <FaCheck size={10} />
                              </div>
                              <span className="text-xs font-medium text-gray-700">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Special Offers Section - Always Visible */}
                    {pkg.discounts.length > 0 && (
                      <div className="space-y-2">
                        <h4 className={`text-xs font-bold ${theme.accent} mb-2 flex items-center gap-2`}>
                          <FaClock size={12} />
                          Special Offers
                        </h4>
                        <div className="space-y-1.5">
                          {pkg.discounts.map((discount, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center justify-between p-2 bg-white/60 backdrop-blur-sm rounded-lg`}
                            >
                              <span className="text-sm font-medium text-gray-700">
                                {discount.name} ({discount.percentage}%) - {discount.planName}
                              </span>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleEditDiscount(pkg, idx)}
                                className="p-1.5 text-blue-500 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-300"
                              >
                                <FaEdit size={14} />
                              </motion.button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
};

export default PackagesPage;