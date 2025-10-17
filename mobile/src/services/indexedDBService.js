// IndexedDB Service stub - redirects to Supabase
import supabaseService from './supabaseService';

class IndexedDBService {
  async saveUserData(userId, userData) {
    console.log('IndexedDB -> Supabase redirect');
    return await supabaseService.saveUserData(userId, userData);
  }

  async getUserData(userId) {
    console.log('IndexedDB -> Supabase redirect');
    return await supabaseService.getUserData(userId);
  }

  async healthCheck() {
    return { success: true, status: 'redirected_to_supabase' };
  }
}

const indexedDBService = new IndexedDBService();
export default indexedDBService;