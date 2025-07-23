import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaFilePdf, FaEdit, FaTimes, FaBox, FaPlus, FaTrash, FaListAlt } from 'react-icons/fa';

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
  createdBy: number;
  updatedBy: number | null;
  resume: string | null;
  createdAt: string;
  updatedAt: string;
  lead: {
    id: number;
    firstName: string;
    lastName: string;
    primaryEmail: string;
    status: string;
    technology: string[];
    country: string;
    visaStatus: string;
  };
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
  package: {
    id: number;
    planName: string;
    enrollmentCharge: number;
    offerLetterCharge: number;
    firstYearSalaryPercentage: number | null;
    firstYearFixedPrice: number | null;
    features: string[];
  } | null;
}

interface FormData {
  packageid: number | null;
  payable_enrollment_charge: number | null;
  payable_offer_letter_charge: number | null;
  payable_first_year_percentage: number | null;
  payable_first_year_fixed_charge: number | null;
  pricing_type: 'percentage' | 'fixed' | null;
  enrollment_installments: Installment[];
  initial_payment: number | null;
}

interface Installment {
  amount: number;
  dueDate: string;
  remark: string;
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

const AccountSale: React.FC = () => {
  const [clients, setClients] = useState<EnrolledClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<EnrolledClient | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [formData, setFormData] = useState<FormData>({
    packageid: null,
    payable_enrollment_charge: null,
    payable_offer_letter_charge: null,
    payable_first_year_percentage: null,
    payable_first_year_fixed_charge: null,
    pricing_type: null,
    enrollment_installments: [],
    initial_payment: null
  });
  const [showInitialPayment, setShowInitialPayment] = useState(false);
  const [hasInstallmentError, setHasInstallmentError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${BASE_URL}/enrolled-clients/sales/all`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.data.success) {
          setClients(response.data.data.Approved.leads || []);
        }
      } catch (error) {
        setClients([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    fetchPackages();
  }, []);

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

  const handleEdit = async (client: EnrolledClient) => {
    setSelectedClient(client);
    setShowForm(true);
    
    const selectedPackage = packages.find(pkg => pkg.id === client.packageid);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${BASE_URL}/installments/enrolled-client/${client.id}?charge_type=enrollment_charge`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const existingInstallments = response.data.success ? response.data.data.installments : [];
      const hasInstallments = existingInstallments.length > 0;

      let initialPayment = client.payable_enrollment_charge;
      if (hasInstallments) {
        const totalInstallments = existingInstallments.reduce((sum: number, inst: any) => sum + Number(inst.amount), 0);
        initialPayment = (client.payable_enrollment_charge || 0) - totalInstallments;
        setShowInitialPayment(true);
      }
      
      setFormData({
        packageid: client.packageid,
        payable_enrollment_charge: client.payable_enrollment_charge || (selectedPackage?.enrollmentCharge || null),
        payable_offer_letter_charge: client.payable_offer_letter_charge || (selectedPackage?.offerLetterCharge || null),
        payable_first_year_percentage: client.payable_first_year_percentage || (selectedPackage?.firstYearSalaryPercentage || null),
        payable_first_year_fixed_charge: client.payable_first_year_fixed_charge || (selectedPackage?.firstYearFixedPrice || null),
        pricing_type: client.payable_first_year_percentage ? 'percentage' : 
                     client.payable_first_year_fixed_charge ? 'fixed' : 
                     (selectedPackage?.firstYearSalaryPercentage ? 'percentage' : 'fixed'),
        enrollment_installments: existingInstallments.map((inst: any) => ({
          amount: Number(inst.amount),
          dueDate: inst.dueDate,
          remark: inst.remark || ''
        })),
        initial_payment: initialPayment
      });

    } catch (error) {
      console.error('Error fetching installments:', error);
      alert('Error fetching existing installments');
      
      setFormData({
        packageid: client.packageid,
        payable_enrollment_charge: client.payable_enrollment_charge || (selectedPackage?.enrollmentCharge || null),
        payable_offer_letter_charge: client.payable_offer_letter_charge || (selectedPackage?.offerLetterCharge || null),
        payable_first_year_percentage: client.payable_first_year_percentage || (selectedPackage?.firstYearSalaryPercentage || null),
        payable_first_year_fixed_charge: client.payable_first_year_fixed_charge || (selectedPackage?.firstYearFixedPrice || null),
        pricing_type: client.payable_first_year_percentage ? 'percentage' : 
                     client.payable_first_year_fixed_charge ? 'fixed' : 
                     (selectedPackage?.firstYearSalaryPercentage ? 'percentage' : 'fixed'),
        enrollment_installments: [],
        initial_payment: client.payable_enrollment_charge
      });
    }
  };

  const handlePackageChange = (packageId: number) => {
    const selectedPackage = packages.find(pkg => pkg.id === packageId);
    if (selectedPackage) {
      setShowInitialPayment(false);
      setFormData(prev => ({
        ...prev,
        packageid: packageId,
        payable_enrollment_charge: selectedPackage.enrollmentCharge,
        payable_offer_letter_charge: selectedPackage.offerLetterCharge,
        payable_first_year_percentage: selectedPackage.firstYearSalaryPercentage,
        payable_first_year_fixed_charge: selectedPackage.firstYearFixedPrice,
        pricing_type: selectedPackage.firstYearSalaryPercentage ? 'percentage' : 'fixed',
        enrollment_installments: [],
        initial_payment: null
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
        if (formData.initial_payment && formData.initial_payment > 0) {
          await axios.post(
            `${BASE_URL}/installments`,
            {
              enrolledClientId: selectedClient.id,
              charge_type: 'enrollment_charge',
              installment_number: 1,
              amount: formData.initial_payment,
              dueDate: new Date().toISOString().split('T')[0],
              remark: 'Initial Payment',
              is_initial_payment: true
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
        }

        if (formData.enrollment_installments.length > 0) {
          const installmentPromises = formData.enrollment_installments.map((installment, index) => 
            axios.post(
              `${BASE_URL}/installments`,
              {
                enrolledClientId: selectedClient.id,
                charge_type: 'enrollment_charge',
                installment_number: index + 2,
                ...installment
              },
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            )
          );

          await Promise.all(installmentPromises);
        }

        setSelectedClient(null);
        setShowForm(false);
        const updatedResponse = await axios.get(`${BASE_URL}/enrolled-clients/sales/all`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (updatedResponse.data.success) {
          setClients(updatedResponse.data.data.Approved.leads || []);
        }
        alert('Enrollment updated successfully!');
      }
    } catch (error) {
      console.error('Error updating enrollment:', error);
      alert('Error updating enrollment');
    } finally {
      setFormLoading(false);
    }
  };

  const addInstallment = () => {
    if (!selectedClient) return;
    
    const totalCharge = formData.payable_enrollment_charge || 0;
    if (totalCharge === 0) {
      alert('Cannot add installments when enrollment charge is 0');
      return;
    }

    if (!showInitialPayment) {
      setShowInitialPayment(true);
      return;
    }

    if (!formData.initial_payment) {
      alert('Please enter the initial payment amount first');
      return;
    }

    const totalExistingAmount = formData.enrollment_installments.reduce((sum, inst) => sum + inst.amount, 0);
    const remainingAmount = totalCharge - (formData.initial_payment + totalExistingAmount);

    if (remainingAmount <= 0) {
      alert('Total installment amount cannot exceed the remaining charge');
      return;
    }

    setFormData(prev => ({
      ...prev,
      enrollment_installments: [
        ...prev.enrollment_installments,
        { amount: 0, dueDate: '', remark: '' }
      ]
    }));
  };

  const updateInstallment = (index: number, field: keyof Installment, value: string | number) => {
    setFormData(prev => {
      const newInstallments = [...prev.enrollment_installments];
      
      if (field === 'amount') {
        const numValue = Number(value);
        const totalCharge = prev.payable_enrollment_charge || 0;
        const initialPayment = prev.initial_payment || 0;
        const totalOtherInstallments = prev.enrollment_installments.reduce((sum, inst, i) => 
          i === index ? sum : sum + inst.amount, 0);
        
        const totalAmount = initialPayment + totalOtherInstallments + numValue;
        
        if (totalAmount > totalCharge) {
          alert(`Total amount (${formatCurrency(totalAmount)}) cannot exceed total charge (${formatCurrency(totalCharge)})`);
          setHasInstallmentError(true);
          return prev;
        }
      }

      newInstallments[index] = { 
        ...newInstallments[index], 
        [field]: value 
      };

      const newTotal = newInstallments.reduce((sum, inst) => sum + inst.amount, 0) + (prev.initial_payment || 0);
      setHasInstallmentError(newTotal > (prev.payable_enrollment_charge || 0));

      return {
        ...prev,
        enrollment_installments: newInstallments
      };
    });
  };

  const removeInstallment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      enrollment_installments: prev.enrollment_installments.filter((_, i) => i !== index)
    }));
  };

  const formatCurrency = (amount: string | number | null) => {
    if (amount === null) return 'Not Set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const getFirstCallStatus = () => {
    const statuses = ['pending', 'onhold', 'Done'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    let badgeColor = '';
    if (randomStatus === 'pending') badgeColor = 'bg-yellow-100 text-yellow-800';
    else if (randomStatus === 'onhold') badgeColor = 'bg-red-100 text-red-800';
    else badgeColor = 'bg-green-100 text-green-800';
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${badgeColor}`}>{randomStatus}</span>;
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
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-[35px] font-bold">$</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 text-left">Finance Sale (Approved Enrollments)</h1>
              <p className="text-gray-600 text-sm ">All approved enrolled clients</p>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Configure Enrollment</h2>
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
              <div className="grid grid-cols-3 gap-4">
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100 cursor-not-allowed"
                    placeholder="0.00"
                    step="0.01"
                    required
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Offer Letter Charge
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={formData.payable_offer_letter_charge ?? ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, payable_offer_letter_charge: Number(e.target.value) }))}
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                      step="0.01"
                      required
                    />
                    <button
                      type="button"
                      onClick={addInstallment}
                      className="p-3 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none"
                      title="Add Installment"
                    >
                      <FaPlus className="w-5 h-5" />
                    </button>
                  </div>
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
                    setSelectedClient(null);
                    setShowForm(false);
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
                  {formLoading ? 'Updating...' : 'Update Enrollment'}
                </button>
              </div>
            </form>
          </div>
        )}

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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resume</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">First Call Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client, idx) => (
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
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Enrollment:</span>
                            <span className="text-sm text-gray-900">
                              {formatCurrency(client.edited_enrollment_charge !== null ? client.edited_enrollment_charge : client.payable_enrollment_charge)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Offer Letter:</span>
                            <span className="text-sm text-gray-900">
                              {formatCurrency(client.edited_offer_letter_charge !== null ? client.edited_offer_letter_charge : client.payable_offer_letter_charge)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">First Year:</span>
                            <span className="text-sm text-gray-900">
                              {client.edited_first_year_percentage !== null
                                ? `${client.edited_first_year_percentage}%`
                                : client.edited_first_year_fixed_charge !== null
                                  ? formatCurrency(client.edited_first_year_fixed_charge)
                                  : client.payable_first_year_percentage
                                    ? `${client.payable_first_year_percentage}%`
                                    : formatCurrency(client.payable_first_year_fixed_charge)
                              }
                            </span>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-start">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Approved</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-start">
                      {client.resume ? (
                        <button className="text-blue-600 hover:text-blue-900 flex items-center gap-2" title="View Resume">
                          <FaFilePdf className="w-4 h-4" />
                          <span>View</span>
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">No Resume</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-start">
                      <a href={`mailto:${client.lead.primaryEmail}`} className="text-blue-600 hover:text-blue-900 flex items-center gap-2" title="Send Email">
                        <span>Send Email</span>
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-start">
                      {getFirstCallStatus()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-start text-sm font-medium">
                      <button
                        onClick={() => handleEdit(client)}
                        className="text-purple-600 hover:text-blue-900 mr-3"
                        title="Configure"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
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

export default AccountSale; 