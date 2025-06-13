import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');

  if (!token) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If authenticated, render the protected content
  return <>{children}</>;
}; 