import React, { useState, useEffect } from 'react';
import supabaseService from '../services/supabaseService';
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
  ShareIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const Profile = ({ user }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    display_name: '',
    username: '',
    bio: '',
    profile_pic_url: '',
    social_links: Object.fromEntries(
      socialPlatforms.map(platform => [platform.key, ''])
    ),
    contact_info: {
      phone: '',
      email: '',
      website: ''
    },
    theme: 'dark'
  });

  // Links state
  const [links, setLinks] = useState([]);
  const [newLink, setNewLink] = useState({ title: '', url: '' });

  // Load user data on component mount
  useEffect(() => {
    if (user && user.uid) {
      loadUserData();
      loadUserLinks();
    }
  }, [user?.uid]);

  // Set form data from user data received from App.js
  useEffect(() => {
    if (user && user.userData) {
      console.log('🔥 PROFILE: Using data from App.js');
      const userData = user.userData;
      
      setFormData({
        display_name: userData.display_name || user.displayName || '',
        username: userData.username || '',
        bio: userData.bio || '',
        profile_pic_url: userData.profile_pic_url || user.photoURL || '',
        social_links: userData.social_links || Object.fromEntries(
          socialPlatforms.map(platform => [platform.key, ''])
        ),
        contact_info: userData.contact_info || {
          phone: '',
          email: user.email || '',
          website: ''
        },
        theme: userData.theme || 'dark'
      });

      setUserData(userData);
      setLoading(false);
    }
  }, [user?.userData, user?.displayName, user?.email, user?.photoURL]);

  const loadUserData = async () => {
    try {
      console.log('🔍 PROFILE: Loading user data from Firestore');
      const result = await supabaseService.getUserData(user.uid);
      
      if (result.success) {
        const userData = result.data;
        
        setFormData({
          display_name: userData.display_name || user.displayName || '',
          username: userData.username || '',
          bio: userData.bio || '',
          profile_pic_url: userData.profile_pic_url || user.photoURL || '',
          social_links: userData.social_links || Object.fromEntries(
            socialPlatforms.map(platform => [platform.key, ''])
          ),
          contact_info: userData.contact_info || {
            phone: '',
            email: user.email || '',
            website: ''
          },
          theme: userData.theme || 'dark'
        });

        setUserData(userData);
        console.log('✅ PROFILE: User data loaded successfully');
      } else {
        console.log('⚠️ PROFILE: No user data found, using defaults');
      }
    } catch (error) {
      console.error('❌ PROFILE: Error loading user data:', error);
      toast.error('Error loading profile data');
    } finally {
      setLoading(false);
    }
  };

  const loadUserLinks = async () => {
    try {
      console.log('🔗 PROFILE: Loading user links');
      const result = await firestoreService.getUserLinks(user.uid);
      
      if (result.success) {
        setLinks(result.data);
        console.log('✅ PROFILE: Found', result.data.length, 'links');
      }
    } catch (error) {
      console.error('❌ PROFILE: Error loading links:', error);
    }
  };

  const handleInputChange = (e, section = null) => {
    const { name, value } = e.target;
    
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      console.log('📸 PROFILE: Uploading profile picture');
      
      const result = await firestoreService.uploadProfilePicture(user.uid, file);
      
      if (result.success) {
        // Update form data with new image URL
        setFormData(prev => ({
          ...prev,
          profile_pic_url: result.url
        }));
        
        toast.success('Profile picture updated!');
        console.log('✅ PROFILE: Profile picture uploaded successfully');
      } else {
        toast.error(result.error || 'Error uploading image');
      }
    } catch (error) {
      console.error('❌ PROFILE: Error uploading image:', error);
      toast.error('Error uploading image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (saving) return;
    
    setSaving(true);

    try {
      // Validate required fields
      if (!formData.display_name?.trim()) {
        toast.error('Display name is required');
        setSaving(false);
        return;
      }

      console.log('💾 PROFILE: Saving user data to Firestore');
      
      const result = await firestoreService.updateUserData(user.uid, {
        display_name: formData.display_name.trim(),
        username: formData.username.toLowerCase().trim(),
        bio: formData.bio || '',
        social_links: formData.social_links,
        contact_info: formData.contact_info,
        theme: formData.theme
      });

      if (result.success) {
        toast.success('Profile updated successfully!');
        console.log('✅ PROFILE: Profile saved to Firestore');
        
        // Refresh user data
        await loadUserData();
      } else {
        toast.error(result.error || 'Error saving profile');
      }
    } catch (error) {
      console.error('❌ PROFILE: Error saving profile:', error);
      toast.error('Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddLink = async () => {
    if (!newLink.title.trim() || !newLink.url.trim()) {
      toast.error('Please fill in both title and URL');
      return;
    }

    try {
      console.log('➕ PROFILE: Adding new link');
      
      const result = await firestoreService.addUserLink(user.uid, {
        title: newLink.title.trim(),
        url: newLink.url.trim()
      });

      if (result.success) {
        toast.success('Link added successfully!');
        setNewLink({ title: '', url: '' });
        
        // Reload links
        await loadUserLinks();
        console.log('✅ PROFILE: Link added successfully');
      } else {
        toast.error(result.error || 'Error adding link');
      }
    } catch (error) {
      console.error('❌ PROFILE: Error adding link:', error);
      toast.error('Error adding link');
    }
  };

  const handleDeleteLink = async (linkId) => {
    try {
      console.log('🗑️ PROFILE: Deleting link', linkId);
      
      const result = await firestoreService.deleteUserLink(user.uid, linkId);

      if (result.success) {
        toast.success('Link deleted');
        
        // Reload links
        await loadUserLinks();
        console.log('✅ PROFILE: Link deleted successfully');
      } else {
        toast.error(result.error || 'Error deleting link');
      }
    } catch (error) {
      console.error('❌ PROFILE: Error deleting link:', error);
      toast.error('Error deleting link');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner size="large" text="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Profile Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your profile information and social links. Data is automatically saved to the cloud.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Picture */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Profile Picture
          </h2>
          
          <div className="flex items-center space-x-6">
            <div className="relative">
              <img
                src={
                  formData.profile_pic_url || 
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.display_name || 'User')}&background=3b82f6&color=ffffff&size=100`
                }
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
              />
              {uploadingImage && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <LoadingSpinner size="small" />
                </div>
              )}
            </div>
            
            <div>
              <label className="btn-secondary cursor-pointer">
                <PhotoIcon className="w-5 h-5 mr-2" />
                {uploadingImage ? 'Uploading...' : 'Change Photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                JPG, PNG up to 5MB
              </p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Basic Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Display Name *
              </label>
              <input
                type="text"
                name="display_name"
                value={formData.display_name}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Your display name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  @
                </span>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="input-field pl-8"
                  placeholder="username"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={3}
              className="input-field"
              placeholder="Tell people about yourself..."
            />
          </div>
        </div>

        {/* Social Links */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Social Links
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {socialPlatforms.map((platform) => (
              <div key={platform.key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <span className="mr-2">{platform.emoji}</span>
                  {platform.name}
                </label>
                <input
                  type="url"
                  name={platform.key}
                  value={formData.social_links[platform.key] || ''}
                  onChange={(e) => handleInputChange(e, 'social_links')}
                  className="input-field"
                  placeholder={`Your ${platform.name} URL`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Contact Information */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Contact Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.contact_info.email}
                onChange={(e) => handleInputChange(e, 'contact_info')}
                className="input-field"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.contact_info.phone}
                onChange={(e) => handleInputChange(e, 'contact_info')}
                className="input-field"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.contact_info.website}
                onChange={(e) => handleInputChange(e, 'contact_info')}
                className="input-field"
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>
        </div>

        {/* Custom Links */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Custom Links
          </h2>
          
          {/* Add New Link */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                value={newLink.title}
                onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
                className="input-field"
                placeholder="Link title"
              />
              <input
                type="url"
                value={newLink.url}
                onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                className="input-field"
                placeholder="https://example.com"
              />
            </div>
            <button
              type="button"
              onClick={handleAddLink}
              className="btn-secondary"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Link
            </button>
          </div>

          {/* Existing Links */}
          {links.length > 0 && (
            <div className="space-y-3">
              {links.map((link) => (
                <div key={link.id} className="flex items-center justify-between bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {link.title}
                    </h4>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {link.url}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteLink(link.id)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? (
              <>
                <LoadingSpinner size="small" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                Save Profile
              </>
            )}
          </button>
        </div>
      </form>

      {/* Profile Preview */}
      {formData.username && (
        <div className="mt-8 card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Profile Preview
          </h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Your public profile will be available at:
            </p>
            <a
              href={`/${formData.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              irtzalink.vercel.app/{formData.username}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;