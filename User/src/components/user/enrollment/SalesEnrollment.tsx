import React, { useState, useEffect } from 'react';
import { FaEdit, FaTimes, FaUserTie, FaGraduationCap, FaBox, FaCheckCircle, FaClock, FaFilePdf, FaUpload, FaInfoCircle } from 'react-icons/fa';
import axios from 'axios';
import { motion } from 'framer-motion';
import PackageFeaturesPopup from './PackageFeaturesPopup';
import ConfirmationPopup from './ConfirmationPopup';

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
  resume: string | null;
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
  packageid: number | null;
  payable_enrollment_charge: number | null;
  payable_offer_letter_charge: number | null;
  payable_first_year_percentage: number | null;
  payable_first_year_fixed_charge: number | null;
  pricing_type: 'percentage' | 'fixed' | null;
}

const SalesEnrollment: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<EnrolledClient | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<'all' | 'approved' | 'admin_pending' | 'my_review'>('all');
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    packageid: null,
    payable_enrollment_charge: null,
    payable_offer_letter_charge: null,
    payable_first_year_percentage: null,
    payable_first_year_fixed_charge: null,
    pricing_type: null
  });
  const [enrollmentData, setEnrollmentData] = useState<any>(null);
  const [selectedResume, setSelectedResume] = useState<File | null>(null);
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPackageFeatures, setShowPackageFeatures] = useState(false);
  const [selectedPackageForFeatures, setSelectedPackageForFeatures] = useState<{name: string; features: string[]} | null>(null);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [pendingApprovalClient, setPendingApprovalClient] = useState<EnrolledClient | null>(null);

  const pageSize = 10;

  useEffect(() => {
    fetchEnrolledClients();
    fetchPackages();
  }, [currentPage, activeTab]);

  const fetchEnrolledClients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${BASE_URL}/enrolled-clients/sales/all?page=${currentPage}&limit=${pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.data.success) {
        setEnrollmentData(response.data.data);
        // Set total pages for the current tab
        let tabKey = 'AllEnrollments';
        if (activeTab === 'approved') tabKey = 'Approved';
        else if (activeTab === 'admin_pending') tabKey = 'AdminReviewPending';
        else if (activeTab === 'my_review') tabKey = 'MyReview';
        setTotalPages(response.data.data[tabKey]?.pagination?.totalPages || 1);
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

  const handleEdit = (client: EnrolledClient) => {
    setSelectedClient(client);
    setShowForm(true);
    
    // Set form data with existing values or defaults from package
    const selectedPackage = packages.find(pkg => pkg.id === client.packageid);
    
    setFormData({
      packageid: client.packageid,
      payable_enrollment_charge: client.payable_enrollment_charge || (selectedPackage?.enrollmentCharge || null),
      payable_offer_letter_charge: client.payable_offer_letter_charge || (selectedPackage?.offerLetterCharge || null),
      payable_first_year_percentage: client.payable_first_year_percentage || (selectedPackage?.firstYearSalaryPercentage || null),
      payable_first_year_fixed_charge: client.payable_first_year_fixed_charge || (selectedPackage?.firstYearFixedPrice || null),
      pricing_type: client.payable_first_year_percentage ? 'percentage' : 
                   client.payable_first_year_fixed_charge ? 'fixed' : 
                   (selectedPackage?.firstYearSalaryPercentage ? 'percentage' : 'fixed')
    });
  };

  const handlePackageChange = (packageId: number) => {
    const selectedPackage = packages.find(pkg => pkg.id === packageId);
    if (selectedPackage) {
      setFormData(prev => ({
        ...prev,
        packageid: packageId,
        payable_enrollment_charge: selectedPackage.enrollmentCharge,
        payable_offer_letter_charge: selectedPackage.offerLetterCharge,
        payable_first_year_percentage: selectedPackage.firstYearSalaryPercentage,
        payable_first_year_fixed_charge: selectedPackage.firstYearFixedPrice,
        pricing_type: selectedPackage.firstYearSalaryPercentage ? 'percentage' : 'fixed'
      }));
    }
  };

  const handlePricingTypeChange = (type: 'percentage' | 'fixed') => {
    setFormData(prev => ({
      ...prev,
      pricing_type: type,
      payable_first_year_percentage: type === 'percentage' ? prev.payable_first_year_percentage : null,
      payable_first_year_fixed_charge: type === 'fixed' ? prev.payable_first_year_fixed_charge : null
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
        ...formData,
        Sales_person_id: userId,
        updatedBy: userId
      };

      const response = await axios.put(
        `${BASE_URL}/enrolled-clients/sales/${selectedClient.id}`,
        submitData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSelectedClient(null);
        setShowUpdateForm(false);
        setShowForm(false);
        fetchEnrolledClients();
        alert(showUpdateForm ? 'Configuration updated and sent to admin for confirmation!' : 'Enrollment updated successfully!');
      } else {
        alert(response.data.message || 'Error updating enrollment');
      }
    } catch (error) {
      console.error('Error updating enrollment:', error);
      alert('Error updating enrollment');
    } finally {
      setFormLoading(false);
    }
  };

  const handleApprovalAction = async (approved: boolean) => {
    if (!selectedClient) return;

    setFormLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = JSON.parse(localStorage.getItem('user') || '{}').id;

      const response = await axios.put(
        `${BASE_URL}/enrolled-clients/sales/approval/${selectedClient.id}`,
        {
          approved,
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
        setSelectedClient(null);
        fetchEnrolledClients();
        alert('Admin changes approved!');
      } else {
        alert(response.data.message || 'Error processing approval');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      alert('Error processing approval');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateClick = () => {
    if (!selectedClient) return;
    
    // Pre-fill form with admin's modified configuration
    setFormData({
      packageid: selectedClient.packageid,
      payable_enrollment_charge: selectedClient.edited_enrollment_charge || selectedClient.payable_enrollment_charge,
      payable_offer_letter_charge: selectedClient.edited_offer_letter_charge || selectedClient.payable_offer_letter_charge,
      payable_first_year_percentage: selectedClient.edited_first_year_percentage || selectedClient.payable_first_year_percentage,
      payable_first_year_fixed_charge: selectedClient.edited_first_year_fixed_charge || selectedClient.payable_first_year_fixed_charge,
      pricing_type: selectedClient.edited_first_year_percentage ? 'percentage' : 'fixed'
    });
    
    setShowUpdateForm(true);
  };

  const getStatusBadge = (client: EnrolledClient) => {
    if (client.Approval_by_sales && client.Approval_by_admin) {
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Fully Approved</span>;
    } else if (client.has_update && !client.Approval_by_admin) {
      return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending Sales Review</span>;
    } else if (!client.packageid) {
      return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Not Configured</span>;
    } else if (client.packageid && !client.Approval_by_admin) {
      return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Pending Admin Review</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">In Review</span>;
    }
  };

  // Replace getFilteredClients to use backend data
  const getFilteredClients = (): EnrolledClient[] => {
    if (!enrollmentData) return [];
    if (activeTab === 'all') {
      return enrollmentData.AllEnrollments?.leads || [];
    } else if (activeTab === 'approved') {
      return enrollmentData.Approved?.leads || [];
    } else if (activeTab === 'admin_pending') {
      return enrollmentData.AdminReviewPending?.leads || [];
    } else if (activeTab === 'my_review') {
      return enrollmentData.MyReview?.leads || [];
    }
    return [];
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Not Set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Add resume upload handler
  const handleResumeUpload = async (file: File, clientId: number) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('resume', file);

      const response = await axios.post(
        `${BASE_URL}/enrolled-clients/${clientId}/resume`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        alert('Resume uploaded successfully!');
        fetchEnrolledClients(); // Refresh data
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Failed to upload resume');
    }
  };

  // Add resume preview handler
  const handleResumePreview = async (resumePath: string | null, clientId: number) => {
    if (!resumePath) {
      alert('No resume available');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/enrolled-clients/${clientId}/resume`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
      setShowResumePreview(true);
    } catch (error) {
      console.error('Error fetching resume:', error);
      alert('Failed to load resume');
    }
  };

  // Add handler for package features
  const handleShowFeatures = (packageName: string, features: string[]) => {
    setSelectedPackageForFeatures({ name: packageName, features });
    setShowPackageFeatures(true);
  };

  const handleApprovalIconClick = (client: EnrolledClient) => {
    setPendingApprovalClient(client);
    setShowConfirmPopup(true);
  };
  const handleConfirmApproval = async () => {
    if (pendingApprovalClient) {
      await handleApprovalAction(true);
      setShowConfirmPopup(false);
      setPendingApprovalClient(null);
    }
  };
  const handleCancelApproval = () => {
    setShowConfirmPopup(false);
    setPendingApprovalClient(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 ml-14 mt-10 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaUserTie className="text-blue-600 text-[35px]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 text-left">Sales Enrollment Managment</h1>
                <p className="text-gray-600 text-sm ">Manage enrolled clients and configure packages</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FaGraduationCap className="text-blue-500 " />
              <span>{enrollmentData?.AllEnrollments?.pagination?.totalItems || 0} Total Enrolled Clients</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-3 px-6 border-b-2 font-medium text-base ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaGraduationCap className="inline mr-2" />
                All Enrollments ({enrollmentData?.AllEnrollments?.pagination?.totalItems || 0})
              </button>
              <button
                onClick={() => setActiveTab('my_review')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'my_review'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaEdit className="inline mr-2" />
                My Review ({enrollmentData?.MyReview?.pagination?.totalItems || 0})
              </button>
              <button
                onClick={() => setActiveTab('admin_pending')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'admin_pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaClock className="inline mr-2" />
                Admin Review Pending ({enrollmentData?.AdminReviewPending?.pagination?.totalItems || 0})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'approved'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaCheckCircle className="inline mr-2" />
                Approved ({enrollmentData?.Approved?.pagination?.totalItems || 0})
              </button>
            </nav>
          </div>
        </div>

        {/* Configuration Form */}
        {activeTab === 'all' && showForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Configure Enrollment</h2>
            {selectedClient && (
              <button
                onClick={() => {
                  setSelectedClient(null);
                  setShowForm(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Lead Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-6 text-left ">Lead Information</h3>
              {selectedClient ? (
                <div className="grid grid-cols-2 gap-4 text-sm text-left">
                  <div>
                    <span className="font-medium">Name:</span> {selectedClient.lead.firstName} {selectedClient.lead.lastName}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {selectedClient.lead.primaryEmail}
                  </div>
                  <div>
                    <span className="font-medium">Technology:</span> {selectedClient.lead.technology?.join(', ') || 'No technology specified'}
                  </div>
                  <div>
                    <span className="font-medium">Visa Status:</span> {selectedClient.lead.visaStatus}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>Select an enrolled client from the table below to view lead information</p>
                </div>
              )}
            </div>

            {/* Package Selection and Pricing Configuration */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaBox className="inline mr-2" />
                  Select Package
                </label>
                <select
                  value={formData.packageid || ''}
                  onChange={(e) => handlePackageChange(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={!selectedClient}
                  required
                >
                  <option value="">Select a package...</option>
                  {packages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.planName} - {formatCurrency(pkg.enrollmentCharge)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enrollment Charge
                </label>
                <input
                  type="number"
                  value={formData.payable_enrollment_charge ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, payable_enrollment_charge: Number(e.target.value) }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="0.00"
                  step="0.01"
                  disabled={!selectedClient}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Offer Letter Charge
                </label>
                <input
                  type="number"
                  value={formData.payable_offer_letter_charge ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, payable_offer_letter_charge: Number(e.target.value) }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="0.00"
                  step="0.01"
                  disabled={!selectedClient}
                  required
                />
              </div>
            </div>

            {/* First Year Pricing Type and Value */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Year Pricing Type
                </label>
                <div className="flex gap-4 p-3 border border-gray-300 rounded-lg bg-gray-50">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="pricing_type"
                      value="percentage"
                      checked={formData.pricing_type === 'percentage'}
                      onChange={() => handlePricingTypeChange('percentage')}
                      className="mr-2"
                      disabled={!selectedClient || !!(formData.packageid && packages.find(pkg => pkg.id === formData.packageid)?.firstYearFixedPrice && !packages.find(pkg => pkg.id === formData.packageid)?.firstYearSalaryPercentage)}
                    />
                    <span className={!selectedClient || (formData.packageid && packages.find(pkg => pkg.id === formData.packageid)?.firstYearFixedPrice && !packages.find(pkg => pkg.id === formData.packageid)?.firstYearSalaryPercentage) ? 'text-gray-400' : ''}>Percentage</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="pricing_type"
                      value="fixed"
                      checked={formData.pricing_type === 'fixed'}
                      onChange={() => handlePricingTypeChange('fixed')}
                      className="mr-2"
                      disabled={!selectedClient || !!(formData.packageid && packages.find(pkg => pkg.id === formData.packageid)?.firstYearSalaryPercentage && !packages.find(pkg => pkg.id === formData.packageid)?.firstYearFixedPrice)}
                    />
                    <span className={!selectedClient || (formData.packageid && packages.find(pkg => pkg.id === formData.packageid)?.firstYearSalaryPercentage && !packages.find(pkg => pkg.id === formData.packageid)?.firstYearFixedPrice) ? 'text-gray-400' : ''}>Fixed Amount</span>
                  </label>
                </div>
              </div>
              <div>
                {formData.pricing_type === 'percentage' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Year Salary Percentage (%)
                    </label>
                    <input
                      type="number"
                      value={formData.payable_first_year_percentage ?? ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, payable_first_year_percentage: Number(e.target.value) }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="0.00"
                      step="0.01"
                      max="100"
                      min="0"
                      disabled={!selectedClient}
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Year Fixed Charge ($)
                    </label>
                    <input
                      type="number"
                      value={formData.payable_first_year_fixed_charge ?? ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, payable_first_year_fixed_charge: Number(e.target.value) }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      disabled={!selectedClient}
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Add Resume Upload Section before Form Actions */}
            <div className="mt-6 border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-4 text-left">Resume Upload</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  {/* <label className="block text-sm font-medium text-gray-700 mb-4 text-left">
                    <FaFilePdf className="inline mr-2" />
                    Upload Resume (PDF only)
                  </label> */}
                  <label className="mt-1 flex justify-center px-4 py-4 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 transition-colors bg-blue-50 cursor-pointer w-[400px]">
                    <input
                      type="file"
                      name="resume"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && selectedClient) {
                          handleResumeUpload(file, selectedClient.id);
                        }
                      }}
                    />
                    <div className="space-y-1 text-center">
                      <FaUpload className="mx-auto h-8 w-8 text-blue-400" />
                      <p className="text-sm text-gray-600">
                        <span className="text-blue-600">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PDF up to 5MB</p>
                    </div>
                  </label>
                  {selectedResume && (
                    <p className=" text-start mt-4 text-sm text-gray-600">
                      Selected file: {selectedResume.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setSelectedClient(null);
                  setShowForm(false);
                  setFormData({
                    packageid: null,
                    payable_enrollment_charge: null,
                    payable_offer_letter_charge: null,
                    payable_first_year_percentage: null,
                    payable_first_year_fixed_charge: null,
                    pricing_type: null
                  });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={!selectedClient}
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={formLoading || !selectedClient}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formLoading ? 'Updating...' : 'Update Enrollment'}
              </button>
            </div>
          </form>
        </div>
        )}

        {/* Review Form for My Review Tab */}
        {activeTab === 'my_review' && selectedClient && !showUpdateForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Review Admin Changes</h2>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-6">
              {/* Lead Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Lead Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {selectedClient.lead.firstName} {selectedClient.lead.lastName}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {selectedClient.lead.primaryEmail}
                  </div>
                  <div>
                    <span className="font-medium">Technology:</span> {selectedClient.lead.technology?.join(', ') || 'No technology specified'}
                  </div>
                  <div>
                    <span className="font-medium">Visa Status:</span> {selectedClient.lead.visaStatus}
                  </div>
                </div>
              </div>

              {/* Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Original Sales Configuration */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Your Original Configuration</h3>
                  <div className="space-y-2 text-sm">
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

                {/* Admin Changes */}
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Admin's Modified Configuration</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Enrollment Charge:</span><br />
                      {formatCurrency(selectedClient.edited_enrollment_charge)}
                    </div>
                    <div>
                      <span className="font-medium">Offer Letter Charge:</span><br />
                      {formatCurrency(selectedClient.edited_offer_letter_charge)}
                    </div>
                    <div>
                      <span className="font-medium">First Year:</span><br />
                      {selectedClient.edited_first_year_percentage 
                        ? `${selectedClient.edited_first_year_percentage}%` 
                        : formatCurrency(selectedClient.edited_first_year_fixed_charge)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setSelectedClient(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateClick}
                  disabled={formLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Update Configuration
                </button>
                <button
                  onClick={() => handleApprovalAction(true)}
                  disabled={formLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {formLoading ? 'Processing...' : 'Approve Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Update Form for My Review Tab */}
        {activeTab === 'my_review' && selectedClient && showUpdateForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Update Admin Configuration</h2>
              <button
                onClick={() => {
                  setShowUpdateForm(false);
                  setSelectedClient(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Lead Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Lead Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {selectedClient.lead.firstName} {selectedClient.lead.lastName}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {selectedClient.lead.primaryEmail}
                  </div>
                  <div>
                    <span className="font-medium">Technology:</span> {selectedClient.lead.technology?.join(', ') || 'No technology specified'}
                  </div>
                  <div>
                    <span className="font-medium">Visa Status:</span> {selectedClient.lead.visaStatus}
                  </div>
                </div>
              </div>

              {/* Package Selection and Pricing Configuration */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaBox className="inline mr-2" />
                    Selected Package
                  </label>
                  <select
                    value={formData.packageid || ''}
                    onChange={(e) => handlePackageChange(Number(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a package...</option>
                    {packages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.planName} - {formatCurrency(pkg.enrollmentCharge)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enrollment Charge
                  </label>
                  <input
                    type="number"
                    value={formData.payable_enrollment_charge ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, payable_enrollment_charge: Number(e.target.value) }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Offer Letter Charge
                  </label>
                  <input
                    type="number"
                    value={formData.payable_offer_letter_charge ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, payable_offer_letter_charge: Number(e.target.value) }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              {/* First Year Pricing Type and Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Year Pricing Type
                  </label>
                  <div className="flex gap-4 p-3 border border-gray-300 rounded-lg bg-gray-50">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="pricing_type"
                        value="percentage"
                        checked={formData.pricing_type === 'percentage'}
                        onChange={() => handlePricingTypeChange('percentage')}
                        className="mr-2"
                      />
                      <span>Percentage</span>
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
                      <span>Fixed Amount</span>
                    </label>
                  </div>
                </div>
                <div>
                  {formData.pricing_type === 'percentage' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Year Salary Percentage (%)
                      </label>
                      <input
                        type="number"
                        value={formData.payable_first_year_percentage ?? ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, payable_first_year_percentage: Number(e.target.value) }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        step="0.01"
                        max="100"
                        min="0"
                        required
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Year Fixed Charge ($)
                      </label>
                      <input
                        type="number"
                        value={formData.payable_first_year_fixed_charge ?? ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, payable_first_year_fixed_charge: Number(e.target.value) }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdateForm(false);
                    setSelectedClient(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {formLoading ? 'Updating...' : 'Send Updated Configuration'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Resume Preview Modal */}
        {showResumePreview && previewUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl h-[95vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Resume Preview</h2>
                <button
                  onClick={() => {
                    setShowResumePreview(false);
                    if (previewUrl) {
                      window.URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                    }
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="flex-1 h-full">
                <iframe
                  src={previewUrl}
                  className="w-full h-full rounded-lg border-0"
                  title="Resume Preview"
                />
              </div>
            </motion.div>
          </div>
        )}

        {/* Add Package Features Popup */}
        {selectedPackageForFeatures && (
          <PackageFeaturesPopup
            isOpen={showPackageFeatures}
            onClose={() => {
              setShowPackageFeatures(false);
              setSelectedPackageForFeatures(null);
            }}
            packageName={selectedPackageForFeatures.name}
            features={selectedPackageForFeatures.features}
          />
        )}

        {/* Enrolled Clients Grid */}
        <div className="bg-white rounded-xl shadow-sm">
          {/* <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeTab === 'all' && 'All Enrolled Clients'}
              {activeTab === 'approved' && 'Approved Enrollments'}
              {activeTab === 'admin_pending' && 'Admin Review Pending'}
              {activeTab === 'my_review' && 'My Review - Admin Changes'}
            </h2>
            <p className="text-sm text-gray-600">
              {activeTab === 'all' && 'Configure packages and pricing for enrolled clients'}
              {activeTab === 'approved' && 'View all approved enrollments'}
              {activeTab === 'admin_pending' && 'Enrollments pending admin review'}
              {activeTab === 'my_review' && 'Review and approve/reject admin changes'}
            </p>
          </div> */}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Package
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pricing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resume
                  </th>
                  {activeTab !== 'approved' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredClients().map((client: EnrolledClient, idx: number) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-start">{(currentPage - 1) * pageSize + idx + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-start">
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
                    <td className="px-6 py-4 whitespace-nowrap text-start">
                      <div className="text-sm text-gray-900 flex items-center gap-2">
                        {client.package ? (
                          <>
                            <button
                              onClick={() => handleShowFeatures(client.package!.planName, client.package!.features)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Package Features"
                            >
                              <FaInfoCircle className="w-4 h-4" />
                            </button>
                            {client.package.planName}
                          </>
                        ) : (
                          'Not Selected'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-start">
                      <div className="text-sm text-gray-900">
                        <div>Enrollment: {formatCurrency(
                          activeTab === 'approved'
                            ? (client.edited_enrollment_charge !== null ? client.edited_enrollment_charge : client.payable_enrollment_charge)
                            : (activeTab === 'my_review' && client.edited_enrollment_charge !== null)
                            ? client.edited_enrollment_charge
                            : client.payable_enrollment_charge
                        )}</div>
                        <div>Offer Letter: {formatCurrency(
                          activeTab === 'approved'
                            ? (client.edited_offer_letter_charge !== null ? client.edited_offer_letter_charge : client.payable_offer_letter_charge)
                            : (activeTab === 'my_review' && client.edited_offer_letter_charge !== null)
                            ? client.edited_offer_letter_charge
                            : client.payable_offer_letter_charge
                        )}</div>
                        <div>
                          First Year: {
                            activeTab === 'approved'
                              ? (client.edited_first_year_percentage !== null
                              ? `${client.edited_first_year_percentage}%`
                                  : client.edited_first_year_fixed_charge !== null
                                    ? formatCurrency(client.edited_first_year_fixed_charge)
                                    : client.payable_first_year_percentage
                                      ? `${client.payable_first_year_percentage}%`
                                      : formatCurrency(client.payable_first_year_fixed_charge)
                                )
                              : (activeTab === 'my_review' && client.edited_first_year_percentage !== null)
                                ? `${client.edited_first_year_percentage}%`
                              : (activeTab === 'my_review' && client.edited_first_year_fixed_charge !== null)
                                ? formatCurrency(client.edited_first_year_fixed_charge)
                                : client.payable_first_year_percentage 
                                  ? `${client.payable_first_year_percentage}%` 
                                  : formatCurrency(client.payable_first_year_fixed_charge)
                          }
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-start">
                      {getStatusBadge(client)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-start">
                      {client.resume ? (
                        <button
                          onClick={() => handleResumePreview(client.resume, client.id)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-2"
                          title="View Resume"
                        >
                          <FaFilePdf className="w-4 h-4" />
                          <span>View</span>
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">No Resume</span>
                      )}
                    </td>
                    {activeTab !== 'approved' && (
                      <td className="px-6 py-4 whitespace-nowrap text-start text-sm font-medium">
                      {activeTab === 'all' && !(client.Approval_by_sales && client.Approval_by_admin) && (
                        <button
                          onClick={() => handleEdit(client)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="Configure"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                      )}
                      {activeTab === 'my_review' && (
                        <button
                          onClick={() => {
                            setSelectedClient(client);
                            setShowUpdateForm(false);
                          }}
                          className="text-purple-600 hover:text-purple-900"
                          title="Review Changes"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                    )}
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

      {/* Render ConfirmationPopup for approval */}
      <ConfirmationPopup
        open={showConfirmPopup}
        message="Are you sure you want to approve?"
        onConfirm={handleConfirmApproval}
        onCancel={handleCancelApproval}
      />
    </div>
  );
};

export default SalesEnrollment; 