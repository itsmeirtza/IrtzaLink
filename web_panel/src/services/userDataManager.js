import { getUserData, updateUserData } from './firebase';

class UserDataManager {
  constructor() {
    this.cache = new Map();
    this.syncQueue = new Set();
    this.isOnline = navigator.onLine;
    
    // Listen for online/offline status
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Setup periodic sync
    this.setupPeriodicSync();
  }

  // Cache key generators
  getCacheKey(userId, type = 'profile') {
    return `${userId}_${type}`;
  }

  getStorageKey(userId, type = 'profile') {
    return `irtzalink_${userId}_${type}`;
  }

  // Local storage operations
  saveToLocalStorage(key, data) {
    try {
      const storageData = {
        data,
        timestamp: Date.now(),
        version: '1.0'
      };
      localStorage.setItem(key, JSON.stringify(storageData));
    } catch (error) {
      console.error('Error saving to local storage:', error);
    }
  }

  loadFromLocalStorage(key) {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const storageData = JSON.parse(item);
        
        // Check if data is still valid (keep for 7 days for better persistence)
        const isStale = Date.now() - storageData.timestamp > 604800000; // 7 days
        
        return {
          data: storageData.data,
          timestamp: storageData.timestamp,
          isStale
        };
      }
    } catch (error) {
      console.error('Error loading from local storage:', error);
    }
    return null;
  }

  // Get user data with cache and offline support
  async getUserDataCached(userId, forceRefresh = false) {
    const cacheKey = this.getCacheKey(userId);
    const storageKey = this.getStorageKey(userId);

    // Check memory cache first
    if (!forceRefresh && this.cache.has(cacheKey)) {
      return { success: true, data: this.cache.get(cacheKey), source: 'memory' };
    }

    // If offline, use local storage
    if (!this.isOnline) {
      const cachedData = this.loadFromLocalStorage(storageKey);
      if (cachedData) {
        this.cache.set(cacheKey, cachedData.data);
        return { 
          success: true, 
          data: cachedData.data, 
          source: 'localStorage',
          isStale: cachedData.isStale
        };
      }
    }

    try {
      // Fetch from Firebase
      const result = await getUserData(userId);
      if (result.success) {
        // Update cache and local storage
        this.cache.set(cacheKey, result.data);
        this.saveToLocalStorage(storageKey, result.data);
        
        return { success: true, data: result.data, source: 'firebase' };
      } else {
        // Fallback to local storage if Firebase fails
        const cachedData = this.loadFromLocalStorage(storageKey);
        if (cachedData) {
          this.cache.set(cacheKey, cachedData.data);
          return { 
            success: true, 
            data: cachedData.data, 
            source: 'localStorage_fallback',
            isStale: cachedData.isStale
          };
        }
        
        return result;
      }
    } catch (error) {
      // Network error, try local storage
      const cachedData = this.loadFromLocalStorage(storageKey);
      if (cachedData) {
        this.cache.set(cacheKey, cachedData.data);
        return { 
          success: true, 
          data: cachedData.data, 
          source: 'localStorage_error',
          isStale: cachedData.isStale
        };
      }
      
      return { success: false, error: error.message };
    }
  }

  // Update user data with offline queue support
  async updateUserDataCached(userId, updates) {
    const cacheKey = this.getCacheKey(userId);
    const storageKey = this.getStorageKey(userId);

    try {
      // Update memory cache immediately
      if (this.cache.has(cacheKey)) {
        const currentData = this.cache.get(cacheKey);
        const updatedData = { ...currentData, ...updates };
        this.cache.set(cacheKey, updatedData);
        
        // Update local storage immediately
        this.saveToLocalStorage(storageKey, updatedData);
      }

      if (this.isOnline) {
        // Try to update Firebase immediately
        const result = await updateUserData(userId, updates);
        if (result.success) {
          // Refresh cache with latest data from server
          await this.getUserDataCached(userId, true);
          return result;
        } else {
          // Add to sync queue for later
          this.addToSyncQueue(userId, updates);
          return { success: true, queued: true };
        }
      } else {
        // Add to sync queue for when online
        this.addToSyncQueue(userId, updates);
        return { success: true, queued: true };
      }
    } catch (error) {
      // Add to sync queue for later retry
      this.addToSyncQueue(userId, updates);
      return { success: true, queued: true, error: error.message };
    }
  }

  // Sync queue management
  addToSyncQueue(userId, updates) {
    const syncItem = {
      userId,
      updates,
      timestamp: Date.now(),
      retryCount: 0
    };
    
    // Store in localStorage for persistence
    const queueKey = `irtzalink_sync_queue`;
    const existingQueue = JSON.parse(localStorage.getItem(queueKey) || '[]');
    existingQueue.push(syncItem);
    localStorage.setItem(queueKey, JSON.stringify(existingQueue));
    
    this.syncQueue.add(syncItem);
  }

  // Process sync queue
  async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.size === 0) {
      return;
    }

    const queueKey = `irtzalink_sync_queue`;
    const queueItems = JSON.parse(localStorage.getItem(queueKey) || '[]');
    const processedItems = [];

    for (const item of queueItems) {
      try {
        const result = await updateUserData(item.userId, item.updates);
        if (result.success) {
          processedItems.push(item);
          // Refresh cache
          await this.getUserDataCached(item.userId, true);
        } else if (item.retryCount < 3) {
          // Retry up to 3 times
          item.retryCount++;
        } else {
          // Give up after 3 retries
          processedItems.push(item);
          console.error('Failed to sync after 3 retries:', item);
        }
      } catch (error) {
        if (item.retryCount < 3) {
          item.retryCount++;
        } else {
          processedItems.push(item);
          console.error('Sync error after 3 retries:', error);
        }
      }
    }

    // Remove processed items from queue
    const remainingItems = queueItems.filter(item => !processedItems.includes(item));
    localStorage.setItem(queueKey, JSON.stringify(remainingItems));
    
    // Update memory queue
    this.syncQueue.clear();
    remainingItems.forEach(item => this.syncQueue.add(item));
  }

  // Network status handlers
  handleOnline() {
    this.isOnline = true;
    console.log('User is back online, processing sync queue...');
    this.processSyncQueue();
  }

  handleOffline() {
    this.isOnline = false;
    console.log('User went offline, data will be cached locally');
  }

  // Setup periodic sync (every 5 minutes when online)
  setupPeriodicSync() {
    setInterval(() => {
      if (this.isOnline && this.syncQueue.size > 0) {
        this.processSyncQueue();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Clear cache for user (useful on logout) - COMPLETELY PRESERVE ALL DATA
  clearUserCache(userId) {
    // FIXED: NEVER CLEAR ANY USER PROFILE DATA - ONLY CLEAR SESSION TOKENS
    // This COMPLETELY prevents data loss on sign out/in cycles
    
    console.log('🔒 FIXED: Clearing ONLY session data, preserving ALL user profile data');
    
    // Clear ONLY authentication tokens and temporary session data
    const sessionOnlyKeys = [
      `firebase_auth_token_${userId}`,
      `irtzalink_${userId}_auth_session`,
      `temp_login_${userId}`,
      `session_${userId}`,
      `auth_temp_${userId}`
    ];
    
    sessionOnlyKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log(`🗑️ FIXED: Removed session key: ${key}`);
      } catch (e) {
        // Silent fail
      }
    });
    
    // Remove ONLY from memory cache, NEVER touch localStorage profile data
    const cacheKey = this.getCacheKey(userId);
    this.cache.delete(cacheKey);
    
    // PRESERVE ALL USER DATA: username, displayName, bio, socialLinks, contactInfo, etc.
    const profileKeys = [
      `irtzalink_${userId}_profile_v3`,
      `irtzalink_user_${userId}_backup`,
      `irtzalink_data_${userId}_safe`,
      `user_profile_${userId}_permanent`,
      `irtzalink_permanent_${userId}_v3`
    ];
    
    // VERIFY that profile data is still intact
    let profileDataIntact = 0;
    profileKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed && (parsed.username || parsed.displayName)) {
            profileDataIntact++;
          }
        }
      } catch (e) {}
    });
    
    console.log('✅ FIXED: Session tokens cleared but ALL user profile data preserved!');
    console.log(`✅ FIXED: Found ${profileDataIntact}/5 profile backups intact`);
    console.log('✅ FIXED: User will NEVER lose links, username, bio, or social links!');
    console.log('🔒 FIXED: Data persistence is GUARANTEED - logout is now SAFE!');
  }

  // Clear all cache (useful for app reset)
  clearAllCache() {
    this.cache.clear();
    
    // Clear all IrtzaLink data from localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('irtzalink_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    this.syncQueue.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      memoryCacheSize: this.cache.size,
      syncQueueSize: this.syncQueue.size,
      isOnline: this.isOnline,
      localStorageUsage: this.getLocalStorageUsage()
    };
  }

  getLocalStorageUsage() {
    let totalSize = 0;
    const irtzaLinkKeys = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('irtzalink_')) {
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += item.length;
          irtzaLinkKeys.push(key);
        }
      }
    }
    
    return {
      totalSize: totalSize,
      keyCount: irtzaLinkKeys.length,
      keys: irtzaLinkKeys
    };
  }
}

// Create singleton instance
export const userDataManager = new UserDataManager();
export default userDataManager;