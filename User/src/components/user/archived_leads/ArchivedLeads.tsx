import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import RouteGuard from '../../common/RouteGuard';
import usePermissions from '../../../hooks/usePermissions';
import toast from 'react-hot-toast';
import LeadDetailsModal from '../lead_creation/LeadDetailsModal';

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5006/api";

// Helper function to highlight search terms
const highlightSearchTerm = (text: string, searchTerm: string) => {
  if (!searchTerm || !text) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => 
    regex.test(part) ? (
      <span key={index} className="bg-yellow-200 font-semibold">
        {part}
      </span>
    ) : part
  );
};

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
  assignTo?: number;
  previousAssign?: number;
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

interface ArchivedLead {
  id: number;
  originalLeadId: number;
  firstName: string;
  lastName: string;
  contactNumbers: string[];
  primaryContact: string;
  emails: string[];
  primaryEmail: string;
  linkedinId?: string;
  technology: string[];
  country: string;
  countryCode: string;
  visaStatus: string;
  statusGroup: string;
  leadSource: string;
  reference?: string;
  remarks: Remark[];
  archivedAt: string;
  reopenedAt?: string;
  archiveReason: string;
  leadstatus?: string;
  assignTo?: number;
  previousAssign?: number;
  totalAssign: number;
  assignedUser?: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    subrole: string | null;
    departmentId: number | null;
  };
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
  status: string;
}

const ArchivedLeadsComponent: React.FC = () => {
  const [archivedLeads, setArchivedLeads] = useState<ArchivedLead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [reopenRemark, setReopenRemark] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<ArchivedLead | null>(null);
  
  // Add search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const { checkPermission, loading: permissionsLoading } = usePermissions();
  const canReopenLeads = checkPermission('Reopen Lead Management', 'add') || checkPermission('Reopen Lead Management', 'edit');

  const fetchArchivedLeads = async () => {
    try {
      console.log('[Fetch Archived Leads] Starting fetch operation');
      console.log('[Search Query]', searchQuery ? `Searching for: "${searchQuery}"` : 'No search query');
      
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please login again.');
        return;
      }

      // Select endpoint based on search query
      const endpoint = searchQuery !== '' ? `${BASE_URL}/archived-leads/search` : `${BASE_URL}/archived-leads/all`;
      console.log(`[API Request] Using endpoint: ${endpoint}`);

      const params: any = {
        page: currentPage,
        limit: pageSize
      };

      if (searchQuery !== '') {
        params.query = searchQuery;
      } else {
        params.sortBy = 'archivedAt';
        params.sortOrder = 'DESC';
      }

      console.log('[API Request] Params:', params);

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params
      });

      if (response.data.success) {
        console.log('[API Response] Success:', {
          searchActive: !!searchQuery,
          totalResults: response.data.data.total || response.data.data.pagination?.total,
          currentPage: response.data.data.page || response.data.data.pagination?.currentPage
        });
        
        const { data } = response.data;
        
        if (searchQuery.trim()) {
          // Handle search results
          console.log('[Search Results] Found:', data.leads?.length || 0, 'archived leads');
          setArchivedLeads(data.leads || []);
          setTotalPages(Math.ceil((data.total || 0) / pageSize));
          setTotalCount(data.total || 0);
        } else {
          // Handle regular fetch
          console.log('[Regular Fetch] Data received');
          setArchivedLeads(data.leads || []);
          setTotalPages(data.pagination?.totalPages || 1);
          setTotalCount(data.pagination?.total || 0);
        }
      } else {
        console.error('[API Error] Failed to fetch archived leads:', response.data);
        setError('Failed to fetch archived leads. Please try again.');
      }
    } catch (err: any) {
      console.error('[Error] Error in fetchArchivedLeads:', err);
      setError(err.response?.data?.message || 'Failed to fetch archived leads. Please try again.');
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  // Immediate search effect
  useEffect(() => {
    if (searchQuery !== '') {
      setIsSearching(true);
    }
    fetchArchivedLeads();
  }, [searchQuery]);

  useEffect(() => {
    fetchArchivedLeads();
  }, [currentPage, pageSize]);

  // Add clear search function
  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    setCurrentPage(1);
    fetchArchivedLeads();
  };

  // Handle bulk reopen
  const handleBulkReopen = async () => {
    if (!selectedLeads.length) return;

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${BASE_URL}/archived-leads/bulk-reopen`,
        {
          leadIds: selectedLeads.map(index => archivedLeads[index].id),
          remark: reopenRemark
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Update the status of reopened leads to inactive
        setArchivedLeads(prevLeads => 
          prevLeads.map(lead => 
            response.data.data.results.success.some((result: { id: number }) => result.id === lead.id)
              ? { ...lead, status: 'inactive' }
              : lead
          )
        );
        setSelectedLeads([]);
        setShowReopenModal(false);
        setReopenRemark('');
        toast.success(`Successfully reopened ${response.data.data.successCount} leads!`);
        
        // Show failure message if any leads failed to reopen
        if (response.data.data.failureCount > 0) {
          toast.error(`Failed to reopen ${response.data.data.failureCount} leads.`);
        }
      }
    } catch (err) {
      setError('Failed to reopen leads');
      console.error('Error reopening leads:', err);
      toast.error('Failed to reopen leads. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Select all checkbox handler
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Only select active leads
      const activeIndexes = archivedLeads
        .map((lead, index) => lead.status === 'active' ? index : -1)
        .filter(index => index !== -1);
      setSelectedLeads(activeIndexes);
    } else {
      setSelectedLeads([]);
    }
  };

  const handleCheckboxChange = (index: number) => {
    setSelectedLeads(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  // Get count of active leads
  const activeLeadsCount = archivedLeads.filter(lead => lead.status === 'active').length;

  // Update error display to use toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error]);

  // Add handler for info icon click
  const handleInfoClick = (lead: ArchivedLead) => {
    setSelectedLead(lead);
    setShowInfoDialog(true);
  };

  const handleCloseInfoDialog = () => {
    setShowInfoDialog(false);
    setSelectedLead(null);
  };

  return (
    <RouteGuard activityName="Archived Lead Management">
      <div className="ml-[20px] mt-6 p-8 bg-gray-50 min-h-screen">
        <div className="max-w-[1350px] mx-auto">
          {permissionsLoading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Archived Leads</h1>
                <p className="text-gray-600">View and manage archived leads</p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {/* Main Content */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-8 py-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <h2 className="text-lg font-semibold text-gray-900">Archived Leads List</h2>
                      {/* Search input */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search archived leads..."
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
                      {canReopenLeads && selectedLeads.length > 0 && (
                        <button
                          onClick={() => setShowReopenModal(true)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition-all duration-200"
                        >
                          Reopen Selected ({selectedLeads.length})
                        </button>
                      )}
                      <select 
                        className="border px-4 py-2 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                      >
                        <option value="10">10 per page</option>
                        <option value="25">25 per page</option>
                        <option value="50">50 per page</option>
                        <option value="100">100 per page</option>
                      </select>
                    </div>
                  </div>

                  {/* Table */}
                  {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-6 py-1.5 text-left text-xs font-medium text-gray-500 border-b">
                              {canReopenLeads && activeLeadsCount > 0 && (
                                <input 
                                  type="checkbox" 
                                  checked={selectedLeads.length === activeLeadsCount}
                                  onChange={handleSelectAll}
                                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                              )}
                            </th>
                            <th className="px-6 py-1.5 text-left text-xs font-medium text-gray-500 border-b">#</th>
                            <th className="px-6 py-1.5 text-left text-xs font-medium text-gray-500 border-b">Lead Name</th>
                            <th className="px-6 py-1.5 text-left text-xs font-medium text-gray-500 border-b">Email</th>
                            <th className="px-6 py-1.5 text-left text-xs font-medium text-gray-500 border-b">Contact</th>
                            <th className="px-6 py-1.5 text-left text-xs font-medium text-gray-500 border-b">Technology</th>
                            <th className="px-6 py-1.5 text-left text-xs font-medium text-gray-500 border-b">Country</th>
                            <th className="px-6 py-1.5 text-left text-xs font-medium text-gray-500 border-b">Visa Status</th>
                            <th className="px-6 py-1.5 text-left text-xs font-medium text-gray-500 border-b">Lead Source</th>
                            <th className="px-6 py-1.5 text-left text-xs font-medium text-gray-500 border-b">Last Assigned To</th>
                            <th className="px-6 py-1.5 text-left text-xs font-medium text-gray-500 border-b">Archived At</th>
                            <th className="px-6 py-1.5 text-left text-xs font-medium text-gray-500 border-b">Archive Reason</th>
                            <th className="px-6 py-1.5 text-left text-xs font-medium text-gray-500 border-b">Lead Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {archivedLeads
                            .sort((a, b) => {
                              if (a.status === 'active' && b.status !== 'active') return -1;
                              if (a.status !== 'active' && b.status === 'active') return 1;
                              return 0;
                            })
                            .map((lead, index) => (
                            <tr key={lead.id} className="hover:bg-gray-50">
                              <td className="px-6 py-1.5 text-sm text-gray-900 border-b">
                                {canReopenLeads && lead.status === 'active' && (
                                  <input
                                    type="checkbox"
                                    checked={selectedLeads.includes(index)}
                                    onChange={() => handleCheckboxChange(index)}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                )}
                              </td>
                              <td className="px-6 py-1.5 text-sm text-gray-900 border-b whitespace-nowrap">
                                {((currentPage - 1) * pageSize) + index + 1}
                              </td>
                              <td className="px-6 py-1.5 text-sm text-gray-900 border-b whitespace-nowrap">
                                {searchQuery ? (
                                  <>
                                    {highlightSearchTerm(lead.firstName, searchQuery)} {highlightSearchTerm(lead.lastName, searchQuery)}
                                  </>
                                ) : (
                                  `${lead.firstName} ${lead.lastName}`
                                )}
                              </td>
                              <td className="px-6 py-1.5 text-sm text-gray-900 border-b whitespace-nowrap">
                                {searchQuery ? highlightSearchTerm(lead.primaryEmail, searchQuery) : lead.primaryEmail}
                              </td>
                              <td className="px-6 py-1.5 text-sm text-gray-900 border-b whitespace-nowrap">
                                {searchQuery ? highlightSearchTerm(lead.primaryContact, searchQuery) : lead.primaryContact}
                              </td>
                              <td className="px-6 py-1.5 text-sm text-gray-900 border-b whitespace-nowrap">
                                {searchQuery ? (
                                  Array.isArray(lead.technology) ? 
                                    lead.technology.map((tech, index) => (
                                      <span key={index}>
                                        {highlightSearchTerm(tech, searchQuery)}
                                        {index < lead.technology.length - 1 ? ', ' : ''}
                                      </span>
                                    )) :
                                    highlightSearchTerm(lead.technology, searchQuery)
                                ) : (
                                  Array.isArray(lead.technology) ? lead.technology.join(', ') : lead.technology
                                )}
                              </td>
                              <td className="px-6 py-1.5 text-sm text-gray-900 border-b whitespace-nowrap">
                                {searchQuery ? (
                                  <>
                                    {highlightSearchTerm(lead.country, searchQuery)} ({lead.countryCode})
                                  </>
                                ) : (
                                  `${lead.country} (${lead.countryCode})`
                                )}
                              </td>
                              <td className="px-6 py-1.5 text-sm text-gray-900 border-b whitespace-nowrap">
                                {searchQuery ? highlightSearchTerm(lead.visaStatus, searchQuery) : lead.visaStatus}
                              </td>
                              <td className="px-6 py-1.5 text-sm text-gray-900 border-b whitespace-nowrap">
                                {searchQuery ? highlightSearchTerm(lead.leadSource, searchQuery) : lead.leadSource}
                              </td>
                              <td className="px-6 py-1.5 text-sm text-gray-900 border-b whitespace-nowrap">
                                {lead.assignedUser ? (
                                  searchQuery ? (
                                    <>
                                      {highlightSearchTerm(lead.assignedUser.firstname, searchQuery)} {highlightSearchTerm(lead.assignedUser.lastname, searchQuery)}
                                    </>
                                  ) : (
                                    `${lead.assignedUser.firstname} ${lead.assignedUser.lastname}`
                                  )
                                ) : '-'}
                              </td>
                              <td className="px-6 py-1.5 text-sm text-gray-900 border-b whitespace-nowrap">
                                {new Date(lead.archivedAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                  hour12: false
                                }).replace(',', '')}
                              </td>
                              <td className="px-6 py-1.5 text-sm text-gray-900 border-b whitespace-nowrap">
                                <div className="flex items-center justify-between">
              
                                  <button 
                                    onClick={() => handleInfoClick(lead)}
                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors ml-2"
                                    title="View details"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                              <td className="px-6 py-1.5 text-sm text-gray-900 border-b whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  (lead.leadstatus || 'Dead') === 'notinterested' ? 'bg-red-100 text-red-800' :
                                  (lead.leadstatus || 'Dead') === 'Dead' ? 'bg-gray-100 text-gray-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {searchQuery ? highlightSearchTerm(lead.leadstatus || 'Dead', searchQuery) : (lead.leadstatus || 'Dead')}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pagination */}
                  <div className="flex justify-between items-center px-8 py-5 border-t">
                    <div className="text-sm text-gray-600">
                      {searchQuery ? (
                        <>Search results: {totalCount} archived leads found</>
                      ) : (
                        <>Showing {Math.min(((currentPage - 1) * pageSize) + 1, totalCount)} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} leads</>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2 bg-gray-50 rounded-md text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reopen Modal */}
              {showReopenModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
                  >
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Reopen Selected Leads</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Are you sure you want to reopen {selectedLeads.length} leads? Please provide a remark for reopening.
                    </p>
                    <textarea
                      value={reopenRemark}
                      onChange={(e) => setReopenRemark(e.target.value)}
                      placeholder="Enter remark for reopening..."
                      className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                      rows={3}
                    />
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setShowReopenModal(false);
                          setReopenRemark('');
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleBulkReopen}
                        disabled={!reopenRemark.trim() || isLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                      >
                        {isLoading ? 'Reopening...' : 'Reopen Leads'}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Add Lead Details Modal */}
              <LeadDetailsModal
                isOpen={showInfoDialog}
                onClose={handleCloseInfoDialog}
                lead={selectedLead ? {
                  ...selectedLead,
                  linkedinId: selectedLead.linkedinId || '',
                  status: selectedLead.status || 'archived',
                  statusGroup: selectedLead.statusGroup || 'archived',
                  remarks: selectedLead.remarks.map(remark => ({
                    ...remark,
                    creator: remark.creator || {
                      id: selectedLead.updater?.id || 0,
                      firstname: selectedLead.updater?.firstname || '',
                      lastname: selectedLead.updater?.lastname || '',
                      email: selectedLead.updater?.email || '',
                      designation: selectedLead.updater?.subrole || null,
                      department: selectedLead.updater?.departmentId ? String(selectedLead.updater.departmentId) : null
                    }
                  }))
                } as Lead : null}
              />
            </>
          )}
        </div>
      </div>
    </RouteGuard>
  );
};

export default ArchivedLeadsComponent; 