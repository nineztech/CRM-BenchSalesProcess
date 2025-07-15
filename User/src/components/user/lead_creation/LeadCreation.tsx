import React, { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
// import * as XLSX from 'xlsx';
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
import { FaEdit, FaClock } from 'react-icons/fa';
import Countdown from 'react-countdown';
import BulkLeadUpload from './bulkLead';

// Add countdown renderer interface
interface CountdownRendererProps {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  completed: boolean;
}

// Add countdown renderer component
const countdownRenderer = ({ days, hours, minutes, seconds, completed }: CountdownRendererProps) => {
  if (completed) {
    return <span className="text-red-600 font-semibold">Now</span>;
  }

  return (
    <div className="flex items-center gap-1 text-white font-medium">
      {days > 0 && <span>{days}d</span>}
      {hours > 0 && <span>{hours}h</span>}
      <span>{minutes}m</span>
      <span>{seconds}s</span>
    </div>
  );
};
const BASE_URL=import.meta.env.VITE_API_URL|| "http://localhost:5006/api"

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
  statusGroup?: 'open' | 'converted' | 'archived' | 'inProcess';
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
  followUpDate?: string;
  followUpTime?: string;
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

// Add type definition for tab status
type TabStatus = 'open' | 'converted' | 'inProcess' | 'followup' | 'teamfollowup';

// Update the getStatusIcon function
const getStatusIcon = (status: TabStatus) => {
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
    case 'teamfollowup':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    default:
      return null;
  }
};
const LeadCreationComponent: React.FC = () => {
  const { checkPermission, error: permissionError, loading: permissionsLoading } = usePermissions();
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

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
  const [leadsData, setLeadsData] = useState<{
    [key: string]: {
      leads: Lead[];
      pagination: {
        total: number;
        totalPages: number;
        currentPage: number;
        limit: number;
      };
    };
  }>({
    open: { leads: [], pagination: { total: 0, totalPages: 0, currentPage: 1, limit: 10 } },
    inProcess: { leads: [], pagination: { total: 0, totalPages: 0, currentPage: 1, limit: 10 } },
    converted: { leads: [], pagination: { total: 0, totalPages: 1, currentPage: 1, limit: 10 } },
    archived: { leads: [], pagination: { total: 0, totalPages: 1, currentPage: 1, limit: 10 } },
    followup: { leads: [], pagination: { total: 0, totalPages: 1, currentPage: 1, limit: 10 } },
    teamfollowup: { leads: [], pagination: { total: 0, totalPages: 1, currentPage: 1, limit: 10 } }
  });

  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [pageSize, setPageSize] = useState(10);
  // const [allLeads, setAllLeads] = useState<Lead[]>([]);


  // Dialog states
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedSalesPerson, setSelectedSalesPerson] = useState<string>('');
  const [currentSalesPerson, setCurrentSalesPerson] = useState<string>('');

  // Tab states
  const [activeMainTab, setActiveMainTab] = useState<'create' | 'bulk'>('create');
  const [activeStatusTab, setActiveStatusTab] = useState<'open' | 'converted' | 'inProcess' | 'followup' | 'teamfollowup'>('open');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

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

  const [showEmailSelectionPopup, setShowEmailSelectionPopup] = useState(false);
  const [selectedEmailForPopup, setSelectedEmailForPopup] = useState<string>('');
  const [currentLeadForEmail, setCurrentLeadForEmail] = useState<Lead | null>(null);

  // Add isEditing state
  const [isEditing, setIsEditing] = useState(false);

  // Modify fetchLeads function to use correct endpoints
  const fetchLeads = async () => {
    try {
      console.log('[Fetch Leads] Starting fetch operation');
      console.log('[Search Query]', searchQuery ? `Searching for: "${searchQuery}"` : 'No search query');
      
      setIsLoading(true);
      setApiError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setApiError('Authentication required. Please login again.');
        return;
      }

      const hasViewAllLeadsPermission = await checkPermission('View All Leads', 'view');
      const baseEndpoint = hasViewAllLeadsPermission ? `${BASE_URL}/lead` : `${BASE_URL}/lead/assigned`;
      const endpoint = searchQuery !== '' ? `${BASE_URL}/search/leads` : baseEndpoint;
      console.log(`[API Request] Using endpoint: ${endpoint}`);

      const params: any = {
        page: leadsData[activeStatusTab].pagination.currentPage,
        limit: pageSize,
        sortBy: 'createdAt',
        sortOrder: 'DESC'
      };

      if (searchQuery !== '') {
        params.query = searchQuery;
        const normalizedStatusGroup = activeStatusTab === 'followup' ? 'followUp' : activeStatusTab;
        params.statusGroup = normalizedStatusGroup;
      }

      console.log('[API Request] Params:', params);

      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params
      });

      if (response.data.success) {
        console.log('[API Response] Success:', {
          searchActive: !!searchQuery,
          totalResults: searchQuery ? response.data.data.total : response.data.data[activeStatusTab]?.pagination.total,
          currentPage: searchQuery ? response.data.data.currentPage : response.data.data[activeStatusTab]?.pagination.currentPage
        });
        
        const { data } = response.data;
        
        if (searchQuery.trim()) {
          // Handle search results
          console.log('[Search Results] Found:', data.leads?.length || 0, 'leads');
          setLeadsData(prev => ({
            ...prev,
            [activeStatusTab]: {
              leads: data.leads || [],
              pagination: {
                total: data.total || 0,
                totalPages: Math.ceil((data.total || 0) / pageSize),
                currentPage: data.currentPage || 1,
                limit: pageSize
              }
            }
          }));
        } else {
          // Handle regular fetch (no search)
          console.log('[Regular Fetch] Data received for tabs:', Object.keys(data));
          setLeadsData(prev => ({
            ...prev,
            open: data.open || { leads: [], pagination: { total: 0, totalPages: 1, currentPage: 1, limit: pageSize } },
            inProcess: data.inProcess || { leads: [], pagination: { total: 0, totalPages: 1, currentPage: 1, limit: pageSize } },
            converted: data.converted || { leads: [], pagination: { total: 0, totalPages: 1, currentPage: 1, limit: pageSize } },
            archived: data.archived || { leads: [], pagination: { total: 0, totalPages: 1, currentPage: 1, limit: pageSize } },
            followup: data.followup || { leads: [], pagination: { total: 0, totalPages: 1, currentPage: 1, limit: pageSize } },
            teamfollowup: data.teamFollowup || { leads: [], pagination: { total: 0, totalPages: 1, currentPage: 1, limit: pageSize } }
          }));
        }
      } else {
        console.error('[API Error] Failed to fetch leads:', response.data);
        setApiError('Failed to fetch leads. Please try again.');
      }
    } catch (error: any) {
      console.error('[Error] Error in fetchLeads:', error);
      setApiError(error.response?.data?.message || 'Failed to fetch leads. Please try again.');
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  // Update handlePageChange to use correct endpoints
  const handlePageChange = async (newPage: number) => {
    try {
      setIsLoading(true);
      setApiError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setApiError('Authentication required. Please login again.');
        return;
      }

      const hasViewAllLeadsPermission = await checkPermission('View All Leads', 'view');
      const baseEndpoint = hasViewAllLeadsPermission ? `${BASE_URL}/lead` : `${BASE_URL}/lead/assigned`;
      const endpoint = searchQuery !== '' ? `${BASE_URL}/search/leads` : baseEndpoint;

      const params: any = {
        page: newPage,
        limit: pageSize,
        sortBy: 'createdAt',
        sortOrder: 'DESC'
      };

      if (searchQuery !== '') {
        params.query = searchQuery;
        const normalizedStatusGroup = activeStatusTab === 'followup' ? 'followUp' : activeStatusTab;
        params.statusGroup = normalizedStatusGroup;
      }

      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params
      });

      if (response.data.success) {
        const { data } = response.data;
        if (searchQuery.trim()) {
          // Handle search results pagination
          setLeadsData(prev => ({
            ...prev,
            [activeStatusTab]: {
              leads: data.leads || [],
              pagination: {
                total: data.total || 0,
                totalPages: Math.ceil((data.total || 0) / pageSize),
                currentPage: newPage,
                limit: pageSize
              }
            }
          }));
        } else {
          // Handle regular pagination
          if (activeStatusTab === 'teamfollowup') {
            // Handle team followup data specifically
            setLeadsData(prev => ({
              ...prev,
              teamfollowup: {
                leads: data.teamFollowup?.leads || [],
                pagination: {
                  total: data.teamFollowup?.pagination.total || 0,
                  totalPages: data.teamFollowup?.pagination.totalPages || 1,
                  currentPage: newPage,
                  limit: pageSize
                }
              }
            }));
          } else {
            // Handle other tabs
            setLeadsData(prev => ({
              ...prev,
              [activeStatusTab]: {
                leads: data[activeStatusTab]?.leads || [],
                pagination: {
                  total: data[activeStatusTab]?.pagination.total || 0,
                  totalPages: data[activeStatusTab]?.pagination.totalPages || 1,
                  currentPage: newPage,
                  limit: pageSize
                }
              }
            }));
          }
        }
      }
    } catch (error: any) {
      console.error('Error changing page:', error);
      setApiError(error.response?.data?.message || 'Failed to change page. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Immediate search effect
  useEffect(() => {
    if (searchQuery !== '') {
      setIsSearching(true);
    }
    fetchLeads();
  }, [searchQuery]);

  // Add clear search function
  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    fetchLeads();
  };

  // Effect to fetch leads when component mounts or when permissions change
  useEffect(() => {
    if (!permissionsLoading) {
      fetchLeads();
    }
  }, [permissionsLoading]);

  // Update handlePageSizeChange to reset to first page and fetch new data
  const handlePageSizeChange = async (newSize: number) => {
    try {
      setIsLoading(true);
      setApiError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setApiError('Authentication required. Please login again.');
        return;
      }

      const hasViewAllLeadsPermission = await checkPermission('View All Leads', 'view');
      // const hasLeadManagementPermission = await checkPermission('Lead Management', 'view');

      // if (!hasLeadManagementPermission && !hasViewAllLeadsPermission) {
      //   setApiError('You do not have permission to view leads.');
      //   return;
      // }

      // Select endpoint based on View All Leads permission
      const endpoint = hasViewAllLeadsPermission ? `${BASE_URL}/lead` : `${BASE_URL}/lead/assigned`;

      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          page: 1,
          limit: newSize,
          sortBy: 'createdAt',
          sortOrder: 'DESC'
        }
      });

      if (response.data.success) {
        const { data } = response.data;
        setPageSize(newSize);
        setLeadsData(prev => ({
          ...prev,
          [activeStatusTab]: {
            ...data[activeStatusTab],
            pagination: {
              ...data[activeStatusTab].pagination,
              currentPage: 1,
              limit: newSize
            }
          }
        }));
      }
    } catch (error: any) {
      console.error('Error changing page size:', error);
      setApiError(error.response?.data?.message || 'Failed to change page size. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  // Add useEffect to refresh leads periodically for follow-up timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (activeStatusTab === 'followup') {
        fetchLeads();
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(timer);
  }, [activeStatusTab]);

  // Add new useEffect for general refresh across all tabs
  useEffect(() => {
    const refreshTimer = setInterval(() => {
      fetchLeads();
    }, 300000); // Refresh every 5 minutes for all tabs

    return () => clearInterval(refreshTimer);
  }, []);

  // Update the getLeadsCountByStatus function
  const getLeadsCountByStatus = (status: string) => {
    if (searchQuery) {
      return leadsData[status as keyof typeof leadsData]?.pagination.total || 0;
    }
    if (status === 'followup') {
      return leadsData.followup.pagination.total;
    }
    return leadsData[status as keyof typeof leadsData]?.pagination.total || 0;
  };

  // Update filtered leads logic
  const filteredLeads = searchQuery 
    ? leadsData[activeStatusTab]?.leads || []
    : activeStatusTab === 'followup' 
      ? leadsData.followup.leads 
      : leadsData[activeStatusTab]?.leads || [];

  // Use the filtered leads directly since we're using server-side pagination
  const paginatedLeads = filteredLeads;
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
    const firstReassignedIndex = selectedLeads.find(index => leadsData[activeStatusTab].leads[index]?.assignedUser);
    if (firstReassignedIndex !== undefined) {
      setPendingReassign({ lead: leadsData[activeStatusTab].leads[firstReassignedIndex], user: selectedUser });
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
        const lead = leadsData[activeStatusTab].leads[leadIndex];
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
    return leadsData[activeStatusTab].leads[firstSelectedLead]?.assignedUser ? `${leadsData[activeStatusTab].leads[firstSelectedLead].assignedUser.firstname} ${leadsData[activeStatusTab].leads[firstSelectedLead].assignedUser.lastname}` : '';
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
    
    const hasSalesPerson = selectedLeads.some(index => leadsData[activeStatusTab].leads[index]?.assignedUser);
    
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

  const handleCheckboxChange = (index: number) => {
    const originalIndex = filteredLeads.findIndex((_, i) => i === index + ((leadsData[activeStatusTab].pagination.currentPage - 1) * pageSize));
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

      let response;
      if (isEditing && selectedLead?.id) {
        // Update existing lead
        response = await axios.put(
          `${BASE_URL}/lead/${selectedLead.id}`,
          leadData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
      } else {
        // Create new lead
        response = await axios.post(
          `${BASE_URL}/lead/add`,
          leadData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
      }

      if (response.data.success) {
        // Reset form and states
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
        setIsEditing(false);
        setSelectedLead(null);

        // Show success message
        toast.success(isEditing ? 'Lead updated successfully!' : 'Lead created successfully!');

        // Refresh the leads list
        fetchLeads();
      } else {
        const errorMessage = response.data.message || 'Failed to process lead. Please try again.';
        console.error('API Error:', errorMessage);
        setApiError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error processing lead:', error.response || error);
      const errorMessage = error.response?.data?.message || 'Failed to process lead. Please try again.';
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

  // Update the getStatusTabStyle function
  const getStatusTabStyle = (isActive: boolean): string => `
    relative px-6 py-3 text-sm font-medium transition-all duration-300
    ${isActive ? 
      'text-indigo-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-indigo-600' : 
      'text-gray-500 hover:text-gray-700'}
  `;

  // Update the handleStatusTabChange function
  const handleStatusTabChange = async (status: 'open' | 'converted' | 'inProcess' | 'followup' | 'teamfollowup') => {
    try {
      console.log(`[Status Tab Change] Switching to ${status} tab`);
      setIsLoading(true);
      setActiveStatusTab(status);
      setSelectedLeads([]); // Clear selected leads when changing tabs
      setSearchQuery(''); // Clear search when changing tabs

      const token = localStorage.getItem('token');
      if (!token) {
        setApiError('Authentication required. Please login again.');
        return;
      }

      const hasViewAllLeadsPermission = await checkPermission('View All Leads', 'view');
      const endpoint = hasViewAllLeadsPermission ? `${BASE_URL}/lead` : `${BASE_URL}/lead/assigned`;
      console.log(`[API Request] Fetching leads from: ${endpoint}`);
      console.log(`[API Request] Params:`, {
        page: 1,
        limit: pageSize,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
        status: status
      });

      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          page: 1,
          limit: pageSize,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
          status: status
        }
      });

      if (response.data.success) {
        console.log(`[API Response] Successfully fetched ${status} leads:`, {
          total: response.data.data[status === 'teamfollowup' ? 'teamFollowup' : status]?.pagination.total,
          currentPage: response.data.data[status === 'teamfollowup' ? 'teamFollowup' : status]?.pagination.currentPage,
          leads: response.data.data[status === 'teamfollowup' ? 'teamFollowup' : status]?.leads.length
        });
        const { data } = response.data;
        
        // Handle teamfollowup data differently since API returns it as teamFollowup
        const statusKey = status === 'teamfollowup' ? 'teamFollowup' : status;
        const statusData = data[statusKey] || { leads: [], pagination: { total: 0, totalPages: 1, currentPage: 1, limit: pageSize } };
        
        setLeadsData(prev => ({
          ...prev,
          [status]: {
            leads: statusData.leads || [],
            pagination: {
              total: statusData.pagination.total || 0,
              totalPages: statusData.pagination.totalPages || 1,
              currentPage: 1,
              limit: pageSize
            }
          }
        }));
      } else {
        console.error('[API Error] Failed to fetch leads:', response.data);
        setApiError('Failed to fetch leads. Please try again.');
      }
    } catch (error: any) {
      console.error('[Error] Error in handleStatusTabChange:', error);
      setApiError(error.response?.data?.message || 'Failed to fetch leads. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update the handleStatusChange function
  const handleStatusChange = async (leadId: number, newStatus: string) => {
    const lead = leadsData[activeStatusTab].leads.find(l => l.id === leadId);
    if (!lead) return;

    setSelectedLeadForStatus(lead);
    setNewStatus(newStatus);
    setShowStatusRemarkModal(true);
  };

  // Update the handleStatusRemarkSubmit function
  const handleStatusRemarkSubmit = async (remark: string, followUpDate?: string, followUpTime?: string, teamLeadId?: number, shouldReleaseTeamLead?: boolean) => {
    if (!selectedLeadForStatus) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setApiError('Authentication required. Please login again.');
        return;
      }

      // If shouldReleaseTeamLead is true, call the toggle API first
      if (shouldReleaseTeamLead) {
        try {
          await axios.patch(
            `${BASE_URL}/lead/${selectedLeadForStatus.id}/toggle-team-followup`,
            {},
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            }
          );
        } catch (error: any) {
          console.error('Error toggling team followup:', error);
          toast.error('Failed to release team lead');
          return;
        }
      }

      // Create the update data
      const updateData = {
        status: newStatus,
        remark,
        ...(followUpDate && { followUpDate }),
        ...(followUpTime && { followUpTime }),
        ...(teamLeadId && { team_followup_assigned_to: teamLeadId })
      };

      // Log the request data for debugging
      console.log('Updating lead status with data:', updateData);

      // Make the API call without duplicate /api prefix
      const response = await axios.patch(
        `${BASE_URL}/lead/${selectedLeadForStatus.id}/status`,
        updateData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Show success message
        toast.success('Lead status updated successfully');

        // Reset the selected lead and modal
        setSelectedLeadForStatus(null);
        setNewStatus('');
        setShowStatusRemarkModal(false);

        // Refresh the leads list
        fetchLeads();
      }
    } catch (error: any) {
      console.error('Error updating lead status:', error.response?.data || error);
      const errorMessage = error.response?.data?.message || 'Failed to update lead status';
      setApiError(errorMessage);
      toast.error(errorMessage);
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
          className={`${getButtonProps().color} text-white px-5 py-2 rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow ${!selectedSalesPerson ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleAssignSalesPerson}
          disabled={!selectedSalesPerson || selectedLeads.length === 0}
          title={!selectedSalesPerson ? 'Please select sales person to assign' : ''}
        >
          {getButtonProps().text}
        </button>
      </>
    );
  };

  // Add handleEditClick function near other handler functions
  const handleEditClick = async (lead: Lead) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setApiError('Authentication required. Please login again.');
        return;
      }

      // Set editing mode and populate form
      setIsEditing(true);
      setSelectedLead(lead);
      setFormData({
        ...lead,
        remarks: lead.remarks || [{
          text: '',
          createdAt: new Date().toISOString(),
          createdBy: 0
        }]
      });
      setIsFormVisible(true);
      setActiveMainTab('create');
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error('Error preparing lead edit:', error);
      toast.error('Failed to prepare lead edit. Please try again.');
    }
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
              <div className="mb-2">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Lead Management</h1>
                <p className="text-gray-600">Create and manage your leads efficiently</p>
              </div>

              {/* Main Tabs */}
              <PermissionGuard activityName="Lead Management" action="add">
                <div className="bg-white mb-4 rounded-t-xl border-b border-gray-200">
                  <div 
                    className="flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => setIsFormVisible(!isFormVisible)}
                  >
                  <div className="flex">
                    <button
                      className={getTabStyle(activeMainTab === 'create')}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMainTab('create');
                        }}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMainTab('bulk');
                        }}
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Bulk Upload
                      </span>
                    </button>
                    </div>
                    <div className="mr-4 p-2">
                      {isFormVisible ? (
                        <FiChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <FiChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
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
                      // Bulk Upload Form - Use the existing BulkLeadUpload component
                      <BulkLeadUpload />
                    )}
                  </PermissionGuard>
                </motion.div>
                )}
              </AnimatePresence>

              {/* Status Tabs */}
              <PermissionGuard activityName="Lead Management" action="view">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="px-8 py-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-4">
                        <h2 className="text-xl font-semibold text-gray-900">Submitted Leads</h2>
                        {/* Update search input */}
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search by name, email, phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-80 px-4 py-2 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          {searchQuery && (
                            <button
                              onClick={handleClearSearch}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              title="Clear search"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                          {isSearching && !searchQuery && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                            </div>
                          )}
                        </div>
                      </div>
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
                          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                        >
                          <option value="10">10 per page</option>
                          <option value="25">25 per page</option>
                          <option value="50">50 per page</option>
                          <option value="100">100 per page</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="border-b border-gray-200">
                      <div className="flex">
                        {(['open', 'inProcess', 'followup', 'teamfollowup', 'converted'] as TabStatus[]).map((tab: TabStatus) => (
                          <button
                            key={tab}
                            className={getStatusTabStyle(activeStatusTab === tab)}
                            onClick={() => handleStatusTabChange(tab)}
                          >
                            <span className="flex items-center gap-2">
                              {getStatusIcon(tab)}
                              {tab === 'followup' ? 'Follow Up' : 
                               tab === 'teamfollowup' ? 'Team Follow Up' :
                               tab.charAt(0).toUpperCase() + tab.slice(1)}
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
                                <th className="px-6 py-1 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">#</th>
                                <th className="px-6 py-1 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Candidate name</th>
                                <th className="px-6 py-1 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Email</th>
                                <th className="px-6 py-1 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Contact</th>
                                <th className="px-6 py-1 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Technology</th>
                                <th className="px-6 py-1 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">LinkedIn</th>
                                <th className="px-6 py-1 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Visa</th>
                                <th className="px-6 py-1 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Country</th>
                                <th className="px-6 py-1 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Sales</th>
                                <th className="px-6 py-1 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Status</th>
                                <th className="px-6 py-1 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Created At</th>
                                <th className="px-6 py-1 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Created By</th>
                                <th className="px-6 py-1 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Updated By</th>
                                <th className="px-6 py-1 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Action</th>
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
                                  <td className="px-6 py-1 text-sm text-start text-gray-900 border-b whitespace-nowrap">
                                    {(leadsData[activeStatusTab].pagination.currentPage - 1) * pageSize + index + 1}
                                  </td>
                                  <td className="px-6 py-1 text-sm text-start text-gray-900 border-b whitespace-nowrap">
                                    {lead.firstName} {lead.lastName}
                                  </td>
                                  <td className="px-6 py-1 text-sm text-start text-gray-900 border-b whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <button
                                        className="p-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                                        onClick={() => {
                                          setCurrentLeadForEmail(lead);
                                          setSelectedEmailForPopup(lead.primaryEmail);
                                          setShowEmailSelectionPopup(true);
                                        }}
                                        type="button"
                                        title="Email options"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                        </svg>
                                      </button>
                                      <span>{lead.primaryEmail}</span>
                                      
                                    </div>
                                  </td>
                                  <td className="px-6 py-1 text-sm text-start text-gray-900 border-b whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                       <button
                                        className="p-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                                      onClick={() => {
                                        setCallOptions(lead.contactNumbers.filter(Boolean));
                                        setCallLeadName(`${lead.firstName} ${lead.lastName}`);
                                        setSelectedCallNumber(lead.primaryContact || lead.contactNumbers[0] || '');
                                        setShowCallPopup(true);
                                      }}
                                      type="button"
                                        title="Call options"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                        </svg>
                                    </button>
                                      <span>{lead.primaryContact}</span>
                                   
                                    </div>
                                  </td>
                                  <td className="px-6 py-1 text-sm text-start text-gray-900 border-b whitespace-nowrap">
                                    {Array.isArray(lead.technology) ? lead.technology.join(', ') : lead.technology}
                                  </td>
                                  <td className="px-6 py-1 text-sm text-start border-b whitespace-nowrap">
                                    <a 
                                      href={lead.linkedinId} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-indigo-600 hover:text-indigo-900 hover:underline"
                                    >
                                      LinkedIn
                                    </a>
                                  </td>
                                  <td className="px-6 py-1 text-sm text-start text-gray-900 border-b whitespace-nowrap">
                                    {lead.visaStatus}
                                  </td>
                                  <td className="px-6 py-1 text-sm text-start text-gray-900 border-b whitespace-nowrap">
                                    {lead.country}
                                  </td>
                                  <td className="px-6 py-1 text-sm text-start text-gray-900 border-b whitespace-nowrap">
                                    {lead.assignedUser ? `${lead.assignedUser.firstname} ${lead.assignedUser.lastname}` : '--'}
                                  </td>
                                  <td className="px-6 py-1 text-sm text-start border-b whitespace-nowrap">
                                    <div className="flex flex-col gap-1">
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
                                          <div className="flex items-center gap-2">
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
                                              <option value="follow up">Follow Up</option>
                                              <option value="teamfollowup">Team Follow Up</option>
                                              <option value="closed">Enrolled</option>
                                              <option value="Dead">Dead</option>
                                              <option value="notinterested">Not Interested</option>
                                            </select>
                                            {lead.followUpDate && lead.followUpTime && (
                                              <div className="group relative">
                                                <FaClock 
                                                  className={`h-4 w-4 cursor-help ${
                                                    new Date(`${lead.followUpDate}T${lead.followUpTime}`) <= new Date() 
                                                      ? 'text-red-500' 
                                                      : 'text-gray-500'
                                                  }`} 
                                                />
                                                <div className="absolute z-10 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-xs rounded-md px-3 py-2 left-1/2 -translate-x-1/2 bottom-full mb-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg border border-indigo-500/20 flex items-center gap-2">
                                                  <span className="text-indigo-200">Follow up in:</span>
                                                  <Countdown
                                                    date={new Date(`${lead.followUpDate}T${lead.followUpTime}`)}
                                                    renderer={countdownRenderer}
                                                  />
                                                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-indigo-700 border-r border-b border-indigo-500/20"></div>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </PermissionGuard>
                                      </PermissionGuard>
                                    </div>
                                  </td>
                                  <td className="px-6 py-1 text-sm text-start text-gray-900 border-b whitespace-nowrap">
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
                                  <td className="px-6 py-1 text-sm text-start text-gray-900 border-b whitespace-nowrap">
                                    {lead.creator ? `${lead.creator.firstname} ${lead.creator.lastname}` : '--'}
                                  </td>
                                  <td className="px-6 py-1 text-sm text-start text-gray-900 border-b whitespace-nowrap">
                                    {lead.updater ? `${lead.updater.firstname} ${lead.updater.lastname}` : '--'}
                                  </td>
                                  <td className="px-6 py-1 text-sm text-start border-b whitespace-nowrap">
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
                                      {checkPermission('View All Leads', 'edit') || checkPermission('Lead Management', 'edit') ? (
                                        <button 
                                          onClick={() => handleEditClick(lead)}
                                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                          title="Edit lead"
                                        >
                                          <FaEdit className="h-4 w-4 text-blue-600" />
                                        </button>
                                      ) : null}
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
                      Showing {((leadsData[activeStatusTab].pagination.currentPage - 1) * pageSize) + 1} to {
                        Math.min(
                          leadsData[activeStatusTab].pagination.currentPage * pageSize,
                          leadsData[activeStatusTab].pagination.total
                        )
                      } of {leadsData[activeStatusTab].pagination.total} leads
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(leadsData[activeStatusTab].pagination.currentPage - 1)}
                        disabled={leadsData[activeStatusTab].pagination.currentPage === 1}
                        className="px-4 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2 bg-gray-50 rounded-md text-sm text-gray-600">
                        Page {leadsData[activeStatusTab].pagination.currentPage} of {leadsData[activeStatusTab].pagination.totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(leadsData[activeStatusTab].pagination.currentPage + 1)}
                        disabled={leadsData[activeStatusTab].pagination.currentPage >= leadsData[activeStatusTab].pagination.totalPages}
                        className="px-4 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200"
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
          isInTeamFollowupTab={activeStatusTab === 'teamfollowup'}
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
                      href={`tel://${selectedCallNumber.replace(/[^0-9+]/g, '')}`}
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
        {/* Add the Email Selection Popup */}
        {showEmailSelectionPopup && currentLeadForEmail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 relative">
              <h3 className="text-lg font-semibold mb-4">Select Email Address</h3>
              <div className="mb-4">
                <div className="mb-2 text-sm text-gray-700">Available email addresses:</div>
                {[...new Set([currentLeadForEmail.primaryEmail, ...currentLeadForEmail.emails.filter(Boolean)])].map((email: string) => (
                  <button
                    key={email}
                    className={`block w-full text-left px-4 py-2 rounded-md border mb-2 ${
                      selectedEmailForPopup === email ? 'bg-indigo-100 border-indigo-400' : 'bg-gray-50 border-gray-200'
                    }`}
                    onClick={() => setSelectedEmailForPopup(email)}
                  >
                    {email} {email === currentLeadForEmail.primaryEmail && <span className="text-xs text-gray-500">(Primary)</span>}
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200"
                  onClick={() => {
                    setShowEmailSelectionPopup(false);
                    setSelectedEmailForPopup('');
                    setCurrentLeadForEmail(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                  onClick={() => {
                    setShowEmailSelectionPopup(false);
                    const emailLead: EmailLead = {
                      firstName: currentLeadForEmail.firstName,
                      lastName: currentLeadForEmail.lastName,
                      primaryEmail: selectedEmailForPopup,
                      id: currentLeadForEmail.id,
                      from: (() => {
                        const userDataString = localStorage.getItem('user');
                        const userData = userDataString ? JSON.parse(userDataString) : null;
                        return userData ? `${userData.firstname} ${userData.lastname} <${userData.email}>` : '';
                      })()
                    };
                    setSelectedLeadForEmail(emailLead);
                    setShowEmailPopup(true);
                  }}
                >
                  Send Email
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