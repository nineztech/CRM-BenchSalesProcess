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
  payable_offer_letter_charge: number | null;
  payable_first_year_percentage: number | null;
  payable_first_year_fixed_charge: number | null;
  pricing_type: 'percentage' | 'fixed' | null;
  offer_letter_installments: Installment[];
  offer_letter_initial_payment: number | null;
  offerLetterInitialPaymentError?: string;
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

const AccountSale: React.FC = () => {
  const [clients, setClients] = useState<EnrolledClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<EnrolledClient | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [tabsData, setTabsData] = useState<TabsData>({});
  const [formData, setFormData] = useState<FormData>({
    packageid: null,
    payable_offer_letter_charge: null,
    payable_first_year_percentage: null,
    payable_first_year_fixed_charge: null,
    pricing_type: null,
    offer_letter_installments: [],
    offer_letter_initial_payment: null,
  });
  const [showOfferLetterInitialPayment, setShowOfferLetterInitialPayment] = useState(false);
  const [hasInstallmentError, setHasInstallmentError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${BASE_URL}/enrolled-clients/accounts/sales`, {
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
      // Fetch offer letter charge installments
      const offerLetterResponse = await axios.get(
        `${BASE_URL}/installments/enrolled-client/${client.id}?charge_type=offer_letter_charge`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const existingOfferLetterInstallments = offerLetterResponse.data.success ? offerLetterResponse.data.data.installments : [];
      
      const hasOfferLetterInstallments = existingOfferLetterInstallments.length > 0;

      let initialPayment = client.payable_offer_letter_charge;

      if (hasOfferLetterInstallments) {
        const totalInstallments = existingOfferLetterInstallments.reduce((sum: number, inst: any) => sum + Number(inst.amount), 0);
        initialPayment = (client.payable_offer_letter_charge || 0) - totalInstallments;
        setShowOfferLetterInitialPayment(true);
      }
      
      setFormData({
        packageid: client.packageid,
        payable_offer_letter_charge: client.payable_offer_letter_charge || (selectedPackage?.offerLetterCharge || null),
        payable_first_year_percentage: client.payable_first_year_percentage || (selectedPackage?.firstYearSalaryPercentage || null),
        payable_first_year_fixed_charge: client.payable_first_year_fixed_charge || (selectedPackage?.firstYearFixedPrice || null),
        pricing_type: client.payable_first_year_percentage ? 'percentage' : 
                     client.payable_first_year_fixed_charge ? 'fixed' : 
                     (selectedPackage?.firstYearSalaryPercentage ? 'percentage' : 'fixed'),
        offer_letter_installments: existingOfferLetterInstallments.map((inst: any) => ({
          amount: Number(inst.amount),
          dueDate: inst.dueDate,
          remark: inst.remark || ''
        })),
        offer_letter_initial_payment: initialPayment,
      });

    } catch (error) {
      console.error('Error fetching installments:', error);
      alert('Error fetching existing installments');
      
      setFormData({
        packageid: client.packageid,
        payable_offer_letter_charge: client.payable_offer_letter_charge || (selectedPackage?.offerLetterCharge || null),
        payable_first_year_percentage: client.payable_first_year_percentage || (selectedPackage?.firstYearSalaryPercentage || null),
        payable_first_year_fixed_charge: client.payable_first_year_fixed_charge || (selectedPackage?.firstYearFixedPrice || null),
        pricing_type: client.payable_first_year_percentage ? 'percentage' : 
                     client.payable_first_year_fixed_charge ? 'fixed' : 
                     (selectedPackage?.firstYearSalaryPercentage ? 'percentage' : 'fixed'),
        offer_letter_installments: [],
        offer_letter_initial_payment: client.payable_offer_letter_charge,
      });
    }
  };

  const handlePackageChange = (packageId: number) => {
    const selectedPackage = packages.find(pkg => pkg.id === packageId);
    if (selectedPackage) {
      setShowOfferLetterInitialPayment(false);
      setFormData(prev => ({
        ...prev,
        packageid: packageId,
        payable_offer_letter_charge: selectedPackage.offerLetterCharge,
        payable_first_year_percentage: selectedPackage.firstYearSalaryPercentage,
        payable_first_year_fixed_charge: selectedPackage.firstYearFixedPrice,
        pricing_type: selectedPackage.firstYearSalaryPercentage ? 'percentage' : 'fixed',
        offer_letter_installments: [],
        offer_letter_initial_payment: null,
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

  // Add new function for offer letter installments
  const addOfferLetterInstallment = () => {
    if (!selectedClient) return;
    
    const totalCharge = formData.payable_offer_letter_charge || 0;
    if (totalCharge === 0) {
      alert('Cannot add installments when offer letter charge is 0');
      return;
    }

    if (!showOfferLetterInitialPayment) {
      setShowOfferLetterInitialPayment(true);
      return;
    }

    if (!formData.offer_letter_initial_payment) {
      alert('Please enter the initial payment amount first');
      return;
    }

    const totalExistingAmount = formData.offer_letter_installments.reduce((sum, inst) => sum + inst.amount, 0);
    const remainingAmount = totalCharge - (formData.offer_letter_initial_payment + totalExistingAmount);

    if (remainingAmount <= 0) {
      alert('Total installment amount cannot exceed the remaining charge');
      return;
    }

    setFormData(prev => ({
      ...prev,
      offer_letter_installments: [
        ...prev.offer_letter_installments,
        { amount: 0, dueDate: '', remark: '' }
      ]
    }));
  };

  const updateOfferLetterInstallment = (index: number, field: keyof Installment, value: string | number) => {
    setFormData(prev => {
      const newInstallments = [...prev.offer_letter_installments];
      
      if (field === 'amount') {
        const numValue = Number(Number(value).toFixed(2));
        const totalCharge = Number((prev.payable_offer_letter_charge || 0).toFixed(2));
        const initialPayment = Number((prev.offer_letter_initial_payment || 0).toFixed(2));
        const totalOtherInstallments = Number(prev.offer_letter_installments.reduce((sum, inst, i) => 
          i === index ? sum : sum + Number(inst.amount), 0).toFixed(2));
        
        const totalAmount = Number((initialPayment + totalOtherInstallments + numValue).toFixed(2));
        
        if (totalAmount > totalCharge) {
          alert(`Total amount (${formatCurrency(totalAmount)}) cannot exceed total charge (${formatCurrency(totalCharge)})`);
          setHasInstallmentError(true);
          return prev;
        }
      }

      newInstallments[index] = { 
        ...newInstallments[index], 
        [field]: field === 'amount' ? Number(Number(value).toFixed(2)) : value 
      };

      return {
        ...prev,
        offer_letter_installments: newInstallments
      };
    });
  };

  const removeOfferLetterInstallment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      offer_letter_installments: prev.offer_letter_installments.filter((_, i) => i !== index)
    }));
  };

  const handleOfferLetterInitialPaymentChange = (value: number) => {
    setFormData(prev => {
      const newInitialPayment = Number(value.toFixed(2));
      const totalInstallments = Number(prev.offer_letter_installments.reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0).toFixed(2));
      const totalAmount = Number((newInitialPayment + totalInstallments).toFixed(2));
      const offerLetterChargeNum = Number(Number(prev.payable_offer_letter_charge).toFixed(2));
      
      let errorMessage = '';
      if (totalAmount > offerLetterChargeNum) {
        errorMessage = `Total amount (${formatCurrency(totalAmount)}) cannot exceed offer letter charge (${formatCurrency(offerLetterChargeNum)})`;
      }

      return {
        ...prev,
        offer_letter_initial_payment: newInitialPayment,
        offerLetterInitialPaymentError: errorMessage
      };
    });
  };

  const getOfferLetterRemainingAmount = () => {
    const totalCharge = formData.payable_offer_letter_charge || 0;
    const initialPayment = formData.offer_letter_initial_payment || 0;
    const totalExistingAmount = formData.offer_letter_installments.reduce((sum, inst) => sum + Number(inst.amount), 0);
    return totalCharge - (initialPayment + totalExistingAmount);
  };

  // Update handleSubmit to include offer letter installments
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    // Validate total offer letter amount matches with 2 decimal precision
    const totalOfferLetterAmount = Number(((formData.offer_letter_initial_payment ?? 0) +
      formData.offer_letter_installments.reduce((sum, inst) => sum + Number(inst.amount), 0)).toFixed(2));
    
    const offerLetterCharge = Number(Number(formData.payable_offer_letter_charge).toFixed(2));
    
    if (Math.abs(totalOfferLetterAmount - offerLetterCharge) > 0.01) {
      alert(`Total amount (${formatCurrency(totalOfferLetterAmount)}) must equal the offer letter charge (${formatCurrency(offerLetterCharge)})`);
      return;
    }

    setFormLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
      let offerLetterUpdated = false;
      let firstYearUpdated = false;
      // Detect changes
      const offerLetterChanged = selectedClient.payable_offer_letter_charge !== formData.payable_offer_letter_charge;
      const firstYearChanged = selectedClient.payable_first_year_percentage !== formData.payable_first_year_percentage || selectedClient.payable_first_year_fixed_charge !== formData.payable_first_year_fixed_charge;
      // Update offer letter charge if changed
      if (offerLetterChanged) {
        const submitData = {
          payable_offer_letter_charge: formData.payable_offer_letter_charge,
          Sales_person_id: userId,
          updatedBy: userId
        };
        const response = await axios.put(
          `${BASE_URL}/enrolled-clients/offer-letter/${selectedClient.id}`,
          submitData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        offerLetterUpdated = response.data.success;
      }
      // Update first year salary if changed
      if (firstYearChanged) {
        const submitData = {
          payable_first_year_percentage: formData.payable_first_year_percentage,
          payable_first_year_fixed_charge: formData.payable_first_year_fixed_charge,
          Sales_person_id: userId,
          updatedBy: userId
        };
        const response = await axios.put(
          `${BASE_URL}/enrolled-clients/first-year/${selectedClient.id}`,
          submitData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        firstYearUpdated = response.data.success;
      }

      // Handle offer letter charge installments
      if ((formData.offer_letter_initial_payment ?? 0) > 0 || formData.offer_letter_installments.length > 0) {
        try {
          // First create initial payment installment
          if (formData.offer_letter_initial_payment && formData.offer_letter_initial_payment > 0) {
            await axios.post(
              `${BASE_URL}/installments`,
              {
                enrolledClientId: selectedClient.id,
                charge_type: 'offer_letter_charge',
                installment_number: 0,
                amount: Number(formData.offer_letter_initial_payment),
                dueDate: new Date().toISOString().split('T')[0], // Today's date
                remark: 'Initial Payment',
                is_initial_payment: true,
                paid: false
              },
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
          }

          // Then create other installments
          const offerLetterInstallmentPromises = formData.offer_letter_installments.map((installment, index) => 
            axios.post(
              `${BASE_URL}/installments`,
              {
                enrolledClientId: selectedClient.id,
                charge_type: 'offer_letter_charge',
                installment_number: index + 1,
                amount: Number(installment.amount),
                dueDate: installment.dueDate,
                remark: installment.remark || `Offer Letter Installment ${index + 1}`,
                is_initial_payment: false,
                paid: false
              },
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            )
          );
          await Promise.all(offerLetterInstallmentPromises);
        } catch (error) {
          console.error('Error creating offer letter installments:', error);
          throw error;
        }
      }

      setSelectedClient(null);
      setShowForm(false);
      // Refresh clients
      const updatedResponse = await axios.get(`${BASE_URL}/enrolled-clients/accounts/sales`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (updatedResponse.data.success) {
        const updatedClients = (updatedResponse.data.data.leads || []).map((c: any) => {
          const client: EnrolledClient = c;
          return client.id === selectedClient.id ? { ...client, has_update: true } : client;
        });
        setClients(updatedClients);
      }
      
      if (offerLetterUpdated || firstYearUpdated) {
        alert('Changes submitted successfully!');
      }
    } catch (error) {
      console.error('Error updating enrollment:', error);
      alert('Error updating enrollment. Please check the console for details.');
    } finally {
      setFormLoading(false);
    }
  };

  const addInstallment = () => {
    if (!selectedClient) return;
    
    const totalCharge = formData.payable_offer_letter_charge || 0;
    if (totalCharge === 0) {
      alert('Cannot add installments when offer letter charge is 0');
      return;
    }

    if (!showOfferLetterInitialPayment) {
      setShowOfferLetterInitialPayment(true);
      return;
    }

    if (!formData.offer_letter_initial_payment) {
      alert('Please enter the initial payment amount first');
      return;
    }

    const totalExistingAmount = formData.offer_letter_installments.reduce((sum, inst) => sum + inst.amount, 0);
    const remainingAmount = totalCharge - (formData.offer_letter_initial_payment + totalExistingAmount);

    if (remainingAmount <= 0) {
      alert('Total installment amount cannot exceed the remaining charge');
      return;
    }

    setFormData(prev => ({
      ...prev,
      offer_letter_installments: [
        ...prev.offer_letter_installments,
        { amount: 0, dueDate: '', remark: '' }
      ]
    }));
  };

  const updateInstallment = (index: number, field: keyof Installment, value: string | number) => {
    setFormData(prev => {
      const newInstallments = [...prev.offer_letter_installments];
      
      if (field === 'amount') {
        const numValue = Number(Number(value).toFixed(2));
        const totalCharge = Number(Number(prev.payable_offer_letter_charge).toFixed(2));
        const initialPayment = Number(Number(prev.offer_letter_initial_payment || 0).toFixed(2));
        const totalOtherInstallments = Number(prev.offer_letter_installments.reduce((sum, inst, i) => 
          i === index ? sum : sum + Number(inst.amount), 0).toFixed(2));
        
        const totalAmount = Number((initialPayment + totalOtherInstallments + numValue).toFixed(2));
        
        if (totalAmount > totalCharge) {
          alert(`Total amount (${formatCurrency(totalAmount)}) cannot exceed offer letter charge (${formatCurrency(totalCharge)})`);
          return prev;
        }
      }

      newInstallments[index] = { 
        ...newInstallments[index], 
        [field]: field === 'amount' ? Number(Number(value).toFixed(2)) : value 
      };

      return {
        ...prev,
        offer_letter_installments: newInstallments
      };
    });
  };

  const removeInstallment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      offer_letter_installments: prev.offer_letter_installments.filter((_, i) => i !== index)
    }));
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Not Set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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

  // Update getFilteredClients to use tabsData
  const getFilteredClients = () => {
    return tabsData[activeTab]?.leads || [];
  };

  // Add handleApprove function
  const handleApprove = async (client: EnrolledClient) => {
    // Mark as approved by sales, refresh list
    try {
      const token = localStorage.getItem('token');
      const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
      await axios.put(`${BASE_URL}/enrolled-clients/accounts/sales/approve/${client.id}`, { approved: true, Sales_person_id: userId });
      // Refresh clients
      const response = await axios.get(`${BASE_URL}/enrolled-clients/accounts/sales`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.data.success) setClients(response.data.data.leads || []);
    } catch (error) { alert('Error approving client'); }
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
        {/* Existing content below remains unchanged */}
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
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-4 gap-4">
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
                      {packages.map(pkg => (
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
                          offer_letter_initial_payment: newValue,
                          offer_letter_installments: []
                        }));
                        setShowOfferLetterInitialPayment(false);
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                      step="0.01"
                      required
                    />
                  </div>

                  {/* Initial Payment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Initial Payment
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formData.offer_letter_initial_payment ?? ''}
                        onChange={(e) => {
                          const inputValue = Number(e.target.value);
                          handleOfferLetterInitialPaymentChange(inputValue);
                          if (inputValue < (formData.payable_offer_letter_charge || 0)) {
                            setShowOfferLetterInitialPayment(true);
                          }
                        }}
                        className={`w-full p-3 border ${
                          formData.offerLetterInitialPaymentError ? 'border-red-300' : 'border-gray-300'
                        } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required
                      />
                      {formData.offer_letter_initial_payment !== null && 
                       formData.offer_letter_initial_payment < (formData.payable_offer_letter_charge || 0) && 
                       formData.offer_letter_installments.length === 0 && (
                        <button
                          type="button"
                          onClick={addInstallment}
                          className="p-3 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Add Installment"
                        >
                          <FaPlus className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    {formData.offerLetterInitialPaymentError && (
                      <p className="text-red-500 text-sm mt-1">{formData.offerLetterInitialPaymentError}</p>
                    )}
                  </div>
                </div>

                {/* First Year Pricing Type */}
                 {/* Offer Letter Installments Section */}
                  <div className="text-sm text-gray-600 mb-0">
                      Remaining amount to be added in installments: {formatCurrency(getOfferLetterRemainingAmount())}
                    </div>
                {formData.offer_letter_installments.length > 0 && (
                  <div className="mt-0 bg-blue-50">
                   
                    <div className="space-y-4">
                      {formData.offer_letter_installments.map((installment, index) => (
                        <div key={index} className="flex items-center gap-4  p-4 rounded-lg">
                          <div className="flex-none">
                            <span className="text-sm font-medium text-gray-700">Installment {index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <div className="grid grid-cols-3 gap-4">
                              <div className="flex flex-col">
                                <input
                                  type="number"
                                  value={installment.amount}
                                  onChange={(e) => updateInstallment(index, 'amount', Number(e.target.value))}
                                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                  placeholder="0.00"
                                  step="0.01"
                                  required
                                />
                              </div>
                              <div>
                                <input
                                  type="date"
                                  value={installment.dueDate}
                                  onChange={(e) => updateInstallment(index, 'dueDate', e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                  required
                                />
                              </div>
                              <div>
                                <input
                                  type="text"
                                  value={installment.remark}
                                  onChange={(e) => updateInstallment(index, 'remark', e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                  placeholder="Add a note..."
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex-none">
                            <button
                              type="button"
                              onClick={() => removeInstallment(index)}
                              className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded-full transition-colors focus:outline-none"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                            {index === formData.offer_letter_installments.length - 1 && getOfferLetterRemainingAmount() > 0 && (
                              <button
                                type="button"
                                onClick={addInstallment}
                                className="ml-2 text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded-full transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={getOfferLetterRemainingAmount() <= 0}
                              >
                                <FaPlus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-4">
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
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
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
                      {activeTab === 'my_review' && (
                        <>
                          <button onClick={() => handleApprove(client)} className="text-green-600 hover:text-green-900 mr-2">Approve</button>
                          <button onClick={() => handleEdit(client)} className="text-purple-600 hover:text-purple-900">Edit</button>
                        </>
                      )}
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