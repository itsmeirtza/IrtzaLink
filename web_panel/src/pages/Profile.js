import React, { useState, useEffect } from 'react';
import { getUserData, updateUserData, uploadProfileImage, generateQRCode, checkUsernameAvailabilityLocal, reserveUsernameLocal } from '../services/firebase';
import { loadUserDataPermanently, updateUserDataPermanently } from '../services/permanentStorage';
import { socialPlatforms } from '../utils/socialIcons';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import VerifiedBadge from '../components/VerifiedBadge';
import QRCode from 'react-qr-code';
import { 
  PhotoIcon, 
  LinkIcon,
  CheckCircleIcon,
  XCircleIcon,
  QrCodeIcon,
  ShareIcon
} from '@heroicons/react/24/outline';

const Profile = ({ user }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [generatingQR, setGeneratingQR] = useState(false);

  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (user && user.uid) {
      console.log('🔍 Profile component received user:', {
        uid: user.uid,
        displayName: user.displayName,
        hasUserData: !!user.userData,
        userDataKeys: user.userData ? Object.keys(user.userData) : []
      });
      
      // If user already has userData from App.js, use it immediately
      if (user.userData && Object.keys(user.userData).length > 0) {
        console.log('📱 Using userData from App.js directly');
        setUserDataFromSaved(user.userData);
      } else {
        console.log('🔄 No userData in user prop, fetching from permanent storage');
        fetchUserData();
      }
    }
  }, [user?.uid, user?.userData]);

  const setUserDataFromSaved = (savedData) => {
    console.log('💾 Setting form data from saved data:', savedData);
    
    const finalFormData = {
      displayName: savedData.displayName || user.displayName || '',
      username: savedData.username || '',
      bio: savedData.bio || '',
      photoURL: savedData.photoURL || user.photoURL || '',
      socialLinks: savedData.socialLinks || Object.fromEntries(
        socialPlatforms.map(platform => [platform.key, ''])
      ),
      contactInfo: savedData.contactInfo || {
        phone: '',
        email: user.email || '',
        website: ''
      },
      theme: savedData.theme || 'dark'
    };
    
    console.log('✅ Final form data set:', finalFormData);
    setFormData(finalFormData);
    setUserData(savedData);
    setLoading(false);
  };

  const fetchUserData = async () => {
    if (!user?.uid) return;
    
    console.log('🔐 Loading user data with permanent storage for:', user.uid);
    setLoading(true);
    
    try {
      const result = await loadUserDataPermanently(user.uid);
      console.log('Permanent storage result:', result);
      
      if (result.success && result.data) {
        // User exists in Firestore
        const data = result.data;
        setUserData(data);
        
        const finalFormData = {
          displayName: data.displayName || user.displayName || '',
          username: data.username || '',
          bio: data.bio || '',
          photoURL: data.photoURL || user.photoURL || '',
          socialLinks: data.socialLinks || Object.fromEntries(
            socialPlatforms.map(platform => [platform.key, ''])
          ),
          contactInfo: data.contactInfo || {
            phone: '',
            email: user.email || '',
            website: ''
          },
          theme: data.theme || 'dark'
        };
        
        console.log('Setting form data:', finalFormData);
        setFormData(finalFormData);
        // Backup to localStorage
        localStorage.setItem(`profileData_${user.uid}`, JSON.stringify(finalFormData));
      } else {
        // No Firestore data, create from Firebase Auth
        console.log('No Firestore data, creating from Auth');
        const defaultFormData = {
          displayName: user.displayName || '',
          username: '',
          bio: '',
          photoURL: user.photoURL || '',
          socialLinks: Object.fromEntries(
            socialPlatforms.map(platform => [platform.key, ''])
          ),
          contactInfo: {
            phone: '',
            email: user.email || '',
            website: ''
          },
          theme: 'dark'
        };
        
        console.log('Setting default form data:', defaultFormData);
        setFormData(defaultFormData);
        setUserData(null);
      }
      
      setUsernameAvailable(null);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Create minimal form data on error
      if (!formData) {
        const errorFormData = {
          displayName: user.displayName || '',
          username: '',
          bio: '',
          photoURL: user.photoURL || '',
          socialLinks: Object.fromEntries(
            socialPlatforms.map(platform => [platform.key, ''])
          ),
          contactInfo: {
            phone: '',
            email: user.email || '',
            website: ''
          },
          theme: 'dark'
        };
        setFormData(errorFormData);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, section = null) => {
    if (!formData) return; // Safety check
    
    const { name, value } = e.target;
    
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...(prev?.[section] || {}),
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const checkUsername = async (username) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setUsernameChecking(true);
    try {
      const result = await checkUsernameAvailabilityLocal(username);
      if (result.success) {
        setUsernameAvailable(result.available);
      } else {
        setUsernameAvailable(null);
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(null);
    } finally {
      setUsernameChecking(false);
    }
  };

  const handleUsernameChange = async (e) => {
    const username = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    
    // Import one-time change function
    const { canChangeUsernameOneTime } = await import('../config/verifiedAccounts');
    
    // Check if user already has a username and if they can change it
    if (userData?.username && userData.username !== username) {
      // Check if user has one-time permission
      if (!canChangeUsernameOneTime(user.email)) {
        // Check normal 15-day rule for other users
        if (userData?.usernameLastChanged) {
          const lastChanged = userData.usernameLastChanged.toDate ? 
            userData.usernameLastChanged.toDate() : 
            new Date(userData.usernameLastChanged);
          const daysSinceChange = Math.floor((new Date() - lastChanged) / (1000 * 60 * 60 * 24));
          
          if (daysSinceChange < 15) {
            toast.error(`Username can only be changed every 15 days. ${15 - daysSinceChange} days remaining.`);
            return;
          }
        } else {
          toast.error('Username can only be changed once. Contact support for assistance.');
          return;
        }
      }
    }
    
    setFormData(prev => ({ ...prev, username }));
    
    // Debounce username checking
    setTimeout(() => checkUsername(username), 500);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setSaving(true);
      const result = await uploadProfileImage(user.uid, file);
      
      if (result.success) {
        // Save immediately to database first
        const updateResult = await updateUserData(user.uid, {
          photoURL: result.url,
          updatedAt: new Date()
        });
        
        if (updateResult.success) {
          // Update form data after successful database save
          setFormData(prev => ({ ...prev, photoURL: result.url }));
          toast.success('Profile image updated!');
          
          // Refresh user data to ensure consistency
          await fetchUserData();
        } else {
          toast.error('Error saving profile image to database');
        }
      } else {
        toast.error(result.error || 'Error uploading image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error uploading image');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!formData.username) {
      toast.error('Please set a username first');
      return;
    }

    setGeneratingQR(true);
    try {
      const profileURL = `https://irtzalink.site/${formData.username}`;
      
      // Update user data with QR code URL (for local generation)
      const updateResult = await updateUserData(user.uid, {
        qrCodeURL: profileURL,
        profileURL: profileURL,
        updatedAt: new Date()
      });
      
      if (updateResult.success) {
        toast.success('QR code generated successfully!');
        // Refresh user data to get the QR code URL
        fetchUserData();
      } else {
        toast.error('Error generating QR code');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Error generating QR code');
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (saving) return;
    
    setSaving(true);

    try {
      // Validate required fields
      if (!formData.displayName?.trim()) {
        toast.error('Display name is required');
        setSaving(false);
        return;
      }

      // Check username availability if username is being changed
      if (formData.username && formData.username !== userData?.username) {
        if (usernameAvailable === false) {
          toast.error('Username is not available');
          setSaving(false);
          return;
        }
        
        // Try to reserve the username with one-time permission check
        const reserveResult = await reserveUsernameLocal(user.uid, formData.username, user.email);
        if (!reserveResult.success) {
          toast.error(reserveResult.error);
          setSaving(false);
          return;
        }
      }
      
      // Prepare update data
      const updateData = {
        displayName: formData.displayName.trim(),
        username: formData.username || '',
        bio: formData.bio || '',
        photoURL: formData.photoURL || '',
        socialLinks: formData.socialLinks || {},
        contactInfo: formData.contactInfo || {},
        theme: formData.theme || 'dark',
        profileURL: formData.username ? `https://irtzalink.site/${formData.username}` : '',
        updatedAt: new Date()
      };
      
      // Add username change timestamp if username was changed
      if (userData?.username !== formData.username && formData.username) {
        updateData.usernameLastChanged = new Date();
      }
      
      console.log('💾 Updating profile with permanent storage:', updateData);
      
      const updateResult = await updateUserDataPermanently(user.uid, updateData);
      
      if (updateResult.success) {
        toast.success('Profile updated successfully!');
        
        // Refresh user data from Firebase to get the latest
        await fetchUserData();
        
        // Reset any form validation states
        setUsernameAvailable(null);
      } else {
        toast.error(updateResult.error || 'Error updating profile');
        console.error('Update failed:', updateResult);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Social platforms imported from utils

  if (loading || !formData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner size="large" text="Loading your profile..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Edit Profile
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your personal information and social links
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Basic Information
              </h3>
              
              {/* Profile Photo */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profile Photo
                </label>
                <div className="flex items-center space-x-4">
                  <img
                    src={formData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.displayName || user.email)}&background=3b82f6&color=ffffff`}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
                  />
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="photo-upload"
                      key={userData?.photoURL || 'photo-input'}
                    />
                    <label
                      htmlFor="photo-upload"
                      className="btn-secondary cursor-pointer flex items-center space-x-2"
                    >
                      <PhotoIcon className="w-4 h-4" />
                      <span>Change Photo</span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Max 5MB. JPG, PNG supported.
                    </p>
                  </div>
                </div>
              </div>

              {/* Display Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Your display name"
                />
              </div>

              {/* Username */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400 sm:text-sm">@</span>
                  </div>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleUsernameChange}
                    className="input-field pl-8 pr-12"
                    placeholder="yourusername"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {usernameChecking ? (
                      <LoadingSpinner size="small" text="" />
                    ) : formData.username && formData.username.length >= 3 ? (
                      usernameAvailable ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircleIcon className="w-5 h-5 text-red-500" />
                      )
                    ) : null}
                  </div>
                </div>
                {formData.username && (
                  <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                    Your profile will be available at: irtzalink.com/{formData.username}
                  </p>
                )}
              </div>

              {/* Bio */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="input-field resize-none"
                  placeholder="Tell people about yourself..."
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {formData.bio.length}/500 characters
                </p>
              </div>
            </div>

            {/* Social Links */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Social Links
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {socialPlatforms.map((platform) => (
                  <div key={platform.key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <span className="flex items-center space-x-2">
                        <span className="text-lg">{platform.emoji}</span>
                        <span>{platform.name}</span>
                      </span>
                    </label>
                    <input
                      type="url"
                      name={platform.key}
                      value={formData.socialLinks[platform.key] || ''}
                      onChange={(e) => handleInputChange(e, 'socialLinks')}
                      className="input-field"
                      placeholder={platform.placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Information */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.contactInfo.phone}
                    onChange={(e) => handleInputChange(e, 'contactInfo')}
                    className="input-field"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.contactInfo.email}
                    onChange={(e) => handleInputChange(e, 'contactInfo')}
                    className="input-field"
                    placeholder="your@email.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.contactInfo.website}
                    onChange={(e) => handleInputChange(e, 'contactInfo')}
                    className="input-field"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </div>

            {/* Theme Selection */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Profile Theme
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <label className="relative">
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={formData.theme === 'dark'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    formData.theme === 'dark' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    <div className="w-full h-8 bg-black rounded mb-2"></div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Dark Theme</p>
                  </div>
                </label>
                <label className="relative">
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={formData.theme === 'light'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    formData.theme === 'light' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    <div className="w-full h-8 bg-white border border-gray-300 rounded mb-2"></div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Light Theme</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || (formData.username && formData.username !== userData?.username && usernameAvailable === false)}
                className="btn-primary"
              >
                {saving ? (
                  <LoadingSpinner size="small" text="Saving..." />
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Preview & QR Code */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Profile Preview */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Profile Preview
              </h3>
              <div className="text-center">
                <img
                  src={formData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.displayName || 'User')}&background=3b82f6&color=ffffff`}
                  alt="Profile Preview"
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-4 border-white dark:border-gray-800 shadow-lg"
                />
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {formData.displayName || 'Your Name'}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
                  {formData.username ? `@${formData.username}` : '@username'}
                  {formData.username && <VerifiedBadge username={formData.username} className="w-4 h-4" />}
                </p>
                {formData.bio && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                    {formData.bio}
                  </p>
                )}
              </div>
            </div>


            {/* QR Code */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                QR Code
              </h3>
              {userData?.qrCodeURL ? (
                <div className="text-center">
                  <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
                    <QRCode value={userData.profileURL || ''} size={150} />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                    Share this QR code for instant access to your profile
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    QR updates automatically when you change social links
                  </p>
                  <button className="btn-secondary mt-3 w-full flex items-center justify-center space-x-2">
                    <ShareIcon className="w-4 h-4" />
                    <span>Download QR</span>
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <QrCodeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {!formData.username 
                      ? 'Set a username to generate your QR code'
                      : 'Generate your QR code'
                    }
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateQR}
                    disabled={!formData.username || generatingQR}
                    className="btn-primary w-full"
                  >
                    {generatingQR ? (
                      <LoadingSpinner size="small" text="Generating..." />
                    ) : (
                      'Generate QR Code'
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Profile URL */}
            {formData.username && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Your Profile URL
                </h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={`irtzalink.com/${formData.username}`}
                    readOnly
                    className="input-field text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(`https://irtzalink.com/${formData.username}`)}
                    className="btn-secondary p-3"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;