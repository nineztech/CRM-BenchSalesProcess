import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { UserLogin } from "../components/common/UserLogin/UserLogin";
import { ProtectedRoute } from "./ProtectedRoute/ProtectedRoute";
import UserProfile from "../components/common/profile";
import { Navbar } from "../components/common/Navbar/Navbar";
// import Sales from '../components/user/sales/sales';
import LeadCreationComponent from "../components/user/lead_creation/LeadCreation";
// import SaleCreationComponent from '../components/user/sales/sales';
import Sidebar from "../components/common/sidebar/Sidebar";
// import Packages from '../components/user/packages/Packages';
import ArchivedLeads from "../components/user/archived_leads/ArchivedLeads";
import SalesEnrollment from "../components/user/enrollment/SalesEnrollment";
import AdminEnrollment from "../components/user/enrollment/AdminEnrollment";
import AddDepartment from "../components/admin/department/department";
import UserRegister from "../components/admin/addUser/addUser";
import AdminRegister from "../components/admin/adminRegister/AdminRegister";
import PackagesPage from "../components/admin/packages/packages";
import AdminRoles from "../components/admin/adminRoles/adminRoles";
import DepartmentPermissions from "../components/admin/departmentPermissions/departmentPermissions";
import Dashboard from "../components/common/Dashboard/Dashboard";
import EmailTemplates from "../components/admin/email_templates/EmailTemplates";
import { PermissionsProvider } from "../hooks/usePermissions";
// Add imports for new finance pages
import AccountSale from "../components/user/finance/AccountSale";
import AccountAdmin from "../components/user/finance/AccountAdmin";
import PaymentControl from "../components/user/finance/PaymentControl";
import Documentation from "../components/common/Documentation/Documentation";

// import AgreementPage from "../components/common/Documentation/AgreementPage";
// import SignaturePage from "../components/common/Documentation/SignaturePage";
// import OpenDocumentPage from "../components/common/Documentation/OpenDocumentPage";
// import SendMailPage from "../components/common/Documentation/SendMailPage";

// Layout component that includes Navbar
const UserLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <Navbar />
      <div className="content-layout">
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
};

// ...existing code...
const AppRouter: React.FC = () => {
  return (
    <Router>
      <PermissionsProvider>
        <Routes>
          {/* Public Route */}
          <Route
            path="/"
            element={
              <UserLayout>
                <UserLogin />
              </UserLayout>
            }
          />

          {/* Protected User Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserLayout>
                  <Dashboard />
                </UserLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserLayout>
                  <UserProfile />
                </UserLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leadcreation"
            element={
              <ProtectedRoute>
                <UserLayout>
                  <LeadCreationComponent />
                </UserLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/enrollment-sales"
            element={
              <ProtectedRoute>
                <UserLayout>
                  <SalesEnrollment />
                </UserLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/enrollment-admin"
            element={
              <ProtectedRoute>
                <UserLayout>
                  <AdminEnrollment />
                </UserLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/account-sale"
            element={
              <ProtectedRoute>
                <UserLayout>
                  <AccountSale />
                </UserLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/account-admin"
            element={
              <ProtectedRoute>
                <UserLayout>
                  <AccountAdmin />
                </UserLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/payment-control"
            element={
              <ProtectedRoute>
                <UserLayout>
                  <PaymentControl />
                </UserLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/archived-leads"
            element={
              <ProtectedRoute>
                <UserLayout>
                  <ArchivedLeads />
                </UserLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/departments"
            element={
              <ProtectedRoute>
                <UserLayout>
                  <AddDepartment />
                </UserLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <UserLayout>
                  <UserRegister />
                </UserLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admins"
            element={
              <ProtectedRoute>
                <UserLayout>
                  <AdminRegister />
                </UserLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles"
            element={
              <ProtectedRoute>
                <UserLayout>
                  <AdminRoles />
                </UserLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/department-permissions"
            element={
              <ProtectedRoute>
                <UserLayout>
                  <DepartmentPermissions />
                </UserLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/packages"
            element={
              <ProtectedRoute>
                <UserLayout>
                  <PackagesPage />
                </UserLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/email-templates"
            element={
              <ProtectedRoute>
                <UserLayout>
                  <EmailTemplates />
                </UserLayout>
              </ProtectedRoute>
            }
          />

          {/* Documentation routes */}
          <Route
            path="/documentation"
            element={
              <ProtectedRoute>
                <UserLayout>
                  <Documentation />
                </UserLayout>
              </ProtectedRoute>
            }
          />
          {/* <Route
            path="/agreement"
            element={
              <ProtectedRoute>
                <UserLayout>
                  <AgreementPage />
                </UserLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/documentation/agreement"
            element={
              <ProtectedRoute>
                <UserLayout>
                  <AgreementPage />
                </UserLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/documentation/signature" element={
            <ProtectedRoute>
              <UserLayout>
                <SignaturePage />
              </UserLayout>
            </ProtectedRoute>
          } />
          <Route
            path="/documentation/open"
            element={
              <ProtectedRoute>
                <UserLayout>
                  <OpenDocumentPage />
                </UserLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/documentation/sendmail"
            element={
              <ProtectedRoute>
                <UserLayout>
                  <SendMailPage />
                </UserLayout>
              </ProtectedRoute>
            }
          /> */}

          {/* Redirect any unknown routes to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </PermissionsProvider>
    </Router>
  );
};

export default AppRouter;
