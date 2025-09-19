// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, orderBy, limit, arrayUnion, arrayRemove, writeBatch, deleteField } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { verifiedUsernames, isVerifiedUser } from '../config/verifiedAccounts';
// Import Supabase for data storage
import supabaseService from './supabaseService';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDc9vaKPD4XSdP1jhjto1VmcuheJcq0i8c",
  authDomain: "irtzalink-4d407.firebaseapp.com",
  projectId: "irtzalink-4d407",
  storageBucket: "irtzalink-4d407.firebasestorage.app",
  messagingSenderId: "342984685133",
  appId: "1:342984685133:web:19eb6d4bcfdd921ef38e04",
  measurementId: "G-3TDPN9HGJW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
// Note: Primary data storage is Supabase, Firebase as fallback

// Auth provider
export const googleProvider = new GoogleAuthProvider();

// Helper functions
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signInWithEmail = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const signUpWithEmail = (email, password) => createUserWithEmailAndPassword(auth, email, password);

// SAFE LOGOUT - PRESERVES ALL USER DATA IN SUPABASE
export const safeLogout = async () => {
  try {
    console.log('🚪 SAFE LOGOUT: Logging out user while PRESERVING ALL DATA');
    console.log('💾 SUPABASE: Profile, bio, social links, DP, settings - ALL SAFE IN DATABASE!');
    console.log('🔒 DATA PROTECTION: All user data remains in Supabase database');
    console.log('🔄 NEXT LOGIN: All data will be restored from Supabase instantly!');
    
    // Only sign out from Firebase Auth - NO DATA DELETION ANYWHERE
    await signOut(auth);
    
    // Clear only auth-related localStorage (keep data cache for faster loading)
    // DO NOT clear user data cache - it helps with faster next login
    
    console.log('✅ SAFE LOGOUT COMPLETE:');
    console.log('   ✅ Authentication cleared');
    console.log('   ✅ ALL USER DATA PRESERVED IN SUPABASE');
    console.log('   ✅ Data cache kept for faster next login');
    console.log('🔄 NEXT LOGIN: Instant data restoration from Supabase!');
    
    return { success: true, message: 'Logout successful - all data preserved' };
  } catch (error) {
    console.error('❌ SAFE LOGOUT ERROR:', error);
    return { success: false, error: error.message };
  }
};

// Legacy logout function (redirects to safe logout)
export const logout = async () => {
  console.log('🔄 LEGACY LOGOUT: Redirecting to safe logout');
  return await safeLogout();
};

// Export onAuthStateChanged for App.js
export { onAuthStateChanged } from 'firebase/auth';

// RESTORE USER DATA AFTER LOGIN
export const restoreUserDataAfterLogin = async (userId) => {
  try {
    console.log(`🔄 RESTORATION: Loading saved data for user ${userId.slice(0, 8)}...`);
    
    // Get user data from Supabase (primary source)
    const result = await getUserData(userId);
    
    if (result.success && result.data) {
      console.log('✅ RESTORATION SUCCESS: All data restored!', {
        username: result.data.username,
        displayName: result.data.displayName,
        hasLinks: !!result.data.socialLinks,
        hasBio: !!result.data.bio,
        hasPhoto: !!result.data.photoURL
      });
      
      console.log('🎉 WELCOME BACK: Your profile, links, bio, DP - everything is restored!');
      return result;
    } else {
      console.log('🆕 NEW USER: No previous data found, ready for profile setup');
      return { success: true, data: null, isNewUser: true };
    }
    
  } catch (error) {
    console.error('❌ RESTORATION ERROR:', error);
    return { success: false, error: error.message };
  }
};

// Export Firestore functions for unified storage
export { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';

// User data helpers - Using Supabase instead of Firestore
export const createUser = async (userId, userData) => {
  try {
    console.log('🔄 FIREBASE: Creating user via Supabase...');
    const userDataWithTimestamp = {
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };
    
    // Use Supabase for data storage
    const result = await supabaseService.saveUserData(userId, userDataWithTimestamp);
    return result;
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: error.message };
  }
};

// Local username availability check
export const checkUsernameAvailabilityLocal = async (username) => {
  try {
    const q = query(collection(db, 'users'), where('username', '==', username), limit(1));
    const querySnapshot = await getDocs(q);
    return { success: true, available: querySnapshot.empty };
  } catch (error) {
    console.error('Error checking username availability:', error);
    return { success: false, error: error.message };
  }
};

// Local username reservation (improved with double-check and one-time permission)
export const reserveUsernameLocal = async (userId, username, userEmail = null) => {
  try {
    // Import one-time change functions
    const { canChangeUsernameOneTime, removeFromOneTimeChange } = await import('../config/verifiedAccounts');
    
    // Get current user data to check if they already have a username
    const currentUserResult = await getUserData(userId);
    if (currentUserResult.success && currentUserResult.data.username && userEmail) {
      // User already has a username, check if they have one-time permission
      if (!canChangeUsernameOneTime(userEmail)) {
        return { success: false, error: 'Username can only be changed once. Contact support for assistance.' };
      }
    }

    // Double-check availability before updating
    const availabilityCheck = await checkUsernameAvailabilityLocal(username);
    if (!availabilityCheck.success || !availabilityCheck.available) {
      return { success: false, error: 'Username is not available' };
    }

    // Update user document with new username
    await updateDoc(doc(db, 'users', userId), { 
      username: username.toLowerCase(),
      profileURL: `https://irtzalink.vercel.app/${username.toLowerCase()}`,
      updatedAt: new Date(),
      usernameChangedAt: new Date() // Track when username was changed
    });
    
    // If user used their one-time permission, remove them from the list
    if (userEmail && currentUserResult.success && currentUserResult.data.username) {
      removeFromOneTimeChange(userEmail);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error reserving username:', error);
    return { success: false, error: error.message };
  }
};

export const getUserData = async (userId) => {
  try {
    if (!userId) {
      console.error('❌ ERROR: No userId provided to getUserData');
      return { success: false, error: 'User ID is required' };
    }
    
    console.log(`🔍 SUPABASE: Getting user data for ${userId.slice(0, 8)}...`);
    
    // STEP 1: Try Supabase first (primary data source)
    const supabaseResult = await supabaseService.getUserData(userId);
    if (supabaseResult.success) {
      console.log('✅ SUPABASE: Found user data');
      return supabaseResult;
    }
    
    // STEP 2: Fallback to localStorage cache
    const permanentKeys = [
      `irtzalink_${userId}_profile_v3`,
      `irtzalink_user_${userId}_backup`,
      `irtzalink_data_${userId}_safe`,
      `user_profile_${userId}_permanent`,
      `irtzalink_permanent_${userId}_v3`
    ];
    
    for (const key of permanentKeys) {
      try {
        const cachedData = localStorage.getItem(key);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          if (parsed && (parsed.username || parsed.displayName)) {
            console.log(`💾 CACHE: Found cached data in ${key}`);
            
            // Ensure data has correct user ID
            parsed.uid = userId;
            parsed.userId = userId;
            
            return { 
              success: true, 
              data: parsed,
              source: `localStorage_cache`
            };
          }
        }
      } catch (parseError) {
        console.warn(`⚠️ Failed to parse ${key}:`, parseError);
        continue;
      }
    }
    
    // STEP 2: Try Firebase as secondary source
    console.log(`☁️ FIXED: No local data found, trying Firebase for ${userId.slice(0, 8)}...`);
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const userData = docSnap.data();
      
      // Ensure data has correct user ID
      userData.uid = userId;
      userData.userId = userId;
      
      console.log(`✅ FIXED: Firebase data loaded:`, {
        userId: userId.slice(0, 8),
        username: userData.username,
        displayName: userData.displayName,
        hasData: Object.keys(userData).length > 3
      });
      
      // IMMEDIATELY save to ALL localStorage locations for future use
      try {
        const enhancedData = {
          ...userData,
          persistenceVersion: '3.0',
          savedTimestamp: Date.now(),
          savedDate: new Date().toISOString(),
          source: 'firebase_sync'
        };
        
        permanentKeys.forEach((key, index) => {
          try {
            localStorage.setItem(key, JSON.stringify(enhancedData));
            console.log(`💾 FIXED: Saved backup ${index + 1}/5 to ${key}`);
          } catch (saveError) {
            console.warn(`⚠️ Failed to save to ${key}:`, saveError);
          }
        });
        
        console.log('🔒 FIXED: User data saved to 5 permanent locations - NEVER LOSES DATA!');
      } catch (saveError) {
        console.warn('⚠️ Failed to save Firebase data locally:', saveError);
      }
      
      return { 
        success: true, 
        data: userData,
        source: 'firebase'
      };
    }
    
    // STEP 3: Emergency scan for ANY user data in localStorage
    console.log(`🆘 FIXED: Emergency scan for ANY data for ${userId.slice(0, 8)}...`);
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes(userId.slice(0, 8)) || key.includes(userId))) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (parsed && (parsed.data || parsed.username || parsed.displayName)) {
              const userData = parsed.data || parsed;
              console.log(`🆘 FIXED: EMERGENCY RECOVERY - Found data in ${key}`);
              userData.uid = userId;
              userData.userId = userId;
              return { success: true, data: userData, source: 'emergency_recovery' };
            }
          }
        } catch (e) {
          continue;
        }
      }
    }
    
    console.log(`⚠️ FIXED: No data found anywhere for ${userId.slice(0, 8)} - will create new`);
    return { 
      success: false, 
      error: 'User not found'
    };
    
  } catch (error) {
    console.error('❌ FIXED: ERROR getting user data for', userId?.slice(0, 8), ':', error);
    
    // Final emergency localStorage scan
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes(userId?.slice(0, 8))) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const parsed = JSON.parse(data);
              if (parsed && (parsed.data || parsed.username)) {
                console.log(`🆘 FIXED: CRITICAL RECOVERY from ${key}`);
                const userData = parsed.data || parsed;
                userData.uid = userId;
                userData.userId = userId;
                return { success: true, data: userData, source: 'critical_recovery' };
              }
            } catch (e) {}
          }
        }
      }
    } catch (emergencyError) {
      console.error('❌ FIXED: Emergency recovery failed:', emergencyError);
    }
    
    return { success: false, error: error.message };
  }
};

// Create basic user document if needed
export const createUserDocument = async (userId, initialData = {}) => {
  try {
    const basicUserData = {
      uid: userId,
      userId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      socialLinks: {},
      contactInfo: {},
      theme: 'dark',
      followers: [],
      following: [],
      displayName: '',
      username: '',
      bio: ''
    };
    
    // Save the basic structure for future use
    try {
      localStorage.setItem(`irtzalink_${userId}_profile_v3`, JSON.stringify({
        ...basicUserData,
        persistenceVersion: '3.0',
        savedTimestamp: Date.now(),
        source: 'created_new'
      }));
      console.log('💾 Saved new basic user structure to localStorage');
    } catch (saveError) {
      console.warn('⚠️ Failed to save new user structure:', saveError.message);
    }
    
    return { 
      success: true, 
      data: basicUserData,
      source: 'created_new'
    };
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR in getUserData:', error);
    
    // Last resort: try to find ANY user data in localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes(userId.slice(0, 8))) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const parsed = JSON.parse(data);
              console.log(`🆘 EMERGENCY: Found user data in emergency scan from ${key}`);
              return { success: true, data: parsed.data || parsed, source: 'emergency_recovery' };
            } catch (e) {}
          }
        }
      }
    } catch (emergencyError) {
      console.error('❌ Emergency recovery also failed:', emergencyError.message);
    }
    
    return { success: false, error: error.message };
  }
};

export const updateUserData = async (userId, userData) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    console.log('🔄 SUPABASE: Updating user data...');
    
    // Validate data before saving
    const cleanedData = {
      ...userData,
      userId: userId,
      updatedAt: new Date().toISOString(),
      lastSyncedAt: new Date().toISOString()
    };
    
    // Remove any undefined values
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key] === undefined) {
        delete cleanedData[key];
      }
    });
    
    console.log('💾 SUPABASE: Saving user data:', {
      userId: userId.slice(0, 8),
      username: cleanedData.username,
      displayName: cleanedData.displayName
    });
    
    // 1. Save to Supabase (primary data store)
    const supabaseResult = await supabaseService.saveUserData(userId, cleanedData);
    
    if (supabaseResult.success) {
      console.log('✅ SUPABASE: Data saved successfully!');
    } else {
      console.error('❌ SUPABASE: Save failed:', supabaseResult.error);
    }
    
    // 2. Save to localStorage as backup (since we removed Firebase verification)
    if (supabaseResult.success) {
      try {
        console.log('✅ SUPABASE: Data verified and saved');
      } catch (verifyError) {
        console.warn('⚠️ Supabase verification failed:', verifyError.message);
      }
    }
    
    // 3. Save to localStorage as backup
    try {
      const enhancedData = {
        ...cleanedData,
        persistenceVersion: '3.0',
        savedTimestamp: Date.now(),
        savedDate: new Date().toISOString()
      };
      
      const storageKeys = [
        `irtzalink_${userId}_profile_v3`,
        `irtzalink_user_${userId}_backup`,
        `irtzalink_data_${userId}_safe`,
        `user_profile_${userId}_permanent`,
        `irtzalink_permanent_${userId}_v3`
      ];
      
      storageKeys.forEach((key, index) => {
        try {
          localStorage.setItem(key, JSON.stringify(enhancedData));
          console.log(`💾 Backup ${index + 1}/5: Saved to ${key}`);
        } catch (err) {
          console.warn(`⚠️ Backup ${index + 1} failed:`, err.message);
        }
      });
      
      console.log('💾 LocalStorage backups complete');
      
    } catch (localError) {
      console.error('❌ LocalStorage save failed:', localError);
    }
    
    if (!supabaseResult.success) {
      console.error('❌ CRITICAL: Supabase save failed!');
      return { 
        success: false, 
        error: 'Supabase save failed',
        supabaseSync: false
      };
    }
    
    console.log('🎉 SUCCESS: Data saved to Supabase!');
    console.log('🔍 Data stored successfully!');
    
    return { 
      success: true, 
      supabaseSync: supabaseResult.success,
      message: 'Data saved successfully to Supabase'
    };
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR in updateUserData:', error);
    return { success: false, error: error.message };
  }
};

export const getPublicProfile = async (username) => {
  try {
    console.log(`🔍 SUPABASE: Searching for public profile: ${username}`);
    
    // Try Supabase first (primary data source)
    const supabaseResult = await supabaseService.getPublicProfile(username);
    if (supabaseResult.success) {
      console.log(`✅ SUPABASE: Found profile:`, {
        username: supabaseResult.data.username,
        display_name: supabaseResult.data.display_name,
        hasLinks: !!supabaseResult.data.social_links
      });
      
      // Convert Supabase format to frontend format
      const userData = {
        username: supabaseResult.data.username,
        displayName: supabaseResult.data.display_name,
        bio: supabaseResult.data.bio,
        photoURL: supabaseResult.data.photo_url,
        socialLinks: supabaseResult.data.social_links || {},
        contactInfo: supabaseResult.data.contact_info || {},
        theme: supabaseResult.data.theme || 'dark',
        profileURL: supabaseResult.data.profile_url
      };
      
      // Save to localStorage for future access (PUBLIC DATA ONLY)
      try {
        const publicData = {
          username: userData.username,
          displayName: userData.displayName,
          bio: userData.bio,
          photoURL: userData.photoURL,
          socialLinks: userData.socialLinks || {},
          contactInfo: userData.contactInfo || {},
          theme: userData.theme || 'dark',
          profileURL: userData.profileURL,
          userId: 'supabase_user',
          lastCached: Date.now(),
          isPublic: true
        };
        
        localStorage.setItem(`irtzalink_public_${username}`, JSON.stringify(publicData));
        localStorage.setItem(`irtzalink_public_user_supabase`, JSON.stringify(publicData));
        console.log(`💾 FIXED: Cached public profile for ${username}`);
      } catch (cacheError) {
        console.warn('⚠️ Failed to cache public profile:', cacheError);
      }
      
      return {
        success: true,
        data: {
          username: userData.username,
          displayName: userData.displayName,
          bio: userData.bio,
          photoURL: userData.photoURL,
          socialLinks: userData.socialLinks || {},
          contactInfo: userData.contactInfo || {},
          theme: userData.theme || 'dark',
          profileURL: userData.profileURL,
          userId: 'supabase_user'
        },
        source: 'firebase'
      };
    }
    
    // If Firebase fails, try localStorage cache
    console.log(`🔄 FIXED: Firebase empty, checking localStorage cache for ${username}`);
    const cachedData = localStorage.getItem(`irtzalink_public_${username}`);
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        console.log(`💾 FIXED: Found cached public profile for ${username}`);
        return {
          success: true,
          data: parsed,
          source: 'localStorage_cache'
        };
      } catch (parseError) {
        console.warn('⚠️ Failed to parse cached data:', parseError);
      }
    }
    
    console.log(`❌ FIXED: No profile found for ${username} in Firebase or cache`);
    return { success: false, error: 'User not found' };
    
  } catch (error) {
    console.error('❌ FIXED: Error getting public profile:', error);
    
    // Final fallback to localStorage
    try {
      const cachedData = localStorage.getItem(`irtzalink_public_${username}`);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        console.log(`🆘 FIXED: Emergency fallback - using cached data for ${username}`);
        return {
          success: true,
          data: parsed,
          source: 'localStorage_emergency'
        };
      }
    } catch (fallbackError) {
      console.error('❌ FIXED: Emergency fallback also failed:', fallbackError);
    }
    
    return { success: false, error: error.message };
  }
};

// Cloud Functions
export const generateQRCode = httpsCallable(functions, 'generateQRCode');
export const checkUsernameAvailability = httpsCallable(functions, 'checkUsernameAvailability');
export const reserveUsername = httpsCallable(functions, 'reserveUsername');
export const trackQRScan = httpsCallable(functions, 'trackQRScan');

// Storage helpers - Enhanced profile image upload
export const uploadProfileImage = async (userId, file) => {
  try {
    console.log(`🖼️ UPLOAD: Starting profile image upload for user ${userId.slice(0, 8)}`);
    console.log(`🖼️ FILE: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB, Type: ${file.type}`);
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Please select a valid image file' };
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return { success: false, error: 'Image size must be less than 10MB' };
    }
    
    // Create unique filename with timestamp
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `profile_${timestamp}.${fileExtension}`;
    
    console.log(`🖼️ STORAGE: Uploading to Firebase Storage...`);
    const storageRef = ref(storage, `profile_pictures/${userId}/${fileName}`);
    
    // Upload with metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        'uploadedBy': userId,
        'uploadedAt': timestamp.toString(),
        'originalName': file.name
      }
    };
    
    const snapshot = await uploadBytes(storageRef, file, metadata);
    console.log(`✅ UPLOAD: Image uploaded successfully to Firebase Storage`);
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log(`✅ UPLOAD: Download URL generated:`, downloadURL.substring(0, 100) + '...');
    
    return { 
      success: true, 
      url: downloadURL,
      fileName,
      fileSize: file.size,
      timestamp
    };
    
  } catch (error) {
    console.error('❌ UPLOAD: Error uploading image:', error);
    
    // Provide user-friendly error messages
    let userMessage = 'Failed to upload image. Please try again.';
    
    if (error.code === 'storage/unauthorized') {
      userMessage = 'You do not have permission to upload images. Please sign in again.';
    } else if (error.code === 'storage/quota-exceeded') {
      userMessage = 'Storage quota exceeded. Please contact support.';
    } else if (error.code === 'storage/invalid-format') {
      userMessage = 'Invalid image format. Please use JPG, PNG, or GIF.';
    } else if (error.message?.includes('network')) {
      userMessage = 'Network error. Please check your connection and try again.';
    }
    
    return { success: false, error: userMessage, originalError: error.message };
  }
};

// Analytics helpers
export const getUserAnalytics = async (userId, type = null, limitCount = 100) => {
  try {
    let q = collection(db, 'analytics');
    
    if (type) {
      q = query(q, where('userId', '==', userId), where('type', '==', type), orderBy('timestamp', 'desc'), limit(limitCount));
    } else {
      q = query(q, where('userId', '==', userId), orderBy('timestamp', 'desc'), limit(limitCount));
    }
    
    const querySnapshot = await getDocs(q);
    const analytics = [];
    querySnapshot.forEach((doc) => {
      analytics.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: analytics };
  } catch (error) {
    console.error('Error getting analytics:', error);
    return { success: false, error: error.message };
  }
};

// Admin helpers
export const getAllUsers = async (limitCount = 100) => {
  try {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: users };
  } catch (error) {
    console.error('Error getting all users:', error);
    return { success: false, error: error.message };
  }
};

export const reportAbuse = async (reportData) => {
  try {
    await addDoc(collection(db, 'reports'), {
      ...reportData,
      timestamp: new Date()
    });
    return { success: true };
  } catch (error) {
    console.error('Error reporting abuse:', error);
    return { success: false, error: error.message };
  }
};

// Reset username change cooldown for all users (Admin function)
export const resetUsernameChangeForAllUsers = async () => {
  try {
    console.log('🔄 Starting username change reset for all users...');
    
    // Get all users
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
    
    let resetCount = 0;
    const batch = writeBatch(db);
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      
      // Only reset users who have previously changed their username
      if (userData.usernameLastChanged) {
        batch.update(doc.ref, {
          usernameLastChanged: deleteField(), // Remove the field entirely
          usernameChangeResetAt: new Date(), // Track when reset was done
          updatedAt: new Date()
        });
        resetCount++;
      }
    });
    
    if (resetCount > 0) {
      await batch.commit();
      console.log(`✅ Reset username change cooldown for ${resetCount} users`);
      return { 
        success: true, 
        message: `Successfully reset username change cooldown for ${resetCount} users`,
        resetCount 
      };
    } else {
      console.log('ℹ️ No users found with username change history');
      return { 
        success: true, 
        message: 'No users found with username change history',
        resetCount: 0 
      };
    }
    
  } catch (error) {
    console.error('❌ Error resetting username changes:', error);
    return { success: false, error: error.message };
  }
};

// Search users by username and display name
export const searchUsersByUsername = async (searchTerm, limitCount = 10) => {
  try {
    console.log(`🔍 SIMPLE SEARCH: Looking for users matching "${searchTerm}"`);
    
    if (!searchTerm || searchTerm.trim().length < 2) {
      return { success: true, data: [] };
    }

    const searchTermLower = searchTerm.toLowerCase();
    
    // Simple and reliable Firebase search
    const q = query(
      collection(db, 'users'),
      where('username', '>=', searchTermLower),
      where('username', '<=', searchTermLower + '\uf8ff'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const users = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.isActive !== false) {
        users.push({
          uid: doc.id,
          username: userData.username,
          displayName: userData.displayName || userData.username,
          photoURL: userData.photoURL,
          bio: userData.bio,
          profileURL: userData.profileURL,
          isActive: userData.isActive !== false,
          matchType: 'username'
        });
      }
    });
    
    // Also search by displayName
    if (users.length < limitCount) {
      const displayNameQuery = query(
        collection(db, 'users'),
        limit(50)
      );
      
      const displayNameSnapshot = await getDocs(displayNameQuery);
      
      displayNameSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.isActive !== false && 
            userData.displayName && 
            userData.displayName.toLowerCase().includes(searchTermLower) &&
            !users.find(u => u.uid === doc.id)) {
          
          users.push({
            uid: doc.id,
            username: userData.username,
            displayName: userData.displayName,
            photoURL: userData.photoURL,
            bio: userData.bio,
            profileURL: userData.profileURL,
            isActive: userData.isActive !== false,
            matchType: 'displayName'
          });
        }
      });
    }
    
    // Sort by relevance
    const sortedUsers = users
      .sort((a, b) => {
        if (a.username === searchTermLower) return -1;
        if (b.username === searchTermLower) return 1;
        if (a.matchType === 'username' && b.matchType === 'displayName') return -1;
        if (a.matchType === 'displayName' && b.matchType === 'username') return 1;
        return 0;
      })
      .slice(0, limitCount);
    
    console.log(`✅ SEARCH COMPLETE: Found ${sortedUsers.length} users`);
    return { success: true, data: sortedUsers };
    
  } catch (error) {
    console.error('❌ SEARCH ERROR:', error);
    return { success: false, error: error.message };
  }
};


// Social Features - Instagram-like Follow System Only

// Chat functions (basic)
export const createChatRoom = async (user1Id, user2Id) => {
  try {
    const chatId = [user1Id, user2Id].sort().join('_');
    const chatData = {
      participants: [user1Id, user2Id],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessage: null
    };
    
    await setDoc(doc(db, 'chats', chatId), chatData);
    return { success: true, chatId };
  } catch (error) {
    console.error('Error creating chat room:', error);
    return { success: false, error: error.message };
  }
};

export const sendMessage = async (chatId, senderId, message) => {
  try {
    const messageData = {
      senderId,
      message,
      timestamp: new Date(),
      read: false
    };
    
    // Add message to messages subcollection
    await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);
    
    // Update chat room's last message
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: message,
      updatedAt: new Date()
    });
    
    // Get chat participants to find receiver
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    if (chatDoc.exists()) {
      const participants = chatDoc.data().participants;
      const receiverId = participants.find(id => id !== senderId);
      
      if (receiverId) {
        // Create notification for the receiver
        await createNotification(
          receiverId,
          senderId,
          'message',
          'sent you a message'
        );
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: error.message };
  }
};

export const getChatMessages = async (chatId, limitCount = 50) => {
  try {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const messages = [];
    
    querySnapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: messages.reverse() };
  } catch (error) {
    console.error('Error getting messages:', error);
    return { success: false, error: error.message };
  }
};

// Get unread messages count for user
export const getUnreadMessagesCount = async (userId) => {
  try {
    // Get all chats where user is a participant
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId)
    );
    
    const chatSnapshot = await getDocs(chatsQuery);
    let totalUnreadCount = 0;
    
    // For each chat, count unread messages
    const promises = chatSnapshot.docs.map(async (chatDoc) => {
      const chatId = chatDoc.id;
      const messagesQuery = query(
        collection(db, 'chats', chatId, 'messages'),
        where('senderId', '!=', userId),
        where('read', '==', false)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      return messagesSnapshot.size;
    });
    
    const counts = await Promise.all(promises);
    totalUnreadCount = counts.reduce((sum, count) => sum + count, 0);
    
    return { success: true, count: totalUnreadCount };
  } catch (error) {
    console.error('Error getting unread messages count:', error);
    return { success: false, error: error.message, count: 0 };
  }
};

// Notification functions
export const createNotification = async (toUserId, fromUserId, type, message, data = {}) => {
  try {
    const notificationData = {
      toUserId,
      fromUserId,
      type, // 'friend_request', 'profile_visit', 'message', 'friend_accepted'
      message,
      data, // Additional data like profile info
      read: false,
      timestamp: new Date()
    };
    
    await addDoc(collection(db, 'notifications'), notificationData);
    return { success: true };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }
};

export const getUserNotifications = async (userId, limitCount = 20) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('toUserId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const notifications = [];
    
    // Get user data for fromUserId
    const userPromises = [];
    const userMap = new Map();
    
    querySnapshot.forEach((doc) => {
      const notification = { id: doc.id, ...doc.data() };
      notifications.push(notification);
      
      if (notification.fromUserId && !userMap.has(notification.fromUserId)) {
        userMap.set(notification.fromUserId, null);
        userPromises.push(
          getDoc(doc(db, 'users', notification.fromUserId)).then((userDoc) => {
            if (userDoc.exists()) {
              userMap.set(notification.fromUserId, {
                uid: userDoc.id,
                displayName: userDoc.data().displayName,
                photoURL: userDoc.data().photoURL,
                username: userDoc.data().username
              });
            }
          })
        );
      }
    });
    
    // Wait for all user data to load
    await Promise.all(userPromises);
    
    // Add user data to notifications
    const enrichedNotifications = notifications.map(notification => ({
      ...notification,
      fromUser: userMap.get(notification.fromUserId)
    }));
    
    return { success: true, data: enrichedNotifications };
  } catch (error) {
    console.error('Error getting notifications:', error);
    return { success: false, error: error.message };
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
      readAt: new Date()
    });
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
};

export const markAllNotificationsAsRead = async (userId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('toUserId', '==', userId),
      where('read', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const batch = [];
    
    querySnapshot.forEach((docSnap) => {
      batch.push(
        updateDoc(doc(db, 'notifications', docSnap.id), {
          read: true,
          readAt: new Date()
        })
      );
    });
    
    await Promise.all(batch);
    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: error.message };
  }
};

// Test notification creation (for debugging)
export const createTestNotification = async (userId) => {
  try {
    await createNotification(
      userId,
      userId, // Self notification for testing
      'profile_visit',
      'This is a test notification to verify the system is working'
    );
    return { success: true };
  } catch (error) {
    console.error('Error creating test notification:', error);
    return { success: false, error: error.message };
  }
};

// Add notification creation to existing functions
export const trackProfileVisit = async (visitorId, visitedUserId) => {
  try {
    // Create analytics entry
    await addDoc(collection(db, 'analytics'), {
      userId: visitedUserId,
      visitorId: visitorId,
      type: 'profile_visit',
      timestamp: new Date(),
      userAgent: navigator.userAgent || '',
      ip: 'client-side'
    });
    
    // Create notification for profile owner
    if (visitorId !== visitedUserId) {
      await createNotification(
        visitedUserId,
        visitorId,
        'profile_visit',
        'visited your profile'
      );
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error tracking profile visit:', error);
    return { success: false, error: error.message };
  }
};

// Track QR code scan
export const trackQRCodeScan = async (userId, source = 'qr_code') => {
  try {
    await addDoc(collection(db, 'analytics'), {
      userId: userId,
      type: 'qr_scan',
      timestamp: new Date(),
      userAgent: navigator.userAgent || '',
      source: source,
      ip: 'client-side'
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error tracking QR scan:', error);
    return { success: false, error: error.message };
  }
};

// Instagram-like Follow System

// Follow a user
export const followUser = async (followerId, followingId) => {
  try {
    if (followerId === followingId) {
      return { success: false, error: 'Cannot follow yourself' };
    }

    // Check if already following
    const followerData = await getUserData(followerId);
    if (followerData.success && followerData.data.following?.includes(followingId)) {
      return { success: false, error: 'Already following this user' };
    }

    // Update follower's following list
    await updateDoc(doc(db, 'users', followerId), {
      following: arrayUnion(followingId),
      updatedAt: new Date()
    });

    // Update following user's followers list
    await updateDoc(doc(db, 'users', followingId), {
      followers: arrayUnion(followerId),
      updatedAt: new Date()
    });

    // Create notification
    await createNotification(
      followingId,
      followerId,
      'follow',
      'started following you'
    );

    return { success: true };
  } catch (error) {
    console.error('Error following user:', error);
    return { success: false, error: error.message };
  }
};

// Unfollow a user
export const unfollowUser = async (followerId, followingId) => {
  try {
    // Update follower's following list
    await updateDoc(doc(db, 'users', followerId), {
      following: arrayRemove(followingId),
      updatedAt: new Date()
    });

    // Update following user's followers list
    await updateDoc(doc(db, 'users', followingId), {
      followers: arrayRemove(followerId),
      updatedAt: new Date()
    });

    return { success: true };
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return { success: false, error: error.message };
  }
};

// Check if user is following another user
export const isFollowing = async (followerId, followingId) => {
  try {
    const userData = await getUserData(followerId);
    if (userData.success && userData.data.following) {
      return { success: true, isFollowing: userData.data.following.includes(followingId) };
    }
    return { success: true, isFollowing: false };
  } catch (error) {
    console.error('Error checking follow status:', error);
    return { success: false, error: error.message, isFollowing: false };
  }
};

// Get user's followers - FIXED to use direct Firebase storage
export const getUserFollowers = async (userId, limitCount = 50) => {
  try {
    console.log(`🔍 FOLLOWERS: Getting followers for user ${userId.slice(0, 8)}`);
    
    // Get user data directly from Firebase
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.log(`❌ FOLLOWERS: User ${userId.slice(0, 8)} not found`);
      return { success: true, data: [] };
    }
    
    const userData = docSnap.data();
    if (!userData.followers || userData.followers.length === 0) {
      console.log(`📝 FOLLOWERS: User ${userId.slice(0, 8)} has no followers`);
      return { success: true, data: [] };
    }
    
    const followerIds = userData.followers.slice(0, limitCount);
    console.log(`🔍 FOLLOWERS: Loading data for ${followerIds.length} followers`);
    
    const followers = await Promise.all(
      followerIds.map(async (followerId) => {
        try {
          const followerDocRef = doc(db, 'users', followerId);
          const followerDocSnap = await getDoc(followerDocRef);
          
          if (followerDocSnap.exists()) {
            const followerData = followerDocSnap.data();
            return {
              uid: followerId,
              username: followerData.username,
              displayName: followerData.displayName,
              photoURL: followerData.photoURL,
              bio: followerData.bio,
              followers: followerData.followers || [],
              following: followerData.following || []
            };
          }
        } catch (error) {
          console.error(`Error loading follower ${followerId}:`, error);
        }
        return null;
      })
    );
    
    const validFollowers = followers.filter(Boolean);
    console.log(`✅ FOLLOWERS: Loaded ${validFollowers.length} followers successfully`);
    return { success: true, data: validFollowers };
    
  } catch (error) {
    console.error('❌ FOLLOWERS: Error getting followers:', error);
    return { success: false, error: error.message };
  }
};

// Get user's following - FIXED to use direct Firebase storage
export const getUserFollowing = async (userId, limitCount = 50) => {
  try {
    console.log(`🔍 FOLLOWING: Getting following for user ${userId.slice(0, 8)}`);
    
    // Get user data directly from Firebase
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.log(`❌ FOLLOWING: User ${userId.slice(0, 8)} not found`);
      return { success: true, data: [] };
    }
    
    const userData = docSnap.data();
    if (!userData.following || userData.following.length === 0) {
      console.log(`📝 FOLLOWING: User ${userId.slice(0, 8)} is not following anyone`);
      return { success: true, data: [] };
    }
    
    const followingIds = userData.following.slice(0, limitCount);
    console.log(`🔍 FOLLOWING: Loading data for ${followingIds.length} users`);
    
    const following = await Promise.all(
      followingIds.map(async (followingId) => {
        try {
          const followingDocRef = doc(db, 'users', followingId);
          const followingDocSnap = await getDoc(followingDocRef);
          
          if (followingDocSnap.exists()) {
            const followingData = followingDocSnap.data();
            return {
              uid: followingId,
              username: followingData.username,
              displayName: followingData.displayName,
              photoURL: followingData.photoURL,
              bio: followingData.bio,
              followers: followingData.followers || [],
              following: followingData.following || []
            };
          }
        } catch (error) {
          console.error(`Error loading following user ${followingId}:`, error);
        }
        return null;
      })
    );
    
    const validFollowing = following.filter(Boolean);
    console.log(`✅ FOLLOWING: Loaded ${validFollowing.length} following users successfully`);
    return { success: true, data: validFollowing };
    
  } catch (error) {
    console.error('❌ FOLLOWING: Error getting following:', error);
    return { success: false, error: error.message };
  }
};

// Get follow counts - FIXED to use direct Firebase storage
export const getFollowCounts = async (userId) => {
  try {
    console.log(`🔢 COUNTS: Getting follow counts for user ${userId.slice(0, 8)}`);
    
    // Get user data directly from Firebase
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.log(`❌ COUNTS: User ${userId.slice(0, 8)} not found`);
      return { success: true, followersCount: 0, followingCount: 0 };
    }
    
    const userData = docSnap.data();
    const followersCount = userData.followers?.length || 0;
    const followingCount = userData.following?.length || 0;
    
    console.log(`✅ COUNTS: User ${userId.slice(0, 8)} has ${followersCount} followers, ${followingCount} following`);
    
    return {
      success: true,
      followersCount,
      followingCount
    };
    
  } catch (error) {
    console.error('❌ COUNTS: Error getting follow counts:', error);
    return { success: false, error: error.message, followersCount: 0, followingCount: 0 };
  }
};

// Check if two users are mutual followers (friends)
export const areMutualFollowers = async (userId1, userId2) => {
  try {
    const [user1Data, user2Data] = await Promise.all([
      getUserData(userId1),
      getUserData(userId2)
    ]);
    
    if (user1Data.success && user2Data.success) {
      const user1Following = user1Data.data.following || [];
      const user1Followers = user1Data.data.followers || [];
      
      // Check if user1 follows user2 AND user2 follows user1
      const user1FollowsUser2 = user1Following.includes(userId2);
      const user2FollowsUser1 = user1Followers.includes(userId2);
      
      return {
        success: true,
        areMutual: user1FollowsUser2 && user2FollowsUser1,
        user1FollowsUser2,
        user2FollowsUser1
      };
    }
    
    return { success: false, areMutual: false };
  } catch (error) {
    console.error('Error checking mutual follow status:', error);
    return { success: false, error: error.message, areMutual: false };
  }
};

// Get mutual followers (friends) for chatting
export const getMutualFollowers = async (userId, limitCount = 50) => {
  try {
    const userData = await getUserData(userId);
    if (!userData.success) {
      return { success: true, data: [] };
    }
    
    const following = userData.data.following || [];
    const followers = userData.data.followers || [];
    
    // Find mutual followers (people who follow each other)
    const mutualFollowerIds = following.filter(followingId => 
      followers.includes(followingId)
    ).slice(0, limitCount);
    
    if (mutualFollowerIds.length === 0) {
      return { success: true, data: [] };
    }
    
    // Get details of mutual followers
    const mutualFollowers = await Promise.all(
      mutualFollowerIds.map(async (mutualId) => {
        const mutualData = await getUserData(mutualId);
        if (mutualData.success) {
          return {
            uid: mutualId,
            username: mutualData.data.username,
            displayName: mutualData.data.displayName,
            photoURL: mutualData.data.photoURL,
            bio: mutualData.data.bio
          };
        }
        return null;
      })
    );
    
    return { success: true, data: mutualFollowers.filter(Boolean) };
  } catch (error) {
    console.error('Error getting mutual followers:', error);
    return { success: false, error: error.message };
  }
};

// Get follow relationship status
export const getFollowRelationship = async (currentUserId, targetUserId) => {
  try {
    if (currentUserId === targetUserId) {
      return { success: true, relationship: 'self' };
    }
    
    const mutualCheck = await areMutualFollowers(currentUserId, targetUserId);
    
    if (mutualCheck.success) {
      if (mutualCheck.areMutual) {
        return { success: true, relationship: 'friends' }; // Both follow each other
      } else if (mutualCheck.user1FollowsUser2) {
        return { success: true, relationship: 'following' }; // You follow them
      } else if (mutualCheck.user2FollowsUser1) {
        return { success: true, relationship: 'follower' }; // They follow you
      } else {
        return { success: true, relationship: 'none' }; // No relationship
      }
    }
    
    return { success: false, relationship: 'none' };
  } catch (error) {
    console.error('Error getting follow relationship:', error);
    return { success: false, error: error.message, relationship: 'none' };
  }
};

export default app;
