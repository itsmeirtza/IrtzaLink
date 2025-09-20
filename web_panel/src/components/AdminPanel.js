import React, { useState, useEffect } from 'react';
import { resetUsernameChangeForAllUsers } from '../services/firebase';
import toast from 'react-hot-toast';
import { UserIcon, ClockIcon, ArrowPathIcon, EyeIcon, EyeSlashIcon, KeyIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const AdminPanel = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [resetStats, setResetStats] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Admin credentials (in production, this should be encrypted/hashed)
  const ADMIN_CREDENTIALS = {
    username: 'adminirtza',
    password: '@Irtzahoonyaar12',
    email: 'irtzajutt2005@gmail.com'
  };

  // Check if user is logged in admin
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('admin_authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Check if current user has admin email
  const hasAdminEmail = user?.email === ADMIN_CREDENTIALS.email;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      // Simulate login delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (loginData.username === ADMIN_CREDENTIALS.username && loginData.password === ADMIN_CREDENTIALS.password) {
        setIsAuthenticated(true);
        sessionStorage.setItem('admin_authenticated', 'true');
        toast.success('Admin login successful!');
        setLoginData({ username: '', password: '' });
      } else {
        toast.error('Invalid username or password');
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    setLoginData({ username: '', password: '' });
    toast.success('Logged out successfully');
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);

    try {
      if (resetEmail === ADMIN_CREDENTIALS.email) {
        // Simulate sending email
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // In a real app, you would send an email here
        toast.success(`Password reset instructions sent to ${resetEmail}`);
        toast.info('Password reset code: RESET2024 (Check your email)');
        
        setShowForgotPassword(false);
        setResetEmail('');
      } else {
        toast.error('Email not found or not authorized for admin access');
      }
    } catch (error) {
      toast.error('Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  const handleUsernameReset = async () => {
    // Enhanced confirmation dialog
    const confirmed = window.confirm(
      '🚨 ADMIN ACTION CONFIRMATION 🚨\n\n' +
      'This will reset the username change cooldown for ALL users who have previously changed their username.\n\n' +
      '✅ What this does:\n' +
      '- Removes the 15-day restriction for users who changed their username before\n' +
      '- Gives everyone one more chance to change their username\n' +
      '- Does not affect users who never changed their username\n\n' +
      '❓ Are you absolutely sure you want to proceed?\n\n' +
      'Type YES in the next dialog to confirm.'
    );
    
    if (!confirmed) {
      return;
    }
    
    // Second confirmation for security
    const confirmText = window.prompt(
      'Please type "YES" (in capital letters) to confirm the username reset action:'
    );
    
    if (confirmText !== 'YES') {
      toast.error('Action cancelled - incorrect confirmation text');
      return;
    }

    setLoading(true);
    setResetStats(null); // Clear previous stats
    
    try {
      console.log('🔒 Admin initiated username reset for all users');
      const result = await resetUsernameChangeForAllUsers();
      
      if (result.success) {
        setResetStats(result);
        
        // Enhanced success toast
        toast.success(
          `🎉 Successfully reset username cooldown for ${result.resetCount} users!`, 
          {
            duration: 6000,
            icon: '✅',
            style: {
              background: 'linear-gradient(45deg, #10B981, #059669)',
              color: 'white',
              fontWeight: 'bold',
            },
          }
        );
        
        console.log(`✅ Username reset completed - Affected users: ${result.resetCount}`);
      } else {
        toast.error(`Failed to reset username changes: ${result.error}`);
        console.error('❌ Username reset failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Error resetting username changes:', error);
      toast.error('Unexpected error occurred while resetting username changes');
    } finally {
      setLoading(false);
    }
  };

  // Check if user has admin email first - STRICT SECURITY
  if (!hasAdminEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
              <UserIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              🚫 Admin Access Restricted
            </h2>
            <div className="space-y-3">
              <p className="text-gray-600 dark:text-gray-400">
                Only the authorized admin can access this panel.
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Required email: <code className="bg-red-100 dark:bg-red-800 px-2 py-1 rounded text-xs">
                    {ADMIN_CREDENTIALS.email}
                  </code>
                </p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Your current email: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                  {user?.email || 'Not logged in'}
                </code>
              </p>
            </div>
            <div className="mt-6">
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="w-full btn-primary"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="card p-8 max-w-md mx-auto">
          <div className="text-center mb-6">
            <KeyIcon className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Admin Login
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Enter your admin credentials to access the panel
            </p>
          </div>

          {!showForgotPassword ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={loginData.username}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter admin username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={loginData.password}
                    onChange={handleInputChange}
                    className="input-field pr-12"
                    placeholder="Enter admin password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <EyeIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading || !loginData.username || !loginData.password}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                {loginLoading ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <KeyIcon className="w-4 h-4" />
                    <span>Login to Admin Panel</span>
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="input-field"
                  placeholder="Enter your admin email"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading || !resetEmail}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                {resetLoading ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <EnvelopeIcon className="w-4 h-4" />
                    <span>Send Reset Email</span>
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail('');
                  }}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            🔧 Admin Panel
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Logged in as: <strong>{ADMIN_CREDENTIALS.username}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="btn-secondary flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
        
        {/* Username Reset Section */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <ClockIcon className="w-6 h-6 text-blue-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Username Change Reset
            </h3>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Reset the 15-day username change cooldown for all users who have previously changed their username. 
            This will give everyone one more opportunity to change their username.
          </p>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Warning</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  This action will affect ALL users who have changed their username before. 
                  After reset, the 15-day timer will start fresh when they change their username again.
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleUsernameReset}
            disabled={loading}
            className="btn-primary flex items-center space-x-2"
          >
            {loading ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                <span>Resetting...</span>
              </>
            ) : (
              <>
                <ClockIcon className="w-4 h-4" />
                <span>Reset Username Change Cooldown</span>
              </>
            )}
          </button>
          
          {resetStats && (
            <div className="mt-6 p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-2 border-green-200 dark:border-green-700 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-green-500 rounded-full mr-3">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-green-800 dark:text-green-200">
                    🎉 Username Reset Completed Successfully!
                  </h4>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    Action performed by Admin at {new Date().toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">👥</span>
                    <h5 className="font-semibold text-gray-900 dark:text-white">
                      Users Affected
                    </h5>
                  </div>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {resetStats.resetCount}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {resetStats.resetCount === 0 ? 'No users had' : resetStats.resetCount === 1 ? '1 user had' : `${resetStats.resetCount} users had`} username change restrictions
                  </p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">⚙️</span>
                    <h5 className="font-semibold text-gray-900 dark:text-white">
                      Action Result
                    </h5>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                    {resetStats.message}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    All affected users can now change their username again
                  </p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <div className="flex items-start">
                  <span className="text-blue-500 mr-2 mt-0.5">ℹ️</span>
                  <div>
                    <h6 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                      What happens next?
                    </h6>
                    <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• Users can immediately change their username if they want</li>
                      <li>• The 15-day cooldown will restart after their next username change</li>
                      <li>• Users who never changed their username are not affected</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Future admin functions can be added here */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            More Admin Functions Coming Soon
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Additional administrative features will be added here as needed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;