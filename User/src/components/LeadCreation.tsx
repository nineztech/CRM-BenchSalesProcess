import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import xls_logo from '../../assets/xls_logo.webp';
import iconn from '../../assets/iconn.png';
import SpreadsheetEditor from './SpreadsheetEditor';
import Badge from '@mui/material/Badge';

import './LeadCreation.css';

interface Lead {
  candidateName: string;
  contactNumber: string;
  email: string;
  linkedinId: string;
  technology: string;
  country: string;
  visaStatus: string;
  remark: string;
  sales?: string;
}

const LeadCreation: React.FC = () => {
  const [formData, setFormData] = useState<Lead>({
    candidateName: '',
    contactNumber: '',
    email: '',
    linkedinId: '',
    technology: '',
    country: '',
    visaStatus: '',
    remark: '',
  });

  const [showEditor, setShowEditor] = useState(false);
  const [errors, setErrors] = useState<Partial<Lead>>({});
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [selectedSales, setSelectedSales] = useState('');
  const [recordsPerPage, setRecordsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const handleLogoClick = () => setShowEditor(true);

  useEffect(() => {
    const storedLeads = localStorage.getItem('leads');
    if (storedLeads) setLeads(JSON.parse(storedLeads));
  }, []);

  useEffect(() => {
    localStorage.setItem('leads', JSON.stringify(leads));
  }, [leads]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Lead> = {};
    if (!formData.candidateName.trim()) newErrors.candidateName = 'Candidate Name is required';
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact Number is required';
    } else if (!/^\d{10}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Contact Number must be 10 digits';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email is not valid';
    }
    if (formData.linkedinId && !/^https?:\/\/(www\.)?linkedin\.com/.test(formData.linkedinId)) {
      newErrors.linkedinId = 'LinkedIn URL is not valid';
    }
    if (!formData.technology.trim()) newErrors.technology = 'Technology is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    if (!formData.visaStatus.trim()) newErrors.visaStatus = 'Visa Status is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const updatedLeads = [...leads, { ...formData }];
    setLeads(updatedLeads);
    setFormData({
      candidateName: '',
      contactNumber: '',
      email: '',
      linkedinId: '',
      technology: '',
      country: '',
      visaStatus: '',
      remark: '',
    });
    setErrors({});
    alert('Lead created successfully!');
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name !== 'Lead.xlsx') {
      alert('Please upload the original file named "Lead.xlsx" only.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      if (!bstr) return;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<Lead>(worksheet);
      const updatedLeads = [...leads, ...jsonData];
      setLeads(updatedLeads);
    };
    reader.readAsBinaryString(file);
  };

  const handleCheckboxChange = (index: number) => {
    setSelectedLeads((prevSelected) =>
      prevSelected.includes(index)
        ? prevSelected.filter((i) => i !== index)
        : [...prevSelected, index]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map((_, index) => index));
    }
  };

  const handleAssignSales = () => {
    if (!selectedSales) {
      alert('Please select a sales option before assigning.');
      return;
    }

    const updatedLeads = leads.map((lead, index) =>
      selectedLeads.includes(index) ? { ...lead, sales: selectedSales } : lead
    );

    setLeads(updatedLeads);
    setSelectedLeads([]);
    setSelectedSales('');
  };

  const filteredLeads = leads.filter(lead =>
    lead.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.technology.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLeads.length / recordsPerPage);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="lead-container">
      <div className="lead-layout">
        {/* Form and Upload Panel */}
        <div className="lead-left">
          <div className="title-and-button">
            <h3>Create New Lead</h3>
            <button type="submit" form="lead-form" className="submit-button inline-btn">Create</button>
          </div>
          <form id="lead-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <input type="text" name="candidateName" value={formData.candidateName} onChange={handleChange} placeholder="Candidate Name *" />
                {errors.candidateName && <small className="error">{errors.candidateName}</small>}
              </div>
              <div className="form-group">
                <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} placeholder="Contact Number *" />
                {errors.contactNumber && <small className="error">{errors.contactNumber}</small>}
              </div>
              <div className="form-group">
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email *" />
                {errors.email && <small className="error">{errors.email}</small>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <input type="text" name="linkedinId" value={formData.linkedinId} onChange={handleChange} placeholder="LinkedIn ID *" />
                {errors.linkedinId && <small className="error">{errors.linkedinId}</small>}
              </div>
              <div className="form-group">
                <input type="text" name="technology" value={formData.technology} onChange={handleChange} placeholder="Technology *" />
                {errors.technology && <small className="error">{errors.technology}</small>}
              </div>
              <div className="form-group">
                <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="Country *" />
                {errors.country && <small className="error">{errors.country}</small>}
              </div>
              <div className="form-group">
                <select name="visaStatus" value={formData.visaStatus} onChange={handleChange} >
                  <option value="">Select Visa Status *</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                </select>
                {errors.visaStatus && <small className="error">{errors.visaStatus}</small>}
              </div>
              <div className="form-group">
                <input type="text" name="remark" value={formData.remark} onChange={handleChange} placeholder="Remark" />
              </div>
            </div>
          </form>
        </div>

        <div className="lead-right">
          <div className="right-card">
            <h4>Bulk Lead</h4>
            <img
              src={xls_logo}
              alt="XLS Logo"
              className='logo'
              style={{ cursor: 'pointer' }}
            />
            {showEditor && <SpreadsheetEditor />}
            <input
              type="file"
              accept=".xlsx"
              onChange={handleUpload}
              style={{ marginTop: '10px' }}
            />

            <p className='p'>Download the sample file , Enter the data of leads into it and upload the bulk lead from Brouse button.</p>
            <p>Note: Don't change the header and the filename.</p>
          </div>
          
        </div>
      </div>

      {/* Search Box */}
      <div className="search-box" style={{ margin: '20px 0', textAlign: 'center' }}>
        <input
          type="text"
          placeholder="Search by name, email or technology..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '8px', width: '60%', fontSize: '16px' }}
        />
      </div>

      {/* Table Header with Dropdown */}
      <div className="lead-table-wrapper">
        <div className="lead-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3>Submitted Leads</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select value={selectedSales} onChange={(e) => setSelectedSales(e.target.value)}>
              <option value="">Select Sales</option>
              <option value="Aneri"> Aneri</option>
              <option value="Dhaval">Dhaval</option>
              <option value="Rajdeep">Rajdeep</option>
              <option value="Payal">Payal</option>
            </select>
            <button className="assign-button" onClick={handleAssignSales}>Assign</button>
            <select value={recordsPerPage} className="value"  onChange={(e) => {
              setRecordsPerPage(Number(e.target.value));
              setCurrentPage(1); // Reset to first page
            }}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <table className="lead-table">
          <thead>
            <tr>
              <th><input type="checkbox" onChange={handleSelectAll} checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0} /></th>
              <th>Sr. No.</th>
              <th>Date & Time</th>
              <th>Candidate Name</th>
              <th>Contact</th>
              <th>Email</th>
              <th>LinkedIn</th>
              <th>Visa</th>
              <th>Country</th>
              <th>Sales</th>
              <th>Remark</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLeads.map((lead, index) => (
              <tr key={index}>
                <td><input type="checkbox" checked={selectedLeads.includes(index)} onChange={() => handleCheckboxChange(index)} /></td>
                <td>{(currentPage - 1) * recordsPerPage + index + 1}</td>
                <td>{new Date().toLocaleString()}</td>
                <td>{lead.candidateName}</td>
                <td>{lead.contactNumber}</td>
                <td>{lead.email}</td>
                <td><a href={lead.linkedinId} target="_blank" rel="noopener noreferrer">LinkedIn</a></td>
                <td>{lead.visaStatus}</td>
                <td>{lead.country}</td>
                <td>{lead.sales || '--'}</td>
                <td>{lead.remark}</td>
                <td>
                  <div className="status-info-wrapper">
 <img
              src={iconn}
              alt="XLS Logo"
              className='i_btn'
              style={{ cursor: 'pointer' }}
            />
                    <Badge color="primary" className='count' badgeContent={1} showZero></Badge>

                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="pagination-controls" style={{ marginTop: '15px', textAlign: 'center' }}>
          <button onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1}>Prev</button>
          <span style={{ margin: '0 10px' }}>Page {currentPage} of {totalPages}</span>
          <button onClick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default LeadCreation;
