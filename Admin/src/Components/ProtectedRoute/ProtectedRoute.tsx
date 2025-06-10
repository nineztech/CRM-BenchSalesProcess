import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Current token:', token); // Debug log
        
        if (!token) {
          console.log('No token found, redirecting to login...'); // Debug log
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // You can add additional token validation here if needed
        // For example, check if token is expired or valid JWT format

        console.log('Token found, user is authenticated'); // Debug log
        setIsAuthenticated(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    // You can replace this with a proper loading component
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting from:', location.pathname); // Debug log
    // Redirect to login page with the return url
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  console.log('Rendering protected content for:', location.pathname); // Debug log
  return <>{children}</>;
};

export default ProtectedRoute; 