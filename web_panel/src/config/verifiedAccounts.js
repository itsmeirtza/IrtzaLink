// Verified Accounts Configuration
// Add usernames here to make them verified (with blue tick)
// Simply add the username to the array below

export const verifiedUsernames = [
  'ialiwaris',
  'itsmeirtza',
  'hakeemmuhammadnawaz',
  // Add more verified usernames here
  // Example: 'newusername',
];

// Function to check if a username is verified
export const isVerifiedUser = (username) => {
  if (!username) return false;
  return verifiedUsernames.includes(username.toLowerCase());
};

// Function to get all verified usernames (for admin purposes)
export const getVerifiedUsernames = () => {
  return [...verifiedUsernames];
};

// Function to add a verified username (you can use this in admin panel later)
export const addVerifiedUsername = (username) => {
  if (!username) return false;
  const lowerUsername = username.toLowerCase();
  if (!verifiedUsernames.includes(lowerUsername)) {
    verifiedUsernames.push(lowerUsername);
    return true;
  }
  return false;
};

// Function to remove a verified username (you can use this in admin panel later)
export const removeVerifiedUsername = (username) => {
  if (!username) return false;
  const lowerUsername = username.toLowerCase();
  const index = verifiedUsernames.indexOf(lowerUsername);
  if (index > -1) {
    verifiedUsernames.splice(index, 1);
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
  allowedOneTimeChangeEmails,
  canChangeUsernameOneTime,
  removeFromOneTimeChange
};
