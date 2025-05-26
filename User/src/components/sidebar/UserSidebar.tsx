import React, { useState } from 'react';
import { FaUserPlus, } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import logoIcon from '../../assets/logo.webp'; // Make sure to update the path to your logo
import './usersidebar.css'

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
        {/* <li>
          <FaTachometerAlt />
          {isExpanded && (
            <Link to="/dashboard">
              <span>Dashboard</span>
            </Link>
          )}
        </li> */}
        <li>
          <FaUserPlus />
          {isExpanded && (
            <Link to="/leadcreation">
              <span>Lead Creation</span>
            </Link>
          )}
        </li>
       
       
      </ul>
    </div>
  );
};

export default Sidebar;
