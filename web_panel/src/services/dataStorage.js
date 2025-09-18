/**
 * SIMPLE DATA STORAGE SYSTEM
 * Firebase ONLY - No complex caching, No localStorage mess
 * Simple, clean, and GUARANTEED TO WORK!
 */

import { 
  db, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  limit 
} from './firebase';

// SIMPLE: Get user data by ID
export const getUserData = async (userId) => {
  try {
    if (!userId) {
      return { success: false, error: 'User ID required' };
    }

    console.log(`🔍 SIMPLE: Getting data for ${userId.slice(0, 8)}...`);
    
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const userData = docSnap.data();
      userData.uid = userId;
      userData.userId = userId;
      
      console.log(`✅ SIMPLE: Found user data:`, {
        username: userData.username,
        displayName: userData.displayName,
        hasLinks: !!userData.socialLinks
      });
      
      return { success: true, data: userData };
    } else {
      console.log(`❌ SIMPLE: User not found: ${userId.slice(0, 8)}`);
      return { success: false, error: 'User not found' };
    }
    
  } catch (error) {
    console.error('❌ SIMPLE: Error getting user data:', error);
    return { success: false, error: error.message };
  }
};

// SIMPLE: Save user data 
export const saveUserData = async (userId, userData) => {
  try {
    if (!userId || !userData) {
      return { success: false, error: 'Missing data' };
    }

    console.log(`💾 SIMPLE: Saving data for ${userId.slice(0, 8)}...`);
    
    const enhancedData = {
      ...userData,
      userId,
      updatedAt: new Date(),
      lastSaved: Date.now()
    };

    const docRef = doc(db, 'users', userId);
    
    // Try update first, then create if needed
    try {
      await updateDoc(docRef, enhancedData);
      console.log(`✅ SIMPLE: Data updated successfully`);
    } catch (updateError) {
      await setDoc(docRef, enhancedData, { merge: true });
      console.log(`✅ SIMPLE: Data created successfully`);
    }
    
    // Verify save worked
    const verifyDoc = await getDoc(docRef);
    if (verifyDoc.exists()) {
      const savedData = verifyDoc.data();
      console.log(`🔍 SIMPLE: VERIFIED save successful:`, {
        username: savedData.username,
        displayName: savedData.displayName
      });
      
      return { success: true, message: 'Data saved successfully' };
    } else {
      throw new Error('Verification failed - data not found after save');
    }
    
  } catch (error) {
    console.error('❌ SIMPLE: Save error:', error);
    return { success: false, error: error.message };
  }
};

// SIMPLE: Get public profile by username
export const getPublicProfile = async (username) => {
  try {
    if (!username) {
      return { success: false, error: 'Username required' };
    }

    console.log(`🌐 SIMPLE: Getting public profile for @${username}`);
    
    const q = query(
      collection(db, 'users'),
      where('username', '==', username.toLowerCase()),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      console.log(`✅ SIMPLE: Found public profile:`, {
        username: userData.username,
        displayName: userData.displayName,
        hasLinks: !!userData.socialLinks
      });
      
      // Return only public data
      const publicData = {
        username: userData.username,
        displayName: userData.displayName,
        bio: userData.bio,
        photoURL: userData.photoURL,
        socialLinks: userData.socialLinks || {},
        contactInfo: userData.contactInfo || {},
        theme: userData.theme || 'dark',
        profileURL: userData.profileURL,
        userId: userDoc.id
      };
      
      return { success: true, data: publicData };
    } else {
      console.log(`❌ SIMPLE: Public profile not found for @${username}`);
      return { success: false, error: 'Profile not found' };
    }
    
  } catch (error) {
    console.error('❌ SIMPLE: Error getting public profile:', error);
    return { success: false, error: error.message };
  }
};

// SIMPLE: Search users by username
export const searchUsers = async (searchTerm) => {
  try {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return { success: true, data: [] };
    }

    console.log(`🔍 SIMPLE: Searching for "${searchTerm}"`);
    
    const searchLower = searchTerm.toLowerCase();
    
    // Search by username
    const q = query(
      collection(db, 'users'),
      where('username', '>=', searchLower),
      where('username', '<=', searchLower + '\uf8ff'),
      limit(10)
    );
    
    const querySnapshot = await getDocs(q);
    const results = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.isActive !== false && userData.username) {
        results.push({
          uid: doc.id,
          username: userData.username,
          displayName: userData.displayName || userData.username,
          photoURL: userData.photoURL,
          bio: userData.bio,
          isActive: true
        });
      }
    });
    
    console.log(`✅ SIMPLE: Found ${results.length} users for "${searchTerm}"`);
    return { success: true, data: results };
    
  } catch (error) {
    console.error('❌ SIMPLE: Search error:', error);
    return { success: false, error: error.message };
  }
};

// SIMPLE: Clear user session (for logout) - does NOTHING to data
export const clearUserData = (userId) => {
  console.log(`🚪 SIMPLE: User ${userId.slice(0, 8)} logged out - data remains in Firebase`);
  console.log(`✅ SIMPLE: Public profiles will continue to work for other users`);
};

export default {
  getUserData,
  saveUserData,
  getPublicProfile,
  searchUsers,
  clearUserData
};