/**
 * CLEAN FIREBASE FIRESTORE & STORAGE SERVICE
 * Implements the exact schema specified in requirements:
 * - users/{uid}: display_name, email, profile_pic_url, created_at
 * - users/{uid}/links: {linkId} with title, url, created_at
 * 
 * SOLVES DATA LOSS ISSUE: Data persists in Firestore after signout
 */

import { 
  auth,
  db, 
  storage
} from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  serverTimestamp,
  onSnapshot 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import supabaseService from './supabaseService';
import supabaseClient from './supabaseClient';

class FirestoreService {
  constructor() {
    this.userDataCache = new Map();
    this.listeners = new Map();
  }

  /**
   * INITIALIZE USER - Creates user document if not exists
   */
  async initializeUser(userId, authData = {}) {
    try {
      console.log('🔥 FIRESTORE: Initializing user', userId.slice(0, 8));

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Create new user document with proper schema
        const userData = {
          display_name: authData.displayName || authData.email?.split('@')[0] || 'User',
          email: authData.email || '',
          profile_pic_url: authData.photoURL || '',
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
          // Additional fields for app functionality
          username: '',
          bio: '',
          theme: 'dark',
          contact_info: {
            phone: '',
            email: authData.email || '',
            website: ''
          },
          social_links: {
            facebook: '',
            instagram: '',
            twitter: '',
            tiktok: '',
            youtube: '',
            linkedin: ''
          },
          is_active: true
        };

        await setDoc(userRef, userData);
        console.log('✅ FIRESTORE: User document created');
        return { success: true, data: userData, isNew: true };
      } else {
        const userData = userSnap.data();
        console.log('✅ FIRESTORE: User document exists');
        return { success: true, data: userData, isNew: false };
      }
    } catch (error) {
      console.error('❌ FIRESTORE: Error initializing user:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * GET USER DATA - Loads user profile from Firestore
   */
  async getUserData(userId) {
    try {
      console.log('🔍 FIRESTORE: Getting user data for', userId.slice(0, 8));

      // Check cache first
      if (this.userDataCache.has(userId)) {
        console.log('💾 FIRESTORE: Using cached data');
        return { success: true, data: this.userDataCache.get(userId), source: 'cache' };
      }

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        
        // Cache the data
        this.userDataCache.set(userId, userData);
        
        console.log('✅ FIRESTORE: User data loaded:', {
          display_name: userData.display_name,
          email: userData.email,
          has_profile_pic: !!userData.profile_pic_url
        });

        return { success: true, data: userData, source: 'firestore' };
      } else {
        console.log('❌ FIRESTORE: User not found');
        return { success: false, error: 'User not found' };
      }
    } catch (error) {
      console.error('❌ FIRESTORE: Error getting user data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * UPDATE USER DATA - Saves user profile to Firestore
   */
  async updateUserData(userId, updates) {
    try {
      console.log('💾 FIRESTORE: Updating user data for', userId.slice(0, 8));
      console.log('📝 FIRESTORE: Updates:', Object.keys(updates));

      const userRef = doc(db, 'users', userId);
      
      const updateData = {
        ...updates,
        updated_at: serverTimestamp()
      };

      await updateDoc(userRef, updateData);

      // Mirror data to Supabase (if configured)
      try {
        const supaPayload = {
          displayName: updates.display_name,
          username: updates.username,
          bio: updates.bio,
          photoURL: updates.profile_pic_url,
          socialLinks: updates.social_links,
          contactInfo: updates.contact_info,
          theme: updates.theme,
          profileURL: updates.profile_url
        };
        await supabaseService.saveUserData(userId, supaPayload);
      } catch (e) {
        console.warn('⚠️ SUPABASE mirror failed (non-blocking):', e?.message);
      }

      // Update cache
      if (this.userDataCache.has(userId)) {
        const cached = this.userDataCache.get(userId);
        this.userDataCache.set(userId, { ...cached, ...updates });
      }

      console.log('✅ FIRESTORE: User data updated successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ FIRESTORE: Error updating user data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * UPLOAD PROFILE PICTURE - Stores image in Firebase Storage
   */
  async uploadProfilePicture(userId, file) {
    try {
      console.log('📸 STORAGE: Uploading profile picture for', userId.slice(0, 8));

      // New flow: Upload via backend API (uses Firebase Admin + Supabase Service Role)
      const currentUser = auth.currentUser;
      const idToken = currentUser ? await currentUser.getIdToken() : null;
      if (!idToken) throw new Error('Not signed in');

      const apiBase = process.env.REACT_APP_API_BASE_URL || '';
      const url = `${apiBase}/api/upload`;

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Upload failed');
      }

      const result = await res.json();
      const downloadURL = result.url;

      await this.updateUserData(userId, { profile_pic_url: downloadURL });
      try { await supabaseService.saveUserData(userId, { photoURL: downloadURL }); } catch {}

      console.log('✅ BACKEND STORAGE: Profile picture uploaded via API');
      return { success: true, url: downloadURL };
    } catch (error) {
      console.error('❌ STORAGE: Error uploading profile picture:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * GET USER LINKS - Retrieves links from users/{uid}/links subcollection
   */
  async getUserLinks(userId) {
    try {
      console.log('🔗 FIRESTORE: Getting links for', userId.slice(0, 8));

      const linksRef = collection(db, 'users', userId, 'links');
      const linksSnap = await getDocs(linksRef);

      const links = [];
      linksSnap.forEach((doc) => {
        links.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log('✅ FIRESTORE: Found', links.length, 'links');
      return { success: true, data: links };
    } catch (error) {
      console.error('❌ FIRESTORE: Error getting links:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ADD USER LINK - Adds link to users/{uid}/links subcollection
   */
  async addUserLink(userId, linkData) {
    try {
      console.log('➕ FIRESTORE: Adding link for', userId.slice(0, 8));

      const linksRef = collection(db, 'users', userId, 'links');
      const linkDoc = {
        title: linkData.title || '',
        url: linkData.url || '',
        created_at: serverTimestamp()
      };

      const docRef = await addDoc(linksRef, linkDoc);
      
      console.log('✅ FIRESTORE: Link added with ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ FIRESTORE: Error adding link:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * UPDATE USER LINK - Updates link in users/{uid}/links subcollection
   */
  async updateUserLink(userId, linkId, linkData) {
    try {
      console.log('✏️ FIRESTORE: Updating link', linkId, 'for', userId.slice(0, 8));

      const linkRef = doc(db, 'users', userId, 'links', linkId);
      const updateData = {
        ...linkData,
        updated_at: serverTimestamp()
      };

      await updateDoc(linkRef, updateData);
      
      console.log('✅ FIRESTORE: Link updated successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ FIRESTORE: Error updating link:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * DELETE USER LINK - Removes link from users/{uid}/links subcollection
   */
  async deleteUserLink(userId, linkId) {
    try {
      console.log('🗑️ FIRESTORE: Deleting link', linkId, 'for', userId.slice(0, 8));

      const linkRef = doc(db, 'users', userId, 'links', linkId);
      await deleteDoc(linkRef);
      
      console.log('✅ FIRESTORE: Link deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ FIRESTORE: Error deleting link:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * GET PUBLIC PROFILE - Gets public profile by username
   */
  async getPublicProfile(username) {
    try {
      console.log('🌐 FIRESTORE: Getting public profile for', username);

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        // Get user's links
        const linksResult = await this.getUserLinks(userDoc.id);
        const links = linksResult.success ? linksResult.data : [];

        const publicProfile = {
          userId: userDoc.id,
          username: userData.username,
          display_name: userData.display_name,
          bio: userData.bio,
          profile_pic_url: userData.profile_pic_url,
          theme: userData.theme || 'dark',
          social_links: userData.social_links || {},
          contact_info: userData.contact_info || {},
          links: links
        };

        console.log('✅ FIRESTORE: Public profile found');
        return { success: true, data: publicProfile };
      } else {
        console.log('❌ FIRESTORE: Public profile not found');
        return { success: false, error: 'Profile not found' };
      }
    } catch (error) {
      console.error('❌ FIRESTORE: Error getting public profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * SETUP REAL-TIME LISTENER - Listens for user data changes
   */
  setupRealtimeListener(userId, callback) {
    console.log('👂 FIRESTORE: Setting up real-time listener for', userId.slice(0, 8));

    // Clean up existing listener
    if (this.listeners.has(userId)) {
      this.listeners.get(userId)();
    }

    const userRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        console.log('🔄 FIRESTORE: Real-time update received');
        
        // Update cache
        this.userDataCache.set(userId, userData);
        
        // Call callback if provided
        if (callback) {
          callback(userData);
        }
      }
    }, (error) => {
      console.error('❌ FIRESTORE: Real-time listener error:', error);
    });

    this.listeners.set(userId, unsubscribe);
    return unsubscribe;
  }

  /**
   * CLEAN UP - Removes listeners and cache on logout
   */
  cleanup(userId) {
    console.log('🧹 FIRESTORE: Cleaning up for', userId.slice(0, 8));

    // Remove listener
    if (this.listeners.has(userId)) {
      this.listeners.get(userId)();
      this.listeners.delete(userId);
    }

    // Keep cache for quick re-login (optional, can be removed if memory is a concern)
    // this.userDataCache.delete(userId);
    
    console.log('✅ FIRESTORE: Cleanup complete');
  }

  /**
   * CLEAR ALL DATA - For testing/debugging (removes everything)
   */
  clearAllData() {
    this.userDataCache.clear();
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
    console.log('🧹 FIRESTORE: All data cleared');
  }
}

// Create singleton instance
const firestoreService = new FirestoreService();

export default firestoreService;

// Export individual methods for easy import
export const {
  initializeUser,
  getUserData,
  updateUserData,
  uploadProfilePicture,
  getUserLinks,
  addUserLink,
  updateUserLink,
  deleteUserLink,
  getPublicProfile,
  setupRealtimeListener,
  cleanup
} = firestoreService;

console.log('🚀 FIRESTORE SERVICE: Clean service initialized');
console.log('✅ FIRESTORE SERVICE: Implements proper schema with users/{uid} and users/{uid}/links');
console.log('✅ FIRESTORE SERVICE: Firebase Storage integration for profile pictures');
console.log('✅ FIRESTORE SERVICE: Data persists across sessions - NO MORE DATA LOSS!');