import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import NavbarUser from "./components/Navbar/Navbar.tsx";
import "./App.css";
import LeadCreation from "./components/lead_creation/LeadCreation";
import Sidebar from "./components/sidebar/Sidebar.tsx";
import Sales from './components/sales/sales.tsx';
import { UserLogin } from "./components/UserLogin/UserLogin";
import { ProtectedRoute } from "./components/ProtectedRoute/ProtectedRoute";

// Separate component to use `useLocation` hook
function AppContent() {
  const location = useLocation();

  // Define routes where navbar and sidebar should be hidden
  const publicRoutes = ["/", "/login"];

  const isPublicRoute = publicRoutes.includes(location.pathname);

  return (
    <>
      {!isPublicRoute && <Sidebar />}
      <div className="app-container">
        {/* Conditionally render Navbar */}
        {!isPublicRoute && <NavbarUser />}

        {/* Main layout */}
        <div className="content-layout">
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<UserLogin />} />
              
              {/* Protected Routes */}
              <Route
                path="/leadcreation"
                element={
                  <ProtectedRoute>
                    <LeadCreation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sales"
                element={
                  <ProtectedRoute>
                    <Sales />
                  </ProtectedRoute>
                }
              />
              
              {/* Redirect to login for root path */}
              <Route
                path="/"
                element={<UserLogin />}
              />
            </Routes>
          </main>
        </div>
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
