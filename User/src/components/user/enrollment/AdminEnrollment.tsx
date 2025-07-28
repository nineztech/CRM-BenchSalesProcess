import React, { useState, useEffect } from 'react';
import { FaEdit, FaTimes, FaUserCog, FaGraduationCap, FaClock, FaCheckCircle, FaInfoCircle, FaFilePdf, FaUpload, FaEnvelope, FaUserPlus, FaExchangeAlt, FaListAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import axios from 'axios';
import PackageFeaturesPopup from './PackageFeaturesPopup';
import ConfirmationPopup from './ConfirmationPopup';
import AssignmentDialog from './AssignmentDialog';
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
  is_training_required: boolean;
  first_call_status: 'pending' | 'onhold' | 'done';
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
  assignedTeamLead?: {
    id: number;
    firstname: string;
    lastname: string;
  };
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
  edited_installments: {
    id: number;
    amount: number;
    dueDate: string;
    remark: string;
    installment_number: number;
    is_initial_payment?: boolean;
  }[];
}

// Update the interface to match User interface from AssignmentDialog
interface MarketingTeamLead {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  status: string;
  subrole: string;
  departmentId: number;
  department?: {
    departmentName: string;
  };
}

// Add color themes mapping after the interfaces
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

const AdminEnrollment: React.FC = () => {
  const [_packages, setPackages] = useState<Package[]>([]);
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
    pricing_type: null,
    edited_installments: []
  });
  const [enrollmentData, setEnrollmentData] = useState<any>(null);
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPackageFeatures, setShowPackageFeatures] = useState(false);
  const [selectedPackageForFeatures, setSelectedPackageForFeatures] = useState<{name: string; features: string[]} | null>(null);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [pendingApprovalClient, setPendingApprovalClient] = useState<EnrolledClient | null>(null);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [selectedClientsForAssignment, setSelectedClientsForAssignment] = useState<EnrolledClient[]>([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [marketingTeamLeads, setMarketingTeamLeads] = useState<MarketingTeamLead[]>([]);
  const [selectedTeamLead, setSelectedTeamLead] = useState<string>('');
  const [isLoadingTeamLeads, setIsLoadingTeamLeads] = useState(false);
  const [currentAssignments, setCurrentAssignments] = useState<{[key: number]: number}>({});
  const [installments, setInstallments] = useState<any[]>([]);
  const [loadingInstallments, setLoadingInstallments] = useState(false);
  const [showInstallmentsPopup, setShowInstallmentsPopup] = useState(false);
  const [installmentError, setInstallmentError] = useState<string | null>(null);

  const pageSize = 10;

  useEffect(() => {
    fetchEnrolledClients();
    fetchPackages();
    fetchMarketingTeamLeads();
  }, [currentPage, activeTab]);

  // Add this function to check if a client is assigned
  const isClientAssigned = (clientId: number) => {
    return currentAssignments.hasOwnProperty(clientId);
  };

  // Add this function to get current team lead for a client
  const getCurrentTeamLead = (clientId: number) => {
    return marketingTeamLeads.find(lead => lead.id === currentAssignments[clientId]);
  };

  const fetchEnrolledClients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${BASE_URL}/enrolled-clients/admin/all?page=${currentPage}&limit=${pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.data.success) {
        setEnrollmentData(response.data.data);
        
        // Extract current assignments
        const assignments: {[key: number]: number} = {};
        response.data.data.AllEnrollments?.leads.forEach((client: EnrolledClient) => {
          if (client.assignedTeamLead) {
            assignments[client.id] = client.assignedTeamLead.id;
          }
        });
        setCurrentAssignments(assignments);

        let tabKey = 'AllEnrollments';
        if (activeTab === 'approved') tabKey = 'Approved';
        else if (activeTab === 'sales_pending') tabKey = 'SalesReviewPending';
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
    setIsLoadingTeamLeads(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/client-assignments/marketing-team-leads`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.data.success) {
        const teamLeads = response.data.data || [];
        console.log('Fetched team leads:', teamLeads); // For debugging
        setMarketingTeamLeads(teamLeads);
      } else {
        console.error('Failed to fetch team leads:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching marketing team leads:', error);
      // Optionally show error to user
      // alert('Failed to load team leads. Please try again.');
    } finally {
      setIsLoadingTeamLeads(false);
    }
  };

  const fetchInstallments = async (clientId: number) => {
    setLoadingInstallments(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${BASE_URL}/installments/enrolled-client/${clientId}?charge_type=enrollment_charge`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setInstallments(response.data.data.installments);
        setFormData(prev => ({
          ...prev,
          edited_installments: response.data.data.installments.map((inst: any) => ({
            id: inst.id,
            amount: inst.amount,
            dueDate: inst.dueDate,
            remark: inst.remark,
            installment_number: inst.installment_number,
            is_initial_payment: inst.is_initial_payment
          }))
        }));
      }
    } catch (error) {
      console.error('Error fetching installments:', error);
    } finally {
      setLoadingInstallments(false);
    }
  };

  const handleReview = (client: EnrolledClient) => {
    setSelectedClient(client);
    setShowForm(true);
    fetchInstallments(client.id);
    
    // Set form data with current values
    setFormData({
      approved: false,
      edited_enrollment_charge: client.edited_enrollment_charge || client.payable_enrollment_charge,
      edited_offer_letter_charge: client.edited_offer_letter_charge || client.payable_offer_letter_charge,
      edited_first_year_percentage: client.edited_first_year_percentage || client.payable_first_year_percentage,
      edited_first_year_fixed_charge: client.edited_first_year_fixed_charge || client.payable_first_year_fixed_charge,
      pricing_type: client.payable_first_year_percentage ? 'percentage' : 'fixed',
      edited_installments: []
    });
  };

  const handleApprove = async (client: EnrolledClient) => {
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
        toast.success('Enrollment approved successfully!');
      } else {
        toast.error(response.data.message || 'Error approving enrollment');
      }
    } catch (error) {
      console.error('Error approving enrollment:', error);
      toast.error('Error approving enrollment');
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

  // Update validateInstallments function
  const validateInstallments = (installments: FormData['edited_installments'], totalAmount: number | null): boolean => {
    if (!totalAmount) return false;
    
    const sum = installments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalAmountNum = Number(totalAmount);
    const isValid = Math.abs(sum - totalAmountNum) < 0.01;
    
    if (!isValid) {
      setInstallmentError(`Total installment amount ($${sum.toFixed(2)}) must equal the enrollment charge ($${totalAmountNum.toFixed(2)})`);
    } else {
      setInstallmentError(null);
    }
    
    return isValid;
  };

  // Update handleInstallmentChange function
  const handleInstallmentChange = (index: number, field: string, value: string | number) => {
    setFormData(prev => {
      // Find the actual index in the full array (including both initial and regular payments)
      const fullIndex = prev.edited_installments.findIndex(inst => 
        inst.id === prev.edited_installments[index].id
      );
      
      if (fullIndex === -1) return prev; // If installment not found, return previous state
      
      const newInstallments = [...prev.edited_installments];
      newInstallments[fullIndex] = {
        ...newInstallments[fullIndex],
        [field]: field === 'amount' ? Number(value) || 0 : value
      };
      
      // Validate total amount whenever an amount is changed
      if (field === 'amount') {
        validateInstallments(newInstallments, prev.edited_enrollment_charge);
      }
      
      return {
        ...prev,
        edited_installments: newInstallments
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    // Validate installments before proceeding
    if (!formData.approved && formData.edited_installments.length > 0) {
      const isValid = validateInstallments(formData.edited_installments, formData.edited_enrollment_charge);
      if (!isValid) {
        return; // Stop submission if validation fails
      }
    }

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

      // First update the enrolled client
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

      // If not approving, update installments
      if (!formData.approved && formData.edited_installments.length > 0) {
        const installmentPromises = formData.edited_installments.map(installment => 
          axios.put(
            `${BASE_URL}/installments/admin/approval/${installment.id}`,
            {
              approved: false,
              admin_id: userId,
              edited_amount: installment.amount,
              edited_dueDate: installment.dueDate,
              edited_remark: installment.remark
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

      if (response.data.success) {
        setShowForm(false);
        setSelectedClient(null);
        fetchEnrolledClients();
        toast.success(formData.approved ? 'Enrollment approved successfully!' : 'Enrollment updated and sent back to sales!');
      } else {
        toast.error(response.data.message || 'Error processing enrollment');
      }
    } catch (error) {
      console.error('Error processing enrollment:', error);
      toast.error('Error processing enrollment');
    } finally {
      setFormLoading(false);
    }
  };

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
        toast.success('Resume uploaded successfully!');
        fetchEnrolledClients();
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast.error('Failed to upload resume');
    }
  };

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

  const handleShowFeatures = (packageName: string, features: string[]) => {
    setSelectedPackageForFeatures({ name: packageName, features });
    setShowPackageFeatures(true);
  };

  const getStatusBadge = (client: EnrolledClient) => {
    if (!client.packageid) {
      return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Not Configured</span>;
    }
    if (client.Approval_by_sales && client.Approval_by_admin) {
      return (
        <div>
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Fully Approved</span>
          <br />
          <span className="text-gray-500 text-xs mt-1">Initial credentials email sent.</span>
        </div>
      );
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

  // Replace getFilteredClients to use backend data
  const getFilteredClients = (): EnrolledClient[] => {
    if (!enrollmentData) return [];
    if (activeTab === 'all') {
      return enrollmentData.AllEnrollments?.leads || [];
    } else if (activeTab === 'approved') {
      return enrollmentData.Approved?.leads || [];
    } else if (activeTab === 'sales_pending') {
      return enrollmentData.SalesReviewPending?.leads || [];
    } else if (activeTab === 'my_review') {
      return enrollmentData.MyReview?.leads || [];
    }
    return [];
  };

  const handleApprovalIconClick = (client: EnrolledClient) => {
    setPendingApprovalClient(client);
    setShowConfirmPopup(true);
  };
  const handleConfirmApproval = async () => {
    if (pendingApprovalClient) {
      await handleApprove(pendingApprovalClient);
      setShowConfirmPopup(false);
      setPendingApprovalClient(null);
    }
  };
  const handleCancelApproval = () => {
    setShowConfirmPopup(false);
    setPendingApprovalClient(null);
  };

  // Add new function for handling client selection for assignment
  const handleClientSelection = (client: EnrolledClient) => {
    setSelectedClientsForAssignment(prev => {
      const isSelected = prev.some(c => c.id === client.id);
      if (isSelected) {
        return prev.filter(c => c.id !== client.id);
      } else {
        return [...prev, client];
      }
    });
  };

  // Update the handleAssign function
  const handleAssign = async (remarkText: string) => {
    if (!selectedTeamLead) {
      toast.error('Please select a team lead first');
      return;
    }

    if (selectedClientsForAssignment.length === 0) {
      toast.error('Please select at least one client to assign');
      return;
    }

    setAssignmentLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      console.log('Attempting to assign clients:', {
        selectedTeamLead,
        clientCount: selectedClientsForAssignment.length,
        remarkText
      });

      // Create assignments for each selected client
      const assignmentPromises = selectedClientsForAssignment.map(client => 
        axios.post(
          `${BASE_URL}/client-assignments/assign`,
          {
            clientId: client.id,
            assignedToId: Number(selectedTeamLead),
            remarkText: remarkText.trim()
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        ).catch(error => {
          // Log individual assignment errors
          console.error(`Error assigning client ${client.id}:`, error.response?.data || error.message);
          throw error; // Re-throw to be caught by Promise.all
        })
      );

      await Promise.all(assignmentPromises);
      
      // Clear selections and close dialog
      setSelectedClientsForAssignment([]);
      setShowAssignmentDialog(false);
      setSelectedTeamLead('');
      
      // Refresh the data
      await fetchEnrolledClients();
      
      toast.success('Clients assigned successfully!');
    } catch (error: any) {
      console.error('Error assigning clients:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to assign clients';
      toast.error(`Assignment failed: ${errorMessage}`);
    } finally {
      setAssignmentLoading(false);
    }
  };

  // Add quick reassign function
  const handleQuickReassign = async () => {
    if (!selectedTeamLead || selectedClientsForAssignment.length === 0) {
      toast.error('Please select a team lead and at least one client');
      return;
    }

    setAssignmentLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Create assignments for each selected client
      const assignmentPromises = selectedClientsForAssignment.map(client => 
        axios.post(
          `${BASE_URL}/client-assignments/assign`,
          {
            clientId: client.id,
            assignedToId: Number(selectedTeamLead),
            remarkText: 'Quick reassignment'
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )
      );

      await Promise.all(assignmentPromises);
      
      // Clear selections
      setSelectedClientsForAssignment([]);
      setSelectedTeamLead('');
      
      // Refresh the data
      fetchEnrolledClients();
      
      toast.success('Clients reassigned successfully!');
    } catch (error) {
      console.error('Error reassigning clients:', error);
      toast.error('Failed to reassign clients');
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleViewInstallments = (client: EnrolledClient) => {
    setSelectedClient(client);
    setShowInstallmentsPopup(true);
  };

  const renderTableHeader = () => (
    <tr>
      {activeTab === 'approved' && (
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          <input
            type="checkbox"
            onChange={(e) => {
              const clients = getFilteredClients();
              if (e.target.checked) {
                setSelectedClientsForAssignment(clients);
              } else {
                setSelectedClientsForAssignment([]);
              }
            }}
            checked={selectedClientsForAssignment.length === getFilteredClients().length && getFilteredClients().length > 0}
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
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
        Package & Sales Person
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Pricing Configuration
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Resume
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Email
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Status
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Training Required
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        First Call Status
      </th>
      {activeTab !== 'all' && activeTab !== 'approved' && (
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Actions
        </th>
      )}
      {activeTab === 'approved' && (
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Current Assignment
        </th>
      )}
    </tr>
  );

  const renderTableRow = (client: EnrolledClient, idx: number) => (
    <tr key={client.id} className="hover:bg-gray-50">
      {activeTab === 'approved' && (
        <td className="px-6 py-4 whitespace-nowrap text-start">
          <input
            type="checkbox"
            checked={selectedClientsForAssignment.some(c => c.id === client.id)}
            onChange={() => handleClientSelection(client)}
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
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
                    : (activeTab === 'sales_pending' && client.edited_enrollment_charge !== null)
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
                    : (activeTab === 'sales_pending' && client.edited_offer_letter_charge !== null)
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
                  : (activeTab === 'sales_pending' && client.edited_first_year_percentage !== null)
                    ? `${client.edited_first_year_percentage}%`
                  : (activeTab === 'sales_pending' && client.edited_first_year_fixed_charge !== null)
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
      <td className="px-6 py-4 whitespace-nowrap text-sm text-start">
        <a
          href={`mailto:${client.lead.primaryEmail}`}
          className="text-blue-600 hover:text-blue-900 flex items-center gap-2"
          title="Send Email"
        >
          <span>Send Email</span>
        </a>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-start">
        {getStatusBadge(client)}
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
      {activeTab !== 'all' && activeTab !== 'approved' && (
        <td className="px-6 py-4 whitespace-nowrap text-start text-sm font-medium">
          <div className="flex gap-2">
            {activeTab === 'my_review' && (
              <>
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
              </>
            )}
          </div>
        </td>
      )}
      {activeTab === 'approved' && (
        <td className="px-6 py-4 whitespace-nowrap text-start">
          {isClientAssigned(client.id) ? (
            <div className="text-sm">
              <span className="font-medium">Assigned to: </span>
              {getCurrentTeamLead(client.id)?.firstname} {getCurrentTeamLead(client.id)?.lastname}
            </div>
          ) : (
            <span className="text-gray-500 text-sm">Not assigned</span>
          )}
        </td>
      )}
    </tr>
  );

  const renderAssignmentButtons = () => {
    if (activeTab === 'approved' && selectedClientsForAssignment.length > 0) {
      const isReassignment = selectedClientsForAssignment.every(client => isClientAssigned(client.id));
      const buttonText = isReassignment ? 'Reassign Selected' : 'Assign Selected';

      return (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <select
              value={selectedTeamLead}
              onChange={(e) => setSelectedTeamLead(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm"
              disabled={isLoadingTeamLeads}
            >
              <option value="">{isLoadingTeamLeads ? 'Loading...' : 'Select Team Lead'}</option>
              {!isLoadingTeamLeads && marketingTeamLeads.map((user) => {
                const isCurrentTeamLead = selectedClientsForAssignment.some(
                  client => currentAssignments[client.id] === user.id
                );
                return (
                  <option 
                    key={user.id} 
                    value={user.id}
                    disabled={isCurrentTeamLead}
                  >
                    {user.firstname} {user.lastname} {isCurrentTeamLead ? '(Current)' : ''}
                  </option>
                );
              })}
            </select>
            <button
              onClick={() => setShowAssignmentDialog(true)}
              disabled={!selectedTeamLead || assignmentLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <FaUserPlus />
              {buttonText}
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        </div>
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
                <FaUserCog className="text-purple-600 text-[35px]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 text-start">Admin Enrollment Managment </h1>
                <p className="text-gray-600 text-sm">Review and approve enrollment configurations</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FaGraduationCap className="text-purple-500" />
              <span>{enrollmentData?.AllEnrollments?.pagination?.totalItems || 0} Enrollments</span>
            </div>
          </div>
        </div>

        {/* Tabs with Assignment Buttons */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex items-center justify-between px-6">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-3 px-6 border-b-2 font-semibold text-base ${
                  activeTab === 'all'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaGraduationCap className="inline mr-2" />
                All Enrollments ({enrollmentData?.AllEnrollments?.pagination?.totalItems || 0})
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
                Approved ({enrollmentData?.Approved?.pagination?.totalItems || 0})
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
                Sales Review Pending ({enrollmentData?.SalesReviewPending?.pagination?.totalItems || 0})
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
                My Review ({enrollmentData?.MyReview?.pagination?.totalItems || 0})
              </button>
            </nav>
              {renderAssignmentButtons()}
            </div>
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
                  <div className="bg-gray-50 rounded-lg p-4 text-left">
                    <h3 className="font-medium text-gray-900 mb-2">Lead Information</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Name:</span> {selectedClient.lead.firstName} {selectedClient.lead.lastName}</div>
                      <div><span className="font-medium">Email:</span> {selectedClient.lead.primaryEmail}</div>
                      <div><span className="font-medium">Phone:</span> {selectedClient.lead.contactNumbers?.join(', ')}</div>
                      <div><span className="font-medium">Technology:</span> {selectedClient.lead.technology?.join(', ') || 'No technology specified'}</div>
                      <div><span className="font-medium">Visa Status:</span> {selectedClient.lead.visaStatus}</div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 text-start">
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
                  <>
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

                    {/* Installments Modification Section */}
                    <div className="border rounded-lg p-4 bg-blue-50 mt-4">
                      <h3 className="font-medium text-gray-900 mb-4">Modify Installments</h3>
                      {loadingInstallments ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {installmentError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-red-600 text-sm">{installmentError}</p>
                            </div>
                          )}
                          
                          {/* Initial Payment Section */}
                          {formData.edited_installments.filter(inst => inst.is_initial_payment).map((installment, index) => (
                            <div key={installment.id} className="grid grid-cols-3 gap-4 p-4 bg-purple-50 rounded-lg shadow-sm border-2 border-purple-200">
                              <div className="col-span-3 mb-2">
                                <h4 className="text-sm font-semibold text-purple-700">Initial Payment</h4>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Amount
                                </label>
                                <input
                                  type="number"
                                  value={installment.amount || ''}
                                  onChange={(e) => handleInstallmentChange(
                                    formData.edited_installments.findIndex(i => i.id === installment.id),
                                    'amount',
                                    e.target.value
                                  )}
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  placeholder="0.00"
                                  step="0.01"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Due Date
                                </label>
                                <input
                                  type="date"
                                  value={installment.dueDate || ''}
                                  onChange={(e) => handleInstallmentChange(
                                    formData.edited_installments.findIndex(i => i.id === installment.id),
                                    'dueDate',
                                    e.target.value
                                  )}
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Remark
                                </label>
                                <input
                                  type="text"
                                  value={installment.remark || ''}
                                  onChange={(e) => handleInstallmentChange(
                                    formData.edited_installments.findIndex(i => i.id === installment.id),
                                    'remark',
                                    e.target.value
                                  )}
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  placeholder="Add a note..."
                                />
                              </div>
                            </div>
                          ))}

                          {/* Regular Installments Section */}
                          {formData.edited_installments.filter(inst => !inst.is_initial_payment).map((installment, index) => (
                            <div key={installment.id} className="grid grid-cols-3 gap-4 p-4 bg-white rounded-lg shadow-sm">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Amount
                                </label>
                                <input
                                  type="number"
                                  value={installment.amount || ''}
                                  onChange={(e) => handleInstallmentChange(
                                    formData.edited_installments.findIndex(i => i.id === installment.id),
                                    'amount',
                                    e.target.value
                                  )}
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  placeholder="0.00"
                                  step="0.01"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Due Date
                                </label>
                                <input
                                  type="date"
                                  value={installment.dueDate || ''}
                                  onChange={(e) => handleInstallmentChange(
                                    formData.edited_installments.findIndex(i => i.id === installment.id),
                                    'dueDate',
                                    e.target.value
                                  )}
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Remark
                                </label>
                                <input
                                  type="text"
                                  value={installment.remark || ''}
                                  onChange={(e) => handleInstallmentChange(
                                    formData.edited_installments.findIndex(i => i.id === installment.id),
                                    'remark',
                                    e.target.value
                                  )}
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  placeholder="Add a note..."
                                />
                              </div>
                            </div>
                          ))}

                          {/* Add total amount display */}
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-700">Total Installment Amount:</span>
                              <span className="text-sm font-medium text-gray-900">
                                ${formData.edited_installments
                                  .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
                                  .toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-sm font-medium text-gray-700">Required Amount:</span>
                              <span className="text-sm font-medium text-gray-900">
                                ${Number(formData.edited_enrollment_charge || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Training Required Checkbox */}
                <div className="mt-6 border-t pt-6">
                  <h3 className="font-medium text-gray-900 mb-4">Training Configuration</h3>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_training_required"
                      checked={selectedClient?.is_training_required || false}
                      onChange={(e) => {
                        if (selectedClient) {
                          // Update the selectedClient directly since this is admin view
                          setSelectedClient({
                            ...selectedClient,
                            is_training_required: e.target.checked
                          });
                        }
                      }}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_training_required" className="ml-2 block text-sm text-gray-900">
                      Training Required
                    </label>
                  </div>
                </div>

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
          </div> */}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                {renderTableHeader()}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredClients().map((client: EnrolledClient, idx: number) => (
                  renderTableRow(client, idx)
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

      {/* Update the AssignmentDialog component */}
      <AssignmentDialog
        isOpen={showAssignmentDialog}
        onClose={() => {
          setShowAssignmentDialog(false);
          setSelectedClientsForAssignment([]);
        }}
        onAssign={handleAssign}
        selectedTeamLead={marketingTeamLeads.find(lead => lead.id === Number(selectedTeamLead))}
      />

      {showInstallmentsPopup && selectedClient && (
        <InstallmentsPopup
          isOpen={showInstallmentsPopup}
          onClose={() => {
            setShowInstallmentsPopup(false);
            setSelectedClient(null);
          }}
          enrolledClientId={selectedClient.id}
          totalCharge={selectedClient.payable_enrollment_charge}
        />
      )}
    </div>
  );
};

export default AdminEnrollment; 