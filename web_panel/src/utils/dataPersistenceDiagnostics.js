// Data Persistence Diagnostics Utility
// Use this to debug data persistence issues

export const diagnosePersistenceIssues = (userId) => {
  console.log(`🔍 DIAGNOSTICS: Analyzing data persistence for user ${userId.slice(0, 8)}...`);
  
  const results = {
    userId: userId,
    timestamp: new Date().toISOString(),
    backupLocations: {},
    summary: {}
  };
  
  // Check all possible storage keys
  const storageKeys = [
    // Enhanced v3 keys
    `irtzalink_${userId}_profile_v3`,
    `irtzalink_user_${userId}_backup`,
    `irtzalink_data_${userId}_safe`,
    `user_profile_${userId}_permanent`,
    `irtzalink_permanent_${userId}_v3`,
    
    // Legacy keys
    `irtzalink_${userId}_profile`,
    `irtzalink_user_${userId}`,
    `irtzalink_persistent_${userId}`,
    
    // Permanent storage keys
    `irtzalink_permanent_data_user_${userId}`,
    `irtzalink_display_${userId}`,
    
    // General user data
    'userData'
  ];
  
  let totalDataFound = 0;
  let latestData = null;
  let latestTimestamp = 0;
  
  console.log(`🔍 Checking ${storageKeys.length} storage locations...`);
  
  storageKeys.forEach(key => {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        const timestamp = parsed.savedTimestamp || parsed.timestamp || parsed.lastSaved || 0;
        
        results.backupLocations[key] = {
          exists: true,
          dataSize: data.length,
          hasUsername: !!(parsed.username || parsed.data?.username),
          hasDisplayName: !!(parsed.displayName || parsed.data?.displayName),
          hasBio: !!(parsed.bio || parsed.data?.bio),
          hasSocialLinks: !!(parsed.socialLinks || parsed.data?.socialLinks),
          timestamp: timestamp,
          version: parsed.persistenceVersion || parsed.version || 'legacy'
        };
        
        totalDataFound++;
        
        if (timestamp > latestTimestamp) {
          latestTimestamp = timestamp;
          latestData = parsed.data || parsed;
        }
        
        console.log(`✅ Found data at ${key}:`, {
          size: data.length + ' bytes',
          username: parsed.username || parsed.data?.username || 'none',
          version: parsed.persistenceVersion || 'legacy'
        });
      } else {
        results.backupLocations[key] = { exists: false };
      }
    } catch (error) {
      results.backupLocations[key] = { 
        exists: true, 
        error: error.message,
        corrupted: true 
      };
      console.warn(`⚠️ Corrupted data at ${key}:`, error.message);
    }
  });
  
  // Summary
  results.summary = {
    totalLocationsChecked: storageKeys.length,
    locationsWithData: totalDataFound,
    hasAnyData: totalDataFound > 0,
    latestData: latestData,
    latestTimestamp: new Date(latestTimestamp).toISOString(),
    recommendations: []
  };
  
  // Generate recommendations
  if (totalDataFound === 0) {
    results.summary.recommendations.push('❌ NO DATA FOUND - User needs to save profile again');
  } else if (totalDataFound < 3) {
    results.summary.recommendations.push('⚠️ LIMITED BACKUPS - Profile should be saved again for better redundancy');
  } else {
    results.summary.recommendations.push('✅ Good data redundancy found');
  }
  
  if (latestData) {
    if (!latestData.username) {
      results.summary.recommendations.push('⚠️ No username set - user should set username in profile');
    }
    if (!latestData.displayName) {
      results.summary.recommendations.push('⚠️ No display name - user should complete profile');
    }
    if (!latestData.socialLinks || Object.keys(latestData.socialLinks).length === 0) {
      results.summary.recommendations.push('ℹ️ No social links - user can add social links in profile');
    }
  }
  
  console.log('📊 DIAGNOSTICS SUMMARY:', results.summary);
  console.log('🔍 Full diagnostics available in returned object');
  
  return results;
};

export const repairDataPersistence = async (userId, userData) => {
  console.log(`🔧 REPAIR: Attempting to repair data persistence for user ${userId.slice(0, 8)}...`);
  
  if (!userData) {
    console.error('❌ No user data provided for repair');
    return { success: false, error: 'No user data provided' };
  }
  
  try {
    const enhancedData = {
      ...userData,
      userId: userId,
      persistenceVersion: '3.0',
      savedTimestamp: Date.now(),
      savedDate: new Date().toISOString(),
      repairedAt: new Date().toISOString(),
      repairSource: 'manual_repair'
    };
    
    // Save to all backup locations
    const backupKeys = [
      `irtzalink_${userId}_profile_v3`,
      `irtzalink_user_${userId}_backup`,
      `irtzalink_data_${userId}_safe`,
      `user_profile_${userId}_permanent`,
      `irtzalink_permanent_${userId}_v3`
    ];
    
    let successCount = 0;
    const errors = [];
    
    backupKeys.forEach((key, index) => {
      try {
        localStorage.setItem(key, JSON.stringify(enhancedData));
        console.log(`✅ Repair ${index + 1}/5: Saved to ${key}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Repair ${index + 1}/5: Failed to save to ${key}:`, error.message);
        errors.push({ key, error: error.message });
      }
    });
    
    console.log(`🔧 REPAIR COMPLETE: ${successCount}/5 locations repaired`);
    
    return {
      success: successCount > 0,
      successCount,
      totalAttempted: backupKeys.length,
      errors: errors.length > 0 ? errors : null,
      message: `Data persistence repaired in ${successCount} locations`
    };
    
  } catch (error) {
    console.error('❌ REPAIR FAILED:', error);
    return { success: false, error: error.message };
  }
};

export const clearAllUserData = (userId) => {
  console.log(`🗑️ CLEANUP: Clearing all data for user ${userId.slice(0, 8)}...`);
  
  const keysToCheck = [
    `irtzalink_${userId}_profile_v3`,
    `irtzalink_user_${userId}_backup`,
    `irtzalink_data_${userId}_safe`,
    `user_profile_${userId}_permanent`,
    `irtzalink_permanent_${userId}_v3`,
    `irtzalink_${userId}_profile`,
    `irtzalink_user_${userId}`,
    `irtzalink_persistent_${userId}`,
    `irtzalink_permanent_data_user_${userId}`,
    `irtzalink_display_${userId}`
  ];
  
  let clearedCount = 0;
  
  keysToCheck.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      clearedCount++;
      console.log(`🗑️ Cleared: ${key}`);
    }
  });
  
  console.log(`🗑️ CLEANUP COMPLETE: ${clearedCount} storage locations cleared`);
  return { success: true, clearedCount };
};

// Quick diagnostic function for console use
window.irtzaDiagnose = diagnosePersistenceIssues;
window.irtzaRepair = repairDataPersistence;
window.irtzaClear = clearAllUserData;

console.log('🔧 IrtzaLink Data Diagnostics loaded!');
console.log('💡 Use these console commands:');
console.log('   irtzaDiagnose(userId) - Check data persistence');
console.log('   irtzaRepair(userId, userData) - Repair data persistence');
console.log('   irtzaClear(userId) - Clear all user data');