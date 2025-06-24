import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

interface EmailPopupProps {
  isOpen: boolean;
  onClose: () => void;
  lead: {
    firstName: string;
    lastName: string;
    primaryEmail: string;
    id?: number;
  };
  emailBody: string;
  emailSubject: string;
  packages: any[];
}

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5006/api";

const EmailPopup: React.FC<EmailPopupProps> = ({
  isOpen,
  onClose,
  lead,
  emailBody,
  emailSubject,
  packages
}) => {
  const [isSending, setIsSending] = useState(false);
  const [subject, setSubject] = useState(emailSubject);
  const [body, setBody] = useState(emailBody);
  const [from, setFrom] = useState(`${localStorage.getItem('firstname')} ${localStorage.getItem('lastname')} <${localStorage.getItem('email')}>`);

  const handleSendEmail = async () => {
    try {
      setIsSending(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }

      const response = await axios.post(
        `${BASE_URL}/email/send`,
        {
          to: lead.primaryEmail,
          from: from,
          subject: subject,
          body: body,
          leadId: lead.id,
          packages: packages,
          userData: {
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.primaryEmail
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        alert('Email sent successfully!');
        onClose();
      } else {
        alert('Failed to send email. Please try again.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black"
              onClick={onClose}
            />

            {/* Email Popup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="text-lg font-medium">New Message</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Email Form */}
              <div className="p-6">
                {/* From Field */}
                <div className="mb-4">
                  <div className="flex items-center border-b py-2">
                    <span className="text-gray-500 w-12">From:</span>
                    <input
                      type="text"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      className="flex-1 outline-none bg-transparent"
                    />
                  </div>
                </div>

                {/* To Field */}
                <div className="mb-4">
                  <div className="flex items-center border-b py-2">
                    <span className="text-gray-500 w-12">To:</span>
                    <input
                      type="text"
                      value={lead.primaryEmail}
                      readOnly
                      className="flex-1 outline-none bg-transparent"
                    />
                  </div>
                </div>

                {/* Subject Field */}
                <div className="mb-4">
                  <div className="flex items-center border-b py-2">
                    <span className="text-gray-500 w-12">Subject:</span>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="flex-1 outline-none"
                      placeholder="Enter subject"
                    />
                  </div>
                </div>

                {/* Email Body */}
                <div className="mb-4">
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full h-96 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Write your message..."
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={handleSendEmail}
                    disabled={isSending}
                    className={`px-6 py-2.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      isSending ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSending ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      'Send'
                    )}
                  </button>

                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Discard
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EmailPopup; 