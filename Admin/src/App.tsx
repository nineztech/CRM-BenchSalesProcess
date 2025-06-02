import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Navbar } from "./Components/Navbar/Navbar";
import { AdminLogin } from "./Components/AdminLogin/AdminLogin";
import Dashboard from "./Components/AdminDashboard/Dashboard";
import AddUser from "./Pages/User/AddUser";
import AddDepartment from "./Pages/Department/AddDepartment";
import AdminRegister from "./Components/AdminRegister/AdminRegister";
import "./App.css"; // For layout styling

// Separate component to use `useLocation` hook
function AppContent() {
  const location = useLocation();

  // Define routes where navbar should be hidden
  const hideNavbarRoutes = ["/"];

  const showNavbar = !hideNavbarRoutes.includes(location.pathname);

  return (
    <div className="app-container">
      {/* Conditionally render Navbar */}
      {showNavbar && <Navbar />}

      {/* Main layout */}
      <div className="content-layout">
        <main className="main-content">
          <Routes>
            <Route path="/" element={<AdminLogin />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/adduser" element={<AddUser />} />
            <Route path="/adddepartment" element={<AddDepartment />} />
            <Route path="/adminregister" element={<AdminRegister />} />
          </Routes>
        </main>
      </div>
    </div>
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