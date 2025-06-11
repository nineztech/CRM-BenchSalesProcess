import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaGift, FaMoneyBillWave, FaUserGraduate, FaClock, FaCheck, FaStar } from 'react-icons/fa';
import axios from 'axios';
import Layout from '../../Components/Layout/Layout';
import { motion, AnimatePresence } from 'framer-motion';

interface Package {
  id: number;
  planName: string;
  enrollmentCharge: number;
  offerLetterCharge: number;
  features: string[];
  discounts: {
    type: string;
    description: string;
    percentage?: number;
    conditions?: string;
    installments?: {
      stage: string;
      amount: number;
    }[];
  }[];
  status: string;
  createdAt: string;
}

interface FormData {
  planName: string;
  enrollmentCharge: number;
  offerLetterCharge: number;
  features: string[];
  discounts: {
    type: string;
    description: string;
    percentage?: number;
    conditions?: string;
    installments?: {
      stage: string;
      amount: number;
    }[];
  }[];
}

const PackagesPage: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [formData, setFormData] = useState<FormData>({
    planName: '',
    enrollmentCharge: 0,
    offerLetterCharge: 0,
    features: [],
    discounts: []
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [featureInput, setFeatureInput] = useState('');
  const [discountType, setDiscountType] = useState('refund_policy');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [discountConditions, setDiscountConditions] = useState('');
  const [discountDescription, setDiscountDescription] = useState('');

  const API_BASE_URL = 'http://localhost:5006/api/packages';

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

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/all`);
      if (response.data.success) {
        setPackages(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
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
    try {
      setIsLoading(true);
      if (editingPackage) {
        await axios.put(`${API_BASE_URL}/${editingPackage.id}`, formData);
      } else {
        await axios.post(`${API_BASE_URL}/add`, formData);
      }
      fetchPackages();
      resetForm();
    } catch (error) {
      console.error('Error submitting package:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setFormData({
      planName: pkg.planName,
      enrollmentCharge: pkg.enrollmentCharge,
      offerLetterCharge: pkg.offerLetterCharge,
      features: pkg.features,
      discounts: pkg.discounts
    });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this package?')) return;
    try {
      setIsLoading(true);
      await axios.delete(`${API_BASE_URL}/${id}`);
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
      enrollmentCharge: 0,
      offerLetterCharge: 0,
      features: [],
      discounts: []
    });
    setEditingPackage(null);
    setErrors({});
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
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="form-group">
              <label className="block text-xs font-semibold text-gray-700 mb-2">Plan Name</label>
              <input
                type="text"
                name="planName"
                value={formData.planName}
                onChange={handleInputChange}
                className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter plan name"
              />
            </div>

            <div className="form-group">
              <label className="block text-xs font-semibold text-gray-700 mb-2">Enrollment Charge</label>
              <input
                type="number"
                name="enrollmentCharge"
                value={formData.enrollmentCharge}
                onChange={handleInputChange}
                className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter enrollment charge"
              />
            </div>

            <div className="form-group">
              <label className="block text-xs font-semibold text-gray-700 mb-2">Offer Letter Charge</label>
              <input
                type="number"
                name="offerLetterCharge"
                value={formData.offerLetterCharge}
                onChange={handleInputChange}
                className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter offer letter charge"
              />
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-6">
            <label className="block text-xs font-semibold text-gray-700 mb-2">Features</label>
            <div className="flex gap-3 mb-4">
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
                className="px-4 py-2 text-sm bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg"
              >
                Add Feature
              </motion.button>
            </div>
            <div className="flex flex-wrap gap-3">
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
          </div>

          {/* Discounts Section */}
          <div className="mt-6">
            <label className="block text-xs font-semibold text-gray-700 mb-2">Discounts</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="refund_policy">Refund Policy</option>
                  <option value="payment_schedule">Payment Schedule</option>
                </select>
              </div>

              {discountType === 'refund_policy' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Percentage</label>
                    <input
                      type="number"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(e.target.value)}
                      className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter percentage"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Conditions</label>
                    <input
                      type="text"
                      value={discountConditions}
                      onChange={(e) => setDiscountConditions(e.target.value)}
                      className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter conditions"
                    />
                  </div>
                </>
              )}
              
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={discountDescription}
                    onChange={(e) => setDiscountDescription(e.target.value)}
                    className="flex-1 p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter discount description"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (discountDescription.trim()) {
                        const newDiscount = {
                          type: discountType,
                          description: discountDescription,
                          ...(discountType === 'refund_policy' && {
                            percentage: Number(discountPercentage),
                            conditions: discountConditions
                          })
                        };
                        setFormData(prev => ({
                          ...prev,
                          discounts: [...prev.discounts, newDiscount]
                        }));
                        setDiscountDescription('');
                        setDiscountPercentage('');
                        setDiscountConditions('');
                      }
                    }}
                    className="px-4 py-2 text-sm bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg"
                  >
                    Add Discount
                  </motion.button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {formData.discounts.map((discount, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-full"
                >
                  <span className="text-sm font-medium text-green-800">{discount.description}</span>
                  <button
                    onClick={() => {
                      const newDiscounts = formData.discounts.filter((d) => d.description !== discount.description);
                      setFormData(prev => ({
                        ...prev,
                        discounts: newDiscounts
                      }));
                    }}
                    className="text-green-600 hover:text-green-800 font-bold text-lg leading-none"
                  >
                    ×
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {packages.map((pkg, index) => {
              const theme = colorThemes[index % colorThemes.length];
              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.1 }}
                  className={`group relative bg-gradient-to-br ${theme.gradient} rounded-xl shadow-md ${theme.border} border overflow-hidden transition-all duration-700 ease-in-out opacity-0 group-hover:opacity-100`}
                >
                  {/* Card Header - Always Visible */}
                  <div className="p-5">
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
                        <span className={`font-bold ${theme.accent} text-sm`}>${pkg.enrollmentCharge}</span>
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
                    </div>

                    {/* Expand Indicator */}
                    <div className="text-center">
                      <motion.div
                        animate={{ y: [0, 3, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className={`${theme.accent} text-xs font-medium opacity-60 group-hover:opacity-0 transition-opacity duration-300`}
                      >
                        View Details ↓
                      </motion.div>
                    </div>
                  </div>

                  {/* Expandable Content - Shows on Hover */}
                  <div 
                    style={{
                      transition: 'all 600ms cubic-bezier(0.4, 0, 0.2, 1)',
                      willChange: 'transform, opacity, max-height'
                    }}
                    className="overflow-hidden origin-top transform-gpu
                      max-h-0 group-hover:max-h-[2000px] 
                      opacity-0 group-hover:opacity-100
                      translate-y-[-10%] group-hover:translate-y-0
                      scale-98 group-hover:scale-100"
                  >
                    <div className={`p-5 bg-white/90 backdrop-blur-sm border-t ${theme.border}`}>
                      {/* Features Section */}
                      {pkg.features.length > 0 && (
                        <div className="mb-4">
                          <h4 className={`text-xs font-bold ${theme.accent} mb-3 flex items-center gap-2`}>
                            <FaUserGraduate size={12} />
                            Package Features
                          </h4>
                          <div className="space-y-2">
                            {pkg.features.map((feature, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`flex items-center gap-2 p-2 rounded-lg hover:bg-white/80 transition-colors duration-300`}
                              >
                                <div className={`p-1 ${theme.icon} bg-white rounded-lg shadow-sm`}>
                                  <FaCheck size={10} />
                                </div>
                                <span className="text-xs font-medium text-gray-700">{feature}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Discounts Section */}
                      {pkg.discounts.length > 0 && (
                        <div>
                          <h4 className={`text-xs font-bold ${theme.accent} mb-3 flex items-center gap-2`}>
                            <FaClock size={12} />
                            Special Offers
                          </h4>
                          <div className="space-y-2">
                            {pkg.discounts.map((discount, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`flex items-center gap-2 p-2 rounded-lg hover:bg-white/80 transition-colors duration-300`}
                              >
                                <div className={`p-1 ${theme.icon} bg-white rounded-lg shadow-sm`}>
                                  <FaCheck size={10} />
                                </div>
                                <span className="text-xs font-medium text-gray-700">{discount.description}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
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