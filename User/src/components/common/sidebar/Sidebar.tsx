import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaChartLine, FaGift, FaUsers, FaBuilding, FaLock } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import logoIcon from '../../../assets/Logo.webp';
import usePermissions from '../../../hooks/usePermissions';

const Sidebar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const location = useLocation();
  const { checkPermission, loading } = usePermissions();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.role || '');
    }
  }, []);

  const isAdmin = userRole === 'admin';

  // Define menu items with their permissions
  const userMenuItems = [
    {
      icon: <FaUserPlus />,
      to: '/leadcreation',
      text: 'Lead Creation',
      activity: 'Lead Management',
      permission: 'view'
    },
    {
      icon: <FaChartLine />,
      to: '/sales',
      text: 'Sales',
      activity: 'Lead Status Management',
      permission: 'view'
    },
    {
      icon: <FaGift />,
      to: '/packages',
      text: 'Packages',
      activity: 'Package Management',
      permission: 'view'
    }
  ];

  const adminMenuItems = [
    {
      icon: <FaGift />,
      to: '/packages',
      text: 'Packages',
      activity: 'Package Management',
      permission: 'view'
    },
    {
      icon: <FaUserPlus />,
      to: '/admins',
      text: 'Add Admin',
      activity: 'Admin Management',
      permission: 'view'
    },
    {
      icon: <FaBuilding />,
      to: '/departments',
      text: 'Department',
      activity: 'Department Management',
      permission: 'view'
    },
    {
      icon: <FaUserPlus />,
      to: '/roles',
      text: 'Roles & Rights',
      activity: 'Activity Management',
      permission: 'view'
    },
    {
      icon: <FaLock />,
      to: '/department-permissions',
      text: 'Department Permissions',
      activity: 'Role Permission Management',
      permission: 'view'
    },
    {
      icon: <FaUsers />,
      to: '/users',
      text: 'User Creation',
      activity: 'User Management',
      permission: 'view'
    }
  ];

  if (loading) {
    return null; // Or a loading spinner
  }

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
          {!isAdmin && userMenuItems.map((item, index) => (
            checkPermission(item.activity, item.permission as 'view' | 'add' | 'edit' | 'delete') && (
              <SidebarItem
                key={index}
                icon={item.icon}
                to={item.to}
                text={item.text}
                isExpanded={isExpanded}
                isActive={location.pathname === item.to}
              />
            )
          ))}

          {/* Admin menu items */}
          {isAdmin && adminMenuItems.map((item, index) => (
            checkPermission(item.activity, item.permission as 'view' | 'add' | 'edit' | 'delete') && (
              <SidebarItem
                key={index}
                icon={item.icon}
                to={item.to}
                text={item.text}
                isExpanded={isExpanded}
                isActive={location.pathname === item.to}
              />
            )
          ))}
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