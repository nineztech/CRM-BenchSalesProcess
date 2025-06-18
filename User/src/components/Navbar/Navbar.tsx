import React, { useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { IoMdLogOut } from "react-icons/io";
import { FiEdit2 } from "react-icons/fi";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5006/api";

export const Navbar: React.FC = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <nav className="fixed top-0 left-16 right-0 h-16 bg-white border-b border-gray-200 z-40">
      <div className="h-full px-6 flex items-center">
        {/* Centered Content */}
        <div className="flex-1 flex justify-center">
          <h1 className="text-base font-semibold text-gray-800 tracking-wide font-inter">
            CRM - Customer Requirement Management
          </h1>
        </div>

        {/* Right: Profile Section */}
        <div className="flex items-center">
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="cursor-pointer focus:outline-none"
            >
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 hover:bg-gray-200 transition-colors">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <FaUserCircle className="text-gray-600 text-xl" />
                )}
              </div>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200">
                <button
                  onClick={handleEditProfile}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FiEdit2 className="mr-2" />
                  Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <IoMdLogOut className="mr-2" />
                  Logout
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