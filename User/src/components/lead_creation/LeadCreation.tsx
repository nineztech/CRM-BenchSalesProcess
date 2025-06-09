import React, { useState, } from 'react';
import * as XLSX from 'xlsx';
import Sidebar from '../Sidebar/Sidebar.tsx';
import LogoIcon from "../../assets/xls_logo.webp"

interface Lead {
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


// Remove unused handleAssignSales function since we're not using it
// const handleAssignSales = () => {
//   if (!salesPerson) {
//     alert('Please select a Sales Person');
//     return;
//   }
// 
//   const updatedLeads = leads.map((lead, index) =>
//     selectedLeads.includes(index)
//       ? { ...lead, salesPerson }
//       : lead
//   );
//   setLeads(updatedLeads); 
// 
//   // Clear selection
//   setSelectedLeads([]);
//   setSalesPerson('');
// };


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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    // Add new lead at the beginning of the array
    const updatedLeads = [formData, ...leads];
    setLeads(updatedLeads);
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
  };

  const filteredLeads = leads.filter((lead: Lead) =>
    lead.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.technology.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLeads.length / pageSize);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <>
      <Sidebar />

      <div className="max-w-[1350px] mx-auto mt-12">
        <div className="flex flex-row gap-5 mb-5 ml-28">
          {/* Left Section - Form */}
          <div className="border-2 border-gray-100 rounded-lg p-5 bg-white shadow-lg mt-11">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold text-gray-900">{editingLead !== null ? 'Edit Lead' : 'Create New Lead'}</h3>
              <div className="flex gap-2">
                {editingLead !== null ? (
                  <>
                    <button 
                      onClick={handleEditSubmit}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-3xl text-sm font-medium transition-colors duration-200"
                    >
                      Update
                    </button>
                    <button 
                      onClick={handleEditCancel}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-3xl text-sm font-medium transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={handleSubmit}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-3xl text-sm font-medium transition-colors duration-200"
                    disabled={Object.keys(errors).length > 0}
                  >
                    Create
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-5 mb-5">
              <div className="relative">
                <label className="block text-sm font-medium font-family:verdana text-gray-700 mb-1">Candidate Name *</label>
                <input 
                  type="text" 
                  name="candidateName" 
                  value={editingLead !== null ? editFormData.candidateName : formData.candidateName} 
                  onChange={editingLead !== null ? handleEditChange : handleChange} 
                  placeholder="Enter candidate's full name" 
                  className={`w-full px-3 py-2 border rounded text-sm focus:outline-none ${
                    errors.candidateName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  aria-invalid={errors.candidateName ? 'true' : 'false'}
                  aria-describedby={errors.candidateName ? 'candidateName-error' : undefined}
                />
                {errors.candidateName && (
                  <p id="candidateName-error" className="mt-1 text-sm text-red-600">
                    {errors.candidateName}
                  </p>
                )}
              </div>
              
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                <input 
                  type="text" 
                  name="contactNumber" 
                  value={editingLead !== null ? editFormData.contactNumber : formData.contactNumber} 
                  onChange={editingLead !== null ? handleEditChange : handleChange} 
                  placeholder="Enter 10-digit contact number" 
                  className={`w-full px-3 py-2 border rounded text-sm focus:outline-none ${
                    errors.contactNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  aria-invalid={errors.contactNumber ? 'true' : 'false'}
                  aria-describedby={errors.contactNumber ? 'contactNumber-error' : undefined}
                />
                {errors.contactNumber && (
                  <p id="contactNumber-error" className="mt-1 text-sm text-red-600">
                    {errors.contactNumber}
                  </p>
                )}
              </div>
              
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input 
                  type="email" 
                  name="email" 
                  value={editingLead !== null ? editFormData.email : formData.email} 
                  onChange={editingLead !== null ? handleEditChange : handleChange} 
                  placeholder="Enter email address" 
                  className={`w-full px-3 py-2 border rounded text-sm focus:outline-none ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="mt-1 text-sm text-red-600">
                    {errors.email}
                  </p>
                )}
              </div>
              
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL *</label>
                <input 
                  type="text" 
                  name="linkedinId" 
                  value={editingLead !== null ? editFormData.linkedinId : formData.linkedinId} 
                  onChange={editingLead !== null ? handleEditChange : handleChange} 
                  placeholder="Enter LinkedIn profile URL" 
                  className={`w-full px-3 py-2 border rounded text-sm focus:outline-none ${
                    errors.linkedinId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  aria-invalid={errors.linkedinId ? 'true' : 'false'}
                  aria-describedby={errors.linkedinId ? 'linkedinId-error' : undefined}
                />
                {errors.linkedinId && (
                  <p id="linkedinId-error" className="mt-1 text-sm text-red-600">
                    {errors.linkedinId}
                  </p>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Technology *</label>
                <input 
                  type="text" 
                  name="technology" 
                  value={editingLead !== null ? editFormData.technology : formData.technology} 
                  onChange={editingLead !== null ? handleEditChange : handleChange} 
                  placeholder="Enter technology stack" 
                  className={`w-full px-3 py-2 border rounded text-sm focus:outline-none ${
                    errors.technology ? 'border-red-500' : 'border-gray-300'
                  }`}
                  aria-invalid={errors.technology ? 'true' : 'false'}
                  aria-describedby={errors.technology ? 'technology-error' : undefined}
                />
                {errors.technology && (
                  <p id="technology-error" className="mt-1 text-sm text-red-600">
                    {errors.technology}
                  </p>
                )}
              </div>
              
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                <input 
                  type="text" 
                  name="country" 
                  value={editingLead !== null ? editFormData.country : formData.country} 
                  onChange={editingLead !== null ? handleEditChange : handleChange} 
                  placeholder="Enter country name" 
                  className={`w-full px-3 py-2 border rounded text-sm focus:outline-none ${
                    errors.country ? 'border-red-500' : 'border-gray-300'
                  }`}
                  aria-invalid={errors.country ? 'true' : 'false'}
                  aria-describedby={errors.country ? 'country-error' : undefined}
                />
                {errors.country && (
                  <p id="country-error" className="mt-1 text-sm text-red-600">
                    {errors.country}
                  </p>
                )}
              </div>
              
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Visa Status *</label>
                <input 
                  type="text" 
                  name="visaStatus" 
                  value={editingLead !== null ? editFormData.visaStatus : formData.visaStatus} 
                  onChange={editingLead !== null ? handleEditChange : handleChange} 
                  placeholder="Enter visa status" 
                  className={`w-full px-3 py-2 border rounded text-sm focus:outline-none ${
                    errors.visaStatus ? 'border-red-500' : 'border-gray-300'
                  }`}
                  aria-invalid={errors.visaStatus ? 'true' : 'false'}
                  aria-describedby={errors.visaStatus ? 'visaStatus-error' : undefined}
                />
                {errors.visaStatus && (
                  <p id="visaStatus-error" className="mt-1 text-sm text-red-600">
                    {errors.visaStatus}
                  </p>
                )}
              </div>
              
              <div className="relative col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks *</label>
                <textarea 
                  name="remarks" 
                  value={editingLead !== null ? editFormData.remarks : formData.remarks} 
                  onChange={editingLead !== null ? handleEditChange : handleChange} 
                  placeholder="Enter any additional remarks" 
                  className={`w-full px-3 py-2 border rounded text-sm focus:outline-none ${
                    errors.remarks ? 'border-red-500' : 'border-gray-300'
                  }`}
                  aria-invalid={errors.remarks ? 'true' : 'false'}
                  aria-describedby={errors.remarks ? 'remarks-error' : undefined}
                />
                {errors.remarks && (
                  <p id="remarks-error" className="mt-1 text-sm text-red-600">
                    {errors.remarks}
                  </p>
                )}
              </div>
            </div>
          </div>



          {/* Right Section - Bulk Upload */}
          <div className="w-1/4  p-5 ">
            <div className="border-2 border-gray-100 rounded-lg p-5 bg-white shadow-lg mt-6 ">
              <h4 className="text-base font-medium text-gray-900 mb-4">Bulk Lead</h4>
              <div className="text-center mb-3">
                 <button 
                onClick={exportToExcel}
                className="align-center  p-2 hover:bg-gray-100 rounded cursor-pointer "
                title="Export to Excel"
              >
                <img 
                  src={LogoIcon}
                  alt="Excel" 
                  className="w-8 h-8 align-center "
                />
              </button>
              </div>
              <p className=''>Download the sample file , Enter the data of leads into it and upload the bulk lead from Brouse button.</p>
              <p>Note: Don't change the header and the filename.</p>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                      setUploadSuccess(false); // Reset success message
                    }
                  }}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <button
                  onClick={handleFileUpload}
                  className="flex items-center gap-1 px-3 py-1 bg-indigo-800 text-white rounded hover:bg-indigo-800 "
                  title="Upload selected file"
                >
                  
                  <p className='font-bold'> &uarr; </p>
                </button>
              </div>
              {uploadSuccess && (
                <p className="text-green-600 mt-2 text-sm">File uploaded successfully!</p>
              )}
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div className="my-5 ml-28">
          <input
            type="text"
            placeholder="Search by name, email or technology..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-2/5 px-2 py-2 text-base border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden ml-24">
          <div className="px-5 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-gray-900">Submitted Leads</h3>
              
            </div>
            <div className="flex items-center space-x-3">
              <select 
                className="border px-2 py-1 rounded"
                value={selectedSalesPerson}
                onChange={(e) => {
                  setSelectedSalesPerson(e.target.value);
                  if (e.target.value) {
                    setCurrentSalesPerson(''); // Reset current sales person when selecting a new one
                  }
                }}
              >
                <option value="">Sales Person</option>
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
                className={`${getButtonProps().color} text-white px-4 py-2 rounded-3xl text-sm font-medium transition-colors duration-200`}
                onClick={handleAssignSalesPerson}
                disabled={!selectedSalesPerson || selectedLeads.length === 0}
              >
                {getButtonProps().text}
              </button>
              <select 
                className="border px-2 py-1 rounded ml-4"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse mt-5">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-3 border-b">
                    <input 
                      type="checkbox" 
                      checked={selectedLeads.length === paginatedLeads.length}
                      onChange={handleSelectAll}
                    />
                  </th>

                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200">
                    Sr. No
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200">
                    Date & Time
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200">
                    Candidate Name
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200">
                    Contact
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200">
                    Email
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200">
                    LinkedIn
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200">
                    Visa
                  </th>
                  
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200">
                    Country
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200">
                    Sales
                  </th>
                  
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {paginatedLeads.map((lead: Lead, index: number) => (
                  <tr key={index}>
                    <td className="px-3 py-3 border-b">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(index)}
                        onChange={() => handleCheckboxChange(index)}
                      />
                    </td>

                    <td className="px-3 py-3 text-left border-b border-gray-200 text-sm text-gray-900">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-3 py-3 text-left border-b border-gray-200 text-sm text-gray-900">
                      {new Date().toLocaleString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </td>
                    <td className="px-3 py-3 text-left border-b border-gray-200 text-sm text-gray-900">
                      {lead.candidateName}
                    </td>
                    <td className="px-3 py-3 text-left border-b border-gray-200 text-sm text-gray-900">
                      {lead.contactNumber}
                    </td>
                    <td className="px-3 py-3 text-left border-b border-gray-200 text-sm text-gray-900">
                      {lead.email}
                    </td>
                    <td className="px-3 py-3 text-left border-b border-gray-200 text-sm">
                      <a 
                        href={lead.linkedinId} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-900 hover:underline"
                      >
                        LinkedIn
                      </a>
                    </td>
                    <td className="px-3 py-3 text-left border-b border-gray-200 text-sm text-gray-900">{lead.visaStatus}</td>
                    <td className="px-3 py-3 text-left border-b border-gray-200 text-sm text-gray-900">{lead.country}</td>
                    <td className="px-3 py-3 border-b border-gray-200 text-sm text-gray-900">
                      {lead.salesPerson || '--'}
                      {lead.salesPerson && (
                        <span className="ml-2 inline-flex items-center">
                          <button
                            className=" p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                            title={lead.assignmentDate ? new Date(lead.assignmentDate).toLocaleString() : ''}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 " fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center border-b border-gray-200">
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
                          <div className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg  max-w-md mx-auto top-20  transform -translate-x-1/2 p-6">
                            <div className="space-y-4 ">
                              <div className="flex justify-between items-center ">
                                <h3 className="text-lg font-semibold text-gray-900">Remarks</h3>
                                <button 
                                  onClick={handleCloseInfoDialog}
                                  className="w-2 -mt-8 ml-16"
                                >
                                  <svg className="w-4 text-center" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <p className="font-medium text-gray-900">Candidate Name:</p>
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
                    <td className="px-3 py-3 text-center border-b border-gray-200">
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

          {/* Pagination Controls */}
          <div className="flex justify-center items-center mt-4 mb-6">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 mx-2 bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 mx-2 bg-gray-100 rounded text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 mx-2 bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeadCreationComponent;