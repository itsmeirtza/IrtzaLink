import React, { useState } from 'react';
import { createTestNotification } from '../services/firebase';
import { testDataPersistence, testNotificationSystem, getLocalStorageItems } from '../utils/testHelpers';
import toast from 'react-hot-toast';

const DebugPanel = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const handleTestDataPersistence = async () => {
    if (!user?.uid) {
      toast.error('User not logged in');
      return;
    }

    setLoading(true);
    try {
      const result = await testDataPersistence(user.uid);
      setTestResults(prev => ({ ...prev, dataPersistence: result }));
      
      if (result.success) {
        toast.success(`Data persistence test: ${result.persistenceWorking ? 'PASS' : 'FAIL'}`);
      } else {
        toast.error(`Data persistence test failed: ${result.error}`);
      }
    } catch (error) {
      toast.error(`Test error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotifications = async () => {
    if (!user?.uid) {
      toast.error('User not logged in');
      return;
    }

    setLoading(true);
    try {
      const result = await testNotificationSystem(user.uid);
      setTestResults(prev => ({ ...prev, notifications: result }));
      
      if (result.success) {
        toast.success('Test notification created! Check the bell icon.');
      } else {
        toast.error(`Notification test failed: ${result.error}`);
      }
    } catch (error) {
      toast.error(`Test error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleShowLocalStorage = () => {
    const items = getLocalStorageItems();
    console.log('IrtzaLink localStorage items:', items);
    setTestResults(prev => ({ ...prev, localStorage: items }));
    toast.success('LocalStorage items logged to console');
  };

  const handleClearLocalStorage = () => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('irtzalink_'));
    keys.forEach(key => localStorage.removeItem(key));
    toast.success(`Cleared ${keys.length} localStorage items`);
    setTestResults(prev => ({ ...prev, localStorage: {} }));
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white px-3 py-2 rounded text-xs font-mono z-50 opacity-75 hover:opacity-100"
        title="Debug Panel"
      >
        DEBUG
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 w-80 z-50 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2">
        <button
          onClick={handleTestDataPersistence}
          disabled={loading}
          className="w-full bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 disabled:opacity-50"
        >
          Test Data Persistence
        </button>

        <button
          onClick={handleTestNotifications}
          disabled={loading}
          className="w-full bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 disabled:opacity-50"
        >
          Test Notifications
        </button>

        <button
          onClick={handleShowLocalStorage}
          className="w-full bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600"
        >
          Show LocalStorage
        </button>

        <button
          onClick={handleClearLocalStorage}
          className="w-full bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
        >
          Clear LocalStorage
        </button>
      </div>

      {Object.keys(testResults).length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Test Results:</h4>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            {testResults.dataPersistence && (
              <div>
                <strong>Data Persistence:</strong> {testResults.dataPersistence.persistenceWorking ? '✅ PASS' : '❌ FAIL'}
                <br />
                <small>Before: {testResults.dataPersistence.beforeDataSource}, After: {testResults.dataPersistence.afterDataSource}</small>
              </div>
            )}
            {testResults.notifications && (
              <div>
                <strong>Notifications:</strong> {testResults.notifications.success ? '✅ PASS' : '❌ FAIL'}
                {testResults.notifications.error && <br />}
                {testResults.notifications.error && <small>Error: {testResults.notifications.error}</small>}
              </div>
            )}
            {testResults.localStorage && (
              <div>
                <strong>LocalStorage:</strong> {Object.keys(testResults.localStorage).length} items
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        User: {user?.uid?.slice(0, 8)}...
        <br />
        Data Source: {user?.dataSource || 'unknown'}
      </div>
    </div>
  );
};

export default DebugPanel;