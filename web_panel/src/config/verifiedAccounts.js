// Verified Accounts Configuration
// Add usernames here to make them verified (with blue tick)
// Simply add the username to the array below

export const verifiedUsernames = [
  'ialiwaris',
  'itsmeirtza',
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

export default {
  verifiedUsernames,
  isVerifiedUser,
  getVerifiedUsernames,
  addVerifiedUsername,
  removeVerifiedUsername
};