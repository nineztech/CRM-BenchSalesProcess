import React, { useState, useRef, useEffect } from "react";
import { IoLogOutOutline } from "react-icons/io5";
import { FiEdit3 } from "react-icons/fi";
import Avatar from 'react-avatar';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5006/api";

export const Navbar: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  // Get user data from localStorage
  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const userName = userData ? `${userData.firstname} ${userData.lastname}` : 'User';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        buttonRef.current && 
        !dropdownRef.current.contains(event.target as Node) && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('No active session found');
        navigate('/');
        return;
      }

      await axios.post(`${API_BASE_URL}/user/logout`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Show success message
      toast.success('Logged out successfully');
      
      // Redirect to login page
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const handleEditProfile = () => {
    setShowDropdown(false);
    navigate('/profile');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40">
      <div className="h-full pl-[64px] pr-6 flex items-center">
        {/* Centered Content */}
        <div className="flex-1 flex justify-center">
          <h1 className="text-xl font-semibold text-gray-800 tracking-wide font-inter">
            OPPZ CRM Pro
          </h1>
        </div>

        {/* Right: Profile Section */}
        <div className="flex items-center">
          <div className="relative">
            <button 
              ref={buttonRef}
              onClick={() => setShowDropdown(!showDropdown)}
              className="cursor-pointer focus:outline-none flex items-center gap-3 px-2 py-1 rounded-full hover:bg-gray-50 transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-full ring-2 ring-gray-100">
                <Avatar
                  name={userName}
                  size="32"
                  round={true}
                  color="#6366F1"
                  textSizeRatio={2.5}
                />
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div 
                ref={dropdownRef}
                className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg py-2 border border-gray-100 transform transition-all duration-200 ease-out"
              >
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12">
                      <Avatar
                        name={userName}
                        size="48"
                        round={true}
                        color="#6366F1"
                        textSizeRatio={2.5}
                      />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-gray-900">{userName}</p>
                      <p className="text-sm text-gray-500">{userData?.email || 'No email'}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleEditProfile}
                  className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                >
                  <FiEdit3 className="mr-3 text-gray-500 text-lg" />
                  <span>Edit Profile</span>
                </button>
                <div className="h-[1px] bg-gray-100 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                >
                  <IoLogOutOutline className="mr-3 text-red-500 text-lg" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;