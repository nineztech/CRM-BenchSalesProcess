import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  FaDollarSign, 
  FaCheckCircle, 
  FaClock, 
  FaCalendarAlt, 
  FaUser, 
  FaFileInvoiceDollar,
  FaMoneyBillWave,
  FaCreditCard,
  FaReceipt,
  FaSearch,
  FaFilter,
  FaEye,
  FaEdit,
  FaTimes
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

  const getFilteredInstallments = () => {
    return installments.filter(installment => {
      const matchesSearch = 
        installment.enrolledClient.lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        installment.enrolledClient.lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        installment.enrolledClient.lead.primaryEmail.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'paid' && installment.paid) ||
        (statusFilter === 'pending' && !installment.paid);
      
      const matchesChargeType = 
        chargeTypeFilter === 'all' || 
        installment.charge_type === chargeTypeFilter;

      return matchesSearch && matchesStatus && matchesChargeType;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getChargeTypeLabel = (chargeType: string) => {
    switch (chargeType) {
      case 'enrollment_charge':
        return 'Enrollment';
      case 'offer_letter_charge':
        return 'Offer Letter';
      case 'first_year_charge':
        return 'First Year';
      default:
        return chargeType;
    }
  };

  const getChargeTypeColor = (chargeType: string) => {
    switch (chargeType) {
      case 'enrollment_charge':
        return 'bg-blue-100 text-blue-800';
      case 'offer_letter_charge':
        return 'bg-purple-100 text-purple-800';
      case 'first_year_charge':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (paid: boolean) => {
    return paid ? (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1">
        <FaCheckCircle className="w-3 h-3" />
        Paid
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1">
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

  const filteredInstallments = getFilteredInstallments();

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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Installments</p>
                <p className="text-2xl font-bold text-gray-900">{installments.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaFileInvoiceDollar className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid Installments</p>
                <p className="text-2xl font-bold text-green-600">
                  {installments.filter(inst => inst.paid).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FaCheckCircle className="text-green-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Installments</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {installments.filter(inst => !inst.paid).length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FaClock className="text-yellow-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(installments.reduce((sum, inst) => sum + (inst.net_amount || inst.amount), 0))}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <FaDollarSign className="text-purple-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

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
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
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

        {/* Installments Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Charge Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInstallments.map((installment, idx) => (
                  <tr key={installment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{idx + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <FaUser className="text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {installment.enrolledClient.lead.firstName} {installment.enrolledClient.lead.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{installment.enrolledClient.lead.primaryEmail}</div>
                          <div className="text-xs text-gray-400">
                            {installment.enrolledClient.lead.technology?.join(', ') || 'No technology'} • {installment.enrolledClient.lead.visaStatus}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {installment.enrolledClient.package?.planName || 'No Package'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getChargeTypeColor(installment.charge_type)}`}>
                        {getChargeTypeLabel(installment.charge_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(installment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-600">
                      {formatCurrency(installment.net_amount || installment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-gray-400" />
                        {new Date(installment.dueDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(installment.paid)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                            onClick={() => handlePaymentStatusUpdate(installment.id, true)}
                            disabled={updating === installment.id}
                            className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                            title="Mark as Paid"
                          >
                            <FaCheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {installment.paid && (
                          <button
                            onClick={() => handlePaymentStatusUpdate(installment.id, false)}
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
        </div>

        {filteredInstallments.length === 0 && (
          <div className="text-center py-12">
            <FaReceipt className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No installments found</h3>
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
    </div>
  );
};

export default PaymentControl; 