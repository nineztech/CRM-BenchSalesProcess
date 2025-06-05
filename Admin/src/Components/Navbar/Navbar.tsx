import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa"; // Import an admin icon

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle the image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string); // Set the uploaded image URL in the state
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full h-16 z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-lg" : "bg-white/90 backdrop-blur-md"
      }`}
    >
      <div className="flex items-center justify-between max-w-screen-xl mx-auto px-6">
        {/* Left: Logo Placeholder */}
        <div className="flex items-center space-x-3">
          {/* Add your logo here if needed */}
        </div>

        {/* Center: Project Name */}
        <div className="text-lg font-bold text-center">
          CRM - Customer Requirement Management
        </div>

        {/* Right: Admin Icon with Upload Image */}
        <div className="relative flex items-center cursor-pointer">
          <label htmlFor="profile-upload">
            <div className="w-10 h-10 flex justify-center items-center rounded-full bg-gray-200 hover:bg-gray-300 transition-all">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Admin"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <FaUserCircle className="text-gray-700 text-2xl" />
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
    </nav>
  );
};

export default Navbar;
