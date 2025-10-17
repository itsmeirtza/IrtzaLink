import React, { useState, useEffect } from 'react';
import { getUserFollowers, getUserFollowing, getFollowCounts } from '../services/firebase';
import { Link } from 'react-router-dom';
import VerifiedBadge from './VerifiedBadge';
import FollowButton from './FollowButton';
import toast from 'react-hot-toast';
import {
  UsersIcon,
  EyeIcon,
  UserGroupIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

const FollowManager = ({ user }) => {
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('followers');
  const [followCounts, setFollowCounts] = useState({
    followersCount: 0,
    followingCount: 0
  });

  useEffect(() => {
    if (user) {
      fetchFollowData();
      fetchFollowCounts();
    }
  }, [user]);

  const fetchFollowCounts = async () => {
    try {
      const result = await getFollowCounts(user.uid);
      if (result.success) {
        setFollowCounts({
          followersCount: result.followersCount,
          followingCount: result.followingCount
        });
      }
    } catch (error) {
      console.error('Error fetching follow counts:', error);
    }
  };

  const fetchFollowData = async () => {
    setLoading(true);
    try {
      const [followersResult, followingResult] = await Promise.all([
        getUserFollowers(user.uid, 50),
        getUserFollowing(user.uid, 50)
      ]);

      if (followersResult.success) {
        setFollowers(followersResult.data || []);
      } else {
        setFollowers([]);
      }

      if (followingResult.success) {
        setFollowing(followingResult.data || []);
      } else {
        setFollowing([]);
      }
    } catch (error) {
      console.error('Error fetching follow data:', error);
      toast.error('Error loading follow data');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowChange = () => {
    // Refresh data when follow status changes
    fetchFollowData();
    fetchFollowCounts();
  };

  const getCurrentList = () => {
    switch (activeTab) {
      case 'followers':
        return followers;
      case 'following':
        return following;
      default:
        return [];
    }
  };

  const currentList = getCurrentList();
  const totalCount = followCounts.followersCount + followCounts.followingCount;

  if (totalCount === 0 && !loading) {
    return null;
  }

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <UserGroupIcon className="w-5 h-5 text-blue-500" />
          <span>Follow Network</span>
        </h3>
        
        {/* Stats Overview */}
        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <HeartIcon className="w-4 h-4 text-red-500" />
            <span>{followCounts.followersCount} followers</span>
          </div>
          <div className="flex items-center space-x-1">
            <UsersIcon className="w-4 h-4 text-blue-500" />
            <span>{followCounts.followingCount} following</span>
          </div>
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setActiveTab('followers')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2 ${
            activeTab === 'followers'
              ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <HeartIcon className="w-4 h-4" />
          <span>Followers ({followCounts.followersCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('following')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2 ${
            activeTab === 'following'
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <UsersIcon className="w-4 h-4" />
          <span>Following ({followCounts.followingCount})</span>
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading connections...</p>
        </div>
      ) : currentList.length > 0 ? (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {currentList.map((person) => (
            <div
              key={person.uid}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              <Link
                to={`/user/${person.uid}`}
                className="flex items-center space-x-3 flex-1 hover:opacity-80 transition-opacity duration-200"
              >
                <img
                  src={person.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.displayName || 'User')}&background=3b82f6&color=ffffff&size=48`}
                  alt={person.displayName}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {person.displayName || 'Unknown User'}
                    </p>
                    <VerifiedBadge username={person.username} className="w-4 h-4" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    @{person.username || 'username'}
                  </p>
                  {person.bio && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate max-w-xs">
                      {person.bio}
                    </p>
                  )}
                </div>
              </Link>
              
              {/* Follow Button - only show if not the current user */}
              {person.uid !== user.uid && (
                <div className="ml-4 flex-shrink-0">
                  <FollowButton 
                    currentUser={user}
                    targetUser={person}
                    onFollowChange={handleFollowChange}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            {activeTab === 'followers' ? (
              <HeartIcon className="w-16 h-16 text-gray-300 dark:text-gray-600" />
            ) : (
              <UsersIcon className="w-16 h-16 text-gray-300 dark:text-gray-600" />
            )}
          </div>
          <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
            {activeTab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {activeTab === 'followers' 
              ? 'Your followers will appear here when people start following you'
              : 'Start following people to see them here'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default FollowManager;