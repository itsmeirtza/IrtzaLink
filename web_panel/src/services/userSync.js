import { db, auth } from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  onSnapshot 
} from 'firebase/firestore';

class UserSyncService {
  constructor() {
    this.userDataCache = new Map();
    this.listeners = new Map();
  }

  /**
   * Initialize user data - this is the MAIN function that fixes data sync issues
   * This ensures user data is properly loaded from Firestore on every login
   */
  async initializeUserData(userId) {
    try {
      console.log('🔥 Initializing user data from Firestore for:', userId);
      
      // Get user document from Firestore
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      let userData = {};
      
      if (userDoc.exists()) {
        userData = userDoc.data();
        console.log('✅ User data loaded from Firestore:', {
          hasUsername: !!userData.username,
          hasBio: !!userData.bio,
          socialLinksCount: Object.keys(userData.socialLinks || {}).length,
          contactInfoCount: Object.keys(userData.contactInfo || {}).length
        });
      } else {
        console.log('📝 Creating new user document in Firestore');
        
        // Create default user data structure
        const currentUser = auth.currentUser;
        userData = {
          uid: userId,
          email: currentUser?.email || '',
          displayName: currentUser?.displayName || 'User',
          photoURL: currentUser?.photoURL || '',
          username: this.generateUsername(currentUser?.displayName || currentUser?.email),
          bio: '',
          theme: 'dark',
          socialLinks: {
            facebook: '',
            instagram: '',
            twitter: '',
            tiktok: '',
            youtube: '',
            linkedin: '',
            whatsapp: '',
            telegram: ''
          },
          contactInfo: {
            phone: '',
            email: currentUser?.email || '',
            website: ''
          },
          qrCodeURL: '',
          profileViews: 0,
          qrScans: 0,
          linkClicks: 0,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        // Save to Firestore
        await setDoc(userDocRef, userData);
        console.log('✅ New user document created in Firestore');
      }
      
      // Isolate user data to prevent cross-user interference
      this.isolateUserData(userId);
      
      // Cache the data locally
      this.userDataCache.set(userId, userData);
      
      // Set up real-time listener for automatic sync
      this.setupRealtimeSync(userId);
      
      // Update local storage with proper Firestore data
      localStorage.setItem(`irtzalink_${userId}_profile`, JSON.stringify({
        data: userData,
        timestamp: Date.now(),
        source: 'firestore'
      }));
      
      return { success: true, data: userData };
      
    } catch (error) {
      console.error('❌ Error initializing user data:', error);
      
      // Fallback: try to load from localStorage
      const cachedData = this.loadFromLocalStorage(userId);
      if (cachedData) {
        console.log('⚡ Using cached data as fallback');
        this.userDataCache.set(userId, cachedData.data);
        return { success: true, data: cachedData.data, source: 'cache' };
      }
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user data in Firestore and sync across all devices
   */
  async updateUserData(userId, updates) {
    try {
      console.log('🔥 Updating user data in Firestore:', updates);
      
      const userDocRef = doc(db, 'users', userId);
      
      // Add timestamp to updates
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      // Update Firestore
      await updateDoc(userDocRef, updateData);
      
      // Update local cache
      if (this.userDataCache.has(userId)) {
        const currentData = this.userDataCache.get(userId);
        const updatedData = { ...currentData, ...updates };
        this.userDataCache.set(userId, updatedData);
        
        // Update localStorage
        localStorage.setItem(`irtzalink_${userId}_profile`, JSON.stringify({
          data: updatedData,
          timestamp: Date.now(),
          source: 'firestore'
        }));
      }
      
      console.log('✅ User data updated successfully');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error updating user data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Set up real-time sync with Firestore
   */
  setupRealtimeSync(userId) {
    // Clean up existing listener
    if (this.listeners.has(userId)) {
      this.listeners.get(userId)();
    }
    
    const userDocRef = doc(db, 'users', userId);
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        console.log('🔄 Real-time sync: User data updated from Firestore');
        
        // Update cache
        this.userDataCache.set(userId, userData);
        
        // Update localStorage
        localStorage.setItem(`irtzalink_${userId}_profile`, JSON.stringify({
          data: userData,
          timestamp: Date.now(),
          source: 'firestore_realtime'
        }));
        
        // Trigger custom event for components to update
        window.dispatchEvent(new CustomEvent('userDataUpdated', { 
          detail: { userId, userData } 
        }));
      }
    }, (error) => {
      console.error('❌ Real-time sync error:', error);
    });
    
    this.listeners.set(userId, unsubscribe);
  }

  /**
   * Get user data (prioritizes cache, fallback to Firestore)
   */
  async getUserData(userId) {
    // Check cache first
    if (this.userDataCache.has(userId)) {
      return { success: true, data: this.userDataCache.get(userId), source: 'cache' };
    }
    
    // Load from Firestore
    return await this.initializeUserData(userId);
  }

  /**
   * Generate username from display name or email
   */
  generateUsername(input) {
    if (!input) return `user${Date.now()}`;
    
    // If it's an email, use the part before @
    if (input.includes('@')) {
      input = input.split('@')[0];
    }
    
    // Clean up the username
    return input
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 15) || `user${Date.now()}`;
  }

  /**
   * Load data from localStorage
   */
  loadFromLocalStorage(userId) {
    try {
      const item = localStorage.getItem(`irtzalink_${userId}_profile`);
      if (item) {
        const parsed = JSON.parse(item);
        return parsed;
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    return null;
  }

  /**
   * Isolate user data by user ID - FIXES ACCOUNT SWITCHING ISSUE
   */
  isolateUserData(currentUserId) {
    // Only keep current user's data in cache, clear others
    const currentUserData = this.userDataCache.get(currentUserId);
    this.userDataCache.clear();
    
    if (currentUserData) {
      this.userDataCache.set(currentUserId, currentUserData);
    }
    
    // Clean up localStorage from other users (keep only current user)
    const keysToKeep = [];
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('irtzalink_')) {
        if (key.includes(currentUserId)) {
          keysToKeep.push(key);
        } else {
          keysToRemove.push(key);
        }
      }
    }
    
    // Remove other users' data to prevent interference
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🧹 Removed other user data: ${key}`);
    });
    
    console.log(`🔒 Data isolated for user ${currentUserId}: kept ${keysToKeep.length} keys, removed ${keysToRemove.length} keys`);
  }

  /**
   * Clean up listeners on logout
   */
  cleanup(userId) {
    if (this.listeners.has(userId)) {
      this.listeners.get(userId)();
      this.listeners.delete(userId);
    }
    
    // Keep cache for quick re-login, but clear listener
    // this.userDataCache.delete(userId); // Don't delete cache
    
    console.log('✅ Cleaned up real-time listeners for user:', userId);
  }

  /**
   * Clear all data (complete logout)
   */
  clearAllData(userId) {
    this.cleanup(userId);
    this.userDataCache.delete(userId);
    
    // Clear localStorage data (optional, for complete logout)
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(userId)) {
        keys.push(key);
      }
    }
    keys.forEach(key => localStorage.removeItem(key));
    
    console.log('✅ Cleared all data for user:', userId);
  }

  /**
   * Check username availability
   */
  async checkUsernameAvailability(username, currentUserId) {
    try {
      // This would require a query to check if username exists
      // For now, return true (implement proper check in production)
      return { available: true };
    } catch (error) {
      console.error('Error checking username:', error);
      return { available: false, error: error.message };
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId) {
    try {
      const userData = await this.getUserData(userId);
      if (userData.success) {
        return {
          profileViews: userData.data.profileViews || 0,
          qrScans: userData.data.qrScans || 0,
          linkClicks: userData.data.linkClicks || 0,
          totalLinks: Object.values(userData.data.socialLinks || {}).filter(link => link.trim()).length
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }

  /**
   * Track analytics event
   */
  async trackEvent(userId, eventType, eventData = {}) {
    try {
      const analyticsData = {
        userId,
        type: eventType,
        timestamp: serverTimestamp(),
        userAgent: navigator.userAgent,
        ...eventData
      };
      
      // Add to analytics collection
      const analyticsRef = doc(db, 'analytics', `${userId}_${Date.now()}_${eventType}`);
      await setDoc(analyticsRef, analyticsData);
      
      // Update user stats
      const updates = {};
      if (eventType === 'profile_view') {
        updates.profileViews = (await this.getUserData(userId)).data?.profileViews + 1 || 1;
      } else if (eventType === 'qr_scan') {
        updates.qrScans = (await this.getUserData(userId)).data?.qrScans + 1 || 1;
      } else if (eventType === 'link_click') {
        updates.linkClicks = (await this.getUserData(userId)).data?.linkClicks + 1 || 1;
      }
      
      if (Object.keys(updates).length > 0) {
        await this.updateUserData(userId, updates);
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('Error tracking event:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
export const userSync = new UserSyncService();
export default userSync;