import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaGift, FaUsers, FaBuilding, FaLock, FaArchive, FaChevronDown, FaHome } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import logoIcon from '../../../assets/Logo.webp';
import usePermissions from '../../../hooks/usePermissions';

interface MenuItem {
  icon: React.ReactNode;
  to: string;
  text: string;
  activity: string;
  permission: string;
  subItems?: MenuItem[];
}

const Sidebar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRolesOpen, setIsRolesOpen] = useState(false);
  const location = useLocation();
  const { checkPermission, loading } = usePermissions();

  // Check if current path is related to Access Control
  const isAccessControlPath = location.pathname === '/roles' || location.pathname === '/department-permissions';

  useEffect(() => {
    // Set roles menu open if we're on an access control path
    if (isAccessControlPath) {
      setIsRolesOpen(true);
    }
  }, [location.pathname]);

  // Function to handle mouse enter on sidebar
  const handleMouseEnter = () => {
    setIsExpanded(true);
  };

  // Function to handle mouse leave on sidebar
  const handleMouseLeave = () => {
    setIsExpanded(false);
    if (!isAccessControlPath) {
      setIsRolesOpen(false);
    }
  };

  // // Function to handle Access Control hover
  // const handleAccessControlHover = () => {
  //   setIsRolesOpen(true);
  // };

  // // Function to handle menu item click
  // const handleMenuClick = (path: string) => {
  //   // If clicking a non-access control menu item, close the roles menu
  //   if (path !== '/roles' && path !== '/department-permissions') {
  //     setIsRolesOpen(false);
  //   }
  // };

  // Define all menu items with their corresponding activities
  const menuItems: MenuItem[] = [
    {
      icon: <FaHome />,
      to: '/dashboard',
      text: 'Dashboard',
      activity: 'Dashboard Management',
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
      icon: <FaLock />,
      to: '#',
      text: 'Access Control',
      activity: 'Activity Management',
      permission: 'view',
      subItems: [
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
        }
      ]
    },
      {
      icon: <FaUsers />,
      to: '/users',
      text: 'User Creation',
      activity: 'User Management',
      permission: 'view'
    },
    {
      icon: <FaUserPlus />,
      to: '/leadcreation',
      text: 'Lead Creation',
      activity: 'Lead Management',
      permission: 'view'
    },
    {
      icon: <FaArchive />,
      to: '/archived-leads',
      text: 'Archived Leads',
      activity: 'Archived Lead Management',
      permission: 'view'
    },
    // {
    //   icon: <FaChartLine />,
    //   to: '/sales',
    //   text: 'Sales',
    //   activity: 'Lead Status Management',
    //   permission: 'view'
    // },
    {
      icon: <FaGift />,
      to: '/packages',
      text: 'Packages',
      activity: 'Package Management',
      permission: 'view'
    },
  ];

  if (loading) {
    return null;
  }

  const renderMenuItem = (item: MenuItem, index: number) => {
    if (!checkPermission(item.activity, item.permission as 'view' | 'add' | 'edit' | 'delete')) {
      return null;
    }

    if (item.subItems) {
      const isActive = item.subItems.some(subItem => location.pathname === subItem.to);
      
      return (
        <React.Fragment key={index}>
          <li>
            <div
              onClick={() => setIsRolesOpen(!isRolesOpen)}
              className={`flex items-center h-12 px-3 text-sm transition-colors relative cursor-pointer ${
                isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-0 h-full w-1 bg-blue-600"
                  transition={{ duration: 0.2 }}
                />
              )}
              <span className={`text-lg ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                {item.icon}
              </span>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="ml-3 flex-1 flex items-center justify-between"
                  >
                    <span className="font-medium">{item.text}</span>
                    <FaChevronDown
                      className={`transform transition-transform duration-200 ${isRolesOpen ? 'rotate-180' : ''}`}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </li>
          <AnimatePresence>
            {isRolesOpen && isExpanded && item.subItems.map((subItem, subIndex) => {
              if (!checkPermission(subItem.activity, subItem.permission as 'view' | 'add' | 'edit' | 'delete')) {
                return null;
              }
              
              const isSubItemActive = location.pathname === subItem.to;
              
              return (
                <motion.li
                  key={`${index}-${subIndex}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    to={subItem.to}
                    className={`flex items-center h-12 pl-12 pr-3 text-sm transition-colors relative ${
                      isSubItemActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {isSubItemActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-0 h-full w-1 bg-blue-600"
                        transition={{ duration: 0.2 }}
                      />
                    )}
                    <span className={`text-lg ${isSubItemActive ? 'text-blue-600' : 'text-gray-500'}`}>
                      {subItem.icon}
                    </span>
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="ml-3 whitespace-nowrap font-medium"
                    >
                      {subItem.text}
                    </motion.span>
                  </Link>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </React.Fragment>
      );
    }

    return (
      <SidebarItem
        key={index}
        icon={item.icon}
        to={item.to}
        text={item.text}
        isExpanded={isExpanded}
        isActive={location.pathname === item.to}
      />
    );
  };

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 h-full bg-white border-r border-gray-200 shadow-sm z-50"
        animate={{
          width: isExpanded ? 256 : 56,
          transition: { duration: 0.3, ease: "easeOut" }
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Logo Section */}
        <div className="flex items-center h-16 px-3">
          <img src={logoIcon} alt="Logo" className="h-8 w-8" />
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="ml-3 font-semibold text-xl"
              >
                OOPZ CRM PRO
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Menu List */}
        <ul className="mt-4">
          {menuItems.map((item, index) => renderMenuItem(item, index))}
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