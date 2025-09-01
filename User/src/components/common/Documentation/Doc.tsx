import React, { useState } from 'react';
import { FaEdit, FaTimes, FaBox, FaCheckCircle } from 'react-icons/fa';

// Mock interfaces for documentation
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
  createdAt: string;
  lead: {
    firstName: string;
    lastName: string;
    primaryEmail: string;
    technology: string[];
    visaStatus: string;
    leadSource: string;
  };
  package: {
    planName: string;
  } | null;
}

interface FormData {
  packageid: number | null;
  payable_offer_letter_charge: number | null;
  payable_first_year_percentage: number | null;
  payable_first_year_fixed_charge: number | null;
  net_payable_first_year_price: number | null;
  first_year_salary: number | null;
  pricing_type: 'percentage' | 'fixed' | null;
}

interface Package {
  id: number;
  planName: string;
  offerLetterCharge: number;
  firstYearSalaryPercentage: number | null;
  firstYearFixedPrice: number | null;
}

// Mock data for documentation
const mockClients: EnrolledClient[] = [
  {
    id: 1,
    lead_id: 1,
    packageid: 1,
    payable_enrollment_charge: 500,
    payable_offer_letter_charge: 1200,
    payable_first_year_percentage: 15,
    payable_first_year_fixed_charge: null,
    net_payable_first_year_price: 12000,
    first_year_salary: 80000,
    createdAt: '2024-01-15',
    lead: {
      firstName: 'John',
      lastName: 'Doe',
      primaryEmail: 'john.doe@example.com',
      technology: ['React', 'Node.js'],
      visaStatus: 'H1B',
      leadSource: 'Portal'
    },
    package: {
      planName: 'Premium Plan'
    }
  },
  {
    id: 2,
    lead_id: 2,
    packageid: 2,
    payable_enrollment_charge: 300,
    payable_offer_letter_charge: 800,
    payable_first_year_percentage: null,
    payable_first_year_fixed_charge: 5000,
    net_payable_first_year_price: 5000,
    first_year_salary: null,
    createdAt: '2024-01-20',
    lead: {
      firstName: 'Jane',
      lastName: 'Smith',
      primaryEmail: 'jane.smith@example.com',
      technology: ['Java', 'Spring'],
      visaStatus: 'F1',
      leadSource: 'Manual'
    },
    package: {
      planName: 'Standard Plan'
    }
  }
];

const mockPackages: Package[] = [
  {
    id: 1,
    planName: 'Premium Plan',
    offerLetterCharge: 1200,
    firstYearSalaryPercentage: 15,
    firstYearFixedPrice: null
  },
  {
    id: 2,
    planName: 'Standard Plan',
    offerLetterCharge: 800,
    firstYearSalaryPercentage: null,
    firstYearFixedPrice: 5000
  }
];

const mockTabsData = {
  'Pending Review': {
    leads: mockClients,
    pagination: { totalItems: 2 }
  },
  'My Review': {
    leads: [],
    pagination: { totalItems: 0 }
  }
};

// Color themes for packages
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

/**
 * AccountSaleDoc - Documentation component for Account Sale functionality
 * 
 * This component demonstrates the pricing configuration form that allows sales personnel
 * to configure enrollment pricing for approved leads. It stops after the pricing section
 * without additional installment management features.
 * 
 * Key Features:
 * - Package selection (display only)
 * - Enrollment charge display
 * - Offer letter charge configuration
 * - First year pricing with percentage or fixed amount options
 * - Training requirement checkbox
 * - Form validation and submission
 */
export const AccountSaleDoc: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<EnrolledClient | null>(null);
  const [activeTab, setActiveTab] = useState<string>('Pending Review');
  const [formData, setFormData] = useState<FormData>({
    packageid: null,
    payable_offer_letter_charge: null,
    payable_first_year_percentage: null,
    payable_first_year_fixed_charge: null,
    net_payable_first_year_price: null,
    first_year_salary: null,
    pricing_type: null,
  });

  const handleEdit = (client: EnrolledClient) => {
    setSelectedClient(client);
    setShowForm(true);
    
    setFormData({
      packageid: client.packageid,
      payable_offer_letter_charge: client.payable_offer_letter_charge,
      payable_first_year_percentage: client.payable_first_year_percentage,
      payable_first_year_fixed_charge: client.payable_first_year_fixed_charge,
      net_payable_first_year_price: client.net_payable_first_year_price,
      first_year_salary: client.first_year_salary,
      pricing_type: client.payable_first_year_percentage ? 'percentage' : 'fixed',
    });
  };

  const handlePackageChange = (packageId: number) => {
    const selectedPackage = mockPackages.find(pkg => pkg.id === packageId);
    if (selectedPackage) {
      setFormData(prev => ({
        ...prev,
        packageid: packageId,
        payable_offer_letter_charge: selectedPackage.offerLetterCharge,
        payable_first_year_percentage: selectedPackage.firstYearSalaryPercentage,
        payable_first_year_fixed_charge: selectedPackage.firstYearFixedPrice,
        net_payable_first_year_price: selectedPackage.firstYearFixedPrice || null,
        first_year_salary: null,
        pricing_type: selectedPackage.firstYearSalaryPercentage ? 'percentage' : 'fixed',
      }));
    }
  };

  const handlePricingTypeChange = (type: 'percentage' | 'fixed') => {
    setFormData(prev => ({
      ...prev,
      pricing_type: type,
      payable_first_year_percentage: type === 'percentage' ? prev.payable_first_year_percentage : null,
      payable_first_year_fixed_charge: type === 'fixed' ? prev.payable_first_year_fixed_charge : null,
      net_payable_first_year_price: type === 'fixed' ? prev.payable_first_year_fixed_charge : null,
      first_year_salary: null
    }));
  };

  const handleFirstYearSalaryChange = (salary: number) => {
    setFormData(prev => {
      const percentage = prev.payable_first_year_percentage || 0;
      const netPayable = (salary * percentage) / 100;
      return {
        ...prev,
        first_year_salary: salary,
        net_payable_first_year_price: netPayable
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    // Validate first year salary is required when first year percentage is used
    if (formData.payable_first_year_percentage && !formData.first_year_salary) {
      alert('First year salary is required when first year percentage is used');
      return;
    }

    // Mock submission
    alert('Configuration submitted successfully! (Demo Mode)');
    setSelectedClient(null);
    setShowForm(false);
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Not Set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getFilteredClients = () => {
    return mockTabsData[activeTab]?.leads || [];
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <span className="text-blue-600 text-[35px] font-bold">$</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 text-left"> Enrolled Customers</h1>
            <p className="text-gray-600 text-sm text-start">Pricing configuration for enrolled clients</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex">
            {Object.entries(mockTabsData).map(([tabKey, tabData]) => (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey)}
                className={`py-3 px-6 border-b-2 font-medium text-base ${
                  activeTab === tabKey
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tabKey} ({tabData?.pagination?.totalItems || 0})
              </button>
            ))}
          </nav>
        </div>

        {/* Configuration Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Configure Enrollment Pricing</h2>
              <button
                onClick={() => {
                  setSelectedClient(null);
                  setShowForm(false);
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
                {selectedClient && (
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
                )}
              </div>

              {/* Package Selection and Pricing Configuration */}
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-3 gap-4">
                  {/* Package Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaBox className="inline mr-2" />
                      Selected Package
                    </label>
                    <select
                      value={formData.packageid || ''}
                      onChange={(e) => handlePackageChange(Number(e.target.value))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100 cursor-not-allowed"
                      required
                      disabled
                    >
                      <option value="">Select a package...</option>
                      {mockPackages.map(pkg => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.planName} - {formatCurrency(pkg.offerLetterCharge)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Enrollment Charge - Display Only */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enrollment Charge
                    </label>
                    <input
                      type="number"
                      value={selectedClient?.payable_enrollment_charge ?? ''}
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      disabled
                    />
                  </div>

                  {/* Offer Letter Charge */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Offer Letter Charge
                    </label>
                    <input
                      type="number"
                      value={formData.payable_offer_letter_charge ?? ''}
                      onChange={(e) => {
                        const newValue = Number(e.target.value);
                        setFormData(prev => ({
                          ...prev,
                          payable_offer_letter_charge: newValue,
                        }));
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                {/* First Year Pricing Configuration */}
                <div className="space-y-4">
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

                  {formData.pricing_type === 'percentage' ? (
                    <div className="grid grid-cols-3 gap-4">
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Year Salary ($)
                        </label>
                        <input
                          type="number"
                          value={formData.first_year_salary ?? ''}
                          onChange={(e) => handleFirstYearSalaryChange(Number(e.target.value))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Net Payable ($)
                        </label>
                        <input
                          type="number"
                          value={formData.net_payable_first_year_price ?? ''}
                          className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                          disabled
                          readOnly
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Year Fixed Charge ($)
                        </label>
                        <input
                          type="number"
                          value={formData.payable_first_year_fixed_charge ?? ''}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            setFormData(prev => ({ 
                              ...prev, 
                              payable_first_year_fixed_charge: value,
                              net_payable_first_year_price: value
                            }));
                          }}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Net Payable ($)
                        </label>
                        <input
                          type="number"
                          value={formData.net_payable_first_year_price ?? ''}
                          className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                          disabled
                          readOnly
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClient(null);
                    setShowForm(false);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Configuration
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Data Table */}
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
                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                              client.lead.leadSource === 'Manual' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {client.lead.leadSource}
                            </span>
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
                        {client.package?.planName || 'Not Selected'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-start">
                      {client.package && (
                        <div className={`${packageColorThemes[client.package.planName]?.bg || 'bg-gray-50'} 
                                 ${packageColorThemes[client.package.planName]?.border || 'border-gray-200'} 
                                 border rounded-lg p-3 space-y-2`}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Enrollment:</span>
                            <span className="text-sm text-gray-900">
                              {formatCurrency(client.payable_enrollment_charge)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Offer Letter:</span>
                            <span className="text-sm text-gray-900">
                              {formatCurrency(client.payable_offer_letter_charge)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">First Year:</span>
                            <span className="text-sm text-gray-900">
                              {client.payable_first_year_percentage
                                ? `${client.payable_first_year_percentage}%`
                                : formatCurrency(client.payable_first_year_fixed_charge)}
                            </span>
                          </div>
                        </div>
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

// Default export for use in documentation
export default AccountSaleDoc;