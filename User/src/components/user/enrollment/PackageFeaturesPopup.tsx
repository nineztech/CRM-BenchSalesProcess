import React from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaCheckCircle } from 'react-icons/fa';

interface PackageFeaturesPopupProps {
  isOpen: boolean;
  onClose: () => void;
  packageName: string;
  features: string[];
}

const PackageFeaturesPopup: React.FC<PackageFeaturesPopupProps> = ({
  isOpen,
  onClose,
  packageName,
  features = []
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(4px)' }}
    >
      {/* Enhanced backdrop with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-purple-900/20 to-blue-900/30" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          duration: 0.4 
        }}
        className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 w-full max-w-md"
        style={{ 
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)'
        }}
      >
        {/* Decorative gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />
        
        <div className="flex items-center justify-between mb-8">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent"
          >
            {packageName} Features
          </motion.h2>
          <motion.button
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 transition-all duration-200 p-2 rounded-full hover:bg-red-50"
          >
            <FaTimes size={18} />
          </motion.button>
        </div>

        <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                delay: 0.4 + (index * 0.1),
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
              whileHover={{ scale: 1.02, x: 8 }}
              className="flex items-start gap-4 p-3 rounded-xl bg-gradient-to-r from-white/40 to-white/20 backdrop-blur-xs border border-white/30 hover:border-blue-200/50 transition-all duration-300 group"
            >
              <motion.div
                whileHover={{ scale: 1.2, rotate: 360 }}
                transition={{ duration: 0.3 }}
              >
                <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0 drop-shadow-sm group-hover:text-green-600 transition-colors duration-200" size={16} />
              </motion.div>
              <span className="text-gray-700 leading-relaxed font-medium group-hover:text-gray-800 transition-colors duration-200">
                {feature}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Floating orbs decoration */}
        <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20 blur-sm" />
        <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-gradient-to-br from-pink-400 to-orange-500 rounded-full opacity-15 blur-md" />
      </motion.div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #3b82f6, #8b5cf6);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #2563eb, #7c3aed);
        }
      `}</style>
    </motion.div>
  );
};

export default PackageFeaturesPopup;