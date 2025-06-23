import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StatusRemarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (remark: string) => void;
  currentStatus: string;
  newStatus: string;
}

const StatusRemarkModal: React.FC<StatusRemarkModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentStatus,
  newStatus
}) => {
  const [remark, setRemark] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (remark.trim()) {
      // Get user info from localStorage
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const creatorInfo = {
        id: userInfo.id,
        name: `${userInfo.firstname} ${userInfo.lastname}`,
        email: userInfo.email
      };
      
      // Create remark with creator info
      const remarkWithCreator = {
        text: remark.trim(),
        createdAt: new Date().toISOString(),
        createdBy: creatorInfo.id,
        creator: creatorInfo,
        statusChange: {
          from: currentStatus,
          to: newStatus
        }
      };

      onSubmit(JSON.stringify(remarkWithCreator));
      setRemark('');
    }
  };

  if (!isOpen) return null;

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
                className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all"
              >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Add Status Change Remark
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

                {/* Content */}
                <div className="px-6 py-4">
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Status Change:</p>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">
                        {currentStatus}
                      </span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                        {newStatus}
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label htmlFor="remark" className="block text-sm font-medium text-gray-700 mb-2">
                        Remark *
                      </label>
                      <textarea
                        id="remark"
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        rows={4}
                        placeholder="Enter your remark about this status change..."
                      />
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!remark.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Submit
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default StatusRemarkModal; 