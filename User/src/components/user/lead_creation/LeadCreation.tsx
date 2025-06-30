import React, { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
// import Sidebar from '../sidebar/Sidebar';
import LogoIcon from "../../../assets/xls_logo.webp"
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import LeadDetailsModal from './LeadDetailsModal';
import StatusRemarkModal from './StatusRemarkModal';
import StatusChangeNotification from './StatusChangeNotification';
import EmailPopup from './EmailPopup';
import PermissionGuard from '../../common/PermissionGuard';
import usePermissions from '../../../hooks/usePermissions';
import RouteGuard from '../../common/RouteGuard';
import toast from 'react-hot-toast';
import ReassignRemarkModal from './ReassignRemarkModal';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
const BASE_URL=import.meta.env.VITE_API_URL|| "http://localhost:5006/api"
// Type definitions for country list
// type Country = {
//   label: string;
//   value: string;
// };

// type CountryList = {
//   getData: () => Country[];
//   getLabel: (value: string) => string;
//   getValue: (label: string) => string;
// };

// Using dynamic import for country list
import countryList from 'react-select-country-list';

interface Lead {
  id?: number;
  firstName: string;
  lastName: string;
  contactNumbers: string[];
  emails: string[];
  primaryEmail: string;
  primaryContact: string;
  technology: string[];
  country: string;
  countryCode: string;
  visaStatus: string;
  status?: string;
  statusGroup?: string;
  leadSource: string;
  remarks: Remark[];
  reference?: string | null;
  linkedinId: string;
  from?: string;
  totalAssign?: number;
  createdAt?: string;
  updatedAt?: string;
  assignedUser?: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    subrole: string | null;
    departmentId: number | null;
  } | null;
  previouslyAssignedUser?: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    subrole: string | null;
    departmentId: number | null;
  } | null;
  assignTo?: number | null;
  previousAssign?: number | null;
  createdBy?: number;
  updatedBy?: number;
  creator?: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    subrole: string | null;
    departmentId: number | null;
  };
  updater?: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    subrole: string | null;
    departmentId: number | null;
  };
}

interface Remark {
  text: string;
  createdAt: string;
  createdBy: number;
  creator?: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    designation: string | null;
    department: string | null;
  };
  statusChange?: {
    from: string;
    to: string;
  };
}

// Add new interface for Email Lead
interface EmailLead {
  firstName: string;
  lastName: string;
  primaryEmail: string;
  id?: number;
  from?: string;
}

// Add new interface for Sales User
interface SalesUser {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  subrole: string;
  departmentId: number;
  department: {
    departmentName: string;
  };
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'open':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'converted':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case 'inProcess':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
};

const LeadCreationComponent: React.FC = () => {
  const { checkPermission, error: permissionError, loading: permissionsLoading } = usePermissions();
  // Form and error states
  const [formData, setFormData] = useState<Lead>({
    firstName: '',
    lastName: '',
    contactNumbers: ['', ''],
    emails: ['', ''],
    primaryEmail: '',
    primaryContact: '',
    technology: [''],
    country: 'United States',
    countryCode: 'US',
    visaStatus: '',
    leadSource: '',
    remarks: [{
      text: '',
      createdAt: new Date().toISOString(),
      createdBy: 0
    }],
    linkedinId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const [errors, setErrors] = useState<Partial<Lead>>({});
  const [countries] = useState(countryList().getData());

  // Table states
  const [leads, setLeads] = useState<Lead[]>([]);
  var searchTerm='';
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  // // Edit states
  // const [editingLead, setEditingLead] = useState<number | null>(null);
  // const [editFormData, setEditFormData] = useState<Lead>({
  //   firstName: '',
  //   lastName: '',
  //   contactNumbers: [''],
  //   emails: ['', ''],
  //   primaryEmail: '',
  //   primaryContact: '',
  //   technology: [''],
  //   country: '',
  //   countryCode: '',
  //   visaStatus: '',
  //   leadSource: '',
  //   remarks: [{
  //     text: '',
  //     createdAt: new Date().toISOString(),
  //     createdBy: 0
  //   }],
  //   linkedinId: '',
  //   createdAt: new Date().toISOString(),
  //   updatedAt: new Date().toISOString()
  // });

  // Dialog states
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedSalesPerson, setSelectedSalesPerson] = useState<string>('');
  const [currentSalesPerson, setCurrentSalesPerson] = useState<string>('');

  // Tab states
  const [activeMainTab, setActiveMainTab] = useState<'create' | 'bulk'>('create');
  const [activeStatusTab, setActiveStatusTab] = useState<'open' | 'converted' | 'inProcess'>('open');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // File upload states
  const [file, setFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // New states for StatusRemarkModal
  const [showStatusRemarkModal, setShowStatusRemarkModal] = useState(false);
  const [selectedLeadForStatus, setSelectedLeadForStatus] = useState<Lead | null>(null);
  const [newStatus, setNewStatus] = useState('');

  // Add new state for sales users
  const [salesUsers, setSalesUsers] = useState<SalesUser[]>([]);
  const [isLoadingSalesUsers, setIsLoadingSalesUsers] = useState(false);

  // New states for StatusChangeNotification
  const [showStatusNotification, setShowStatusNotification] = useState(false);
  const [statusNotificationData, setStatusNotificationData] = useState<{
    leadName: string;
    newStatus: string;
    statusGroup: string;
  } | null>(null);

  // Add new state for packages
  const [packages, setPackages] = useState([]);

  // Add new state for email popup
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [selectedLeadForEmail, setSelectedLeadForEmail] = useState<{
    firstName: string;
    lastName: string;
    primaryEmail: string;
    id?: number;
    from?: string;
  } | null>(null);

  // Add state for reassign modal
  const [showReassignRemarkModal, setShowReassignRemarkModal] = useState(false);
  const [reassignRemarkLoading, setReassignRemarkLoading] = useState(false);
  const [pendingReassign, setPendingReassign] = useState<{ lead: Lead, user: SalesUser } | null>(null);

  // Add state for call popup
  const [showCallPopup, setShowCallPopup] = useState(false);
  const [callOptions, setCallOptions] = useState<string[]>([]);
  const [selectedCallNumber, setSelectedCallNumber] = useState<string>('');
  const [callLeadName, setCallLeadName] = useState<string>('');

  const [isFormVisible, setIsFormVisible] = useState(false);

  // Fetch leads
  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      setApiError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setApiError('Authentication required. Please login again.');
        return;
      }

      // Check if user has permission to view all leads
      const hasViewAllLeadsPermission = checkPermission('View All Leads', 'view');
      
      // Use the appropriate endpoint based on permission
      const endpoint = hasViewAllLeadsPermission ? `${BASE_URL}/lead` : `${BASE_URL}/lead/assigned`;
      
      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setLeads(response.data.data.leads);
      // Update pagination info from API response if available
      if (response.data.data.pagination) {
        const {totalPages } = response.data.data.pagination;
        setTotalPages(totalPages);
      }
    } catch (error) {
      setApiError('Failed to fetch leads. Please try again.');
      console.error('Error fetching leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to fetch leads when component mounts and when permissions change
  useEffect(() => {
    if (!permissionsLoading) {
      fetchLeads();
    }
  }, [permissionsLoading]);

  // Filter leads based on status
  // const getLeadsByStatus = (status: string) => {
  //   return leads.filter(lead => lead.statusGroup === status);
  // };

  // Get leads count by status
  const getLeadsCountByStatus = (status: string) => {
    return leads.filter(lead => lead.statusGroup === status).length;
  };

  // Filter leads based on active status tab and search term
  const filteredLeads = leads.filter((lead: Lead) => {
    const matchesStatus = lead.statusGroup === activeStatusTab;
    const matchesSearch = searchTerm === '' || 
      lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.technology.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Export to Excel function
  const exportToExcel = () => {
    const date = new Date().toISOString().split('T')[0];
    const filename = `leads_${date}`;
    
    // Format the leads data for Excel
    const excelData = leads.map(lead => ({
      'Candidate Name': lead.firstName + ' ' + lead.lastName,
      'Contact Number': lead.primaryContact,
      'Email': lead.primaryEmail,
      'LinkedIn': lead.linkedinId,
      'Technology': lead.technology.join(', '),
      'Country': lead.country,
      'Visa Status': lead.visaStatus,
      'Remarks': lead.remarks.map(remark => remark.text).join(', '),
      'Status': lead.status,
      'Assigned To': lead.assignedUser ? `${lead.assignedUser.firstname} ${lead.assignedUser.lastname}` : ''
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const handleAssignSalesPerson = async () => {
    if (!selectedSalesPerson || selectedLeads.length === 0) return;

    // Get the user ID from the selected sales person's name
    const selectedUser = salesUsers.find(
      user => `${user.firstname} ${user.lastname}` === selectedSalesPerson
    );
    if (!selectedUser) {
      setApiError('Selected sales person not found');
      return;
    }

    // Find the first lead that is being reassigned (already has assignedUser)
    const firstReassignedIndex = selectedLeads.find(index => leads[index]?.assignedUser);
    if (firstReassignedIndex !== undefined) {
      setPendingReassign({ lead: leads[firstReassignedIndex], user: selectedUser });
      setShowReassignRemarkModal(true);
      return;
    }

    // If no reassignment, proceed as before
    await assignLeads(selectedUser, '');
  };

  // New function to handle actual assignment with remark
  const assignLeads = async (selectedUser: SalesUser, remarkText: string) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setApiError('Authentication required. Please login again.');
        return;
      }

      for (const leadIndex of selectedLeads) {
        const lead = leads[leadIndex];
        if (!lead || !lead.id) continue;

        // First create the lead assignment
        await axios.post(
          `${BASE_URL}/lead-assignments/assign`,
          {
            leadId: lead.id,
            assignedToId: selectedUser.id,
            remarkText: remarkText || (lead.assignedUser ? 'Lead reassigned' : 'Lead assigned')
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );

        // Then update the lead table
        await axios.put(
          `${BASE_URL}/lead/${lead.id}`,
          {
            assignTo: selectedUser.id,
            previousAssign: lead.assignTo || null,
            totalAssign: (lead.totalAssign || 0) + 1
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );

        // Send notification
        try {
          await axios.post(
            `${BASE_URL}/lead-assignments/notify`,
            {
              leadId: lead.id,
              assignedToId: selectedUser.id
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            }
          );
        } catch (emailError) {
          console.error('Error sending notification:', emailError);
        }
      }

      setSelectedSalesPerson('');
      setSelectedLeads([]);
      setCurrentSalesPerson('');
      toast.success('Leads assigned successfully!');
      fetchLeads();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to assign leads. Please try again.';
      setApiError(errorMessage);
      toast.error(errorMessage);
      console.error('Assignment error:', error.response?.data || error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentSalesPerson = () => {
    if (selectedLeads.length === 0) return '';
    
    // Get the sales person of the first selected lead
    const firstSelectedLead = selectedLeads[0];
    return leads[firstSelectedLead]?.assignedUser ? `${leads[firstSelectedLead].assignedUser.firstname} ${leads[firstSelectedLead].assignedUser.lastname}` : '';
  };

  React.useEffect(() => {
    if (selectedLeads.length > 0) {
      setCurrentSalesPerson(getCurrentSalesPerson());
    } else {
      setCurrentSalesPerson('');
    }
  }, [selectedLeads]);

  const getButtonProps = () => {
    if (selectedLeads.length === 0) return { text: 'Assign', color: 'bg-indigo-600' };
    
    const hasSalesPerson = selectedLeads.some(index => leads[index].assignedUser);
    
    if (hasSalesPerson) {
      return { 
        text: 'Reassign', 
        color: 'bg-red-600 hover:bg-red-700'
      };
    }
    
    return { 
      text: 'Assign', 
      color: 'bg-indigo-600 hover:bg-indigo-700'
    };
  };

  const handleInfoClick = (lead: Lead) => {
    setSelectedLead(lead);
    setShowInfoDialog(true);
  };

  const handleCloseInfoDialog = () => {
    setShowInfoDialog(false);
    setSelectedLead(null);
  };

  // Select all checkbox handler
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Select all visible leads
      const allIndexes = Array.from({ length: paginatedLeads.length }, (_, i) => i);
      setSelectedLeads(allIndexes);
    } else {
      // Deselect all
      setSelectedLeads([]);
    }
  };

  // const handleEdit = (leadIndex: number) => {
  //   setEditingLead(leadIndex);
  //   setEditFormData(leads[leadIndex]);
  // };

  // const handleEditSubmit = () => {
  //   if (editingLead !== null) {
  //     const updatedLeads = [...leads];
  //     updatedLeads[editingLead] = editFormData;
  //     setLeads(updatedLeads);
  //     setEditingLead(null);
  //     setEditFormData({
  //       firstName: '',
  //       lastName: '',
  //       contactNumbers: [''],
  //       emails: ['', ''],
  //       primaryEmail: '',
  //       primaryContact: '',
  //       technology: [''],
  //       country: '',
  //       countryCode: '',
  //       visaStatus: '',
  //       leadSource: '',
  //       remarks: [{
  //         text: '',
  //         createdAt: new Date().toISOString(),
  //         createdBy: 0
  //       }],
  //       linkedinId: '',
  //       createdAt: new Date().toISOString(),
  //       updatedAt: new Date().toISOString()
  //     });
  //     alert('Lead updated successfully!');
  //   }
  // };

  // const handleEditCancel = () => {
  //   setEditingLead(null);
  //   setEditFormData({
  //     firstName: '',
  //     lastName: '',
  //     contactNumbers: [''],
  //     emails: ['', ''],
  //     primaryEmail: '',
  //     primaryContact: '',
  //     technology: [''],
  //     country: '',
  //     countryCode: '',
  //     visaStatus: '',
  //     leadSource: '',
  //     remarks: [{
  //       text: '',
  //       createdAt: new Date().toISOString(),
  //       createdBy: 0
  //     }],
  //     linkedinId: '',
  //     createdAt: new Date().toISOString(),
  //     updatedAt: new Date().toISOString()
  //   });
  // };

  // const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  //   const { name, value } = e.target;
  //   setEditFormData(prev => ({ ...prev, [name]: value }));
  // };

  const handleFileUpload = async () => {
    if (!file) return;
    
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        if (data) {
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Process the data and update leads
          const newLeads = jsonData.map((row: any) => ({
            firstName: row['Candidate Name'].split(' ')[0],
            lastName: row['Candidate Name'].split(' ')[1],
            contactNumbers: [row['Contact Number']],
            emails: [row['Email']],
            primaryEmail: row['Email'],
            primaryContact: row['Contact Number'],
            technology: Array.isArray(row['Technology']) ? row['Technology'] : [row['Technology']],
            country: row['Country'],
            countryCode: row['Country Code'],
            visaStatus: row['Visa Status'],
            remarks: row['Remarks']?.split(', ').map((text: string) => ({
              text,
              createdAt: new Date().toISOString(),
              createdBy: 0
            })) || [],
            leadSource: row['Lead Source'],
            linkedinId: row['LinkedIn'],
          }));
          
          setLeads(prev => [...prev, ...newLeads]);
          setUploadSuccess(true);
          setFile(null); // Clear the file input
          toast.success('File uploaded successfully!');
        }
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error uploading file. Please try again.');
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field if it exists
    if (errors[name as keyof Lead]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePhoneChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      primaryContact: value,
      contactNumbers: [value, prev.contactNumbers[1]]
    }));
    if (errors.primaryContact) {
      setErrors(prev => ({ ...prev, primaryContact: undefined }));
    }
  };

  const handleSecondaryContactChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      contactNumbers: [prev.contactNumbers[0], value]
    }));
  };

  const handleEmailChange = (value: string, index: number) => {
    if (index === 0) {
      setFormData(prev => ({
        ...prev,
        primaryEmail: value,
        emails: [value, prev.emails[1]]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        emails: [prev.primaryEmail, value]
      }));
    }
  };

  const handleTechnologyChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newTechnologies = [...formData.technology];
    newTechnologies[formData.technology.length - 1] = e.target.value;
    setFormData(prev => ({
      ...prev,
      technology: newTechnologies
    }));
  };

  const handleTechnologyKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentTech = formData.technology[formData.technology.length - 1].trim();
      if (currentTech) {
        setFormData(prev => ({
          ...prev,
          technology: [...prev.technology, '']
        }));
      }
    }
  };

  // const handleRemarkChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
  //   const newRemarks = [...formData.remarks];
  //   newRemarks[formData.remarks.length - 1] = {
  //     ...newRemarks[formData.remarks.length - 1],
  //     text: e.target.value
  //   };
  //   setFormData(prev => ({
  //     ...prev,
  //     remarks: newRemarks
  //   }));
  // };

  // const handleRemarkKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  //   if (e.key === 'Enter' && !e.shiftKey) {
  //     e.preventDefault();
  //     const currentRemark = formData.remarks[formData.remarks.length - 1].text.trim();
  //     if (currentRemark) {
  //       setFormData(prev => ({
  //         ...prev,
  //         remarks: [...prev.remarks, {
  //           text: '',
  //           createdAt: new Date().toISOString(),
  //           createdBy: 0
  //         }]
  //       }));
  //     }
  //   }
  // };

  const handleCheckboxChange = (index: number) => {
    const originalIndex = filteredLeads.findIndex((_, i) => i === index + ((currentPage - 1) * pageSize));
    setSelectedLeads(prev =>
      prev.includes(originalIndex) ? prev.filter(i => i !== index) : [...prev, originalIndex]
    );
  };

  const handleCountryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selected = countries.find(c => c.value === e.target.value);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        country: selected.label,
        countryCode: selected.value
      }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Lead> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First Name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last Name is required';
    }
    if (!formData.primaryContact.trim()) {
      newErrors.primaryContact = 'Primary Contact is required';
    }
    if (!formData.primaryEmail.trim()) {
      newErrors.primaryEmail = 'Primary Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primaryEmail)) {
      newErrors.primaryEmail = 'Primary Email is not valid';
    }
    if (!formData.linkedinId.trim()) {
      newErrors.linkedinId = 'LinkedIn URL is required';
    } else if (!/^https?:\/\/(www\.)?linkedin\.com/.test(formData.linkedinId)) {
      newErrors.linkedinId = 'LinkedIn URL is not valid';
    }
    if (!formData.technology[0]?.trim()) {
      newErrors.technology = ['At least one technology is required'];
    }
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }
    if (!formData.visaStatus.trim()) {
      newErrors.visaStatus = 'Visa Status is required';
    }
    if (!formData.leadSource.trim()) {
      newErrors.leadSource = 'Lead Source is required';
    }
    if (formData.remarks.length === 0 || !formData.remarks[0].text.trim()) {
      newErrors.remarks = [{ text: 'At least one remark is required', createdAt: new Date().toISOString(), createdBy: 0 }];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle lead creation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted');
    console.log('Current form data:', formData);

    if (!validate()) {
      console.log('Validation failed', errors);
      return;
    }

    try {
      setIsLoading(true);
      setApiError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setApiError('Authentication required. Please login again.');
        return;
      }

      const leadData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        contactNumbers: [formData.primaryContact, formData.contactNumbers[1]].filter(Boolean),
        emails: [formData.primaryEmail, formData.emails[1]].filter(Boolean),
        linkedinId: formData.linkedinId,
        technology: formData.technology.filter(Boolean),
        country: formData.country,
        countryCode: formData.countryCode,
        visaStatus: formData.visaStatus,
        leadSource: formData.leadSource,
        remarks: formData.remarks
          .filter(remark => remark.text && remark.text.trim())
          .map(remark => ({
            text: remark.text.trim(),
            createdAt: new Date().toISOString(),
            createdBy: remark.createdBy || 0,
            statusChange: {
              to: 'open'
            }
          })),
        reference: null
      };

      console.log('Sending lead data to API:', leadData);

      const response = await axios.post(`${BASE_URL}/lead/add`, leadData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('API Response:', response.data);

      if (response.data.success) {
        // Add the new lead to the leads list with all fields from response
        const newLead = {
          ...response.data.data,
          primaryContact: response.data.data.contactNumbers[0],
          statusGroup: response.data.data.statusGroup
        };
        
        setLeads(prev => [newLead, ...prev]);
        
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          contactNumbers: ['', ''],
          emails: ['', ''],
          primaryEmail: '',
          primaryContact: '',
          technology: [''],
          country: 'United States',
          countryCode: 'US',
          visaStatus: '',
          leadSource: '',
          remarks: [{
            text: '',
            createdAt: new Date().toISOString(),
            createdBy: 0
          }],
          linkedinId: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        setErrors({});

        // Show success message using toast
        toast.success('Lead created successfully!');

        // Refresh the leads list
        fetchLeads();
      } else {
        const errorMessage = response.data.message || 'Failed to create lead. Please try again.';
        console.error('API Error:', errorMessage);
        setApiError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error creating lead:', error.response || error);
      const errorMessage = error.response?.data?.message || 'Failed to create lead. Please try again.';
      setApiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Display API error using toast
  useEffect(() => {
    if (apiError) {
      toast.error(apiError);
      setApiError(null);
    }
  }, [apiError]);

  // Tab styling
  const getTabStyle = (isActive: boolean) => `
    relative px-6 py-3 text-sm font-medium transition-all duration-300
    ${isActive ? 
      'text-indigo-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-indigo-600' : 
      'text-gray-500 hover:text-gray-700'}
  `;

  const getStatusTabStyle = (isActive: boolean) => `
    relative px-6 py-3 text-sm font-medium transition-all duration-300
    ${isActive ? 
      'text-indigo-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-indigo-600' : 
      'text-gray-500 hover:text-gray-700'}
  `;

  // Handle status tab change
  const handleStatusTabChange = (status: 'open' | 'converted' | 'inProcess') => {
    setActiveStatusTab(status);
    setCurrentPage(1); // Reset to first page when changing status
  };

  // Update the handleStatusChange function
  const handleStatusChange = async (leadId: number, newStatus: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    setSelectedLeadForStatus(lead);
    setNewStatus(newStatus);
    setShowStatusRemarkModal(true);
  };

  // Update the handleStatusRemarkSubmit function
  const handleStatusRemarkSubmit = async (remark: string) => {
    if (!selectedLeadForStatus) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setApiError('Authentication required. Please login again.');
        return;
      }

      if (newStatus === 'Dead' || newStatus === 'notinterested') {
        // Archive the lead
        const response = await axios.post(
          `${BASE_URL}/lead/${selectedLeadForStatus.id}/archive`,
          { 
            archiveReason: remark
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          // Remove the lead from the list
          setLeads(prevLeads => 
            prevLeads.filter(lead => lead.id !== selectedLeadForStatus.id)
          );

          // Show status change notification
          setStatusNotificationData({
            leadName: `${selectedLeadForStatus.firstName} ${selectedLeadForStatus.lastName}`,
            newStatus: newStatus,
            statusGroup: 'archived'
          });
          setShowStatusNotification(true);

          setShowStatusRemarkModal(false);
          setSelectedLeadForStatus(null);
          setNewStatus('');
        }
      } else {
        // Regular status update
        const response = await axios.patch(
          `${BASE_URL}/lead/${selectedLeadForStatus.id}/status`,
          { 
            status: newStatus,
            remark 
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          // Update the leads list with the new data
          setLeads(prevLeads => 
            prevLeads.map(lead => 
              lead.id === selectedLeadForStatus.id ? {
                ...lead,
                status: newStatus,
                statusGroup: response.data.data.statusGroup,
                remarks: response.data.data.remarks || lead.remarks
              } : lead
            )
          );

          // If this lead is currently selected in the details modal, update it
          if (selectedLead?.id === selectedLeadForStatus.id) {
            setSelectedLead(prevLead => {
              if (!prevLead) return null;
              return {
                ...prevLead,
                status: newStatus,
                statusGroup: response.data.data.statusGroup,
                remarks: response.data.data.remarks || prevLead.remarks
              };
            });
          }

          // Show status change notification
          setStatusNotificationData({
            leadName: `${selectedLeadForStatus.firstName} ${selectedLeadForStatus.lastName}`,
            newStatus: newStatus,
            statusGroup: response.data.data.statusGroup
          });
          setShowStatusNotification(true);

          setShowStatusRemarkModal(false);
          setSelectedLeadForStatus(null);
          setNewStatus('');
        } else {
          setApiError('Failed to update status. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      setApiError(error.response?.data?.message || 'Failed to update status');
    }
  };

  // Add this function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'inProcess':
        return 'bg-yellow-100 text-yellow-800';
      case 'converted':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Add function to fetch sales department ID
  const fetchSalesDepartmentId = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/department/all`);
      const salesDepartment = response.data.data.find(
        (dept: any) => dept.isSalesTeam === true
      );
      return salesDepartment?.id;
    } catch (error) {
      console.error('Error fetching sales department:', error);
      return null;
    }
  };

  // Add function to fetch sales executives
  const fetchSalesExecutives = async () => {
    try {
      setIsLoadingSalesUsers(true);
      const salesDeptId = await fetchSalesDepartmentId();
      
      if (salesDeptId) {
        const response = await axios.get(`${BASE_URL}/user/department/${salesDeptId}`);
        const executives = response.data.data.users;
        setSalesUsers(executives);
      } else {
        console.error('No department found with isSalesTeam=true');
        setSalesUsers([]);
      }
    } catch (error) {
      console.error('Error fetching sales executives:', error);
      setSalesUsers([]);
    } finally {
      setIsLoadingSalesUsers(false);
    }
  };

  // Add useEffect to fetch sales executives when component mounts
  useEffect(() => {
    fetchSalesExecutives();
  }, []);

  // Add function to fetch packages
  const fetchPackages = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/packages/all`);
      if (response.data.success) {
        setPackages(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  // Add useEffect to fetch packages when component mounts
  useEffect(() => {
    fetchPackages();
  }, []);

  // Add function to format currency
  const formatCurrency = (amount: number | bigint) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Add function to generate email body
  const generateEmailBody = (lead: { firstName: any; lastName: any; }, packages: any[]) => {
    const packageDetails = packages.map((pkg: { discounts: any[]; planName: any; enrollmentCharge: number | bigint; discountedPrice: any; initialPrice: number | bigint; offerLetterCharge: number | bigint; firstYearSalaryPercentage: any; features: any[]; }) => {
      const activeDiscount = pkg.discounts && pkg.discounts.length > 0 
        ? Math.max(...pkg.discounts.map((d: { percentage: any; }) => d.percentage))
        : null;

      return `
${pkg.planName}
• Enrollment: **${formatCurrency(pkg.enrollmentCharge)}**${pkg.discountedPrice ? ` (Original: ~~${formatCurrency(pkg.initialPrice)}~~)` : ''}
• Offer Letter: **${formatCurrency(pkg.offerLetterCharge)}**
• First Year: **${pkg.firstYearSalaryPercentage}%** of salary
${pkg.features.length > 0 ? `\nFeatures:\n${pkg.features.map((f: any) => `• ${f}`).join('\n')}` : ''}
${activeDiscount ? `\n*Active Discount: Up to **${activeDiscount}% off**!*` : ''}
-------------------`;
    }).join('\n\n');

    return `Dear ${lead.firstName} ${lead.lastName},

Thank you for your valuable time.

As discussed, I've highlighted details about our company and services below to give you a better understanding of our online presence and commitment to supporting your job search.

Why Choose Ninez Tech?
Join the fastest-growing network for OPT/CPT/H1B/GC/USC job seekers and sponsors. We specialize in connecting international professionals, students, and US companies.

Our Available Plans:

${packageDetails}

Let me know if you have any questions or would like to hop on a quick call to discuss which plan best aligns with your goals.

Looking forward to helping you take the next big step in your career!

Best regards,
${(() => {
  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  return userData ? `${userData.firstname} ${userData.lastname}` : '';
})()}`;
  };

  // Update handleEmailClick function
  const handleEmailClick = (lead: Lead) => {
    const userDataString = localStorage.getItem('user');
    const userData = userDataString ? JSON.parse(userDataString) : null;
    
    const emailLead: EmailLead = {
      firstName: lead.firstName,
      lastName: lead.lastName,
      primaryEmail: lead.primaryEmail,
      id: lead.id,
      from: userData ? `${userData.firstname} ${userData.lastname} <${userData.email}>` : ''
    };
    
    setSelectedLeadForEmail(emailLead);
    setShowEmailPopup(true);
  };

  useEffect(() => {
    if (permissionError) {
      console.error('Permission error:', permissionError);
      setApiError('Error loading permissions. Please try again or contact support.');
    }
  }, [permissionError]);



  // Modify the assign button section to add debugging wrapper
  const AssignmentSection = () => {
    const hasAssignmentPermission = checkPermission('Lead Assignment Management', 'edit');
    console.log('Rendering assignment section, has permission:', hasAssignmentPermission);
    
    if (!hasAssignmentPermission) {
      console.log('No assignment permission, not rendering assignment controls');
      return null;
    }

    return (
      <>
        <select 
          className="border px-4 py-2 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={selectedSalesPerson}
          onChange={(e) => {
            setSelectedSalesPerson(e.target.value);
            if (e.target.value) {
              setCurrentSalesPerson('');
            }
          }}
        >
          <option value="">Select sales person</option>
          {isLoadingSalesUsers ? (
            <option value="" disabled>Loading sales executives...</option>
          ) : (
            salesUsers.map((user) => (
              <option 
                key={user.id}
                value={`${user.firstname} ${user.lastname}`}
                disabled={`${user.firstname} ${user.lastname}` === currentSalesPerson}
              >
                {user.firstname} {user.lastname}
              </option>
            ))
          )}
        </select>
        <button 
          className={`${getButtonProps().color} text-white px-5 py-2 rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow`}
          onClick={handleAssignSalesPerson}
          disabled={!selectedSalesPerson || selectedLeads.length === 0}
        >
          {getButtonProps().text}
        </button>
      </>
    );
  };

  return (
    <RouteGuard activityName="Lead Management">
      <div className="ml-[20px] mt-6 p-8 bg-gray-50 min-h-screen">
        <div className="max-w-[1350px] mx-auto">
          {permissionsLoading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              {apiError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                  {apiError}
                </div>
              )}
              
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Lead Management</h1>
                <p className="text-gray-600">Create and manage your leads efficiently</p>
              </div>

              {/* Main Tabs */}
              <PermissionGuard activityName="Lead Management" action="add">
                <div className="bg-white mb-4 rounded-t-xl border-b border-gray-200">
                  <div className="flex justify-between items-center">
                  <div className="flex">
                    <button
                      className={getTabStyle(activeMainTab === 'create')}
                      onClick={() => setActiveMainTab('create')}
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Lead
                      </span>
                    </button>
                    <button
                      className={getTabStyle(activeMainTab === 'bulk')}
                      onClick={() => setActiveMainTab('bulk')}
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Bulk Upload
                      </span>
                      </button>
                    </div>
                    <button
                      onClick={() => setIsFormVisible(!isFormVisible)}
                      className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      {isFormVisible ? (
                        <FiChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <FiChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              </PermissionGuard>

              {/* Form Sections */}
              <AnimatePresence mode="wait">
                {isFormVisible && (
                <motion.div
                  key={activeMainTab}
                    initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-b-xl shadow-lg p-6 mb-6 border-x border-b border-gray-200"
                >
                  <PermissionGuard activityName="Lead Management" action="add">
                    {activeMainTab === 'create' ? (
                      // Create Lead Form
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          console.log('Form submitted');
                          handleSubmit(e);
                        }} 
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-3 gap-6">
                          <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                            <input 
                              type="text" 
                              name="firstName" 
                              value={formData.firstName} 
                              onChange={handleChange} 
                              placeholder="Enter first name" 
                              className={`w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                errors.firstName ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            {errors.firstName && (
                              <p className="mt-1.5 text-sm text-red-600">{errors.firstName}</p>
                            )}
                          </div>
                          
                          <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                            <input 
                              type="text" 
                              name="lastName" 
                              value={formData.lastName} 
                              onChange={handleChange} 
                              placeholder="Enter last name" 
                              className={`w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                errors.lastName ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            {errors.lastName && (
                              <p className="mt-1.5 text-sm text-red-600">{errors.lastName}</p>
                            )}
                          </div>
                          
                          <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn URL *</label>
                            <input 
                              type="url" 
                              name="linkedinId" 
                              value={formData.linkedinId} 
                              onChange={handleChange} 
                              placeholder="https://linkedin.com/in/username" 
                              className={`w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                errors.linkedinId ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            {errors.linkedinId && (
                              <p className="mt-1.5 text-sm text-red-600">{errors.linkedinId}</p>
                            )}
                          </div>
                          
                          <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Contact *</label>
                            <PhoneInput
                              country={'us'}
                              value={formData.primaryContact}
                              onChange={handlePhoneChange}
                              containerClass="w-full"
                              inputClass={`w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                errors.primaryContact ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            {errors.primaryContact && (
                              <p className="mt-1.5 text-sm text-red-600">{errors.primaryContact}</p>
                            )}
                          </div>
                          
                          <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Contact</label>
                            <PhoneInput
                              country={'us'}
                              value={formData.contactNumbers[1] || ''}
                              onChange={handleSecondaryContactChange}
                              containerClass="w-full"
                              inputClass="w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300"
                            />
                          </div>
                          
                          <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Email *</label>
                            <input 
                              type="email" 
                              name="primaryEmail" 
                              value={formData.primaryEmail} 
                              onChange={(e) => handleEmailChange(e.target.value, 0)}
                              placeholder="Enter primary email" 
                              className={`w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                errors.primaryEmail ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            {errors.primaryEmail && (
                              <p className="mt-1.5 text-sm text-red-600">{errors.primaryEmail}</p>
                            )}
                          </div>

                          <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Email</label>
                            <input 
                              type="email" 
                              name="secondaryEmail" 
                              value={formData.emails[1] || ''} 
                              onChange={(e) => handleEmailChange(e.target.value, 1)}
                              placeholder="Enter secondary email" 
                              className="w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300"
                            />
                          </div>
                          
                          <div className="relative">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2">
                              <label className="block text-sm font-medium text-gray-700">Technology *</label>
                            </div>
                            
                            {/* Technology Input */}
                            <div className="relative w-full">
                              <input
                                type="text"
                                value={formData.technology[formData.technology.length - 1]}
                                onChange={handleTechnologyChange}
                                onKeyPress={handleTechnologyKeyPress}
                                placeholder="Enter technology (press Enter to add)"
                                className={`w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                  errors.technology ? 'border-red-500' : 'border-gray-300'
                                }`}
                              />
                              {formData.technology.length > 1 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {formData.technology.slice(0, -1).map((tech, idx) => (
                                    <div key={idx} className="inline-flex items-center bg-gray-50 rounded-md border border-gray-200 px-3 py-1">
                                      <span className="text-sm">{tech}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newTechnologies = formData.technology.filter((_, i) => i !== idx);
                                          setFormData(prev => ({
                                            ...prev,
                                            technology: newTechnologies
                                          }));
                                        }}
                                        className="ml-2 text-gray-400 hover:text-gray-600"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {errors.technology && (
                              <p className="mt-1.5 text-sm text-red-600">{errors.technology[0]}</p>
                            )}
                          </div>
                          
                          <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                            <select
                              name="country"
                              value={formData.countryCode}
                              onChange={handleCountryChange}
                              className={`w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                errors.country ? 'border-red-500' : 'border-gray-300'
                              }`}
                            >
                              <option value="">Select a country</option>
                              {countries.map(country => (
                                <option key={country.value} value={country.value}>
                                  {country.label}
                                </option>
                              ))}
                            </select>
                            {errors.country && (
                              <p className="mt-1.5 text-sm text-red-600">{errors.country}</p>
                            )}
                          </div>
                          
                          <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Visa Status *</label>
                            <select
                              name="visaStatus"
                              value={formData.visaStatus}
                              onChange={handleChange}
                              className={`w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                errors.visaStatus ? 'border-red-500' : 'border-gray-300'
                              }`}
                            >
                              <option value="">Select visa status</option>
                              <option value="H1B">H1B</option>
                              <option value="L1">L1</option>
                              <option value="H4">H4</option>
                              <option value="F1">F1</option>
                              <option value="B2">B2</option>
                            </select>
                            {errors.visaStatus && (
                              <p className="mt-1.5 text-sm text-red-600">{errors.visaStatus}</p>
                            )}
                          </div>
                          
                          <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Lead Source *</label>
                            <select
                              name="leadSource"
                              value={formData.leadSource}
                              onChange={handleChange}
                              className={`w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                errors.leadSource ? 'border-red-500' : 'border-gray-300'
                              }`}
                            >
                              <option value="">Select lead source</option>
                              <option value="Indeed">Indeed</option>
                              <option value="LinkedIn">LinkedIn</option>
                              <option value="Referral">Referral</option>
                              <option value="Other">Other</option>
                            </select>
                            {errors.leadSource && (
                              <p className="mt-1.5 text-sm text-red-600">{errors.leadSource}</p>
                            )}
                          </div>
                        </div>

                        {/* Remarks Section */}
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2">
                            <label className="block text-sm font-medium text-gray-700">Remarks *</label>
                          </div>
                          
                          {/* Current Textarea */}
                          <div className="relative w-full">
                            <textarea
                              value={formData.remarks[0].text}
                              onChange={(e) => {
                                const newRemarks = [{
                                  text: e.target.value,
                                  createdAt: new Date().toISOString(),
                                  createdBy: 0
                                }];
                                setFormData(prev => ({
                                  ...prev,
                                  remarks: newRemarks
                                }));
                              }}
                              className="w-full min-h-[100px] h-[100px] p-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300 resize-y"
                              placeholder="Enter your remark here..."
                            />
                          </div>

                          {errors.remarks && (
                            <p className="mt-1.5 text-sm text-red-600">{errors.remarks[0].text}</p>
                          )}
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end mt-6">
                          <button
                            type="submit"
                            disabled={isLoading}
                            className={`px-6 py-2.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                              isLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {isLoading ? (
                              <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating Lead...
                              </span>
                            ) : (
                              'Create Lead'
                            )}
                          </button>
                        </div>
                      </form>
                    ) : (
                      // Bulk Upload Form
                      <div className="max-w-xl mx-auto">
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-gray-900 mb-1">Bulk lead upload</h4>
                          <p className="text-sm text-gray-500">Upload multiple leads at once</p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow transition-all duration-300">
                          <div className="text-center mb-6">
                            <button 
                              onClick={exportToExcel}
                              className="p-3 hover:bg-white rounded-lg cursor-pointer transition-all duration-200 shadow-sm hover:shadow"
                              title="Export to Excel"
                            >
                              <img 
                                src={LogoIcon}
                                alt="Excel" 
                                className="w-12 h-12 mx-auto"
                              />
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">Download the sample file, enter the data of leads into it and upload the bulk lead from Browse button.</p>
                          <p className="text-sm text-gray-500 mb-6">Note: Don't change the header and the filename.</p>
                          <div className="flex items-center gap-3">
                            <input
                              type="file"
                              accept=".xlsx"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setFile(e.target.files[0]);
                                  setUploadSuccess(false);
                                }
                              }}
                              className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all duration-200"
                            />
                            <button
                              onClick={handleFileUpload}
                              className="flex items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow"
                              title="Upload selected file"
                            >
                              <span className="text-xl font-bold">&uarr;</span>
                            </button>
                          </div>
                          {uploadSuccess && (
                            <p className="text-green-600 mt-4 text-sm font-medium">File uploaded successfully!</p>
                          )}
                        </div>
                      </div>
                    )}
                  </PermissionGuard>
                </motion.div>
                )}
              </AnimatePresence>

              {/* Status Tabs */}
              <PermissionGuard activityName="Lead Management" action="view">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="px-8 py-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Submitted Leads</h2>
                      <div className="flex items-center gap-4">
                        <PermissionGuard 
                          activityName="Lead Assignment Management" 
                          action="edit"
                          fallback={<div className="w-[300px]"></div>}
                        >
                          <AssignmentSection />
                        </PermissionGuard>
                        <select 
                          className="border px-4 py-2 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={pageSize}
                          onChange={(e) => setPageSize(Number(e.target.value))}
                        >
                          <option value="25">25 per page</option>
                          <option value="50">50 per page</option>
                          <option value="100">100 per page</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="border-b border-gray-200">
                      <div className="flex">
                        {(['open', 'inProcess','converted'] as const).map(tab => (
                          <button
                            key={tab}
                            className={getStatusTabStyle(activeStatusTab === tab)}
                            onClick={() => handleStatusTabChange(tab)}
                          >
                            <span className="flex items-center gap-2">
                              {getStatusIcon(tab)}
                              {tab.charAt(0).toUpperCase() + tab.slice(1)}
                              <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-xs">
                                {getLeadsCountByStatus(tab)}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Table with horizontal scroll prevention */}
                  <div className="w-full">
                    {isLoading || permissionsLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <div className="inline-block min-w-full align-middle">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="px-6 py-4 border-b">
                                  <PermissionGuard 
                                    activityName="Lead Assignment Management" 
                                    action="edit"
                                  >
                                    <input 
                                      type="checkbox" 
                                      checked={selectedLeads.length === paginatedLeads.length}
                                      onChange={handleSelectAll}
                                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                  </PermissionGuard>
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">#</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Candidate name</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Email</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Send Email</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Contact</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Technology</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">LinkedIn</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Visa</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Country</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Sales</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Created At</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Created By</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Updated By</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedLeads.map((lead: Lead, index: number) => (
                                <tr key={lead.id || index} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 border-b">
                                    <PermissionGuard 
                                      activityName="Lead Assignment Management" 
                                      action="edit"
                                      fallback={<div className="w-4 h-4"></div>}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedLeads.includes(index)}
                                        onChange={() => handleCheckboxChange(index)}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                      />
                                    </PermissionGuard>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900 border-b whitespace-nowrap">
                                    {(currentPage - 1) * pageSize + index + 1}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900 border-b whitespace-nowrap">
                                    {lead.firstName} {lead.lastName}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900 border-b whitespace-nowrap">
                                    {lead.primaryEmail}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900 border-b whitespace-nowrap">
                                    <button
                                      onClick={() => handleEmailClick(lead)}
                                      className="text-indigo-600 hover:text-indigo-900 hover:underline"
                                    >
                                      Send Email
                                    </button>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900 border-b whitespace-nowrap">
                                    <button
                                      className="text-indigo-600 hover:text-indigo-900 hover:underline"
                                      onClick={() => {
                                        setCallOptions(lead.contactNumbers.filter(Boolean));
                                        setCallLeadName(`${lead.firstName} ${lead.lastName}`);
                                        setSelectedCallNumber(lead.primaryContact || lead.contactNumbers[0] || '');
                                        setShowCallPopup(true);
                                      }}
                                      type="button"
                                    >
                                      {lead.primaryContact}
                                    </button>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900 border-b whitespace-nowrap">
                                    {Array.isArray(lead.technology) ? lead.technology.join(', ') : lead.technology}
                                  </td>
                                  <td className="px-6 py-4 text-sm border-b whitespace-nowrap">
                                    <a 
                                      href={lead.linkedinId} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-indigo-600 hover:text-indigo-900 hover:underline"
                                    >
                                      LinkedIn
                                    </a>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900 border-b whitespace-nowrap">
                                    {lead.visaStatus}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900 border-b whitespace-nowrap">
                                    {lead.country}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900 border-b whitespace-nowrap">
                                    {lead.assignedUser ? `${lead.assignedUser.firstname} ${lead.assignedUser.lastname}` : '--'}
                                  </td>
                                  <td className="px-6 py-4 text-sm border-b whitespace-nowrap">
                                    <PermissionGuard 
                                      activityName="Lead Status Management" 
                                      action="view"
                                      fallback={<div className="px-2 py-1 rounded-md text-sm font-medium bg-gray-50 text-gray-500">{lead.status || 'open'}</div>}
                                    >
                                      <PermissionGuard
                                        activityName="Lead Status Management"
                                        action="edit"
                                        fallback={
                                          <div className={`px-2 py-1 rounded-md text-sm font-medium ${getStatusColor(lead.statusGroup || 'open')}`}>
                                            {lead.status || 'open'}
                                          </div>
                                        }
                                      >
                                        <select
                                          value={lead.status || 'open'}
                                          onChange={(e) => handleStatusChange(lead.id || 0, e.target.value)}
                                          disabled={lead.status === 'closed'}
                                          className={`px-2 py-1 rounded-md text-sm font-medium ${getStatusColor(lead.statusGroup || 'open')} border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${lead.status === 'closed' ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        >
                                          <option value="open">Open</option>
                                          <option value="DNR1">DNR1</option>
                                          <option value="DNR2">DNR2</option>
                                          <option value="DNR3">DNR3</option>
                                          <option value="interested">Interested</option>
                                          <option value="not working">Not Working</option>
                                          <option value="wrong no">Wrong No</option>
                                          <option value="call again later">Call Again Later</option>
                                          <option value="closed">Closed</option>
                                          <option value="Dead">Dead</option>
                                          <option value="notinterested">Not Interested</option>
                                        </select>
                                      </PermissionGuard>
                                    </PermissionGuard>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900 border-b whitespace-nowrap">
                                    {lead.createdAt ? new Date(lead.createdAt).toLocaleString('en-US', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                      hour12: false
                                    }).replace(',', '') : '-'}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900 border-b whitespace-nowrap">
                                    {lead.creator ? `${lead.creator.firstname} ${lead.creator.lastname}` : '--'}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900 border-b whitespace-nowrap">
                                    {lead.updater ? `${lead.updater.firstname} ${lead.updater.lastname}` : '--'}
                                  </td>
                                  <td className="px-6 py-4 text-sm border-b whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                      <button 
                                        onClick={() => handleInfoClick(lead)}
                                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                        title="View details"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  <div className="flex justify-between items-center px-8 py-5 border-t">
                    <div className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, leads.length)} of {leads.length} leads
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 mx-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2 mx-2 bg-gray-50 rounded-md text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 mx-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </PermissionGuard>
            </>
          )}
        </div>

        {/* Modals */}
        <LeadDetailsModal
          isOpen={showInfoDialog}
          onClose={handleCloseInfoDialog}
          lead={selectedLead}
        />
        <StatusRemarkModal
          isOpen={showStatusRemarkModal}
          onClose={() => {
            setShowStatusRemarkModal(false);
            setSelectedLeadForStatus(null);
            setNewStatus('');
          }}
          onSubmit={handleStatusRemarkSubmit}
          currentStatus={selectedLeadForStatus?.status || ''}
          newStatus={newStatus}
        />
        <StatusChangeNotification
          isOpen={showStatusNotification}
          onClose={() => setShowStatusNotification(false)}
          leadName={statusNotificationData?.leadName || ''}
          newStatus={statusNotificationData?.newStatus || ''}
          statusGroup={statusNotificationData?.statusGroup || ''}
        />
        <EmailPopup
          isOpen={showEmailPopup}
          onClose={() => setShowEmailPopup(false)}
          lead={selectedLeadForEmail || { firstName: '', lastName: '', primaryEmail: '' }}
          emailBody={generateEmailBody(selectedLeadForEmail || { firstName: '', lastName: '' }, packages)}
          emailSubject="Embark on a Success Journey with Ninez Tech"
          packages={packages}
        />
        <ReassignRemarkModal
          isOpen={showReassignRemarkModal}
          onClose={() => {
            setShowReassignRemarkModal(false);
            setPendingReassign(null);
          }}
          onSubmit={async (remark) => {
            if (pendingReassign) {
              setReassignRemarkLoading(true);
              await assignLeads(pendingReassign.user, remark);
              setReassignRemarkLoading(false);
              setShowReassignRemarkModal(false);
              setPendingReassign(null);
            }
          }}
          loading={reassignRemarkLoading}
        />
        {showCallPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 relative">
              <h3 className="text-lg font-semibold mb-4">Call {callLeadName}</h3>
              <div className="mb-4">
                <div className="mb-2 text-sm text-gray-700">Select a number:</div>
                {callOptions.map((num: string) => (
                  <button
                    key={num}
                    className={`block w-full text-left px-4 py-2 rounded-md border mb-2 ${selectedCallNumber === num ? 'bg-indigo-100 border-indigo-400' : 'bg-gray-50 border-gray-200'}`}
                    onClick={() => setSelectedCallNumber(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
              {selectedCallNumber && (
                <div className="mb-4 text-sm text-gray-700">Selected: <span className="font-bold">{selectedCallNumber}</span></div>
              )}
              <div className="mb-4">
                <div className="mb-2 text-sm text-gray-700">Choose a calling option:</div>
                <div className="flex gap-3">
                  <a
                    href={`https://meet.google.com/new`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-green-100 rounded hover:bg-green-200 text-green-800 font-medium"
                  >
                    Google Meet
                  </a>
                  <a
                    href={`https://zoom.us/start/videomeeting`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-100 rounded hover:bg-blue-200 text-blue-800 font-medium"
                  >
                    Zoom
                  </a>
                  {selectedCallNumber && (
                    <a
                      href={`tel:${selectedCallNumber}`}
                      className="px-4 py-2 bg-yellow-100 rounded hover:bg-yellow-200 text-yellow-800 font-medium"
                    >
                      Phone
                    </a>
                  )}
                  {/* Add more options as needed */}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200"
                  onClick={() => {
                    setShowCallPopup(false);
                    setSelectedCallNumber('');
                    setCallLeadName('');
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
};

export default LeadCreationComponent;
