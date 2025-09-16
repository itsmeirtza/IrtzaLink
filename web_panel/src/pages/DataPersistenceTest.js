import React, { useState, useEffect } from 'react';
import { logout } from '../services/firebase';
import { loadUserDataPermanently, saveUserDataPermanently } from '../services/permanentStorage';

const DataPersistenceTest = ({ user }) => {
  const [testResults, setTestResults] = useState([]);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [isRunningTest, setIsRunningTest] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      checkCurrentData();
    }
  }, [user]);

  const addTestResult = (test, result, details = '') => {
    setTestResults(prev => [...prev, {
      test,
      result,
      details,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const checkCurrentData = async () => {
    if (!user?.uid) return;

    try {
      const result = await loadUserDataPermanently(user.uid);
      setCurrentUserData(result);
      
      addTestResult(
        'Load Current Data', 
        result.success ? '✅ Success' : '❌ Failed',
        result.success ? `Found ${Object.keys(result.data || {}).length} data fields` : result.error
      );
    } catch (error) {
      addTestResult('Load Current Data', '❌ Error', error.message);
    }
  };

  const testDataPersistence = async () => {
    if (!user?.uid) return;
    
    setIsRunningTest(true);
    setTestResults([]);

    // Step 1: Save test data
    const testData = {
      displayName: `Test User ${Date.now()}`,
      username: `testuser${Date.now()}`,
      bio: `Test bio created at ${new Date().toLocaleString()}`,
      socialLinks: {
        instagram: 'https://instagram.com/test',
        facebook: 'https://facebook.com/test',
        twitter: 'https://twitter.com/test'
      },
      contactInfo: {
        email: user.email,
        phone: '+1234567890',
        website: 'https://test.com'
      },
      theme: 'dark',
      testField: 'This is test data to verify persistence'
    };

    try {
      // Save test data
      const saveResult = await saveUserDataPermanently(user.uid, testData);
      addTestResult(
        'Save Test Data', 
        saveResult.success ? '✅ Success' : '❌ Failed',
        saveResult.success ? 'Test data saved successfully' : saveResult.error
      );

      // Check localStorage
      const localKeys = Object.keys(localStorage).filter(key => 
        key.includes(user.uid) && key.startsWith('irtzalink')
      );
      addTestResult(
        'Check localStorage', 
        localKeys.length > 0 ? '✅ Found' : '❌ Missing',
        `Found ${localKeys.length} localStorage keys: ${localKeys.join(', ')}`
      );

      // Load data back
      const loadResult = await loadUserDataPermanently(user.uid);
      addTestResult(
        'Load Test Data',
        loadResult.success ? '✅ Success' : '❌ Failed',
        loadResult.success ? `Loaded ${Object.keys(loadResult.data || {}).length} fields` : loadResult.error
      );

      // Verify specific fields
      if (loadResult.success && loadResult.data) {
        const data = loadResult.data;
        const verifications = [
          { field: 'username', expected: testData.username, actual: data.username },
          { field: 'bio', expected: testData.bio, actual: data.bio },
          { field: 'socialLinks.instagram', expected: testData.socialLinks.instagram, actual: data.socialLinks?.instagram },
          { field: 'testField', expected: testData.testField, actual: data.testField }
        ];

        verifications.forEach(({ field, expected, actual }) => {
          addTestResult(
            `Verify ${field}`,
            expected === actual ? '✅ Match' : '❌ Mismatch',
            `Expected: "${expected}" | Actual: "${actual}"`
          );
        });
      }

      // Final message
      addTestResult(
        'Test Complete',
        '✅ Ready',
        '🚀 Now try signing out and back in. Your data should persist!'
      );

    } catch (error) {
      addTestResult('Test Error', '❌ Failed', error.message);
    } finally {
      setIsRunningTest(false);
    }
  };

  const simulateSignOut = async () => {
    addTestResult('Simulate Sign Out', '🔄 Starting', 'Testing sign out behavior...');
    
    try {
      await logout();
      addTestResult('Sign Out', '✅ Success', 'User signed out successfully');
    } catch (error) {
      addTestResult('Sign Out', '❌ Error', error.message);
    }
  };

  const checkLocalStorageKeys = () => {
    const allKeys = Object.keys(localStorage);
    const irtzaLinkKeys = allKeys.filter(key => key.startsWith('irtzalink_'));
    const userKeys = allKeys.filter(key => key.includes(user?.uid || 'no-uid'));
    
    setTestResults([
      {
        test: 'All localStorage Keys',
        result: '📋 Info',
        details: `Total keys: ${allKeys.length}`,
        timestamp: new Date().toLocaleTimeString()
      },
      {
        test: 'IrtzaLink Keys',
        result: irtzaLinkKeys.length > 0 ? '✅ Found' : '⚠️ Empty',
        details: `Keys: ${irtzaLinkKeys.join(', ')}`,
        timestamp: new Date().toLocaleTimeString()
      },
      {
        test: 'User-Specific Keys',
        result: userKeys.length > 0 ? '✅ Found' : '⚠️ Empty',
        details: `Keys: ${userKeys.join(', ')}`,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card p-6">
          <h1 className="text-2xl font-bold mb-4">Data Persistence Test</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please log in to test data persistence.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="card p-6">
        <h1 className="text-2xl font-bold mb-6">🔬 Data Persistence Test</h1>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Current User</h2>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
            <p><strong>UID:</strong> {user.uid}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Display Name:</strong> {user.displayName || 'Not set'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={testDataPersistence}
            disabled={isRunningTest}
            className="btn-primary"
          >
            {isRunningTest ? '🔄 Running Test...' : '🧪 Run Full Test'}
          </button>
          
          <button
            onClick={checkCurrentData}
            className="btn-secondary"
          >
            📊 Check Current Data
          </button>
          
          <button
            onClick={checkLocalStorageKeys}
            className="btn-secondary"
          >
            🔍 Check Storage Keys
          </button>
        </div>

        <div className="mb-6">
          <button
            onClick={simulateSignOut}
            className="btn-danger"
          >
            🚪 Test Sign Out (Your data should persist!)
          </button>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            After clicking this, sign back in and check if your data is still there.
          </p>
        </div>

        {/* Current Data Display */}
        {currentUserData && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">📋 Current Stored Data</h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded max-h-40 overflow-y-auto">
              <pre className="text-xs">
                {JSON.stringify(currentUserData.data || {}, null, 2)}
              </pre>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Source: {currentUserData.source} | Last Saved: {new Date(currentUserData.lastSaved).toLocaleString()}
            </p>
          </div>
        )}

        {/* Test Results */}
        {testResults.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">📋 Test Results</h3>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{result.test}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {result.details}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm">{result.result}</p>
                      <p className="text-xs text-gray-500">{result.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
            🚀 How to Test Data Persistence:
          </h3>
          <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>1. Click "Run Full Test" to save test data</li>
            <li>2. Click "Test Sign Out" to sign out</li>
            <li>3. Sign back in using the same account</li>
            <li>4. Check if all your data is still there!</li>
            <li>5. Go to Profile page to see username, bio, social links</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default DataPersistenceTest;