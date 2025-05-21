import React, { useState } from 'react';
import { FaTachometerAlt, FaUserPlus, FaUsers, FaBuilding } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './sidebar.css';

const Sidebar: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div 
            className={`sidebar ${isExpanded ? 'expanded' : ''}`}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            <ul>
                <li>
                  <FaTachometerAlt />
                    {isExpanded && 
                  <Link to="/dashboard">
                    <span>Dashboard</span>
                  </Link>}
                    
                </li>
                <li>
                    <FaUserPlus />
                    {isExpanded && 
                  <Link to="/adminregister">
                    <span>Add Admin</span>
                  </Link>}
                </li>
                <li>
                    <FaUsers />
                    {isExpanded && 
                  <Link to="/adduser">
                    <span>User Creation</span>
                  </Link>}
                </li>
                <li>
                    <FaBuilding />
                    {isExpanded && 
                  <Link to="/adddepartment">
                    <span>Department</span>
                  </Link>}
                </li>
            </ul>
        </div>
    );
};

export default Sidebar;
