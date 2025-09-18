import React, { useState, useEffect } from 'react';
import enhancedDataService from '../services/enhancedDataService';

const StorageDiagnostics = ({ user }) => {
  const [diagnostics, setDiagnostics] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (test, status, message, details = null) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      message,
      details,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runStorageDiagnostics = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      // Test 1: Get diagnostics info
      addTestResult('System Check', 'info', 'Running storage diagnostics...');
      const diag = enhancedDataService.getDiagnostics();
      setDiagnostics(diag);
      
      if (diag.error) {
        addTestResult('System Check', 'error', `Diagnostics failed: ${diag.error}`);
      } else {
        addTestResult('System Check', 'success', 
          `Storage: ${diag.storageAvailable ? 'Available' : 'Not Available'}, ` +
          `Profile: ${diag.hasProfile ? 'Cached' : 'No Cache'}, ` +
          `Queue: ${diag.queueLength} items`);
      }

      if (user) {
        // Test 2: Save test data
        addTestResult('Save Test', 'info', 'Testing save functionality...');
        const testData = {
          ...user.userData,
          testField: `Test saved at ${new Date().toISOString()}`,
          diagnosticRun: true
        };

        const saveResult = enhancedDataService.saveUserProfileData(user.uid, testData);
        if (saveResult.success) {
          addTestResult('Save Test', 'success', 'Data saved successfully to enhanced storage');
        } else {
          addTestResult('Save Test', 'error', `Save failed: ${saveResult.error}`);
        }

        // Test 3: Load test data
        addTestResult('Load Test', 'info', 'Testing load functionality...');
        const loadResult = enhancedDataService.loadUserProfileData(user.uid);
        if (loadResult.success) {
          addTestResult('Load Test', 'success', 
            `Data loaded successfully. Test field: ${loadResult.data.testField}`, {
            cacheAge: Math.round(loadResult.meta.age / 1000) + 's',
            version: loadResult.meta.version,
            integrity: loadResult.meta.integrity
          });
        } else {
          addTestResult('Load Test', 'error', `Load failed: ${loadResult.error}`);
        }

        // Test 4: Enhanced data retrieval
        addTestResult('Enhanced Retrieval', 'info', 'Testing enhanced data retrieval...');
        const enhancedResult = await enhancedDataService.getEnhancedUserData(user.uid);
        if (enhancedResult.success) {
          addTestResult('Enhanced Retrieval', 'success', 
            `Retrieved from ${enhancedResult.source}. Has test field: ${!!enhancedResult.data?.testField}`, {
            source: enhancedResult.source,
            hadCache: enhancedResult.hadCache,
            cacheAge: enhancedResult.cacheAge ? Math.round(enhancedResult.cacheAge / 1000) + 's' : 'N/A'
          });
        } else {
          addTestResult('Enhanced Retrieval', 'error', `Failed: ${enhancedResult.error}`);
        }

        // Test 5: Update functionality
        addTestResult('Update Test', 'info', 'Testing update functionality...');
        const updateResult = await enhancedDataService.updateEnhancedUserData(user.uid, {
          lastDiagnostic: new Date().toISOString(),
          diagnosticsPassed: true
        });

        if (updateResult.success) {
          addTestResult('Update Test', 'success', 
            `Update successful via ${updateResult.source}${updateResult.pendingSync ? ' (pending sync)' : ''}`, {
            source: updateResult.source,
            pendingSync: updateResult.pendingSync || false
          });
        } else {
          addTestResult('Update Test', 'error', `Update failed: ${updateResult.error}`);
        }

        // Final diagnostics
        const finalDiag = enhancedDataService.getDiagnostics();
        setDiagnostics(finalDiag);
      }

      addTestResult('Complete', 'success', 'All storage diagnostics completed');

    } catch (error) {
      addTestResult('Error', 'error', `Diagnostic error: ${error.message}`);
    }

    setIsRunning(false);
  };

  const clearStorageData = () => {
    const result = enhancedDataService.clearUserData();
    if (result.success) {
      addTestResult('Clear Storage', 'success', 'Enhanced storage data cleared');
      setDiagnostics(enhancedDataService.getDiagnostics());
    } else {
      addTestResult('Clear Storage', 'error', `Clear failed: ${result.error}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '•';
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Enhanced Storage Diagnostics
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Advanced storage system testing and data persistence verification
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={runStorageDiagnostics}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </button>
          <button
            onClick={clearStorageData}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Clear Storage
          </button>
        </div>
      </div>

      {/* Current User Info */}
      {user && (
        <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">Current User</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Email:</span> {user.email}
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">UID:</span> {user.uid.substring(0, 12)}...
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Username:</span> {user.userData?.username || 'Not set'}
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Data Source:</span> {user.dataSource || 'Unknown'}
            </div>
          </div>
        </div>
      )}

      {/* System Diagnostics */}
      {diagnostics && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3">System Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className={`text-lg ${diagnostics.storageAvailable ? 'text-green-600' : 'text-red-600'}`}>
                {diagnostics.storageAvailable ? '✅' : '❌'}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Storage</div>
            </div>
            <div className="text-center">
              <div className={`text-lg ${diagnostics.hasProfile ? 'text-green-600' : 'text-gray-400'}`}>
                {diagnostics.hasProfile ? '💾' : '📭'}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Profile Cache</div>
            </div>
            <div className="text-center">
              <div className={`text-lg ${diagnostics.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {diagnostics.isOnline ? '🌐' : '📴'}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Network</div>
            </div>
            <div className="text-center">
              <div className="text-lg text-blue-600">
                {diagnostics.queueLength}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Queue Items</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <div>Device ID: {diagnostics.deviceId}</div>
              <div>Last Check: {new Date(diagnostics.lastCheck).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Test Results:
          </h3>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="text-lg mt-0.5">{getStatusIcon(result.status)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {result.test}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded uppercase ${getStatusColor(result.status)}`}>
                      {result.status}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {result.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 break-words">
                    {result.message}
                  </p>
                  {result.details && (
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-600 rounded text-xs">
                      <pre className="text-gray-700 dark:text-gray-200">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {testResults.length === 0 && !isRunning && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Click "Run Diagnostics" to test the enhanced storage system
        </div>
      )}

      {/* Info Panel */}
      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
          Enhanced Storage Features:
        </h4>
        <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
          <li>• Advanced data persistence with integrity checks</li>
          <li>• Multiple fallback mechanisms (Firestore → Cache → Emergency)</li>
          <li>• Offline functionality with automatic sync</li>
          <li>• Data remains safe after sign out</li>
          <li>• Conflict resolution and retry mechanisms</li>
          <li>• Device tracking and diagnostics</li>
        </ul>
      </div>
    </div>
  );
};

export default StorageDiagnostics;