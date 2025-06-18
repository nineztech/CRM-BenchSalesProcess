import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { UserLogin } from '../components/UserLogin/UserLogin';
import { ProtectedRoute } from '../components/ProtectedRoute/ProtectedRoute';
import UserProfile from '../components/profile';
import { Navbar } from '../components/Navbar/Navbar';
import Sales from '../components/sales/sales';
import LeadCreationComponent from '../components/lead_creation/LeadCreation';
import SaleCreationComponent from '../components/sales/sales.tsx';
import Sidebar from '../components/sidebar/Sidebar';

// Layout component that includes Navbar
const UserLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
          <UserLayout>
            <UserLogin />
          </UserLayout>
        } />

        {/* Protected User Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <UserLayout>
              <Sales />
            </UserLayout>
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <UserLayout>
              <UserProfile />
            </UserLayout>
          </ProtectedRoute>
        } />

        {/* Add other protected routes here */}
<Route path="/leadcreation" element={
          <ProtectedRoute>
            <UserLayout>
              <LeadCreationComponent />
            </UserLayout>
          </ProtectedRoute>
        } />
        <Route path="/sales" element={
          <ProtectedRoute>
            <UserLayout>
            <SaleCreationComponent/>
            </UserLayout>
          </ProtectedRoute>
        } />
        {/* Catch all route - redirect to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRouter; 