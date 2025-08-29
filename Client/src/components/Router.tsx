import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from './common';
import LoginPage from '../pages/LoginPage';
import Dashboard from '../pages/Dashboard';
import ProtectedRoute from './auth/ProtectedRoute';

const Router: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  // Handle URL routing manually
  useEffect(() => {
    const path = window.location.pathname;
    
    if (isAuthenticated && (path === '/' || path === '/login')) {
      // If authenticated and on root or login page, redirect to dashboard
      window.history.replaceState(null, '', '/dashboard');
    } else if (!isAuthenticated && path === '/dashboard') {
      // If not authenticated and on dashboard, redirect to root
      window.history.replaceState(null, '', '/');
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <ProtectedRoute>
        <Layout>
          <Dashboard />
        </Layout>
      </ProtectedRoute>
    );
  }

  return <LoginPage />;
};

export default Router;
