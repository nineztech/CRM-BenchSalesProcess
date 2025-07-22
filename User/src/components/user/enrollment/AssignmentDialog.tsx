import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  subrole: string;
  departmentId: number;
  department?: {
    departmentName: string;
  };
}

interface AssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (remarkText: string) => void;
  title?: string;
  selectedTeamLead?: User | null;
}

const AssignmentDialog: React.FC<AssignmentDialogProps> = ({
  isOpen,
  onClose,
  onAssign,
  title = "Add Assignment Note",
  selectedTeamLead
}) => {
  const [remarkText, setRemarkText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarkText.trim()) {
      alert('Please enter a remark');
      return;
    }
    setLoading(true);
    onAssign(remarkText);
    setRemarkText('');
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            {selectedTeamLead && (
              <p className="text-sm text-gray-600 mt-1">
                Assigning to: {selectedTeamLead.firstname} {selectedTeamLead.lastname}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Note
            </label>
            <textarea
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              rows={3}
              placeholder="Enter assignment note"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignmentDialog; 