import React, { useState } from "react";
import { FaUserCircle } from "react-icons/fa";

export const Navbar: React.FC = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);

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
            <label htmlFor="profile-upload" className="cursor-pointer">
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
            </label>
            <input
              type="file"
              id="profile-upload"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;