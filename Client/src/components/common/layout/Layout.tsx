import React from 'react';
import Header from '../header/Header';
import Sidebar from '../sidebar/Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6 mt-16 ml-16">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
