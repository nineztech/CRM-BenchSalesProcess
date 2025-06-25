import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import RouteGuard from '../../common/RouteGuard';
import usePermissions from '../../../hooks/usePermissions';

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5006/api";

interface ArchivedLead {
  id: number;
  firstName: string;
  lastName: string;
  primaryEmail: string;
  primaryContact: string;
  technology: string[];
  country: string;
  visaStatus: string;
  status: string;
  archivedAt: string;
  archiveReason: string;
  assignedUser?: {
    firstname: string;
    lastname: string;
  };
  creator?: {
    firstname: string;
    lastname: string;
  };
  updater?: {
    firstname: string;
    lastname: string;
  };
}

const ArchivedLeads: React.FC = () => {
  const [archivedLeads, setArchivedLeads] = useState<ArchivedLead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [reopenRemark, setReopenRemark] = useState('');
  const [selectedLead, setSelectedLead] = useState<ArchivedLead | null>(null);
  const [showReopenModal, setShowReopenModal] = useState(false);

  const { checkPermission } = usePermissions();

  const fetchArchivedLeads = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${BASE_URL}/archived-leads/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          page: currentPage,
          limit: pageSize,
          sortBy: 'archivedAt',
          sortOrder: 'DESC'
        }
      });

      if (response.data.success) {
        setArchivedLeads(response.data.data.leads);
        setTotalPages(response.data.data.pagination.totalPages);
      }
    } catch (err) {
      setError('Failed to fetch archived leads');
      console.error('Error fetching archived leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedLeads();
  }, [currentPage, pageSize]);

  const handleReopenLead = async () => {
    if (!selectedLead) return;

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      // First, reopen the lead
      const reopenResponse = await axios.post(
        `${BASE_URL}/archived-leads/${selectedLead.id}/reopen`,
        { remark: reopenRemark },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (reopenResponse.data.success) {
        // Then, update the status to inactive
        await axios.patch(
          `${BASE_URL}/archived-leads/${selectedLead.id}/status`,
          { status: 'inactive' },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        // Update the UI
        setArchivedLeads(prevLeads => 
          prevLeads.map(lead => 
            lead.id === selectedLead.id 
              ? { ...lead, status: 'inactive' }
              : lead
          )
        );
        setShowReopenModal(false);
        setSelectedLead(null);
        setReopenRemark('');
        alert('Lead reopened successfully!');
      }
    } catch (err) {
      setError('Failed to reopen lead');
      console.error('Error reopening lead:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RouteGuard activityName="Archived Lead Management">
      <div className="ml-[20px] mt-16 p-8 bg-gray-50 min-h-screen">
        <div className="max-w-[1350px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Archived Leads</h1>
            <p className="text-gray-600">View and manage archived leads</p>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-8 py-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Archived Leads List</h2>
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
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 border-b">Lead Name</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 border-b">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 border-b">Contact</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 border-b">Technology</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 border-b">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 border-b">Archived At</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 border-b">Archive Reason</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 border-b">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {archivedLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900 border-b">
                            {lead.firstName} {lead.lastName}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 border-b">{lead.primaryEmail}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 border-b">{lead.primaryContact}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 border-b">
                            {Array.isArray(lead.technology) ? lead.technology.join(', ') : lead.technology}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 border-b">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              lead.status === 'active' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {lead.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 border-b">
                            {new Date(lead.archivedAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 border-b">{lead.archiveReason}</td>
                          <td className="px-6 py-4 text-sm border-b">
                            {lead.status === 'active' && checkPermission('Reopen Lead Management', 'edit') && (
                              <button
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setShowReopenModal(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-900 font-medium"
                              >
                                Reopen
                              </button>
                            )}
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
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, archivedLeads.length)} of {archivedLeads.length} leads
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 bg-gray-50 rounded-md text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">Reopen Lead</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to reopen this lead? Please provide a remark for reopening.
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
                      setSelectedLead(null);
                      setReopenRemark('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReopenLead}
                    disabled={!reopenRemark.trim() || isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                  >
                    {isLoading ? 'Reopening...' : 'Reopen Lead'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </RouteGuard>
  );
};

export default ArchivedLeads; 