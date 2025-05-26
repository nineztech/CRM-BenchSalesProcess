import React, { useState, useEffect } from 'react';
import './LeadCreation.css';

interface Lead {
  date: string;
  lgeName: string;
  salesPerson: string;
  candidateName: string;
  contactNumber: string;
  linkedinId: string;
  email: string;
  technology: string;
  country: string;
  visaStatus: string;
  state: string;
  callTime: string;
}

const LeadCreation: React.FC = () => {
  const [formData, setFormData] = useState<Lead>({
    date: '',
    lgeName: '',
    salesPerson: '',
    candidateName: '',
    contactNumber: '',
    linkedinId: '',
    email: '',
    technology: '',
    country: '',
    visaStatus: '',
    state: '',
    callTime: ''
  });

  const [errors, setErrors] = useState<Partial<Lead>>({});
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const storedLeads = localStorage.getItem('leads');
    if (storedLeads) {
      setLeads(JSON.parse(storedLeads));
    }
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

    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.lgeName.trim()) newErrors.lgeName = 'LGE Name is required';
    if (!formData.salesPerson.trim()) newErrors.salesPerson = 'Sales Person is required';
    if (!formData.candidateName.trim()) newErrors.candidateName = 'Candidate Name is required';

    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact Number is required';
    } else if (!/^\d{10}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Contact Number must be 10 digits';
    }

    if (formData.linkedinId && !/^https?:\/\/(www\.)?linkedin\.com/.test(formData.linkedinId)) {
      newErrors.linkedinId = 'LinkedIn URL is not valid';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email is not valid';
    }

    if (!formData.technology.trim()) newErrors.technology = 'Technology is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    if (!formData.visaStatus.trim()) newErrors.visaStatus = 'Visa Status is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.callTime) newErrors.callTime = 'Call Time is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const updatedLeads = [...leads, formData];
    setLeads(updatedLeads);
    localStorage.setItem('leads', JSON.stringify(updatedLeads));

    setFormData({
      date: '',
      lgeName: '',
      salesPerson: '',
      candidateName: '',
      contactNumber: '',
      linkedinId: '',
      email: '',
      technology: '',
      country: '',
      visaStatus: '',
      state: '',
      callTime: ''
    });

    setErrors({});
    alert('Lead created successfully!');
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
                <input type="date" name="date" value={formData.date} onChange={handleChange} placeholder="Date" />
                {errors.date && <small className="error">{errors.date}</small>}
              </div>
              <div className="form-group">
                <input type="text" name="lgeName" value={formData.lgeName} onChange={handleChange} placeholder="LGE Name" />
                {errors.lgeName && <small className="error">{errors.lgeName}</small>}
              </div>
              <div className="form-group">
                <input type="text" name="salesPerson" value={formData.salesPerson} onChange={handleChange} placeholder="Sales Person" />
                {errors.salesPerson && <small className="error">{errors.salesPerson}</small>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <input type="text" name="candidateName" value={formData.candidateName} onChange={handleChange} placeholder="Candidate Name" />
                {errors.candidateName && <small className="error">{errors.candidateName}</small>}
              </div>
              <div className="form-group">
                <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} placeholder="Contact Number" />
                {errors.contactNumber && <small className="error">{errors.contactNumber}</small>}
              </div>
              <div className="form-group">
                <input type="text" name="linkedinId" value={formData.linkedinId} onChange={handleChange} placeholder="LinkedIn ID" />
                {errors.linkedinId && <small className="error">{errors.linkedinId}</small>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" />
                {errors.email && <small className="error">{errors.email}</small>}
              </div>
              <div className="form-group">
                <input type="text" name="technology" value={formData.technology} onChange={handleChange} placeholder="Technology" />
                {errors.technology && <small className="error">{errors.technology}</small>}
              </div>
              <div className="form-group">
                <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="Country" />
                {errors.country && <small className="error">{errors.country}</small>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <input type="text" name="visaStatus" value={formData.visaStatus} onChange={handleChange} placeholder="Visa Status" />
                {errors.visaStatus && <small className="error">{errors.visaStatus}</small>}
              </div>
              <div className="form-group">
                <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="State" />
                {errors.state && <small className="error">{errors.state}</small>}
              </div>
              <div className="form-group">
                <input type="datetime-local" name="callTime" value={formData.callTime} onChange={handleChange} placeholder="Call Time" />
                {errors.callTime && <small className="error">{errors.callTime}</small>}
              </div>
            </div>
          </form>
        </div>

        <div className="lead-right">
          <div className="right-card">
            <h4>Bulk Lead</h4>
          </div>
        </div>
      </div>

      {/* 🔍 Search Box */}
      <div className="search-box" style={{ margin: '20px 0', textAlign: 'center' }}>
        <input
          type="text"
          placeholder="Search by name, email or technology..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '8px', width: '60%', fontSize: '16px' }}
        />
      </div>

      {/* 📝 Leads Table */}
      <div className="lead-table-wrapper">
        <h3>Submitted Leads</h3>
        <div className="lead-table-container">
          <table className="lead-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Call Time</th>
                <th>Candidate</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Technology</th>
                <th>Sales Person</th>
                <th>State</th>
                <th>Country</th>
                <th>Visa</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead, index) => (
                <tr key={index}>
                  <td>{lead.date}</td>
                  <td>{lead.callTime}</td>
                  <td>{lead.candidateName}</td>
                  <td>{lead.email}</td>
                  <td>{lead.contactNumber}</td>
                  <td>{lead.technology}</td>
                  <td>{lead.salesPerson}</td>
                  <td>{lead.state}</td>
                  <td>{lead.country}</td>
                  <td>{lead.visaStatus}</td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '10px' }}>No leads found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeadCreation;
