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

// Unified Friend System Functions
export const sendFriendRequestNew = async (senderId, receiverId) => {
  try {
    // Check if they're already friends
    const [senderResult, receiverResult] = await Promise.all([
      getUserData(senderId),
      getUserData(receiverId)
    ]);
    
    if (!senderResult.success || !receiverResult.success) {
      throw new Error('Failed to get user data');
    }
    
    const senderData = senderResult.data;
    const receiverData = receiverResult.data;
    
    // Check if already friends
    if (senderData.friends?.includes(receiverId)) {
      return { success: false, error: 'Already friends with this user' };
    }
    
    // Check if request already sent
    if (receiverData.friendRequests?.includes(senderId)) {
      return { success: false, error: 'Friend request already sent' };
    }
    
    // Check if there's a reverse request (they sent us a request)
    if (senderData.friendRequests?.includes(receiverId)) {
      // Auto-accept the existing request and become friends
      await Promise.all([
        updateDoc(doc(db, 'users', senderId), {
          friendRequests: arrayRemove(receiverId),
          friends: arrayUnion(receiverId),
          updatedAt: new Date()
        }),
        updateDoc(doc(db, 'users', receiverId), {
          sentFriendRequests: arrayRemove(senderId),
          friends: arrayUnion(senderId),
          updatedAt: new Date()
        })
      ]);
      
      // Create friend notifications for both users
      await Promise.all([
        createNotification(
          receiverId,
          senderId,
          'friend_accepted',
          'accepted your friend request'
        ),
        createNotification(
          senderId,
          receiverId,
          'friend_accepted',
          'You are now friends'
        )
      ]);
      
      return { success: true, becameFriends: true };
    }
    
    // Send new friend request
    await Promise.all([
      updateDoc(doc(db, 'users', receiverId), {
        friendRequests: arrayUnion(senderId),
        updatedAt: new Date()
      }),
      updateDoc(doc(db, 'users', senderId), {
        sentFriendRequests: arrayUnion(receiverId),
        updatedAt: new Date()
      })
    ]);
    
    // Create notification
    await createNotification(
      receiverId,
      senderId,
      'friend_request',
      'sent you a friend request'
    );
    
    return { success: true, requestSent: true };
  } catch (error) {
    console.error('Error sending friend request:', error);
    return { success: false, error: error.message };
  }
};

export const removeFriend = async (currentUserId, friendId) => {
  try {
    // Remove from both users' friends list
    await Promise.all([
      updateDoc(doc(db, 'users', currentUserId), {
        friends: arrayRemove(friendId),
        updatedAt: new Date()
      }),
      updateDoc(doc(db, 'users', friendId), {
        friends: arrayRemove(currentUserId),
        updatedAt: new Date()
      })
    ]);
    
    return { success: true };
  } catch (error) {
    console.error('Error removing friend:', error);
    return { success: false, error: error.message };
  }
};

// Get user's relationship status with another user
export const getUserRelationshipStatus = async (currentUserId, targetUserId) => {
  try {
    const [currentUserResult, targetUserResult] = await Promise.all([
      getUserData(currentUserId),
      getUserData(targetUserId)
    ]);
    
    if (!currentUserResult.success || !targetUserResult.success) {
      return { success: false, error: 'Failed to get user data' };
    }
    
    const currentUserData = currentUserResult.data;
    const targetUserData = targetUserResult.data;
    
    // Check various relationship statuses
    const areFriends = currentUserData.friends?.includes(targetUserId) || false;
    const sentRequest = currentUserData.sentFriendRequests?.includes(targetUserId) || false;
    const receivedRequest = currentUserData.friendRequests?.includes(targetUserId) || false;
    
    return {
      success: true,
      status: {
        areFriends,
        sentRequest,
        receivedRequest,
        canSendRequest: !areFriends && !sentRequest && !receivedRequest
      }
    };
  } catch (error) {
    console.error('Error getting relationship status:', error);
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
              bio: followerData.data.bio
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
              bio: followingData.data.bio
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
