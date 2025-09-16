import React, { useState } from 'react';
import { resetUsernameChangeForAllUsers } from '../services/firebase';
import toast from 'react-hot-toast';
import { UserIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const AdminPanel = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [resetStats, setResetStats] = useState(null);

  // Check if current user is admin (you can modify this logic)
  const isAdmin = user?.email === 'irtzajutt2005@gmail.com'; // Your admin email

  const handleUsernameReset = async () => {
    if (!window.confirm('Are you sure you want to reset username change cooldown for ALL users? This will allow everyone to change their username once more.')) {
      return;
    }

    setLoading(true);
    try {
      const result = await resetUsernameChangeForAllUsers();
      
      if (result.success) {
        setResetStats(result);
        toast.success(result.message);
      } else {
        toast.error(result.error || 'Failed to reset username changes');
      }
    } catch (error) {
      console.error('Error resetting username changes:', error);
      toast.error('Error occurred while resetting username changes');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="card p-6 text-center">
        <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Admin Access Required
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have permission to access admin functions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          🔧 Admin Panel
        </h2>
        
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
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h4 className="text-sm font-medium text-green-800 dark:text-green-300">
                  Reset Completed Successfully
                </h4>
              </div>
              <p className="text-sm text-green-700 dark:text-green-400">
                Affected users: <strong>{resetStats.resetCount}</strong>
              </p>
              <p className="text-sm text-green-700 dark:text-green-400">
                {resetStats.message}
              </p>
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