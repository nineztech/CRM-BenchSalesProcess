import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaCheckCircle, FaEdit, FaListAlt } from 'react-icons/fa';
import ConfirmationPopup from '../enrollment/ConfirmationPopup';
import AdminConfigurationPopup from './AdminConfigurationPopup';
import InstallmentsPopup from '../enrollment/InstallmentsPopup';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5006/api";

interface EnrolledClient {
  id: number;
  lead_id: number;
  packageid: number | null;
  payable_enrollment_charge: number | null;
  payable_offer_letter_charge: number | null;
  payable_first_year_percentage: number | null;
  payable_first_year_fixed_charge: number | null;
  net_payable_first_year_price: number | null;
  first_year_salary: number | null;
  edited_offer_letter_charge: number | null;
  edited_first_year_percentage: number | null;
  edited_first_year_fixed_charge: number | null;
  edited_net_payable_first_year_price: number | null;
  edited_first_year_salary: number | null;
  Approval_by_sales: boolean;
  Sales_person_id: number | null;
  Approval_by_admin: boolean;
  Admin_id: number | null;
  has_update: boolean;
  final_approval_sales: boolean;
  final_approval_by_admin: boolean;
  has_update_in_final: boolean;
  is_training_required: boolean;
  first_call_status: 'pending' | 'onhold' | 'done';
  resume: string | null;
  createdAt: string;
  lead: {
    firstName: string;
    lastName: string;
    primaryEmail: string;
    technology: string[];
    visaStatus: string;
  };
  package: {
    planName: string;
    features: string[];
  } | null;
}

// Add color themes mapping
const packageColorThemes: { [key: string]: { bg: string; border: string; text: string } } = {
  'Premium Plan': {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-600'
  },
  'Standard Plan': {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-600'
  },
  'Basic Plan': {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-600'
  }
};

interface TabData {
  leads: EnrolledClient[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface TabsData {
  [key: string]: TabData;
}

const AccountAdmin: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('');
  const [tabsData, setTabsData] = useState<TabsData>({});
  const [pendingApprovalClient, setPendingApprovalClient] = useState<EnrolledClient | null>(null);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [showConfigurationPopup, setShowConfigurationPopup] = useState(false);
  const [selectedClientForEdit, setSelectedClientForEdit] = useState<EnrolledClient | null>(null);
  const [showInstallmentsPopup, setShowInstallmentsPopup] = useState(false);
  const [selectedClientForInstallments, setSelectedClientForInstallments] = useState<EnrolledClient | null>(null);
  const [installmentChargeType, setInstallmentChargeType] = useState<'enrollment_charge' | 'offer_letter_charge' | 'first_year_charge'>('enrollment_charge');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/enrolled-clients/accounts/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.data.success) {
        setTabsData(response.data.data);
        // Set active tab to first tab by default
        const firstTabKey = Object.keys(response.data.data)[0];
        setActiveTab(firstTabKey);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (approved: boolean) => {
    const client = pendingApprovalClient;
    if (!client) return;
    try {
      const token = localStorage.getItem('token');
      const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
      let finalApproved = false;
      
      // Detect if final approval is needed
      const finalPending = client.has_update_in_final;
      
      // Approve final configuration if pending
      if (finalPending) {
        const response = await axios.put(
          `${BASE_URL}/enrolled-clients/final-configuration/admin/${client.id}`,
          {
            approved,
            Admin_id: userId,
            edited_offer_letter_charge: client.edited_offer_letter_charge,
            edited_first_year_percentage: client.edited_first_year_percentage,
            edited_first_year_fixed_charge: client.edited_first_year_fixed_charge,
            edited_net_payable_first_year_price: client.edited_net_payable_first_year_price,
            edited_first_year_salary: client.edited_first_year_salary
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        finalApproved = response.data.success;
      }
      
      if (finalApproved) {
        fetchClients();
        toast.success(approved ? 'Changes approved successfully!' : 'Changes sent back to sales for review!');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error('Error processing approval');
    }
  };

  // Add new function for admin to make changes and send back to sales
  // const handleAdminChanges = async (client: EnrolledClient) => {
  //   // This will be handled by the AdminConfigurationPopup component
  //   setSelectedClientForEdit(client);
  //   setShowConfigurationPopup(true);
  // };

  const handleApprovalIconClick = (client: EnrolledClient) => {
    setPendingApprovalClient(client);
    setShowConfirmPopup(true);
  };

  const handleConfirmApproval = async () => {
    if (pendingApprovalClient) {
      await handleApproval(true);
      setShowConfirmPopup(false);
      setPendingApprovalClient(null);
    }
  };

  const handleCancelApproval = () => {
    setShowConfirmPopup(false);
    setPendingApprovalClient(null);
  };

  const handleReview = (client: EnrolledClient) => {
    setSelectedClientForEdit(client);
    setShowConfigurationPopup(true);
  };

  const handleViewInstallments = (client: EnrolledClient, chargeType: 'enrollment_charge' | 'offer_letter_charge' | 'first_year_charge') => {
    setSelectedClientForInstallments(client);
    setInstallmentChargeType(chargeType);
    setShowInstallmentsPopup(true);
  };

  // const handleFirstCallStatusChange = async (client: EnrolledClient, newStatus: 'pending' | 'onhold' | 'done') => {
  //   try {
  //     const token = localStorage.getItem('token');
  //     const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
      
  //     const response = await axios.put(
  //       `${BASE_URL}/enrolled-clients/first-call-status/${client.id}`,
  //       {
  //         first_call_status: newStatus,
  //         updatedBy: userId
  //       },
  //       {
  //         headers: {
  //           'Authorization': `Bearer ${token}`,
  //           'Content-Type': 'application/json'
  //         }
  //       }
  //     );
      
  //     if (response.data.success) {
  //       toast.success('First call status updated successfully!');
  //       fetchClients();
  //     }
  //   } catch (error) {
  //     console.error('Error updating first call status:', error);
  //     toast.error('Error updating first call status');
  //   }
  // };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Not Set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // const getFirstCallStatus = () => {
  //   const statuses = ['pending', 'onhold', 'Done'];
  //   const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  //   let badgeColor = '';
  //   if (randomStatus === 'pending') badgeColor = 'bg-yellow-100 text-yellow-800';
  //   else if (randomStatus === 'onhold') badgeColor = 'bg-red-100 text-red-800';
  //   else badgeColor = 'bg-green-100 text-green-800';
  //   return <span className={`px-2 py-1 text-xs font-medium rounded-full ${badgeColor}`}>{randomStatus}</span>;
  // };

  // Update getFilteredClients to use tabsData
  const getFilteredClients = () => {
    return tabsData[activeTab]?.leads || [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 ml-14 mt-10 bg-gray-50 min-h-screen">
         <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-[30px] font-bold">$</span>
            </div>
            <div>
              <h1 className="text-xl text-start font-bold text-gray-900">Finance Admin</h1>
              <p className="text-gray-600 text-start text-sm">Review and approve financial changes</p>
            </div>
          </div>
        </div>
      <div className="max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex">
            {Object.entries(tabsData).map(([tabKey, tabData]) => (
              <button
                key={tabKey}
                onClick={() => {
                  setActiveTab(tabKey);
                }}
                className={`py-3 px-6 border-b-2 font-medium text-base ${
                  activeTab === tabKey
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tabKey} ({tabData.pagination.totalItems})
              </button>
            ))}
          </nav>
        </div>
        {/* Header */}
     



        {/* Clients Table */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Enrolled Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pricing</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Training</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">First Call Status</th>
                  {(activeTab === 'my_review' || activeTab === 'My Review' || activeTab === 'my review') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredClients().map((client, idx) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-start">{idx + 1}</td>
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
                      <span className="text-sm text-gray-900">
                        {new Date(client.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-start">
                      <div className="text-sm text-gray-900 flex items-center gap-2">
                        {client.package ? (
                          <>{client.package.planName}</>
                        ) : (
                          'Not Selected'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-start">
                      {client.package && (
                        <div className={`${packageColorThemes[client.package.planName]?.bg || 'bg-gray-50'} 
                                 ${packageColorThemes[client.package.planName]?.border || 'border-gray-200'} 
                                 border rounded-lg p-3 space-y-2`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewInstallments(client, 'enrollment_charge')}
                                className={`${packageColorThemes[client.package.planName]?.text || 'text-gray-600'} hover:opacity-75 transition-opacity`}
                                title="View Enrollment Installments"
                              >
                                <FaListAlt className="w-4 h-4" />
                              </button>
                              <span className="text-sm font-medium text-gray-700">Enrollment:</span>
                            </div>
                            <span className="text-sm text-gray-900">
                              {formatCurrency(client.payable_enrollment_charge)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewInstallments(client, 'offer_letter_charge')}
                                className={`${packageColorThemes[client.package.planName]?.text || 'text-gray-600'} hover:opacity-75 transition-opacity`}
                                title="View Offer Letter Installments"
                              >
                                <FaListAlt className="w-4 h-4" />
                              </button>
                              <span className="text-sm font-medium text-gray-700">Offer Letter:</span>
                            </div>
                            <span className="text-sm text-gray-900">
                              {formatCurrency(client.payable_offer_letter_charge)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewInstallments(client, 'first_year_charge')}
                                className={`${packageColorThemes[client.package.planName]?.text || 'text-gray-600'} hover:opacity-75 transition-opacity`}
                                title="View First Year Installments"
                              >
                                <FaListAlt className="w-4 h-4" />
                              </button>
                              <span className="text-sm font-medium text-gray-700">First Year:</span>
                            </div>
                            <span className="text-sm text-gray-900">
                              {client.payable_first_year_percentage 
                                ? `${client.payable_first_year_percentage}%` 
                                : formatCurrency(client.payable_first_year_fixed_charge)}
                            </span>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-start">
                      {client.has_update ? (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          Pending Review
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Approved
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-start">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        client.is_training_required 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {client.is_training_required ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-start">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        client.first_call_status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : client.first_call_status === 'onhold'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {client.first_call_status}
                      </span>
                    </td>
                    {(activeTab === 'my_review' || activeTab === 'My Review' || activeTab === 'my review') && (
                      <td className="px-6 py-4 whitespace-nowrap text-start text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprovalIconClick(client)}
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
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <ConfirmationPopup
        open={showConfirmPopup}
        onConfirm={handleConfirmApproval}
        onCancel={handleCancelApproval}
        message="Are you sure you want to approve these changes?"
      />

      <AdminConfigurationPopup
        isOpen={showConfigurationPopup}
        onClose={() => {
          setShowConfigurationPopup(false);
          setSelectedClientForEdit(null);
        }}
        client={selectedClientForEdit}
        onSuccess={fetchClients}
      />

      {showInstallmentsPopup && selectedClientForInstallments && (
        <InstallmentsPopup
          isOpen={showInstallmentsPopup}
          onClose={() => {
            setShowInstallmentsPopup(false);
            setSelectedClientForInstallments(null);
          }}
          enrolledClientId={selectedClientForInstallments.id}
          totalCharge={
            installmentChargeType === 'enrollment_charge' 
              ? selectedClientForInstallments.payable_enrollment_charge
              : installmentChargeType === 'offer_letter_charge'
                ? selectedClientForInstallments.payable_offer_letter_charge
                : selectedClientForInstallments.net_payable_first_year_price
          }
          isMyReview={true}
          editedTotalCharge={
            installmentChargeType === 'enrollment_charge' 
              ? selectedClientForInstallments.payable_offer_letter_charge
              : installmentChargeType === 'offer_letter_charge'
                ? selectedClientForInstallments.payable_offer_letter_charge
                : selectedClientForInstallments.net_payable_first_year_price
          }
          chargeType={installmentChargeType}
          firstYearSalary={installmentChargeType === 'first_year_charge' ? selectedClientForInstallments.first_year_salary : undefined}
          netPayableFirstYear={installmentChargeType === 'first_year_charge' ? selectedClientForInstallments.net_payable_first_year_price : undefined}
        />
      )}
    </div>
  );
};

export default AccountAdmin; 