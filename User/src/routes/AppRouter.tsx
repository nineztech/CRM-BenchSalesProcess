import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { UserLogin } from '../components/common/UserLogin/UserLogin.tsx';
import { ProtectedRoute } from '../Routes/ProtectedRoute/ProtectedRoute.tsx';
import UserProfile from '../components/common/profile/index.tsx';
import { Navbar } from '../components/common/Navbar/Navbar.tsx';
// import Sales from '../components/user/sales/sales.tsx';
import LeadCreationComponent from '../components/user/lead_creation/LeadCreation.tsx';
// import SaleCreationComponent from '../components/user/sales/sales.tsx';
import Sidebar from '../components/common/sidebar/Sidebar.tsx';
// import Packages from '../components/user/packages/Packages.tsx';
import ArchivedLeads from '../components/user/archived_leads/ArchivedLeads.tsx';
import AddDepartment from '../components/admin/department/department.tsx';
import UserRegister from '../components/admin/addUser/addUser.tsx';
import AdminRegister from '../components/admin/adminRegister/AdminRegister.tsx';
import PackagesPage from '../components/admin/packages/packages.tsx';
import AdminRoles from '../components/admin/adminRoles/adminRoles.tsx';
import DepartmentPermissions from '../components/admin/departmentPermissions/departmentPermissions.tsx';
import Dashboard from '../components/common/Dashboard/Dashboard.tsx';
import EmailTemplates from '../components/admin/email_templates/EmailTemplates.tsx';

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
              <Dashboard />
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

        {/* Regular user packages route */}
        {/* <Route path="/packages" element={
          <ProtectedRoute>
            <UserLayout>
              <Packages />
            </UserLayout>
          </ProtectedRoute>
        } /> */}

        <Route path="/leadcreation" element={
          <ProtectedRoute>
            <UserLayout>
              <LeadCreationComponent />
            </UserLayout>
          </ProtectedRoute>
        } />

        {/* <Route path="/sales" element={
          <ProtectedRoute>
            <UserLayout>
              <SaleCreationComponent/>
            </UserLayout>
          </ProtectedRoute>
        } /> */}
        <Route path="/archived-leads" element={
          <ProtectedRoute>
            <UserLayout>
              <ArchivedLeads/>
            </UserLayout>
          </ProtectedRoute>
        } />
        {/* Department route - accessible to any user with proper permissions */}
        <Route path="/departments" element={
          <ProtectedRoute>
            <UserLayout>
              <AddDepartment />
            </UserLayout>
          </ProtectedRoute>
        } />

        {/* Admin-only routes */}
        <Route path="/users" element={
          <ProtectedRoute>
            <UserLayout>
              <UserRegister />
            </UserLayout>
          </ProtectedRoute>
        } />

        <Route path="/admins" element={
          <ProtectedRoute>
            <UserLayout>
              <AdminRegister />
            </UserLayout>
          </ProtectedRoute>
        } />

        <Route path="/roles" element={
          <ProtectedRoute>
            <UserLayout>
              <AdminRoles />
            </UserLayout>
          </ProtectedRoute>
        } />

        <Route path="/department-permissions" element={
          <ProtectedRoute>
            <UserLayout>
              <DepartmentPermissions />
            </UserLayout>
          </ProtectedRoute>
        } />

        <Route path="/packages" element={
          <ProtectedRoute>
            <UserLayout>
              <PackagesPage />
            </UserLayout>
          </ProtectedRoute>
        } />

        <Route path="/email-templates" element={
          <ProtectedRoute>
            <UserLayout>
              <EmailTemplates />
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