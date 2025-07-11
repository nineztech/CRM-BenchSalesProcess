import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Editor } from '@tinymce/tinymce-react';

interface EmailPopupProps {
  isOpen: boolean;
  onClose: () => void;
  lead: {
    firstName: string;
    lastName: string;
    primaryEmail: string;
    id?: number;
    from?: string;
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
  emailSubject,
  packages
}) => {
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [templateHtml, setTemplateHtml] = useState('');
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customContent, setCustomContent] = useState('');
  const [subject, setSubject] = useState(emailSubject || "Embark on a Success Journey with Ninez Tech");
  const [to, setTo] = useState(lead.primaryEmail);
  const [cc, setCC] = useState('');
  const [from, setFrom] = useState(() => {
    const userDataString = localStorage.getItem('user');
    const userData = userDataString ? JSON.parse(userDataString) : null;
    return userData ? `${userData.firstname} ${userData.lastname} <${userData.email}>` : '';
  });

  // Update "to" field when lead.primaryEmail changes
  useEffect(() => {
    setTo(lead.primaryEmail);
  }, [lead.primaryEmail]);

  // Fetch template preview when popup opens
  useEffect(() => {
    if (isOpen) {
      fetchTemplatePreview();
    }
  }, [isOpen, lead, packages]);

  const fetchTemplatePreview = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const userDataString = localStorage.getItem('user');
      const loggedInUser = userDataString ? JSON.parse(userDataString) : null;
      
      if (!token || !loggedInUser) {
        alert('Authentication required. Please login again.');
        return;
      }

      // Convert objects to query strings
      const queryParams = new URLSearchParams({
        userData: JSON.stringify({
          ...loggedInUser,
          firstName: lead.firstName,  // For the email recipient
          lastName: lead.lastName,    // For the email recipient
          email: to                   // For the email recipient
        }),
        packages: JSON.stringify(packages)
      });

      const response = await axios.get(
        `${BASE_URL}/email/template-preview?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setTemplateHtml(response.data.template);
      } else {
        alert('Failed to load template preview.');
      }
    } catch (error) {
      console.error('Error loading template preview:', error);
      alert('Failed to load template preview.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditorChange = (content: string) => {
    setCustomContent(content);
  };

  const handleSendEmail = async () => {
    try {
      setIsSending(true);
      const token = localStorage.getItem('token');
      const userDataString = localStorage.getItem('user');
      const loggedInUser = userDataString ? JSON.parse(userDataString) : null;
      
      if (!token || !loggedInUser) {
        alert('Authentication required. Please login again.');
        return;
      }

      const ccEmails = cc.split(',').map(email => email.trim()).filter(email => email);

      const userData = {
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: to
      };

      const emailOptions = {
        from: from,
        to: to,
        cc: ccEmails,
        subject: subject,
        customBody: isCustomizing ? customContent : undefined,
        userData: loggedInUser // Pass the logged-in user data for the email header
      };

      const response = await axios.post(
        `${BASE_URL}/email/send`,
        {
          userData,
          packages,
          emailOptions
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
                <h2 className="text-lg font-medium">Send Package Details Email</h2>
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
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      className="flex-1 outline-none bg-transparent"
                    />
                  </div>
                </div>

                {/* CC Field */}
                <div className="mb-4">
                  <div className="flex items-center border-b py-2">
                    <span className="text-gray-500 w-12">CC:</span>
                    <input
                      type="text"
                      value={cc}
                      onChange={(e) => setCC(e.target.value)}
                      placeholder="Separate multiple emails with commas"
                      className="flex-1 outline-none bg-transparent"
                    />
                  </div>
                </div>

                {/* Subject Field */}
                <div className="mb-4">
                  <div className="flex items-center border-b py-2">
                    <span className="text-gray-500 w-16">Subject:</span>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="flex-1 outline-none"
                      placeholder="Enter subject"
                    />
                  </div>
                </div>

                {/* Template Preview and Editor */}
                <div className="mb-4 border rounded-lg">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-96">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-end p-2">
                        <button
                          onClick={() => {
                            setIsCustomizing(!isCustomizing);
                            if (!isCustomizing) {
                              setCustomContent(templateHtml);
                            }
                          }}
                          className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          {isCustomizing ? 'View Original Template' : 'Customize Email'}
                        </button>
                      </div>
                      
                      {isCustomizing ? (
                        <Editor
                          apiKey="n1jupubcidq4bqvv01vznzpbcj43hg297pgftp78jszal918"
                          value={customContent || templateHtml}
                          init={{
                            height: 500,
                            menubar: false,
                            plugins: [
                              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                              'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                            ],
                            toolbar: 'undo redo | blocks | ' +
                              'bold italic forecolor | alignleft aligncenter ' +
                              'alignright alignjustify | bullist numlist outdent indent | ' +
                              'removeformat | help',
                            content_style: 'body { font-family:Arial,sans-serif; font-size:14px }',
                            auto_focus: undefined,
                            preserve_caret_position: true,
                            statusbar: false
                          }}
                          onEditorChange={handleEditorChange}
                        />
                      ) : (
                        <div 
                          className="p-4 max-h-96 overflow-y-auto"
                          dangerouslySetInnerHTML={{ __html: templateHtml }}
                        />
                      )}
                    </>
                  )}
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