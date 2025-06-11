import React, { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import Sidebar from '../sidebar/Sidebar';
import LogoIcon from "../../assets/xls_logo.webp"
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Editor } from '@tinymce/tinymce-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

// Type definitions for country list
type Country = {
  label: string;
  value: string;
};

type CountryList = {
  getData: () => Country[];
  getLabel: (value: string) => string;
  getValue: (label: string) => string;
};

// Using dynamic import for country list
import countryList from 'react-select-country-list';

interface Lead {
  id?: number;
  firstName: string;
  lastName: string;
  contactNumbers: string[];
  emails: string[];
  primaryEmail: string;
  primaryContact: string;
  technology: string;
  country: string;
  countryCode: string;
  visaStatus: string;
  status?: string;
  statusGroup?: string;
  leadSource: string;
  remarks: string[];
  reference?: string | null;
  linkedinId: string;
  totalAssign?: number;
  createdAt?: string;
  updatedAt?: string;
  salesPerson?: string;
  assignmentDate?: string;
}

const LeadCreationComponent: React.FC = () => {
  const [formData, setFormData] = useState<Lead>({
    firstName: '',
    lastName: '',
    contactNumbers: [''],
    emails: ['', ''],
    primaryEmail: '',
    primaryContact: '',
    technology: '',
    country: '',
    countryCode: '',
    visaStatus: '',
    leadSource: '',
    remarks: [''],
    linkedinId: '',
  });

  const [errors, setErrors] = useState<Partial<Lead>>({});
  const [countries] = useState(countryList().getData());
  const [leads, setLeads] = useState<Lead[]>([
    {
      firstName: 'John',
      lastName: 'Doe',
      contactNumbers: ['+1234567890'],
      emails: ['john@example.com'],
      primaryEmail: 'john@example.com',
      primaryContact: '+1234567890',
      technology: 'React',
      country: 'USA',
      countryCode: 'US',
      visaStatus: 'H1B',
      remarks: ['Senior Developer'],
      leadSource: 'LinkedIn',
      linkedinId: 'https://linkedin.com/in/john',
      salesPerson: 'Aneri'
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      contactNumbers: ['+0987654321'],
      emails: ['jane@example.com'],
      primaryEmail: 'jane@example.com',
      primaryContact: '+0987654321',
      technology: 'Node.js',
      country: 'Canada',
      countryCode: 'CA',
      visaStatus: 'L1',
      remarks: ['Full Stack Developer'],
      leadSource: 'Indeed',
      linkedinId: 'https://linkedin.com/in/jane',
      salesPerson: 'Dhaval'
    }
  ]);

  const exportToExcel = () => {
    const date = new Date().toISOString().split('T')[0];
    const filename = `leads_${date}`;
    
    // Format the leads data for Excel
    const excelData = leads.map(lead => ({
      'Candidate Name': lead.firstName + ' ' + lead.lastName,
      'Contact Number': lead.contactNumbers[0],
      'Email': lead.emails[0],
      'LinkedIn': lead.linkedinId,
      'Technology': lead.technology,
      'Country': lead.country,
      'Visa Status': lead.visaStatus,
      'Remarks': lead.remarks.join(', '),
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
    firstName: '',
    lastName: '',
    contactNumbers: [''],
    emails: ['', ''],
    primaryEmail: '',
    primaryContact: '',
    technology: '',
    country: '',
    countryCode: '',
    visaStatus: '',
    leadSource: '',
    remarks: [''],
    linkedinId: '',
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
        firstName: '',
        lastName: '',
        contactNumbers: [''],
        emails: ['', ''],
        primaryEmail: '',
        primaryContact: '',
        technology: '',
        country: '',
        countryCode: '',
        visaStatus: '',
        leadSource: '',
        remarks: [''],
        linkedinId: '',
      });
      alert('Lead updated successfully!');
    }
  };

  const handleEditCancel = () => {
    setEditingLead(null);
    setEditFormData({
      firstName: '',
      lastName: '',
      contactNumbers: [''],
      emails: ['', ''],
      primaryEmail: '',
      primaryContact: '',
      technology: '',
      country: '',
      countryCode: '',
      visaStatus: '',
      leadSource: '',
      remarks: [''],
      linkedinId: '',
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
            firstName: row['Candidate Name'].split(' ')[0],
            lastName: row['Candidate Name'].split(' ')[1],
            contactNumbers: [row['Contact Number']],
            emails: [row['Email']],
            primaryEmail: row['Email'],
            primaryContact: row['Contact Number'],
            technology: row['Technology'],
            country: row['Country'],
            countryCode: row['Country Code'],
            visaStatus: row['Visa Status'],
            remarks: row['Remarks'] || [],
            leadSource: row['Lead Source'],
            linkedinId: row['LinkedIn'],
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

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First Name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last Name is required';
    }
    if (!formData.primaryContact.trim()) {
      newErrors.primaryContact = 'Primary Contact is required';
    }
    if (!formData.primaryEmail.trim()) {
      newErrors.primaryEmail = 'Primary Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primaryEmail)) {
      newErrors.primaryEmail = 'Primary Email is not valid';
    }
    if (!formData.linkedinId.trim()) {
      newErrors.linkedinId = 'LinkedIn URL is required';
    } else if (!/^https?:\/\/(www\.)?linkedin\.com/.test(formData.linkedinId)) {
      newErrors.linkedinId = 'LinkedIn URL is not valid';
    }
    if (!formData.technology.trim()) {
      newErrors.technology = 'Technology is required';
    }
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }
    if (!formData.visaStatus.trim()) {
      newErrors.visaStatus = 'Visa Status is required';
    }
    if (!formData.leadSource.trim()) {
      newErrors.leadSource = 'Lead Source is required';
    }
    if (formData.remarks.length === 0 || !formData.remarks[0].trim()) {
      newErrors.remarks = ['At least one remark is required'];
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
      const response = await axios.post('http://localhost:5006/api/lead/add', formData);
      
      if (response.data.success) {
        // Update leads list with new lead
        setLeads(prev => [response.data.data, ...prev]);
        
        // Reset form
    setFormData({
          firstName: '',
          lastName: '',
          contactNumbers: [''],
          emails: ['', ''],
          primaryEmail: '',
          primaryContact: '',
      technology: '',
      country: '',
          countryCode: '',
      visaStatus: '',
          leadSource: '',
          remarks: [''],
          linkedinId: '',
    });
    setErrors({});
    alert('Lead created successfully!');
      }
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
    lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.technology.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="ml-[20px] mt-16 p-8 bg-gray-50 min-h-screen">
        <div className="max-w-[1350px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Lead Management</h1>
          <p className="text-gray-600">Create and manage your leads efficiently</p>
        </div>

        {/* Main Tabs */}
        <div className="bg-white mb-10 rounded-t-xl border-b border-gray-200">
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
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                    <input 
                      type="text" 
                      name="firstName" 
                      value={formData.firstName} 
                      onChange={handleChange} 
                      placeholder="Enter first name" 
                      className={`w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.firstName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.firstName && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.firstName}</p>
                    )}
                  </div>
                  
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                    <input 
                      type="text" 
                      name="lastName" 
                      value={formData.lastName} 
                      onChange={handleChange} 
                      placeholder="Enter last name" 
                      className={`w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.lastName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.lastName && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.lastName}</p>
                    )}
                  </div>
                  
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Contact *</label>
                    <PhoneInput
                      country={'us'}
                      value={formData.primaryContact}
                      onChange={(phone) => setFormData(prev => ({ ...prev, primaryContact: phone }))}
                      containerClass="w-full"
                      inputClass={`w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.primaryContact ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.primaryContact && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.primaryContact}</p>
                    )}
                  </div>
                  
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Email *</label>
                    <input 
                      type="email" 
                      name="primaryEmail" 
                      value={formData.primaryEmail} 
                      onChange={handleChange} 
                      placeholder="Enter primary email" 
                      className={`w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.primaryEmail ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.primaryEmail && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.primaryEmail}</p>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Email</label>
                    <input 
                      type="email" 
                      name="secondaryEmail" 
                      value={formData.emails[1] || ''} 
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        emails: [prev.primaryEmail, e.target.value],
                        primaryEmail: prev.primaryEmail || prev.emails[0]
                      }))} 
                      placeholder="Enter secondary email" 
                      className="w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300"
                    />
                  </div>
                  
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Technology *</label>
                    <input 
                      type="text" 
                      name="technology" 
                      value={formData.technology} 
                      onChange={handleChange} 
                      placeholder="Enter technologies (e.g., Java, Spring Boot)" 
                      className={`w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.technology ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.technology && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.technology}</p>
                    )}
                  </div>
                  
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                    <select
                      name="country"
                      value={formData.countryCode}
                      onChange={(e) => {
                        const selected = countries.find(c => c.value === e.target.value);
                        if (selected) {
                          setFormData(prev => ({
                            ...prev,
                            country: selected.label,
                            countryCode: selected.value
                          }));
                        }
                      }}
                      className={`w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.country ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select a country</option>
                      {countries.map(country => (
                        <option key={country.value} value={country.value}>
                          {country.label}
                        </option>
                      ))}
                    </select>
                    {errors.country && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.country}</p>
                    )}
                  </div>
                  
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Visa Status *</label>
                    <select
                      name="visaStatus"
                      value={formData.visaStatus}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.visaStatus ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select visa status</option>
                      <option value="H1B">H1B</option>
                      <option value="L1">L1</option>
                      <option value="H4">H4</option>
                      <option value="F1">F1</option>
                      <option value="B2">B2</option>
                    </select>
                    {errors.visaStatus && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.visaStatus}</p>
                    )}
                  </div>
                  
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lead Source *</label>
                    <select
                      name="leadSource"
                      value={formData.leadSource}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.leadSource ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select lead source</option>
                      <option value="Indeed">Indeed</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Referral">Referral</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.leadSource && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.leadSource}</p>
                    )}
                  </div>
                </div>

                {/* Remarks Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Remarks *</label>
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.remarks[formData.remarks.length - 1].trim()) {
                          setFormData(prev => ({
                            ...prev,
                            remarks: [...prev.remarks, '']
                          }));
                        }
                      }}
                      className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 focus:outline-none"
                    >
                      + Add Remark
                    </button>
                  </div>
                  
                  {/* Current Editor */}
                  <div className="relative">
                    <Editor
                      apiKey="n1jupubcidq4bqvv01vznzpbcj43hg297pgftp78jszal918"
                      init={{
                        height: 200,
                        menubar: false,
                        plugins: [
                          'advlist', 'autolink', 'lists', 'link', 'charmap', 'preview',
                          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                        ],
                        toolbar: 'undo redo | blocks | ' +
                          'bold italic forecolor | alignleft aligncenter ' +
                          'alignright alignjustify | bullist numlist outdent indent | ' +
                          'removeformat | help',
                      }}
                      value={formData.remarks[formData.remarks.length - 1]}
                      onEditorChange={(content: string) => {
                        const newRemarks = [...formData.remarks];
                        newRemarks[formData.remarks.length - 1] = content;
                        setFormData(prev => ({
                          ...prev,
                          remarks: newRemarks
                        }));
                      }}
                    />
                  </div>

                  {/* Previous Remarks List */}
                  {formData.remarks.length > 1 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Previous Remarks</h4>
                      <div className="space-y-3">
                        {formData.remarks.slice(0, -1).reverse().map((remark, idx) => (
                          <div key={idx} className="relative group">
                            <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                              <div dangerouslySetInnerHTML={{ __html: remark }} />
                              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                                Remark #{formData.remarks.length - 1 - idx}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newRemarks = formData.remarks.filter((_, i) => i !== (formData.remarks.length - 2 - idx));
                                setFormData(prev => ({
                                  ...prev,
                                  remarks: newRemarks
                                }));
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-gray-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {errors.remarks && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.remarks[0]}</p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end mt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`px-6 py-2.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      isLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Lead...
                      </span>
                    ) : (
                      'Create Lead'
                    )}
                  </button>
                </div>
              </form>
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
                          <td className="px-8 py-4 text-sm text-gray-900 border-b whitespace-nowrap">{lead.firstName} {lead.lastName}</td>
                          <td className="px-8 py-4 text-sm text-gray-900 border-b whitespace-nowrap">{lead.contactNumbers[0]}</td>
                          <td className="px-8 py-4 text-sm text-gray-900 border-b whitespace-nowrap">{lead.emails[0]}</td>
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
                                        <p className="text-gray-600">{selectedLead.firstName} {selectedLead.lastName}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">Remarks:</p>
                                        <p className="text-gray-600">{selectedLead.remarks.join(', ')}</p>
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