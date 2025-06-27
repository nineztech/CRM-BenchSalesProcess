import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReassignRemarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (remark: string) => void;
  loading?: boolean;
}

const ReassignRemarkModal: React.FC<ReassignRemarkModalProps> = ({ isOpen, onClose, onSubmit, loading }) => {
  const [remark, setRemark] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remark.trim()) {
      setError('Remark is required');
      return;
    }
    setError('');
    onSubmit(remark.trim());
    setRemark('');
  };

  const handleClose = () => {
    setRemark('');
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 relative">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Reassign Remark</h3>
              <form onSubmit={handleSubmit}>
                <textarea
                  className="w-full min-h-[100px] p-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300 resize-y"
                  placeholder="Enter your remark for reassigning this lead..."
                  value={remark}
                  onChange={e => setRemark(e.target.value)}
                  disabled={loading}
                />
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Remark'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReassignRemarkModal; 