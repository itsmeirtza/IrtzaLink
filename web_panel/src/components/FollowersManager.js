import React, { useState, useEffect } from 'react';
import { getUserData } from '../services/firebase';
import { Link } from 'react-router-dom';
import VerifiedBadge from './VerifiedBadge';
import {
  UsersIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const FollowersManager = ({ user }) => {
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('followers');

  useEffect(() => {
    if (user) {
      fetchFollowersAndFollowing();
    }
  }, [user]);

  const fetchFollowersAndFollowing = async () => {
    setLoading(true);
    try {
      // Get user's current followers and following from their profile
      const userResult = await getUserData(user.uid);
      if (userResult.success && userResult.data) {
        const userData = userResult.data;
        
        // Fetch follower details
        if (userData.followers && userData.followers.length > 0) {
          const followerDetails = await Promise.all(
            userData.followers.map(async (followerId) => {
              const followerResult = await getUserData(followerId);
              if (followerResult.success) {
                return {
                  id: followerId,
                  ...followerResult.data
                };
              }
              return null;
            })
          );
          setFollowers(followerDetails.filter(Boolean));
        } else {
          setFollowers([]);
        }
        
        // Fetch following details
        if (userData.following && userData.following.length > 0) {
          const followingDetails = await Promise.all(
            userData.following.map(async (followingId) => {
              const followingResult = await getUserData(followingId);
              if (followingResult.success) {
                return {
                  id: followingId,
                  ...followingResult.data
                };
              }
              return null;
            })
          );
          setFollowing(followingDetails.filter(Boolean));
        } else {
          setFollowing([]);
        }
      }
    } catch (error) {
      console.error('Error fetching followers/following:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentList = activeTab === 'followers' ? followers : following;
  const currentCount = currentList.length;

  if (currentCount === 0 && !loading) {
    return null;
  }

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <UsersIcon className="w-5 h-5 text-blue-500" />
          <span>Your Network</span>
        </h3>
        
        {/* Tab Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('followers')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
              activeTab === 'followers'
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Followers ({followers.length})
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
              activeTab === 'following'
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Following ({following.length})
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : currentCount > 0 ? (
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {currentList.map((person) => (
            <Link
              key={person.id}
              to={`/user/${person.id}`}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                <img
                  src={person.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.displayName || 'User')}&background=3b82f6&color=ffffff&size=40`}
                  alt={person.displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {person.displayName || 'Unknown User'}
                    </p>
                    <VerifiedBadge username={person.username} className="w-4 h-4 ml-1" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    @{person.username || 'username'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <EyeIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">View Profile</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {activeTab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {activeTab === 'followers' 
              ? 'Share your profile to get followers' 
              : 'Find interesting people to follow'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default FollowersManager;