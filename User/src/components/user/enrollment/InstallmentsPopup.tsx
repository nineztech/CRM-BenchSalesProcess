import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaCheckCircle, FaClock } from 'react-icons/fa';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5006/api";

interface InstallmentsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  enrolledClientId: number;
  totalCharge: number | null;
  isMyReview?: boolean;  // Add this prop to determine if we're in My Review tab
  editedTotalCharge?: number | null;  // Add this prop for edited total charge
  chargeType?: 'enrollment_charge' | 'offer_letter_charge' | 'first_year_charge';  // Add charge type prop
  firstYearSalary?: number | null;  // Add first year salary prop
  netPayableFirstYear?: number | null;  // Add net payable first year prop
}

interface Installment {
  id: number;
  amount: number;
  net_amount: number | null;  // Add net_amount field
  dueDate: string;
  remark: string;
  paid: boolean;
  paidDate: string | null;
  charge_type: string;
  installment_number: number;
  edited_amount?: number | null;
  edited_dueDate?: string | null;
  edited_remark?: string | null;
}

const InstallmentsPopup: React.FC<InstallmentsPopupProps> = ({
  isOpen,
  onClose,
  enrolledClientId,
  isMyReview = false,
  chargeType = 'enrollment_charge',
  firstYearSalary,
  
}) => {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && enrolledClientId) {
      fetchInstallments();
    }
  }, [isOpen, enrolledClientId]);

  const fetchInstallments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${BASE_URL}/installments/enrolled-client/${enrolledClientId}?charge_type=${chargeType}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setInstallments(response.data.data.installments);
      }
    } catch (error) {
      console.error('Error fetching installments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    // Add timezone offset to show correct date
    const [year, month, day] = date.split('T')[0].split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day));
    
    // Add ordinal suffix to day
    const dayNum = d.getUTCDate();
    const ordinal = (dayNum: number) => {
      if (dayNum > 3 && dayNum < 21) return 'th';
      switch (dayNum % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    
    const monthName = d.toLocaleDateString('en-US', {
      month: 'long',
      timeZone: 'UTC'
    });
    
    return `${dayNum}${ordinal(dayNum)} ${monthName} ${d.getUTCFullYear()}`;
  };

  if (!isOpen) return null;

  // Helper function to get the effective amount for an installment
  const getEffectiveAmount = (installment: Installment) => {
    // Priority: net_amount > edited_amount > amount
    if (installment.net_amount !== null && installment.net_amount !== undefined) {
      return installment.net_amount;
    }
    if (isMyReview && installment.edited_amount !== undefined && installment.edited_amount !== null) {
      return installment.edited_amount;
    }
    return installment.amount;
  };

  // Calculate totals based on effective amounts (net amounts)
  const totalNetAmount = installments.reduce((sum, inst) => {
    const effectiveAmount = getEffectiveAmount(inst);
    return sum + Number(effectiveAmount);
  }, 0);

  const totalPaid = installments.reduce((sum, inst) => {
    const effectiveAmount = getEffectiveAmount(inst);
    return inst.paid ? sum + Number(effectiveAmount) : sum;
  }, 0);

  // Use net amount total instead of the passed totalCharge
  const effectiveTotalCharge = totalNetAmount;
  const totalPending = effectiveTotalCharge - totalPaid;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {isMyReview ? 'Admin Modified Installment Details' : `${chargeType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Installment Details`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className={`grid ${chargeType === 'first_year_charge' ? 'grid-cols-4' : 'grid-cols-3'} gap-4 mb-6`}>
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Total Net Amount</h3>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(effectiveTotalCharge)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Total Paid (Net)</h3>
                <p className="text-lg font-semibold text-green-600">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Total Pending (Net)</h3>
                <p className="text-lg font-semibold text-yellow-600">{formatCurrency(totalPending)}</p>
              </div>
              {chargeType === 'first_year_charge' && firstYearSalary && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-1">First Year Salary</h3>
                  <p className="text-lg font-semibold text-purple-600">{formatCurrency(firstYearSalary)}</p>
                </div>
              )}
            </div>

            {/* Installments Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Installment #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Original Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remark
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {installments.map((installment) => {
                    const effectiveAmount = getEffectiveAmount(installment);
                    const hasNetAmount = installment.net_amount !== null && installment.net_amount !== undefined;
                    
                    return (
                      <tr key={installment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {installment.installment_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(installment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`${hasNetAmount && installment.net_amount !== installment.amount ? 'text-blue-600 font-semibold' : ''}`}>
                            {formatCurrency(effectiveAmount)}
                          </span>
                          {hasNetAmount && installment.net_amount !== installment.amount && (
                            <span className="ml-1 text-xs text-blue-500">(updated)</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(isMyReview && installment.edited_dueDate ? 
                            installment.edited_dueDate : installment.dueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {installment.paid ? (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center w-fit gap-1">
                              <FaCheckCircle /> Paid
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full flex items-center w-fit gap-1">
                              <FaClock /> Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {installment.paidDate ? formatDate(installment.paidDate) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {isMyReview && installment.edited_remark ? 
                            installment.edited_remark : 
                            installment.remark || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default InstallmentsPopup; 