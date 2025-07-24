import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaCheckCircle, FaTimes, FaEdit, FaFilePdf, FaBox, FaInfoCircle } from 'react-icons/fa';

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5006/api";

interface EnrolledClient {
  id: number;
  lead_id: number;
  packageid: number | null;
  payable_enrollment_charge: number | null;
  payable_offer_letter_charge: number | null;
  payable_first_year_percentage: number | null;
  payable_first_year_fixed_charge: number | null;
  edited_offer_letter_charge: number | null;
  edited_first_year_percentage: number | null;
  edited_first_year_fixed_charge: number | null;
  Approval_by_sales: boolean;
  Sales_person_id: number | null;
  Approval_by_admin: boolean;
  Admin_id: number | null;
  has_update: boolean;
  offer_letter_has_update?: boolean;
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
  const [clients, setClients] = useState<EnrolledClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<EnrolledClient | null>(null);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');
  const [tabsData, setTabsData] = useState<TabsData>({});

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
        setClients(response.data.data[firstTabKey]?.leads || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (approved: boolean) => {
    if (!selectedClient) return;
    try {
      const token = localStorage.getItem('token');
      const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
      let enrollmentApproved = false;
      let offerLetterApproved = false;
      let firstYearApproved = false;
      // Detect which type of approval is needed
      const offerLetterPending = selectedClient.edited_offer_letter_charge !== null && selectedClient.edited_offer_letter_charge !== selectedClient.payable_offer_letter_charge;
      const firstYearPending = (selectedClient.edited_first_year_percentage !== null && selectedClient.edited_first_year_percentage !== selectedClient.payable_first_year_percentage) || (selectedClient.edited_first_year_fixed_charge !== null && selectedClient.edited_first_year_fixed_charge !== selectedClient.payable_first_year_fixed_charge);
      const enrollmentPending = selectedClient.has_update && !offerLetterPending && !firstYearPending;
      // Approve offer letter if pending
      if (offerLetterPending) {
        const response = await axios.put(
          `${BASE_URL}/enrolled-clients/offer-letter/admin/${selectedClient.id}`,
          {
            approved,
            Admin_id: userId,
            edited_offer_letter_charge: selectedClient.edited_offer_letter_charge
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        offerLetterApproved = response.data.success;
      }
      // Approve first year if pending
      if (firstYearPending) {
        const response = await axios.put(
          `${BASE_URL}/enrolled-clients/first-year/admin/${selectedClient.id}`,
          {
            approved,
            Admin_id: userId,
            edited_first_year_percentage: selectedClient.edited_first_year_percentage,
            edited_first_year_fixed_charge: selectedClient.edited_first_year_fixed_charge
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        firstYearApproved = response.data.success;
      }
      // Approve enrollment if pending
      if (enrollmentPending) {
        const response = await axios.put(
          `${BASE_URL}/enrolled-clients/accounts/admin/${selectedClient.id}`,
          {
            approved,
            admin_id: userId
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        enrollmentApproved = response.data.success;
      }
      if (enrollmentApproved || offerLetterApproved || firstYearApproved) {
        setShowApprovalForm(false);
        setSelectedClient(null);
        fetchClients();
        alert(approved ? 'Changes approved successfully!' : 'Changes rejected successfully!');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      alert('Error processing approval');
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Not Set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

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
      <div className="max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex">
            {Object.entries(tabsData).map(([tabKey, tabData]) => (
              <button
                key={tabKey}
                onClick={() => {
                  setActiveTab(tabKey);
                  setClients(tabData.leads);
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
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-[35px] font-bold">$</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Finance Admin</h1>
              <p className="text-gray-600 text-sm">Review and approve financial changes</p>
            </div>
          </div>
        </div>

        {/* Approval Form */}
        {showApprovalForm && selectedClient && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Review Changes</h2>
              <button
                onClick={() => {
                  setShowApprovalForm(false);
                  setSelectedClient(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-6">
              {/* Client Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Client Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {selectedClient.lead.firstName} {selectedClient.lead.lastName}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {selectedClient.lead.primaryEmail}
                  </div>
                  <div>
                    <span className="font-medium">Technology:</span> {selectedClient.lead.technology?.join(', ')}
                  </div>
                  <div>
                    <span className="font-medium">Visa Status:</span> {selectedClient.lead.visaStatus}
                  </div>
                </div>
              </div>

              {/* Changes Comparison */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Current Values</h3>
                  <div className="space-y-2 text-sm">
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

                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Proposed Changes</h3>
                  <div className="space-y-2 text-sm">
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
                  onClick={() => handleApproval(false)}
                  className="px-4 py-2 text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Reject Changes
                </button>
                <button
                  onClick={() => handleApproval(true)}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Approve Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clients Table */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Charges</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proposed Changes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredClients().map((client, idx) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {client.lead.firstName} {client.lead.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{client.lead.primaryEmail}</div>
                      <div className="text-xs text-gray-400">
                        {client.lead.technology?.join(', ')} • {client.lead.visaStatus}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FaBox className="text-blue-500" />
                        <span>{client.package?.planName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div>
                          <span className="text-sm font-medium">Offer Letter:</span><br />
                          {formatCurrency(client.payable_offer_letter_charge)}
                        </div>
                        <div>
                          <span className="text-sm font-medium">First Year:</span><br />
                          {client.payable_first_year_percentage 
                            ? `${client.payable_first_year_percentage}%` 
                            : formatCurrency(client.payable_first_year_fixed_charge)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {client.has_update ? (
                        <div className="space-y-1 text-blue-600">
                          <div>
                            <span className="text-sm font-medium">Offer Letter:</span><br />
                            {formatCurrency(client.edited_offer_letter_charge)}
                          </div>
                          <div>
                            <span className="text-sm font-medium">First Year:</span><br />
                            {client.edited_first_year_percentage 
                              ? `${client.edited_first_year_percentage}%` 
                              : formatCurrency(client.edited_first_year_fixed_charge)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No changes</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4">
                      {client.has_update && (
                        <button
                          onClick={() => {
                            setSelectedClient(client);
                            setShowApprovalForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Review Changes"
                        >
                          <FaEdit className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountAdmin; 