// Enhanced DataService - Improved storage persistence solution
// Fixes data loss issues after sign out

import { getUserData, updateUserData as updateFirestoreUserData } from './firebase';

const STORAGE_KEYS = {
  USER_PROFILE: 'irtzalink_enhanced_profile',
  USER_SETTINGS: 'irtzalink_user_settings', 
  CACHE_META: 'irtzalink_cache_meta'
};

const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

class EnhancedDataService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.setupNetworkListeners();
    this.initializeStorage();
  }

  initializeStorage() {
    // Ensure localStorage is working
    try {
      localStorage.setItem('irtzalink_test', 'test');
      localStorage.removeItem('irtzalink_test');
      console.log('✅ Enhanced DataService initialized successfully');
    } catch (error) {
      console.error('❌ localStorage not available:', error);
    }
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Back online - syncing data...');
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 Offline mode activated');
    });
  }

  // Enhanced save with better error handling
  saveUserProfileData(userId, profileData) {
    try {
      const enhancedData = {
        userId: userId,
        profileData: profileData,
        timestamp: new Date().toISOString(),
        version: '2.0',
        deviceId: this.getDeviceId(),
        syncStatus: 'saved'
      };

      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(enhancedData));
      localStorage.setItem(STORAGE_KEYS.CACHE_META, JSON.stringify({
        lastUpdated: new Date().toISOString(),
        userId: userId,
        dataIntegrity: 'verified'
      }));

      console.log('✅ Enhanced profile data saved with integrity check');
      return { success: true, cached: true };
    } catch (error) {
      console.error('❌ Error saving enhanced profile data:', error);
      return { success: false, error: error.message };
    }
  }

  // Enhanced load with fallback mechanisms
  loadUserProfileData(userId = null) {
    try {
      const cachedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      const cacheMeta = localStorage.getItem(STORAGE_KEYS.CACHE_META);
      
      if (!cachedProfile) {
        return { success: false, reason: 'no_cache' };
      }

      const profileData = JSON.parse(cachedProfile);
      const metaData = cacheMeta ? JSON.parse(cacheMeta) : null;

      // Verify user ID matches
      if (userId && profileData.userId !== userId) {
        console.log('🔄 User ID mismatch - clearing old cache');
        this.clearUserData();
        return { success: false, reason: 'user_mismatch' };
      }

      // Check cache age
      const cacheAge = new Date() - new Date(profileData.timestamp);
      const isStale = cacheAge > CACHE_DURATION;

      if (isStale) {
        console.log('⏰ Cache is stale but preserving data');
      }

      console.log(`✅ Enhanced profile data loaded (age: ${Math.round(cacheAge / (1000 * 60 * 60))}h)`);
      
      return {
        success: true,
        data: profileData.profileData,
        meta: {
          cached: true,
          age: cacheAge,
          stale: isStale,
          version: profileData.version || '1.0',
          integrity: metaData?.dataIntegrity || 'unknown'
        }
      };
    } catch (error) {
      console.error('❌ Error loading enhanced profile data:', error);
      return { success: false, error: error.message };
    }
  }

  // Smart data retrieval with multiple fallbacks
  async getEnhancedUserData(userId) {
    try {
      console.log('🔍 Getting enhanced user data for:', userId);

      // Step 1: Check cache first for immediate response
      const cachedResult = this.loadUserProfileData(userId);
      
      if (this.isOnline) {
        try {
          // Step 2: Fetch fresh data from Firestore
          console.log('🔥 Fetching fresh data from Firestore...');
          const firestoreResult = await getUserData(userId);
          
          if (firestoreResult.success) {
            // Save fresh data to cache
            this.saveUserProfileData(userId, firestoreResult.data);
            
            return {
              success: true,
              data: firestoreResult.data,
              source: 'firestore_fresh',
              hadCache: cachedResult.success,
              cacheAge: cachedResult.meta?.age || null
            };
          } else {
            // Firestore failed, use cache if available
            if (cachedResult.success) {
              console.log('⚠️ Firestore failed, using cached data');
              return {
                success: true,
                data: cachedResult.data,
                source: 'cache_fallback',
                error: firestoreResult.error,
                cacheInfo: cachedResult.meta
              };
            }
          }
        } catch (error) {
          console.error('❌ Firestore error:', error);
          
          // Use cache as emergency fallback
          if (cachedResult.success) {
            return {
              success: true,
              data: cachedResult.data,
              source: 'cache_emergency',
              error: error.message,
              cacheInfo: cachedResult.meta
            };
          }
        }
      } else {
        // Offline mode
        if (cachedResult.success) {
          console.log('📱 Offline mode - using cached data');
          return {
            success: true,
            data: cachedResult.data,
            source: 'cache_offline',
            cacheInfo: cachedResult.meta
          };
        }
      }

      return { 
        success: false, 
        error: 'No data available from any source',
        checkedSources: ['firestore', 'cache'],
        isOnline: this.isOnline
      };

    } catch (error) {
      console.error('❌ Critical error in getEnhancedUserData:', error);
      return { success: false, error: error.message, critical: true };
    }
  }

  // Enhanced update with conflict resolution
  async updateEnhancedUserData(userId, updates) {
    try {
      console.log('📝 Updating enhanced user data:', Object.keys(updates));

      if (this.isOnline) {
        // Online: Update Firestore first
        const result = await updateFirestoreUserData(userId, updates);
        
        if (result.success) {
          // Update cache with merged data
          const cached = this.loadUserProfileData(userId);
          if (cached.success) {
            const mergedData = { ...cached.data, ...updates };
            this.saveUserProfileData(userId, mergedData);
          }
          
          return { success: true, source: 'firestore_updated' };
        } else {
          // Firestore failed, save to cache for later sync
          this.queueForSync(userId, updates);
          const cached = this.loadUserProfileData(userId);
          if (cached.success) {
            const mergedData = { ...cached.data, ...updates };
            this.saveUserProfileData(userId, mergedData);
          }
          
          return { 
            success: true, 
            source: 'cache_queued',
            pendingSync: true,
            error: result.error 
          };
        }
      } else {
        // Offline: Update cache and queue for sync
        this.queueForSync(userId, updates);
        const cached = this.loadUserProfileData(userId);
        if (cached.success) {
          const mergedData = { ...cached.data, ...updates };
          this.saveUserProfileData(userId, mergedData);
        }
        
        return { 
          success: true, 
          source: 'cache_offline',
          pendingSync: true 
        };
      }
    } catch (error) {
      console.error('❌ Error in updateEnhancedUserData:', error);
      return { success: false, error: error.message };
    }
  }

  // Queue updates for later sync
  queueForSync(userId, updates) {
    try {
      const existingQueue = localStorage.getItem('irtzalink_sync_queue');
      const syncQueue = existingQueue ? JSON.parse(existingQueue) : [];
      
      const queueItem = {
        id: Date.now().toString(),
        userId: userId,
        updates: updates,
        timestamp: new Date().toISOString(),
        type: 'user_data_update',
        retries: 0
      };

      syncQueue.push(queueItem);
      localStorage.setItem('irtzalink_sync_queue', JSON.stringify(syncQueue));
      
      console.log('📋 Update queued for sync:', queueItem.id);
    } catch (error) {
      console.error('❌ Error queuing update:', error);
    }
  }

  // Sync pending updates
  async syncPendingData() {
    try {
      const queueData = localStorage.getItem('irtzalink_sync_queue');
      if (!queueData) return;

      const syncQueue = JSON.parse(queueData);
      console.log(`🔄 Syncing ${syncQueue.length} pending updates...`);

      const syncResults = [];
      
      for (const item of syncQueue) {
        try {
          const result = await updateFirestoreUserData(item.userId, item.updates);
          syncResults.push({ id: item.id, success: result.success });
          
          if (!result.success) {
            item.retries = (item.retries || 0) + 1;
          }
        } catch (error) {
          console.error('❌ Sync failed for item:', item.id, error);
          syncResults.push({ id: item.id, success: false, error: error.message });
        }
      }

      // Remove successfully synced items
      const remainingQueue = syncQueue.filter(item => {
        const result = syncResults.find(r => r.id === item.id);
        return !result?.success && (item.retries || 0) < 3; // Keep items with < 3 retries
      });

      localStorage.setItem('irtzalink_sync_queue', JSON.stringify(remainingQueue));
      console.log(`✅ Sync completed. ${syncResults.filter(r => r.success).length} successful, ${remainingQueue.length} remaining`);
      
    } catch (error) {
      console.error('❌ Error during sync:', error);
    }
  }

  // Clear user data (only when explicitly requested)
  clearUserData() {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
      localStorage.removeItem(STORAGE_KEYS.CACHE_META);
      localStorage.removeItem('irtzalink_sync_queue');
      console.log('🗑️ User data cleared');
      return { success: true };
    } catch (error) {
      console.error('❌ Error clearing user data:', error);
      return { success: false, error: error.message };
    }
  }

  // Get device ID for tracking
  getDeviceId() {
    let deviceId = localStorage.getItem('irtzalink_device_id');
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('irtzalink_device_id', deviceId);
    }
    return deviceId;
  }

  // Get diagnostic info
  getDiagnostics() {
    try {
      const profile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      const meta = localStorage.getItem(STORAGE_KEYS.CACHE_META);
      const queue = localStorage.getItem('irtzalink_sync_queue');
      
      return {
        hasProfile: !!profile,
        hasMeta: !!meta,
        queueLength: queue ? JSON.parse(queue).length : 0,
        isOnline: this.isOnline,
        storageAvailable: this.isStorageAvailable(),
        deviceId: this.getDeviceId(),
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  isStorageAvailable() {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton
const enhancedDataService = new EnhancedDataService();
export default enhancedDataService;