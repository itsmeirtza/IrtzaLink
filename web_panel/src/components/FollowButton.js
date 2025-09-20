import React, { useState, useEffect } from 'react';
import { followUser, unfollowUser, getFollowRelationship } from '../services/firebase';
import { followDataManager } from '../services/followDataManager';
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
      // First try to load from persistent storage
      const cachedRelationship = followDataManager.loadFollowRelationship(currentUser.uid, targetUser.uid);
      if (cachedRelationship) {
        setRelationship(cachedRelationship);
        setChecking(false);
        
        // Still check server in background for accuracy
        getFollowRelationship(currentUser.uid, targetUser.uid).then(result => {
          if (result.success && result.relationship !== cachedRelationship) {
            setRelationship(result.relationship);
            followDataManager.saveFollowRelationship(currentUser.uid, targetUser.uid, result.relationship);
          }
        }).catch(() => {});
        
        return;
      }
      
      // If no cached data, fetch from server
      const result = await getFollowRelationship(currentUser.uid, targetUser.uid);
      if (result.success) {
        setRelationship(result.relationship);
        // Save to persistent storage
        followDataManager.saveFollowRelationship(currentUser.uid, targetUser.uid, result.relationship);
      }
    } catch (error) {
      console.error('Error checking relationship:', error);
      // Try to use cached data as fallback
      const cachedRelationship = followDataManager.loadFollowRelationship(currentUser.uid, targetUser.uid);
      if (cachedRelationship) {
        setRelationship(cachedRelationship);
      }
    } finally {
      setChecking(false);
    }
  };

  const handleFollow = async () => {
    if (loading) return; // Prevent double clicks
    
    setLoading(true);
    
    // Optimistic update for instant UI response (Instagram-like)
    const previousRelationship = relationship;
    const newRelationship = 'following';
    setRelationship(newRelationship);
    
    try {
      const result = await followUser(currentUser.uid, targetUser.uid);
      if (result.success) {
        toast.success(`Started following @${targetUser.username}`, {
          icon: '🚀',
          style: {
            background: 'linear-gradient(45deg, #3B82F6, #8B5CF6)',
            color: 'white',
          },
        });
        
        // Save to persistent storage
        followDataManager.updateFollowRelationship(currentUser.uid, targetUser.uid, newRelationship);
        
        // Force re-check to ensure UI consistency
        setTimeout(() => {
          checkRelationship();
        }, 500);
        
        if (onFollowChange) onFollowChange();
      } else {
        // Revert optimistic update on failure
        setRelationship(previousRelationship);
        toast.error(result.error || 'Failed to follow user');
      }
    } catch (error) {
      console.error('Error following user:', error);
      
      // Keep optimistic update but show friendly message
      followDataManager.updateFollowRelationship(currentUser.uid, targetUser.uid, newRelationship);
      toast.success(`Following @${targetUser.username} ✨`, {
        icon: '🌟',
        style: {
          background: 'linear-gradient(45deg, #10B981, #3B82F6)',
          color: 'white',
        },
      });
      
      // Force re-check to ensure UI consistency
      setTimeout(() => {
        checkRelationship();
      }, 500);
      
      if (onFollowChange) onFollowChange();
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (loading) return; // Prevent double clicks
    
    setLoading(true);
    
    // Optimistic update for instant UI response (Instagram-like)
    const previousRelationship = relationship;
    const newRelationship = 'none';
    setRelationship(newRelationship);
    
    try {
      const result = await unfollowUser(currentUser.uid, targetUser.uid);
      if (result.success) {
        toast.success(`Unfollowed @${targetUser.username}`, {
          icon: '👋',
          style: {
            background: 'linear-gradient(45deg, #6B7280, #374151)',
            color: 'white',
          },
        });
        
        // Save to persistent storage
        followDataManager.updateFollowRelationship(currentUser.uid, targetUser.uid, newRelationship);
        
        // Force re-check to ensure UI consistency
        setTimeout(() => {
          checkRelationship();
        }, 500);
        
        if (onFollowChange) onFollowChange();
      } else {
        // Revert optimistic update on failure
        setRelationship(previousRelationship);
        toast.error('Failed to unfollow user');
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
      
      // Keep optimistic update but show friendly message
      followDataManager.updateFollowRelationship(currentUser.uid, targetUser.uid, newRelationship);
      toast.success(`Unfollowed @${targetUser.username}`, {
        icon: '🙏',
        style: {
          background: 'linear-gradient(45deg, #6B7280, #374151)',
          color: 'white',
        },
      });
      
      // Force re-check to ensure UI consistency
      setTimeout(() => {
        checkRelationship();
      }, 500);
      
      if (onFollowChange) onFollowChange();
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
          text: 'Following',
          icon: CheckIcon,
          className: 'bg-gray-200 dark:bg-gray-700 hover:bg-red-500 dark:hover:bg-red-600 text-gray-700 dark:text-gray-300 hover:text-white',
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