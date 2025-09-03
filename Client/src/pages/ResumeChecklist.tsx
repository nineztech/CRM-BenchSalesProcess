import React, { useState, useEffect } from 'react';
import { 
  type ResumeChecklist, 
  resumeChecklistService 
} from '../services/resumeChecklistService';
import ResumeChecklistForm from '../components/ResumeChecklistForm';
import { FaFilePdf, FaUpload, FaTimes } from 'react-icons/fa';

const ResumeChecklistPage: React.FC = () => {
  const [checklist, setChecklist] = useState<ResumeChecklist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  useEffect(() => {
    fetchUserChecklist();
  }, []);

  const fetchUserChecklist = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await resumeChecklistService.getResumeChecklistsByUser();
      
      if (response.success && response.data) {
        const checklists = response.data.checklists;
        if (checklists.length > 0) {
          // Get the most recent checklist
          const mostRecent = checklists[0];
          setChecklist(mostRecent);
        }
      }
    } catch (error) {
      console.error('Error fetching resume checklist:', error);
      setError('Failed to load resume checklist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = (savedChecklist: ResumeChecklist) => {
    setChecklist(savedChecklist);
    setShowForm(false);
    // Show success message
    alert('Resume checklist saved successfully!');
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  const handleEdit = () => {
    setShowForm(true);
  };

  const handleResumePreview = async (resumePath: string | null, checklistId: number) => {
    if (!resumePath) {
      alert('No resume available');
      return;
    }
    try {
      const blob = await resumeChecklistService.getChecklistResume(checklistId);
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
      setShowResumePreview(true);
    } catch (error) {
      console.error('Error fetching resume:', error);
      alert('Failed to load resume');
    }
  };

  const handleResumeUpload = async (file: File) => {
    if (!checklist?.id) {
      alert('No checklist found');
      return;
    }

    setIsUploadingResume(true);
    try {
      const response = await resumeChecklistService.uploadChecklistResume(checklist.id, file);
      if (response.success) {
        setChecklist(prev => prev ? {
          ...prev,
          resume: response.data?.resumePath || null,
          isResumeUpdated: true
        } : null);
        alert('Resume uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Failed to upload resume');
    } finally {
      setIsUploadingResume(false);
    }
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading resume checklist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchUserChecklist}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ResumeChecklistForm
          existingChecklist={checklist || undefined}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ResumeChecklistForm
          existingChecklist={undefined}
          onSave={handleSave}
          onCancel={() => window.history.back()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 py-6">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Resume Checklist</h1>
                <p className="text-gray-600 mt-1">
                  Status: <span className={`font-medium ${
                    checklist.status === 'completed' ? 'text-green-600' :
                    checklist.status === 'submitted' ? 'text-blue-600' :
                    'text-yellow-600'
                  }`}>
                    {checklist.status.charAt(0).toUpperCase() + checklist.status.slice(1)}
                  </span>
                </p>
              </div>
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit Checklist
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-10">
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-600">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center ">
                  <span className="text-sm font-semibold text-gray-600 ">Full Name:</span>
                  <span className="text-gray-900 font-medium">{checklist.personalInformation.fullName}</span>
                </div>
                <div className="flex items-center ">
                  <span className="text-sm font-semibold text-gray-600 ">Email:</span>
                  <span className="text-gray-900 font-medium">{checklist.personalInformation.email}</span>
                </div>
                <div className="flex items-center ">
                  <span className="text-sm font-semibold text-gray-600 ">Phone:</span>
                  <span className="text-gray-900 font-medium">{checklist.personalInformation.phone}</span>
                </div>
                <div className="flex items-center ">
                  <span className="text-sm font-semibold text-gray-600 ">Date of Birth:</span>
                  <span className="text-gray-900 font-medium">{checklist.personalInformation.dateOfBirth}</span>
                </div>
              </div>
            </div>

            {/* Educational Information */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-600">Educational Information</h3>
              <div className="space-y-6">
                {checklist.educationalInformation.degrees.map((degree, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                    <h4 className="font-bold text-lg text-gray-900 mb-4 text-blue-700">{degree.degreeType} in {degree.major}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600 font-semibold min-w-[80px]">University:</span>
                        <span className="text-gray-900 font-medium">{degree.university}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600 font-semibold min-w-[80px]">Location:</span>
                        <span className="text-gray-900 font-medium">{degree.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600 font-semibold min-w-[80px]">Duration:</span>
                        <span className="text-gray-900 font-medium">{degree.startDate.month}/{degree.startDate.year} - {degree.endDate.month}/{degree.endDate.year}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Information */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-purple-600">Technical Information</h3>
              <div className="space-y-6">
                <div className="flex items-start ">
                  <span className="text-sm font-semibold text-gray-600 min-w-[120px] mt-1">Technologies:</span>
                  <p className="text-gray-900 font-medium flex-1">{checklist.technicalInformation.technologies}</p>
                </div>
                <div className="flex items-start ">
                  <span className="text-sm font-semibold text-gray-600 min-w-[120px] mt-1">Skills:</span>
                  <div className="flex flex-wrap gap-2 flex-1">
                    {checklist.technicalInformation.skills.map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium border border-blue-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Current Information */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-orange-600">Current Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center ">
                  <span className="text-sm font-semibold text-gray-600 ">Entry Date:</span>
                  <span className="text-gray-900 font-medium">{checklist.currentInformation.entryDate}</span>
                </div>
                <div className="flex items-start ">
                  <span className="text-sm font-semibold text-gray-600  mt-1">Current Location:</span>
                  <span className="text-gray-900 font-medium flex-1">
                    {checklist.currentInformation.currentLocation.address}, {checklist.currentInformation.currentLocation.postalCode}
                  </span>
                </div>
              </div>
            </div>

            {/* Address History */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-indigo-600">Address History</h3>
              <div className="space-y-4">
                {checklist.addressHistory.map((address, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600 font-semibold min-w-[80px]">Location:</span>
                        <span className="text-gray-900 font-medium">{address.state}, {address.country}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600 font-semibold min-w-[80px]">Duration:</span>
                        <span className="text-gray-900 font-medium">{address.from} - {address.to}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visa/Experience/Certificate */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-red-600">Visa/Experience/Certificate</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center ">
                  <span className="text-sm font-semibold text-gray-600 min-w-[140px]">Current Visa Status:</span>
                  <span className="text-gray-900 font-medium">{checklist.visaExperienceCertificate.currentVisaStatus}</span>
                </div>
                <div className="flex items-center ">
                  <span className="text-sm font-semibold text-gray-600 min-w-[140px]">CPT Status:</span>
                  <span className="text-gray-900 font-medium">{checklist.visaExperienceCertificate.cptStatus}</span>
                </div>
                <div className="flex items-center ">
                  <span className="text-sm font-semibold text-gray-600 min-w-[140px]">EAD Start Date:</span>
                  <span className="text-gray-900 font-medium">{checklist.visaExperienceCertificate.eadStartDate}</span>
                </div>
                <div className="flex items-center ">
                  <span className="text-sm font-semibold text-gray-600 min-w-[140px]">Has Experience:</span>
                  <span className={`font-medium ${checklist.visaExperienceCertificate.hasExperience ? 'text-green-600' : 'text-red-600'}`}>
                    {checklist.visaExperienceCertificate.hasExperience ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              
              {checklist.visaExperienceCertificate.certifications.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-start ">
                    <span className="text-sm font-semibold text-gray-600 min-w-[140px] mt-1">Certifications:</span>
                    <div className="flex flex-wrap gap-2 flex-1">
                      {checklist.visaExperienceCertificate.certifications.map((cert, index) => (
                        <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium border border-green-200">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Resume Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-600">Resume</h3>
              
              {checklist.resume ? (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleResumePreview(checklist.resume || null, checklist.id!)}
                    className="text-blue-600 hover:text-blue-900 flex items-center gap-2"
                  >
                    <FaFilePdf className="w-4 h-4" />
                    <span>View Resume</span>
                  </button>
                  
                  {!checklist.isResumeUpdated && (
                    <label className="flex justify-center px-4 py-2 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 transition-colors bg-blue-50 cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleResumeUpload(file);
                        }}
                        disabled={isUploadingResume}
                      />
                      <div className="flex items-center gap-2">
                        <FaUpload className="w-4 h-4" />
                        <span className="text-sm text-blue-600">
                          {isUploadingResume ? 'Uploading...' : 'Update Resume'}
                        </span>
                      </div>
                    </label>
                  )}
                  
                  {checklist.isResumeUpdated && (
                    <span className="text-sm text-green-600 font-medium">
                      Resume Updated
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">No resume available</p>
                  <label className="flex justify-center px-4 py-4 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 transition-colors bg-blue-50 cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleResumeUpload(file);
                      }}
                      disabled={isUploadingResume}
                    />
                    <div className="space-y-1 text-center">
                      <FaUpload className="mx-auto h-8 w-8 text-blue-400" />
                      <p className="text-sm text-gray-600">
                        <span className="text-blue-600">Click to upload</span> resume
                      </p>
                      <p className="text-xs text-gray-500">PDF up to 5MB</p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* Remarks */}
            {checklist.remarks && (
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-600">Remarks</h3>
                <div className="bg-white p-5 rounded-lg border border-gray-200">
                  <p className="text-gray-900 leading-relaxed">{checklist.remarks}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resume Preview Modal */}
      {showResumePreview && previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl h-[95vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Resume Preview</h2>
              <button
                onClick={() => {
                  setShowResumePreview(false);
                  if (previewUrl) {
                    window.URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                  }
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="flex-1 h-full">
              <iframe
                src={previewUrl}
                className="w-full h-full rounded-lg border-0"
                title="Resume Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeChecklistPage;
