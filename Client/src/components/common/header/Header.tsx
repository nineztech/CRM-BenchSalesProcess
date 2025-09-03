import React, { useState, useEffect } from "react";
import { UserCircle, LogOut } from "lucide-react";
import { useAuth } from '../../../contexts/AuthContext';
import { getCurrentUser } from '../../../services/authService';

const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('Client Name');
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.username) {
      // Split username by underscore to get firstname and lastname
      const nameParts = currentUser.username.split('_');
      if (nameParts.length >= 2) {
        const firstName = nameParts[0];
        const lastName = nameParts[1];
        setDisplayName(`${firstName} ${lastName}`);
      } else {
        setDisplayName(currentUser.username);
      }
    }
  }, [user]);

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
    <nav className={`fixed top-0 left-16 right-0 z-40 transition-all duration-300 ${
      scrolled 
        ? "bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200" 
        : "bg-white/80 backdrop-blur-sm"
    }`}>
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left: Logo placeholder */}
        <div className="flex items-center">
          {/* <img src="your-logo.png" alt="Logo" className="h-8 w-auto" /> */}
        </div>

        {/* Center: Title */}
        <div className="flex-1 flex justify-center">
          <h1 className="text-xl font-semibold text-gray-800">
           {displayName}
          </h1>
        </div>

        {/* Right: Profile icon or uploaded image */}
        <div className="flex items-center">
          <label htmlFor="profile-upload" className="cursor-pointer">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <UserCircle className="w-6 h-6 text-gray-600" />
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
           <button
                          onClick={logout}
                          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Logout</span>
                        </button>
        </div>
        
      </div>
    </nav>
  );
};

export default Header;
