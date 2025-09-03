import React, { useState, useEffect } from 'react';
import { 
  type ResumeChecklist, 
  type CreateResumeChecklistRequest,
  resumeChecklistService 
} from '../services/resumeChecklistService';

interface ResumeChecklistFormProps {
  existingChecklist?: ResumeChecklist;
  onSave: (checklist: ResumeChecklist) => void;
  onCancel: () => void;
}

const ResumeChecklistForm: React.FC<ResumeChecklistFormProps> = ({
  existingChecklist,
  onSave,
  onCancel
}) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateResumeChecklistRequest>({
    personalInformation: {
      fullName: '',
      email: '',
      phone: '',
      dateOfBirth: ''
    },
    educationalInformation: {
      degrees: [{
        degreeType: '',
        major: '',
        university: '',
        location: '',
        startDate: { month: '', year: '' },
        endDate: { month: '', year: '' }
      }]
    },
    technicalInformation: {
      skills: [''],
      technologies: ''
    },
    currentInformation: {
      entryDate: '',
      currentLocation: {
        address: '',
        postalCode: ''
      }
    },
    addressHistory: [{
      state: '',
      country: '',
      from: '',
      to: ''
    }],
    visaExperienceCertificate: {
      currentVisaStatus: '',
      cptStatus: '',
      eadStartDate: '',
      hasExperience: false,
      certifications: ['']
    },
    remarks: '',
    status: 'draft'
  });

  const sections = [
    'Personal Information',
    'Educational Information', 
    'Technical Information',
    'Current Information',
    'Address History',
    'Visa/Experience/Certificate',
    'Remarks'
  ];

  useEffect(() => {
    if (existingChecklist) {
      setFormData({
        personalInformation: existingChecklist.personalInformation,
        educationalInformation: existingChecklist.educationalInformation,
        technicalInformation: existingChecklist.technicalInformation,
        currentInformation: existingChecklist.currentInformation,
        addressHistory: existingChecklist.addressHistory,
        visaExperienceCertificate: existingChecklist.visaExperienceCertificate,
        remarks: existingChecklist.remarks || '',
        status: existingChecklist.status
      });
    }
  }, [existingChecklist]);

  const handleInputChange = (section: string, field: string, value: any, index?: number) => {
    setFormData(prev => {
      const newData = { ...prev };
      
      if (index !== undefined) {
        if (section === 'educationalInformation' && field === 'degrees') {
          newData.educationalInformation.degrees[index] = { ...newData.educationalInformation.degrees[index], ...value };
        } else if (section === 'addressHistory') {
          newData.addressHistory[index] = { ...newData.addressHistory[index], ...value };
        } else if (section === 'technicalInformation' && field === 'skills') {
          newData.technicalInformation.skills[index] = value;
        } else if (section === 'visaExperienceCertificate' && field === 'certifications') {
          newData.visaExperienceCertificate.certifications[index] = value;
        }
      } else {
        if (section === 'personalInformation') {
          newData.personalInformation = { ...newData.personalInformation, [field]: value };
        } else if (section === 'technicalInformation') {
          newData.technicalInformation = { ...newData.technicalInformation, [field]: value };
        } else if (section === 'currentInformation') {
          if (field === 'currentLocation') {
            newData.currentInformation.currentLocation = { ...newData.currentInformation.currentLocation, ...value };
          } else {
            newData.currentInformation = { ...newData.currentInformation, [field]: value };
          }
        } else if (section === 'visaExperienceCertificate') {
          newData.visaExperienceCertificate = { ...newData.visaExperienceCertificate, [field]: value };
        } else if (section === 'remarks') {
          newData.remarks = value;
        }
      }
      
      return newData;
    });
  };

  const addDegree = () => {
    setFormData(prev => ({
      ...prev,
      educationalInformation: {
        ...prev.educationalInformation,
        degrees: [...prev.educationalInformation.degrees, {
          degreeType: '',
          major: '',
          university: '',
          location: '',
          startDate: { month: '', year: '' },
          endDate: { month: '', year: '' }
        }]
      }
    }));
  };

  const removeDegree = (index: number) => {
    setFormData(prev => ({
      ...prev,
      educationalInformation: {
        ...prev.educationalInformation,
        degrees: prev.educationalInformation.degrees.filter((_, i) => i !== index)
      }
    }));
  };

  const addAddress = () => {
    setFormData(prev => ({
      ...prev,
      addressHistory: [...prev.addressHistory, {
        state: '',
        country: '',
        from: '',
        to: ''
      }]
    }));
  };

  const removeAddress = (index: number) => {
    setFormData(prev => ({
      ...prev,
      addressHistory: prev.addressHistory.filter((_, i) => i !== index)
    }));
  };

  const addSkill = () => {
    setFormData(prev => ({
      ...prev,
      technicalInformation: {
        ...prev.technicalInformation,
        skills: [...prev.technicalInformation.skills, '']
      }
    }));
  };

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      technicalInformation: {
        ...prev.technicalInformation,
        skills: prev.technicalInformation.skills.filter((_, i) => i !== index)
      }
    }));
  };

  const addCertification = () => {
    setFormData(prev => ({
      ...prev,
      visaExperienceCertificate: {
        ...prev.visaExperienceCertificate,
        certifications: [...prev.visaExperienceCertificate.certifications, '']
      }
    }));
  };

  const removeCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      visaExperienceCertificate: {
        ...prev.visaExperienceCertificate,
        certifications: prev.visaExperienceCertificate.certifications.filter((_, i) => i !== index)
      }
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      let result;
      if (existingChecklist) {
        result = await resumeChecklistService.updateResumeChecklist(existingChecklist.id!, formData);
      } else {
        result = await resumeChecklistService.createResumeChecklist(formData);
      }
      
      if (result.success && result.data) {
        onSave(result.data);
      }
    } catch (error) {
      console.error('Error saving resume checklist:', error);
      alert('Failed to save resume checklist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const renderPersonalInformation = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={formData.personalInformation.fullName}
            onChange={(e) => handleInputChange('personalInformation', 'fullName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={formData.personalInformation.email}
            onChange={(e) => handleInputChange('personalInformation', 'email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone *
          </label>
          <input
            type="tel"
            value={formData.personalInformation.phone}
            onChange={(e) => handleInputChange('personalInformation', 'phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth (DD MM YYYY) *
          </label>
          <input
            type="text"
            placeholder="05 05 1997"
            value={formData.personalInformation.dateOfBirth}
            onChange={(e) => handleInputChange('personalInformation', 'dateOfBirth', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>
    </div>
  );

  const renderEducationalInformation = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Educational Information</h3>
        <button
          type="button"
          onClick={addDegree}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Degree
        </button>
      </div>

      {formData.educationalInformation.degrees.map((degree, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-medium text-gray-800">Degree {index + 1}</h4>
            {formData.educationalInformation.degrees.length > 1 && (
              <button
                type="button"
                onClick={() => removeDegree(index)}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Degree Type *
              </label>
              <select
                value={degree.degreeType}
                onChange={(e) => handleInputChange('educationalInformation', 'degrees', { degreeType: e.target.value }, index)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Degree Type</option>
                <option value="Bachelor's">Bachelor's</option>
                <option value="Master's">Master's</option>
                <option value="PhD">PhD</option>
                <option value="Associate">Associate</option>
                <option value="Diploma">Diploma</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Major *
              </label>
              <input
                type="text"
                value={degree.major}
                onChange={(e) => handleInputChange('educationalInformation', 'degrees', { major: e.target.value }, index)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                University *
              </label>
              <input
                type="text"
                value={degree.university}
                onChange={(e) => handleInputChange('educationalInformation', 'degrees', { university: e.target.value }, index)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                value={degree.location}
                onChange={(e) => handleInputChange('educationalInformation', 'degrees', { location: e.target.value }, index)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={degree.startDate.month}
                  onChange={(e) => handleInputChange('educationalInformation', 'degrees', { 
                    startDate: { ...degree.startDate, month: e.target.value }
                  }, index)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Month</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                      {String(i + 1).padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Year"
                  value={degree.startDate.year}
                  onChange={(e) => handleInputChange('educationalInformation', 'degrees', { 
                    startDate: { ...degree.startDate, year: e.target.value }
                  }, index)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={degree.endDate.month}
                  onChange={(e) => handleInputChange('educationalInformation', 'degrees', { 
                    endDate: { ...degree.endDate, month: e.target.value }
                  }, index)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Month</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                      {String(i + 1).padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Year"
                  value={degree.endDate.year}
                  onChange={(e) => handleInputChange('educationalInformation', 'degrees', { 
                    endDate: { ...degree.endDate, year: e.target.value }
                  }, index)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTechnicalInformation = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Technical Information</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Technologies *
        </label>
        <input
          type="text"
          placeholder="e.g., Python, JavaScript, React, Node.js"
          value={formData.technicalInformation.technologies}
          onChange={(e) => handleInputChange('technicalInformation', 'technologies', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Skills *
          </label>
          <button
            type="button"
            onClick={addSkill}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Add Skill
          </button>
        </div>
        
        {formData.technicalInformation.skills.map((skill, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={skill}
              onChange={(e) => handleInputChange('technicalInformation', 'skills', e.target.value, index)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {formData.technicalInformation.skills.length > 1 && (
              <button
                type="button"
                onClick={() => removeSkill(index)}
                className="px-3 py-2 text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderCurrentInformation = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Current Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Entry Date *
          </label>
          <input
            type="text"
            placeholder="e.g., Aug 2022"
            value={formData.currentInformation.entryDate}
            onChange={(e) => handleInputChange('currentInformation', 'entryDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address *
          </label>
          <input
            type="text"
            value={formData.currentInformation.currentLocation.address}
            onChange={(e) => handleInputChange('currentInformation', 'currentLocation', { address: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Postal Code *
          </label>
          <input
            type="text"
            value={formData.currentInformation.currentLocation.postalCode}
            onChange={(e) => handleInputChange('currentInformation', 'currentLocation', { postalCode: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>
    </div>
  );

  const renderAddressHistory = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Address History</h3>
        <button
          type="button"
          onClick={addAddress}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Address
        </button>
      </div>

      {formData.addressHistory.map((address, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-medium text-gray-800">Address {index + 1}</h4>
            {formData.addressHistory.length > 1 && (
              <button
                type="button"
                onClick={() => removeAddress(index)}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <input
                type="text"
                value={address.state}
                onChange={(e) => handleInputChange('addressHistory', '', { state: e.target.value }, index)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <input
                type="text"
                value={address.country}
                onChange={(e) => handleInputChange('addressHistory', '', { country: e.target.value }, index)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From *
              </label>
              <input
                type="text"
                placeholder="e.g., Aug 2022"
                value={address.from}
                onChange={(e) => handleInputChange('addressHistory', '', { from: e.target.value }, index)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To *
              </label>
              <input
                type="text"
                placeholder="e.g., Dec 2023 or Current"
                value={address.to}
                onChange={(e) => handleInputChange('addressHistory', '', { to: e.target.value }, index)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderVisaExperienceCertificate = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Visa/Experience/Certificate</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Visa Status *
          </label>
          <input
            type="text"
            placeholder="e.g., F1 OPT"
            value={formData.visaExperienceCertificate.currentVisaStatus}
            onChange={(e) => handleInputChange('visaExperienceCertificate', 'currentVisaStatus', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CPT Status *
          </label>
          <input
            type="text"
            placeholder="e.g., NA or Active"
            value={formData.visaExperienceCertificate.cptStatus}
            onChange={(e) => handleInputChange('visaExperienceCertificate', 'cptStatus', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            EAD Start Date *
          </label>
          <input
            type="text"
            placeholder="e.g., 9th sept 2024"
            value={formData.visaExperienceCertificate.eadStartDate}
            onChange={(e) => handleInputChange('visaExperienceCertificate', 'eadStartDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Has Experience *
          </label>
          <select
            value={formData.visaExperienceCertificate.hasExperience.toString()}
            onChange={(e) => handleInputChange('visaExperienceCertificate', 'hasExperience', e.target.value === 'true')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Certifications
          </label>
          <button
            type="button"
            onClick={addCertification}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Add Certification
          </button>
        </div>
        
        {formData.visaExperienceCertificate.certifications.map((cert, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={cert}
              onChange={(e) => handleInputChange('visaExperienceCertificate', 'certifications', e.target.value, index)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {formData.visaExperienceCertificate.certifications.length > 1 && (
              <button
                type="button"
                onClick={() => removeCertification(index)}
                className="px-3 py-2 text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderRemarks = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Remarks</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Comments
        </label>
        <textarea
          value={formData.remarks}
          onChange={(e) => handleInputChange('remarks', '', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Any additional information or comments..."
        />
      </div>
    </div>
  );

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 0: return renderPersonalInformation();
      case 1: return renderEducationalInformation();
      case 2: return renderTechnicalInformation();
      case 3: return renderCurrentInformation();
      case 4: return renderAddressHistory();
      case 5: return renderVisaExperienceCertificate();
      case 6: return renderRemarks();
      default: return null;
    }
  };

  return (
    <div className="w-full px-4 py-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold text-gray-900">
              Resume Checklist - {sections[currentSection]}
            </h2>
            <span className="text-sm text-gray-500">
              {currentSection + 1} of {sections.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {renderCurrentSection()}
        </div>

        {/* Navigation Buttons */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            type="button"
            onClick={prevSection}
            disabled={currentSection === 0}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            
            {currentSection === sections.length - 1 ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : existingChecklist ? 'Update' : 'Save'}
              </button>
            ) : (
              <button
                type="button"
                onClick={nextSection}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeChecklistForm;
