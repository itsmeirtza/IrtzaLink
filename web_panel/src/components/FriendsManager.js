import React, { useState, useEffect } from 'react';
import { getUserData, sendFriendRequestNew, acceptFriendRequest, rejectFriendRequest, removeFriend, getUserRelationshipStatus } from '../services/firebase';
import { Link } from 'react-router-dom';
import VerifiedBadge from './VerifiedBadge';
import toast from 'react-hot-toast';
import {
  UsersIcon,
  EyeIcon,
  UserPlusIcon,
  UserMinusIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const FriendsManager = ({ user }) => {
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('friends');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (user) {
      fetchFriendsData();
    }
  }, [user]);

  const fetchFriendsData = async () => {
    setLoading(true);
    try {
      const userResult = await getUserData(user.uid);
      if (userResult.success && userResult.data) {
        const userData = userResult.data;
        
        // Fetch friends details
        if (userData.friends && userData.friends.length > 0) {
          const friendDetails = await Promise.all(
            userData.friends.map(async (friendId) => {
              const friendResult = await getUserData(friendId);
              if (friendResult.success) {
                return {
                  id: friendId,
                  ...friendResult.data
                };
              }
              return null;
            })
          );
          setFriends(friendDetails.filter(Boolean));
        } else {
          setFriends([]);
        }
        
        // Fetch friend requests details
        if (userData.friendRequests && userData.friendRequests.length > 0) {
          const requestDetails = await Promise.all(
            userData.friendRequests.map(async (requesterId) => {
              const requesterResult = await getUserData(requesterId);
              if (requesterResult.success) {
                return {
                  id: requesterId,
                  ...requesterResult.data
                };
              }
              return null;
            })
          );
          setFriendRequests(requestDetails.filter(Boolean));
        } else {
          setFriendRequests([]);
        }

        // Fetch sent requests details
        if (userData.sentFriendRequests && userData.sentFriendRequests.length > 0) {
          const sentDetails = await Promise.all(
            userData.sentFriendRequests.map(async (sentToId) => {
              const sentToResult = await getUserData(sentToId);
              if (sentToResult.success) {
                return {
                  id: sentToId,
                  ...sentToResult.data
                };
              }
              return null;
            })
          );
          setSentRequests(sentDetails.filter(Boolean));
        } else {
          setSentRequests([]);
        }
      }
    } catch (error) {
      console.error('Error fetching friends data:', error);
      toast.error('Error loading friends data');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requesterId) => {
    setActionLoading(prev => ({ ...prev, [requesterId]: true }));
    try {
      const result = await acceptFriendRequest(user.uid, requesterId);
      if (result.success) {
        toast.success('Friend request accepted!');
        await fetchFriendsData(); // Refresh data
      } else {
        toast.error(result.error || 'Failed to accept friend request');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error('Error accepting friend request');
    } finally {
      setActionLoading(prev => ({ ...prev, [requesterId]: false }));
    }
  };

  const handleRejectRequest = async (requesterId) => {
    setActionLoading(prev => ({ ...prev, [requesterId]: true }));
    try {
      const result = await rejectFriendRequest(user.uid, requesterId);
      if (result.success) {
        toast.success('Friend request rejected');
        await fetchFriendsData(); // Refresh data
      } else {
        toast.error(result.error || 'Failed to reject friend request');
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast.error('Error rejecting friend request');
    } finally {
      setActionLoading(prev => ({ ...prev, [requesterId]: false }));
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (window.confirm('Are you sure you want to remove this friend?')) {
      setActionLoading(prev => ({ ...prev, [friendId]: true }));
      try {
        const result = await removeFriend(user.uid, friendId);
        if (result.success) {
          toast.success('Friend removed');
          await fetchFriendsData(); // Refresh data
        } else {
          toast.error(result.error || 'Failed to remove friend');
        }
      } catch (error) {
        console.error('Error removing friend:', error);
        toast.error('Error removing friend');
      } finally {
        setActionLoading(prev => ({ ...prev, [friendId]: false }));
      }
    }
  };

  const getCurrentList = () => {
    switch (activeTab) {
      case 'friends':
        return friends;
      case 'requests':
        return friendRequests;
      case 'sent':
        return sentRequests;
      default:
        return [];
    }
  };

  const currentList = getCurrentList();
  const totalCount = friends.length + friendRequests.length + sentRequests.length;

  if (totalCount === 0 && !loading) {
    return null;
  }

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <UsersIcon className="w-5 h-5 text-blue-500" />
          <span>Friends</span>
        </h3>
        
        {/* Tab Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
              activeTab === 'friends'
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 relative ${
              activeTab === 'requests'
                ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Requests ({friendRequests.length})
            {friendRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
              activeTab === 'sent'
                ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Sent ({sentRequests.length})
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : currentList.length > 0 ? (
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {currentList.map((person) => (
            <div
              key={person.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <Link
                to={`/user/${person.id}`}
                className="flex items-center space-x-3 flex-1 hover:opacity-80 transition-opacity duration-200"
              >
                <img
                  src={person.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.displayName || 'User')}&background=3b82f6&color=ffffff&size=40`}
                  alt={person.displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
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
              </Link>
              
              <div className="flex items-center space-x-2">
                {activeTab === 'friends' && (
                  <button
                    onClick={() => handleRemoveFriend(person.id)}
                    disabled={actionLoading[person.id]}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    title="Remove friend"
                  >
                    <UserMinusIcon className="w-4 h-4" />
                  </button>
                )}
                
                {activeTab === 'requests' && (
                  <>
                    <button
                      onClick={() => handleAcceptRequest(person.id)}
                      disabled={actionLoading[person.id]}
                      className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors duration-200 disabled:opacity-50"
                      title="Accept request"
                    >
                      <CheckIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRejectRequest(person.id)}
                      disabled={actionLoading[person.id]}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200 disabled:opacity-50"
                      title="Reject request"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </>
                )}
                
                {activeTab === 'sent' && (
                  <div className="flex items-center space-x-1 text-yellow-600">
                    <ClockIcon className="w-4 h-4" />
                    <span className="text-xs">Pending</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {activeTab === 'friends' && 'No friends yet'}
            {activeTab === 'requests' && 'No friend requests'}
            {activeTab === 'sent' && 'No sent requests'}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {activeTab === 'friends' && 'Send friend requests to connect with people'}
            {activeTab === 'requests' && 'Friend requests will appear here'}
            {activeTab === 'sent' && 'Your sent requests will appear here'}
          </p>
        </div>
      )}
    </div>
  );
};

export default FriendsManager;