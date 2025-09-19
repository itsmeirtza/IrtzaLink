/**
 * STORAGE TEST UTILITIES
 * Simple utilities for testing storage functionality
 */

// Test if localStorage is available and working
export const testLocalStorage = () => {
  try {
    const testKey = '__storage_test__';
    const testValue = 'test';
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    return retrieved === testValue;
  } catch (error) {
    console.warn('localStorage test failed:', error);
    return false;
  }
};

// Test if sessionStorage is available and working
export const testSessionStorage = () => {
  try {
    const testKey = '__session_test__';
    const testValue = 'test';
    sessionStorage.setItem(testKey, testValue);
    const retrieved = sessionStorage.getItem(testKey);
    sessionStorage.removeItem(testKey);
    return retrieved === testValue;
  } catch (error) {
    console.warn('sessionStorage test failed:', error);
    return false;
  }
};

// Test if IndexedDB is available
export const testIndexedDB = () => {
  return 'indexedDB' in window && window.indexedDB !== null;
};

// Get storage capabilities summary
export const getStorageCapabilities = () => {
  return {
    localStorage: testLocalStorage(),
    sessionStorage: testSessionStorage(),
    indexedDB: testIndexedDB()
  };
};

// Log storage test results
export const logStorageTest = () => {
  const capabilities = getStorageCapabilities();
  console.log('🧪 Storage Test Results:', capabilities);
  return capabilities;
};

export default {
  testLocalStorage,
  testSessionStorage,
  testIndexedDB,
  getStorageCapabilities,
  logStorageTest
};