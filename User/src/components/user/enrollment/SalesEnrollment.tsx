import React, { useState, useEffect } from 'react';
import { FaEdit, FaTimes, FaUserTie, FaGraduationCap, FaBox, FaCheckCircle, FaClock, FaFilePdf, FaUpload, FaInfoCircle, FaPlus, FaTrash, FaListAlt } from 'react-icons/fa';
import axios from 'axios';
import { motion } from 'framer-motion';
import PackageFeaturesPopup from './PackageFeaturesPopup';
import ConfirmationPopup from './ConfirmationPopup';
import InstallmentsPopup from './InstallmentsPopup';
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
  enrollment_installments: Installment[];
  initial_payment: number | null;
  is_training_required: boolean;
  first_call_status: 'pending' | 'onhold' | 'done';
  assignTo: number | null;
  lead: {
    id: number;
    firstName: string;
    lastName: string;
    primaryEmail: string;
    primaryContact: string;
    contactNumbers: string[];
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
  assignedMarketingTeam?: {
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

interface Installment {
  amount: number;
  dueDate: string;
  remark: string;
  errorMessage?: string;
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
  initialPaymentError?: string;
  totalAmountError?: string | null;
  is_training_required: boolean;
}

interface MarketingTeamLead {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  departmentId: number;
  status: string;
  department: {
    departmentName: string;
    isMarketingTeam: boolean;
  };
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
    pricing_type: null,
    enrollment_installments: [],
    initial_payment: null,
    is_training_required: false
  });
  const [enrollmentData, setEnrollmentData] = useState<any>(null);
  const [selectedResume, setSelectedResume] = useState<File | null>(null);
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPackageFeatures, setShowPackageFeatures] = useState(false);
  const [selectedPackageForFeatures, setSelectedPackageForFeatures] = useState<{name: string; features: string[]} | null>(null);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [pendingApprovalClient, setPendingApprovalClient] = useState<EnrolledClient | null>(null);
  const [showInitialPayment, setShowInitialPayment] = useState(false);
  const [showInstallmentsPopup, setShowInstallmentsPopup] = useState(false);
  const [selectedClientForInstallments, setSelectedClientForInstallments] = useState<EnrolledClient | null>(null);
  const [hasInstallmentError, setHasInstallmentError] = useState(false);

  // Assignment related state
  const [marketingTeamLeads, setMarketingTeamLeads] = useState<MarketingTeamLead[]>([]);
  const [selectedMarketingTeamLead, setSelectedMarketingTeamLead] = useState<string>('');
  const [currentMarketingTeamLead, setCurrentMarketingTeamLead] = useState<string>('');
  const [isLoadingMarketingTeamLeads, setIsLoadingMarketingTeamLeads] = useState(false);
  const [selectedClientsForAssignment, setSelectedClientsForAssignment] = useState<number[]>([]);
  const [assignmentRemark, setAssignmentRemark] = useState<string>('');
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);

  const pageSize = 10;

  useEffect(() => {
    fetchEnrolledClients();
    fetchPackages();
    fetchMarketingTeamLeads();
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

  const fetchMarketingTeamLeads = async () => {
    setIsLoadingMarketingTeamLeads(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/client-assignments/marketing-team-leads`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.data.success) {
        setMarketingTeamLeads(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching marketing team leads:', error);
      toast.error('Failed to fetch marketing team leads');
    } finally {
      setIsLoadingMarketingTeamLeads(false);
    }
  };

  const getCurrentMarketingTeamLead = (client: EnrolledClient) => {
    if (client.assignedMarketingTeam) {
      return `${client.assignedMarketingTeam.firstname} ${client.assignedMarketingTeam.lastname}`;
    }
    return '';
  };

  const getAssignmentButtonProps = () => {
    if (selectedClientsForAssignment.length === 0) {
      return { text: 'Select Clients', color: 'bg-gray-400' };
    }
    if (!selectedMarketingTeamLead) {
      return { text: 'Select Marketing Team Lead', color: 'bg-gray-400' };
    }
    
    // Check if any selected client is already assigned to any marketing team lead
    const selectedClients = getFilteredClients().filter(client => selectedClientsForAssignment.includes(client.id));
    const hasAssignedClients = selectedClients.some(client => client.assignedMarketingTeam);
    
    return { 
      text: hasAssignedClients ? 'Reassign to Marketing Team' : 'Assign to Marketing Team', 
      color: 'bg-blue-500 hover:bg-blue-600' 
    };
  };

  const handleClientCheckboxChange = (clientId: number) => {
    setSelectedClientsForAssignment(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleSelectAllClients = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clients = getFilteredClients();
    if (e.target.checked) {
      setSelectedClientsForAssignment(clients.map(client => client.id));
    } else {
      setSelectedClientsForAssignment([]);
    }
  };

  const handleAssignToMarketingTeam = async () => {
    if (selectedClientsForAssignment.length === 0 || !selectedMarketingTeamLead) {
      toast.error('Please select clients and a marketing team lead');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const selectedLead = marketingTeamLeads.find(lead => 
        `${lead.firstname} ${lead.lastname}` === selectedMarketingTeamLead
      );

      if (!selectedLead) {
        toast.error('Selected marketing team lead not found');
        return;
      }

      setShowAssignmentDialog(true);
    } catch (error) {
      console.error('Error preparing assignment:', error);
      toast.error('Failed to prepare assignment');
    }
  };

  const confirmAssignment = async () => {
    try {
      const token = localStorage.getItem('token');
      const selectedLead = marketingTeamLeads.find(lead => 
        `${lead.firstname} ${lead.lastname}` === selectedMarketingTeamLead
      );

      if (!selectedLead) {
        toast.error('Selected marketing team lead not found');
        return;
      }

      // Assign each selected client
      const assignmentPromises = selectedClientsForAssignment.map(clientId =>
        axios.post(`${BASE_URL}/client-assignments/assign-enrolled`, {
          clientId,
          assignedToId: selectedLead.id,
          remarkText: assignmentRemark || 'Assigned to marketing team'
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      );

      await Promise.all(assignmentPromises);

      toast.success(`Successfully assigned ${selectedClientsForAssignment.length} client(s) to marketing team`);
      
      // Reset state
      setSelectedClientsForAssignment([]);
      setSelectedMarketingTeamLead('');
      setAssignmentRemark('');
      setShowAssignmentDialog(false);
      
      // Refresh data
      fetchEnrolledClients();
    } catch (error) {
      console.error('Error assigning clients:', error);
      toast.error('Failed to assign clients to marketing team');
    }
  };

  const cancelAssignment = () => {
    setShowAssignmentDialog(false);
    setAssignmentRemark('');
  };

  const handleEdit = async (client: EnrolledClient) => {
    setSelectedClient(client);
    setShowForm(true);
    
    // Set form data with existing values or defaults from package
    const selectedPackage = packages.find(pkg => pkg.id === client.packageid);
    
    try {
      // Fetch existing installments
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

      // Calculate initial payment if installments exist
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
        initial_payment: initialPayment,
        is_training_required: client.is_training_required || false
      });

    } catch (error) {
      console.error('Error fetching installments:', error);
      toast.error('Error fetching existing installments');
      
      // Set form data without installments as fallback
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
        initial_payment: client.payable_enrollment_charge,
        is_training_required: client.is_training_required || false
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
        initial_payment: null // Don't set initial payment when package changes
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

  // Add new functions for handling installments
  const addInstallment = () => {
    if (!selectedClient) return;
    
    const totalCharge = formData.payable_enrollment_charge || 0;
    if (totalCharge === 0) {
      toast.error('Cannot add installments when enrollment charge is 0');
      return;
    }

    if (!showInitialPayment) {
      setShowInitialPayment(true);
      return;
    }

    if (!formData.initial_payment) {
      toast.error('Please enter the initial payment amount first');
      return;
    }

    // Calculate total of existing installments
    const totalExistingAmount = formData.enrollment_installments.reduce((sum, inst) => sum + Number(inst.amount), 0);
    const remainingAmount = totalCharge - (formData.initial_payment + totalExistingAmount);

    if (remainingAmount <= 0) {
      toast.error('Total installment amount cannot exceed the remaining charge');
      return;
    }

    setFormData(prev => ({
      ...prev,
      enrollment_installments: [
        ...prev.enrollment_installments,
        { amount: remainingAmount, dueDate: '', remark: '' }
      ]
    }));

    // Hide the plus button by setting showInitialPayment to false
    setShowInitialPayment(false);
  };

  const updateInstallment = (index: number, field: keyof Installment, value: string | number) => {
    setFormData(prev => {
      const newInstallments = [...prev.enrollment_installments];
      const enrollmentChargeNum = Number(prev.payable_enrollment_charge || 0);
      
      if (field === 'amount') {
        const numValue = Number(value);
        const totalOtherInstallments = prev.enrollment_installments.reduce((sum, inst, i) => 
          i === index ? sum : sum + Number(inst.amount), 0);
        const totalAmount = (prev.initial_payment || 0) + totalOtherInstallments + numValue;
        
        if (totalAmount > enrollmentChargeNum) {
          newInstallments[index] = { 
            ...newInstallments[index], 
            [field]: numValue,
            errorMessage: `Total amount ($${totalAmount.toFixed(2)}) cannot exceed enrollment charge ($${enrollmentChargeNum.toFixed(2)})`
          };
          return {
            ...prev,
            enrollment_installments: newInstallments
          };
        }
      }

      newInstallments[index] = { 
        ...newInstallments[index], 
        [field]: field === 'amount' ? Number(value) : value,
        errorMessage: undefined
      };

      return {
        ...prev,
        enrollment_installments: newInstallments,
        initialPaymentError: undefined // Clear initial payment error when installment is valid
      };
    });
  };

  const removeInstallment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      enrollment_installments: prev.enrollment_installments.filter((_, i) => i !== index)
    }));
  };

  // Add this new component for displaying installment summary
  // const InstallmentSummary: React.FC<{ formData: FormData }> = ({ formData }) => {
  //   const totalCharge = formData.payable_enrollment_charge || 0;
  //   const initialPayment = formData.initial_payment || 0;
  //   const totalInstallments = formData.enrollment_installments.reduce((sum, inst) => sum + inst.amount, 0);
  //   const remainingAmount = totalCharge - (initialPayment + totalInstallments);

  //   // Update error state whenever amounts change
  //   useEffect(() => {
  //     setHasInstallmentError(remainingAmount < 0);
  //   }, [remainingAmount]);

  //   return (
  //     <div className="mt-4 p-4 bg-blue-50 rounded-lg">
  //       <h4 className="text-sm font-medium text-gray-900 mb-2">Installment Summary</h4>
  //       <div className="grid grid-cols-4 gap-4 text-sm">
  //         <div>
  //           <span className="text-gray-600">Total Charge:</span>
  //           <div className="font-medium">{formatCurrency(totalCharge)}</div>
  //         </div>
  //         <div>
  //           <span className="text-gray-600">Initial Payment:</span>
  //           <div className="font-medium">{formatCurrency(initialPayment)}</div>
  //         </div>
  //         <div>
  //           <span className="text-gray-600">Total Installments:</span>
  //           <div className="font-medium">{formatCurrency(totalInstallments)}</div>
  //         </div>
  //         <div>
  //           <span className="text-gray-600">Remaining Amount:</span>
  //           <div className={`font-medium ${remainingAmount < 0 ? 'text-red-600' : 'text-blue-600'}`}>
  //             {formatCurrency(remainingAmount)}
  //             {remainingAmount < 0 && (
  //               <div className="text-xs text-red-600 mt-1">
  //                 Total amount cannot exceed the total charge
  //               </div>
  //             )}
  //           </div>
  //         </div>
  //       </div>
  //       {remainingAmount > 0 && (
  //         <div className="mt-2 text-sm text-blue-600">
  //           Please add installments for the remaining amount of {formatCurrency(remainingAmount)}
  //         </div>
  //       )}
  //     </div>
  //   );
  // };



  // Update validation function
  const validateTotalAmount = () => {
    const totalInstallments = formData.enrollment_installments.reduce((sum, inst) => sum + Number(inst.amount || 0), 0);
    const totalAmount = Number(formData.initial_payment || 0) + totalInstallments;
    const enrollmentCharge = Number(formData.payable_enrollment_charge || 0);

    // If initial payment equals enrollment charge, no validation needed
    if (Math.abs(formData.initial_payment! - enrollmentCharge) < 0.01) {
      return null;
    }

    // Only validate total amount if there are installments
    if (formData.enrollment_installments.length > 0 && Math.abs(totalAmount - enrollmentCharge) > 0.01) {
      return `Total amount ($${Number(totalAmount).toFixed(2)}) must equal enrollment charge ($${Number(enrollmentCharge).toFixed(2)})`;
    }
    return null;
  };

  // Update handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    // Check for any validation errors
    const hasFieldErrors = formData.initialPaymentError || 
                         formData.enrollment_installments.some(inst => inst.errorMessage);

    // Check total amount validation
    const totalAmountError = validateTotalAmount();
    if (totalAmountError || hasFieldErrors) {
      setFormData(prev => ({
        ...prev,
        totalAmountError: totalAmountError
      }));
      return;
    }

    setFormLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = JSON.parse(localStorage.getItem('user') || '{}').id;

      const submitData = {
        ...formData,
        Sales_person_id: userId,
        updatedBy: userId,
        // If admin has approved, sync the edited amounts with payable amounts
        ...(selectedClient.Approval_by_admin && {
          payable_enrollment_charge: formData.payable_enrollment_charge,
          payable_offer_letter_charge: formData.payable_offer_letter_charge,
          payable_first_year_percentage: formData.payable_first_year_percentage,
          payable_first_year_fixed_charge: formData.payable_first_year_fixed_charge,
          edited_enrollment_charge: formData.payable_enrollment_charge,
          edited_offer_letter_charge: formData.payable_offer_letter_charge,
          edited_first_year_percentage: formData.payable_first_year_percentage,
          edited_first_year_fixed_charge: formData.payable_first_year_fixed_charge
        })
      };

      // First update the enrolled client
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

      // If enrolled client update is successful, handle installments
      if (response.data.success) {
        // First get existing installments
        const existingInstallmentsResponse = await axios.get(
          `${BASE_URL}/installments/enrolled-client/${selectedClient.id}?charge_type=enrollment_charge`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const existingInstallments = existingInstallmentsResponse.data.success ? 
          existingInstallmentsResponse.data.data.installments : [];

        // Always handle initial payment if it exists
        if (formData.payable_enrollment_charge && formData.payable_enrollment_charge > 0) {
          const existingInitialPayment = existingInstallments.find((inst: any) => inst.installment_number === 0);
          
          if (existingInitialPayment) {
            // Update existing initial payment
            await axios.put(
              `${BASE_URL}/installments/${existingInitialPayment.id}`,
              {
                amount: formData.initial_payment || formData.payable_enrollment_charge,
                dueDate: new Date().toISOString().split('T')[0],
                remark: 'Initial Payment at Enrollment',
                is_initial_payment: true,
                paid: true,
                paidDate: new Date().toISOString().split('T')[0],
                updatedBy: userId,
                // If admin has approved, sync the edited amount with actual amount
                ...(selectedClient.Approval_by_admin && {
                  amount: formData.initial_payment || formData.payable_enrollment_charge,
                  edited_amount: formData.initial_payment || formData.payable_enrollment_charge
                })
              },
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
          } else {
            // Create new initial payment
            await axios.post(
              `${BASE_URL}/installments`,
              {
                enrolledClientId: selectedClient.id,
                charge_type: 'enrollment_charge',
                installment_number: 0,
                amount: formData.initial_payment || formData.payable_enrollment_charge,
                dueDate: new Date().toISOString().split('T')[0],
                remark: 'Initial Payment at Enrollment',
                is_initial_payment: true,
                paid: true,
                paidDate: new Date().toISOString().split('T')[0],
                // If admin has approved, set edited amount same as amount
                ...(selectedClient.Approval_by_admin && {
                  edited_amount: formData.initial_payment || formData.payable_enrollment_charge
                })
              },
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
          }
        }

        // Handle remaining installments
        if (formData.enrollment_installments.length > 0) {
          const installmentPromises = formData.enrollment_installments.map((installment, index) => {
            const existingInstallment = existingInstallments.find(
              (inst: any) => inst.installment_number === (index + 1)
            );

            if (existingInstallment) {
              // Update existing installment
              return axios.put(
                `${BASE_URL}/installments/${existingInstallment.id}`,
                {
                  amount: installment.amount,
                  dueDate: installment.dueDate,
                  remark: installment.remark,
                  is_initial_payment: false,
                  updatedBy: userId,
                  // If admin has approved, sync the edited amount with actual amount
                  ...(selectedClient.Approval_by_admin && {
                    amount: installment.amount,
                    edited_amount: installment.amount
                  })
                },
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
            } else {
              // Create new installment
              return axios.post(
                `${BASE_URL}/installments`,
                {
                  enrolledClientId: selectedClient.id,
                  charge_type: 'enrollment_charge',
                  installment_number: index + 1,
                  amount: installment.amount,
                  dueDate: installment.dueDate,
                  remark: installment.remark,
                  is_initial_payment: false,
                  // If admin has approved, set edited amount same as amount
                  ...(selectedClient.Approval_by_admin && {
                    edited_amount: installment.amount
                  })
                },
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
            }
          });

          await Promise.all(installmentPromises);
        }
      }

      setSelectedClient(null);
      setShowUpdateForm(false);
      setShowForm(false);
      fetchEnrolledClients();
      toast.success(showUpdateForm ? 'Configuration updated and sent to admin for confirmation!' : 'Enrollment updated successfully!');
    } catch (error) {
      console.error('Error updating enrollment:', error);
      toast.error('Error updating enrollment');
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
        // If approved, also mark initial payment as paid
        if (approved) {
          try {
            // Find the initial payment installment
            const installmentsResponse = await axios.get(
              `${BASE_URL}/installments/enrolled-client/${selectedClient.id}?charge_type=enrollment_charge`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );

            if (installmentsResponse.data.success) {
              const installments = installmentsResponse.data.data.installments;
              const initialPayment = installments.find((inst: any) => inst.installment_number === 0);
              
              if (initialPayment) {
                // Update the initial payment to mark it as paid
                await axios.put(
                  `${BASE_URL}/installments/${initialPayment.id}`,
                  {
                    paid: true,
                    paidDate: new Date().toISOString().split('T')[0],
                    paid_at: new Date().toISOString(),
                    updatedBy: userId
                  },
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );
              }
            }
          } catch (error) {
            console.error('Error updating initial payment:', error);
            // Don't fail the entire approval process if initial payment update fails
          }
        }

        setSelectedClient(null);
        fetchEnrolledClients();
        toast.success('Admin changes approved!');
      } else {
        toast.error(response.data.message || 'Error processing approval');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error('Error processing approval');
    } finally {
      setFormLoading(false);
    }
  };

  // Update handleUpdateClick to properly handle initial payment and installments
  const handleUpdateClick = async () => {
    if (!selectedClient) return;
    
    try {
      // Fetch existing installments
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${BASE_URL}/installments/enrolled-client/${selectedClient.id}?charge_type=enrollment_charge`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const allInstallments = response.data.success ? response.data.data.installments : [];
      
      // Find initial payment (installment with installment_number = 0)
      const initialPaymentInstallment = allInstallments.find((inst: any) => inst.installment_number === 0);
      
      // Get regular installments (installment_number > 0)
      const regularInstallments = allInstallments
        .filter((inst: any) => inst.installment_number > 0)
        .sort((a: any, b: any) => a.installment_number - b.installment_number);

      // Set form data with proper initial payment and installments
      setFormData({
        packageid: selectedClient.packageid,
        payable_enrollment_charge: selectedClient.edited_enrollment_charge || selectedClient.payable_enrollment_charge,
        payable_offer_letter_charge: selectedClient.edited_offer_letter_charge || selectedClient.payable_offer_letter_charge,
        payable_first_year_percentage: selectedClient.edited_first_year_percentage || selectedClient.payable_first_year_percentage,
        payable_first_year_fixed_charge: selectedClient.edited_first_year_fixed_charge || selectedClient.payable_first_year_fixed_charge,
        pricing_type: selectedClient.edited_first_year_percentage ? 'percentage' : 'fixed',
        enrollment_installments: regularInstallments.map((inst: any) => ({
          amount: Number(inst.edited_amount || inst.amount),
          dueDate: inst.edited_dueDate || inst.dueDate,
          remark: inst.edited_remark || inst.remark || '',
          installment_number: inst.installment_number
        })),
        initial_payment: initialPaymentInstallment ? Number(initialPaymentInstallment.edited_amount || initialPaymentInstallment.amount) : null,
        is_training_required: selectedClient.is_training_required || false
      });

      if (initialPaymentInstallment) {
        setShowInitialPayment(true);
      }
    } catch (error) {
      console.error('Error fetching installments:', error);
      // Set form data without installments as fallback
      setFormData({
        packageid: selectedClient.packageid,
        payable_enrollment_charge: selectedClient.edited_enrollment_charge || selectedClient.payable_enrollment_charge,
        payable_offer_letter_charge: selectedClient.edited_offer_letter_charge || selectedClient.payable_offer_letter_charge,
        payable_first_year_percentage: selectedClient.edited_first_year_percentage || selectedClient.payable_first_year_percentage,
        payable_first_year_fixed_charge: selectedClient.edited_first_year_fixed_charge || selectedClient.payable_first_year_fixed_charge,
        pricing_type: selectedClient.edited_first_year_percentage ? 'percentage' : 'fixed',
        enrollment_installments: [],
        initial_payment: selectedClient.edited_enrollment_charge || selectedClient.payable_enrollment_charge,
        is_training_required: selectedClient.is_training_required || false
      });
    }
    
    setShowUpdateForm(true);
  };

  const getStatusBadge = (client: EnrolledClient) => {
    if (client.Approval_by_sales && client.Approval_by_admin) {
      return (
        <div>
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Fully Approved</span>
          <br />
          <span className="text-gray-500 text-xs mt-1">Initial credentials email sent.</span>
        </div>
      );
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
        setSelectedResume(file); // Set the selected file for display
        fetchEnrolledClients(); // Refresh data
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast.error('Failed to upload resume');
    }
  };

  // Add resume preview handler
  const handleResumePreview = async (resumePath: string | null, clientId: number) => {
    if (!resumePath) {
      toast.error('No resume available');
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
      toast.error('Failed to load resume');
    }
  };

  // Add handler for package features
  const handleShowFeatures = (packageName: string, features: string[]) => {
    setSelectedPackageForFeatures({ name: packageName, features });
    setShowPackageFeatures(true);
  };

  // const handleApprovalIconClick = (client: EnrolledClient) => {
  //   setPendingApprovalClient(client);
  //   setShowConfirmPopup(true);
  // };
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

  // Add function to handle installments view
  const handleViewInstallments = (client: EnrolledClient) => {
    setSelectedClientForInstallments(client);
    setShowInstallmentsPopup(true);
  };

  // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  //   const { name, value } = e.target;
  //   const newValue = name.includes('Charge') || name === 'firstYearSalaryPercentage' || name === 'firstYearFixedPrice' 
  //     ? value === '' ? null : Number(value) 
  //     : value;
    
  //   setFormData(prev => {
  //     const updatedData = {
  //       ...prev,
  //       [name]: newValue,
  //       // If enrollment charge is changed, reset installments and initial payment
  //       ...(name === 'payable_enrollment_charge' ? {
  //         enrollment_installments: [],
  //         initial_payment: null
  //       } : {})
  //     };

  //     // Handle mutual exclusivity between firstYearSalaryPercentage and firstYearFixedPrice
  //     if (name === 'payable_first_year_percentage' && newValue !== null) {
  //       updatedData.payable_first_year_fixed_charge = null;
  //     } else if (name === 'payable_first_year_fixed_charge' && newValue !== null) {
  //       updatedData.payable_first_year_percentage = null;
  //     }

  //     return updatedData;
  //   });

  //   // Reset installment-related states when enrollment charge changes
  //   if (name === 'payable_enrollment_charge') {
  //     setShowInitialPayment(false);
  //     setHasInstallmentError(false);
  //   }
  // };

  const getRemainingAmount = () => {
    const totalCharge = formData.payable_enrollment_charge || 0;
    const initialPayment = formData.initial_payment || 0;
    const totalExistingAmount = formData.enrollment_installments.reduce((sum, inst) => sum + Number(inst.amount), 0);
    return totalCharge - (initialPayment + totalExistingAmount);
  };

  // const getRemainingAmountForInstallment = (index: number) => {
  //   const totalCharge = formData.payable_enrollment_charge || 0;
  //   const initialPayment = formData.initial_payment || 0;
  //   const totalExistingAmount = formData.enrollment_installments.reduce((sum, inst, i) => 
  //     i === index ? sum : sum + Number(inst.amount), 0);
  //   return totalCharge - (initialPayment + totalExistingAmount);
  // };

  // Update handleInitialPaymentChange function
  const handleInitialPaymentChange = (value: number) => {
    setFormData(prev => {
      const newInitialPayment = value;
      const totalInstallments = prev.enrollment_installments.reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0);
      const totalAmount = newInitialPayment + totalInstallments;
      const enrollmentChargeNum = Number(prev.payable_enrollment_charge || 0);
      
      let errorMessage = '';
      if (totalAmount > enrollmentChargeNum) {
        errorMessage = `Total amount ($${totalAmount.toFixed(2)}) cannot exceed enrollment charge ($${enrollmentChargeNum.toFixed(2)})`;
      }

      return {
        ...prev,
        initial_payment: newInitialPayment,
        initialPaymentError: errorMessage // Add this to FormData interface
      };
    });
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

        {/* Assignment Section */}
        {activeTab === 'approved' && (
          <div className="bg-white rounded-xl shadow-sm mb-6">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    placeholder="Search by name, email, phone..."
                    className="border px-4 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <select 
                    className={`border px-4 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      selectedClientsForAssignment.length === 0 ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                    }`}
                    value={selectedMarketingTeamLead}
                    onChange={(e) => {
                      setSelectedMarketingTeamLead(e.target.value);
                      if (e.target.value) {
                        setCurrentMarketingTeamLead('');
                      }
                    }}
                    disabled={selectedClientsForAssignment.length === 0}
                  >
                    <option value="">Select marketing team lead</option>
                    {isLoadingMarketingTeamLeads ? (
                      <option value="" disabled>Loading marketing team leads...</option>
                    ) : (
                      marketingTeamLeads.map((user) => {
                        const userName = `${user.firstname} ${user.lastname}`;
                        // Check if any selected client is already assigned to this user
                        const selectedClients = getFilteredClients().filter(client => selectedClientsForAssignment.includes(client.id));
                        const isCurrentlyAssigned = selectedClients.some(client => 
                          client.assignedMarketingTeam && 
                          client.assignedMarketingTeam.id === user.id
                        );
                        
                        return (
                          <option 
                            key={user.id}
                            value={userName}
                            disabled={isCurrentlyAssigned}
                          >
                            {userName} {isCurrentlyAssigned ? '(Currently Assigned)' : ''}
                          </option>
                        );
                      })
                    )}
                  </select>
                  <button 
                    className={`${getAssignmentButtonProps().color} text-white px-5 py-2 rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow ${!selectedMarketingTeamLead || selectedClientsForAssignment.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={handleAssignToMarketingTeam}
                    disabled={!selectedMarketingTeamLead || selectedClientsForAssignment.length === 0}
                    title={!selectedMarketingTeamLead ? 'Please select marketing team lead to assign' : selectedClientsForAssignment.length === 0 ? 'Please select clients to assign' : ''}
                  >
                    {getAssignmentButtonProps().text}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                    <span className="font-medium">Phone:</span> {selectedClient.lead.contactNumbers?.join(', ')}
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
                  Initial Payment
                </label>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={formData.initial_payment ?? formData.payable_enrollment_charge ?? ''}
                      onChange={(e) => {
                        const inputValue = Number(e.target.value);
                        handleInitialPaymentChange(inputValue);
                        if (inputValue < (formData.payable_enrollment_charge || 0)) {
                          setShowInitialPayment(true);
                        }
                      }}
                      className={`w-full p-3 border ${
                        formData.initialPaymentError ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                    {formData.initial_payment !== null && 
                     formData.initial_payment < (formData.payable_enrollment_charge || 0) && 
                     formData.enrollment_installments.length === 0 && (
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
                  {formData.initialPaymentError && (
                    <p className="text-red-500 text-sm mt-1">{formData.initialPaymentError}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Installments Section */}
            {formData.initial_payment !== null && formData.initial_payment < (formData.payable_enrollment_charge || 0) && (
              <div className="mt-4">
                <div className="text-sm text-gray-600 mb-3">
                  Remaining amount to be added in installments: {formatCurrency(getRemainingAmount())}
                </div>
                {formData.totalAmountError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
                    <p className="text-red-600 text-sm">{formData.totalAmountError}</p>
                  </div>
                )}
                <div className="space-y-4 bg-blue-50">
                  {formData.enrollment_installments.map((installment, index) => (
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
                              onChange={(e) => {
                                const installmentAmount = Number(e.target.value);
                                updateInstallment(index, 'amount', installmentAmount);
                              }}
                              className={`w-full p-2 border ${
                                installment.errorMessage 
                                  ? 'border-red-300' 
                                  : 'border-gray-300'
                              } rounded-md text-sm`}
                              placeholder={index === formData.enrollment_installments.length - 1 ? String(getRemainingAmount()) : "0.00"}
                              step="0.01"
                              required
                            />
                            {installment.errorMessage && (
                              <p className="text-red-500 text-xs mt-1">{installment.errorMessage}</p>
                            )}
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
                        {index === formData.enrollment_installments.length - 1 && getRemainingAmount() > 0 && (
                          <button
                            type="button"
                            onClick={addInstallment}
                            className="ml-2 text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded-full transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={getRemainingAmount() <= 0}
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

            {/* First Year Pricing Type and Value */}
            <div className="grid grid-cols-3 gap-4 mt-4">
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

            {/* Training Required Checkbox */}
            <div className="mt-6 border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-4 text-left">Training Configuration</h3>
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

            {/* Add Resume Upload Section before Form Actions */}
            <div className="mt-6 border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-4 text-left">Resume Upload</h3>
              <div className="flex items-center gap-4">
                {/* Upload input and file name side by side */}
                <div className="flex items-center w-full">
                  <label className="flex justify-center px-4 py-4 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 transition-colors bg-blue-50 cursor-pointer w-[400px]">
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
                  {/* Show the uploaded or selected resume name exactly to the right */}
                  <div className="ml-6 flex items-center min-w-0">
                    {(selectedResume && selectedResume.name) ? (
                      <span className="text-sm text-gray-700 truncate">{selectedResume.name}</span>
                    ) : (selectedClient && selectedClient.resume ? (
                      <span className="text-sm text-gray-700 truncate">{(() => {
                        const parts = selectedClient.resume.split(/[\\/]/);
                        return parts[parts.length - 1];
                      })()}</span>
                    ) : null)}
                  </div>
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
                    pricing_type: null,
                    enrollment_installments: [],
                    initial_payment: null,
                    is_training_required: false
                  });
                  setHasInstallmentError(false);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={!selectedClient}
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={Boolean(formLoading) || Boolean(formData.initialPaymentError) || formData.enrollment_installments.some(inst => !!inst.errorMessage)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {formLoading ? 'Updating...' : 'Send Updated Configuration'}
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
                    <span className="font-medium">Phone:</span> {selectedClient.lead.contactNumbers?.join(', ')}
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
                    <span className="font-medium">Phone:</span> {selectedClient.lead.contactNumbers?.join(', ')}
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
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={formData.payable_enrollment_charge ?? ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, payable_enrollment_charge: Number(e.target.value) }))}
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Initial Payment
                  </label>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={formData.initial_payment ?? formData.payable_enrollment_charge ?? ''}
                        onChange={(e) => {
                          const inputValue = Number(e.target.value);
                          handleInitialPaymentChange(inputValue);
                          if (inputValue < (formData.payable_enrollment_charge || 0)) {
                            setShowInitialPayment(true);
                          }
                        }}
                        className={`w-full p-3 border ${
                          formData.initialPaymentError ? 'border-red-300' : 'border-gray-300'
                        } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required
                      />
                      {formData.initial_payment !== null && 
                       formData.initial_payment < (formData.payable_enrollment_charge || 0) && 
                       formData.enrollment_installments.length === 0 && (
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
                    {formData.initialPaymentError && (
                      <p className="text-red-500 text-sm mt-1">{formData.initialPaymentError}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Installments Section */}
              {formData.initial_payment !== null && formData.initial_payment < (formData.payable_enrollment_charge || 0) && (
                <div className="mt-4">
                  <div className="text-sm text-gray-600 mb-3">
                    Remaining amount to be added in installments: {formatCurrency(getRemainingAmount())}
                  </div>
                  {formData.totalAmountError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
                      <p className="text-red-600 text-sm">{formData.totalAmountError}</p>
                    </div>
                  )}
                  <div className="space-y-4">
                    {formData.enrollment_installments.map((installment, index) => (
                      <div key={index} className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                        <div className="flex-none">
                          <span className="text-sm font-medium text-gray-700">Installment {index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col">
                              <input
                                type="number"
                                value={installment.amount}
                                onChange={(e) => {
                                  const installmentAmount = Number(e.target.value);
                                  updateInstallment(index, 'amount', installmentAmount);
                                }}
                                className={`w-full p-2 border ${
                                  installment.errorMessage 
                                    ? 'border-red-300' 
                                    : 'border-gray-300'
                                } rounded-md text-sm`}
                                placeholder={index === formData.enrollment_installments.length - 1 ? String(getRemainingAmount()) : "0.00"}
                                step="0.01"
                                required
                              />
                              {installment.errorMessage && (
                                <p className="text-red-500 text-xs mt-1">{installment.errorMessage}</p>
                              )}
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
                          {index === formData.enrollment_installments.length - 1 && getRemainingAmount() > 0 && (
                            <button
                              type="button"
                              onClick={addInstallment}
                              className="ml-2 text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded-full transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={getRemainingAmount() <= 0}
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

              {/* First Year Pricing Type and Value */}
              <div className="grid grid-cols-3 gap-4">
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
                  disabled={formLoading || hasInstallmentError}
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

        {/* Add InstallmentsPopup */}
        {showInstallmentsPopup && selectedClientForInstallments && (
          <InstallmentsPopup
            isOpen={showInstallmentsPopup}
            onClose={() => {
              setShowInstallmentsPopup(false);
              setSelectedClientForInstallments(null);
            }}
            enrolledClientId={selectedClientForInstallments.id}
            totalCharge={selectedClientForInstallments.payable_enrollment_charge}
            isMyReview={activeTab === 'my_review'}
            editedTotalCharge={activeTab === 'my_review' ? selectedClientForInstallments.edited_enrollment_charge : undefined}
          />
        )}

        {/* Enrolled Clients Grid */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {activeTab === 'approved' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        onChange={handleSelectAllClients}
                        checked={selectedClientsForAssignment.length === getFilteredClients().length && getFilteredClients().length > 0}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Enrolled Date
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Training Required
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    First Call Status
                  </th>
                  {activeTab === 'approved' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marketing Team
                    </th>
                  )}
                  {(activeTab !== 'approved' && activeTab !== 'admin_pending') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredClients().map((client: EnrolledClient, idx: number) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    {activeTab === 'approved' && (
                      <td className="px-6 py-4 whitespace-nowrap text-start">
                        <input
                          type="checkbox"
                          onChange={() => handleClientCheckboxChange(client.id)}
                          checked={selectedClientsForAssignment.includes(client.id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-start">{(currentPage - 1) * pageSize + idx + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-start">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {client.lead.firstName} {client.lead.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{client.lead.primaryEmail}</div>
                          {client.lead.contactNumbers && (
                            <div className="text-sm text-gray-500">{client.lead.contactNumbers.join(', ')}</div>
                          )}
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
                      {client.package && (
                        <div className={`${packageColorThemes[client.package.planName]?.bg || 'bg-gray-50'} 
                                         ${packageColorThemes[client.package.planName]?.border || 'border-gray-200'} 
                                         border rounded-lg p-3 space-y-2`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewInstallments(client)}
                                className={`${packageColorThemes[client.package.planName]?.text || 'text-gray-600'} hover:opacity-75 transition-opacity`}
                                title="View Installments"
                              >
                                <FaListAlt className="w-4 h-4" />
                              </button>
                              <span className="text-sm font-medium text-gray-700">Enrollment:</span>
                            </div>
                            <span className="text-sm text-gray-900">
                              {formatCurrency(
                                activeTab === 'approved'
                                  ? (client.edited_enrollment_charge !== null ? client.edited_enrollment_charge : client.payable_enrollment_charge)
                                  : (activeTab === 'my_review' && client.edited_enrollment_charge !== null)
                                    ? client.edited_enrollment_charge
                                    : client.payable_enrollment_charge
                              )}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Offer Letter:</span>
                            <span className="text-sm text-gray-900">
                              {formatCurrency(
                                activeTab === 'approved'
                                  ? (client.edited_offer_letter_charge !== null ? client.edited_offer_letter_charge : client.payable_offer_letter_charge)
                                  : (activeTab === 'my_review' && client.edited_offer_letter_charge !== null)
                                    ? client.edited_offer_letter_charge
                                    : client.payable_offer_letter_charge
                              )}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">First Year:</span>
                            <span className="text-sm text-gray-900">
                              {activeTab === 'approved'
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
                            </span>
                          </div>
                        </div>
                      )}
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
                    <td className="px-6 py-4 text-sm  whitespace-nowrap text-start">
                      <a
                        href={`mailto:${client.lead.primaryEmail}`}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-2"
                        title="Send Email"
                      >
                        {/* <FaEnvelope className="w-4 h-4" /> */}
                        <span>Send Email</span>
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-start">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        client.is_training_required 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {client.is_training_required ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-start">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        client.first_call_status === 'done' 
                          ? 'bg-green-100 text-green-800'
                          : client.first_call_status === 'onhold'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {client.first_call_status ? client.first_call_status.charAt(0).toUpperCase() + client.first_call_status.slice(1) : 'Pending'}
                      </span>
                    </td>
                    {activeTab === 'approved' && (
                      <td className="px-6 py-4 whitespace-nowrap text-start">
                        {client.assignedMarketingTeam ? (
                          <span className="text-sm text-green-600 font-medium">
                            {client.assignedMarketingTeam.firstname} {client.assignedMarketingTeam.lastname}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">Unassigned</span>
                        )}
                      </td>
                    )}
                    {activeTab !== 'approved' && (
                      <td className="px-6 py-4 whitespace-nowrap text-start text-sm font-medium">
                      {activeTab === 'all' && !(client.Approval_by_sales && client.Approval_by_admin) && (
                        <button
                          onClick={() => handleEdit(client)}
                          className="text-purple-600 hover:text-blue-900 mr-3"
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

      {/* Assignment Dialog */}
      {showAssignmentDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Assign to Marketing Team
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 mb-4">
                  Assign {selectedClientsForAssignment.length} client(s) to {selectedMarketingTeamLead}
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignment Remark (Optional)
                  </label>
                  <textarea
                    value={assignmentRemark}
                    onChange={(e) => setAssignmentRemark(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter assignment remark..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelAssignment}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAssignment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Confirm Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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