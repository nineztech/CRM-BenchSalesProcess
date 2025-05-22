import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa"; // Import an admin icon
import "./navbar.css";

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
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-container">
        {/* Left: Logo */}
        <div className="navbar-left">
          
        </div>

        {/* Center: Project Name */}
        <div className="navbar-center">
          <h1>CRM - Customer Requirement Management</h1>
        </div>

        {/* Right: Admin Icon with Upload Image */}
        <div className="navbar-right">
          {/* If the profile image exists, show it; otherwise, show the default icon */}
          <label htmlFor="profile-upload">
            <div className="admin-icon-container">
              {profileImage ? (
                <img src={profileImage} alt="Admin" className="admin-profile-image" />
              ) : (
                <FaUserCircle className="admin-icon" />
              )}
            </div>
          </label>
          <input
            type="file"
            id="profile-upload"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageUpload}
          />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
