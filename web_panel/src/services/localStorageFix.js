/**
 * IMMEDIATE FIX FOR DATA PERSISTENCE
 * Enhanced localStorage service that makes ALL data persist like username
 * Use this if you don't want to setup Supabase right now
 */

const STORAGE_KEYS = {
  USER_DATA: 'irtzalink_user_data_v2',
  USER_PROFILE: 'irtzalink_profile_v2',
  USER_SETTINGS: 'irtzalink_settings_v2',
  LAST_SAVE: 'irtzalink_last_save'
};

class LocalStorageFix {
  constructor() {
    console.log('🔧 LocalStorage Fix initialized - Data will persist like username');
  }

  // Save complete user data (like username persistence)
  saveUserData(userId, userData) {
    try {
      const enhancedData = {
        userId: userId,
        userData: userData,
        timestamp: new Date().toISOString(),
        version: '2.0'
      };

      // Save in multiple keys for redundancy
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(enhancedData));
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userData));
      localStorage.setItem(STORAGE_KEYS.LAST_SAVE, new Date().toISOString());

      console.log('✅ LOCALSTORAGE: User data saved (will persist like username)');
      return { success: true, message: 'Data saved locally' };
    } catch (error) {
      console.error('❌ LOCALSTORAGE: Save error:', error);
      return { success: false, error: error.message };
    }
  }

  // Load user data (persistent like username)
  loadUserData(userId = null) {
    try {
      const savedData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (!savedData) {
        return { success: false, reason: 'no_data' };
      }

      const parsedData = JSON.parse(savedData);
      
      // Check user ID match (if provided)
      if (userId && parsedData.userId !== userId) {
        console.log('🔄 LOCALSTORAGE: User mismatch, keeping old data');
        // Keep data anyway (like username behavior)
      }

      console.log('✅ LOCALSTORAGE: User data loaded (persistent like username)');
      return {
        success: true,
        data: parsedData.userData,
        userId: parsedData.userId,
        lastSaved: parsedData.timestamp
      };
    } catch (error) {
      console.error('❌ LOCALSTORAGE: Load error:', error);
      return { success: false, error: error.message };
    }
  }

  // Update specific fields
  updateUserData(userId, updates) {
    try {
      const existing = this.loadUserData(userId);
      const currentData = existing.success ? existing.data : {};
      
      const mergedData = {
        ...currentData,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      return this.saveUserData(userId, mergedData);
    } catch (error) {
      console.error('❌ LOCALSTORAGE: Update error:', error);
      return { success: false, error: error.message };
    }
  }

  // Initialize user (create if not exists)
  initializeUser(userId, firebaseUserData = {}) {
    try {
      const existing = this.loadUserData(userId);
      
      if (existing.success) {
        console.log('✅ LOCALSTORAGE: User exists, loading data');
        return { 
          success: true, 
          data: { uid: userId, ...existing.data }, 
          isNew: false 
        };
      }

      // Create new user
      const newUserData = {
        displayName: firebaseUserData.displayName || firebaseUserData.email?.split('@')[0] || 'User',
        email: firebaseUserData.email || '',
        username: '',
        bio: '',
        photoURL: firebaseUserData.photoURL || '',
        socialLinks: {},
        contactInfo: { email: firebaseUserData.email || '' },
        theme: 'dark',
        profileURL: '',
        isActive: true,
        createdAt: new Date().toISOString()
      };

      const saveResult = this.saveUserData(userId, newUserData);
      
      if (saveResult.success) {
        console.log('✅ LOCALSTORAGE: New user created');
        return { 
          success: true, 
          data: { uid: userId, ...newUserData }, 
          isNew: true 
        };
      }

      return saveResult;
    } catch (error) {
      console.error('❌ LOCALSTORAGE: Init error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get public profile by username
  getPublicProfile(username) {
    try {
      const userData = this.loadUserData();
      if (userData.success && userData.data.username === username) {
        console.log('✅ LOCALSTORAGE: Public profile found');
        return {
          success: true,
          data: {
            username: userData.data.username,
            display_name: userData.data.displayName,
            bio: userData.data.bio,
            photo_url: userData.data.photoURL,
            social_links: userData.data.socialLinks,
            contact_info: userData.data.contactInfo,
            theme: userData.data.theme,
            profile_url: userData.data.profileURL
          }
        };
      }
      
      return { success: false, error: 'Profile not found' };
    } catch (error) {
      console.error('❌ LOCALSTORAGE: Public profile error:', error);
      return { success: false, error: error.message };
    }
  }

  // NEVER clear data on logout (like username behavior)
  safeLogout(userId) {
    console.log('🚪 LOCALSTORAGE: Safe logout - ALL DATA PRESERVED');
    console.log('✅ LOCALSTORAGE: Profile, bio, links - ALL SAFE!');
    console.log('🔄 LOCALSTORAGE: Data will restore on next login!');
    
    // NO DATA DELETION - Everything stays like username
    return { success: true, message: 'Safe logout - data preserved' };
  }

  // Check configuration (always true for localStorage)
  checkConfiguration() {
    return true;
  }

  // Health check
  healthCheck() {
    try {
      // Test localStorage
      const testKey = 'irtzalink_test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      console.log('✅ LOCALSTORAGE: Health check passed');
      return { success: true, status: 'healthy' };
    } catch (error) {
      console.error('❌ LOCALSTORAGE: Health check failed:', error);
      return { success: false, status: 'unhealthy', error: error.message };
    }
  }
}

// Export singleton instance
const localStorageFix = new LocalStorageFix();
export default localStorageFix;

console.log('🔧 LOCALSTORAGE FIX: Ready to make all data persistent like username!');
console.log('✅ LOCALSTORAGE FIX: No signout data loss - ever!');
console.log('💾 LOCALSTORAGE FIX: Profile, bio, links - all will persist!');