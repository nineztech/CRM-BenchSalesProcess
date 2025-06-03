import React, { useState } from 'react';
import { FaTachometerAlt, FaUserPlus, FaUsers, FaBuilding } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './sidebar.css';
import logoIcon from '../../assets/logo.webp'; // Make sure to update the path to your logo

const Sidebar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`sidebar ${isExpanded ? 'expanded' : ''}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo Section */}
      <div className="sidebar-logo">
        <img src={logoIcon} alt="Logo" className="logo-icon" />
        {isExpanded && <span className="logo-text">NinezTech</span>}
      </div>

      {/* Menu List */}
      <ul>
        <li>
          <FaTachometerAlt />
          {isExpanded && (
            <Link to="/dashboard">
              <span>Dashboard</span>
            </Link>
          )}
        </li>
        <li>
          <FaUserPlus />
          {isExpanded && (
            <Link to="/adminregister">
              <span>Add Admin</span>
            </Link>
          )}
        </li>
        <li>
          <FaUserPlus />

          {isExpanded && (
            <Link to="/adminroles">
              <span> Roles & Rights</span>
            </Link>
          )}
        </li>
        <li>
          <FaUsers />
          {isExpanded && (
            <Link to="/adduser">
              <span>User Creation</span>
            </Link>
          )}
        </li>
        <li>
          <FaBuilding />
          {isExpanded && (
            <Link to="/adddepartment">
              <span>Department</span>
            </Link>
          )}
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
