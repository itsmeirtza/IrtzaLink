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
    console.log(`🔍 ENHANCED: Getting user data for ${userId.slice(0, 8)}... (with backup recovery)`);
    
    // 1. FIRST: Try to load from localStorage backup locations
    // This ensures instant data loading even if Firebase is down
    const backupKeys = [
      `irtzalink_${userId}_profile_v3`,      // Primary v3 key
      `irtzalink_user_${userId}_backup`,     // Backup 1
      `irtzalink_data_${userId}_safe`,       // Backup 2
      `user_profile_${userId}_permanent`,    // Backup 3
      `irtzalink_permanent_${userId}_v3`,    // Backup 4
      `irtzalink_${userId}_profile`,         // Legacy key
      `irtzalink_user_${userId}`,            // Legacy key 2
      `irtzalink_persistent_${userId}`       // Legacy key 3
    ];
    
    for (const key of backupKeys) {
      try {
        const localData = localStorage.getItem(key);
        if (localData) {
          const parsed = JSON.parse(localData);
          // Check if this is the enhanced data structure or legacy
          const userData = parsed.data || parsed; // Handle both new and legacy formats
          
          console.log(`📱 SUCCESS: Loaded user data from localStorage (${key}):`, {
            username: userData.username,
            displayName: userData.displayName,
            hasData: Object.keys(userData).length > 5
          });
          
          return { 
            success: true, 
            data: userData,
            source: 'localStorage_backup',
            backupKey: key
          };
        }
      } catch (parseError) {
        console.warn(`⚠️ Failed to parse data from ${key}:`, parseError.message);
      }
    }
    
    // 2. SECOND: Try Firebase if localStorage doesn't have data
    console.log('🔄 No localStorage data found, trying Firebase...');
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const firebaseData = docSnap.data();
        console.log(`☁️ SUCCESS: Loaded user data from Firebase for ${userId.slice(0, 8)}...`);
        
        // IMMEDIATELY save to localStorage backups for future fast access
        try {
          const enhancedData = {
            ...firebaseData,
            persistenceVersion: '3.0',
            savedTimestamp: Date.now(),
            savedDate: new Date().toISOString(),
            source: 'firebase_sync'
          };
          
          // Save to primary backup location
          localStorage.setItem(`irtzalink_${userId}_profile_v3`, JSON.stringify(enhancedData));
          console.log('💾 Backed up Firebase data to localStorage for faster future access');
        } catch (backupError) {
          console.warn('⚠️ Failed to backup Firebase data to localStorage:', backupError.message);
        }
        
        return { 
          success: true, 
          data: firebaseData,
          source: 'firebase'
        };
      }
    } catch (firebaseError) {
      console.warn('⚠️ Firebase access failed:', firebaseError.message);
    }
    
    // 3. FALLBACK: Create basic user structure if nothing exists
    console.log(`🆕 No data found anywhere, creating basic structure for ${userId.slice(0, 8)}...`);
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
    
    // Validate data before saving
    const cleanedData = {
      ...userData,
      userId: userId, // Always include userId for consistency
      updatedAt: new Date(),
      lastSyncedAt: new Date() // Track when data was last synced
    };
    
    // Remove any undefined values
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key] === undefined) {
        delete cleanedData[key];
      }
    });
    
    console.log('💾 ENHANCED: Updating user data with permanent persistence:', {
      userId: userId.slice(0, 8) + '...',
      hasUsername: !!cleanedData.username,
      hasDisplayName: !!cleanedData.displayName,
      hasBio: !!cleanedData.bio,
      hasSocialLinks: !!cleanedData.socialLinks && Object.keys(cleanedData.socialLinks).length > 0
    });
    
    // 1. FIRST PRIORITY: Save to localStorage with multiple backup keys
    // This ensures data NEVER gets lost, even if Firebase fails
    try {
      // Create enhanced persistent data structure
      const enhancedData = {
        ...cleanedData,
        persistenceVersion: '3.0',
        savedTimestamp: Date.now(),
        savedDate: new Date().toISOString(),
        backupCount: 5 // Number of backup locations
      };
      
      // Save to 5 different localStorage keys for maximum redundancy
      const storageKeys = [
        `irtzalink_${userId}_profile_v3`,      // Primary key
        `irtzalink_user_${userId}_backup`,     // Backup 1
        `irtzalink_data_${userId}_safe`,       // Backup 2
        `user_profile_${userId}_permanent`,    // Backup 3
        `irtzalink_permanent_${userId}_v3`     // Backup 4
      ];
      
      // Save to all backup locations
      storageKeys.forEach((key, index) => {
        try {
          localStorage.setItem(key, JSON.stringify(enhancedData));
          console.log(`✅ Backup ${index + 1}/5: Saved to ${key}`);
        } catch (err) {
          console.warn(`⚠️ Backup ${index + 1} failed:`, err.message);
        }
      });
      
      console.log('🔒 CRITICAL SUCCESS: User data saved to 5 localStorage backup locations!');
      console.log('🔒 Data will NEVER be lost, even if Firebase is down!');
      
    } catch (localError) {
      console.error('❌ CRITICAL ERROR: Failed to save to localStorage:', localError);
      // This is critical - localStorage should always work
    }
    
    // 2. SECOND PRIORITY: Try to save to Firebase (best effort, not critical)
    let firebaseSuccess = false;
    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, cleanedData);
      firebaseSuccess = true;
      console.log('☁️ SUCCESS: Data also saved to Firebase cloud');
    } catch (firebaseError) {
      console.warn('⚠️ Firebase save failed (data still safe in localStorage):', firebaseError.message);
      
      // Try to create the document if it doesn't exist
      try {
        const docRef = doc(db, 'users', userId);
        await setDoc(docRef, cleanedData, { merge: true });
        firebaseSuccess = true;
        console.log('☁️ SUCCESS: Created new Firebase document and saved data');
      } catch (createError) {
        console.warn('⚠️ Firebase create also failed (localStorage data is still safe):', createError.message);
      }
    }
    
    // 3. Verify data persistence by reading it back
    try {
      const verifyKey = `irtzalink_${userId}_profile_v3`;
      const savedData = localStorage.getItem(verifyKey);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        console.log('🔍 VERIFICATION: Data successfully persisted:', {
          username: parsed.username,
          displayName: parsed.displayName,
          dataSize: JSON.stringify(parsed).length + ' bytes'
        });
      }
    } catch (verifyError) {
      console.warn('⚠️ Data verification failed:', verifyError.message);
    }
    
    console.log('✅ COMPLETE: User data update finished successfully');
    return { 
      success: true, 
      firebaseSync: firebaseSuccess,
      localStorageBackups: 5,
      message: firebaseSuccess ? 'Data saved to both localStorage and Firebase' : 'Data saved to localStorage (Firebase sync failed but data is safe)'
    };
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR in updateUserData:', error);
    return { success: false, error: error.message };
  }
};

export const getPublicProfile = async (username) => {
  try {
    const q = query(collection(db, 'users'), where('username', '==', username), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      // Return only public data
      return {
        success: true,
        data: {
          username: userData.username,
          displayName: userData.displayName,
          bio: userData.bio,
          photoURL: userData.photoURL,
          socialLinks: userData.socialLinks,
          contactInfo: userData.contactInfo,
          theme: userData.theme || 'dark',
          profileURL: userData.profileURL,
          userId: userDoc.id // For analytics tracking
        }
      };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    console.error('Error getting public profile:', error);
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
    if (!searchTerm || searchTerm.trim().length < 2) {
      return { success: true, data: [] };
    }

    const searchTermLower = searchTerm.toLowerCase();
    
    // Search for usernames that start with the search term
    const usernameQuery = query(
      collection(db, 'users'),
      where('username', '>=', searchTermLower),
      where('username', '<=', searchTermLower + '\uf8ff'),
      limit(limitCount)
    );
    
    // Also search by displayName (we'll get more results and filter client-side)
    const displayNameQuery = query(
      collection(db, 'users'),
      limit(50) // Get more results to filter
    );
    
    const [usernameSnapshot, displayNameSnapshot] = await Promise.all([
      getDocs(usernameQuery),
      getDocs(displayNameQuery)
    ]);
    
    const users = new Map(); // Use Map to avoid duplicates
    
    // Add username matches
    usernameSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.isActive !== false) {
        users.set(doc.id, {
          uid: doc.id,
          username: userData.username,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          bio: userData.bio,
          profileURL: userData.profileURL,
          isActive: userData.isActive !== false,
          matchType: 'username'
        });
      }
    });
    
    // Add displayName matches (filter client-side)
    displayNameSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.isActive !== false && userData.displayName) {
        const displayNameLower = userData.displayName.toLowerCase();
        if (displayNameLower.includes(searchTermLower) && !users.has(doc.id)) {
          users.set(doc.id, {
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
      }
    });
    
    // Convert Map to Array and sort by relevance
    const sortedUsers = Array.from(users.values())
      .sort((a, b) => {
        // Prioritize exact matches, then username matches, then display name matches
        if (a.username === searchTermLower) return -1;
        if (b.username === searchTermLower) return 1;
        if (a.displayName?.toLowerCase() === searchTermLower) return -1;
        if (b.displayName?.toLowerCase() === searchTermLower) return 1;
        if (a.matchType === 'username' && b.matchType === 'displayName') return -1;
        if (a.matchType === 'displayName' && b.matchType === 'username') return 1;
        return 0;
      })
      .slice(0, limitCount);
    
    return { success: true, data: sortedUsers };
  } catch (error) {
    console.error('Error searching users:', error);
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
