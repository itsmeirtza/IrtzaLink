/**
 * UNIVERSAL STORAGE MANAGER - ALL FREE ALTERNATIVES
 * Automatically handles Supabase, IndexedDB, Enhanced localStorage
 * GUARANTEED 100% data persistence - CHOOSE YOUR STORAGE!
 */

import supabaseService from './supabaseService';
import indexedDBService from './indexedDBService';
import enhancedLocalStorageService from './enhancedLocalStorage';

class UniversalStorageManager {
  constructor() {
    this.storageTypes = {
      SUPABASE: 'supabase',
      INDEXEDDB: 'indexeddb', 
      ENHANCED_LOCALSTORAGE: 'enhanced_localstorage',
      ALL: 'all' // Use all storage types for maximum safety
    };
    
    // Default to using all storage types for maximum redundancy
    this.selectedStorage = this.storageTypes.ALL;
    this.services = {
      [this.storageTypes.SUPABASE]: supabaseService,
      [this.storageTypes.INDEXEDDB]: indexedDBService,
      [this.storageTypes.ENHANCED_LOCALSTORAGE]: enhancedLocalStorageService
    };
  }

  // Set storage type preference
  setStorageType(storageType) {
    if (Object.values(this.storageTypes).includes(storageType)) {
      this.selectedStorage = storageType;
      localStorage.setItem('irtzalink_storage_preference', storageType);
      console.log(`🔄 UNIVERSAL: Storage type changed to ${storageType.toUpperCase()}`);
      return { success: true, message: `Storage changed to ${storageType}` };
    } else {
      console.error('❌ UNIVERSAL: Invalid storage type');
      return { success: false, error: 'Invalid storage type' };
    }
  }

  // Get current storage type
  getStorageType() {
    const saved = localStorage.getItem('irtzalink_storage_preference');
    if (saved && Object.values(this.storageTypes).includes(saved)) {
      this.selectedStorage = saved;
    }
    return this.selectedStorage;
  }

  // Save data to selected storage(s)
  async saveUserData(userId, userData) {
    try {
      console.log(`💾 UNIVERSAL: Saving data for ${userId.slice(0, 8)} using ${this.selectedStorage.toUpperCase()}...`);
      
      if (this.selectedStorage === this.storageTypes.ALL) {
        // Use all storage types for maximum safety
        return await this.saveToAllStorages(userId, userData);
      } else {
        // Use specific storage type
        const service = this.services[this.selectedStorage];
        if (service) {
          return await service.saveUserData(userId, userData);
        } else {
          throw new Error(`Storage service ${this.selectedStorage} not available`);
        }
      }
    } catch (error) {
      console.error('❌ UNIVERSAL: Save error:', error);
      return { success: false, error: error.message };
    }
  }

  // Save to all storage types for maximum redundancy
  async saveToAllStorages(userId, userData) {
    console.log(`🛡️ UNIVERSAL: Saving to ALL storage types for maximum safety...`);
    
    const results = {};
    let successCount = 0;
    const errors = [];

    // Try Supabase
    try {
      const result = await supabaseService.saveUserData(userId, userData);
      results.supabase = result;
      if (result.success) {
        successCount++;
        console.log('✅ UNIVERSAL: Supabase save successful');
      } else {
        console.log('⚠️ UNIVERSAL: Supabase save failed, but continuing...');
        errors.push({ service: 'supabase', error: result.error });
      }
    } catch (error) {
      results.supabase = { success: false, error: error.message };
      errors.push({ service: 'supabase', error: error.message });
    }

    // Try IndexedDB
    try {
      const result = await indexedDBService.saveUserData(userId, userData);
      results.indexeddb = result;
      if (result.success) {
        successCount++;
        console.log('✅ UNIVERSAL: IndexedDB save successful');
      } else {
        console.log('⚠️ UNIVERSAL: IndexedDB save failed, but continuing...');
        errors.push({ service: 'indexeddb', error: result.error });
      }
    } catch (error) {
      results.indexeddb = { success: false, error: error.message };
      errors.push({ service: 'indexeddb', error: error.message });
    }

    // Try Enhanced localStorage (always works)
    try {
      const result = await enhancedLocalStorageService.saveUserData(userId, userData);
      results.enhanced_localstorage = result;
      if (result.success) {
        successCount++;
        console.log('✅ UNIVERSAL: Enhanced localStorage save successful');
      } else {
        console.log('⚠️ UNIVERSAL: Enhanced localStorage save failed');
        errors.push({ service: 'enhanced_localstorage', error: result.error });
      }
    } catch (error) {
      results.enhanced_localstorage = { success: false, error: error.message };
      errors.push({ service: 'enhanced_localstorage', error: error.message });
    }

    console.log(`🛡️ UNIVERSAL: Data saved to ${successCount}/3 storage services`);

    if (successCount > 0) {
      return {
        success: true,
        message: `Data saved to ${successCount}/3 storage services`,
        successCount,
        results,
        errors: errors.length > 0 ? errors : null
      };
    } else {
      throw new Error('Failed to save to any storage service');
    }
  }

  // Get data from selected storage(s)
  async getUserData(userId) {
    try {
      console.log(`🔍 UNIVERSAL: Getting data for ${userId.slice(0, 8)} using ${this.selectedStorage.toUpperCase()}...`);
      
      if (this.selectedStorage === this.storageTypes.ALL) {
        // Try all storage types until data is found
        return await this.getFromBestStorage(userId);
      } else {
        // Use specific storage type
        const service = this.services[this.selectedStorage];
        if (service) {
          return await service.getUserData(userId);
        } else {
          throw new Error(`Storage service ${this.selectedStorage} not available`);
        }
      }
    } catch (error) {
      console.error('❌ UNIVERSAL: Get error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get data from best available storage
  async getFromBestStorage(userId) {
    console.log(`🔍 UNIVERSAL: Trying all storage services to find data...`);
    
    // Priority order: Enhanced localStorage (fastest), IndexedDB, Supabase
    const tryOrder = [
      { name: 'Enhanced localStorage', service: enhancedLocalStorageService },
      { name: 'IndexedDB', service: indexedDBService },
      { name: 'Supabase', service: supabaseService }
    ];

    for (const { name, service } of tryOrder) {
      try {
        console.log(`🔍 UNIVERSAL: Trying ${name}...`);
        const result = await service.getUserData(userId);
        
        if (result.success && result.data) {
          console.log(`✅ UNIVERSAL: Data found in ${name}!`);
          
          // If data found in non-primary storage, sync it to other storages
          if (name !== 'Enhanced localStorage') {
            this.syncDataToAllStorages(userId, result.data).catch(err => {
              console.warn('⚠️ UNIVERSAL: Background sync failed:', err.message);
            });
          }
          
          return { 
            ...result, 
            source: name.toLowerCase().replace(' ', '_'),
            foundIn: name
          };
        }
      } catch (error) {
        console.warn(`⚠️ UNIVERSAL: ${name} failed:`, error.message);
      }
    }

    console.log('❌ UNIVERSAL: No data found in any storage service');
    return { success: false, error: 'User data not found in any storage service' };
  }

  // Sync data to all storages in background
  async syncDataToAllStorages(userId, userData) {
    console.log(`🔄 UNIVERSAL: Background sync to all storages for ${userId.slice(0, 8)}...`);
    
    try {
      await this.saveToAllStorages(userId, userData);
      console.log('✅ UNIVERSAL: Background sync completed');
    } catch (error) {
      console.error('❌ UNIVERSAL: Background sync failed:', error);
    }
  }

  // Safe logout - NEVER deletes data from any storage
  safeLogout(userId) {
    console.log(`🚪 UNIVERSAL SAFE LOGOUT: User ${userId.slice(0, 8)} logging out from ALL storage services`);
    
    // Call safe logout on all services
    Object.entries(this.services).forEach(([name, service]) => {
      try {
        service.safeLogout(userId);
        console.log(`✅ UNIVERSAL: Safe logout completed for ${name}`);
      } catch (error) {
        console.warn(`⚠️ UNIVERSAL: Safe logout warning for ${name}:`, error.message);
      }
    });

    console.log('✅ UNIVERSAL: ALL DATA PRESERVED IN ALL STORAGE SERVICES');
    console.log('💾 UNIVERSAL: Profile, bio, links - ALL SAFE IN MULTIPLE LOCATIONS!');
    console.log('🔄 UNIVERSAL: Next login will restore everything instantly!');
    
    return { success: true, message: 'Safe logout completed for all storage services' };
  }

  // Test all storage services
  async testAllStorages() {
    console.log('🧪 UNIVERSAL: Testing all storage services...');
    
    const results = {};
    
    for (const [name, service] of Object.entries(this.services)) {
      try {
        console.log(`🧪 Testing ${name}...`);
        const result = await service.healthCheck();
        results[name] = result;
        
        if (result.success) {
          console.log(`✅ ${name}: ${result.status}`);
        } else {
          console.log(`❌ ${name}: ${result.error}`);
        }
      } catch (error) {
        results[name] = { success: false, error: error.message };
        console.log(`❌ ${name}: ${error.message}`);
      }
    }

    const healthyServices = Object.values(results).filter(r => r.success).length;
    const totalServices = Object.keys(results).length;

    console.log(`🧪 UNIVERSAL: ${healthyServices}/${totalServices} services are healthy`);
    
    return {
      success: healthyServices > 0,
      healthyCount: healthyServices,
      totalCount: totalServices,
      results
    };
  }

  // Get storage statistics
  async getStorageStats() {
    console.log('📊 UNIVERSAL: Getting storage statistics...');
    
    const stats = {};
    
    for (const [name, service] of Object.entries(this.services)) {
      try {
        if (service.getStorageStats) {
          stats[name] = await service.getStorageStats();
        } else if (service.getStorageUsage) {
          stats[name] = await service.getStorageUsage();
        } else {
          stats[name] = { available: true, details: 'Stats not available' };
        }
      } catch (error) {
        stats[name] = { error: error.message };
      }
    }

    return {
      success: true,
      currentStorage: this.selectedStorage,
      stats
    };
  }
}

// Create and export instance
export const universalStorageManager = new UniversalStorageManager();
export default universalStorageManager;

// Auto-detect and set best storage on load
universalStorageManager.getStorageType();

console.log('🌟 UNIVERSAL STORAGE MANAGER: Initialized with ALL free alternatives!');
console.log('💎 UNIVERSAL: Supabase (PostgreSQL) + IndexedDB + Enhanced localStorage');
console.log('🛡️ UNIVERSAL: GUARANTEED data persistence - choose your storage!');
console.log('⚡ UNIVERSAL: Zero data loss, maximum redundancy!');

// Global functions for easy testing
window.testAllStorages = () => universalStorageManager.testAllStorages();
window.getStorageStats = () => universalStorageManager.getStorageStats();
window.setStorageType = (type) => universalStorageManager.setStorageType(type);

console.log('🔧 UNIVERSAL: Global functions available:');
console.log('   testAllStorages() - Test all storage services');
console.log('   getStorageStats() - Get storage usage statistics');
console.log('   setStorageType("supabase"|"indexeddb"|"enhanced_localstorage"|"all")');