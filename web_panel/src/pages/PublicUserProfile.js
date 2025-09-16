import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserData, followUser, unfollowUser, trackProfileVisit } from '../services/firebase';
import { socialPlatforms } from '../utils/socialIcons';
import LoadingSpinner from '../components/LoadingSpinner';
import VerifiedBadge from '../components/VerifiedBadge';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import {
  UserPlusIcon,
  UserMinusIcon,
  ChatBubbleLeftRightIcon,
  ShareIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

const PublicUserProfile = ({ currentUser }) => {
  const { userId } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followStatus, setFollowStatus] = useState('none'); // none, following, follow_back, friends
  const [isFollowingMe, setIsFollowingMe] = useState(false);
  const [areFriends, setAreFriends] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      if (currentUser) {
        checkRelationshipStatus();
        // Track profile visit
        trackProfileVisit(currentUser.uid, userId);
      }
    }
  }, [userId, currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUserProfile = async () => {
    try {
      const result = await getUserData(userId);
      if (result.success) {
        setUserData(result.data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Error loading user profile');
    } finally {
      setLoading(false);
    }
  };

  const checkRelationshipStatus = async () => {
    if (!currentUser || !userId) return;

    try {
      // Get fresh data for both users
      const [currentUserResult, targetUserResult] = await Promise.all([
        getUserData(currentUser.uid),
        getUserData(userId)
      ]);
      
      if (currentUserResult.success && targetUserResult.success) {
        const currentUserData = currentUserResult.data;
        const targetUserData = targetUserResult.data;
        
        // Update target user data to reflect fresh data
        setUserData(targetUserData);
        
        // Check if target user is following me
        const targetIsFollowingMe = targetUserData.following?.includes(currentUser.uid) || false;
        setIsFollowingMe(targetIsFollowingMe);
        
        // Check if current user is following this user
        const iAmFollowingTarget = currentUserData.following?.includes(userId) || false;
        
        // Check if they are friends (mutual follow)
        const areFriendsCheck = currentUserData.friends?.includes(userId) || 
                               (iAmFollowingTarget && targetIsFollowingMe);
        setAreFriends(areFriendsCheck);
        
        if (areFriendsCheck) {
          setFollowStatus('friends');
        } else if (iAmFollowingTarget) {
          setFollowStatus('following');
        } else if (targetIsFollowingMe) {
          setFollowStatus('follow_back');
        } else {
          setFollowStatus('none');
        }
      }
    } catch (error) {
      console.error('Error checking relationship status:', error);
      setFollowStatus('none');
      setIsFollowingMe(false);
      setAreFriends(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      toast.error('Please login to follow users');
      return;
    }

    setActionLoading(true);
    try {
      if (followStatus === 'none' || followStatus === 'follow_back') {
        const result = await followUser(currentUser.uid, userId);
        if (result.success) {
          // Check if they became friends
          if (result.areFriends) {
            setFollowStatus('friends');
            setAreFriends(true);
            toast.success('You are now friends! 🎉');
          } else {
            setFollowStatus('following');
            toast.success('Following user!');
          }
          // Refresh both user data to update follower/following counts
          await checkRelationshipStatus();
        }
      } else if (followStatus === 'following' || followStatus === 'friends') {
        const result = await unfollowUser(currentUser.uid, userId);
        if (result.success) {
          // Check if they are still following me
          if (isFollowingMe) {
            setFollowStatus('follow_back');
          } else {
            setFollowStatus('none');
          }
          setAreFriends(false);
          toast.success('Unfollowed user');
          // Refresh both user data to update follower/following counts
          await checkRelationshipStatus();
        }
      }
    } catch (error) {
      console.error('Follow action error:', error);
      toast.error('Error with follow action');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChat = () => {
    if (!currentUser) {
      toast.error('Please login to start chatting');
      return;
    }
    
    // Check if current user is following this user
    if (followStatus !== 'following') {
      toast.error('You need to follow this user to start a chat');
      return;
    }
    
    // Pass chat user data to parent component or handle chat opening
    if (window.openChat) {
      window.openChat({
        uid: userId,
        displayName: userData.displayName,
        username: userData.username,
        photoURL: userData.photoURL
      });
    } else {
      toast.info('Chat will open in the main app!');
    }
  };

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/user/${userId}`;
    try {
      await navigator.share({
        title: `${userData.displayName} - IrtzaLink`,
        text: `Check out ${userData.displayName}'s profile on IrtzaLink`,
        url: profileUrl
      });
    } catch (error) {
      navigator.clipboard.writeText(profileUrl);
      toast.success('Profile link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner size="large" text="Loading profile..." />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="max-w-md mx-auto">
          <UsersIcon className="w-24 h-24 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">User Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This user doesn't exist or has been deactivated.
          </p>
          <Link to="/dashboard" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const activeSocialLinks = Object.entries(userData.socialLinks || {})
    .filter(([_, url]) => url && url.trim())
    .map(([platform, url]) => {
      const platformConfig = socialPlatforms.find(p => p.key === platform);
      return platformConfig ? { ...platformConfig, url } : null;
    })
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-6xl">
        {/* Profile Header */}
        <div className="card p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 sm:gap-6">
            {/* Profile Photo */}
            <div className="flex-shrink-0">
              <img
                src={userData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName || 'User')}&background=3b82f6&color=ffffff&size=128`}
                alt={userData.displayName}
                className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center lg:text-left">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {userData.displayName || 'User'}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 flex items-center">
                @{userData.username}
                <VerifiedBadge username={userData.username} className="w-5 h-5" />
              </p>
              {userData.bio && (
                <p className="text-gray-700 dark:text-gray-300 mt-3">
                  {userData.bio}
                </p>
              )}
            </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:flex sm:justify-center lg:justify-start gap-4 sm:gap-6 mb-6">
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {userData.followers?.length || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {userData.following?.length || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Following</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {userData.socialLinks ? Object.values(userData.socialLinks).filter(link => link && link.trim()).length : 0}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Links</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {userData.createdAt ? Math.floor((new Date() - (userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt))) / (1000 * 60 * 60 * 24)) : 0}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Days</div>
                </div>
              </div>

              {/* Action Buttons */}
              {currentUser && currentUser.uid !== userId && (
                <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-2 sm:gap-3 w-full">
                  {/* Follow/Unfollow Button */}
                  <button
                    onClick={handleFollow}
                    disabled={actionLoading}
                    className={`flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 rounded-lg font-medium transition-colors duration-200 w-full sm:w-auto ${
                      followStatus === 'following'
                        ? 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400'
                        : followStatus === 'follow_back'
                        ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
                        : followStatus === 'friends'
                        ? 'bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400'
                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400'
                    }`}
                  >
                    {actionLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                    ) : (
                      <>
                        {followStatus === 'following' || followStatus === 'friends' ? (
                          <UserMinusIcon className="w-4 h-4" />
                        ) : (
                          <UserPlusIcon className="w-4 h-4" />
                        )}
                        <span>
                          {followStatus === 'following' ? 'Following' : 
                           followStatus === 'follow_back' ? 'Follow Back' : 
                           followStatus === 'friends' ? 'Friends' : 'Follow'}
                        </span>
                        {/* Show following indicator */}
                        {isFollowingMe && followStatus !== 'friends' && (
                          <span className="hidden sm:inline text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded-full ml-2">
                            Follows you
                          </span>
                        )}
                      </>
                    )}
                  </button>

                  {/* Chat Button */}
                  <button
                    onClick={handleChat}
                    className="flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors duration-200 w-full sm:w-auto"
                  >
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                    <span>Message</span>
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors duration-200 w-full sm:w-auto"
                  >
                    <ShareIcon className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>
              )}
          </div>

            {/* QR Code */}
            {userData.profileURL && (
              <div className="flex-shrink-0 lg:block hidden">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <QRCode value={userData.profileURL} size={100} />
                </div>
                <p className="text-xs text-center text-gray-500 mt-2">Scan QR Code</p>
              </div>
            )}
          </div>
        </div>

        {/* Social Links */}
        {activeSocialLinks.length > 0 && (
          <div className="card p-4 sm:p-6 mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Social Links
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {activeSocialLinks.map((social) => (
                <a
                  key={social.key}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 active:scale-95 transform"
                >
                  <span className="text-2xl">{social.emoji}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {social.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Visit Profile
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

      {/* Contact Information */}
      {(userData.contactInfo?.phone || userData.contactInfo?.email || userData.contactInfo?.website) && (
        <div className="card p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Contact Information
          </h3>
          <div className="space-y-3">
            {userData.contactInfo?.phone && (
              <div className="flex items-center space-x-3">
                <span className="text-xl">📞</span>
                <a 
                  href={`tel:${userData.contactInfo.phone}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {userData.contactInfo.phone}
                </a>
              </div>
            )}
            {userData.contactInfo?.email && (
              <div className="flex items-center space-x-3">
                <span className="text-xl">✉️</span>
                <a 
                  href={`mailto:${userData.contactInfo.email}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {userData.contactInfo.email}
                </a>
              </div>
            )}
            {userData.contactInfo?.website && (
              <div className="flex items-center space-x-3">
                <span className="text-xl">🌐</span>
                <a 
                  href={userData.contactInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {userData.contactInfo.website}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default PublicUserProfile;