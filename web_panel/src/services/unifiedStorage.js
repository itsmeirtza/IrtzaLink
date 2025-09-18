/**
 * UNIFIED DATA STORAGE SYSTEM
 * Single source of truth for all user data
 * No more conflicts between Firebase and localStorage
 */

import { 
  auth, 
  db, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  limit 
} from './firebase';

class UnifiedStorage {
  constructor() {
    this.memoryCache = new Map();
    this.isOnline = navigator.onLine;
    
    // Listen for online/offline
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Back online - syncing data...');
      this.syncPendingData();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📱 Offline mode - using local cache');
    });
    
    console.log('🔄 Unified Storage initialized - Single source of truth!');
  }

  // SINGLE METHOD TO GET USER DATA
  async getUserData(userId, forceRefresh = false) {
    try {
      if (!userId) {
        return { success: false, error: 'User ID required' };
      }

      console.log(`🔍 UNIFIED: Getting data for ${userId.slice(0, 8)}...`);

      // Check memory cache first (fastest)
      if (!forceRefresh && this.memoryCache.has(userId)) {
        const cached = this.memoryCache.get(userId);
        console.log(`⚡ UNIFIED: Memory cache hit for ${userId.slice(0, 8)}`);
        return { success: true, data: cached, source: 'memory' };
      }

      // Try localStorage (fast)
      const localData = this.getFromLocalStorage(userId);
      if (localData && !forceRefresh) {
        this.memoryCache.set(userId, localData);
        console.log(`💾 UNIFIED: LocalStorage hit for ${userId.slice(0, 8)}`);
        
        // Background sync with Firebase (don't wait)
        if (this.isOnline) {
          this.backgroundSync(userId, localData);
        }
        
        return { success: true, data: localData, source: 'localStorage' };
      }

      // Try Firebase (slower but authoritative)
      if (this.isOnline) {
        const firebaseData = await this.getFromFirebase(userId);
        if (firebaseData) {
          // Save to all local storage locations
          this.saveToLocalStorage(userId, firebaseData);
          this.memoryCache.set(userId, firebaseData);
          
          console.log(`☁️ UNIFIED: Firebase hit for ${userId.slice(0, 8)}`);
          return { success: true, data: firebaseData, source: 'firebase' };
        }
      }

      // If nothing found, return error
      console.log(`❌ UNIFIED: No data found for ${userId.slice(0, 8)}`);
      return { success: false, error: 'User not found' };

    } catch (error) {
      console.error('❌ UNIFIED: Error getting user data:', error);
      
      // Emergency fallback to localStorage
      const localData = this.getFromLocalStorage(userId);
      if (localData) {
        console.log(`🆘 UNIFIED: Emergency recovery for ${userId.slice(0, 8)}`);
        return { success: true, data: localData, source: 'emergency' };
      }
      
      return { success: false, error: error.message };
    }
  }

  // SINGLE METHOD TO SAVE USER DATA
  async saveUserData(userId, userData) {
    try {
      if (!userId || !userData) {
        return { success: false, error: 'Missing userId or userData' };
      }

      console.log(`💾 UNIFIED: Saving data for ${userId.slice(0, 8)}...`);

      const enhancedData = {
        ...userData,
        userId,
        updatedAt: new Date(),
        lastSaved: Date.now()
      };

      // STEP 1: Save to memory cache (instant)
      this.memoryCache.set(userId, enhancedData);
      console.log(`⚡ UNIFIED: Memory cache updated`);

      // STEP 2: Save to localStorage (instant backup)
      this.saveToLocalStorage(userId, enhancedData);
      console.log(`💾 UNIFIED: LocalStorage updated`);

      // STEP 3: Save to Firebase (for search and sync)
      let firebaseSuccess = false;
      if (this.isOnline) {
        firebaseSuccess = await this.saveToFirebase(userId, enhancedData);
      }

      if (!firebaseSuccess && this.isOnline) {
        // Add to pending sync queue
        this.addToPendingSync(userId, enhancedData);
        console.log(`⏳ UNIFIED: Added to pending sync queue`);
      }

      console.log(`✅ UNIFIED: Save complete - memory ✓, localStorage ✓, firebase ${firebaseSuccess ? '✓' : '⏳'}`);
      
      return { 
        success: true, 
        savedToMemory: true,
        savedToLocal: true,
        savedToFirebase: firebaseSuccess,
        message: firebaseSuccess ? 'Saved everywhere' : 'Saved locally, Firebase pending'
      };

    } catch (error) {
      console.error('❌ UNIFIED: Save error:', error);
      return { success: false, error: error.message };
    }
  }

  // SINGLE METHOD TO SEARCH USERS
  async searchUsers(searchTerm) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return { success: true, data: [] };
      }

      console.log(`🔍 UNIFIED: Searching for "${searchTerm}"`);
      
      const results = [];
      const searchLower = searchTerm.toLowerCase();

      // FIRST: Search in memory cache
      this.memoryCache.forEach((userData, userId) => {
        if (this.matchesSearch(userData, searchLower)) {
          results.push(this.formatSearchResult(userData));
        }
      });

      // SECOND: Search in localStorage
      this.searchLocalStorage(searchLower, results);

      // THIRD: Search in Firebase (if online)
      if (this.isOnline) {
        const firebaseResults = await this.searchFirebase(searchTerm);
        
        // Merge results (avoid duplicates)
        firebaseResults.forEach(result => {
          if (!results.find(r => r.uid === result.uid)) {
            results.push(result);
          }
        });
      }

      // Sort by relevance
      results.sort((a, b) => {
        if (a.username === searchLower) return -1;
        if (b.username === searchLower) return 1;
        if (a.username.startsWith(searchLower)) return -1;
        if (b.username.startsWith(searchLower)) return 1;
        return 0;
      });

      console.log(`✅ UNIFIED: Found ${results.length} results for "${searchTerm}"`);
      return { success: true, data: results.slice(0, 20) };

    } catch (error) {
      console.error('❌ UNIFIED: Search error:', error);
      return { success: false, error: error.message };
    }
  }

  // HELPER METHODS

  getFromLocalStorage(userId) {
    const keys = [
      `irtzalink_unified_${userId}`,
      `irtzalink_${userId}_profile_v3`,
      `irtzalink_user_${userId}_backup`
    ];

    for (const key of keys) {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed && (parsed.username || parsed.displayName)) {
            return parsed;
          }
        }
      } catch (e) {
        continue;
      }
    }
    return null;
  }

  saveToLocalStorage(userId, userData) {
    const keys = [
      `irtzalink_unified_${userId}`,
      `irtzalink_${userId}_profile_v3`,
      `irtzalink_user_${userId}_backup`,
      `irtzalink_data_${userId}_safe`
    ];

    keys.forEach(key => {
      try {
        localStorage.setItem(key, JSON.stringify(userData));
      } catch (e) {
        console.warn(`Failed to save to ${key}:`, e);
      }
    });
  }

  async getFromFirebase(userId) {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { ...docSnap.data(), uid: userId, userId };
      }
      return null;
    } catch (error) {
      console.error('Firebase get error:', error);
      return null;
    }
  }

  async saveToFirebase(userId, userData) {
    try {
      const docRef = doc(db, 'users', userId);
      
      // Try update first, then create
      try {
        await updateDoc(docRef, userData);
      } catch (updateError) {
        await setDoc(docRef, userData, { merge: true });
      }
      
      console.log(`☁️ UNIFIED: Firebase saved for ${userId.slice(0, 8)}`);
      return true;
    } catch (error) {
      console.error('Firebase save error:', error);
      return false;
    }
  }

  async searchFirebase(searchTerm) {
    try {
      const q = query(
        collection(db, 'users'),
        where('username', '>=', searchTerm.toLowerCase()),
        where('username', '<=', searchTerm.toLowerCase() + '\uf8ff'),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      const results = [];
      
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.isActive !== false) {
          results.push(this.formatSearchResult({ ...userData, uid: doc.id }));
        }
      });
      
      return results;
    } catch (error) {
      console.error('Firebase search error:', error);
      return [];
    }
  }

  searchLocalStorage(searchTerm, existingResults) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('irtzalink_')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (this.matchesSearch(parsed, searchTerm)) {
              const result = this.formatSearchResult(parsed);
              if (!existingResults.find(r => r.uid === result.uid)) {
                existingResults.push(result);
              }
            }
          }
        } catch (e) {
          continue;
        }
      }
    }
  }

  matchesSearch(userData, searchTerm) {
    if (!userData) return false;
    
    const username = (userData.username || '').toLowerCase();
    const displayName = (userData.displayName || '').toLowerCase();
    
    return username.includes(searchTerm) || displayName.includes(searchTerm);
  }

  formatSearchResult(userData) {
    return {
      uid: userData.uid || userData.userId,
      username: userData.username,
      displayName: userData.displayName || userData.username,
      photoURL: userData.photoURL,
      bio: userData.bio,
      isActive: userData.isActive !== false
    };
  }

  addToPendingSync(userId, userData) {
    try {
      const pending = JSON.parse(localStorage.getItem('irtzalink_pending_sync') || '[]');
      pending.push({ userId, userData, timestamp: Date.now() });
      localStorage.setItem('irtzalink_pending_sync', JSON.stringify(pending));
    } catch (e) {
      console.error('Failed to add to pending sync:', e);
    }
  }

  async syncPendingData() {
    try {
      const pending = JSON.parse(localStorage.getItem('irtzalink_pending_sync') || '[]');
      
      for (const item of pending) {
        const success = await this.saveToFirebase(item.userId, item.userData);
        if (success) {
          console.log(`✅ Synced pending data for ${item.userId.slice(0, 8)}`);
        }
      }
      
      // Clear pending sync
      localStorage.removeItem('irtzalink_pending_sync');
    } catch (e) {
      console.error('Sync pending data error:', e);
    }
  }

  async backgroundSync(userId, localData) {
    try {
      const firebaseData = await this.getFromFirebase(userId);
      if (firebaseData) {
        const firebaseTime = new Date(firebaseData.updatedAt).getTime();
        const localTime = new Date(localData.updatedAt).getTime();
        
        if (firebaseTime > localTime) {
          // Firebase has newer data
          console.log(`🔄 Background sync: Firebase newer for ${userId.slice(0, 8)}`);
          this.saveToLocalStorage(userId, firebaseData);
          this.memoryCache.set(userId, firebaseData);
        }
      }
    } catch (e) {
      console.warn('Background sync failed:', e);
    }
  }

  // Clear user data (for logout)
  clearUserData(userId) {
    // Remove from memory
    this.memoryCache.delete(userId);
    
    // KEEP localStorage data for quick re-login
    console.log(`🔄 UNIFIED: Cleared memory for ${userId.slice(0, 8)}, kept localStorage`);
  }

  // Get public profile by username
  async getPublicProfile(username) {
    try {
      console.log(`🔍 UNIFIED: Getting public profile for @${username}`);
      
      // Search in cache first
      for (const [userId, userData] of this.memoryCache) {
        if (userData.username === username) {
          console.log(`⚡ UNIFIED: Found @${username} in memory cache`);
          return { success: true, data: this.formatPublicProfile(userData) };
        }
      }
      
      // Search localStorage
      const localResult = this.searchLocalStorageByUsername(username);
      if (localResult) {
        console.log(`💾 UNIFIED: Found @${username} in localStorage`);
        return { success: true, data: this.formatPublicProfile(localResult) };
      }
      
      // Search Firebase
      if (this.isOnline) {
        const firebaseResult = await this.searchFirebaseByUsername(username);
        if (firebaseResult) {
          console.log(`☁️ UNIFIED: Found @${username} in Firebase`);
          
          // Cache it locally
          this.saveToLocalStorage(firebaseResult.userId, firebaseResult);
          this.memoryCache.set(firebaseResult.userId, firebaseResult);
          
          return { success: true, data: this.formatPublicProfile(firebaseResult) };
        }
      }
      
      console.log(`❌ UNIFIED: Profile @${username} not found`);
      return { success: false, error: 'Profile not found' };
      
    } catch (error) {
      console.error('Get public profile error:', error);
      return { success: false, error: error.message };
    }
  }

  searchLocalStorageByUsername(username) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('irtzalink_')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (parsed.username === username) {
              return parsed;
            }
          }
        } catch (e) {
          continue;
        }
      }
    }
    return null;
  }

  async searchFirebaseByUsername(username) {
    try {
      const q = query(
        collection(db, 'users'),
        where('username', '==', username.toLowerCase()),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { ...doc.data(), userId: doc.id, uid: doc.id };
      }
      return null;
    } catch (error) {
      console.error('Firebase username search error:', error);
      return null;
    }
  }

  formatPublicProfile(userData) {
    return {
      username: userData.username,
      displayName: userData.displayName,
      bio: userData.bio,
      photoURL: userData.photoURL,
      socialLinks: userData.socialLinks || {},
      contactInfo: userData.contactInfo || {},
      theme: userData.theme || 'dark',
      profileURL: userData.profileURL,
      userId: userData.userId || userData.uid
    };
  }
}

// Create single instance
export const unifiedStorage = new UnifiedStorage();

// Export convenience methods
export const getUserData = (userId, forceRefresh) => unifiedStorage.getUserData(userId, forceRefresh);
export const saveUserData = (userId, userData) => unifiedStorage.saveUserData(userId, userData);
export const searchUsers = (searchTerm) => unifiedStorage.searchUsers(searchTerm);
export const getPublicProfile = (username) => unifiedStorage.getPublicProfile(username);
export const clearUserData = (userId) => unifiedStorage.clearUserData(userId);

export default unifiedStorage;