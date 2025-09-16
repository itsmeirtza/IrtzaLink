import React, { useState, useEffect } from 'react';
import { followUser, unfollowUser, getFollowRelationship } from '../services/firebase';
import toast from 'react-hot-toast';
import { 
  UserPlusIcon, 
  UserMinusIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const FollowButton = ({ currentUser, targetUser, onFollowChange }) => {
  const [relationship, setRelationship] = useState('none');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (currentUser && targetUser && currentUser.uid !== targetUser.uid) {
      checkRelationship();
    } else {
      setRelationship('none');
      setChecking(false);
    }
  }, [currentUser?.uid, targetUser?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkRelationship = async () => {
    setChecking(true);
    try {
      const result = await getFollowRelationship(currentUser.uid, targetUser.uid);
      if (result.success) {
        setRelationship(result.relationship);
      }
    } catch (error) {
      console.error('Error checking relationship:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleFollow = async () => {
    setLoading(true);
    try {
      const result = await followUser(currentUser.uid, targetUser.uid);
      if (result.success) {
        toast.success(`Started following @${targetUser.username}`);
        await checkRelationship(); // Refresh relationship
        if (onFollowChange) onFollowChange();
      } else {
        toast.error(result.error || 'Failed to follow user');
      }
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setLoading(true);
    try {
      const result = await unfollowUser(currentUser.uid, targetUser.uid);
      if (result.success) {
        toast.success(`Unfollowed @${targetUser.username}`);
        await checkRelationship(); // Refresh relationship
        if (onFollowChange) onFollowChange();
      } else {
        toast.error('Failed to unfollow user');
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast.error('Failed to unfollow user');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <button 
        disabled 
        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm font-medium"
      >
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </button>
    );
  }

  if (!currentUser || !targetUser || currentUser.uid === targetUser.uid) {
    return null;
  }

  const getButtonContent = () => {
    switch (relationship) {
      case 'none':
        return {
          text: 'Follow',
          icon: UserPlusIcon,
          className: 'bg-blue-500 hover:bg-blue-600 text-white',
          onClick: handleFollow
        };
      case 'following':
        return {
          text: 'Following',
          icon: CheckIcon,
          className: 'bg-gray-200 dark:bg-gray-700 hover:bg-red-500 dark:hover:bg-red-600 text-gray-700 dark:text-gray-300 hover:text-white',
          onClick: handleUnfollow,
          hoverText: 'Unfollow'
        };
      case 'follower':
        return {
          text: 'Follow Back',
          icon: UserPlusIcon,
          className: 'bg-blue-500 hover:bg-blue-600 text-white',
          onClick: handleFollow
        };
      case 'friends':
        return {
          text: 'Friends',
          icon: CheckIcon,
          className: 'bg-green-100 dark:bg-green-900/30 hover:bg-red-500 dark:hover:bg-red-600 text-green-700 dark:text-green-400 hover:text-white',
          onClick: handleUnfollow,
          hoverText: 'Unfollow'
        };
      default:
        return null;
    }
  };

  const buttonConfig = getButtonContent();
  if (!buttonConfig) return null;

  const Icon = buttonConfig.icon;

  return (
    <button
      onClick={buttonConfig.onClick}
      disabled={loading}
      className={`
        flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${buttonConfig.className}
        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
        group
      `}
      title={buttonConfig.hoverText || buttonConfig.text}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <Icon className="w-4 h-4" />
      )}
      
      {/* Show hover text for following/friends buttons */}
      {buttonConfig.hoverText ? (
        <>
          <span className="group-hover:hidden">{buttonConfig.text}</span>
          <span className="hidden group-hover:inline">{buttonConfig.hoverText}</span>
        </>
      ) : (
        <span>{buttonConfig.text}</span>
      )}
    </button>
  );
};

export default FollowButton;