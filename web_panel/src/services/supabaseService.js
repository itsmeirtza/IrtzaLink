/**
 * FIREBASE AUTH + SUPABASE DATA INTEGRATION
 * - Firebase handles authentication (login/logout)
 * - Supabase handles user data storage (profiles, links, etc)
 * - Data persists even after Firebase logout - NO DATA LOSS!
 */

import supabaseClient from './supabaseClient';

// Configuration from environment variables
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

class SupabaseService {
  constructor() {
    this.isConfigured = false;
    this.baseUrl = SUPABASE_URL;
    this.headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    };
  }

  // Check if Supabase is configured
  checkConfiguration() {
    if (this.baseUrl === 'https://your-project.supabase.co') {
      console.log('📝 SUPABASE: Not configured yet. Skipping Supabase operations.');
      return false;
    }
    this.isConfigured = true;
    return true;
  }

  // Initialize user on first login (create if not exists)
  async initializeUser(firebaseUserId, firebaseUserData = {}) {
    try {
      if (!this.checkConfiguration()) {
        return { success: false, error: 'Supabase not configured', isNew: false };
      }

      console.log(`🚀 SUPABASE INIT: Setting up user ${firebaseUserId.slice(0, 8)}...`);
      
      // Check if user exists first
      const existingUser = await this.getUserData(firebaseUserId);
      
      if (existingUser.success) {
        console.log('✅ SUPABASE INIT: User exists, loading existing data');
        return { 
          success: true, 
          data: existingUser.data, 
          isNew: false,
          message: 'Existing user loaded from Supabase' 
        };
      }
      
      // Create new user record
      const newUserData = {
        display_name: firebaseUserData.displayName || firebaseUserData.email?.split('@')[0] || 'User',
        email: firebaseUserData.email || '',
        username: '', // To be set later
        bio: '',
        photo_url: firebaseUserData.photoURL || '',
        social_links: {},
        contact_info: { email: firebaseUserData.email || '' },
        theme: 'dark',
        profile_url: '',
        is_active: true
      };
      
      const saveResult = await this.saveUserData(firebaseUserId, newUserData);
      
      if (saveResult.success) {
        console.log('✅ SUPABASE INIT: New user created successfully');
        return { 
          success: true, 
          data: { uid: firebaseUserId, ...newUserData }, 
          isNew: true,
          message: 'New user created in Supabase' 
        };
      } else {
        throw new Error(saveResult.error);
      }
      
    } catch (error) {
      console.error('❌ SUPABASE INIT: Error initializing user:', error);
      return { success: false, error: error.message, isNew: false };
    }
  }

  // Save user data to Supabase
  async saveUserData(userId, userData) {
    try {
      if (!this.checkConfiguration()) {
        return { success: false, error: 'Supabase not configured' };
      }

      console.log(`💾 SUPABASE: Saving data for ${userId.slice(0, 8)}...`);
      
      const payload = {
        user_id: userId,
        display_name: userData.displayName || '',
        username: userData.username || '',
        bio: userData.bio || '',
        photo_url: userData.photoURL || '',
        social_links: userData.socialLinks || {},
        contact_info: userData.contactInfo || {},
        theme: userData.theme || 'dark',
        profile_url: userData.profileURL || '',
        updated_at: new Date().toISOString()
      };

      if (supabaseClient) {
        const { error } = await supabaseClient
          .from('users')
          .upsert(payload, { onConflict: 'user_id' });
        if (error) throw error;
        console.log('✅ SUPABASE: Data saved successfully');
        return { success: true, message: 'Data saved to Supabase' };
      }
      // Fallback REST
      const response = await fetch(`${this.baseUrl}/rest/v1/users`, {
        method: 'POST',
        headers: {
          ...this.headers,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        console.log('✅ SUPABASE REST: Data saved successfully');
        return { success: true, message: 'Data saved to Supabase' };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      console.error('❌ SUPABASE: Save error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user data from Supabase
  async getUserData(userId) {
    try {
      if (!this.checkConfiguration()) {
        return { success: false, error: 'Supabase not configured' };
      }

      console.log(`🔍 SUPABASE: Getting data for ${userId.slice(0, 8)}...`);

      if (supabaseClient) {
        const { data, error } = await supabaseClient
          .from('users')
          .select('*')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          const userData = data;
          console.log('✅ SUPABASE: Found user data');
          return {
            success: true,
            data: {
              uid: userId,
              userId: userId,
              displayName: userData.display_name,
              username: userData.username,
              bio: userData.bio,
              photoURL: userData.photo_url,
              socialLinks: userData.social_links,
              contactInfo: userData.contact_info,
              theme: userData.theme,
              profileURL: userData.profile_url
            }
          };
        } else {
          console.log('❌ SUPABASE: User not found');
          return { success: false, error: 'User not found' };
        }
      }
      const response = await fetch(
        `${this.baseUrl}/rest/v1/users?user_id=eq.${userId}&select=*`,
        { headers: this.headers }
      );
      if (response.ok) {
        const data = await response.json();
        
        if (data && data.length > 0) {
          const userData = data[0];
          console.log('✅ SUPABASE: Found user data');
          
          return { 
            success: true, 
            data: {
              uid: userId,
              userId: userId,
              displayName: userData.display_name,
              username: userData.username,
              bio: userData.bio,
              photoURL: userData.photo_url,
              socialLinks: userData.social_links,
              contactInfo: userData.contact_info,
              theme: userData.theme,
              profileURL: userData.profile_url
            }
          };
        } else {
          console.log('❌ SUPABASE: User not found');
          return { success: false, error: 'User not found' };
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      console.error('❌ SUPABASE: Get error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get public profile
  async getPublicProfile(username) {
    try {
      if (!this.checkConfiguration()) {
        return { success: false, error: 'Supabase not configured' };
      }

      console.log(`🌐 SUPABASE: Getting public profile for @${username}`);

      const response = await fetch(
        `${this.baseUrl}/rest/v1/users?username=eq.${username}&select=username,display_name,bio,photo_url,social_links,contact_info,theme,profile_url`,
        { headers: this.headers }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data && data.length > 0) {
          console.log('✅ SUPABASE: Found public profile');
          return { success: true, data: data[0] };
        } else {
          console.log('❌ SUPABASE: Profile not found');
          return { success: false, error: 'Profile not found' };
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      console.error('❌ SUPABASE: Public profile error:', error);
      return { success: false, error: error.message };
    }
  }

  // Safe logout - NEVER deletes data
  safeLogout(userId) {
    console.log(`🚪 SUPABASE SAFE LOGOUT: User ${userId.slice(0, 8)} logging out`);
    console.log('✅ SUPABASE: ALL DATA PRESERVED IN CLOUD DATABASE');
    console.log('💾 SUPABASE: Profile, bio, links - ALL SAFE!');
    console.log('🔄 SUPABASE: Next login will restore everything instantly!');
    
    // NO DATA DELETION - Everything stays in Supabase cloud database
    return { success: true, message: 'Safe logout - data preserved' };
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.checkConfiguration()) {
        return { success: false, status: 'not_configured' };
      }

      const response = await fetch(`${this.baseUrl}/rest/v1/users?limit=1`, {
        headers: this.headers
      });

      if (response.ok) {
        console.log('✅ SUPABASE: Health check passed');
        return { success: true, status: 'healthy' };
      } else {
        throw new Error(`HTTP ${response.status}`);
      }

    } catch (error) {
      console.error('❌ SUPABASE: Health check failed:', error);
      return { success: false, status: 'unhealthy', error: error.message };
    }
  }
}

// Create and export instance
export const supabaseService = new SupabaseService();
export default supabaseService;

// Instructions for setup
console.log('📝 SUPABASE SETUP INSTRUCTIONS:');
console.log('1. Go to https://supabase.com and create FREE account');
console.log('2. Create new project (FREE - 500MB database)');
console.log('3. Go to Settings > API');
console.log('4. Copy Project URL and anon public key');
console.log('5. Replace SUPABASE_URL and SUPABASE_ANON_KEY above');
console.log('6. Create users table with these columns:');
console.log('   - user_id (text, primary key)');
console.log('   - display_name (text)'); 
console.log('   - username (text, unique)');
console.log('   - bio (text)');
console.log('   - photo_url (text)');
console.log('   - social_links (jsonb)');
console.log('   - contact_info (jsonb)');
console.log('   - theme (text)');
console.log('   - profile_url (text)');
console.log('   - updated_at (timestamptz)');
console.log('7. Enable Row Level Security and create policies');
console.log('8. Test connection with supabaseService.healthCheck()');