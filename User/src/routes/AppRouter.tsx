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
        {/* Admin Protected Routes */}
        <Route path="/departments" element={
          <ProtectedRoute requireAdmin={true}>
            <UserLayout>
              <AddDepartment />
            </UserLayout>
          </ProtectedRoute>
        } />

        <Route path="/users" element={
          <ProtectedRoute requireAdmin={true}>
            <UserLayout>
              <UserRegister />
            </UserLayout>
          </ProtectedRoute>
        } />

        <Route path="/admins" element={
          <ProtectedRoute requireAdmin={true}>
            <UserLayout>
              <AdminRegister />
            </UserLayout>
          </ProtectedRoute>
        } />

        <Route path="/roles" element={
          <ProtectedRoute requireAdmin={true}>
            <UserLayout>
              <AdminRoles />
            </UserLayout>
          </ProtectedRoute>
        } />

        <Route path="/department-permissions" element={
          <ProtectedRoute requireAdmin={true}>
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

        {/* Catch all route - redirect to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRouter; 