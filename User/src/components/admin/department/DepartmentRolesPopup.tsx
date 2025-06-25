import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface DepartmentRolesPopupProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: number;
  departmentName: string;
}

const DepartmentRolesPopup: React.FC<DepartmentRolesPopupProps> = ({
  isOpen,
  onClose,
  departmentId,
  departmentName
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNavigateToRoles = () => {
    navigate('/roles', { state: { selectedDepartment: departmentId } });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
      >
        <h3 className="text-lg font-medium text-gray-900 mb-3">Department Created Successfully</h3>
        <p className="text-sm text-gray-500 mb-6">
          Would you like to set up roles and rights for department "{departmentName}"?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Skip for Now
          </button>
          <button
            onClick={handleNavigateToRoles}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Set Up Roles
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DepartmentRolesPopup; 