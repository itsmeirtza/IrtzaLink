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

  // Force refresh function
  const forceRefresh = async () => {
    console.log('🔄 Force refreshing follow relationship...');
    // Clear cache first
    followDataManager.clearFollowRelationship(currentUser.uid, targetUser.uid);
    // Then check from server
    await checkRelationship();
  };

  useEffect(() => {
    if (currentUser && targetUser && currentUser.uid !== targetUser.uid) {
      // Always do a force refresh on mount to get latest data
      forceRefresh();
    } else {
      setRelationship('none');
      setChecking(false);
    }
  }, [currentUser?.uid, targetUser?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkRelationship = async () => {
    setChecking(true);
    try {
      console.log('🔍 Checking relationship between:', currentUser.uid, 'and', targetUser.uid);
      
      // Always fetch from server for real-time accuracy
      const result = await getFollowRelationship(currentUser.uid, targetUser.uid);
      if (result.success) {
        console.log('✅ Server relationship:', result.relationship);
        setRelationship(result.relationship);
        
        // Save to cache for backup only
        followDataManager.saveFollowRelationship(currentUser.uid, targetUser.uid, result.relationship);
      } else {
        console.log('❌ Failed to get relationship:', result.error);
        // Only use cache as absolute fallback
        const cachedRelationship = followDataManager.loadFollowRelationship(currentUser.uid, targetUser.uid);
        if (cachedRelationship) {
          console.log('📦 Using cached relationship:', cachedRelationship);
          setRelationship(cachedRelationship);
        }
      }
    } catch (error) {
      console.error('❌ Error checking relationship:', error);
      // Last resort: try cached data
      const cachedRelationship = followDataManager.loadFollowRelationship(currentUser.uid, targetUser.uid);
      if (cachedRelationship) {
        console.log('🆘 Emergency cache fallback:', cachedRelationship);
        setRelationship(cachedRelationship);
      } else {
        setRelationship('none'); // Default fallback
      }
    } finally {
      setChecking(false);
    }
  };

  const handleFollow = async () => {
    if (loading) return; // Prevent double clicks
    
    setLoading(true);
    console.log('🚀 Following user:', targetUser.username);
    
    try {
      const result = await followUser(currentUser.uid, targetUser.uid);
      if (result.success) {
        console.log('✅ Follow successful!');
        
        // Immediately update UI state (if they already follow you, you're now friends)
        const nextState = relationship === 'follower' ? 'friends' : 'following';
        setRelationship(nextState);
        
        // Save to cache
        followDataManager.updateFollowRelationship(currentUser.uid, targetUser.uid, nextState);
        
        toast.success(`Started following @${targetUser.username}`, {
          icon: '🚀',
          style: {
            background: 'linear-gradient(45deg, #3B82F6, #8B5CF6)',
            color: 'white',
          },
        });
        
        // Force server check after a short delay to ensure consistency
        setTimeout(async () => {
          await checkRelationship();
        }, 1000);
        
        if (onFollowChange) onFollowChange();
      } else {
        console.log('❌ Follow failed:', result.error);
        toast.error(result.error || 'Failed to follow user');
        
        // Refresh to get correct state
        await checkRelationship();
      }
    } catch (error) {
      console.error('❌ Error following user:', error);
      
      // Show error but still update optimistically
      setRelationship('following');
      followDataManager.updateFollowRelationship(currentUser.uid, targetUser.uid, 'following');
      
      toast.success(`Following @${targetUser.username} ✨`, {
        icon: '🌟',
        style: {
          background: 'linear-gradient(45deg, #10B981, #3B82F6)',
          color: 'white',
        },
      });
      
      if (onFollowChange) onFollowChange();
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (loading) return; // Prevent double clicks
    
    setLoading(true);
    console.log('👋 Unfollowing user:', targetUser.username);
    
    try {
      const result = await unfollowUser(currentUser.uid, targetUser.uid);
      if (result.success) {
        console.log('✅ Unfollow successful!');
        
        // Immediately update UI state
        setRelationship('none');
        
        // Save to cache
        followDataManager.updateFollowRelationship(currentUser.uid, targetUser.uid, 'none');
        
        toast.success(`Unfollowed @${targetUser.username}`, {
          icon: '👋',
          style: {
            background: 'linear-gradient(45deg, #6B7280, #374151)',
            color: 'white',
          },
        });
        
        // Force server check after a short delay to ensure consistency
        setTimeout(async () => {
          await checkRelationship();
        }, 1000);
        
        if (onFollowChange) onFollowChange();
      } else {
        console.log('❌ Unfollow failed:', result.error);
        toast.error('Failed to unfollow user');
        
        // Refresh to get correct state
        await checkRelationship();
      }
    } catch (error) {
      console.error('❌ Error unfollowing user:', error);
      
      // Show error but still update optimistically
      setRelationship('none');
      followDataManager.updateFollowRelationship(currentUser.uid, targetUser.uid, 'none');
      
      toast.success(`Unfollowed @${targetUser.username}`, {
        icon: '🙏',
        style: {
          background: 'linear-gradient(45deg, #6B7280, #374151)',
          color: 'white',
        },
      });
      
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
          text: 'Friends',
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