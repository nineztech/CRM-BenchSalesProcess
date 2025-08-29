import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Router from './components/Router';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}

export default App;
