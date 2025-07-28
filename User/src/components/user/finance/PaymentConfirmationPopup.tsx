import React from 'react';
import { FaCheckCircle, FaClock, FaTimes, FaExclamationTriangle, FaUser, FaDollarSign, FaCalendarAlt } from 'react-icons/fa';

interface PaymentConfirmationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  installment: {
    id: number;
    amount: number;
    net_amount: number;
    charge_type: string;
    dueDate: string;
    enrolledClient: {
      lead: {
        firstName: string;
        lastName: string;
      };
    };
  } | null;
  action: 'mark-paid' | 'mark-pending' | null;
}

const PaymentConfirmationPopup: React.FC<PaymentConfirmationPopupProps> = ({
  isOpen,
  onClose,
  onConfirm,
  installment,
  action
}) => {
  if (!isOpen || !installment || !action) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getActionDetails = () => {
    if (action === 'mark-paid') {
      return {
        title: 'Mark as Paid',
        message: 'Are you sure you want to mark this installment as paid?',
        icon: <FaCheckCircle className="text-green-500 text-xl" />,
        buttonClass: 'bg-green-600 hover:bg-green-700',
        buttonText: 'Mark as Paid',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    } else {
      return {
        title: 'Mark as Pending',
        message: 'Are you sure you want to mark this installment as pending?',
        icon: <FaClock className="text-yellow-500 text-xl" />,
        buttonClass: 'bg-yellow-600 hover:bg-yellow-700',
        buttonText: 'Mark as Pending',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      };
    }
  };

  const actionDetails = getActionDetails();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-4 w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-200">
        {/* Header */}
        <div className={`px-6 py-4 border-b ${actionDetails.borderColor} ${actionDetails.bgColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {actionDetails.icon}
              <h3 className="text-lg font-semibold text-gray-900">{actionDetails.title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Installment Details */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FaUser className="text-blue-500" />
              Installment Details
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Client Name</span>
                <span className="text-sm font-medium text-gray-900">{installment.enrolledClient.lead.firstName} {installment.enrolledClient.lead.lastName}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Amount</span>
                <span className="text-sm font-bold text-green-600">{formatCurrency(installment.net_amount || installment.amount)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Charge Type</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{installment.charge_type.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Due Date</span>
                <span className="text-sm font-medium text-gray-900">{new Date(installment.dueDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className={`flex items-start gap-3 p-4 rounded-lg ${actionDetails.bgColor} border ${actionDetails.borderColor} mb-6`}>
            <FaExclamationTriangle className="text-yellow-500 text-lg mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700 leading-relaxed">{actionDetails.message}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors font-medium ${actionDetails.buttonClass}`}
            >
              {actionDetails.buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmationPopup; 