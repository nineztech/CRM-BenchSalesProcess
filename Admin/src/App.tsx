import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./Components/Navbar/Navbar";
import { Footer } from "./Components/Footer/Footer";
import { AdminLogin } from "./Components/AdminLogin/AdminLogin";
import  Dashboard  from "./Components/AdminDashboard/Dashboard"; 
import AddUser from './Pages/User/AddUser';
import AddDepartment from "./Pages/Department/AddDepartment";
function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<AdminLogin />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/add-user" element={<AddUser />} />
 <Route path="/add-department" element={<AddDepartment />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
