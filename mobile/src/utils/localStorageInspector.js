/**
 * Direct localStorage inspector and manipulator
 * This will help us see exactly what's happening with localStorage
 */

export class LocalStorageInspector {
  
  // Get all IrtzaLink-related localStorage items
  static getAllIrtzaLinkData() {
    const data = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('irtzalink') || key.includes('userData') || key.includes('profile'))) {
        try {
          const value = localStorage.getItem(key);
          data[key] = {
            rawValue: value,
            parsedValue: JSON.parse(value),
            size: value.length,
            timestamp: Date.now()
          };
        } catch (e) {
          data[key] = {
            rawValue: value,
            parsedValue: 'PARSE_ERROR',
            error: e.message,
            size: value ? value.length : 0
          };
        }
      }
    }
    
    return data;
  }
  
  // Save user data with MAXIMUM redundancy
  static saveUserDataDirect(userId, userData) {
    if (!userId || !userData) {
      console.error('❌ Missing userId or userData');
      return { success: false, error: 'Missing data' };
    }
    
    const timestamp = Date.now();
    const saveData = {
      ...userData,
      userId,
      savedAt: timestamp,
      savedBy: 'LocalStorageInspector',
      version: '3.0'
    };
    
    // Save to MULTIPLE keys for maximum redundancy
    const keys = [
      `irtzalink_user_${userId}`,
      `irtzalink_profile_${userId}`,
      `irtzalink_data_${userId}`,
      `irtzalink_backup_${userId}`,
      `userData_${userId}`,
      `profileData_${userId}`,
      `user_${userId}`,
      `backup_${userId}`
    ];
    
    let successCount = 0;
    const results = {};
    
    keys.forEach(key => {
      try {
        localStorage.setItem(key, JSON.stringify(saveData));
        results[key] = 'SUCCESS';
        successCount++;
        console.log(`✅ Saved to: ${key}`);
      } catch (error) {
        results[key] = `ERROR: ${error.message}`;
        console.error(`❌ Failed to save to ${key}:`, error);
      }
    });
    
    console.log(`💾 Saved user data to ${successCount}/${keys.length} locations`);
    console.log('📊 Save results:', results);
    console.log('📋 Saved data preview:', {
      displayName: saveData.displayName,
      username: saveData.username,
      bio: saveData.bio,
      keysCount: Object.keys(saveData).length
    });
    
    return { 
      success: successCount > 0, 
      successCount, 
      totalKeys: keys.length,
      results 
    };
  }
  
  // Load user data from ANY available key
  static loadUserDataDirect(userId) {
    if (!userId) {
      return { success: false, error: 'Missing userId' };
    }
    
    const keys = [
      `irtzalink_user_${userId}`,
      `irtzalink_profile_${userId}`,
      `irtzalink_data_${userId}`,
      `irtzalink_backup_${userId}`,
      `userData_${userId}`,
      `profileData_${userId}`,
      `user_${userId}`,
      `backup_${userId}`
    ];
    
    console.log(`🔍 Looking for data for userId: ${userId.slice(0, 8)}...`);
    
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsedData = JSON.parse(data);
          console.log(`✅ FOUND data at key: ${key}`);
          console.log(`📋 Data preview:`, {
            displayName: parsedData.displayName,
            username: parsedData.username,
            bio: parsedData.bio,
            savedAt: parsedData.savedAt,
            keysCount: Object.keys(parsedData).length
          });
          
          return {
            success: true,
            data: parsedData,
            foundAt: key,
            keyIndex: i
          };
        } else {
          console.log(`❌ No data at key: ${key}`);
        }
      } catch (error) {
        console.error(`❌ Error parsing data at ${key}:`, error);
      }
    }
    
    console.log(`❌ NO DATA FOUND for userId: ${userId.slice(0, 8)}... in any of ${keys.length} locations`);
    return { success: false, error: 'No data found in any location' };
  }
  
  // Clear specific user data (for testing)
  static clearUserData(userId) {
    const keys = [
      `irtzalink_user_${userId}`,
      `irtzalink_profile_${userId}`,
      `irtzalink_data_${userId}`,
      `irtzalink_backup_${userId}`,
      `userData_${userId}`,
      `profileData_${userId}`,
      `user_${userId}`,
      `backup_${userId}`
    ];
    
    let clearedCount = 0;
    keys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        clearedCount++;
        console.log(`🗑️ Cleared: ${key}`);
      }
    });
    
    console.log(`🗑️ Cleared ${clearedCount} data locations for user`);
    return { clearedCount };
  }
  
  // Show localStorage usage stats
  static getStorageStats() {
    let totalItems = localStorage.length;
    let irtzaLinkItems = 0;
    let totalSize = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      
      if (key && key.includes('irtzalink')) {
        irtzaLinkItems++;
      }
      
      if (value) {
        totalSize += value.length;
      }
    }
    
    return {
      totalItems,
      irtzaLinkItems,
      totalSize,
      availableSpace: 5000000 - totalSize // Rough estimate
    };
  }
  
  // Test localStorage functionality
  static testLocalStorage() {
    const testKey = 'irtzalink_test';
    const testData = { test: true, timestamp: Date.now() };
    
    try {
      // Test save
      localStorage.setItem(testKey, JSON.stringify(testData));
      console.log('✅ localStorage save test: PASSED');
      
      // Test load
      const loaded = localStorage.getItem(testKey);
      const parsed = JSON.parse(loaded);
      
      if (parsed.test && parsed.timestamp) {
        console.log('✅ localStorage load test: PASSED');
        
        // Cleanup
        localStorage.removeItem(testKey);
        console.log('✅ localStorage cleanup test: PASSED');
        
        return { success: true, message: 'localStorage is working properly' };
      } else {
        return { success: false, message: 'localStorage data corruption' };
      }
    } catch (error) {
      console.error('❌ localStorage test failed:', error);
      return { success: false, message: error.message };
    }
  }
}

export default LocalStorageInspector;