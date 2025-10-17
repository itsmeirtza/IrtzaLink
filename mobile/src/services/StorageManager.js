/**
 * CENTRALIZED STORAGE MANAGER
 * Single source of truth for all data operations
 * Firebase ONLY - No complex caching, No localStorage mess
 * All components use THIS service only!
 */

import { 
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
import { addDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

/**
 * STORAGE MANAGER CLASS
 * Singleton pattern to ensure single data source
 */
class StorageManagerClass {
  constructor() {
    this.cache = new Map(); // Simple in-memory cache for current session
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  // Clear cache (useful for logout)
  clearCache() {
    this.cache.clear();
    console.log('🧹 STORAGE: Cache cleared');
  }

  // Get cache key
  getCacheKey(type, id) {
    return `${type}_${id}`;
  }

  // Check if cache is valid
  isCacheValid(cacheData) {
    return Date.now() - cacheData.timestamp < this.cacheExpiry;
  }

  /**
   * USER DATA OPERATIONS
   */

  // Get user data by ID
  async getUserData(userId) {
    try {
      if (!userId) {
        return { success: false, error: 'User ID required' };
      }

      const cacheKey = this.getCacheKey('user', userId);
      const cached = this.cache.get(cacheKey);
      
      if (cached && this.isCacheValid(cached)) {
        console.log(`💾 STORAGE: Using cached data for ${userId.slice(0, 8)}`);
        return { success: true, data: cached.data, source: 'cache' };
      }

      console.log(`🔍 STORAGE: Getting data for ${userId.slice(0, 8)}...`);
      
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data();
        userData.uid = userId;
        userData.userId = userId;
        
        // Cache the data
        this.cache.set(cacheKey, {
          data: userData,
          timestamp: Date.now()
        });
        
        console.log(`✅ STORAGE: Found user data:`, {
          username: userData.username,
          displayName: userData.displayName,
          hasLinks: !!userData.socialLinks
        });
        
        return { success: true, data: userData, source: 'firebase' };
      } else {
        console.log(`❌ STORAGE: User not found: ${userId.slice(0, 8)}`);
        return { success: false, error: 'User not found' };
      }
      
    } catch (error) {
      console.error('❌ STORAGE: Error getting user data:', error);
      return { success: false, error: error.message };
    }
  }

  // Save user data 
  async saveUserData(userId, userData) {
    try {
      if (!userId || !userData) {
        return { success: false, error: 'Missing data' };
      }

      console.log(`💾 STORAGE: Saving data for ${userId.slice(0, 8)}...`);
      
      const enhancedData = {
        ...userData,
        userId,
        updatedAt: new Date(),
        lastSaved: Date.now()
      };

      const docRef = doc(db, 'users', userId);
      
      // Try update first, then create if needed
      try {
        await updateDoc(docRef, enhancedData);
        console.log(`✅ STORAGE: Data updated successfully`);
      } catch (updateError) {
        await setDoc(docRef, enhancedData, { merge: true });
        console.log(`✅ STORAGE: Data created successfully`);
      }
      
      // Clear cache for this user to force fresh data next time
      const cacheKey = this.getCacheKey('user', userId);
      this.cache.delete(cacheKey);
      
      // Verify save worked
      const verifyDoc = await getDoc(docRef);
      if (verifyDoc.exists()) {
        const savedData = verifyDoc.data();
        console.log(`🔍 STORAGE: VERIFIED save successful:`, {
          username: savedData.username,
          displayName: savedData.displayName
        });
        
        return { success: true, message: 'Data saved successfully' };
      } else {
        throw new Error('Verification failed - data not found after save');
      }
      
    } catch (error) {
      console.error('❌ STORAGE: Save error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * PUBLIC PROFILE OPERATIONS
   */

  // Get public profile by username
  async getPublicProfile(username) {
    try {
      if (!username) {
        return { success: false, error: 'Username required' };
      }

      const cacheKey = this.getCacheKey('public', username);
      const cached = this.cache.get(cacheKey);
      
      if (cached && this.isCacheValid(cached)) {
        console.log(`💾 STORAGE: Using cached public profile for @${username}`);
        return { success: true, data: cached.data, source: 'cache' };
      }

      console.log(`🌐 STORAGE: Getting public profile for @${username}`);
      
      const q = query(
        collection(db, 'users'),
        where('username', '==', username.toLowerCase()),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        console.log(`✅ STORAGE: Found public profile:`, {
          username: userData.username,
          displayName: userData.displayName,
          hasLinks: !!userData.socialLinks
        });
        
        // Return only public data
        const publicData = {
          username: userData.username,
          displayName: userData.displayName,
          bio: userData.bio,
          photoURL: userData.photoURL,
          socialLinks: userData.socialLinks || {},
          contactInfo: userData.contactInfo || {},
          theme: userData.theme || 'dark',
          profileURL: userData.profileURL,
          userId: userDoc.id
        };
        
        // Cache the public data
        this.cache.set(cacheKey, {
          data: publicData,
          timestamp: Date.now()
        });
        
        return { success: true, data: publicData, source: 'firebase' };
      } else {
        console.log(`❌ STORAGE: Public profile not found for @${username}`);
        return { success: false, error: 'Profile not found' };
      }
      
    } catch (error) {
      console.error('❌ STORAGE: Error getting public profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * SEARCH OPERATIONS
   */

  // Enhanced search users by username, display name, and bio
  async searchUsers(searchTerm) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return { success: true, data: [] };
      }

      console.log(`🔍 STORAGE ENHANCED: Searching for "${searchTerm}" in username, displayName, and bio`);
      
      const searchLower = searchTerm.toLowerCase();
      
      // Get all users and filter client-side for better search
      const q = query(
        collection(db, 'users'),
        limit(100) // Get more users to search through
      );
      
      const querySnapshot = await getDocs(q);
      const results = [];
      
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.isActive !== false && (userData.username || userData.displayName)) {
          const username = (userData.username || '').toLowerCase();
          const displayName = (userData.displayName || '').toLowerCase();
          const bio = (userData.bio || '').toLowerCase();
          
          // Search in username, displayName, and bio
          if (username.includes(searchLower) || 
              displayName.includes(searchLower) || 
              bio.includes(searchLower)) {
            
            results.push({
              uid: doc.id,
              username: userData.username,
              displayName: userData.displayName || userData.username,
              photoURL: userData.photoURL,
              bio: userData.bio,
              isActive: true,
              // Add search relevance score
              relevance: username.startsWith(searchLower) ? 3 : 
                        displayName.startsWith(searchLower) ? 2 : 
                        username.includes(searchLower) ? 1.5 : 
                        displayName.includes(searchLower) ? 1 : 0.5
            });
          }
        }
      });
      
      // Sort by relevance (most relevant first)
      results.sort((a, b) => b.relevance - a.relevance);
      
      // Remove relevance score from final results and limit to 15
      const finalResults = results.slice(0, 15).map(({ relevance, ...user }) => user);
      
      console.log(`✅ STORAGE ENHANCED: Found ${finalResults.length} users for "${searchTerm}"`);
      return { success: true, data: finalResults };
      
    } catch (error) {
      console.error('❌ STORAGE: Search error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ANALYTICS OPERATIONS
   */

  // Track analytics event
  async trackEvent(eventType, userId, data = {}) {
    try {
      await addDoc(collection(db, 'analytics'), {
        type: eventType,
        userId: userId,
        timestamp: new Date(),
        userAgent: navigator.userAgent || '',
        ...data
      });
      
      console.log(`📊 STORAGE: Tracked ${eventType} for ${userId.slice(0, 8)}`);
      return { success: true };
    } catch (error) {
      console.error('❌ STORAGE: Analytics error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user analytics
  async getUserAnalytics(userId, type = null, limitCount = 100) {
    try {
      let q = collection(db, 'analytics');
      
      if (type) {
        q = query(q, where('userId', '==', userId), where('type', '==', type), limit(limitCount));
      } else {
        q = query(q, where('userId', '==', userId), limit(limitCount));
      }
      
      const querySnapshot = await getDocs(q);
      const analytics = [];
      querySnapshot.forEach((doc) => {
        analytics.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, data: analytics };
    } catch (error) {
      console.error('❌ STORAGE: Error getting analytics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * UTILITY OPERATIONS
   */

  // SAFE LOGOUT - ONLY clears memory cache, ALL DATA PRESERVED!
  safeLogout(userId) {
    console.log(`🚪 STORAGE SAFE LOGOUT: User ${userId.slice(0, 8)} logging out - PRESERVING ALL DATA`);
    
    // Only clear memory cache to free up RAM, ALL USER DATA REMAINS SAFE
    this.clearCache();
    
    console.log(`✅ STORAGE: Memory cache cleared - USER DATA 100% PRESERVED`);
    console.log(`💾 STORAGE: Profile, bio, links, settings ALL SAFE in Firebase`);
    console.log(`💾 STORAGE: localStorage backups ALL SAFE`);
    console.log(`🔄 STORAGE: Next login will restore everything instantly!`);
    console.log(`🚫 STORAGE: NO DATA DELETED - EVERYTHING PRESERVED!`);
  }
  
  // Legacy function - redirects to safe logout
  clearUserData(userId) {
    console.log(`🚪 LEGACY LOGOUT: Redirecting to safe logout for ${userId.slice(0, 8)}`);
    this.safeLogout(userId);
  }

  // Health check
  async healthCheck() {
    try {
      const testRef = doc(db, 'system', 'health');
      await getDoc(testRef);
      console.log('✅ STORAGE: Health check passed');
      return { success: true, status: 'healthy' };
    } catch (error) {
      console.error('❌ STORAGE: Health check failed:', error);
      return { success: false, status: 'unhealthy', error: error.message };
    }
  }
}

// Create singleton instance
const StorageManager = new StorageManagerClass();

// Export singleton instance and individual functions for compatibility
export default StorageManager;

// Export individual functions for easy imports
export const {
  getUserData,
  saveUserData,
  getPublicProfile,
  searchUsers,
  trackEvent,
  getUserAnalytics,
  clearUserData,
  healthCheck
} = StorageManager;

// Export bound methods to maintain 'this' context
export const getUserDataBound = StorageManager.getUserData.bind(StorageManager);
export const saveUserDataBound = StorageManager.saveUserData.bind(StorageManager);
export const getPublicProfileBound = StorageManager.getPublicProfile.bind(StorageManager);
export const searchUsersBound = StorageManager.searchUsers.bind(StorageManager);
export const trackEventBound = StorageManager.trackEvent.bind(StorageManager);
export const getUserAnalyticsBound = StorageManager.getUserAnalytics.bind(StorageManager);

console.log('🏗️ STORAGE MANAGER: Initialized centralized storage system');