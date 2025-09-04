import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChangePasswordModal } from '../components/common';
import { User, BookOpen, Briefcase, Target, TrendingUp, Award, CheckCircle, FileText, Phone, ClipboardList, FileCheck, Linkedin, Code, ChevronUp } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Show change password modal for first-time users
    if (user?.isFirstLogin) {
      setShowChangePasswordModal(true);
    }
  }, [user]);

  const handleStageClick = (stage: string) => {
    setSelectedStage(selectedStage === stage ? null : stage);
    
    // Scroll to details section after a short delay to allow state update
    setTimeout(() => {
      if (detailsRef.current) {
        detailsRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
  

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex items-center ml-2">
              <h1 className="text-3xl font-bold text-gray-900">Client Dashboard</h1>
        </div>
        <div className="px-4 py-6 sm:px-0">
          
          {/* Welcome Section */}
          {/* <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Welcome back, {user?.name}! 👋
              </h2>
              <p className="text-gray-600">
                Track your learning progress, placement opportunities, and career development journey.
              </p>
            </div>
          </div> */}

          {/* Process Flow Section */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Your Process Flow</h2>
                  <p className="text-gray-600 mt-1">Track your progress through our comprehensive training and placement program</p>
                </div>
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                  <span className="text-sm text-gray-600">Overall Progress: </span>
                  <span className="text-lg font-bold text-blue-600">65%</span>
                </div>
              </div>

              {/* Phase 1 */}
              <div className="mb-8">
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 bg-blue-50">
                  <h3 className="text-lg font-bold text-blue-800 mb-6">Phase 1</h3>
                  <div className="relative">
                    {/* Flow Line */}
                    <div className="absolute top-6 left-8 right-8 h-0.5 bg-blue-400"></div>
                    
                    <div className="flex justify-between items-start">
                      {/* Onboarding */}
                      <div 
                        className="flex flex-col items-center cursor-pointer group relative z-10 transform transition-all duration-300 hover:scale-110"
                        onClick={() => handleStageClick('onboarding')}
                      >
                        <div className={`w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 relative group-hover:bg-green-600 ${selectedStage === 'onboarding' ? 'ring-4 ring-blue-300 scale-125' : ''}`}>
                          <User className="h-4 w-4 text-white transition-transform duration-300 group-hover:scale-110" />
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center animate-pulse">
                            <CheckCircle className="h-2.5 w-2.5 text-white" />
                          </div>
                        </div>
                        <div className="mt-2 text-center">
                          <p className={`text-xs font-medium transition-colors duration-300 ${selectedStage === 'onboarding' ? 'text-blue-600 font-bold' : 'text-gray-900 group-hover:text-green-600'}`}>Onboarding</p>
                          <p className="text-xs text-gray-500">15/01/2024</p>
                        </div>
                      </div>

                      {/* Welcome Call */}
                      <div 
                        className="flex flex-col items-center cursor-pointer group relative z-10 transform transition-all duration-300 hover:scale-110"
                        onClick={() => handleStageClick('welcome-call')}
                      >
                        <div className={`w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 relative group-hover:bg-green-600 ${selectedStage === 'welcome-call' ? 'ring-4 ring-blue-300 scale-125' : ''}`}>
                          <Phone className="h-4 w-4 text-white transition-transform duration-300 group-hover:scale-110" />
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center animate-pulse">
                            <CheckCircle className="h-2.5 w-2.5 text-white" />
                          </div>
                        </div>
                        <div className="mt-2 text-center">
                          <p className={`text-xs font-medium transition-colors duration-300 ${selectedStage === 'welcome-call' ? 'text-blue-600 font-bold' : 'text-gray-900 group-hover:text-green-600'}`}>Welcome Call</p>
                          <p className="text-xs text-gray-500">16/01/2024</p>
                        </div>
                      </div>

                      {/* Resume Checklist */}
                      <div 
                        className="flex flex-col items-center cursor-pointer group relative z-10 transform transition-all duration-300 hover:scale-110"
                        onClick={() => handleStageClick('resume-checklist')}
                      >
                        <div className={`w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 relative group-hover:bg-green-600 ${selectedStage === 'resume-checklist' ? 'ring-4 ring-blue-300 scale-125' : ''}`}>
                          <ClipboardList className="h-4 w-4 text-white transition-transform duration-300 group-hover:scale-110" />
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center animate-pulse">
                            <CheckCircle className="h-2.5 w-2.5 text-white" />
                          </div>
                        </div>
                        <div className="mt-2 text-center">
                          <p className={`text-xs font-medium transition-colors duration-300 ${selectedStage === 'resume-checklist' ? 'text-blue-600 font-bold' : 'text-gray-900 group-hover:text-green-600'}`}>Resume Checklist</p>
                          <p className="text-xs text-gray-500">18/01/2024</p>
                        </div>
                      </div>

                      {/* Agreement */}
                      <div 
                        className="flex flex-col items-center cursor-pointer group relative z-10 transform transition-all duration-300 hover:scale-110"
                        onClick={() => handleStageClick('agreement')}
                      >
                        <div className={`w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 relative group-hover:bg-green-600 ${selectedStage === 'agreement' ? 'ring-4 ring-blue-300 scale-125' : ''}`}>
                          <FileText className="h-4 w-4 text-white transition-transform duration-300 group-hover:scale-110" />
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center animate-pulse">
                            <CheckCircle className="h-2.5 w-2.5 text-white" />
                          </div>
                        </div>
                        <div className="mt-2 text-center">
                          <p className={`text-xs font-medium transition-colors duration-300 ${selectedStage === 'agreement' ? 'text-blue-600 font-bold' : 'text-gray-900 group-hover:text-green-600'}`}>Agreement</p>
                          <p className="text-xs text-gray-500">20/01/2024</p>
                        </div>
                      </div>

                      {/* Resume Building */}
                      <div 
                        className="flex flex-col items-center cursor-pointer group relative z-10 transform transition-all duration-300 hover:scale-110"
                        onClick={() => handleStageClick('resume-building')}
                      >
                        <div className={`w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 relative group-hover:bg-blue-600 ${selectedStage === 'resume-building' ? 'ring-4 ring-blue-300 scale-125' : ''}`}>
                          <FileCheck className="h-4 w-4 text-white transition-transform duration-300 group-hover:scale-110" />
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                          </div>
                        </div>
                        <div className="mt-2 text-center">
                          <p className={`text-xs font-medium transition-colors duration-300 ${selectedStage === 'resume-building' ? 'text-blue-600 font-bold' : 'text-gray-900 group-hover:text-blue-600'}`}>Resume Building</p>
                          <div className="w-16 bg-blue-200 rounded-full h-1 mt-1 overflow-hidden">
                            <div className="bg-blue-600 h-1 rounded-full transition-all duration-500 animate-pulse" style={{ width: '75%' }}></div>
                          </div>
                          <p className="text-xs text-blue-600 font-medium">75%</p>
                        </div>
                      </div>

                      {/* Training */}
                      <div 
                        className="flex flex-col items-center cursor-pointer group relative z-10 transform transition-all duration-300 hover:scale-110"
                        onClick={() => handleStageClick('training')}
                      >
                        <div className={`w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 relative group-hover:bg-blue-600 ${selectedStage === 'training' ? 'ring-4 ring-blue-300 scale-125' : ''}`}>
                          <Code className="h-4 w-4 text-white transition-transform duration-300 group-hover:scale-110" />
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                          </div>
                        </div>
                        <div className="mt-2 text-center">
                          <p className={`text-xs font-medium transition-colors duration-300 ${selectedStage === 'training' ? 'text-blue-600 font-bold' : 'text-gray-900 group-hover:text-blue-600'}`}>Training</p>
                          <div className="w-16 bg-blue-200 rounded-full h-1 mt-1 overflow-hidden">
                            <div className="bg-blue-600 h-1 rounded-full transition-all duration-500 animate-pulse" style={{ width: '60%' }}></div>
                          </div>
                          <p className="text-xs text-blue-600 font-medium">60%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase 2 */}
              <div className="mb-8">
                <div className="border-2 border-dashed border-green-300 rounded-lg p-6 bg-green-50">
                  <h3 className="text-lg font-bold text-green-800 mb-6">Phase 2</h3>
                  <div className="relative">
                    {/* Flow Line */}
                    <div className="absolute top-6 left-8 right-8 h-0.5 bg-green-400"></div>
                    
                    <div className="flex justify-between items-start">
                      {/* LinkedIn Optimize / Recruiter */}
                      <div 
                        className="flex flex-col items-center cursor-pointer group relative z-10 transform transition-all duration-300 hover:scale-110"
                        onClick={() => handleStageClick('linkedin-recruiter')}
                      >
                        <div className={`w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:bg-gray-400 ${selectedStage === 'linkedin-recruiter' ? 'ring-4 ring-green-300 scale-125' : ''}`}>
                          <Linkedin className="h-4 w-4 text-gray-600 transition-transform duration-300 group-hover:scale-110" />
                        </div>
                        <div className="mt-2 text-center">
                          <p className={`text-xs font-medium transition-colors duration-300 ${selectedStage === 'linkedin-recruiter' ? 'text-green-600 font-bold' : 'text-gray-900 group-hover:text-gray-600'}`}>LinkedIn Optimize</p>
                          <p className={`text-xs font-medium transition-colors duration-300 ${selectedStage === 'linkedin-recruiter' ? 'text-green-600 font-bold' : 'text-gray-900 group-hover:text-gray-600'}`}>Recruiter</p>
                          <p className="text-xs text-gray-500">Not Started</p>
                        </div>
                      </div>

                      {/* LinkedIn Optimization */}
                      <div 
                        className="flex flex-col items-center cursor-pointer group relative z-10 transform transition-all duration-300 hover:scale-110"
                        onClick={() => handleStageClick('linkedin-optimization')}
                      >
                        <div className={`w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:bg-gray-400 ${selectedStage === 'linkedin-optimization' ? 'ring-4 ring-green-300 scale-125' : ''}`}>
                          <Linkedin className="h-4 w-4 text-gray-600 transition-transform duration-300 group-hover:scale-110" />
                        </div>
                        <div className="mt-2 text-center">
                          <p className={`text-xs font-medium transition-colors duration-300 ${selectedStage === 'linkedin-optimization' ? 'text-green-600 font-bold' : 'text-gray-900 group-hover:text-gray-600'}`}>LinkedIn Optimization</p>
                          <p className="text-xs text-gray-500">Not Started</p>
                        </div>
                      </div>

                      {/* Job Application */}
                      <div 
                        className="flex flex-col items-center cursor-pointer group relative z-10 transform transition-all duration-300 hover:scale-110"
                        onClick={() => handleStageClick('job-application')}
                      >
                        <div className={`w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:bg-gray-400 ${selectedStage === 'job-application' ? 'ring-4 ring-green-300 scale-125' : ''}`}>
                          <Briefcase className="h-4 w-4 text-gray-600 transition-transform duration-300 group-hover:scale-110" />
                        </div>
                        <div className="mt-2 text-center">
                          <p className={`text-xs font-medium transition-colors duration-300 ${selectedStage === 'job-application' ? 'text-green-600 font-bold' : 'text-gray-900 group-hover:text-gray-600'}`}>Job Application</p>
                          <p className="text-xs text-gray-500">Not Started</p>
                        </div>
                      </div>

                      {/* Job Offer */}
                      <div 
                        className="flex flex-col items-center cursor-pointer group relative z-10 transform transition-all duration-300 hover:scale-110"
                        onClick={() => handleStageClick('job-offer')}
                      >
                        <div className={`w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:bg-gray-400 ${selectedStage === 'job-offer' ? 'ring-4 ring-green-300 scale-125' : ''}`}>
                          <Award className="h-4 w-4 text-gray-600 transition-transform duration-300 group-hover:scale-110" />
                        </div>
                        <div className="mt-2 text-center">
                          <p className={`text-xs font-medium transition-colors duration-300 ${selectedStage === 'job-offer' ? 'text-green-600 font-bold' : 'text-gray-900 group-hover:text-gray-600'}`}>Job Offer</p>
                          <p className="text-xs text-gray-500">Not Started</p>
                        </div>
                      </div>

                      {/* BGC Doc Support */}
                      <div 
                        className="flex flex-col items-center cursor-pointer group relative z-10 transform transition-all duration-300 hover:scale-110"
                        onClick={() => handleStageClick('bgc-doc-support')}
                      >
                        <div className={`w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:bg-gray-400 ${selectedStage === 'bgc-doc-support' ? 'ring-4 ring-green-300 scale-125' : ''}`}>
                          <FileCheck className="h-4 w-4 text-gray-600 transition-transform duration-300 group-hover:scale-110" />
                        </div>
                        <div className="mt-2 text-center">
                          <p className={`text-xs font-medium transition-colors duration-300 ${selectedStage === 'bgc-doc-support' ? 'text-green-600 font-bold' : 'text-gray-900 group-hover:text-gray-600'}`}>BGC</p>
                          <p className={`text-xs font-medium transition-colors duration-300 ${selectedStage === 'bgc-doc-support' ? 'text-green-600 font-bold' : 'text-gray-900 group-hover:text-gray-600'}`}>Doc Support</p>
                          <p className="text-xs text-gray-500">Not Started</p>
                        </div>
                      </div>

                      {/* Job Started */}
                      <div 
                        className="flex flex-col items-center cursor-pointer group relative z-10 transform transition-all duration-300 hover:scale-110"
                        onClick={() => handleStageClick('job-started')}
                      >
                        <div className={`w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:bg-gray-400 ${selectedStage === 'job-started' ? 'ring-4 ring-green-300 scale-125' : ''}`}>
                          <Target className="h-4 w-4 text-gray-600 transition-transform duration-300 group-hover:scale-110" />
                        </div>
                        <div className="mt-2 text-center">
                          <p className={`text-xs font-medium transition-colors duration-300 ${selectedStage === 'job-started' ? 'text-green-600 font-bold' : 'text-gray-900 group-hover:text-gray-600'}`}>Job Started</p>
                          <p className="text-xs text-gray-500">Not Started</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Spacing between phases */}
              <div className="mb-8"></div>

              {/* Stage Details */}
              {selectedStage && (
                <div ref={detailsRef} className="mt-6 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden animate-in slide-in-from-top-4 duration-300 ease-out">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {selectedStage === 'onboarding' && 'Onboarding Details'}
                          {selectedStage === 'welcome-call' && 'Welcome Call Details'}
                          {selectedStage === 'resume-checklist' && 'Resume Checklist Details'}
                          {selectedStage === 'agreement' && 'Agreement Details'}
                          {selectedStage === 'resume-building' && 'Resume Building Details'}
                          {selectedStage === 'training' && 'Training Details'}
                          {selectedStage === 'linkedin-recruiter' && 'LinkedIn Optimize/Recruiter Details'}
                          {selectedStage === 'linkedin-optimization' && 'LinkedIn Optimization Details'}
                          {selectedStage === 'job-application' && 'Job Application Details'}
                          {selectedStage === 'job-offer' && 'Job Offer Details'}
                          {selectedStage === 'bgc-doc-support' && 'BGC Doc Support Details'}
                          {selectedStage === 'job-started' && 'Job Started Details'}
                        </h3>
                      </div>
                      <button
                        onClick={() => setSelectedStage(null)}
                        className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 rounded-full hover:bg-gray-100"
                      >
                        <ChevronUp className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6 animate-in fade-in-0 duration-500">
                    <div className="space-y-4">
                      {selectedStage === 'onboarding' && (
                        <div>
                          <p className="text-gray-600 mb-4">Complete your onboarding process to get started with the program.</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2">Completed Tasks</h4>
                              <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Profile Setup</li>
                                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Document Verification</li>
                                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Initial Assessment</li>
                              </ul>
                            </div>
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2">Next Steps</h4>
                              <ul className="space-y-2 text-sm text-gray-600">
                                <li>• Schedule welcome call</li>
                                <li>• Review program guidelines</li>
                                <li>• Set learning goals</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedStage === 'welcome-call' && (
                        <div>
                          <p className="text-gray-600 mb-4">Your welcome call has been completed successfully.</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2">Call Summary</h4>
                              <ul className="space-y-2 text-sm text-gray-600">
                                <li>• Duration: 45 minutes</li>
                                <li>• Discussed learning objectives</li>
                                <li>• Reviewed program timeline</li>
                                <li>• Set expectations</li>
                              </ul>
                            </div>
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2">Action Items</h4>
                              <ul className="space-y-2 text-sm text-gray-600">
                                <li>• Complete resume checklist</li>
                                <li>• Review training materials</li>
                                <li>• Schedule next check-in</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedStage === 'resume-checklist' && (
                        <div>
                          <p className="text-gray-600 mb-4">Complete your resume checklist to proceed to the next phase.</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2">Checklist Items</h4>
                              <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Personal Information</li>
                                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Contact Details</li>
                                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Education History</li>
                                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Work Experience</li>
                                <li className="flex items-center"><div className="w-4 h-4 bg-gray-300 rounded-full mr-2"></div>Skills & Certifications</li>
                              </ul>
                            </div>
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2">Progress</h4>
                              <div className="space-y-3">
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>Overall Progress</span>
                                    <span>80%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedStage === 'agreement' && (
                        <div>
                          <p className="text-gray-600 mb-4">Review and sign the program agreement.</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2">Agreement Status</h4>
                              <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Terms & Conditions</div>
                                <div className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Privacy Policy</div>
                                <div className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Program Guidelines</div>
                                <div className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Digital Signature</div>
                              </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2">Document Details</h4>
                              <div className="space-y-2 text-sm text-gray-600">
                                <div>• Signed on: 20/01/2024</div>
                                <div>• Version: 2.1</div>
                                <div>• Expires: 20/01/2025</div>
                                <div>• Status: Active</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedStage === 'resume-building' && (
                        <div>
                          <p className="text-gray-600 mb-4">Build and optimize your professional resume.</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2">Resume Sections</h4>
                              <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Header & Contact</li>
                                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Professional Summary</li>
                                <li className="flex items-center"><div className="w-4 h-4 bg-blue-500 rounded-full mr-2 animate-pulse"></div>Work Experience (75%)</li>
                                <li className="flex items-center"><div className="w-4 h-4 bg-gray-300 rounded-full mr-2"></div>Education</li>
                                <li className="flex items-center"><div className="w-4 h-4 bg-gray-300 rounded-full mr-2"></div>Skills</li>
                              </ul>
                            </div>
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2">Progress</h4>
                              <div className="space-y-3">
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>Overall Progress</span>
                                    <span>75%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-600">
                                  <div>• Templates available: 5</div>
                                  <div>• ATS optimization: 90%</div>
                                  <div>• Keywords matched: 15/20</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedStage === 'training' && (
                        <div>
                          <p className="text-gray-600 mb-4">Complete your technical training modules.</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2">Training Modules</h4>
                              <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />JavaScript Fundamentals</li>
                                <li className="flex items-center"><div className="w-4 h-4 bg-blue-500 rounded-full mr-2 animate-pulse"></div>CSS & Styling (60%)</li>
                                <li className="flex items-center"><div className="w-4 h-4 bg-gray-300 rounded-full mr-2"></div>React.js</li>
                                <li className="flex items-center"><div className="w-4 h-4 bg-gray-300 rounded-full mr-2"></div>Node.js</li>
                              </ul>
                            </div>
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2">Progress</h4>
                              <div className="space-y-3">
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>Overall Progress</span>
                                    <span>60%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-600">
                                  <div>• Hours completed: 45/75</div>
                                  <div>• Assignments: 8/12</div>
                                  <div>• Next milestone: React.js</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Phase 2 Stage Details */}
                      {selectedStage === 'linkedin-recruiter' && (
                        <div>
                          <p className="text-gray-600 mb-4">Optimize your LinkedIn profile and connect with recruiters.</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2">LinkedIn Optimization</h4>
                              <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-center"><div className="w-4 h-4 bg-gray-300 rounded-full mr-2"></div>Profile Photo</li>
                                <li className="flex items-center"><div className="w-4 h-4 bg-gray-300 rounded-full mr-2"></div>Headline</li>
                                <li className="flex items-center"><div className="w-4 h-4 bg-gray-300 rounded-full mr-2"></div>Summary</li>
                                <li className="flex items-center"><div className="w-4 h-4 bg-gray-300 rounded-full mr-2"></div>Experience</li>
                              </ul>
                            </div>
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2">Recruiter Network</h4>
                              <div className="space-y-2 text-sm text-gray-600">
                                <div>• Connections: 0/50</div>
                                <div>• Recruiter contacts: 0</div>
                                <div>• Industry groups: 0</div>
                                <div>• Status: Not Started</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedStage === 'linkedin-optimization' && (
                        <div>
                          <p className="text-gray-600 mb-4">Complete your LinkedIn profile optimization.</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2">Optimization Checklist</h4>
                              <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-center"><div className="w-4 h-4 bg-gray-300 rounded-full mr-2"></div>Professional Photo</li>
                                <li className="flex items-center"><div className="w-4 h-4 bg-gray-300 rounded-full mr-2"></div>Compelling Headline</li>
                                <li className="flex items-center"><div className="w-4 h-4 bg-gray-300 rounded-full mr-2"></div>Detailed Summary</li>
                                <li className="flex items-center"><div className="w-4 h-4 bg-gray-300 rounded-full mr-2"></div>Skills & Endorsements</li>
                              </ul>
                            </div>
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2">Profile Strength</h4>
                              <div className="space-y-2 text-sm text-gray-600">
                                <div>• Current strength: 0%</div>
                                <div>• Target strength: 90%</div>
                                <div>• Keywords: 0/15</div>
                                <div>• Status: Not Started</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedStage === 'job-application' && (
                        <div>
                          <p className="text-gray-600 mb-4">Start applying for relevant job positions.</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2">Application Status</h4>
                              <ul className="space-y-2 text-sm text-gray-600">
                                <li>• Applications submitted: 0</li>
                                <li>• Applications in progress: 0</li>
                                <li>• Responses received: 0</li>
                                <li>• Interviews scheduled: 0</li>
                              </ul>
                            </div>
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2">Target Positions</h4>
                              <div className="space-y-2 text-sm text-gray-600">
                                <div>• Frontend Developer</div>
                                <div>• Full Stack Developer</div>
                                <div>• React Developer</div>
                                <div>• JavaScript Developer</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedStage === 'job-offer' && (
                        <div>
                          <p className="text-gray-600 mb-4">Review and negotiate job offers.</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2">Offer Status</h4>
                              <ul className="space-y-2 text-sm text-gray-600">
                                <li>• Offers received: 0</li>
                                <li>• Offers under review: 0</li>
                                <li>• Offers accepted: 0</li>
                                <li>• Offers declined: 0</li>
                              </ul>
                            </div>
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2">Negotiation Tools</h4>
                              <div className="space-y-2 text-sm text-gray-600">
                                <div>• Salary comparison tools</div>
                                <div>• Benefits analysis</div>
                                <div>• Contract review</div>
                                <div>• Legal consultation</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedStage === 'bgc-doc-support' && (
                        <div>
                          <p className="text-gray-600 mb-4">Complete background check and document support.</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2">Background Check</h4>
                              <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-center"><div className="w-4 h-4 bg-gray-300 rounded-full mr-2"></div>Identity Verification</li>
                                <li className="flex items-center"><div className="w-4 h-4 bg-gray-300 rounded-full mr-2"></div>Education Verification</li>
                                <li className="flex items-center"><div className="w-4 h-4 bg-gray-300 rounded-full mr-2"></div>Employment History</li>
                                <li className="flex items-center"><div className="w-4 h-4 bg-gray-300 rounded-full mr-2"></div>Criminal Background</li>
                              </ul>
                            </div>
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2">Document Support</h4>
                              <div className="space-y-2 text-sm text-gray-600">
                                <div>• Required documents: 8</div>
                                <div>• Documents uploaded: 0</div>
                                <div>• Verification status: Pending</div>
                                <div>• Support available: Yes</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedStage === 'job-started' && (
                        <div>
                          <p className="text-gray-600 mb-4">Congratulations! You've successfully started your new job.</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2">Job Details</h4>
                              <ul className="space-y-2 text-sm text-gray-600">
                                <li>• Company: Not assigned</li>
                                <li>• Position: Not assigned</li>
                                <li>• Start date: Not set</li>
                                <li>• Salary: Not disclosed</li>
                              </ul>
                            </div>
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2">Next Steps</h4>
                              <div className="space-y-2 text-sm text-gray-600">
                                <div>• Complete onboarding</div>
                                <div>• Meet your team</div>
                                <div>• Set up workspace</div>
                                <div>• Review job responsibilities</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Technical Training Modules Section */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Technical Training Modules</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* JavaScript Module */}
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-yellow-600 font-bold text-sm">JS</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">JavaScript</h4>
                      <p className="text-sm text-gray-500">1/4 modules</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-medium text-gray-900">25%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">JS Fundamentals</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">ES6+ Features</span>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                        <span className="text-xs text-blue-600">75%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">DOM Manipulation</span>
                      <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Async Programming</span>
                      <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    </div>
                  </div>
                </div>

                {/* CSS Module */}
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-bold text-sm">CSS</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">CSS</h4>
                      <p className="text-sm text-gray-500">1/4 modules</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-medium text-gray-900">25%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">CSS Basics</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Flexbox & Grid</span>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                        <span className="text-xs text-blue-600">60%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Animations</span>
                      <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Responsive Design</span>
                      <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    </div>
                  </div>
                </div>

                {/* React Module */}
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-cyan-600 font-bold text-sm">⚛</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">React</h4>
                      <p className="text-sm text-gray-500">0/4 modules</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-medium text-gray-900">0%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gray-300 h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">React Basics</span>
                      <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Components & Props</span>
                      <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">State Management</span>
                      <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Hooks & Context</span>
                      <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    </div>
                  </div>
                </div>

                {/* Node.js Module */}
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-green-600 font-bold text-sm">N</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Node.js</h4>
                      <p className="text-sm text-gray-500">0/4 modules</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-medium text-gray-900">0%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gray-300 h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Node.js Basics</span>
                      <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Express.js</span>
                      <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Database Integration</span>
                      <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">API Development</span>
                      <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Courses Completed
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        8
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Placement Score
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        85%
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Briefcase className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Interviews
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        3
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Learning Hours
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        127
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Completed React.js Fundamentals course
                  </span>
                  <span className="text-xs text-gray-400">2 hours ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Interview scheduled with Google for next week
                  </span>
                  <span className="text-xs text-gray-400">1 day ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Assignment submitted: Data Structures & Algorithms
                  </span>
                  <span className="text-xs text-gray-400">2 days ago</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <BookOpen className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium">Start New Course</span>
                </button>
                <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Briefcase className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium">Apply for Jobs</span>
                </button>
                <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Target className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="text-sm font-medium">Practice Tests</span>
                </button>
                <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Award className="h-5 w-5 text-orange-600 mr-2" />
                  <span className="text-sm font-medium">View Certificates</span>
                </button>
              </div>
            </div>
          </div>

          {/* Current Courses */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Current Courses
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Advanced JavaScript</h4>
                      <p className="text-xs text-gray-500">Progress: 75%</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">75%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Target className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">System Design</h4>
                      <p className="text-xs text-gray-500">Progress: 45%</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">45%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Change Password Modal for First-Time Users */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        userEmail={user?.email || ''}
      />
    </div>
  );
};

export default Dashboard;


