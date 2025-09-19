import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserFollowers } from '../services/firebase';
import localStorageFix from '../services/localStorageFix';
import supabaseService from '../services/supabaseService';
import LoadingSpinner from '../components/LoadingSpinner';
import VerifiedBadge from '../components/VerifiedBadge';
import FollowButton from '../components/FollowButton';
import toast from 'react-hot-toast';
import {
  HeartIcon,
  UsersIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const FollowersPage = ({ currentUser }) => {
  const { userId } = useParams();
  const [userData, setUserData] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followersLoading, setFollowersLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserData();
      fetchFollowers();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      // Try Supabase first, fallback to LocalStorage
      let result;
      try {
        result = await supabaseService.getUserData(userId);
      } catch (error) {
        result = localStorageFix.loadUserData(userId);
      }
      
      if (result.success) {
        setUserData(result.data);
      } else {
        toast.error('User not found');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Error loading user data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowers = async () => {
    try {
      const result = await getUserFollowers(userId, 100);
      if (result.success) {
        setFollowers(result.data || []);
      } else {
        setFollowers([]);
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
      setFollowers([]);
    } finally {
      setFollowersLoading(false);
    }
  };

  const handleFollowChange = () => {
    // Refresh followers list
    fetchFollowers();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading user..." />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            User Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This user doesn't exist or has been deactivated.
          </p>
          <Link to="/dashboard" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Link
            to={`/user/${userId}`}
            className="mr-4 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div className="flex items-center space-x-4">
            <img
              src={userData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName || 'User')}&background=3b82f6&color=ffffff&size=48`}
              alt={userData.displayName}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {userData.displayName}'s Followers
              </h1>
              <div className="flex items-center space-x-1">
                <p className="text-gray-600 dark:text-gray-400">@{userData.username}</p>
                <VerifiedBadge username={userData.username} className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Followers Count */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-3">
            <HeartIcon className="w-6 h-6 text-red-500" />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {followers.length} Followers
            </span>
          </div>
        </div>

        {/* Followers List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          {followersLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="medium" text="Loading followers..." />
            </div>
          ) : followers.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {followers.map((follower) => (
                <div key={follower.uid} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/user/${follower.uid}`}
                      className="flex items-center space-x-4 flex-1 hover:opacity-80 transition-opacity duration-200"
                    >
                      <img
                        src={follower.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(follower.displayName || 'User')}&background=3b82f6&color=ffffff&size=48`}
                        alt={follower.displayName}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {follower.displayName || 'Unknown User'}
                          </h3>
                          <VerifiedBadge username={follower.username} className="w-4 h-4" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          @{follower.username || 'username'}
                        </p>
                        {follower.bio && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 truncate max-w-md">
                            {follower.bio}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{follower.followers?.length || 0} followers</span>
                          <span>{follower.following?.length || 0} following</span>
                        </div>
                      </div>
                    </Link>
                    
                    {/* Follow Button - only show if not the current user */}
                    {currentUser && follower.uid !== currentUser.uid && (
                      <div className="ml-4 flex-shrink-0">
                        <FollowButton 
                          currentUser={currentUser}
                          targetUser={{
                            uid: follower.uid,
                            username: follower.username,
                            displayName: follower.displayName,
                            photoURL: follower.photoURL
                          }}
                          onFollowChange={handleFollowChange}
                        />
                      </div>
                    )}
                    
                    {/* Show "You" if it's the current user */}
                    {currentUser && follower.uid === currentUser.uid && (
                      <div className="ml-4 flex-shrink-0">
                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-sm">
                          You
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <HeartIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Followers Yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                {userData.displayName} doesn't have any followers yet. Be the first to follow them!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowersPage;