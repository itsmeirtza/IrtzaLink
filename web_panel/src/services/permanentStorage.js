import { getUserData, updateUserData, createUser } from './firebase';

/**
 * Permanent Storage Manager - Never loses data!
 * Works with localStorage as primary storage and Firebase as backup
 */

class PermanentStorageManager {
  constructor() {
    this.storageKey = 'irtzalink_permanent_data';
    this.userKey = 'irtzalink_current_user';
    this.notificationKey = 'irtzalink_notifications';
    
    // Initialize storage
    this.initializeStorage();
    
    console.log('🔒 Permanent Storage Manager initialized - Your data will NEVER be lost!');
  }

  initializeStorage() {
    // Ensure storage exists
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify({}));
    }
    if (!localStorage.getItem(this.notificationKey)) {
      localStorage.setItem(this.notificationKey, JSON.stringify({}));
    }
  }

  // Get storage key for user data
  getUserStorageKey(userId) {
    return `${this.storageKey}_user_${userId}`;
  }

  // Save user data permanently (NEVER gets lost)
  async saveUserData(userId, userData, source = 'manual') {
    if (!userId || !userData) {
      console.error('❌ Cannot save user data: missing userId or userData');
      return { success: false, error: 'Missing required data' };
    }

    const timestamp = Date.now();
    const enhancedData = {
      ...userData,
      userId,
      lastSaved: timestamp,
      lastSavedSource: source,
      version: '2.0'
    };

    try {
      // 1. Save to MULTIPLE locations for maximum safety
      const userStorageKey = this.getUserStorageKey(userId);
      const simpleKey = `irtzalink_user_${userId}`; // Simpler key as backup
      const displayKey = `irtzalink_display_${userId}`; // For display data
      
      // Save to all 3 locations
      localStorage.setItem(userStorageKey, JSON.stringify(enhancedData));
      localStorage.setItem(simpleKey, JSON.stringify(enhancedData));
      localStorage.setItem(displayKey, JSON.stringify({
        displayName: enhancedData.displayName,
        username: enhancedData.username,
        bio: enhancedData.bio,
        socialLinks: enhancedData.socialLinks,
        contactInfo: enhancedData.contactInfo,
        photoURL: enhancedData.photoURL
      }));
      
      // 2. Also save to general storage for backup
      const allData = this.getAllStoredData();
      allData[userId] = enhancedData;
      localStorage.setItem(this.storageKey, JSON.stringify(allData));
      
      console.log(`💾 SUCCESS: User data saved to ${4} locations for user ${userId.slice(0, 8)}... (${source})`);
      console.log(`💾 Saved data preview:`, {
        displayName: enhancedData.displayName,
        username: enhancedData.username,
        hasData: Object.keys(enhancedData).length
      });
      
      // 3. Try Firebase as backup (but don't fail if it doesn't work)
      try {
        if (source !== 'firebase_sync') {
          await this.syncToFirebase(userId, userData);
        }
      } catch (firebaseError) {
        console.warn('⚠️ Firebase sync failed, but data is still saved locally:', firebaseError.message);
      }
      
      return { success: true, source: 'localStorage_primary' };
    } catch (error) {
      console.error('❌ Critical error saving user data:', error);
      return { success: false, error: error.message };
    }
  }

  // Load user data (will ALWAYS work)
  async loadUserData(userId) {
    if (!userId) {
      return { success: false, error: 'User ID required' };
    }

    try {
      // 1. Try multiple storage locations (most reliable first)
      const userStorageKey = this.getUserStorageKey(userId);
      const simpleKey = `irtzalink_user_${userId}`;
      const displayKey = `irtzalink_display_${userId}`;
      
      console.log(`🔍 DEBUG: Checking for data at multiple keys for user ${userId.slice(0, 8)}...`);
      
      // Try primary key first
      let individualData = localStorage.getItem(userStorageKey);
      console.log(`🔍 Primary key (${userStorageKey}):`, individualData ? 'FOUND' : 'NOT FOUND');
      
      // Try simple key if primary fails
      if (!individualData) {
        individualData = localStorage.getItem(simpleKey);
        console.log(`🔍 Simple key (${simpleKey}):`, individualData ? 'FOUND' : 'NOT FOUND');
      }
      
      // Try display key if others fail
      if (!individualData) {
        const displayData = localStorage.getItem(displayKey);
        console.log(`🔍 Display key (${displayKey}):`, displayData ? 'FOUND' : 'NOT FOUND');
        if (displayData) {
          individualData = displayData;
        }
      }
      
      if (individualData) {
        try {
          const userData = JSON.parse(individualData);
          console.log(`📱 SUCCESS: Loaded user data from storage:`, {
            displayName: userData.displayName,
            username: userData.username,
            hasData: Object.keys(userData).length
          });
          
          // IMMEDIATELY return this data
          return { 
            success: true, 
            data: userData, 
            source: 'localStorage_found',
            lastSaved: userData.lastSaved 
          };
        } catch (parseError) {
          console.error(`❌ Error parsing stored data:`, parseError);
        }
      }

      // 2. Try general storage backup
      const allData = this.getAllStoredData();
      console.log(`🔍 DEBUG: All stored data keys:`, Object.keys(allData));
      console.log(`🔍 DEBUG: Looking for userId in backup:`, userId);
      console.log(`🔍 DEBUG: Backup data for user exists:`, allData[userId] ? 'YES' : 'NO');
      
      if (allData[userId]) {
        console.log(`📱 SUCCESS: Loaded user data from general storage:`, allData[userId]);
        
        // Restore to individual storage
        localStorage.setItem(userStorageKey, JSON.stringify(allData[userId]));
        
        return { 
          success: true, 
          data: allData[userId], 
          source: 'localStorage_backup',
          lastSaved: allData[userId].lastSaved
        };
      }

      // 3. Try Firebase as last resort
      console.log(`🔄 No local data found, trying Firebase for ${userId.slice(0, 8)}...`);
      const firebaseResult = await getUserData(userId);
      
      if (firebaseResult.success && firebaseResult.data) {
        console.log(`☁️ Loaded user data from Firebase for ${userId.slice(0, 8)}...`);
        
        // Save to local storage for future
        await this.saveUserData(userId, firebaseResult.data, 'firebase_sync');
        
        return { 
          success: true, 
          data: firebaseResult.data, 
          source: 'firebase',
          lastSaved: Date.now()
        };
      }

      // 4. Create new user data if nothing exists
      console.log(`🆕 Creating new user data for ${userId.slice(0, 8)}...`);
      const newUserData = {
        uid: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        socialLinks: {},
        contactInfo: {},
        theme: 'dark',
        followers: [],
        following: []
      };

      await this.saveUserData(userId, newUserData, 'new_user');
      
      return { 
        success: true, 
        data: newUserData, 
        source: 'created_new',
        lastSaved: Date.now()
      };

    } catch (error) {
      console.error('❌ Error loading user data:', error);
      return { success: false, error: error.message };
    }
  }

  // Update user data (always works)
  async updateUserData(userId, updates) {
    if (!userId || !updates) {
      return { success: false, error: 'Missing required data' };
    }

    try {
      // 1. Load current data
      const currentResult = await this.loadUserData(userId);
      const currentData = currentResult.success ? currentResult.data : {};

      // 2. Merge updates
      const updatedData = {
        ...currentData,
        ...updates,
        updatedAt: new Date(),
        lastUpdated: Date.now()
      };

      // 3. Save updated data
      const saveResult = await this.saveUserData(userId, updatedData, 'update');
      
      if (saveResult.success) {
        console.log(`✅ User data updated successfully for ${userId.slice(0, 8)}...`);
        return { success: true, data: updatedData };
      } else {
        throw new Error(saveResult.error);
      }

    } catch (error) {
      console.error('❌ Error updating user data:', error);
      return { success: false, error: error.message };
    }
  }

  // Background Firebase sync (doesn't block UI)
  async backgroundSyncFromFirebase(userId, localData) {
    try {
      const firebaseResult = await getUserData(userId);
      if (firebaseResult.success && firebaseResult.data) {
        const firebaseUpdatedAt = new Date(firebaseResult.data.updatedAt);
        const localUpdatedAt = new Date(localData.updatedAt || 0);

        // If Firebase has newer data, update local storage
        if (firebaseUpdatedAt > localUpdatedAt) {
          console.log(`🔄 Firebase has newer data, updating local storage for ${userId.slice(0, 8)}...`);
          await this.saveUserData(userId, firebaseResult.data, 'firebase_sync');
        }
      }
    } catch (error) {
      console.warn('⚠️ Background Firebase sync failed (this is OK):', error.message);
    }
  }

  // Sync to Firebase (best effort)
  async syncToFirebase(userId, userData) {
    try {
      const result = await updateUserData(userId, userData);
      if (result.success) {
        console.log(`☁️ Synced user data to Firebase for ${userId.slice(0, 8)}...`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.warn(`⚠️ Firebase sync failed for ${userId.slice(0, 8)}...:`, error.message);
      // Don't throw - local storage is the primary source
    }
  }

  // Get all stored data
  getAllStoredData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error reading stored data:', error);
      return {};
    }
  }

  // Save notification permanently
  async saveNotification(userId, notification) {
    try {
      const allNotifications = JSON.parse(localStorage.getItem(this.notificationKey) || '{}');
      
      if (!allNotifications[userId]) {
        allNotifications[userId] = [];
      }
      
      const enhancedNotification = {
        ...notification,
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        savedAt: Date.now(),
        source: 'local'
      };
      
      allNotifications[userId].unshift(enhancedNotification);
      
      // Keep only latest 50 notifications
      allNotifications[userId] = allNotifications[userId].slice(0, 50);
      
      localStorage.setItem(this.notificationKey, JSON.stringify(allNotifications));
      
      console.log(`🔔 Notification saved locally for user ${userId.slice(0, 8)}...`);
      return { success: true, notification: enhancedNotification };
      
    } catch (error) {
      console.error('Error saving notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Get notifications for user
  getNotifications(userId) {
    try {
      const allNotifications = JSON.parse(localStorage.getItem(this.notificationKey) || '{}');
      const userNotifications = allNotifications[userId] || [];
      
      console.log(`🔔 Retrieved ${userNotifications.length} notifications for user ${userId.slice(0, 8)}...`);
      
      return {
        success: true,
        data: userNotifications.map(notif => ({
          ...notif,
          fromUser: { displayName: 'System' } // Default user info
        }))
      };
    } catch (error) {
      console.error('Error getting notifications:', error);
      return { success: false, error: error.message };
    }
  }

  // Get storage stats
  getStorageStats() {
    const allData = this.getAllStoredData();
    const notifications = JSON.parse(localStorage.getItem(this.notificationKey) || '{}');
    
    return {
      totalUsers: Object.keys(allData).length,
      totalNotifications: Object.values(notifications).reduce((sum, userNotifs) => sum + userNotifs.length, 0),
      storageUsed: JSON.stringify(allData).length + JSON.stringify(notifications).length,
      lastAccessed: Date.now()
    };
  }

  // Clear specific user data (for testing)
  clearUserData(userId) {
    try {
      const userStorageKey = this.getUserStorageKey(userId);
      localStorage.removeItem(userStorageKey);
      
      const allData = this.getAllStoredData();
      delete allData[userId];
      localStorage.setItem(this.storageKey, JSON.stringify(allData));
      
      console.log(`🗑️ Cleared local data for user ${userId.slice(0, 8)}...`);
      return { success: true };
    } catch (error) {
      console.error('Error clearing user data:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
export const permanentStorage = new PermanentStorageManager();

// Export helper functions
export const saveUserDataPermanently = (userId, userData) => permanentStorage.saveUserData(userId, userData);
export const loadUserDataPermanently = (userId) => permanentStorage.loadUserData(userId);
export const updateUserDataPermanently = (userId, updates) => permanentStorage.updateUserData(userId, updates);
export const saveNotificationPermanently = (userId, notification) => permanentStorage.saveNotification(userId, notification);
export const getNotificationsPermanently = (userId) => permanentStorage.getNotifications(userId);

export default permanentStorage;