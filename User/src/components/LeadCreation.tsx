import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import xls_logo from '../../assets/xls_logo.webp';
import SpreadsheetEditor from './SpreadsheetEditor';
import './LeadCreation.css';

interface Lead {
  executiveName: string;
  candidateName: string;
  contactNumber: string;
  email: string;
  linkedinId: string;
  technology: string;
  country: string;
  visaStatus: string;
}



const LeadCreation: React.FC = () => {
  const [formData, setFormData] = useState<Lead>({
    executiveName: '',
    candidateName: '',
    contactNumber: '',
    email: '',
    linkedinId: '',
    technology: '',
    country: '',
    visaStatus: '',
  });


  
  const [showEditor, setShowEditor] = useState(false);

    const handleLogoClick = () => {
    setShowEditor(true);
  };

  

  const [errors, setErrors] = useState<Partial<Lead>>({});
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const storedLeads = localStorage.getItem('leads');
    if (storedLeads) setLeads(JSON.parse(storedLeads));
  }, []);

  useEffect(() => {
    localStorage.setItem('leads', JSON.stringify(leads));
  }, [leads]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Lead> = {};
    if (!formData.executiveName.trim()) newErrors.executiveName = 'Executive Name is required';
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
    const updatedLeads = [...leads, formData];
    setLeads(updatedLeads);
    setFormData({
      executiveName: '',
      candidateName: '',
      contactNumber: '',
      email: '',
      linkedinId: '',
      technology: '',
      country: '',
      visaStatus: '',
    });
    setErrors({});
    alert('Lead created successfully!');
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/Lead.xlsx';
    link.download = 'Lead.xlsx';
    link.click();
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

  const filteredLeads = leads.filter(lead =>
    lead.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.technology.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="lead-container">
      <div className="lead-layout">
        <div className="lead-left">
          <div className="title-and-button">
            <h3>Create New Lead</h3>
            <button type="submit" form="lead-form" className="submit-button inline-btn">Create</button>
          </div>
          <form id="lead-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <input type="text" name="executiveName" value={formData.executiveName} onChange={handleChange} placeholder="Executive Name" />
                {errors.executiveName && <small className="error">{errors.executiveName}</small>}
              </div>
              <div className="form-group">
                <input type="text" name="candidateName" value={formData.candidateName} onChange={handleChange} placeholder="Candidate Name" />
                {errors.candidateName && <small className="error">{errors.candidateName}</small>}
              </div>
              <div className="form-group">
                <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} placeholder="Contact Number" />
                {errors.contactNumber && <small className="error">{errors.contactNumber}</small>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" />
                {errors.email && <small className="error">{errors.email}</small>}
              </div>
              <div className="form-group">
                <input type="text" name="linkedinId" value={formData.linkedinId} onChange={handleChange} placeholder="LinkedIn ID" />
                {errors.linkedinId && <small className="error">{errors.linkedinId}</small>}
              </div>
              <div className="form-group">
                <input type="text" name="technology" value={formData.technology} onChange={handleChange} placeholder="Technology" />
                {errors.technology && <small className="error">{errors.technology}</small>}
              </div>
              <div className="form-group">
                <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="Country" />
                {errors.country && <small className="error">{errors.country}</small>}
              </div>
              <div className="form-group">
                <input type="text" name="visaStatus" value={formData.visaStatus} onChange={handleChange} placeholder="Visa Status" />
                {errors.visaStatus && <small className="error">{errors.visaStatus}</small>}
              </div>
              <div className="form-group">
               
              </div>
            </div>
          </form>
        </div>

        <div className="lead-right">
          <div className="right-card">
            <h4>Bulk Lead</h4>
            {/* <div className="xls-logo" onClick={handleDownload} style={{ cursor: 'pointer' }}>
              <img src={xls_logo} alt="Download Excel Template" className="logo" />
            </div> */}
            <div>
      <img
        src={xls_logo}
        alt="XLS Logo"
        className='logo'
        style={{ cursor: 'pointer' }}
        onClick={handleLogoClick}
      />
      {showEditor && <SpreadsheetEditor />}
    </div>
    <input
              type="file"
              accept=".xlsx"
              onChange={handleUpload}
              style={{ marginTop: '10px' }}
            />
        </div>
            
          </div>
          
      </div>

      <div className="search-box" style={{ margin: '20px 0', textAlign: 'center' }}>
        <input
          type="text"
          placeholder="Search by name, email or technology..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '8px', width: '60%', fontSize: '16px' }}
        />
      </div>

      <div className="lead-table-wrapper">
        <h3>Submitted Leads</h3>
          <table className="lead-table">
            <thead>
              <tr>
                <th>Candidate Name</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Linkedin</th>
                <th>Visa</th>
                <th>Time</th>
                <th>Country</th>
                <th>Sales</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
            
              
            </tbody>
          </table>
        </div>
      </div>
  );
};

export default LeadCreation;
