import React, { useState, useEffect } from "react";
import { FaUserCircle } from "react-icons/fa";
import "./header.css";

const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-container">
        {/* Left: Logo placeholder */}
        <div className="navbar-left">
          {/* <img src="your-logo.png" alt="Logo" className="logo" /> */}
        </div>

        {/* Center: Title */}
        <div className="navbar-center">
          <h1>CRM - Customer Requirement Management</h1>
        </div>

        {/* Right: Profile icon or uploaded image */}
        <div className="navbar-right">
          <label htmlFor="profile-upload">
            <div className="admin-icon-container">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="admin-profile-image"
                />
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

export default Header;
    