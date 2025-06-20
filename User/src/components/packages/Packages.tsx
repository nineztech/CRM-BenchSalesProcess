import React, { useState, useEffect } from 'react';
import { FaMoneyBillWave, FaUserGraduate, FaClock, FaCheck, FaStar, FaGift } from 'react-icons/fa';
import axios, { AxiosError } from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import Countdown from 'react-countdown';
import toast from 'react-hot-toast';
import Layout from '../layout/Layout';

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

  return (
    <Layout>
      <div className="flex flex-col gap-8 max-w-[98%] p-6 font-inter">
        <h2 className="text-3xl font-bold text-gray-800 tracking-tight mb-6">Available Packages</h2>
        
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
      </div>
    </Layout>
  );
};

export default PackagesPage; 