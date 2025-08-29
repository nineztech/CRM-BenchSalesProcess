import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChangePasswordModal } from '../components/common';
import { LogOut, User, BookOpen, GraduationCap, Briefcase, Target, TrendingUp, Award, Clock, CheckCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  useEffect(() => {
    // Show change password modal for first-time users
    if (user?.isFirstLogin) {
      setShowChangePasswordModal(true);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
  

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex items-center ml-2">
              <h1 className="text-3xl font-bold text-gray-900">Client Dashboard</h1>
        </div>
        <div className="px-4 py-6 sm:px-0">
          
          {/* Welcome Section */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Welcome back, {user?.name}! 👋
              </h2>
              <p className="text-gray-600">
                Track your learning progress, placement opportunities, and career development journey.
              </p>
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


