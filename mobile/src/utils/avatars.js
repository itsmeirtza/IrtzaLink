// Default emoji avatars for users
const defaultAvatars = {
  male: [
    '👨', '🧑', '👨‍💻', '👨‍💼', '👨‍🎓', '👨‍🚀', '🧔', '👨‍🦱', 
    '👨‍🦲', '👨‍🦳', '👱‍♂️', '🧑‍🦰', '👨‍🦰', '🤵', '👨‍🔧'
  ],
  female: [
    '👩', '🧑‍🦱', '👩‍💻', '👩‍💼', '👩‍🎓', '👩‍🚀', '👩‍🦲', '👩‍🦳', 
    '👱‍♀️', '🧑‍🦰', '👩‍🦰', '👰', '👩‍🔬', '👩‍⚕️', '👩‍🎨'
  ],
  neutral: [
    '😊', '😎', '🤗', '🥳', '🤔', '😇', '🙂', '😌', '🤓', '😋',
    '🐱', '🐶', '🦊', '🐼', '🐨', '🦁', '🐯', '🐸', '🐙', '⭐'
  ]
};

// Generate random avatar from category
export const getRandomAvatar = (gender = 'neutral') => {
  const avatars = defaultAvatars[gender] || defaultAvatars.neutral;
  const randomIndex = Math.floor(Math.random() * avatars.length);
  return avatars[randomIndex];
};

// Get all avatars for selection
export const getAllAvatars = () => {
  return {
    male: defaultAvatars.male,
    female: defaultAvatars.female,
    neutral: defaultAvatars.neutral
  };
};

// Convert emoji to image URL for better display
export const emojiToImageUrl = (emoji) => {
  if (!emoji) return null;
  
  // Create a canvas to convert emoji to data URL
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 128;
  canvas.height = 128;
  
  // Set font size and center the emoji
  ctx.font = '96px Apple Color Emoji, Segoe UI Emoji, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Clear background
  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, 128, 128);
  
  // Draw emoji
  ctx.fillText(emoji, 64, 64);
  
  return canvas.toDataURL();
};

// Create avatar URL from emoji or fallback
export const createAvatarUrl = (user, selectedEmoji = null) => {
  if (selectedEmoji) {
    return emojiToImageUrl(selectedEmoji);
  }
  
  if (user.photoURL) {
    return user.photoURL;
  }
  
  // Generate initials-based avatar as fallback
  const name = user.displayName || user.email || 'User';
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
  
  const colors = [
    '3b82f6', 'ef4444', '10b981', 'f59e0b', '8b5cf6', 
    'ec4899', '06b6d4', 'f97316', '84cc16', '6366f1'
  ];
  
  const colorIndex = name.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bgColor}&color=ffffff&size=128&font-size=0.6&bold=true&format=png`;
};

// Default user data structure
export const getDefaultUserData = (authUser, selectedGender = 'neutral', selectedAvatar = null) => {
  const avatar = selectedAvatar || getRandomAvatar(selectedGender);
  
  return {
    email: authUser.email,
    displayName: authUser.displayName || authUser.email.split('@')[0],
    photoURL: authUser.photoURL || emojiToImageUrl(avatar),
    avatarEmoji: avatar,
    username: '',
    bio: '',
    theme: 'dark',
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
      tiktok: '',
      youtube: '',
      linkedin: '',
      snapchat: '',
      pinterest: '',
      discord: '',
      twitch: ''
    },
    contactInfo: {
      phone: '',
      email: authUser.email,
      website: ''
    },
    qrCodeURL: '',
    profileURL: '',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

const avatarUtils = {
  getRandomAvatar,
  getAllAvatars,
  emojiToImageUrl,
  createAvatarUrl,
  getDefaultUserData
};

export default avatarUtils;

// Avatar utility functions for default profile pictures

// Default avatar options
const avatarStyles = {
  male: [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=male1&backgroundColor=3b82f6&clothing=hoodie&top=shortWaved',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=male2&backgroundColor=10b981&clothing=shirt&top=shortCurly',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=male3&backgroundColor=f59e0b&clothing=overall&top=shortFlat',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=male4&backgroundColor=8b5cf6&clothing=collarSweater&top=shortStraight',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=male5&backgroundColor=ef4444&clothing=graphicShirt&top=shortRound'
  ],
  female: [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=female1&backgroundColor=ec4899&clothing=overall&top=longStraight',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=female2&backgroundColor=6366f1&clothing=dress&top=longCurly',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=female3&backgroundColor=14b8a6&clothing=shirt&top=longWaved',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=female4&backgroundColor=f97316&clothing=hoodie&top=bob',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=female5&backgroundColor=84cc16&clothing=collarSweater&top=bun'
  ]
};

// Emoji avatars as backup
const emojiAvatars = {
  male: ['👨‍💼', '👨‍💻', '👨‍🎓', '👨‍🏫', '👨‍🎨', '👨‍🔬', '👨‍⚕️', '👨‍🚀', '🧔', '👨'],
  female: ['👩‍💼', '👩‍💻', '👩‍🎓', '👩‍🏫', '👩‍🎨', '👩‍🔬', '👩‍⚕️', '👩‍🚀', '👩‍🦰', '👩']
};

// Get random avatar based on user preference or name
export const getDefaultAvatar = (name = 'User', gender = null, index = null) => {
  // If no gender specified, guess from name or use random
  let avatarGender = gender;
  if (!avatarGender) {
    const femaleNames = ['sara', 'maria', 'ayesha', 'fatima', 'zara', 'sana', 'hina', 'nida'];
    const nameCheck = name.toLowerCase();
    avatarGender = femaleNames.some(n => nameCheck.includes(n)) ? 'female' : 'male';
  }

  // Use specific index or random
  const avatarIndex = index !== null ? index : Math.floor(Math.random() * 5);
  
  // Return SVG avatar URL
  return avatarStyles[avatarGender][avatarIndex];
};

// Get emoji avatar
export const getEmojiAvatar = (name = 'User', gender = null) => {
  let avatarGender = gender || (Math.random() > 0.5 ? 'female' : 'male');
  const index = Math.floor(Math.random() * emojiAvatars[avatarGender].length);
  return emojiAvatars[avatarGender][index];
};

// Generate UI Avatars as fallback
export const getUIAvatar = (name, backgroundColor = '3b82f6') => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${backgroundColor}&color=ffffff&size=200&rounded=true&bold=true`;
};

// Get combined avatar (tries different methods)
export const getProfileAvatar = (user) => {
  // If user has uploaded photo, use that
  if (user.photoURL && !user.photoURL.includes('ui-avatars.com')) {
    return user.photoURL;
  }

  // Use default avatar based on name/email
  const name = user.displayName || user.email?.split('@')[0] || 'User';
  
  // Return default SVG avatar
  return getDefaultAvatar(name);
};