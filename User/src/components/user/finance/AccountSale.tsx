import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaEdit, FaTimes, FaBox, FaPlus, FaTrash, FaListAlt, FaCheckCircle } from 'react-icons/fa';
import InstallmentsPopup from '../enrollment/InstallmentsPopup';
import ConfirmationPopup from '../enrollment/ConfirmationPopup';

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
  Approval_by_sales: boolean;
  Sales_person_id: number | null;
  Approval_by_admin: boolean;
  Admin_id: number | null;
  has_update: boolean;
  edited_enrollment_charge: number | null;
  edited_offer_letter_charge: number | null;
  edited_first_year_percentage: number | null;
  edited_first_year_fixed_charge: number | null;
  edited_net_payable_first_year_price: number | null;
  edited_first_year_salary: number | null;
  final_approval_sales: boolean;
  final_approval_by_admin: boolean;
  has_update_in_final: boolean;
  is_training_required: boolean;
  first_call_status: 'pending' | 'onhold' | 'done';
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
  net_payable_first_year_price: number | null;
  first_year_salary: number | null;
  is_training_required: boolean;
  pricing_type: 'percentage' | 'fixed' | null;
  offer_letter_installments: Installment[];
  offer_letter_initial_payment: number | null;
  offerLetterInitialPaymentError?: string;
  first_year_installments: Installment[];
  first_year_initial_payment: number | null;
  firstYearInitialPaymentError?: string;
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

const AccountSale: React.FC = () => {
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
    net_payable_first_year_price: null,
    first_year_salary: null,
    is_training_required: false,
    pricing_type: null,
    offer_letter_installments: [],
    offer_letter_initial_payment: null,
    first_year_installments: [],
    first_year_initial_payment: null,
  });
  const [showOfferLetterInitialPayment, setShowOfferLetterInitialPayment] = useState(false);
  const [showFirstYearInitialPayment, setShowFirstYearInitialPayment] = useState(false);
  // const [hasInstallmentError, setHasInstallmentError] = useState(false);
  const [showInstallmentsPopup, setShowInstallmentsPopup] = useState(false);
  const [selectedClientForInstallments, setSelectedClientForInstallments] = useState<EnrolledClient | null>(null);
  const [installmentChargeType, setInstallmentChargeType] = useState<'enrollment_charge' | 'offer_letter_charge' | 'first_year_charge'>('enrollment_charge');
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [selectedClientForApproval, setSelectedClientForApproval] = useState<EnrolledClient | null>(null);

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
        }
          } catch (error) {
    } finally {
        setLoading(false);
      }
    };
    fetchData();
    fetchPackages();
  }, []);

  // Effect to ensure net payable is populated when fixed charge is available
  useEffect(() => {
    if (formData.pricing_type === 'fixed' && formData.payable_first_year_fixed_charge && !formData.net_payable_first_year_price) {
      setFormData(prev => ({
        ...prev,
        net_payable_first_year_price: prev.payable_first_year_fixed_charge,
        first_year_initial_payment: prev.payable_first_year_fixed_charge
      }));
    }
  }, [formData.pricing_type, formData.payable_first_year_fixed_charge, formData.net_payable_first_year_price]);

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
    
    // Check if we're in "My Review" tab and use edited values
    const isMyReview = activeTab === 'My Review';
    
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

      // Fetch first year charge installments
      const firstYearResponse = await axios.get(
        `${BASE_URL}/installments/enrolled-client/${client.id}?charge_type=first_year_charge`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const existingOfferLetterInstallments = offerLetterResponse.data.success ? offerLetterResponse.data.data.installments : [];
      const existingFirstYearInstallments = firstYearResponse.data.success ? firstYearResponse.data.data.installments : [];
      
      const hasOfferLetterInstallments = existingOfferLetterInstallments.length > 0;
      const hasFirstYearInstallments = existingFirstYearInstallments.length > 0;

      // Use edited values if in "My Review" tab, otherwise use original values
      const offerLetterCharge = isMyReview && client.edited_offer_letter_charge !== null 
        ? client.edited_offer_letter_charge 
        : client.payable_offer_letter_charge;
      
      const firstYearPercentage = isMyReview && client.edited_first_year_percentage !== null 
        ? client.edited_first_year_percentage 
        : client.payable_first_year_percentage;
      
      const firstYearFixedCharge = isMyReview && client.edited_first_year_fixed_charge !== null 
        ? client.edited_first_year_fixed_charge 
        : client.payable_first_year_fixed_charge;
      
      const netPayableFirstYearPrice = isMyReview && client.edited_net_payable_first_year_price !== null 
        ? client.edited_net_payable_first_year_price 
        : client.net_payable_first_year_price;
      
      const firstYearSalary = isMyReview && client.edited_first_year_salary !== null 
        ? client.edited_first_year_salary 
        : client.first_year_salary;

      // Calculate offer letter initial payment and filter installments
      let offerLetterInitialPayment = offerLetterCharge;
      let filteredOfferLetterInstallments = existingOfferLetterInstallments;
      
      if (hasOfferLetterInstallments) {
        // Find if there's an installment that represents the initial payment
        const initialPaymentInstallment = existingOfferLetterInstallments.find((inst: any) => 
          inst.remark?.toLowerCase().includes('initial') || 
          inst.remark?.toLowerCase().includes('down payment') ||
          inst.remark?.toLowerCase().includes('advance')
        );
        
        if (initialPaymentInstallment) {
          // Set initial payment to this installment's amount
          offerLetterInitialPayment = Number(initialPaymentInstallment.amount);
          // Remove this installment from the list
          filteredOfferLetterInstallments = existingOfferLetterInstallments.filter((inst: any) => inst !== initialPaymentInstallment);
        } else {
          // Calculate initial payment as remaining amount
          const totalOfferLetterInstallments = existingOfferLetterInstallments.reduce((sum: number, inst: any) => sum + Number(inst.amount), 0);
          offerLetterInitialPayment = (offerLetterCharge || 0) - totalOfferLetterInstallments;
        }
        setShowOfferLetterInitialPayment(true);
      }

      // Calculate first year initial payment and filter installments
      let firstYearInitialPayment = netPayableFirstYearPrice;
      let filteredFirstYearInstallments = existingFirstYearInstallments;
      
      if (hasFirstYearInstallments) {
        // Find if there's an installment that represents the initial payment
        const initialPaymentInstallment = existingFirstYearInstallments.find((inst: any) => 
          inst.remark?.toLowerCase().includes('initial') || 
          inst.remark?.toLowerCase().includes('down payment') ||
          inst.remark?.toLowerCase().includes('advance')
        );
        
        if (initialPaymentInstallment) {
          // Set initial payment to this installment's amount
          firstYearInitialPayment = Number(initialPaymentInstallment.amount);
          // Remove this installment from the list
          filteredFirstYearInstallments = existingFirstYearInstallments.filter((inst: any) => inst !== initialPaymentInstallment);
        } else {
          // Calculate initial payment as remaining amount
          const totalFirstYearInstallments = existingFirstYearInstallments.reduce((sum: number, inst: any) => sum + Number(inst.amount), 0);
          firstYearInitialPayment = (netPayableFirstYearPrice || 0) - totalFirstYearInstallments;
        }
      }

      // If in "My Review" tab and admin has made changes, recalculate installments based on edited values
      if (isMyReview && (client.edited_offer_letter_charge !== null || client.edited_net_payable_first_year_price !== null)) {
        // Recalculate offer letter installments if admin changed the offer letter charge
        if (client.edited_offer_letter_charge !== null && client.edited_offer_letter_charge !== client.payable_offer_letter_charge) {
          const totalExistingInstallments = existingOfferLetterInstallments.reduce((sum: number, inst: any) => sum + Number(inst.amount), 0);
          const newTotalCharge = client.edited_offer_letter_charge;
          
          // If total installments exceed new charge, adjust them proportionally
          if (totalExistingInstallments > newTotalCharge) {
            const ratio = newTotalCharge / totalExistingInstallments;
            filteredOfferLetterInstallments = existingOfferLetterInstallments.map((inst: any) => ({
              ...inst,
              amount: Number((Number(inst.amount) * ratio).toFixed(2))
            }));
          }
          
          // Recalculate initial payment
          const newTotalInstallments = filteredOfferLetterInstallments.reduce((sum: number, inst: any) => sum + Number(inst.amount), 0);
          offerLetterInitialPayment = newTotalCharge - newTotalInstallments;
        }

        // Recalculate first year installments if admin changed the first year charge
        if (client.edited_net_payable_first_year_price !== null && client.edited_net_payable_first_year_price !== client.net_payable_first_year_price) {
          const totalExistingInstallments = existingFirstYearInstallments.reduce((sum: number, inst: any) => sum + Number(inst.amount), 0);
          const newTotalCharge = client.edited_net_payable_first_year_price;
          
          // If total installments exceed new charge, adjust them proportionally
          if (totalExistingInstallments > newTotalCharge) {
            const ratio = newTotalCharge / totalExistingInstallments;
            filteredFirstYearInstallments = existingFirstYearInstallments.map((inst: any) => ({
              ...inst,
              amount: Number((Number(inst.amount) * ratio).toFixed(2))
            }));
          }
          
          // Recalculate initial payment
          const newTotalInstallments = filteredFirstYearInstallments.reduce((sum: number, inst: any) => sum + Number(inst.amount), 0);
          firstYearInitialPayment = newTotalCharge - newTotalInstallments;
        }
      }
      
      setFormData({
        packageid: client.packageid,
        payable_offer_letter_charge: offerLetterCharge || (selectedPackage?.offerLetterCharge || null),
        payable_first_year_percentage: firstYearPercentage || (selectedPackage?.firstYearSalaryPercentage || null),
        payable_first_year_fixed_charge: firstYearFixedCharge || (selectedPackage?.firstYearFixedPrice || null),
        net_payable_first_year_price: netPayableFirstYearPrice || null,
        first_year_salary: firstYearSalary || null,
        is_training_required: client.is_training_required || false,
        pricing_type: firstYearPercentage ? 'percentage' : 
                     firstYearFixedCharge ? 'fixed' : 
                     (selectedPackage?.firstYearSalaryPercentage ? 'percentage' : 'fixed'),
        offer_letter_installments: filteredOfferLetterInstallments.map((inst: any) => ({
          amount: Number(inst.amount),
          dueDate: inst.dueDate,
          remark: inst.remark || ''
        })),
        offer_letter_initial_payment: offerLetterInitialPayment,
        first_year_installments: filteredFirstYearInstallments.map((inst: any) => ({
          amount: Number(inst.amount),
          dueDate: inst.dueDate,
          remark: inst.remark || ''
        })),
        first_year_initial_payment: firstYearInitialPayment,
      });

    } catch (error) {
      console.error('Error fetching installments:', error);
      alert('Error fetching existing installments');
      
      // Use edited values if in "My Review" tab, otherwise use original values
      const offerLetterCharge = isMyReview && client.edited_offer_letter_charge !== null 
        ? client.edited_offer_letter_charge 
        : client.payable_offer_letter_charge;
      
      const firstYearPercentage = isMyReview && client.edited_first_year_percentage !== null 
        ? client.edited_first_year_percentage 
        : client.payable_first_year_percentage;
      
      const firstYearFixedCharge = isMyReview && client.edited_first_year_fixed_charge !== null 
        ? client.edited_first_year_fixed_charge 
        : client.payable_first_year_fixed_charge;
      
      const netPayableFirstYearPrice = isMyReview && client.edited_net_payable_first_year_price !== null 
        ? client.edited_net_payable_first_year_price 
        : client.net_payable_first_year_price;
      
      const firstYearSalary = isMyReview && client.edited_first_year_salary !== null 
        ? client.edited_first_year_salary 
        : client.first_year_salary;
      
      setFormData({
        packageid: client.packageid,
        payable_offer_letter_charge: offerLetterCharge || (selectedPackage?.offerLetterCharge || null),
        payable_first_year_percentage: firstYearPercentage || (selectedPackage?.firstYearSalaryPercentage || null),
        payable_first_year_fixed_charge: firstYearFixedCharge || (selectedPackage?.firstYearFixedPrice || null),
        net_payable_first_year_price: netPayableFirstYearPrice || null,
        first_year_salary: firstYearSalary || null,
        is_training_required: client.is_training_required || false,
        pricing_type: firstYearPercentage ? 'percentage' : 
                     firstYearFixedCharge ? 'fixed' : 
                     (selectedPackage?.firstYearSalaryPercentage ? 'percentage' : 'fixed'),
        offer_letter_installments: [],
        offer_letter_initial_payment: offerLetterCharge,
        first_year_installments: [],
        first_year_initial_payment: netPayableFirstYearPrice,
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
        net_payable_first_year_price: selectedPackage.firstYearFixedPrice || null,
        first_year_salary: null,
        pricing_type: selectedPackage.firstYearSalaryPercentage ? 'percentage' : 'fixed',
        offer_letter_installments: [],
        offer_letter_initial_payment: null,
        first_year_installments: [],
        first_year_initial_payment: null,
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
      first_year_initial_payment: type === 'fixed' ? prev.payable_first_year_fixed_charge : null,
      first_year_salary: null
    }));
  };

  // Calculate net payable when first year salary changes
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

  // Handle first year initial payment change
  const handleFirstYearInitialPaymentChange = (value: number) => {
    setFormData(prev => {
      const newInitialPayment = Number(value.toFixed(2));
      const totalInstallments = Number(prev.first_year_installments.reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0).toFixed(2));
      const totalAmount = Number((newInitialPayment + totalInstallments).toFixed(2));
      const netPayableNum = Number(Number(prev.net_payable_first_year_price).toFixed(2));
      
      let errorMessage = '';
      if (totalAmount > netPayableNum) {
        errorMessage = `Total amount (${formatCurrency(totalAmount)}) cannot exceed net payable (${formatCurrency(netPayableNum)})`;
      }

      return {
        ...prev,
        first_year_initial_payment: newInitialPayment,
        firstYearInitialPaymentError: errorMessage
      };
    });
  };

  // Add first year installment
  const addFirstYearInstallment = () => {
    if (!selectedClient) return;
    
    const totalCharge = formData.net_payable_first_year_price || 0;
    if (totalCharge === 0) {
      alert('Cannot add installments when net payable is 0');
      return;
    }

    if (!showFirstYearInitialPayment) {
      setShowFirstYearInitialPayment(true);
      return;
    }

    if (!formData.first_year_initial_payment) {
      alert('Please enter the initial payment amount first');
      return;
    }

    const totalExistingAmount = formData.first_year_installments.reduce((sum, inst) => sum + inst.amount, 0);
    const remainingAmount = totalCharge - (formData.first_year_initial_payment + totalExistingAmount);

    if (remainingAmount <= 0) {
      alert('Total installment amount cannot exceed the remaining charge');
      return;
    }

    setFormData(prev => ({
      ...prev,
      first_year_installments: [
        ...prev.first_year_installments,
        { amount: remainingAmount, dueDate: '', remark: '' }
      ]
    }));
  };

  // Update first year installment
  const updateFirstYearInstallment = (index: number, field: keyof Installment, value: string | number) => {
    setFormData(prev => {
      const newInstallments = [...prev.first_year_installments];
      
      if (field === 'amount') {
        const numValue = Number(Number(value).toFixed(2));
        const totalCharge = Number(Number(prev.net_payable_first_year_price).toFixed(2));
        const initialPayment = Number(Number(prev.first_year_initial_payment || 0).toFixed(2));
        const totalOtherInstallments = Number(prev.first_year_installments.reduce((sum, inst, i) => 
          i === index ? sum : sum + Number(inst.amount), 0).toFixed(2));
        
        const totalAmount = Number((initialPayment + totalOtherInstallments + numValue).toFixed(2));
        
        if (totalAmount > totalCharge) {
          alert(`Total amount (${formatCurrency(totalAmount)}) cannot exceed net payable (${formatCurrency(totalCharge)})`);
          return prev;
        }
      }

      newInstallments[index] = { 
        ...newInstallments[index], 
        [field]: field === 'amount' ? Number(Number(value).toFixed(2)) : value 
      };

      return {
        ...prev,
        first_year_installments: newInstallments
      };
    });
  };

  // Remove first year installment
  const removeFirstYearInstallment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      first_year_installments: prev.first_year_installments.filter((_, i) => i !== index)
    }));
  };

  // Get first year remaining amount
  const getFirstYearRemainingAmount = () => {
    const totalCharge = formData.net_payable_first_year_price || 0;
    const initialPayment = formData.first_year_initial_payment || 0;
    const totalExistingAmount = formData.first_year_installments.reduce((sum, inst) => sum + Number(inst.amount), 0);
    return totalCharge - (initialPayment + totalExistingAmount);
  };

  // // Add new function for offer letter installments
  // const addOfferLetterInstallment = () => {
  //   if (!selectedClient) return;
    
  //   const totalCharge = formData.payable_offer_letter_charge || 0;
  //   if (totalCharge === 0) {
  //     alert('Cannot add installments when offer letter charge is 0');
  //     return;
  //   }

  //   if (!showOfferLetterInitialPayment) {
  //     setShowOfferLetterInitialPayment(true);
  //     return;
  //   }

  //   if (!formData.offer_letter_initial_payment) {
  //     alert('Please enter the initial payment amount first');
  //     return;
  //   }

  //   const totalExistingAmount = formData.offer_letter_installments.reduce((sum, inst) => sum + inst.amount, 0);
  //   const remainingAmount = totalCharge - (formData.offer_letter_initial_payment + totalExistingAmount);

  //   if (remainingAmount <= 0) {
  //     alert('Total installment amount cannot exceed the remaining charge');
  //     return;
  //   }

  //   setFormData(prev => ({
  //     ...prev,
  //     offer_letter_installments: [
  //       ...prev.offer_letter_installments,
  //       { amount: remainingAmount, dueDate: '', remark: '' }
  //     ]
  //   }));
  // };

  // const updateOfferLetterInstallment = (index: number, field: keyof Installment, value: string | number) => {
  //   setFormData(prev => {
  //     const newInstallments = [...prev.offer_letter_installments];
      
  //     if (field === 'amount') {
  //       const numValue = Number(Number(value).toFixed(2));
  //       const totalCharge = Number((prev.payable_offer_letter_charge || 0).toFixed(2));
  //       const initialPayment = Number((prev.offer_letter_initial_payment || 0).toFixed(2));
  //       const totalOtherInstallments = Number(prev.offer_letter_installments.reduce((sum, inst, i) => 
  //         i === index ? sum : sum + Number(inst.amount), 0).toFixed(2));
        
  //       const totalAmount = Number((initialPayment + totalOtherInstallments + numValue).toFixed(2));
        
  //       if (totalAmount > totalCharge) {
  //         alert(`Total amount (${formatCurrency(totalAmount)}) cannot exceed total charge (${formatCurrency(totalCharge)})`);
  //         setHasInstallmentError(true);
  //         return prev;
  //       }
  //     }

  //     newInstallments[index] = { 
  //       ...newInstallments[index], 
  //       [field]: field === 'amount' ? Number(Number(value).toFixed(2)) : value 
  //     };

  //     return {
  //       ...prev,
  //       offer_letter_installments: newInstallments
  //     };
  //   });
  // };

  // const removeOfferLetterInstallment = (index: number) => {
  //   setFormData(prev => ({
  //     ...prev,
  //     offer_letter_installments: prev.offer_letter_installments.filter((_, i) => i !== index)
  //   }));
  // };

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

  // Add new function for sales to accept admin changes
  const handleAcceptAdminChanges = (client: EnrolledClient) => {
    setSelectedClientForApproval(client);
    setShowConfirmationPopup(true);
  };

  // Function to handle the actual approval after confirmation
  const handleConfirmApproval = async () => {
    if (!selectedClientForApproval) return;
    
    try {
      const token = localStorage.getItem('token');
      const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
      
      const response = await axios.put(
        `${BASE_URL}/enrolled-clients/final-configuration/sales-accept/${selectedClientForApproval.id}`,
        {
          Sales_person_id: userId,
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
        alert('Admin changes accepted successfully!');
        // Refresh clients
        const updatedResponse = await axios.get(`${BASE_URL}/enrolled-clients/accounts/sales`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (updatedResponse.data.success) {
          setTabsData(updatedResponse.data.data);
          const firstTabKey = Object.keys(updatedResponse.data.data)[0];
          setActiveTab(firstTabKey);
        }
      }
    } catch (error) {
      console.error('Error accepting admin changes:', error);
      alert('Error accepting admin changes');
    } finally {
      setShowConfirmationPopup(false);
      setSelectedClientForApproval(null);
    }
  };

  // Function to handle cancellation of approval
  const handleCancelApproval = () => {
    setShowConfirmationPopup(false);
    setSelectedClientForApproval(null);
  };

  // Update handleSubmit to include offer letter installments
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    // Check if we're in "My Review" tab
    const isMyReview = activeTab === 'My Review';

    // Validate total offer letter amount matches with 2 decimal precision
    const totalOfferLetterAmount = Number(((formData.offer_letter_initial_payment ?? 0) +
      formData.offer_letter_installments.reduce((sum, inst) => sum + Number(inst.amount), 0)).toFixed(2));
    
    const offerLetterCharge = Number(Number(formData.payable_offer_letter_charge).toFixed(2));
    
    if (Math.abs(totalOfferLetterAmount - offerLetterCharge) > 0.01) {
      alert(`Total amount (${formatCurrency(totalOfferLetterAmount)}) must equal the offer letter charge (${formatCurrency(offerLetterCharge)})`);
      return;
    }

    // Validate first year salary is required when first year percentage is used
    if (formData.payable_first_year_percentage && !formData.first_year_salary) {
      alert('First year salary is required when first year percentage is used');
      return;
    }

    // Validate first year installments if applicable
    if (formData.payable_first_year_fixed_charge || formData.payable_first_year_percentage) {
      const totalFirstYearAmount = Number(((formData.first_year_initial_payment ?? 0) +
        formData.first_year_installments.reduce((sum, inst) => sum + Number(inst.amount), 0)).toFixed(2));
      
      const expectedFirstYearAmount = Number(Number(formData.net_payable_first_year_price).toFixed(2));
      
      if (Math.abs(totalFirstYearAmount - expectedFirstYearAmount) > 0.01) {
        alert(`Total first year amount (${formatCurrency(totalFirstYearAmount)}) must equal the net payable first year price (${formatCurrency(expectedFirstYearAmount)})`);
        return;
      }
    }

    setFormLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
      let finalUpdated = false;

      // Detect changes - use edited values for comparison if in "My Review" tab
      const compareOfferLetterCharge = isMyReview ? selectedClient.edited_offer_letter_charge : selectedClient.payable_offer_letter_charge;
      const compareFirstYearPercentage = isMyReview ? selectedClient.edited_first_year_percentage : selectedClient.payable_first_year_percentage;
      const compareFirstYearFixedCharge = isMyReview ? selectedClient.edited_first_year_fixed_charge : selectedClient.payable_first_year_fixed_charge;
      const compareNetPayableFirstYearPrice = isMyReview ? selectedClient.edited_net_payable_first_year_price : selectedClient.net_payable_first_year_price;
      const compareFirstYearSalary = isMyReview ? selectedClient.edited_first_year_salary : selectedClient.first_year_salary;

      const offerLetterChanged = compareOfferLetterCharge !== formData.payable_offer_letter_charge;
      const firstYearChanged = compareFirstYearPercentage !== formData.payable_first_year_percentage || 
                              compareFirstYearFixedCharge !== formData.payable_first_year_fixed_charge ||
                              compareNetPayableFirstYearPrice !== formData.net_payable_first_year_price ||
                              compareFirstYearSalary !== formData.first_year_salary;

      // Update final configuration if any changes OR if in "My Review" tab (always send for admin review)
      if (offerLetterChanged || firstYearChanged || isMyReview) {
        const submitData = {
          payable_offer_letter_charge: formData.payable_offer_letter_charge,
          payable_first_year_percentage: formData.payable_first_year_percentage,
          payable_first_year_fixed_charge: formData.payable_first_year_fixed_charge,
          net_payable_first_year_price: formData.net_payable_first_year_price,
          first_year_salary: formData.first_year_salary || null,
          is_training_required: formData.is_training_required,
          Sales_person_id: userId,
          updatedBy: userId
        };
        const response = await axios.put(
          `${BASE_URL}/enrolled-clients/final-configuration/${selectedClient.id}`,
          submitData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        finalUpdated = response.data.success;
      }

      // Only create installments if NOT in "My Review" tab
      if (!isMyReview) {
        // Prepare installments data for combined API
        const offerLetterInstallments = [];
        const firstYearInstallments = [];

        // Add offer letter initial payment if exists
        if (formData.offer_letter_initial_payment && formData.offer_letter_initial_payment > 0) {
          offerLetterInstallments.push({
            amount: Number(formData.offer_letter_initial_payment),
            dueDate: new Date().toISOString().split('T')[0], // Today's date
            remark: 'Initial Payment'
          });
        }

        // Add offer letter regular installments
        formData.offer_letter_installments.forEach((installment, index) => {
          if (installment.amount > 0) {
            offerLetterInstallments.push({
              amount: Number(installment.amount),
              dueDate: installment.dueDate,
              remark: installment.remark || `Offer Letter Installment ${index + 1}`
            });
          }
        });

        // Add first year initial payment if exists
        if (formData.first_year_initial_payment && formData.first_year_initial_payment > 0) {
          firstYearInstallments.push({
            amount: Number(formData.first_year_initial_payment),
            dueDate: new Date().toISOString().split('T')[0], // Today's date
            remark: 'Initial Payment'
          });
        }

        // Add first year regular installments
        formData.first_year_installments.forEach((installment, index) => {
          if (installment.amount > 0) {
            firstYearInstallments.push({
              amount: Number(installment.amount),
              dueDate: installment.dueDate,
              remark: installment.remark || `First Year Installment ${index + 1}`
            });
          }
        });

        // Create combined installments using new API
        if (offerLetterInstallments.length > 0 || firstYearInstallments.length > 0) {
          try {
            await axios.post(
              `${BASE_URL}/installments/combined`,
              {
                enrolledClientId: selectedClient.id,
                offerLetterInstallments,
                firstYearInstallments
              },
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
          } catch (error) {
            console.error('Error creating combined installments:', error);
            throw error;
          }
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
        setTabsData(updatedResponse.data.data);
        const firstTabKey = Object.keys(updatedResponse.data.data)[0];
        setActiveTab(firstTabKey);
      }
      
      if (finalUpdated) {
        if (isMyReview) {
          alert('Configuration updated and sent back to admin for review!');
        } else {
          alert('Configuration submitted for admin review!');
        }
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
        { amount: remainingAmount, dueDate: '', remark: '' }
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

  // Add handleApprove function
  // const handleApprove = async (client: EnrolledClient) => {
  //   // Mark as approved by sales, refresh list
  //   try {
  //     const token = localStorage.getItem('token');
  //     const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
  //     await axios.put(`${BASE_URL}/enrolled-clients/accounts/sales/approve/${client.id}`, { approved: true, Sales_person_id: userId });
  //     // Refresh clients
  //     const response = await axios.get(`${BASE_URL}/enrolled-clients/accounts/sales`, { headers: { 'Authorization': `Bearer ${token}` } });
  //     if (response.data.success) setClients(response.data.data.leads || []);
  //   } catch (error) { alert('Error approving client'); }
  // };

  const handleViewInstallments = (client: EnrolledClient, chargeType: 'enrollment_charge' | 'offer_letter_charge' | 'first_year_charge') => {
    setSelectedClientForInstallments(client);
    setInstallmentChargeType(chargeType);
    setShowInstallmentsPopup(true);
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
          {/* Existing content below remains unchanged */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-[35px] font-bold">$</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 text-left">Finance Sale (Approved Enrollments)</h1>
              <p className="text-gray-600 text-sm text-start">All approved enrolled clients</p>
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
                          // Only update initial payment and clear installments if NOT in "My Review" tab
                          ...(activeTab !== 'My Review' && {
                            offer_letter_initial_payment: newValue,
                            offer_letter_installments: []
                          })
                        }));
                        // Only hide initial payment section if NOT in "My Review" tab
                        if (activeTab !== 'My Review') {
                          setShowOfferLetterInitialPayment(false);
                        }
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
                    <div className="grid grid-cols-4 gap-4">
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Initial Payment ($)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={formData.first_year_initial_payment ?? ''}
                            onChange={(e) => {
                              const inputValue = Number(e.target.value);
                              handleFirstYearInitialPaymentChange(inputValue);
                              if (inputValue < (formData.net_payable_first_year_price || 0)) {
                                setShowFirstYearInitialPayment(true);
                              }
                            }}
                            className={`w-full p-3 border ${
                              formData.firstYearInitialPaymentError ? 'border-red-300' : 'border-gray-300'
                            } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            required
                          />
                          {formData.first_year_initial_payment !== null && 
                           formData.first_year_initial_payment < (formData.net_payable_first_year_price || 0) && 
                           formData.first_year_installments.length === 0 && (
                            <button
                              type="button"
                              onClick={addFirstYearInstallment}
                              className="p-3 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Add Installment"
                            >
                              <FaPlus className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                        {formData.firstYearInitialPaymentError && (
                          <p className="text-red-500 text-sm mt-1">{formData.firstYearInitialPaymentError}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
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
                              net_payable_first_year_price: value,
                              first_year_initial_payment: value
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Initial Payment ($)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={formData.first_year_initial_payment ?? ''}
                            onChange={(e) => {
                              const inputValue = Number(e.target.value);
                              handleFirstYearInitialPaymentChange(inputValue);
                              if (inputValue < (formData.net_payable_first_year_price || 0)) {
                                setShowFirstYearInitialPayment(true);
                              }
                            }}
                            className={`w-full p-3 border ${
                              formData.firstYearInitialPaymentError ? 'border-red-300' : 'border-gray-300'
                            } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            required
                          />
                          {formData.first_year_initial_payment !== null && 
                           formData.first_year_initial_payment < (formData.net_payable_first_year_price || 0) && 
                           formData.first_year_installments.length === 0 && (
                            <button
                              type="button"
                              onClick={addFirstYearInstallment}
                              className="p-3 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Add Installment"
                            >
                              <FaPlus className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                        {formData.firstYearInitialPaymentError && (
                          <p className="text-red-500 text-sm mt-1">{formData.firstYearInitialPaymentError}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* First Year Remaining Amount */}
                  <div className="text-sm text-gray-600 mb-0">
                    Remaining amount to be added in installments: {formatCurrency(getFirstYearRemainingAmount())}
                  </div>

                  {/* First Year Installments Section */}
                  {formData.first_year_installments.length > 0 && (
                    <div className="mt-0 bg-green-50">
                      <div className="space-y-4">
                        {formData.first_year_installments.map((installment, index) => (
                          <div key={index} className="flex items-center gap-4 p-4 rounded-lg">
                            <div className="flex-none">
                              <span className="text-sm font-medium text-gray-700">First Year Installment {index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <div className="grid grid-cols-3 gap-4">
                                <div className="flex flex-col">
                                  <input
                                    type="number"
                                    value={installment.amount}
                                    onChange={(e) => updateFirstYearInstallment(index, 'amount', Number(e.target.value))}
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
                                    onChange={(e) => updateFirstYearInstallment(index, 'dueDate', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                    required
                                  />
                                </div>
                                <div>
                                  <input
                                    type="text"
                                    value={installment.remark}
                                    onChange={(e) => updateFirstYearInstallment(index, 'remark', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                    placeholder="Add a note..."
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="flex-none">
                              <button
                                type="button"
                                onClick={() => removeFirstYearInstallment(index)}
                                className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded-full transition-colors focus:outline-none"
                              >
                                <FaTrash className="w-4 h-4" />
                              </button>
                              {index === formData.first_year_installments.length - 1 && getFirstYearRemainingAmount() > 0 && (
                                <button
                                  type="button"
                                  onClick={addFirstYearInstallment}
                                  className="ml-2 text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded-full transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={getFirstYearRemainingAmount() <= 0}
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
                </div>

                {/* Training Required Checkbox */}
                <div className="mt-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_training_required"
                      checked={formData.is_training_required}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_training_required: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_training_required" className="ml-2 block text-sm text-gray-900">
                      Training Required
                    </label>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Training</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">First Call Status</th>
                  {activeTab !== 'Final Approval' && activeTab !== 'Admin Review' && (
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
                              {activeTab === 'Admin Review' 
                                ? formatCurrency(client.payable_offer_letter_charge)
                                : formatCurrency(client.edited_offer_letter_charge !== null ? client.edited_offer_letter_charge : client.payable_offer_letter_charge)
                              }
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
                              {activeTab === 'Admin Review' 
                                ? (client.payable_first_year_percentage
                                    ? `${client.payable_first_year_percentage}%`
                                    : formatCurrency(client.payable_first_year_fixed_charge))
                                : (client.edited_first_year_percentage !== null
                                    ? `${client.edited_first_year_percentage}%`
                                    : client.edited_first_year_fixed_charge !== null
                                      ? formatCurrency(client.edited_first_year_fixed_charge)
                                      : client.payable_first_year_percentage
                                        ? `${client.payable_first_year_percentage}%`
                                        : formatCurrency(client.payable_first_year_fixed_charge))
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
                    {activeTab !== 'Final Approval' && activeTab !== 'Admin Review' && (
                      <td className="px-6 py-4 whitespace-nowrap text-start text-sm font-medium">
                        {activeTab === 'My Review' && (
                          <>
                            <button 
                              onClick={() => handleAcceptAdminChanges(client)} 
                              className="text-green-600 hover:text-green-900 mr-2"
                              title="Accept Admin Changes"
                            >
                              <FaCheckCircle className="w-4 h-4" />
                            </button>
                            {/* <button onClick={() => handleEdit(client)} className="text-purple-600 hover:text-purple-900">Edit</button> */}
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
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
          chargeType={installmentChargeType}
          firstYearSalary={installmentChargeType === 'first_year_charge' ? selectedClientForInstallments.first_year_salary : undefined}
          netPayableFirstYear={installmentChargeType === 'first_year_charge' ? selectedClientForInstallments.net_payable_first_year_price : undefined}
          isMyReview={activeTab === 'My Review'}
          editedTotalCharge={
            installmentChargeType === 'enrollment_charge' 
              ? selectedClientForInstallments.edited_enrollment_charge
              : installmentChargeType === 'offer_letter_charge'
                ? selectedClientForInstallments.edited_offer_letter_charge
                : selectedClientForInstallments.edited_net_payable_first_year_price
          }
        />
      )}

      <ConfirmationPopup
        open={showConfirmationPopup}
        message="Are you sure you want to accept the admin's changes? This will move the configuration to final approval."
        onConfirm={handleConfirmApproval}
        onCancel={handleCancelApproval}
      />
    </div>
  );
};

export default AccountSale; 