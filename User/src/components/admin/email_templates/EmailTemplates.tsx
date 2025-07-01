import React, { useState } from 'react';
import { FaEnvelope, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { MdPreview } from 'react-icons/md';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  template: string;
  type: 'welcome' | 'lead_assignment' | 'otp' | 'package_details';
  lastModified: Date;
}

const EmailTemplates: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Initial templates based on emailService.js functions
  const [templates] = useState<EmailTemplate[]>([
    {
      id: 'welcome',
      name: 'Welcome Email',
      subject: 'Welcome to CRM Bench Sales Process',
      template: `Dear \${userData.firstname},

Your account has been created successfully. Here are your login credentials:

Username: \${userData.username}
Password: \${userData.password}

Please login and change your password for security reasons.

Best regards,
CRM Bench Sales Process Team`,
      type: 'welcome',
      lastModified: new Date()
    },
    {
      id: 'lead_assignment',
      name: 'Lead Assignment',
      subject: 'New Lead Assignment: ${leadName}',
      template: `Dear \${assignedUser.firstname},

A new lead has been assigned to you. Here are the details:

Lead Name: \${leadName}
Contact: \${contactNumber}
Email: \${emailAddress}
Technology: \${leadData.technology || 'Not specified'}
Country: \${leadData.country || 'Not specified'}
Visa Status: \${leadData.visaStatus || 'Not specified'}
\${leadData.linkedinProfile ? \`LinkedIn: \${leadData.linkedinProfile}\` : ''}

Please review the lead details and take appropriate action.

Best regards,
CRM Bench Sales Process Team`,
      type: 'lead_assignment',
      lastModified: new Date()
    },
    {
      id: 'otp',
      name: 'OTP Email',
      subject: 'Password Reset OTP - CRM Bench Sales Process',
      template: `Dear \${userData.firstname},

You have requested to reset your password. Please use the verification code below:

Your OTP: \${userData.otp}

This code will expire in 2 minutes.

If you didn't request this password reset, you can safely ignore this email.

Best regards,
CRM Bench Sales Process Team`,
      type: 'otp',
      lastModified: new Date()
    },
    {
      id: 'package_details',
      name: 'Package Details',
      subject: 'Embark on a Success Journey with Ninez Tech',
      template: `Dear \${userData.firstName},

Thank you for your valuable time. I've highlighted details about our company and services below to give you a better understanding of our online presence and commitment to supporting your job search.

Why Choose Ninez Tech?
Join the fastest-growing network for OPT/CPT/H1B/GC/USC job seekers and sponsors. We specialize in connecting international professionals, students, and US companies.

Let me know if you have any questions or would like to hop on a quick call to discuss which plan best aligns with your goals.

Looking forward to helping you take the next big step in your career!

Best regards,
Ninez Tech Team`,
      type: 'package_details',
      lastModified: new Date()
    }
  ]);

  const handleSave = async () => {
    // Implement save logic here
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pl-16"> {/* Added pt-16 for topbar spacing */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center mb-8" >
          <h1 className="text-3xl font-semibold text-gray-900">
            <FaEnvelope className="inline-block mr-3 text-blue-600" />
            Email Templates
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Templates</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedTemplate?.id === template.id
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <h3 className="font-medium text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{template.subject}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Last modified: {template.lastModified.toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Template Editor */}
          <div className="lg:col-span-2">
            {selectedTemplate ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {isEditing ? 'Edit Template' : 'Template Details'}
                  </h2>
                  <div className="flex space-x-2">
                    <button
                      className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                      onClick={() => setShowPreview(!showPreview)}
                      title={showPreview ? "Show Code" : "Show Preview"}
                    >
                      <MdPreview size={20} />
                    </button>
                    <button
                      className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                      onClick={() => setIsEditing(!isEditing)}
                      title={isEditing ? "Cancel" : "Edit"}
                    >
                      {isEditing ? <FaTimes /> : <FaEdit />}
                    </button>
                    {isEditing && (
                      <button
                        className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                        onClick={handleSave}
                        title="Save"
                      >
                        <FaSave />
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Template Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={selectedTemplate.name}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject Line
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={selectedTemplate.subject}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Template Content
                      </label>
                      {showPreview ? (
                        <div
                          className="prose max-w-none p-4 border border-gray-300 rounded-md bg-gray-50 overflow-auto text-gray-900"
                          style={{ maxHeight: '600px', lineHeight: '1.5' }}
                          dangerouslySetInnerHTML={{
                            __html: selectedTemplate.template.replace(/\n/g, '<br>'),
                          }}
                        />
                      ) : (
                        <textarea
                          className="w-full h-[600px] px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={selectedTemplate.template}
                          readOnly={!isEditing}
                          style={{ lineHeight: '1.5' }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                Select a template to view or edit
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplates; 