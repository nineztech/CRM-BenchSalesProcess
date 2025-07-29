import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PaymentConfirmationPopup from './PaymentConfirmationPopup';
import { 
  // FaDollarSign, 
  FaCheckCircle, 
  FaClock, 
  FaCalendarAlt, 
  FaUser, 
  // FaFileInvoiceDollar,
  FaMoneyBillWave,
  FaCreditCard,
  FaReceipt,
  FaSearch,
  FaFilter,
  // FaEye,
  FaEdit,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaEnvelope,
  // FaPhone,
  FaMapMarkerAlt
} from 'react-icons/fa';

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5006/api";

interface Installment {
  id: number;
  enrolledClientId: number;
  installment_number: number;
  charge_type: 'enrollment_charge' | 'offer_letter_charge' | 'first_year_charge';
  amount: number;
  net_amount: number;
  dueDate: string;
  paid: boolean;
  paidDate: string | null;
  paid_at: string | null;
  remark: string;
  is_initial_payment: boolean;
  has_admin_update: boolean;
  edited_amount: number | null;
  edited_dueDate: string | null;
  edited_remark: string | null;
  admin_id: number | null;
  sales_approval: boolean;
  createdAt: string;
  updatedAt: string;
  enrolledClient: {
    id: number;
    lead_id: number;
    payable_enrollment_charge: number;
    payable_offer_letter_charge: number;
    payable_first_year_percentage: number | null;
    payable_first_year_fixed_charge: number | null;
    net_payable_first_year_price: number | null;
    first_year_salary: number | null;
    lead: {
      id: number;
      firstName: string;
      lastName: string;
      primaryEmail: string;
      technology: string[];
      visaStatus: string;
    };
    package: {
      id: number;
      planName: string;
    } | null;
  };
}

interface ClientGroup {
  enrolledClientId: number;
  lead: {
    id: number;
    firstName: string;
    lastName: string;
    primaryEmail: string;
    technology: string[];
    visaStatus: string;
  };
  package: {
    id: number;
    planName: string;
  } | null;
  installments: Installment[];
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paidCount: number;
  pendingCount: number;
}

interface PaymentControlProps {}

const PaymentControl: React.FC<PaymentControlProps> = () => {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [chargeTypeFilter, setChargeTypeFilter] = useState<'all' | 'enrollment_charge' | 'offer_letter_charge' | 'first_year_charge'>('all');
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [expandedClients, setExpandedClients] = useState<Set<number>>(new Set());
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<'mark-paid' | 'mark-pending' | null>(null);
  const [confirmationInstallment, setConfirmationInstallment] = useState<Installment | null>(null);
  const [editForm, setEditForm] = useState({
    net_amount: 0,
    paid: false,
    paidDate: '',
    remark: ''
  });

  useEffect(() => {
    fetchInstallments();
  }, []);

  const fetchInstallments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/installments/payment-control`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setInstallments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching installments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentStatusUpdate = async (installmentId: number, paid: boolean) => {
    try {
      setUpdating(installmentId);
      const token = localStorage.getItem('token');
      const userId = JSON.parse(localStorage.getItem('user') || '{}').id;

      const response = await axios.put(
        `${BASE_URL}/installments/payment-status/${installmentId}`,
        {
          paid,
          paidDate: paid ? new Date().toISOString().split('T')[0] : null,
          updatedBy: userId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Update local state
        setInstallments(prev => 
          prev.map(inst => 
            inst.id === installmentId 
              ? { 
                  ...inst, 
                  paid, 
                  paidDate: paid ? new Date().toISOString().split('T')[0] : null,
                  paid_at: paid ? new Date().toISOString() : null
                }
              : inst
          )
        );
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Error updating payment status');
    } finally {
      setUpdating(null);
      setShowConfirmationPopup(false);
      setConfirmationAction(null);
      setConfirmationInstallment(null);
    }
  };

  const handlePaymentStatusConfirmation = (installment: Installment, action: 'mark-paid' | 'mark-pending') => {
    setConfirmationInstallment(installment);
    setConfirmationAction(action);
    setShowConfirmationPopup(true);
  };

  const handleConfirmPaymentStatus = () => {
    if (confirmationInstallment && confirmationAction) {
      const paid = confirmationAction === 'mark-paid';
      handlePaymentStatusUpdate(confirmationInstallment.id, paid);
    }
  };

  const handleEditInstallment = (installment: Installment) => {
    setSelectedInstallment(installment);
    setEditForm({
      net_amount: installment.net_amount || installment.amount,
      paid: installment.paid,
      paidDate: installment.paidDate || '',
      remark: installment.remark || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedInstallment) return;

    try {
      const token = localStorage.getItem('token');
      const userId = JSON.parse(localStorage.getItem('user') || '{}').id;

      const response = await axios.put(
        `${BASE_URL}/installments/payment-control/${selectedInstallment.id}`,
        {
          net_amount: editForm.net_amount,
          paid: editForm.paid,
          paidDate: editForm.paid ? editForm.paidDate : null,
          remark: editForm.remark,
          updatedBy: userId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Update local state
        setInstallments(prev => 
          prev.map(inst => 
            inst.id === selectedInstallment.id 
              ? { 
                  ...inst, 
                  net_amount: editForm.net_amount,
                  paid: editForm.paid, 
                  paidDate: editForm.paid ? editForm.paidDate : null,
                  paid_at: editForm.paid ? new Date().toISOString() : null,
                  remark: editForm.remark
                }
              : inst
          )
        );
        setShowEditModal(false);
        setSelectedInstallment(null);
      }
    } catch (error) {
      console.error('Error updating installment:', error);
      alert('Error updating installment');
    }
  };

  const toggleClientExpansion = (clientId: number) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  const groupInstallmentsByClient = (): ClientGroup[] => {
    const groups = new Map<number, ClientGroup>();
    
    installments.forEach(installment => {
      const clientId = installment.enrolledClientId;
      if (!groups.has(clientId)) {
        groups.set(clientId, {
          enrolledClientId: clientId,
          lead: installment.enrolledClient.lead,
          package: installment.enrolledClient.package,
          installments: [],
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          paidCount: 0,
          pendingCount: 0
        });
      }
      
      const group = groups.get(clientId)!;
      group.installments.push(installment);
      group.totalAmount += installment.net_amount || installment.amount;
      
      if (installment.paid) {
        group.paidAmount += installment.net_amount || installment.amount;
        group.paidCount++;
      } else {
        group.pendingAmount += installment.net_amount || installment.amount;
        group.pendingCount++;
      }
    });
    
    return Array.from(groups.values());
  };

  const getFilteredClientGroups = () => {
    const clientGroups = groupInstallmentsByClient();
    
    return clientGroups.filter(group => {
      const matchesSearch = 
        group.lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.lead.primaryEmail.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'paid' && group.paidCount > 0) ||
        (statusFilter === 'pending' && group.pendingCount > 0);

      return matchesSearch && matchesStatus;
    });
  };

  const getFilteredInstallmentsForClient = (clientInstallments: Installment[]) => {
    return clientInstallments.filter(installment => {
      const matchesChargeType = 
        chargeTypeFilter === 'all' || 
        installment.charge_type === chargeTypeFilter;

      return matchesChargeType;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // const getChargeTypeLabel = (chargeType: string) => {
  //   switch (chargeType) {
  //     case 'enrollment_charge':
  //       return 'Enrollment';
  //     case 'offer_letter_charge':
  //       return 'Offer Letter';
  //     case 'first_year_charge':
  //       return 'First Year';
  //     default:
  //       return chargeType;
  //   }
  // };

  // const getChargeTypeColor = (chargeType: string) => {
  //   switch (chargeType) {
  //     case 'enrollment_charge':
  //       return 'bg-blue-100 text-blue-800 border-blue-200';
  //     case 'offer_letter_charge':
  //       return 'bg-purple-100 text-purple-800 border-purple-200';
  //     case 'first_year_charge':
  //       return 'bg-green-100 text-green-800 border-green-200';
  //     default:
  //       return 'bg-gray-100 text-gray-800 border-gray-200';
  //   }
  // };

  const getStatusBadge = (paid: boolean) => {
    return paid ? (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1 border border-green-200">
        <FaCheckCircle className="w-3 h-3" />
        Paid
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1 border border-yellow-200">
        <FaClock className="w-3 h-3" />
        Pending
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading payment data...</p>
        </div>
      </div>
    );
  }

  const filteredClientGroups = getFilteredClientGroups();

  return (
    <div className="p-6 ml-14 mt-10 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <FaMoneyBillWave className="text-emerald-600 text-[35px]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 text-left">Payment Control Center</h1>
            <p className="text-gray-600 text-sm text-start">Manage and track all installment payments</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">


        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaSearch className="inline mr-2" />
                Search
              </label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaFilter className="inline mr-2" />
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="paid">Has Paid</option>
                <option value="pending">Has Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaCreditCard className="inline mr-2" />
                Charge Type
              </label>
              <select
                value={chargeTypeFilter}
                onChange={(e) => setChargeTypeFilter(e.target.value as any)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="enrollment_charge">Enrollment</option>
                <option value="offer_letter_charge">Offer Letter</option>
                <option value="first_year_charge">First Year</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchInstallments}
                className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <FaSearch className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Client Rows */}
        <div className="space-y-4">
          {filteredClientGroups.map((clientGroup) => {
            const isExpanded = expandedClients.has(clientGroup.enrolledClientId);
            const filteredInstallments = getFilteredInstallmentsForClient(clientGroup.installments);
            
            return (
              <div key={clientGroup.enrolledClientId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Client Header Row */}
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
                  onClick={() => toggleClientExpansion(clientGroup.enrolledClientId)}
                >
                  <div className="flex items-center justify-between">
                    {/* Left Section - Client Info */}
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 h-12 w-12">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                          <FaUser className="text-white text-lg" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="text-lg font-bold text-gray-900 truncate">
                            {clientGroup.lead.firstName} {clientGroup.lead.lastName}
                          </h3>
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm flex-shrink-0">
                            {clientGroup.lead.visaStatus}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-600">
                          <div className="flex items-center space-x-1">
                            <FaEnvelope className="w-3 h-3 text-blue-500" />
                            <span className="truncate max-w-32">{clientGroup.lead.primaryEmail}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FaMapMarkerAlt className="w-3 h-3 text-green-500" />
                            <span className="truncate max-w-24">{clientGroup.lead.technology?.join(', ') || 'No technology'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right Section - Payment Info */}
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Package</div>
                        <div className="text-sm font-medium text-gray-900">{clientGroup.package?.planName || 'No Package'}</div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Total Amount</div>
                        <div className="text-base font-bold text-purple-600">{formatCurrency(clientGroup.totalAmount)}</div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Status</div>
                        <div className="flex items-center space-x-1">
                          <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200">
                            {clientGroup.paidCount}P
                          </span>
                          <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                            {clientGroup.pendingCount}U
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center ml-2">
                        {isExpanded ? (
                          <FaChevronUp className="text-gray-400 w-4 h-4" />
                        ) : (
                          <FaChevronDown className="text-gray-400 w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Installments Grid */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    <div className="p-6">

                      
                      {/* Enrollment Charges Table */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-lg font-semibold text-blue-700 flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            Enrollment Charges
                          </h5>
                          <div className="text-sm text-gray-600">
                            Total: {formatCurrency(filteredInstallments.filter(i => i.charge_type === 'enrollment_charge').reduce((sum, i) => sum + (Number(i.net_amount) || Number(i.amount) || 0), 0))}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
                              <thead className="bg-blue-50 border-b border-blue-200">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider border-r border-blue-200">#</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider border-r border-blue-200">Original Amount</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider border-r border-blue-200">Net Amount</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider border-r border-blue-200">Due Date</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider border-r border-blue-200">Status</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                                {filteredInstallments.filter(i => i.charge_type === 'enrollment_charge').map((installment, idx) => (
                                  <tr key={installment.id} className="hover:bg-blue-50">
                                                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 text-left">
                                    {idx + 1}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200 text-left">
                                    {formatCurrency(installment.amount)}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600 border-r border-gray-200 text-left">
                                    {formatCurrency(installment.net_amount || installment.amount)}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 text-left">
                                    <div className="flex items-center gap-2">
                                      <FaCalendarAlt className="text-gray-400" />
                                      {new Date(installment.dueDate).toLocaleDateString()}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 text-left">
                                    {getStatusBadge(installment.paid)}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-left">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleEditInstallment(installment)}
                                        className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                                        title="Edit Payment"
                                      >
                                        <FaEdit className="w-4 h-4" />
                                      </button>
                                      {!installment.paid && (
                                        <button
                                          onClick={() => handlePaymentStatusConfirmation(installment, 'mark-paid')}
                                          disabled={updating === installment.id}
                                          className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                                          title="Mark as Paid"
                                        >
                                          <FaCheckCircle className="w-4 h-4" />
                                        </button>
                                      )}
                                      {installment.paid && (
                                        <button
                                          onClick={() => handlePaymentStatusConfirmation(installment, 'mark-pending')}
                                          disabled={updating === installment.id}
                                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                          title="Mark as Pending"
                                        >
                                          <FaClock className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {filteredInstallments.filter(i => i.charge_type === 'enrollment_charge').length === 0 && (
                            <div className="text-center py-8">
                              <FaReceipt className="mx-auto h-8 w-8 text-gray-400" />
                              <h3 className="mt-2 text-sm font-medium text-gray-900">No enrollment charges found</h3>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Offer Letter Charges Table */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-lg font-semibold text-purple-700 flex items-center gap-2">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                            Offer Letter Charges
                          </h5>
                          <div className="text-sm text-gray-600">
                            Total: {formatCurrency(filteredInstallments.filter(i => i.charge_type === 'offer_letter_charge').reduce((sum, i) => sum + (Number(i.net_amount) || Number(i.amount) || 0), 0))}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-purple-50 border-b border-purple-200">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider border-r border-purple-200">#</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider border-r border-purple-200">Original Amount</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider border-r border-purple-200">Net Amount</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider border-r border-purple-200">Due Date</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider border-r border-purple-200">Status</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {filteredInstallments.filter(i => i.charge_type === 'offer_letter_charge').map((installment, idx) => (
                                  <tr key={installment.id} className="hover:bg-purple-50">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 text-left">
                                      {idx + 1}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200 text-left">
                                      {formatCurrency(installment.amount)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-purple-600 border-r border-gray-200 text-left">
                                      {formatCurrency(installment.net_amount || installment.amount)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 text-left">
                                      <div className="flex items-center gap-2">
                                        <FaCalendarAlt className="text-gray-400" />
                                        {new Date(installment.dueDate).toLocaleDateString()}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 text-left">
                                      {getStatusBadge(installment.paid)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-left">
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => handleEditInstallment(installment)}
                                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                                          title="Edit Payment"
                                        >
                                          <FaEdit className="w-4 h-4" />
                                        </button>
                                        {!installment.paid && (
                                          <button
                                            onClick={() => handlePaymentStatusConfirmation(installment, 'mark-paid')}
                                            disabled={updating === installment.id}
                                            className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                                            title="Mark as Paid"
                                          >
                                            <FaCheckCircle className="w-4 h-4" />
                                          </button>
                                        )}
                                        {installment.paid && (
                                          <button
                                            onClick={() => handlePaymentStatusConfirmation(installment, 'mark-pending')}
                                            disabled={updating === installment.id}
                                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                            title="Mark as Pending"
                                          >
                                            <FaClock className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {filteredInstallments.filter(i => i.charge_type === 'offer_letter_charge').length === 0 && (
                            <div className="text-center py-8">
                              <FaReceipt className="mx-auto h-8 w-8 text-gray-400" />
                              <h3 className="mt-2 text-sm font-medium text-gray-900">No offer letter charges found</h3>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* First Year Charges Table */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-lg font-semibold text-green-700 flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            First Year Charges
                          </h5>
                          <div className="text-sm text-gray-600">
                            Total: {formatCurrency(filteredInstallments.filter(i => i.charge_type === 'first_year_charge').reduce((sum, i) => sum + (Number(i.net_amount) || Number(i.amount) || 0), 0))}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-green-50 border-b border-green-200">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider border-r border-green-200">#</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider border-r border-green-200">Original Amount</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider border-r border-green-200">Net Amount</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider border-r border-green-200">Due Date</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider border-r border-green-200">Status</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {filteredInstallments.filter(i => i.charge_type === 'first_year_charge').map((installment, idx) => (
                                  <tr key={installment.id} className="hover:bg-green-50">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 text-left">
                                      {idx + 1}
                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200 text-left">
                      {formatCurrency(installment.amount)}
                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-600 border-r border-gray-200 text-left">
                      {formatCurrency(installment.net_amount || installment.amount)}
                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 text-left">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-gray-400" />
                        {new Date(installment.dueDate).toLocaleDateString()}
                      </div>
                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 text-left">
                      {getStatusBadge(installment.paid)}
                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-left">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditInstallment(installment)}
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Payment"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        {!installment.paid && (
                          <button
                                            onClick={() => handlePaymentStatusConfirmation(installment, 'mark-paid')}
                            disabled={updating === installment.id}
                            className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                            title="Mark as Paid"
                          >
                            <FaCheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {installment.paid && (
                          <button
                                            onClick={() => handlePaymentStatusConfirmation(installment, 'mark-pending')}
                            disabled={updating === installment.id}
                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                            title="Mark as Pending"
                          >
                            <FaClock className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
                          {filteredInstallments.filter(i => i.charge_type === 'first_year_charge').length === 0 && (
                            <div className="text-center py-8">
                              <FaReceipt className="mx-auto h-8 w-8 text-gray-400" />
                              <h3 className="mt-2 text-sm font-medium text-gray-900">No first year charges found</h3>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredClientGroups.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <FaUser className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedInstallment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Payment Details</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Net Amount ($)
                  </label>
                  <input
                    type="number"
                    value={editForm.net_amount}
                    onChange={(e) => setEditForm(prev => ({ ...prev, net_amount: Number(e.target.value) }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Status
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editForm.paid}
                      onChange={(e) => setEditForm(prev => ({ ...prev, paid: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Mark as Paid
                    </label>
                  </div>
                </div>

                {editForm.paid && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={editForm.paidDate}
                      onChange={(e) => setEditForm(prev => ({ ...prev, paidDate: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remark
                  </label>
                  <textarea
                    value={editForm.remark}
                    onChange={(e) => setEditForm(prev => ({ ...prev, remark: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Add a note about this payment..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Popup */}
      <PaymentConfirmationPopup
        isOpen={showConfirmationPopup}
        onClose={() => {
          setShowConfirmationPopup(false);
          setConfirmationAction(null);
          setConfirmationInstallment(null);
        }}
        onConfirm={handleConfirmPaymentStatus}
        installment={confirmationInstallment}
        action={confirmationAction}
      />
    </div>
  );
};

export default PaymentControl; 