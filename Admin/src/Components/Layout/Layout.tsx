import React from 'react';
import Navbar from '../Navbar/Navbar';
import Sidebar from '../Sidebar/Sidebar';
import { Toaster } from 'react-hot-toast';
import { CheckCircle, XCircle } from 'react-feather';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#333',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          success: {
            icon: <CheckCircle color="#22c55e" size={20} />,
            style: {
              border: '1px solid #22c55e20',
              position: 'relative',
            },
            className: 'toast-message',
          },
          error: {
            icon: <XCircle color="#ef4444" size={20} />,
            style: {
              border: '1px solid #ef444420',
              position: 'relative',
            },
            className: 'toast-message',
          },
          loading: {
            style: {
              border: '1px solid #86efac20',
              position: 'relative',
            },
            className: 'toast-message',
          },
        }}
      />
      <style>
        {`
          .toast-message {
            position: relative;
            overflow: hidden;
          }
          .toast-message::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: #86efac; /* Light green for loading */
            animation: timer 3s linear forwards;
          }
          .toast-message[data-type="success"]::after {
            background: #22c55e; /* Keep the original success green */
          }
          .toast-message[data-type="error"]::after {
            background: #fca5a5; /* Light red for error */
          }
          @keyframes timer {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }
        `}
      </style>
      <Navbar />
      <Sidebar />
      <main className="pl-[100px] pt-20 pr-6">
        {children}
      </main>
    </div>
  );
};

export default Layout; 