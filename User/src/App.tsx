import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import NavbarUser from "./components/Navbar/Navbar.tsx";
import "./App.css"; // For layout styling
import LeadCreation from "./components/lead_creation/LeadCreation";
import Sidebar from "./components/sidebar/Sidebar.tsx";
import Sales from './components/sales/sales.tsx'
// Separate component to use `useLocation` hook
function AppContent() {
  const location = useLocation();

  // Define routes where navbar should be hidden
  const hideNavbarRoutes = ["/"];

  const showNavbar = !hideNavbarRoutes.includes(location.pathname);

  return (
    <>
    <Sidebar/>
    <div className="app-container">
      {/* Conditionally render Navbar */}
      {showNavbar && <NavbarUser />}

      {/* Main layout */}
      <div className="content-layout">
        <main className="main-content">
          <Routes>
            <Route path="/leadcreation" element={<LeadCreation />} />
                        <Route path="/sales" element={<Sales />} />

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
