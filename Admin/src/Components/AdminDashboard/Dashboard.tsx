// Dashboard.tsx
import { useState } from "react";
import { FaUserEdit } from "react-icons/fa";
import { Link } from "react-router-dom";


import "./Dashboard.css";

export default function Dashboard() {
  const [adminName, setAdminName] = useState("Admin");
  const [adminPic, setAdminPic] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdminPic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNameChange = () => {
    const newName = prompt("Enter new admin name:", adminName);
    if (newName) setAdminName(newName);
  };

  return (
    <div className="dashboard-container">
     
      <div className="sidebar">
         <div className="logo-container">
  <img src="/Logo.webp" alt="Logo" className="logo" />
</div>
  
        <h2 className="menu-title">Menu</h2>
        <nav className="menu">
          <Link to="/add-user">User Creation</Link>
          <Link to="/add-department">Department Creation</Link>
        </nav>
      </div>

       
      <div className="main-content">
        
        <div className="topbar">
          <div className="admin-info">
            <label htmlFor="adminPic" className="admin-pic-label">
              {adminPic ? (
                <img src={adminPic} alt="Profile" className="admin-pic" />
              ) : (
                <div className="admin-placeholder">
                  <FaUserEdit />
                </div>
              )}
              <input
                id="adminPic"
                type="file"
                className="hidden-input"
                onChange={handleImageUpload}
                accept="image/*"
              />
            </label>
            <button onClick={handleNameChange} className="admin-name-btn">
              {adminName}
            </button>
          </div>
        </div>

        
        <div className="content">
          <h1>Welcome to Admin Dashboard</h1>
        </div>
      </div>
    </div>
  );
}
