import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../../assets/Logo.webp';
import { FiMail, FiKey, FiShield, FiUser } from 'react-icons/fi';
const BASE_URL=import.meta.env.VITE_API_URL|| "http://localhost:5006/api"
interface LocationState {
  from?: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: number;
      email: string;
      username: string;
      role: string;
      subrole: string;
      departmentId: number;
      status: string;
      createdAt: string;
      updatedAt: string;
      department?: {
        departmentName: string;
      };
    };
    token: string;
  };
}

export const UserLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Password reset states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showNewPasswordModal, setShowNewPasswordModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [timer, setTimer] = useState(120); // 2 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Privacy policy states
  const [privacyPolicyChecked, setPrivacyPolicyChecked] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacyError, setPrivacyError] = useState('');

  // Timer effect for OTP expiry
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerRunning(false);
      setShowOtpModal(false);
      setError('OTP expired. Please request a new one.');
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPrivacyError('');

    if (!privacyPolicyChecked) {
      setPrivacyError('Please accept the privacy policy to continue');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/user/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data: LoginResponse = await response.json();

      if (data.success && data.data?.token) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('userId', data.data.user.id.toString());
        localStorage.setItem('departmentId', data.data.user.departmentId?.toString() || '');
        localStorage.setItem('subrole', data.data.user.subrole || '');
        localStorage.setItem('role', data.data.user.role || '');
        localStorage.setItem('user', JSON.stringify(data.data.user));
        const state = location.state as LocationState;
        // Redirect based on user role
        const redirectPath = data.data.user.role === 'admin' ? '/dashbaord' : '/dashboard';
        const from = state?.from || redirectPath;
        console.log('Login successful, redirecting to:', from);
        navigate(from);
      } else {
        setError(data.message || 'Invalid username or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    try {
      setOtpError('');
      if (!email) {
        setOtpError('Please enter your email');
        return;
      }
      const response = await fetch(`${BASE_URL}/user/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setShowPasswordModal(false);
        setShowOtpModal(true);
        setTimer(120);
        setIsTimerRunning(true);
        setError('');
      } else {
        setOtpError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setOtpError('Server error. Please try again later.');
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setOtpError('');
      if (!otp || otp.length !== 6) {
        setOtpError('Please enter a valid 6-digit OTP');
        return;
      }
      const response = await fetch(`${BASE_URL}/user/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
      if (response.ok) {
        setShowOtpModal(false);
        setShowNewPasswordModal(true);
        setIsTimerRunning(false);
        setOtpError('');
      } else {
        setOtpError(data.message || 'Invalid OTP');
        setOtp('');
      }
    } catch (err) {
      setOtpError('Server error. Please try again later.');
    }
  };

  const handleResetPassword = async () => {
    try {
      setPasswordError('');
      if (!newPassword || !confirmPassword) {
        setPasswordError('Please fill in all password fields');
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordError('Passwords do not match');
        return;
      }
      if (newPassword.length < 6) {
        setPasswordError('Password must be at least 6 characters long');
        return;
      }
      const response = await fetch(`${BASE_URL}/user/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setShowNewPasswordModal(false);
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setOtpError('');
        setPasswordError('');
        setError('Password reset successful. Please login with your new password.');
      } else {
        setPasswordError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setPasswordError('Server error. Please try again later.');
    }
  };

  return (
    <div className="flex w-full min-h-screen overflow-hidden font-sans">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat w-full h-full"
        style={{ backgroundImage: `url(/Backgrondimg.jpeg)` }}
      >
        <div className="flex items-center min-h-screen">
          <div className="w-full max-w-md bg-black bg-opacity-40 backdrop-blur-sm p-6 sm:p-8 rounded-xl shadow-2xl ml-2 sm:ml-6 md:ml-12">
            <div className="text-center mb-8">
              <img src={logo} alt="Logo" className="h-12 mx-auto" />
            </div>
            
            <h2 className="text-center mb-6 text-gray-100 text-2xl font-semibold">
              Login
            </h2>
            
            {error && (
              <div className="bg-red-500 p-3 rounded-md text-center text-white mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <label className="flex flex-col font-medium text-sm text-white">
                Username:
                <div className="relative mt-1">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="pl-10 p-2.5 w-full border border-gray-300 rounded-md text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Enter your username"
                  />
                </div>
              </label>
              
              <label className="flex flex-col font-medium text-sm text-white">
                Password:
                <div className="relative mt-1">
                  <FiKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 p-2.5 w-full border border-gray-300 rounded-md text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Enter your password"
                  />
                </div>
              </label>

              <div className="mt-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      id="privacy-policy"
                      checked={privacyPolicyChecked}
                      onChange={(e) => setPrivacyPolicyChecked(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                    />
                    <label 
                      htmlFor="privacy-policy" 
                      className="text-sm text-white cursor-pointer select-none whitespace-nowrap"
                    >
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() => setShowPrivacyModal(true)}
                        className="text-blue-400 hover:text-blue-300 underline focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded"
                      >
                        Privacy Policy
                      </button>
                    </label>
                  </div>
                </div>
                {privacyError && (
                  <p className="mt-1.5 text-sm text-red-400 pl-6">{privacyError}</p>
                )}
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className={`mt-6 text-white p-3 rounded-md font-bold cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                  loading 
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
                }`}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="text-sm text-gray-300 hover:text-white transition-colors duration-200 text-center mt-2 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded"
              >
                Forgot Password?
              </button>
              
              <div className="text-center mt-4 text-xs bg-red-100 p-2.5 rounded-md">
                <p className="text-black">
                  Having trouble logging in? Please contact support.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-8 py-4 border-b bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-800">Privacy Policy</h2>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="px-8 py-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6 text-left">
                <section>
                  <p className="text-sm text-gray-600 mb-4">
                    Last Updated: {new Date().toLocaleDateString()}
                  </p>
                  
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      This privacy notice for [Company Name] ("Company," "we," "us," or "our") describes how and why we might collect, store, use, and/or share ("process") your information when you use our services ("Services"), such as when you:
                    </p>
                    <ul className="text-sm text-gray-600 list-disc pl-8 mt-2 space-y-1">
                      <li>Visit our website, or any website of ours that links to this privacy notice</li>
                      <li>Engage with us in other related ways, including any sales, marketing, or events</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h3 className="text-base font-bold text-gray-800 mb-3">1. WHAT INFORMATION DO WE COLLECT?</h3>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Personal information you disclose to us</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    <em className="font-semibold">In Short:</em> We collect personal information that you provide to us.
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Personal Information Provided by You.</strong> The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:
                  </p>
                  <ul className="text-sm text-gray-600 list-disc pl-8 space-y-1">
                    <li>Names</li>
                    <li>Phone numbers</li>
                    <li>Email addresses</li>
                    <li>Mailing addresses</li>
                    <li>Usernames</li>
                    <li>Passwords</li>
                    <li>Contact preferences</li>
                    <li>Contact or authentication data</li>
                    <li>Billing addresses</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-base font-bold text-gray-800 mb-3">2. HOW DO WE PROCESS YOUR INFORMATION?</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    <em className="font-semibold">In Short:</em> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    We process your personal information for a variety of reasons, depending on how you interact with our Services, including:
                  </p>
                  <ul className="text-sm text-gray-600 list-disc pl-8 space-y-2">
                    <li>
                      <strong>To facilitate account creation and authentication.</strong> If you choose to create an account with us, we process your information to manage your user account for the purpose of enabling your access to our Services.
                    </li>
                    <li>
                      <strong>To deliver and facilitate delivery of services to the user.</strong> We may process your information to provide you with the requested service.
                    </li>
                    <li>
                      <strong>To respond to user inquiries/offer support to users.</strong> We may process your information to respond to your inquiries and solve any potential issues you might have with the requested service.
                    </li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-base font-bold text-gray-800 mb-3">3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR INFORMATION?</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    <em className="font-semibold">In Short:</em> We only process your personal information when we believe it is necessary and we have a valid legal reason to do so under applicable law.
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    The General Data Protection Regulation (GDPR) and UK GDPR require us to explain the valid legal bases we rely on in order to process your personal information. As such, we may rely on the following legal bases to process your personal information:
                  </p>
                  <ul className="text-sm text-gray-600 list-disc pl-8 space-y-2">
                    <li>
                      <strong>Consent.</strong> We may process your information if you have given us permission to use your personal information for a specific purpose.
                    </li>
                    <li>
                      <strong>Legal Obligations.</strong> We may process your information where we believe it is necessary for compliance with our legal obligations.
                    </li>
                    <li>
                      <strong>Vital Interests.</strong> We may process your information where we believe it is necessary to protect your vital interests or the vital interests of a third party.
                    </li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-base font-bold text-gray-800 mb-3">4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    <em className="font-semibold">In Short:</em> We may share information in specific situations described in this section and/or with the following categories of third parties.
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    We may need to share your personal information in the following situations:
                  </p>
                  <ul className="text-sm text-gray-600 list-disc pl-8 space-y-2">
                    <li>
                      <strong>Business Transfers.</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.
                    </li>
                    <li>
                      <strong>When we use Google Maps Platform APIs.</strong> We may share your information with certain Google Maps Platform APIs (e.g., Google Maps API, Places API).
                    </li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-base font-bold text-gray-800 mb-3">5. HOW LONG DO WE KEEP YOUR INFORMATION?</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    <em className="font-semibold">In Short:</em> We keep your information for as long as necessary to fulfill the purposes outlined in this privacy notice unless otherwise required by law.
                  </p>
                  <p className="text-sm text-gray-600">
                    We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements).
                  </p>
                </section>

                <section>
                  <h3 className="text-base font-bold text-gray-800 mb-3">6. HOW DO WE KEEP YOUR INFORMATION SAFE?</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    <em className="font-semibold">In Short:</em> We aim to protect your personal information through a system of organizational and technical security measures.
                  </p>
                  <p className="text-sm text-gray-600">
                    We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
                  </p>
                </section>

                <section>
                  <h3 className="text-base font-bold text-gray-800 mb-3">7. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    If you have questions or comments about this notice, you may contact us at:
                  </p>
                  <div className="text-sm text-gray-600 pl-4">
                    <p>[Company Name]</p>
                    <p>[Street Address]</p>
                    <p>[City, State ZIP]</p>
                    <p>Email: privacy@company.com</p>
                    <p>Phone: (555) 123-4567</p>
                  </div>
                </section>
              </div>
            </div>

            <div className="px-8 py-4 bg-gray-50 border-t">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  © {new Date().getFullYear()} [Company Name]. All rights reserved.
                </span>
                <button
                  onClick={() => setShowPrivacyModal(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
                >
                  I Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Reset Password</h2>
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="rounded-full bg-blue-50 p-3">
                  <FiMail className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              {otpError && (
                <p className="mt-2 text-sm text-red-500">{otpError}</p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setEmail('');
                  setOtpError('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendOtp}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <FiMail className="h-4 w-4" />
                Send OTP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Enter Verification Code</h2>
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="rounded-full bg-blue-50 p-3">
                  <FiKey className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-center text-sm text-gray-600 mb-4">
                Enter the 6-digit verification code sent to your email
              </p>
              <div className="flex justify-center mb-2">
                <div className="w-48">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      if (value.length <= 6) setOtp(value);
                    }}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-4 py-2 text-center text-lg tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    maxLength={6}
                  />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">
                  Time remaining: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                </p>
                {otpError && (
                  <p className="text-sm text-red-500 mb-2">{otpError}</p>
                )}
                <button
                  onClick={handleSendOtp}
                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Resend OTP
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowOtpModal(false);
                  setIsTimerRunning(false);
                  setOtp('');
                  setOtpError('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyOtp}
                disabled={otp.length !== 6}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2
                  ${otp.length === 6 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-400 cursor-not-allowed'}`}
              >
                <FiShield className="h-4 w-4" />
                Verify OTP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Password Modal */}
      {showNewPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Set New Password</h2>
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="rounded-full bg-blue-50 p-3">
                  <FiKey className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              {passwordError && (
                <p className="mt-2 text-sm text-red-500">{passwordError}</p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNewPasswordModal(false);
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={!newPassword || !confirmPassword || newPassword.length < 6}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2
                  ${newPassword && confirmPassword && newPassword.length >= 6
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'}`}
              >
                <FiKey className="h-4 w-4" />
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};