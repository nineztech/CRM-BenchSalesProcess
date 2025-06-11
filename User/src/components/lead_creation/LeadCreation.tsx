import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Sidebar from '../sidebar/Sidebar';
import LogoIcon from "../../assets/xls_logo.webp"
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

interface Lead {
  id?: number;
  candidateName: string;
  contactNumber: string;
  email: string;
  linkedinId: string;
  technology: string;
  country: string;
  visaStatus: string;
  remarks: string;
  salesPerson?: string;
  assignmentDate?: string;
  status?: string;
}

const LeadCreationComponent: React.FC = () => {
  const [formData, setFormData] = useState<Lead>({
    candidateName: '',
    contactNumber: '',
    email: '',
    linkedinId: '',
    technology: '',
    country: '',
    visaStatus: '',
    remarks: '',
  });

  const [errors, setErrors] = useState<Partial<Lead>>({});
  const [leads, setLeads] = useState<Lead[]>([
    {
      candidateName: 'John Doe',
      contactNumber: '1234567890',
      email: 'john@example.com',
      linkedinId: 'https://linkedin.com/in/john',
      technology: 'React',
      country: 'USA',
      visaStatus: 'H1B',
      remarks: 'Senior Developer',
      salesPerson: 'Aneri'
    },
    {
      candidateName: 'Jane Smith',
      contactNumber: '0987654321',
      email: 'jane@example.com',
      linkedinId: 'https://linkedin.com/in/jane',
      technology: 'Node.js',
      country: 'Canada',
      visaStatus: 'L1',
      remarks: 'Full Stack Developer',
      salesPerson: 'Dhaval'
    }
  ]);

  const exportToExcel = () => {
    const date = new Date().toISOString().split('T')[0];
    const filename = `leads_${date}`;
    
    // Format the leads data for Excel
    const excelData = leads.map(lead => ({
      'Candidate Name': lead.candidateName,
      'Contact Number': lead.contactNumber,
      'Email': lead.email,
      'LinkedIn': lead.linkedinId,
      'Technology': lead.technology,
      'Country': lead.country,
      'Visa Status': lead.visaStatus,
      'Remarks': lead.remarks,
      'Sales Person': lead.salesPerson || ''
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25); // Def size of 25 items
  const [totalPages, setTotalPages] = useState(1);
  const [editingLead, setEditingLead] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Lead>({
    candidateName: '',
    contactNumber: '',
    email: '',
    linkedinId: '',
    technology: '',
    country: '',
    visaStatus: '',
    remarks: '',
  });
  const [selectedSalesPerson, setSelectedSalesPerson] = useState<string>('');
  const [currentSalesPerson, setCurrentSalesPerson] = useState<string>('');

  // Info dialog state
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // New state variables for tabs and API integration
  const [activeMainTab, setActiveMainTab] = useState<'create' | 'bulk'>('create');
  const [activeStatusTab, setActiveStatusTab] = useState<'open' | 'converted' | 'archived' | 'inProcess'>('open');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleAssignSalesPerson = () => {
    if (!selectedSalesPerson || selectedLeads.length === 0) return;

    const currentDate = new Date().toISOString();
    const isReassigning = selectedLeads.some(index => leads[index].salesPerson);

    setLeads(prevLeads => 
      prevLeads.map((lead, index) => {
        if (selectedLeads.includes(index)) {
          return { 
            ...lead, 
            salesPerson: selectedSalesPerson, 
            assignmentDate: currentDate,
            previousSalesPerson: lead.salesPerson // Store previous sales person for history
          };
        }
        return lead;
      })
    );
    setSelectedSalesPerson('');
    setSelectedLeads([]);
    setCurrentSalesPerson(''); // Reset current sales person after assignment
  };

  const getCurrentSalesPerson = () => {
    if (selectedLeads.length === 0) return '';
    
    // Get the sales person of the first selected lead
    const firstSelectedLead = selectedLeads[0];
    return leads[firstSelectedLead]?.salesPerson || '';
  };

  React.useEffect(() => {
    if (selectedLeads.length > 0) {
      setCurrentSalesPerson(getCurrentSalesPerson());
    } else {
      setCurrentSalesPerson('');
    }
  }, [selectedLeads]);

  const getButtonProps = () => {
    if (selectedLeads.length === 0) return { text: 'Assign', color: 'bg-indigo-600' };
    
    const hasSalesPerson = selectedLeads.some(index => leads[index].salesPerson);
    
    if (hasSalesPerson) {
      return { 
        text: 'Reassign', 
        color: 'bg-red-600 hover:bg-red-700'
      };
    }
    
    return { 
      text: 'Assign', 
      color: 'bg-indigo-600 hover:bg-indigo-700'
    };
  };

  const handleInfoClick = (lead: Lead) => {
    setSelectedLead(lead);
    setShowInfoDialog(true);
  };

  const handleCloseInfoDialog = () => {
    setShowInfoDialog(false);
    setSelectedLead(null);
  };

  // Select all checkbox handler
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Select all visible leads
      const allIndexes = Array.from({ length: paginatedLeads.length }, (_, i) => i);
      setSelectedLeads(allIndexes);
    } else {
      // Deselect all
      setSelectedLeads([]);
    }
  };

  const handleEdit = (leadIndex: number) => {
    setEditingLead(leadIndex);
    setEditFormData(leads[leadIndex]);
  };

  const handleEditSubmit = () => {
    if (editingLead !== null) {
      const updatedLeads = [...leads];
      updatedLeads[editingLead] = editFormData;
      setLeads(updatedLeads);
      setEditingLead(null);
      setEditFormData({
        candidateName: '',
        contactNumber: '',
        email: '',
        linkedinId: '',
        technology: '',
        country: '',
        visaStatus: '',
        remarks: '',
      });
      alert('Lead updated successfully!');
    }
  };

  const handleEditCancel = () => {
    setEditingLead(null);
    setEditFormData({
      candidateName: '',
      contactNumber: '',
      email: '',
      linkedinId: '',
      technology: '',
      country: '',
      visaStatus: '',
      remarks: '',
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const [file, setFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileUpload = async () => {
    if (!file) return;
    
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        if (data) {
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Process the data and update leads
          const newLeads = jsonData.map((row: any) => ({
            candidateName: row['Candidate Name'],
            contactNumber: row['Contact Number'],
            email: row['Email'],
            linkedinId: row['LinkedIn'],
            technology: row['Technology'],
            country: row['Country'],
            visaStatus: row['Visa Status'],
            remarks: row['Remarks'] || '',
          }));
          
          setLeads(prev => [...prev, ...newLeads]);
          setUploadSuccess(true);
          setFile(null); // Clear the file input
        }
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    }
  };

  // Using React state instead of localStorage for artifact compatibility
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (index: number) => {
    const originalIndex = filteredLeads.findIndex((lead, i) => i === index + ((currentPage - 1) * pageSize));
    setSelectedLeads(prev =>
      prev.includes(originalIndex) ? prev.filter(i => i !== index) : [...prev, originalIndex]
    );
  };

  const validate = (): boolean => {
    const newErrors: Partial<Lead> = {};
    
    // Candidate Name
    if (!formData.candidateName.trim()) {
      newErrors.candidateName = 'Candidate Name is required';
    }

    // Contact Number
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact Number is required';
    } else if (!/^[0-9]{10}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Contact Number must be 10 digits';
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email is not valid';
    }

    // LinkedIn
    if (!formData.linkedinId.trim()) {
      newErrors.linkedinId = 'LinkedIn URL is required';
    } else if (!/^https?:\/\/(www\.)?linkedin\.com/.test(formData.linkedinId)) {
      newErrors.linkedinId = 'LinkedIn URL is not valid';
    }

    // Technology
    if (!formData.technology.trim()) {
      newErrors.technology = 'Technology is required';
    }

    // Country
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    // Visa Status
    if (!formData.visaStatus.trim()) {
      newErrors.visaStatus = 'Visa Status is required';
    }

    // Remarks
    if (!formData.remarks.trim()) {
      newErrors.remarks = 'Remarks are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fetch leads based on status group
  const fetchLeads = async (statusGroup: string) => {
    try {
      setIsLoading(true);
      setApiError(null);
      const response = await axios.get(`/api/leads/group/${statusGroup}?page=${currentPage}&limit=${pageSize}`);
      setLeads(response.data.data.leads);
      // Update pagination info from API response
      const { total, totalPages } = response.data.data.pagination;
      setTotalPages(totalPages);
    } catch (error) {
      setApiError('Failed to fetch leads. Please try again.');
      console.error('Error fetching leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to fetch leads when status tab changes
  useEffect(() => {
    fetchLeads(activeStatusTab);
  }, [activeStatusTab, currentPage, pageSize]);

  // Handle lead creation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    try {
      setIsLoading(true);
      const response = await axios.post('/api/leads/add', {
        ...formData,
        status: 'Numb' // Default status for new leads
      });
      
      // Update leads list with new lead
      setLeads(prev => [response.data.data, ...prev]);
      
      // Reset form
      setFormData({
        candidateName: '',
        contactNumber: '',
        email: '',
        linkedinId: '',
        technology: '',
        country: '',
        visaStatus: '',
        remarks: '',
      });
      setErrors({});
      alert('Lead created successfully!');
    } catch (error) {
      setApiError('Failed to create lead. Please try again.');
      console.error('Error creating lead:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Tab styling
  const getTabStyle = (isActive: boolean) => `
    relative px-8 py-4 text-sm font-medium transition-all duration-300
    ${isActive ? 
      'text-indigo-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-indigo-600' : 
      'text-gray-500 hover:text-gray-700'}
  `;

  const getStatusTabStyle = (isActive: boolean) => `
    relative px-8 py-4 text-sm font-medium transition-all duration-300
    ${isActive ? 
      'text-indigo-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-indigo-600' : 
      'text-gray-500 hover:text-gray-700'}
  `;

  const filteredLeads = leads.filter((lead: Lead) =>
    lead.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.technology.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="ml-16 mt-16 p-8 bg-gray-50 min-h-screen">
      <div className="max-w-[1350px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Lead Management</h1>
          <p className="text-gray-600">Create and manage your leads efficiently</p>
        </div>

        {/* Main Tabs */}
        <div className="bg-white rounded-t-xl border-b border-gray-200">
          <div className="flex">
            <button
              className={getTabStyle(activeMainTab === 'create')}
              onClick={() => setActiveMainTab('create')}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Lead
              </span>
            </button>
            <button
              className={getTabStyle(activeMainTab === 'bulk')}
              onClick={() => setActiveMainTab('bulk')}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Bulk Upload
              </span>
            </button>
          </div>
        </div>

        {/* Form Sections */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMainTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-b-xl shadow-lg p-8 mb-8 border-x border-b border-gray-200"
          >
            {activeMainTab === 'create' ? (
              // Create Lead Form
              <div className="grid grid-cols-3 gap-6">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Candidate Name *</label>
                  <input 
                    type="text" 
                    name="candidateName" 
                    value={editingLead !== null ? editFormData.candidateName : formData.candidateName} 
                    onChange={editingLead !== null ? handleEditChange : handleChange} 
                    placeholder="Enter candidate's full name" 
                    className={`w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
                      errors.candidateName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    aria-invalid={errors.candidateName ? 'true' : 'false'}
                    aria-describedby={errors.candidateName ? 'candidateName-error' : undefined}
                  />
                  {errors.candidateName && (
                    <p id="candidateName-error" className="mt-1.5 text-sm text-red-600">
                      {errors.candidateName}
                    </p>
                  )}
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number *</label>
                  <input 
                    type="text" 
                    name="contactNumber" 
                    value={editingLead !== null ? editFormData.contactNumber : formData.contactNumber} 
                    onChange={editingLead !== null ? handleEditChange : handleChange} 
                    placeholder="Enter 10-digit contact number" 
                    className={`w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
                      errors.contactNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    aria-invalid={errors.contactNumber ? 'true' : 'false'}
                    aria-describedby={errors.contactNumber ? 'contactNumber-error' : undefined}
                  />
                  {errors.contactNumber && (
                    <p id="contactNumber-error" className="mt-1.5 text-sm text-red-600">
                      {errors.contactNumber}
                    </p>
                  )}
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={editingLead !== null ? editFormData.email : formData.email} 
                    onChange={editingLead !== null ? handleEditChange : handleChange} 
                    placeholder="Enter email address" 
                    className={`w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    aria-invalid={errors.email ? 'true' : 'false'}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                  {errors.email && (
                    <p id="email-error" className="mt-1.5 text-sm text-red-600">
                      {errors.email}
                    </p>
                  )}
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn URL *</label>
                  <input 
                    type="text" 
                    name="linkedinId" 
                    value={editingLead !== null ? editFormData.linkedinId : formData.linkedinId} 
                    onChange={editingLead !== null ? handleEditChange : handleChange} 
                    placeholder="Enter LinkedIn profile URL" 
                    className={`w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
                      errors.linkedinId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    aria-invalid={errors.linkedinId ? 'true' : 'false'}
                    aria-describedby={errors.linkedinId ? 'linkedinId-error' : undefined}
                  />
                  {errors.linkedinId && (
                    <p id="linkedinId-error" className="mt-1.5 text-sm text-red-600">
                      {errors.linkedinId}
                    </p>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Technology *</label>
                  <input 
                    type="text" 
                    name="technology" 
                    value={editingLead !== null ? editFormData.technology : formData.technology} 
                    onChange={editingLead !== null ? handleEditChange : handleChange} 
                    placeholder="Enter technology stack" 
                    className={`w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
                      errors.technology ? 'border-red-500' : 'border-gray-300'
                    }`}
                    aria-invalid={errors.technology ? 'true' : 'false'}
                    aria-describedby={errors.technology ? 'technology-error' : undefined}
                  />
                  {errors.technology && (
                    <p id="technology-error" className="mt-1.5 text-sm text-red-600">
                      {errors.technology}
                    </p>
                  )}
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                  <input 
                    type="text" 
                    name="country" 
                    value={editingLead !== null ? editFormData.country : formData.country} 
                    onChange={editingLead !== null ? handleEditChange : handleChange} 
                    placeholder="Enter country name" 
                    className={`w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
                      errors.country ? 'border-red-500' : 'border-gray-300'
                    }`}
                    aria-invalid={errors.country ? 'true' : 'false'}
                    aria-describedby={errors.country ? 'country-error' : undefined}
                  />
                  {errors.country && (
                    <p id="country-error" className="mt-1.5 text-sm text-red-600">
                      {errors.country}
                    </p>
                  )}
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Visa Status *</label>
                  <input 
                    type="text" 
                    name="visaStatus" 
                    value={editingLead !== null ? editFormData.visaStatus : formData.visaStatus} 
                    onChange={editingLead !== null ? handleEditChange : handleChange} 
                    placeholder="Enter visa status" 
                    className={`w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
                      errors.visaStatus ? 'border-red-500' : 'border-gray-300'
                    }`}
                    aria-invalid={errors.visaStatus ? 'true' : 'false'}
                    aria-describedby={errors.visaStatus ? 'visaStatus-error' : undefined}
                  />
                  {errors.visaStatus && (
                    <p id="visaStatus-error" className="mt-1.5 text-sm text-red-600">
                      {errors.visaStatus}
                    </p>
                  )}
                </div>
                
                <div className="relative col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Remarks *</label>
                  <textarea 
                    name="remarks" 
                    value={editingLead !== null ? editFormData.remarks : formData.remarks} 
                    onChange={editingLead !== null ? handleEditChange : handleChange} 
                    placeholder="Enter any additional remarks" 
                    className={`w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
                      errors.remarks ? 'border-red-500' : 'border-gray-300'
                    }`}
                    rows={4}
                    aria-invalid={errors.remarks ? 'true' : 'false'}
                    aria-describedby={errors.remarks ? 'remarks-error' : undefined}
                  />
                  {errors.remarks && (
                    <p id="remarks-error" className="mt-1.5 text-sm text-red-600">
                      {errors.remarks}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              // Bulk Upload Form
              <div className="max-w-xl mx-auto">
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-1">Bulk lead upload</h4>
                  <p className="text-sm text-gray-500">Upload multiple leads at once</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow transition-all duration-300">
                  <div className="text-center mb-6">
                    <button 
                      onClick={exportToExcel}
                      className="p-3 hover:bg-white rounded-lg cursor-pointer transition-all duration-200 shadow-sm hover:shadow"
                      title="Export to Excel"
                    >
                      <img 
                        src={LogoIcon}
                        alt="Excel" 
                        className="w-12 h-12 mx-auto"
                      />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Download the sample file, enter the data of leads into it and upload the bulk lead from Browse button.</p>
                  <p className="text-sm text-gray-500 mb-6">Note: Don't change the header and the filename.</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept=".xlsx"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFile(e.target.files[0]);
                          setUploadSuccess(false);
                        }
                      }}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all duration-200"
                    />
                    <button
                      onClick={handleFileUpload}
                      className="flex items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow"
                      title="Upload selected file"
                    >
                      <span className="text-xl font-bold">&uarr;</span>
                    </button>
                  </div>
                  {uploadSuccess && (
                    <p className="text-green-600 mt-4 text-sm font-medium">File uploaded successfully!</p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Status Tabs */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Submitted Leads</h2>
              <div className="flex items-center gap-4">
                <select 
                  className="border px-4 py-2 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={selectedSalesPerson}
                  onChange={(e) => {
                    setSelectedSalesPerson(e.target.value);
                    if (e.target.value) {
                      setCurrentSalesPerson('');
                    }
                  }}
                >
                  <option value="">Select sales person</option>
                  {['Aneri', 'Dhaval', 'Rajdeep', 'Payal'].map((person) => (
                    <option 
                      key={person}
                      value={person}
                      disabled={person === currentSalesPerson}
                    >
                      {person}
                    </option>
                  ))}
                </select>
                <button 
                  className={`${getButtonProps().color} text-white px-5 py-2 rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow`}
                  onClick={handleAssignSalesPerson}
                  disabled={!selectedSalesPerson || selectedLeads.length === 0}
                >
                  {getButtonProps().text}
                </button>
                <select 
                  className="border px-4 py-2 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                </select>
              </div>
            </div>
            
            <div className="border-b border-gray-200">
              <div className="flex">
                {(['open', 'converted', 'archived', 'inProcess'] as const).map(tab => (
                  <button
                    key={tab}
                    className={getStatusTabStyle(activeStatusTab === tab)}
                    onClick={() => setActiveStatusTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-xs">
                      {leads.filter(lead => lead.status === tab).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table with horizontal scroll prevention */}
          <div className="w-full">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-8 py-4 border-b">
                          <input 
                            type="checkbox" 
                            checked={selectedLeads.length === paginatedLeads.length}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </th>
                        <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Sr. no</th>
                        <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Date & time</th>
                        <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Candidate name</th>
                        <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Contact</th>
                        <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Email</th>
                        <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">LinkedIn</th>
                        <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Visa</th>
                        <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Country</th>
                        <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Sales</th>
                        <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Status</th>
                        <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 border-b whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLeads.map((lead: Lead, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-8 py-4 border-b">
                            <input
                              type="checkbox"
                              checked={selectedLeads.includes(index)}
                              onChange={() => handleCheckboxChange(index)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-8 py-4 text-sm text-gray-900 border-b whitespace-nowrap">
                            {(currentPage - 1) * pageSize + index + 1}
                          </td>
                          <td className="px-8 py-4 text-sm text-gray-900 border-b whitespace-nowrap">
                            {new Date().toLocaleString('en-IN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </td>
                          <td className="px-8 py-4 text-sm text-gray-900 border-b whitespace-nowrap">{lead.candidateName}</td>
                          <td className="px-8 py-4 text-sm text-gray-900 border-b whitespace-nowrap">{lead.contactNumber}</td>
                          <td className="px-8 py-4 text-sm text-gray-900 border-b whitespace-nowrap">{lead.email}</td>
                          <td className="px-8 py-4 text-sm border-b whitespace-nowrap">
                            <a 
                              href={lead.linkedinId} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-900 hover:underline"
                            >
                              LinkedIn
                            </a>
                          </td>
                          <td className="px-8 py-4 text-sm text-gray-900 border-b whitespace-nowrap">{lead.visaStatus}</td>
                          <td className="px-8 py-4 text-sm text-gray-900 border-b whitespace-nowrap">{lead.country}</td>
                          <td className="px-8 py-4 text-sm text-gray-900 border-b whitespace-nowrap">
                            {lead.salesPerson || '--'}
                            {lead.salesPerson && (
                              <span className="ml-2 inline-flex items-center">
                                <button
                                  className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all duration-200"
                                  title={lead.assignmentDate ? new Date(lead.assignmentDate).toLocaleString() : ''}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                              </span>
                            )}
                          </td>
                          <td className="px-8 py-4 text-sm border-b whitespace-nowrap">
                            <div className="relative inline-block group cursor-pointer">
                              <button 
                                onClick={() => handleInfoClick(lead)}
                                className="p-1 rounded-full bg-gray-100 relative"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-1 py-0.5 rounded-full w-5 h-5 flex items-center justify-center">
                                  {index + 1}
                                </span>
                              </button>
                              {showInfoDialog && selectedLead && selectedLead === lead && (
                                <div className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-md mx-auto top-20 transform -translate-x-1/2 p-6">
                                  <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                      <h3 className="text-lg font-medium text-gray-900">Remarks</h3>
                                      <button 
                                        onClick={handleCloseInfoDialog}
                                        className="text-gray-500 hover:text-gray-700"
                                      >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                    <div className="space-y-4">
                                      <div>
                                        <p className="font-medium text-gray-900">Candidate name:</p>
                                        <p className="text-gray-600">{selectedLead.candidateName}</p>
                                      </div>
                                      <div>
                                        <p className="font-medium text-gray-900">Remarks:</p>
                                        <p className="text-gray-600">{selectedLead.remarks || 'No remarks added'}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-4 text-sm border-b whitespace-nowrap">
                            <button 
                              onClick={() => handleEdit(index)}
                              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                              title="Edit lead"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center px-8 py-5 border-t">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, leads.length)} of {leads.length} leads
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 mx-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200"
              >
                Previous
              </button>
              <span className="px-4 py-2 mx-2 bg-gray-50 rounded-md text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 mx-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadCreationComponent;