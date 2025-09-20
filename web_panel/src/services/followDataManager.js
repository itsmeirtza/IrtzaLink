// Follow Data Persistence Manager
// Keeps follow relationships persistent across sign-in/out cycles

class FollowDataManager {
  constructor() {
    this.followCache = new Map();
    this.setupPeriodicSync();
  }

  // Save follow relationship to persistent storage
  saveFollowRelationship(userId, targetUserId, relationship) {
    try {
      const key = `irtzalink_follow_${userId}_${targetUserId}`;
      const data = {
        relationship,
        timestamp: Date.now(),
        version: '1.0'
      };
      localStorage.setItem(key, JSON.stringify(data));
      
      // Also save in memory cache
      this.followCache.set(`${userId}_${targetUserId}`, relationship);
      
      console.log(`Saved follow relationship: ${userId} -> ${targetUserId} = ${relationship}`);
    } catch (error) {
      console.error('Error saving follow relationship:', error);
    }
  }

  // Load follow relationship from persistent storage
  loadFollowRelationship(userId, targetUserId) {
    try {
      // Check memory cache first
      const cacheKey = `${userId}_${targetUserId}`;
      if (this.followCache.has(cacheKey)) {
        return this.followCache.get(cacheKey);
      }

      // Check localStorage
      const key = `irtzalink_follow_${userId}_${targetUserId}`;
      const item = localStorage.getItem(key);
      
      if (item) {
        const data = JSON.parse(item);
        
        // Check if data is still valid (7 days)
        const isExpired = Date.now() - data.timestamp > 604800000; // 7 days
        
        if (!isExpired) {
          // Cache in memory for faster access
          this.followCache.set(cacheKey, data.relationship);
          return data.relationship;
        } else {
          // Remove expired data
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Error loading follow relationship:', error);
    }
    
    return null;
  }

  // Save user's follow counts
  saveFollowCounts(userId, followersCount, followingCount) {
    try {
      const key = `irtzalink_counts_${userId}`;
      const data = {
        followersCount,
        followingCount,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving follow counts:', error);
    }
  }

  // Load user's follow counts
  loadFollowCounts(userId) {
    try {
      const key = `irtzalink_counts_${userId}`;
      const item = localStorage.getItem(key);
      
      if (item) {
        const data = JSON.parse(item);
        
        // Check if data is still valid (1 hour for counts)
        const isExpired = Date.now() - data.timestamp > 3600000; // 1 hour
        
        if (!isExpired) {
          return {
            followersCount: data.followersCount || 0,
            followingCount: data.followingCount || 0
          };
        } else {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Error loading follow counts:', error);
    }
    
    return { followersCount: 0, followingCount: 0 };
  }

  // Save followers/following lists
  saveFollowList(userId, type, list) {
    try {
      const key = `irtzalink_${type}_${userId}`;
      const data = {
        list: list || [],
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${type} list:`, error);
    }
  }

  // Load followers/following lists
  loadFollowList(userId, type) {
    try {
      const key = `irtzalink_${type}_${userId}`;
      const item = localStorage.getItem(key);
      
      if (item) {
        const data = JSON.parse(item);
        
        // Check if data is still valid (30 minutes for lists)
        const isExpired = Date.now() - data.timestamp > 1800000; // 30 minutes
        
        if (!isExpired) {
          return data.list || [];
        } else {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error(`Error loading ${type} list:`, error);
    }
    
    return [];
  }

  // Update follow relationship after follow/unfollow action
  updateFollowRelationship(userId, targetUserId, newRelationship) {
    this.saveFollowRelationship(userId, targetUserId, newRelationship);
    
    // Also update reverse relationship if needed
    if (newRelationship === 'friends') {
      this.saveFollowRelationship(targetUserId, userId, 'friends');
    } else if (newRelationship === 'following') {
      // Check if target follows back
      const reverseRelation = this.loadFollowRelationship(targetUserId, userId);
      if (reverseRelation === 'following') {
        // Both follow each other = friends
        this.saveFollowRelationship(userId, targetUserId, 'friends');
        this.saveFollowRelationship(targetUserId, userId, 'friends');
      } else {
        // Target is now a follower
        this.saveFollowRelationship(targetUserId, userId, 'follower');
      }
    } else if (newRelationship === 'none') {
      // Unfollowed - update relationships
      const reverseRelation = this.loadFollowRelationship(targetUserId, userId);
      if (reverseRelation === 'friends') {
        // Target still follows, so now it's follower
        this.saveFollowRelationship(targetUserId, userId, 'following');
        this.saveFollowRelationship(userId, targetUserId, 'follower');
      }
    }
  }

  // Clean up expired data periodically
  cleanupExpiredData() {
    try {
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key && key.startsWith('irtzalink_follow_') || key.startsWith('irtzalink_counts_') || key.startsWith('irtzalink_followers_') || key.startsWith('irtzalink_following_')) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const data = JSON.parse(item);
              const age = Date.now() - data.timestamp;
              
              // Remove data older than 7 days
              if (age > 604800000) {
                keysToRemove.push(key);
              }
            }
          } catch (e) {
            // Remove corrupted data
            keysToRemove.push(key);
          }
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      if (keysToRemove.length > 0) {
        console.log(`Cleaned up ${keysToRemove.length} expired follow data entries`);
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  // Setup periodic cleanup (every 6 hours)
  setupPeriodicSync() {
    setInterval(() => {
      this.cleanupExpiredData();
    }, 21600000); // 6 hours
  }

  // Clear specific follow relationship (force refresh)
  clearFollowRelationship(userId, targetUserId) {
    try {
      const key = `irtzalink_follow_${userId}_${targetUserId}`;
      const cacheKey = `${userId}_${targetUserId}`;
      
      // Clear from localStorage
      localStorage.removeItem(key);
      
      // Clear from memory cache
      this.followCache.delete(cacheKey);
      
      console.log(`Cleared cached follow relationship: ${userId} -> ${targetUserId}`);
    } catch (error) {
      console.error('Error clearing follow relationship:', error);
    }
  }
  
  // Clear all follow data for a user
  clearAllFollowDataForUser(userId) {
    try {
      const keysToRemove = [];
      
      // Clear from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes(`_${userId}_`) || key.includes(`_${userId}`))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear from memory cache
      const cacheKeysToRemove = [];
      for (const cacheKey of this.followCache.keys()) {
        if (cacheKey.includes(userId)) {
          cacheKeysToRemove.push(cacheKey);
        }
      }
      
      cacheKeysToRemove.forEach(key => this.followCache.delete(key));
      
      console.log(`Cleared all follow data for user: ${userId}`);
    } catch (error) {
      console.error('Error clearing user follow data:', error);
    }
  }

  // Get storage usage statistics
  getStorageStats() {
    let followDataSize = 0;
    let followDataCount = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('irtzalink_follow_') || key.startsWith('irtzalink_counts_') || key.startsWith('irtzalink_followers_') || key.startsWith('irtzalink_following_'))) {
        const item = localStorage.getItem(key);
        if (item) {
          followDataSize += item.length;
          followDataCount++;
        }
      }
    }
    
    return {
      followDataSize,
      followDataCount,
      memoryCacheSize: this.followCache.size
    };
  }
}

// Create singleton instance
export const followDataManager = new FollowDataManager();
export default followDataManager;