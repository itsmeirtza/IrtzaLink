import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserData, sendFriendRequestNew, acceptFriendRequest, removeFriend, getUserRelationshipStatus, trackProfileVisit } from '../services/firebase';
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
  const [relationshipStatus, setRelationshipStatus] = useState({
    areFriends: false,
    sentRequest: false,
    receivedRequest: false,
    canSendRequest: false
  });
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
      const result = await getUserRelationshipStatus(currentUser.uid, userId);
      if (result.success) {
        setRelationshipStatus(result.status);
      }
    } catch (error) {
      console.error('Error checking relationship status:', error);
      setRelationshipStatus({
        areFriends: false,
        sentRequest: false,
        receivedRequest: false,
        canSendRequest: false
      });
    }
  };

  const handleFriendAction = async () => {
    if (!currentUser) {
      toast.error('Please login to connect with users');
      return;
    }

    setActionLoading(true);
    try {
      if (relationshipStatus.canSendRequest) {
        // Send friend request
        const result = await sendFriendRequestNew(currentUser.uid, userId);
        if (result.success) {
          if (result.becameFriends) {
            toast.success('You are now friends! 🎉');
          } else {
            toast.success('Friend request sent!');
          }
          await checkRelationshipStatus();
        } else {
          toast.error(result.error || 'Failed to send friend request');
        }
      } else if (relationshipStatus.receivedRequest) {
        // Accept friend request
        const result = await acceptFriendRequest(currentUser.uid, userId);
        if (result.success) {
          toast.success('Friend request accepted! 🎉');
          await checkRelationshipStatus();
        } else {
          toast.error(result.error || 'Failed to accept friend request');
        }
      } else if (relationshipStatus.areFriends) {
        // Remove friend
        if (window.confirm('Are you sure you want to remove this friend?')) {
          const result = await removeFriend(currentUser.uid, userId);
          if (result.success) {
            toast.success('Friend removed');
            await checkRelationshipStatus();
          } else {
            toast.error(result.error || 'Failed to remove friend');
          }
        }
      }
    } catch (error) {
      console.error('Friend action error:', error);
      toast.error('Error with friend action');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChat = () => {
    if (!currentUser) {
      toast.error('Please login to start chatting');
      return;
    }
    
    // Check if they are friends
    if (!relationshipStatus.areFriends) {
      toast.error('You can only chat with friends. Send a friend request first!');
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
              <div className="grid grid-cols-3 sm:flex sm:justify-center lg:justify-start gap-4 sm:gap-6 mb-6">
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {userData.friends?.length || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Friends</div>
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
                  {/* Friend Request Button */}
                  <button
                    onClick={handleFriendAction}
                    disabled={actionLoading}
                    className={`flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 rounded-lg font-medium transition-colors duration-200 w-full sm:w-auto ${
                      relationshipStatus.areFriends
                        ? 'bg-green-100 text-green-600 hover:bg-red-100 hover:text-red-600 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-red-900/20 dark:hover:text-red-400'
                        : relationshipStatus.receivedRequest
                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400'
                        : relationshipStatus.sentRequest
                        ? 'bg-gray-100 text-gray-600 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400'
                        : relationshipStatus.canSendRequest
                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-600 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {actionLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                    ) : (
                      <>
                        {relationshipStatus.areFriends ? (
                          <UserMinusIcon className="w-4 h-4" />
                        ) : (
                          <UserPlusIcon className="w-4 h-4" />
                        )}
                        <span>
                          {relationshipStatus.areFriends ? 'Friends' : 
                           relationshipStatus.receivedRequest ? 'Accept Request' : 
                           relationshipStatus.sentRequest ? 'Request Sent' :
                           relationshipStatus.canSendRequest ? 'Add Friend' : 'Cannot Add'}
                        </span>
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