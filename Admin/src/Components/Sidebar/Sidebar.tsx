import React, { useState } from 'react';
import { FaTachometerAlt, FaUserPlus, FaUsers, FaBuilding } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import logoIcon from '../../assets/logo.webp'; // Ensure the path is correct

const Sidebar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`fixed rounded-xl  top-0 left-0 h-full bg-gray-800 text-white z-50 transition-all duration-300 ${
        isExpanded ? 'w-48' : 'w-16'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo Section */}
      <div className="flex items-center p-4 space-x-3">
        <img src={logoIcon} alt="Logo" className="w-8 h-8 object-contain" />
        {isExpanded && <span className="text-lg font-bold">NinezTech</span>}
      </div>

      {/* Menu List */}
      <ul className="mt-2 space-y-2">
        <SidebarItem icon={<FaTachometerAlt />} to="/dashboard" text="Dashboard" isExpanded={isExpanded} />
        <SidebarItem icon={<FaUserPlus />} to="/adminregister" text="Add Admin" isExpanded={isExpanded} />
        <SidebarItem icon={<FaUserPlus />} to="/adminroles" text="Roles & Rights" isExpanded={isExpanded} />
        <SidebarItem icon={<FaUsers />} to="/adduser" text="User Creation" isExpanded={isExpanded} />
        <SidebarItem icon={<FaBuilding />} to="/adddepartment" text="Department" isExpanded={isExpanded} />
      </ul>
    </div>
  );
};

// Sidebar Item Component
type SidebarItemProps = {
  icon: React.ReactNode;
  to: string;
  text: string;
  isExpanded: boolean;
};

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, to, text, isExpanded }) => (
  <li className="flex items-center p-3 cursor-pointer hover:bg-gray-700 transition-colors">
    {icon}
    {isExpanded && (
      <Link to={to} className="ml-3 text-white whitespace-nowrap">
        {text}
      </Link>
    )}
  </li>
);

export default Sidebar;
