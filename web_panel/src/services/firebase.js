// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, orderBy, limit, arrayUnion, arrayRemove } from 'firebase/firestore';
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
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    console.error('Error getting user data:', error);
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
      updatedAt: new Date()
    };
    
    // Remove any undefined values
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key] === undefined) {
        delete cleanedData[key];
      }
    });
    
    console.log('Updating user data:', cleanedData);
    
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, cleanedData);
    
    console.log('User data updated successfully');
    return { success: true };
  } catch (error) {
    console.error('Error updating user data:', error);
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

// Social Features

// Follow/Unfollow functions
export const followUser = async (currentUserId, targetUserId) => {
  try {
    // Get both users' data to check if they're already following each other
    const [currentUserResult, targetUserResult] = await Promise.all([
      getUserData(currentUserId),
      getUserData(targetUserId)
    ]);
    
    if (!currentUserResult.success || !targetUserResult.success) {
      throw new Error('Failed to get user data');
    }
    
    const currentUserData = currentUserResult.data;
    const targetUserData = targetUserResult.data;
    
    // Check if target user is already following current user (for mutual follow = friends)
    const targetFollowsCurrent = targetUserData.following?.includes(currentUserId) || false;
    
    // Check if users are verified (should auto follow back)
    const isCurrentUserVerified = isVerifiedUser(currentUserData.username);
    const isTargetUserVerified = isVerifiedUser(targetUserData.username);
    
    // Add targetUser to currentUser's following list
    await updateDoc(doc(db, 'users', currentUserId), {
      following: arrayUnion(targetUserId),
      updatedAt: new Date()
    });
    
    // Add currentUser to targetUser's followers list
    await updateDoc(doc(db, 'users', targetUserId), {
      followers: arrayUnion(currentUserId),
      updatedAt: new Date()
    });
    
    // Auto follow back if target user is verified
    if (isTargetUserVerified && !targetFollowsCurrent) {
      try {
        // Target user automatically follows back current user
        await updateDoc(doc(db, 'users', targetUserId), {
          following: arrayUnion(currentUserId),
          updatedAt: new Date()
        });
        
        // Add target user to current user's followers list
        await updateDoc(doc(db, 'users', currentUserId), {
          followers: arrayUnion(targetUserId),
          updatedAt: new Date()
        });
        
        // Since they're now mutual followers, make them friends
        await Promise.all([
          updateDoc(doc(db, 'users', currentUserId), {
            friends: arrayUnion(targetUserId),
            updatedAt: new Date()
          }),
          updateDoc(doc(db, 'users', targetUserId), {
            friends: arrayUnion(currentUserId),
            updatedAt: new Date()
          })
        ]);
        
        // Create follow back notification
        await createNotification(
          currentUserId,
          targetUserId,
          'follow',
          'followed you back'
        );
        
        // Mark as friends in return value
        targetFollowsCurrent = true;
      } catch (error) {
        console.error('Error with auto follow back:', error);
      }
    }
    
    // If they're now mutual followers, add them as friends
    if (targetFollowsCurrent) {
      await Promise.all([
        updateDoc(doc(db, 'users', currentUserId), {
          friends: arrayUnion(targetUserId),
          updatedAt: new Date()
        }),
        updateDoc(doc(db, 'users', targetUserId), {
          friends: arrayUnion(currentUserId),
          updatedAt: new Date()
        })
      ]);
      
      // Create friend notification for both users
      await Promise.all([
        createNotification(
          targetUserId,
          currentUserId,
          'friend',
          'You are now friends'
        ),
        createNotification(
          currentUserId,
          targetUserId,
          'friend',
          'You are now friends'
        )
      ]);
    } else {
      // Create follow notification
      await createNotification(
        targetUserId,
        currentUserId,
        'follow',
        'started following you'
      );
    }
    
    return { success: true, areFriends: targetFollowsCurrent };
  } catch (error) {
    console.error('Error following user:', error);
    return { success: false, error: error.message };
  }
};

export const unfollowUser = async (currentUserId, targetUserId) => {
  try {
    // Get both users' data to check if they were friends
    const [currentUserResult, targetUserResult] = await Promise.all([
      getUserData(currentUserId),
      getUserData(targetUserId)
    ]);
    
    if (!currentUserResult.success || !targetUserResult.success) {
      throw new Error('Failed to get user data');
    }
    
    const currentUserData = currentUserResult.data;
    const targetUserData = targetUserResult.data;
    
    // Check if they were friends (both following each other)
    const wereFriends = currentUserData.friends?.includes(targetUserId) || 
                       (currentUserData.following?.includes(targetUserId) && 
                        targetUserData.following?.includes(currentUserId));
    
    // Remove targetUser from currentUser's following list
    await updateDoc(doc(db, 'users', currentUserId), {
      following: arrayRemove(targetUserId),
      updatedAt: new Date()
    });
    
    // Remove currentUser from targetUser's followers list
    await updateDoc(doc(db, 'users', targetUserId), {
      followers: arrayRemove(currentUserId),
      updatedAt: new Date()
    });
    
    // If they were friends, remove from friends list
    if (wereFriends) {
      await Promise.all([
        updateDoc(doc(db, 'users', currentUserId), {
          friends: arrayRemove(targetUserId),
          updatedAt: new Date()
        }),
        updateDoc(doc(db, 'users', targetUserId), {
          friends: arrayRemove(currentUserId),
          updatedAt: new Date()
        })
      ]);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return { success: false, error: error.message };
  }
};

// Friend request functions
export const sendFriendRequest = async (senderId, receiverId) => {
  try {
    // Add to receiver's friend requests
    await updateDoc(doc(db, 'users', receiverId), {
      friendRequests: arrayUnion(senderId),
      updatedAt: new Date()
    });
    
    // Add to sender's sent requests (optional, for tracking)
    await updateDoc(doc(db, 'users', senderId), {
      sentFriendRequests: arrayUnion(receiverId),
      updatedAt: new Date()
    });
    
    // Create notification
    await createNotification(
      receiverId,
      senderId,
      'friend_request',
      'sent you a friend request'
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error sending friend request:', error);
    return { success: false, error: error.message };
  }
};

export const acceptFriendRequest = async (currentUserId, requesterId) => {
  try {
    // Remove from friend requests
    await updateDoc(doc(db, 'users', currentUserId), {
      friendRequests: arrayRemove(requesterId),
      friends: arrayUnion(requesterId),
      updatedAt: new Date()
    });
    
    // Add to requester's friends list
    await updateDoc(doc(db, 'users', requesterId), {
      sentFriendRequests: arrayRemove(currentUserId),
      friends: arrayUnion(currentUserId),
      updatedAt: new Date()
    });
    
    // Create notification
    await createNotification(
      requesterId,
      currentUserId,
      'friend_accepted',
      'accepted your friend request'
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return { success: false, error: error.message };
  }
};

export const rejectFriendRequest = async (currentUserId, requesterId) => {
  try {
    // Remove from friend requests
    await updateDoc(doc(db, 'users', currentUserId), {
      friendRequests: arrayRemove(requesterId),
      updatedAt: new Date()
    });
    
    // Remove from requester's sent requests
    await updateDoc(doc(db, 'users', requesterId), {
      sentFriendRequests: arrayRemove(currentUserId),
      updatedAt: new Date()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return { success: false, error: error.message };
  }
};

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

export default app;
