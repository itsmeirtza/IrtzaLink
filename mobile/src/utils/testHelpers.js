import { userDataManager } from '../services/userDataManager';
import { createTestNotification } from '../services/firebase';

/**
 * Test functions to help diagnose and fix data persistence and notification issues
 */

// Test data persistence
export const testDataPersistence = async (userId) => {
  if (!userId) {
    console.error('UserId is required for testing data persistence');
    return { success: false, error: 'UserId is required' };
  }

  try {
    // Get the cache stats before
    const beforeStats = userDataManager.getCacheStats();
    console.log('Cache stats before test:', beforeStats);
    
    // Get user data
    const userData = await userDataManager.getUserDataCached(userId);
    console.log('User data from cache:', userData);
    
    // Simulate a logout/login cycle by clearing memory cache but keeping localStorage
    const cacheKey = userDataManager.getCacheKey(userId);
    userDataManager.cache.delete(cacheKey); // Remove from memory cache
    
    // Try to get user data again - should get from localStorage
    const userDataAfter = await userDataManager.getUserDataCached(userId);
    console.log('User data after simulated logout/login:', userDataAfter);
    
    return {
      success: true,
      beforeDataSource: userData.source,
      afterDataSource: userDataAfter.source,
      dataPersisted: userDataAfter.success && userDataAfter.data !== null,
      persistenceWorking: userDataAfter.success && userDataAfter.source.includes('localStorage')
    };
  } catch (error) {
    console.error('Error testing data persistence:', error);
    return { success: false, error: error.message };
  }
};

// Test notification system
export const testNotificationSystem = async (userId) => {
  if (!userId) {
    console.error('UserId is required for testing notifications');
    return { success: false, error: 'UserId is required' };
  }

  try {
    // Create a test notification
    const result = await createTestNotification(userId);
    if (!result.success) {
      return { 
        success: false, 
        error: 'Failed to create test notification',
        details: result.error
      };
    }
    
    return {
      success: true,
      message: 'Test notification created. Check the notification bell icon to confirm it appears.'
    };
  } catch (error) {
    console.error('Error testing notification system:', error);
    return { success: false, error: error.message };
  }
};

// Helper functions for debugging
export const getLocalStorageItems = () => {
  const items = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('irtzalink_')) {
      try {
        items[key] = JSON.parse(localStorage.getItem(key));
      } catch (e) {
        items[key] = localStorage.getItem(key);
      }
    }
  }
  return items;
};

export default {
  testDataPersistence,
  testNotificationSystem,
  getLocalStorageItems
};