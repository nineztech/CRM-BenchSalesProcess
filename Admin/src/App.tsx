// App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./Components/Navbar/Navbar";
// import { Footer } from "./Components/Footer/Footer";
import { AdminLogin } from "./Components/AdminLogin/AdminLogin";
import Dashboard from "./Components/AdminDashboard/Dashboard";
import AddUser from "./Pages/User/AddUser";
import AddDepartment from "./Pages/Department/AddDepartment";
import AdminRegister from "./Components/AdminRegister/AdminRegister";
import "./App.css"; // For layout styling

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        {/* Navbar at top */}
        <Navbar />

        {/* Content area: Sidebar + Main */}
        <div className="content-layout">
          {/* <Sidebar /> */}

          <main className="main-content">
            <Routes>
              <Route path="/" element={<AdminLogin />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/adduser" element={<AddUser />} />
              <Route path="/adddepartment" element={<AddDepartment />} />
              <Route path="/adminregister" element={<AdminRegister/>} />
            </Routes>
          </main>
        </div>

        {/* Footer at bottom */}
        {/* <Footer /> */}
      </div>
    </BrowserRouter>
  );
}

export default App;
