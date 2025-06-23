import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaChartLine, FaGift, FaUsers, FaBuilding } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import logoIcon from '../../../assets/Logo.webp';

const Sidebar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const location = useLocation();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.role || '');
    }
  }, []);

  const isAdmin = userRole === 'admin';

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 h-full bg-white border-r border-gray-200 shadow-sm z-50"
        animate={{
          width: isExpanded ? 256 : 56,
          transition: { duration: 0.3, ease: "easeOut" }
        }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >

        {/* Logo Section */}
        <div className="flex items-center h-16 px-3 border-b border-gray-200">
          <img src={logoIcon} alt="Logo" className="w-7 h-7 object-contain" />
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="ml-3 text-base font-semibold text-gray-700"
              >
                NinezTech
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Menu List */}
        <ul className="mt-4">
          {/* User menu items */}
          {!isAdmin && (
            <>
              <SidebarItem 
                icon={<FaUserPlus />} 
                to="/leadcreation" 
                text="Lead Creation" 
                isExpanded={isExpanded}
                isActive={location.pathname === '/leadcreation'}
              />
              
              <SidebarItem 
                icon={<FaChartLine />} 
                to="/sales" 
                text="Sales" 
                isExpanded={isExpanded}
                isActive={location.pathname === '/sales'}
              />

              <SidebarItem 
                icon={<FaGift />} 
                to="/packages" 
                text="Packages" 
                isExpanded={isExpanded}
                isActive={location.pathname === '/packages'}
              />
            </>
          )}

          {/* Admin-only menu items */}
          {isAdmin && (
            <>
              <SidebarItem 
                icon={<FaGift />} 
                to="/adminpackages" 
                text="Packages" 
                isExpanded={isExpanded}
                isActive={location.pathname === '/adminpackages'}
              />

              <SidebarItem 
                icon={<FaUserPlus />} 
                to="/admins" 
                text="Add Admin" 
                isExpanded={isExpanded}
                isActive={location.pathname === '/admins'}
              />

              <SidebarItem 
                icon={<FaBuilding />} 
                to="/departments" 
                text="Department" 
                isExpanded={isExpanded}
                isActive={location.pathname === '/departments'}
              />

              <SidebarItem 
                icon={<FaUserPlus />} 
                to="/roles" 
                text="Roles & Rights" 
                isExpanded={isExpanded}
                isActive={location.pathname === '/roles'}
              />

              <SidebarItem 
                icon={<FaUsers />} 
                to="/users" 
                text="User Creation" 
                isExpanded={isExpanded}
                isActive={location.pathname === '/users'}
              />
            </>
          )}
        </ul>
      </motion.div>

      {/* Overlay when sidebar is expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-gray-900/25 z-40"
          />
        )}
      </AnimatePresence>
    </>
  );
};

// Sidebar Item Component
type SidebarItemProps = {
  icon: React.ReactNode;
  to: string;
  text: string;
  isExpanded: boolean;
  isActive: boolean;
};

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, to, text, isExpanded, isActive }) => (
  <li>
    <Link
      to={to}
      className={`flex items-center h-12 px-3 text-sm transition-colors relative ${
        isActive
          ? 'bg-blue-50 text-blue-600'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute left-0 top-0 h-full w-1 bg-blue-600"
          transition={{ duration: 0.2 }}
        />
      )}
      <span className={`text-lg ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>{icon}</span>
      <AnimatePresence>
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="ml-3 whitespace-nowrap font-medium"
          >
            {text}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  </li>
);

export default Sidebar;