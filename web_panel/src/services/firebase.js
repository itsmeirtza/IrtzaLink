// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, orderBy, limit, arrayUnion, arrayRemove, writeBatch, deleteField } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { verifiedUsernames, isVerifiedUser } from '../config/verifiedAccounts';

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

// Auth provider
export const googleProvider = new GoogleAuthProvider();

// Helper functions
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signInWithEmail = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const signUpWithEmail = (email, password) => createUserWithEmailAndPassword(auth, email, password);
export const logout = () => signOut(auth);

// Export onAuthStateChanged for App.js
export { onAuthStateChanged } from 'firebase/auth';

// Firestore helpers
export const createUser = async (userId, userData) => {
  try {
    const userDataWithTimestamp = {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };
    await setDoc(doc(db, 'users', userId), userDataWithTimestamp, { merge: true });
    return { success: true };
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
    
    console.log(`🔍 FIXED: Getting user data for ${userId.slice(0, 8)}... (NEVER LOSE DATA!)`);
    
    // STEP 1: Try to get from permanent localStorage first (FASTEST)
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
            console.log(`💾 FIXED: Found saved data in ${key}:`, {
              username: parsed.username,
              displayName: parsed.displayName,
              hasLinks: !!parsed.socialLinks
            });
            
            // Ensure data has correct user ID
            parsed.uid = userId;
            parsed.userId = userId;
            
            return { 
              success: true, 
              data: parsed,
              source: `localStorage_${key}`
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
    
    console.log('🔥 FORCING FIREBASE SYNC - SEARCH WILL WORK!');
    
    // Validate data before saving
    const cleanedData = {
      ...userData,
      userId: userId,
      updatedAt: new Date(),
      lastSyncedAt: new Date()
    };
    
    // Remove any undefined values
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key] === undefined) {
        delete cleanedData[key];
      }
    });
    
    console.log('🔥 FORCING Firebase save for search:', {
      userId: userId.slice(0, 8),
      username: cleanedData.username,
      displayName: cleanedData.displayName
    });
    
    // 1. FORCE FIREBASE SAVE FIRST (for search to work)
    let firebaseSuccess = false;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (!firebaseSuccess && attempts < maxAttempts) {
      attempts++;
      try {
        console.log(`🔥 Firebase save attempt ${attempts}/${maxAttempts}`);
        
        // Try update first
        try {
          const docRef = doc(db, 'users', userId);
          await updateDoc(docRef, cleanedData);
          firebaseSuccess = true;
          console.log('✅ FIREBASE SUCCESS: Data updated!');
        } catch (updateError) {
          // If update fails, try setDoc
          console.log('📝 Update failed, trying setDoc...');
          const docRef = doc(db, 'users', userId);
          await setDoc(docRef, cleanedData, { merge: true });
          firebaseSuccess = true;
          console.log('✅ FIREBASE SUCCESS: Document created!');
        }
        
      } catch (firebaseError) {
        console.error(`❌ Firebase attempt ${attempts} failed:`, firebaseError.message);
        if (attempts === maxAttempts) {
          console.error('❌ ALL FIREBASE ATTEMPTS FAILED!');
        } else {
          // Wait 1 second before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // 2. Verify Firebase save worked (CRITICAL for search)
    if (firebaseSuccess) {
      try {
        console.log('🔍 Verifying Firebase data for search...');
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const savedData = docSnap.data();
          console.log('✅ FIREBASE VERIFIED - Search will find:', {
            username: savedData.username,
            displayName: savedData.displayName,
            socialLinks: !!savedData.socialLinks
          });
        }
      } catch (verifyError) {
        console.warn('⚠️ Firebase verification failed:', verifyError.message);
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
    
    if (!firebaseSuccess) {
      console.error('❌ CRITICAL: Firebase save failed - search will not work!');
      return { 
        success: false, 
        error: 'Firebase save failed - search will not work',
        firebaseSync: false
      };
    }
    
    console.log('🎉 SUCCESS: Data saved to Firebase AND localStorage!');
    console.log('🔍 Search will now work properly!');
    
    return { 
      success: true, 
      firebaseSync: firebaseSuccess,
      localStorageBackups: 5,
      message: 'Data saved successfully - search will work'
    };
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR in updateUserData:', error);
    return { success: false, error: error.message };
  }
};

export const getPublicProfile = async (username) => {
  try {
    console.log(`🔍 FIXED: Searching for public profile: ${username}`);
    
    // Try Firebase first
    const q = query(collection(db, 'users'), where('username', '==', username), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      console.log(`✅ FIXED: Found profile in Firebase:`, {
        username: userData.username,
        displayName: userData.displayName,
        hasLinks: !!userData.socialLinks
      });
      
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
          userId: userDoc.id,
          lastCached: Date.now(),
          isPublic: true
        };
        
        localStorage.setItem(`irtzalink_public_${username}`, JSON.stringify(publicData));
        localStorage.setItem(`irtzalink_public_user_${userDoc.id}`, JSON.stringify(publicData));
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
          userId: userDoc.id
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

// Storage helpers
export const uploadProfileImage = async (userId, file) => {
  try {
    const storageRef = ref(storage, `profile_pictures/${userId}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { success: false, error: error.message };
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

// Get user's followers
export const getUserFollowers = async (userId, limitCount = 50) => {
  try {
    const userData = await getUserData(userId);
    if (userData.success && userData.data.followers) {
      const followerIds = userData.data.followers.slice(0, limitCount);
      
      const followers = await Promise.all(
        followerIds.map(async (followerId) => {
          const followerData = await getUserData(followerId);
          if (followerData.success) {
            return {
              uid: followerId,
              username: followerData.data.username,
              displayName: followerData.data.displayName,
              photoURL: followerData.data.photoURL,
              bio: followerData.data.bio,
              followers: followerData.data.followers || [],
              following: followerData.data.following || []
            };
          }
          return null;
        })
      );
      
      return { success: true, data: followers.filter(Boolean) };
    }
    return { success: true, data: [] };
  } catch (error) {
    console.error('Error getting followers:', error);
    return { success: false, error: error.message };
  }
};

// Get user's following
export const getUserFollowing = async (userId, limitCount = 50) => {
  try {
    const userData = await getUserData(userId);
    if (userData.success && userData.data.following) {
      const followingIds = userData.data.following.slice(0, limitCount);
      
      const following = await Promise.all(
        followingIds.map(async (followingId) => {
          const followingData = await getUserData(followingId);
          if (followingData.success) {
            return {
              uid: followingId,
              username: followingData.data.username,
              displayName: followingData.data.displayName,
              photoURL: followingData.data.photoURL,
              bio: followingData.data.bio,
              followers: followingData.data.followers || [],
              following: followingData.data.following || []
            };
          }
          return null;
        })
      );
      
      return { success: true, data: following.filter(Boolean) };
    }
    return { success: true, data: [] };
  } catch (error) {
    console.error('Error getting following:', error);
    return { success: false, error: error.message };
  }
};

// Get follow counts
export const getFollowCounts = async (userId) => {
  try {
    const userData = await getUserData(userId);
    if (userData.success) {
      const followersCount = userData.data.followers?.length || 0;
      const followingCount = userData.data.following?.length || 0;
      
      return {
        success: true,
        followersCount,
        followingCount
      };
    }
    return { success: true, followersCount: 0, followingCount: 0 };
  } catch (error) {
    console.error('Error getting follow counts:', error);
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
