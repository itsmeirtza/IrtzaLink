import React from 'react';
import { logout } from '../services/firebase';
import { clearUserData } from '../services/unifiedStorage';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { 
  MoonIcon, 
  SunIcon, 
  UserCircleIcon, 
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const Settings = ({ user, darkMode, toggleDarkMode }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        // Clear ONLY session data, KEEP profile data
        clearUserData(user.uid);
        console.log('🔒 UNIFIED: Profile data preserved for quick re-login');
        
        await logout();
        toast.success('Logged out successfully!');
        navigate('/login');
      } catch (error) {
        toast.error('Error logging out');
        console.error('Logout error:', error);
      }
    }
  };

  const handleDeleteAccount = () => {
    toast.error('Account deletion is not available yet. Please contact support.');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account preferences and security settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Information */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <UserCircleIcon className="w-5 h-5 mr-2" />
            Account Information
          </h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <img
                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=3b82f6&color=ffffff`}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
              />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {user.displayName || 'User'}
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {user.email}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Account created: {user.metadata?.creationTime ? 
                    new Date(user.metadata.creationTime).toLocaleDateString() : 
                    'Recently'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Appearance
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {darkMode ? (
                <MoonIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <SunIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {darkMode ? 'Dark Mode' : 'Light Mode'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Toggle between light and dark themes
                </p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                darkMode ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  darkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <ShieldCheckIcon className="w-5 h-5 mr-2" />
            Security
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Two-Factor Authentication
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Add an extra layer of security to your account
                </p>
              </div>
              <button className="btn-secondary text-sm">
                Coming Soon
              </button>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Change Password
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Update your account password
                </p>
              </div>
              <button className="btn-secondary text-sm">
                Coming Soon
              </button>
            </div>
          </div>
        </div>

        {/* Privacy & Data */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Privacy & Data
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Profile Visibility
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your profile is currently public and searchable
                </p>
              </div>
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                Public
              </span>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Analytics Data
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We collect anonymous analytics to improve your experience
                </p>
              </div>
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                Enabled
              </span>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Account Actions
          </h3>
          <div className="space-y-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg transition-colors duration-200"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
            
            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-700 rounded-lg transition-colors duration-200"
            >
              <TrashIcon className="w-5 h-5" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>

        {/* Help & Support */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Help & Support
          </h3>
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Need help? Check out our resources:
            </p>
            <div className="space-y-2">
              <a href="#" className="block text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm">
                📚 Help Center
              </a>
              <a href="#" className="block text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm">
                💬 Contact Support
              </a>
              <a href="#" className="block text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm">
                📝 Privacy Policy
              </a>
              <a href="#" className="block text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm">
                📋 Terms of Service
              </a>
            </div>
          </div>
        </div>

        {/* App Information */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            About IrtzaLink
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p>Version: 1.0.0</p>
            <p>Last Updated: September 2025</p>
            <p className="pt-2">
              IrtzaLink is a free, open-source personal link management platform.
              Built with ❤️ using React and Firebase.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;