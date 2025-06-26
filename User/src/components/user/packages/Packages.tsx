import React, { useState, useEffect } from 'react';
import { FaMoneyBillWave, FaUserGraduate, FaClock, FaCheck, FaStar, FaGift, FaEdit, FaTimes } from 'react-icons/fa';
import axios, { AxiosError } from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import Countdown from 'react-countdown';
import toast from 'react-hot-toast';
import Layout from '../../common/layout/Layout';

interface Package {
  id: number;
  planName: string;
  enrollmentCharge: number;
  initialPrice: number;
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

interface EditPackageForm {
  planName: string;
  initialPrice: number;
  enrollmentCharge: number;
  offerLetterCharge: number;
  firstYearSalaryPercentage: number;
  features: string[];
  status: string;
}

// Countdown renderer component
const countdownRenderer = ({ days, hours, minutes, seconds, completed }: any) => {
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

const PackagesPage: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnyCardHovered, setIsAnyCardHovered] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [editForm, setEditForm] = useState<EditPackageForm>({
    planName: '',
    initialPrice: 0,
    enrollmentCharge: 0,
    offerLetterCharge: 0,
    firstYearSalaryPercentage: 0,
    features: [],
    status: 'active'
  });
  const [showEditModal, setShowEditModal] = useState(false);

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

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5006/api";

  // Create axios instance with default config
  const axiosInstance = axios.create({
    baseURL: `${API_BASE_URL}/packages`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get('/all');
      if (response.data.success) {
        setPackages(response.data.data);
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status !== 401) {
        toast.error('Failed to fetch packages');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setEditForm({
      planName: pkg.planName,
      initialPrice: pkg.initialPrice,
      enrollmentCharge: pkg.enrollmentCharge,
      offerLetterCharge: pkg.offerLetterCharge,
      firstYearSalaryPercentage: pkg.firstYearSalaryPercentage,
      features: pkg.features,
      status: pkg.status
    });
    setShowEditModal(true);
  };

  const validateForm = () => {
    if (!editForm.planName.trim()) {
      toast.error('Plan name is required');
      return false;
    }

    const initialPrice = Number(editForm.initialPrice);
    const enrollmentCharge = Number(editForm.enrollmentCharge);
    const offerLetterCharge = Number(editForm.offerLetterCharge);
    const firstYearSalaryPercentage = Number(editForm.firstYearSalaryPercentage);

    if (isNaN(initialPrice) || initialPrice <= 0) {
      toast.error('Initial price must be greater than 0');
      return false;
    }

    if (isNaN(enrollmentCharge) || enrollmentCharge <= 0) {
      toast.error('Enrollment charge must be greater than 0');
      return false;
    }

    if (initialPrice < enrollmentCharge) {
      toast.error('Initial price must be greater than or equal to enrollment charge');
      return false;
    }

    if (isNaN(offerLetterCharge) || offerLetterCharge < 0) {
      toast.error('Offer letter charge cannot be negative');
      return false;
    }

    if (isNaN(firstYearSalaryPercentage) || firstYearSalaryPercentage < 0 || firstYearSalaryPercentage > 100) {
      toast.error('First year salary percentage must be between 0 and 100');
      return false;
    }

    return true;
  };

  const handleUpdate = async () => {
    if (!editingPackage || !validateForm()) return;

    try {
      setIsLoading(true);
      const response = await axiosInstance.put(`/${editingPackage.id}`, editForm);
      
      if (response.data.success) {
        setPackages(prevPackages => 
          prevPackages.map(pkg => 
            pkg.id === editingPackage.id ? response.data.data : pkg
          )
        );
        toast.success('Package updated successfully');
        setShowEditModal(false);
        setEditingPackage(null);
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message || 'Failed to update package');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-8 max-w-[98%] p-6 font-inter">
        <h2 className="text-3xl font-bold text-gray-800 tracking-tight mb-6">Available Packages</h2>
        
        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          /* Packages Grid */
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
                    {/* Edit Button */}
                    <button
                      onClick={() => handleEdit(pkg)}
                      className="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors duration-200 z-10"
                    >
                      <FaEdit className={theme.accent} size={16} />
                    </button>

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
                      {/* Discounted Price Section - Only show if there are active discounts */}
                      {hasActiveDiscount && (
                        <div className="mb-6 text-center p-4 bg-gradient-to-r from-white/80 to-white/60 rounded-xl shadow-sm border border-white/80">
                          <div className="text-xs font-semibold text-gray-600 mb-1">Discounted Price</div>
                          <div className="flex items-center justify-center gap-3">
                            <span className="text-sm text-gray-500 line-through">${pkg.enrollmentCharge}</span>
                            <span className={`text-2xl font-bold ${theme.accent}`}>
                              ${pkg.discountedPrice || pkg.enrollmentCharge}
                            </span>
                          </div>
                          {pkg.discounts && pkg.discounts.length > 0 && (
                            <div className="mt-1 inline-block px-3 py-1 bg-red-50 rounded-full">
                              <span className="text-xs font-medium text-red-600">
                                Save ${(pkg.enrollmentCharge - (pkg.discountedPrice || pkg.enrollmentCharge)).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

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
                      </div>

                      {/* Pricing Section */}
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

                      {/* Features Section */}
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

                      {/* Special Offers Section */}
                      {pkg.discounts.length > 0 && (
                        <div className="space-y-2">
                          <h4 className={`text-xs font-bold ${theme.accent} mb-2 flex items-center gap-2`}>
                            <FaClock size={12} />
                            Special Offers
                          </h4>
                          <div className="space-y-1.5">
                            {pkg.discounts.map((discount, idx) => {
                              const discountAmount = (pkg.enrollmentCharge * discount.percentage) / 100;
                              const priceAfterDiscount = pkg.enrollmentCharge - discountAmount;
                              
                              return (
                                <div
                                  key={idx}
                                  className={`flex items-center justify-between p-2 bg-white/60 backdrop-blur-sm rounded-lg`}
                                >
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-700">
                                      {discount.name}
                                    </span>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs font-semibold text-purple-600">
                                        {discount.percentage}% OFF
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        (Save ${discountAmount.toFixed(2)})
                                      </span>
                                      <span className="text-xs font-medium text-green-600">
                                        Final: ${priceAfterDiscount.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Edit Package</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FaTimes className="text-gray-500" size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                  <input
                    type="text"
                    value={editForm.planName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, planName: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Price</label>
                  <input
                    type="number"
                    value={editForm.initialPrice}
                    onChange={(e) => setEditForm(prev => ({ ...prev, initialPrice: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Charge</label>
                  <input
                    type="number"
                    value={editForm.enrollmentCharge}
                    onChange={(e) => setEditForm(prev => ({ ...prev, enrollmentCharge: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Offer Letter Charge</label>
                  <input
                    type="number"
                    value={editForm.offerLetterCharge}
                    onChange={(e) => setEditForm(prev => ({ ...prev, offerLetterCharge: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Year Salary Percentage</label>
                  <input
                    type="number"
                    value={editForm.firstYearSalaryPercentage}
                    onChange={(e) => setEditForm(prev => ({ ...prev, firstYearSalaryPercentage: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
                  <textarea
                    value={editForm.features.join('\n')}
                    onChange={(e) => setEditForm(prev => ({ ...prev, features: e.target.value.split('\n').filter(f => f.trim()) }))}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Enter features (one per line)"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                  >
                    {isLoading ? 'Updating...' : 'Update Package'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PackagesPage; 