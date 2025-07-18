import React, { useState, useEffect } from 'react';
import { FaEdit, FaTimes, FaUserCog, FaGraduationCap, FaClock, FaCheckCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5006/api";

interface EnrolledClient {
  id: number;
  lead_id: number;
  packageid: number | null;
  payable_enrollment_charge: number | null;
  payable_offer_letter_charge: number | null;
  payable_first_year_percentage: number | null;
  payable_first_year_fixed_charge: number | null;
  Approval_by_sales: boolean;
  Sales_person_id: number | null;
  Approval_by_admin: boolean;
  Admin_id: number | null;
  has_update: boolean;
  edited_enrollment_charge: number | null;
  edited_offer_letter_charge: number | null;
  edited_first_year_percentage: number | null;
  edited_first_year_fixed_charge: number | null;
  createdAt: string;
  updatedAt: string;
  lead: {
    id: number;
    firstName: string;
    lastName: string;
    primaryEmail: string;
    primaryContact: string;
    status: string;
    technology: string[];
    country: string;
    visaStatus: string;
  };
  package: {
    id: number;
    planName: string;
    enrollmentCharge: number;
    offerLetterCharge: number;
    firstYearSalaryPercentage: number | null;
    firstYearFixedPrice: number | null;
    features: string[];
  } | null;
  salesPerson: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
  } | null;
  admin: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
  } | null;
}

interface Package {
  id: number;
  planName: string;
  enrollmentCharge: number;
  offerLetterCharge: number;
  firstYearSalaryPercentage: number | null;
  firstYearFixedPrice: number | null;
  features: string[];
  status: string;
}

interface FormData {
  approved: boolean;
  edited_enrollment_charge: number | null;
  edited_offer_letter_charge: number | null;
  edited_first_year_percentage: number | null;
  edited_first_year_fixed_charge: number | null;
  pricing_type: 'percentage' | 'fixed' | null;
}

const AdminEnrollment: React.FC = () => {
  const [enrolledClients, setEnrolledClients] = useState<EnrolledClient[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<EnrolledClient | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<'all' | 'approved' | 'sales_pending' | 'my_review'>('all');
  const [formData, setFormData] = useState<FormData>({
    approved: false,
    edited_enrollment_charge: null,
    edited_offer_letter_charge: null,
    edited_first_year_percentage: null,
    edited_first_year_fixed_charge: null,
    pricing_type: null
  });

  const pageSize = 10;

  useEffect(() => {
    fetchEnrolledClients();
    fetchPackages();
  }, [currentPage, activeTab]);

  const fetchEnrolledClients = async () => {
    try {
      const token = localStorage.getItem('token');
      let statusFilter = '';
      
      if (activeTab === 'my_review') {
        statusFilter = '&status=pending_admin';
      } else if (activeTab === 'approved') {
        statusFilter = '&status=approved';
      } else if (activeTab === 'sales_pending') {
        statusFilter = '&status=pending_sales_review';
      }
      // For 'all' tab, no status filter is applied

      const response = await axios.get(
        `${BASE_URL}/enrolled-clients?page=${currentPage}&limit=${pageSize}${statusFilter}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.data.success) {
        setEnrolledClients(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching enrolled clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/packages/all`);
      if (response.data.success) {
        setPackages(response.data.data.filter((pkg: Package) => pkg.status === 'active'));
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const handleReview = (client: EnrolledClient) => {
    setSelectedClient(client);
    setShowForm(true);
    
    // Set form data with current values
    setFormData({
      approved: false,
      edited_enrollment_charge: client.edited_enrollment_charge || client.payable_enrollment_charge,
      edited_offer_letter_charge: client.edited_offer_letter_charge || client.payable_offer_letter_charge,
      edited_first_year_percentage: client.edited_first_year_percentage || client.payable_first_year_percentage,
      edited_first_year_fixed_charge: client.edited_first_year_fixed_charge || client.payable_first_year_fixed_charge,
      pricing_type: client.payable_first_year_percentage ? 'percentage' : 'fixed'
    });
  };

  const handleApprove = async (client: EnrolledClient) => {
    if (!confirm('Are you sure you want to approve this enrollment without changes?')) return;

    setFormLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = JSON.parse(localStorage.getItem('user') || '{}').id;

      const response = await axios.put(
        `${BASE_URL}/enrolled-clients/admin/approval/${client.id}`,
        {
          approved: true,
          Admin_id: userId,
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
        fetchEnrolledClients();
        alert('Enrollment approved successfully!');
      } else {
        alert(response.data.message || 'Error approving enrollment');
      }
    } catch (error) {
      console.error('Error approving enrollment:', error);
      alert('Error approving enrollment');
    } finally {
      setFormLoading(false);
    }
  };

  const handlePricingTypeChange = (type: 'percentage' | 'fixed') => {
    setFormData(prev => ({
      ...prev,
      pricing_type: type,
      edited_first_year_percentage: type === 'percentage' ? prev.edited_first_year_percentage : null,
      edited_first_year_fixed_charge: type === 'fixed' ? prev.edited_first_year_fixed_charge : null
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    setFormLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = JSON.parse(localStorage.getItem('user') || '{}').id;

      const submitData = {
        approved: formData.approved,
        Admin_id: userId,
        updatedBy: userId,
        ...(formData.approved ? {} : {
          edited_enrollment_charge: formData.edited_enrollment_charge,
          edited_offer_letter_charge: formData.edited_offer_letter_charge,
          edited_first_year_percentage: formData.edited_first_year_percentage,
          edited_first_year_fixed_charge: formData.edited_first_year_fixed_charge
        })
      };

      const response = await axios.put(
        `${BASE_URL}/enrolled-clients/admin/approval/${selectedClient.id}`,
        submitData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setShowForm(false);
        setSelectedClient(null);
        fetchEnrolledClients();
        alert(formData.approved ? 'Enrollment approved successfully!' : 'Enrollment updated and sent back to sales!');
      } else {
        alert(response.data.message || 'Error processing enrollment');
      }
    } catch (error) {
      console.error('Error processing enrollment:', error);
      alert('Error processing enrollment');
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusBadge = (client: EnrolledClient) => {
    if (client.Approval_by_sales && client.Approval_by_admin) {
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Fully Approved</span>;
    } else if (client.Approval_by_admin && !client.has_update) {
      return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Admin Approved</span>;
    } else if (client.has_update) {
      return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending Sales Review</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">Pending Admin Review</span>;
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Not Set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getFilteredClients = () => {
    if (activeTab === 'all') {
      return enrolledClients;
    } else if (activeTab === 'approved') {
      return enrolledClients.filter(client => 
        client.Approval_by_admin && client.Approval_by_sales
      );
    } else if (activeTab === 'sales_pending') {
      return enrolledClients.filter(client => 
        client.has_update && !client.Approval_by_admin
      );
    } else if (activeTab === 'my_review') {
      return enrolledClients.filter(client => 
        client.packageid && !client.Approval_by_admin && !client.has_update
      );
    }
    return enrolledClients;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 ml-14 mt-14 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FaUserCog className="text-purple-600 text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Enrollment</h1>
                <p className="text-gray-600">Review and approve enrollment configurations</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FaGraduationCap className="text-purple-500" />
              <span>{getFilteredClients().length} Enrollments</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'all'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaGraduationCap className="inline mr-2" />
                All Enrollments
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'approved'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaCheckCircle className="inline mr-2" />
                Approved
              </button>
              <button
                onClick={() => setActiveTab('sales_pending')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'sales_pending'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaClock className="inline mr-2" />
                Sales Review Pending
              </button>
              <button
                onClick={() => setActiveTab('my_review')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'my_review'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaEdit className="inline mr-2" />
                My Review
              </button>
            </nav>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && selectedClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Review Enrollment</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Lead and Package Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Lead Information</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Name:</span> {selectedClient.lead.firstName} {selectedClient.lead.lastName}</div>
                      <div><span className="font-medium">Email:</span> {selectedClient.lead.primaryEmail}</div>
                      <div><span className="font-medium">Technology:</span> {selectedClient.lead.technology?.join(', ') || 'No technology specified'}</div>
                      <div><span className="font-medium">Visa Status:</span> {selectedClient.lead.visaStatus}</div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Package Information</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Package:</span> {selectedClient.package?.planName}</div>
                      <div><span className="font-medium">Base Enrollment:</span> {formatCurrency(selectedClient.package?.enrollmentCharge || 0)}</div>
                      <div><span className="font-medium">Base Offer Letter:</span> {formatCurrency(selectedClient.package?.offerLetterCharge || 0)}</div>
                      <div><span className="font-medium">Sales Person:</span> {selectedClient.salesPerson ? `${selectedClient.salesPerson.firstname} ${selectedClient.salesPerson.lastname}` : 'Not Assigned'}</div>
                    </div>
                  </div>
                </div>

                {/* Current Sales Configuration */}
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Current Sales Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Enrollment Charge:</span><br />
                      {formatCurrency(selectedClient.payable_enrollment_charge)}
                    </div>
                    <div>
                      <span className="font-medium">Offer Letter Charge:</span><br />
                      {formatCurrency(selectedClient.payable_offer_letter_charge)}
                    </div>
                    <div>
                      <span className="font-medium">First Year:</span><br />
                      {selectedClient.payable_first_year_percentage 
                        ? `${selectedClient.payable_first_year_percentage}%` 
                        : formatCurrency(selectedClient.payable_first_year_fixed_charge)}
                    </div>
                  </div>
                </div>

                {/* Approval Decision */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Approval Decision</h3>
                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="approval"
                        value="approve"
                        checked={formData.approved === true}
                        onChange={() => setFormData(prev => ({ ...prev, approved: true }))}
                        className="mr-2"
                      />
                      <FaCheckCircle className="text-green-500 mr-2" />
                      Approve as is
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="approval"
                        value="modify"
                        checked={formData.approved === false}
                        onChange={() => setFormData(prev => ({ ...prev, approved: false }))}
                        className="mr-2"
                      />
                      <FaEdit className="text-blue-500 mr-2" />
                      Modify and send back to sales
                    </label>
                  </div>
                </div>

                {/* Modification Form */}
                {formData.approved === false && (
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <h3 className="font-medium text-gray-900 mb-4">Modify Pricing</h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Modified Enrollment Charge
                        </label>
                        <input
                          type="number"
                          value={formData.edited_enrollment_charge || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, edited_enrollment_charge: Number(e.target.value) }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Modified Offer Letter Charge
                        </label>
                        <input
                          type="number"
                          value={formData.edited_offer_letter_charge || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, edited_offer_letter_charge: Number(e.target.value) }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Year Pricing Type
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="pricing_type"
                            value="percentage"
                            checked={formData.pricing_type === 'percentage'}
                            onChange={() => handlePricingTypeChange('percentage')}
                            className="mr-2"
                          />
                          Percentage
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="pricing_type"
                            value="fixed"
                            checked={formData.pricing_type === 'fixed'}
                            onChange={() => handlePricingTypeChange('fixed')}
                            className="mr-2"
                          />
                          Fixed Amount
                        </label>
                      </div>
                    </div>

                    <div>
                      {formData.pricing_type === 'percentage' ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Modified First Year Salary Percentage (%)
                          </label>
                          <input
                            type="number"
                            value={formData.edited_first_year_percentage || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, edited_first_year_percentage: Number(e.target.value) }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            placeholder="0.00"
                            step="0.01"
                            max="100"
                            min="0"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Modified First Year Fixed Charge ($)
                          </label>
                          <input
                            type="number"
                            value={formData.edited_first_year_fixed_charge || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, edited_first_year_fixed_charge: Number(e.target.value) }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {formLoading ? 'Processing...' : (formData.approved ? 'Approve' : 'Send Back to Sales')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Enrolled Clients Grid */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeTab === 'all' && 'All Enrollments'}
              {activeTab === 'approved' && 'Approved Enrollments'}
              {activeTab === 'sales_pending' && 'Sales Review Pending'}
              {activeTab === 'my_review' && 'My Review - Pending Admin Approval'}
            </h2>
            <p className="text-sm text-gray-600">
              {activeTab === 'all' && 'View all enrollment records'}
              {activeTab === 'approved' && 'View all approved enrollments'}
              {activeTab === 'sales_pending' && 'Enrollments sent back to sales for review'}
              {activeTab === 'my_review' && 'Review and approve enrollment configurations from sales team'}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Package & Sales Person
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pricing Configuration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredClients().map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {client.lead.firstName} {client.lead.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{client.lead.primaryEmail}</div>
                          <div className="text-xs text-gray-400">
                            {client.lead.technology?.join(', ') || 'No technology specified'} • {client.lead.visaStatus}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{client.package ? client.package.planName : 'Not Selected'}</div>
                        <div className="text-gray-500">
                          {client.salesPerson ? `${client.salesPerson.firstname} ${client.salesPerson.lastname}` : 'No Sales Person'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Enrollment: {formatCurrency(
                          activeTab === 'sales_pending' && client.edited_enrollment_charge !== null
                            ? client.edited_enrollment_charge
                            : client.payable_enrollment_charge
                        )}</div>
                        <div>Offer Letter: {formatCurrency(
                          activeTab === 'sales_pending' && client.edited_offer_letter_charge !== null
                            ? client.edited_offer_letter_charge
                            : client.payable_offer_letter_charge
                        )}</div>
                        <div>
                          First Year: {
                            activeTab === 'sales_pending' && client.edited_first_year_percentage !== null
                              ? `${client.edited_first_year_percentage}%`
                              : activeTab === 'sales_pending' && client.edited_first_year_fixed_charge !== null
                                ? formatCurrency(client.edited_first_year_fixed_charge)
                                : client.payable_first_year_percentage 
                                  ? `${client.payable_first_year_percentage}%` 
                                  : formatCurrency(client.payable_first_year_fixed_charge)
                          }
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(client)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {activeTab === 'my_review' && (
                          <>
                            <button
                              onClick={() => handleApprove(client)}
                              className="text-green-600 hover:text-green-900"
                              title="Quick Approve"
                            >
                              <FaCheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReview(client)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Review & Edit"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {activeTab === 'all' && (
                          <button
                            onClick={() => handleReview(client)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEnrollment; 