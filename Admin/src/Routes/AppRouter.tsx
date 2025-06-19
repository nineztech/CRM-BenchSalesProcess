import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AdminLogin } from '../Components/AdminLogin/AdminLogin';
import ProtectedRoute from '../Components/ProtectedRoute/ProtectedRoute';
import AddDepartment from '../Pages/Department/AddDepartment';
import UserRegister from '../Pages/User/AddUser';
import AdminRegister from '../Components/AdminRegister/AdminRegister';
import AdminRoles from '../Components/AdminRoles/AdminRoles';
import { Navbar } from '../Components/Navbar/Navbar';
import Dashboard from '../Components/AdminDashboard/Dashboard';
import PackagesPage from '../Pages/Packages';
import AdminProfile from '../Components/AdminProfile';
import Sidebar from '../Components/Sidebar/Sidebar';
// Import other admin components as needed

// Layout component that includes Navbar
const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="app-container">
      <Sidebar/>
      <Navbar />
      <div className="content-layout">
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={
          <AdminLayout>
            <AdminLogin />
          </AdminLayout>
        } />

        {/* Protected Admin Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <AdminLayout>
              <AdminProfile />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/departments" element={
          <ProtectedRoute>
            <AdminLayout>
              <AddDepartment />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/users" element={
          <ProtectedRoute>
            <AdminLayout>
              <UserRegister />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/admins" element={
          <ProtectedRoute>
            <AdminLayout>
              <AdminRegister />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/roles" element={
          <ProtectedRoute>
            <AdminLayout>
              <AdminRoles />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/packages" element={
          <ProtectedRoute>
            <AdminLayout>
              <PackagesPage />
            </AdminLayout>
          </ProtectedRoute>
        } />

        {/* Catch all route - redirect to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRouter; 