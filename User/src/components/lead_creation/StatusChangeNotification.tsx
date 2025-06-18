import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface StatusChangeNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  leadName: string;
  newStatus: string;
  statusGroup: string;
}

const StatusChangeNotification: React.FC<StatusChangeNotificationProps> = ({
  isOpen,
  onClose,
  leadName,
  newStatus,
  statusGroup
}) => {
  // Add auto-close effect
  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Close after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  React.useEffect(() => {
    if (isOpen && (statusGroup === 'converted' || statusGroup === 'open')) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        if (statusGroup === 'converted') {
          // Celebratory confetti with gold and blue colors
          confetti({
            particleCount,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#4169E1', '#00FF00'],
            shapes: ['star', 'circle'],
            gravity: 0.8,
            ticks: 200,
            scalar: 1.2,
            drift: 0
          });
        } else if (statusGroup === 'open') {
          // Fresh, green confetti for new opportunities
          confetti({
            particleCount: particleCount / 2,
            spread: 60,
            origin: { y: 0.4 },
            colors: ['#32CD32', '#98FB98', '#90EE90'],
            shapes: ['circle', 'square'],
            gravity: 1.2,
            ticks: 120,
            scalar: 0.7,
            drift: 0.3
          });
        }
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen, statusGroup]);

  const getStatusIcon = () => {
    switch (statusGroup) {
      case 'open':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"
          >
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </motion.div>
        );
      case 'converted':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center"
          >
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        );
      case 'archived':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center"
          >
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </motion.div>
        );
      case 'inProcess':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center"
          >
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </motion.div>
        );
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (statusGroup) {
      case 'open':
        return 'bg-green-50 border-green-200';
      case 'converted':
        return 'bg-blue-50 border-blue-200';
      case 'archived':
        return 'bg-red-50 border-red-200';
      case 'inProcess':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusMessage = () => {
    switch (statusGroup) {
      case 'converted':
        return '🎉 Congratulations! Lead has been successfully converted!';
      case 'archived':
        return '📦 Lead has been archived';
      case 'inProcess':
        return '⏳ Lead is now in process';
      case 'open':
        return '✨ New opportunity opened!';
      default:
        return 'Status Updated!';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className={`relative max-w-md w-full p-8 rounded-2xl shadow-xl ${getStatusColor()} border-2 overflow-hidden`}
          >
            {/* Progress strip */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 3, ease: "linear" }}
              className={`absolute bottom-0 left-0 h-1 ${
                statusGroup === 'open' ? 'bg-green-500' :
                statusGroup === 'converted' ? 'bg-blue-500' :
                statusGroup === 'archived' ? 'bg-red-500' :
                'bg-yellow-500'
              }`}
            />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center">
              {getStatusIcon()}
              
              <motion.h3
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-4 text-2xl font-bold text-gray-900"
              >
                {getStatusMessage()}
              </motion.h3>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-2 text-gray-600"
              >
                <span className="font-semibold">{leadName}</span> has been moved to
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-4 inline-block px-4 py-2 rounded-full text-lg font-semibold capitalize"
                style={{
                  backgroundColor: statusGroup === 'open' ? '#dcfce7' :
                    statusGroup === 'converted' ? '#dbeafe' :
                    statusGroup === 'archived' ? '#fee2e2' :
                    '#fef3c7',
                  color: statusGroup === 'open' ? '#166534' :
                    statusGroup === 'converted' ? '#1e40af' :
                    statusGroup === 'archived' ? '#991b1b' :
                    '#92400e'
                }}
              >
                {statusGroup} Status
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6"
              >
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Got it!
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StatusChangeNotification; 