// Verified Accounts Configuration
// Add usernames here to make them verified (with blue tick)
// Simply add the username to the array below

// Base verified usernames (permanently verified)
const baseVerifiedUsernames = [
  'ialiwaris',
  'itsmeirtza', 
  'hakeemmuhammadnawaz',
  'hellojuttsab', // Added your username
];

// Function to load custom verified users from localStorage
const loadCustomVerifiedUsers = () => {
  try {
    const customVerified = JSON.parse(localStorage.getItem('customVerifiedUsers') || '[]');
    return customVerified.filter(username => username && typeof username === 'string');
  } catch (error) {
    console.error('Error loading custom verified users:', error);
    return [];
  }
};

// Combine base and custom verified users
export const verifiedUsernames = [...baseVerifiedUsernames, ...loadCustomVerifiedUsers()];

// Function to refresh verified usernames list
export const refreshVerifiedUsers = () => {
  const customUsers = loadCustomVerifiedUsers();
  verifiedUsernames.length = 0; // Clear array
  verifiedUsernames.push(...baseVerifiedUsernames, ...customUsers);
  console.log('🔄 Refreshed verified users list:', verifiedUsernames);
  return verifiedUsernames;
};

// Function to check if a username is verified
export const isVerifiedUser = (username) => {
  if (!username) return false;
  
  // Always check fresh list to include newly added users
  const currentVerified = [...baseVerifiedUsernames, ...loadCustomVerifiedUsers()];
  return currentVerified.includes(username.toLowerCase());
};

// Function to get all verified usernames (for admin purposes)
export const getVerifiedUsernames = () => {
  return [...verifiedUsernames];
};

// Function to add a verified username (Admin panel use)
export const addVerifiedUsername = (username) => {
  if (!username) return false;
  const lowerUsername = username.toLowerCase().trim();
  if (!verifiedUsernames.includes(lowerUsername)) {
    verifiedUsernames.push(lowerUsername);
    console.log('✅ Added verified username:', lowerUsername);
    console.log('📝 Current verified users:', verifiedUsernames);
    
    // Save to localStorage for persistence across sessions
    try {
      const customVerified = JSON.parse(localStorage.getItem('customVerifiedUsers') || '[]');
      if (!customVerified.includes(lowerUsername)) {
        customVerified.push(lowerUsername);
        localStorage.setItem('customVerifiedUsers', JSON.stringify(customVerified));
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
    
    return true;
  }
  return false;
};

// Function to remove a verified username (Admin panel use)
export const removeVerifiedUsername = (username) => {
  if (!username) return false;
  const lowerUsername = username.toLowerCase().trim();
  const index = verifiedUsernames.indexOf(lowerUsername);
  if (index > -1) {
    verifiedUsernames.splice(index, 1);
    console.log('❌ Removed verified username:', lowerUsername);
    console.log('📝 Current verified users:', verifiedUsernames);
    
    // Remove from localStorage
    try {
      const customVerified = JSON.parse(localStorage.getItem('customVerifiedUsers') || '[]');
      const customIndex = customVerified.indexOf(lowerUsername);
      if (customIndex > -1) {
        customVerified.splice(customIndex, 1);
        localStorage.setItem('customVerifiedUsers', JSON.stringify(customVerified));
      }
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
    
    return true;
  }
  return false;
};

// Special one-time username change permission for specific users
export const allowedOneTimeChangeEmails = [
  'irtzaaliwaris@gmail.com',
  'irtzajutt2005@gmail.com'
];

// Function to check if user can change username one more time
export const canChangeUsernameOneTime = (userEmail) => {
  if (!userEmail) return false;
  return allowedOneTimeChangeEmails.includes(userEmail.toLowerCase());
};

// Function to remove email from one-time change list (after they use it)
export const removeFromOneTimeChange = (userEmail) => {
  if (!userEmail) return false;
  const lowerEmail = userEmail.toLowerCase();
  const index = allowedOneTimeChangeEmails.indexOf(lowerEmail);
  if (index > -1) {
    allowedOneTimeChangeEmails.splice(index, 1);
    return true;
  }
  return false;
};

export default {
  verifiedUsernames,
  isVerifiedUser,
  getVerifiedUsernames,
  addVerifiedUsername,
  removeVerifiedUsername,
  refreshVerifiedUsers,
  allowedOneTimeChangeEmails,
  canChangeUsernameOneTime,
  removeFromOneTimeChange
};
