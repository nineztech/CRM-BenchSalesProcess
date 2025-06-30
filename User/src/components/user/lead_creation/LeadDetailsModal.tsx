import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5006/api";

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

interface LeadDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({ isOpen, onClose, lead }) => {
  const [activeTab, setActiveTab] = useState<'status' | 'reassign'>('status');
  const [reassignRemarks, setReassignRemarks] = useState<any[]>([]);
  const [loadingReassign, setLoadingReassign] = useState(false);
  const [errorReassign, setErrorReassign] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && lead?.id) {
      setLoadingReassign(true);
      setErrorReassign(null);
      axios.get(`${BASE_URL}/lead-assignments/${lead.id}`)
        .then(res => {
          const assignment = res.data?.data;
          if (assignment && Array.isArray(assignment.remark)) {
            setReassignRemarks(assignment.remark);
          } else {
            setReassignRemarks([]);
          }
        })
        .catch((error) => {
          if (error.response?.status === 404) {
            // If 404, it means no assignment exists yet - this is a valid state
            setReassignRemarks([]);
          } else {
            setErrorReassign('Failed to load reassignment history. Please try again later.');
          }
        })
        .finally(() => setLoadingReassign(false));
    }
  }, [isOpen, lead?.id, lead?.remarks, lead?.status]);

  // Add tab style function similar to LeadCreation.tsx
  const getTabStyle = (isActive: boolean) => `
    relative px-8 py-3 text-sm font-medium transition-all duration-300
    ${isActive ? 
      'text-indigo-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-indigo-600' : 
      'text-gray-500 hover:text-gray-700'}
  `;

  if (!lead) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-2xl transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all"
              >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Lead Details: {lead.firstName} {lead.lastName}
                    </h3>
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 bg-white">
                  <button
                    className={getTabStyle(activeTab === 'status')}
                    onClick={() => setActiveTab('status')}
                  >
                    Status Remarks
                  </button>
                  <button
                    className={getTabStyle(activeTab === 'reassign')}
                    onClick={() => setActiveTab('reassign')}
                  >
                    Reassign Remarks
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                  <div className="space-y-6">
                    {/* Lead Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Created By</p>
                          <p className="font-medium text-gray-900">
                            {lead.creator ? `${lead.creator.firstname} ${lead.creator.lastname}` : '--'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Created At</p>
                          <p className="font-medium text-gray-900">
                            {lead.createdAt ? new Date(lead.createdAt).toLocaleString('en-US', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: false
                            }).replace(',', '') : '--'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tab Content with Animation */}
                    <div className="min-h-[200px]">
                      <AnimatePresence mode="wait" initial={false}>
                        {activeTab === 'status' ? (
                          <motion.div
                            key="status"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.25 }}
                          >
                            {/* Status Remarks Tab Content */}
                            <div>
                              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                Remarks History
                              </h4>
                              <div className="space-y-4">
                                {lead.remarks.length === 0 ? (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                                  >
                                    <div className="flex items-start">
                                      <div className="flex-shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                          <span className="text-indigo-600 font-medium">1</span>
                                        </div>
                                      </div>
                                      <div className="ml-4 flex-1">
                                        <p className="text-gray-900 text-left whitespace-pre-wrap break-words">
                                          <b>Lead Created</b>
                                        </p>
                                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                                          <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                                            Open
                                          </span>
                                        </div>
                                        <div className="mt-2 flex items-center text-sm text-gray-500">
                                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          <span>
                                            {new Date(lead.createdAt || new Date()).toLocaleString('en-US', {
                                              day: '2-digit',
                                              month: 'short',
                                              year: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit',
                                              hour12: false
                                            }).replace(',', '')}
                                          </span>
                                          {lead.creator && (
                                            <span className="ml-4 flex items-center">
                                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                              </svg>
                                              <span className="font-medium">
                                                {lead.creator.firstname} {lead.creator.lastname}
                                              </span>
                                              <span className="mx-2 text-gray-400">•</span>
                                              <span className="text-gray-600">{lead.creator.email}</span>
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                ) : (
                                  [...lead.remarks].reverse().map((remark, index) => (
                                    <motion.div
                                      key={index}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: index * 0.1 }}
                                      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                      <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                            <span className="text-indigo-600 font-medium">
                                              {index + 1}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="ml-4 flex-1">
                                          <p className="text-gray-900 text-left whitespace-pre-wrap break-words">
                                            {typeof remark.text === 'string' ? remark.text : 'No text available'}
                                          </p>
                                          {remark.statusChange && (
                                            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                                              {remark.statusChange.from && (
                                                <>
                                                  <span className="px-2 py-1 bg-gray-100 rounded-full">
                                                    {remark.statusChange.from}
                                                  </span>
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                  </svg>
                                                </>
                                              )}
                                              <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                                                {remark.statusChange.to}
                                              </span>
                                            </div>
                                          )}
                                          <div className="mt-2 flex items-center text-sm text-gray-500">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>
                                              {new Date(remark.createdAt).toLocaleString('en-US', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                                hour12: false
                                              }).replace(',', '')}
                                            </span>
                                            {remark.creator && (
                                              <span className="ml-4 flex items-center">
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                <span className="font-medium">
                                                  {remark.creator.firstname} {remark.creator.lastname}
                                                </span>
                                                <span className="mx-2 text-gray-400">•</span>
                                                <span className="text-gray-600">{remark.creator.email}</span>
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="reassign"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.25 }}
                          >
                            {/* Reassign Remarks Tab Content */}
                            <div>
                              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                Reassign Remarks
                              </h4>
                              {loadingReassign ? (
                                <div className="flex items-center justify-center min-h-[200px]">
                                  <div className="text-gray-500">Loading...</div>
                                </div>
                              ) : errorReassign ? (
                                <div className="flex items-center justify-center min-h-[200px]">
                                  <div className="text-red-500">{errorReassign}</div>
                                </div>
                              ) : reassignRemarks.length === 0 ? (
                                <div className="flex items-center justify-center min-h-[200px]">
                                  <div className="text-gray-600 text-lg font-medium">
                                    Lead is not assigned
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {[...reassignRemarks].filter(r => r.changedTo).reverse().map((remark, idx) => (
                                    <motion.div
                                      key={idx}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: idx * 0.1 }}
                                      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                      <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                            <span className="text-indigo-600 font-medium">{idx + 1}</span>
                                          </div>
                                        </div>
                                        <div className="ml-4 flex-1">
                                          <p className="text-gray-900 text-left whitespace-pre-wrap break-words">
                                            {idx === reassignRemarks.length - 1 ? 'Lead Assigned' : remark.text}
                                          </p>
                                          {remark.changedTo && (
                                            <div className="mt-2 flex flex-col gap-2">
                                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                                {idx !== reassignRemarks.length - 1 && (
                                                  <>
                                                    <span className="px-2 py-1 bg-gray-100 rounded-full flex items-center gap-1">
                                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                      </svg>
                                                      <span className="font-medium">{remark.changedTo.fromName || remark.changedTo.from || '--'}</span>
                                                    </span>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                    </svg>
                                                  </>
                                                )}
                                                <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full flex items-center gap-1">
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                  </svg>
                                                  <span className="font-medium">{remark.changedTo.toName || remark.changedTo.to || '--'}</span>
                                                </span>
                                              </div>
                                              {remark.changedTo.toEmail && (
                                                <div className="text-sm text-gray-500 flex items-center gap-1 ml-2">
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                  </svg>
                                                  <span>{remark.changedTo.toEmail}</span>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                          <div className="mt-2 flex items-center text-xs text-gray-500">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>
                                              {(remark.timestamp || remark.createdAt) ? new Date(remark.timestamp || remark.createdAt).toLocaleString('en-US', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                                hour12: false
                                              }).replace(',', '') : ''}
                                            </span>
                                            {remark.reassignedByUser && (
                                              <>
                                                <span className="mx-2 text-gray-400">•</span>
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                <span className="font-medium">
                                                  {remark.reassignedByUser.firstname} {remark.reassignedByUser.lastname}
                                                </span>
                                                <span className="mx-2 text-gray-400">•</span>
                                                <span className="text-gray-600">{remark.reassignedByUser.email}</span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex justify-end">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LeadDetailsModal; 