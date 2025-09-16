import React, { useState, useEffect } from 'react';
import { 
  followUser, 
  unfollowUser, 
  getFollowRelationship,
  getFollowCounts,
  getMutualFollowers,
  getUserFollowing,
  getUserFollowers 
} from '../services/firebase';
import toast from 'react-hot-toast';

const FollowTest = ({ user }) => {
  const [testUserId, setTestUserId] = useState('');
  const [relationship, setRelationship] = useState('');
  const [followCounts, setFollowCounts] = useState({ followersCount: 0, followingCount: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadFollowCounts();
    }
  }, [user?.uid]);

  const loadFollowCounts = async () => {
    if (!user?.uid) return;
    try {
      const result = await getFollowCounts(user.uid);
      if (result.success) {
        setFollowCounts(result);
      }
    } catch (error) {
      console.error('Error loading follow counts:', error);
    }
  };

  const checkRelationship = async () => {
    if (!testUserId || !user?.uid) {
      toast.error('Please enter a test user ID');
      return;
    }

    setLoading(true);
    try {
      const result = await getFollowRelationship(user.uid, testUserId);
      if (result.success) {
        setRelationship(result.relationship);
        toast.success(`Relationship: ${result.relationship}`);
      } else {
        toast.error('Failed to check relationship');
      }
    } catch (error) {
      console.error('Error checking relationship:', error);
      toast.error('Error checking relationship');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!testUserId || !user?.uid) {
      toast.error('Please enter a test user ID');
      return;
    }

    setLoading(true);
    try {
      const result = await followUser(user.uid, testUserId);
      if (result.success) {
        toast.success('Successfully followed user!');
        await checkRelationship();
        await loadFollowCounts();
      } else {
        toast.error(result.error || 'Failed to follow user');
      }
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Error following user');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!testUserId || !user?.uid) {
      toast.error('Please enter a test user ID');
      return;
    }

    setLoading(true);
    try {
      const result = await unfollowUser(user.uid, testUserId);
      if (result.success) {
        toast.success('Successfully unfollowed user!');
        await checkRelationship();
        await loadFollowCounts();
      } else {
        toast.error('Failed to unfollow user');
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast.error('Error unfollowing user');
    } finally {
      setLoading(false);
    }
  };

  const testMutualFollowers = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const result = await getMutualFollowers(user.uid);
      if (result.success) {
        console.log('Mutual followers:', result.data);
        toast.success(`Found ${result.data.length} mutual followers`);
      } else {
        toast.error('Failed to get mutual followers');
      }
    } catch (error) {
      console.error('Error getting mutual followers:', error);
      toast.error('Error getting mutual followers');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Please log in to test follow system</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Follow System Test
        </h1>

        {/* Current User Info */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Current User</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">UID: {user.uid}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Following: {followCounts.followingCount} | Followers: {followCounts.followersCount}
          </p>
        </div>

        {/* Test User Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Test User ID (UID)
          </label>
          <input
            type="text"
            value={testUserId}
            onChange={(e) => setTestUserId(e.target.value)}
            placeholder="Enter another user's UID to test with..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        {/* Current Relationship */}
        {relationship && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-400 mb-1">
              Current Relationship
            </h4>
            <p className="text-blue-800 dark:text-blue-300 capitalize">
              {relationship}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={checkRelationship}
            disabled={loading}
            className="btn-secondary"
          >
            Check Relationship
          </button>
          <button
            onClick={handleFollow}
            disabled={loading}
            className="btn-primary"
          >
            Follow
          </button>
          <button
            onClick={handleUnfollow}
            disabled={loading}
            className="btn-secondary"
          >
            Unfollow
          </button>
          <button
            onClick={testMutualFollowers}
            disabled={loading}
            className="btn-primary"
          >
            Get Mutual Followers
          </button>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h4 className="font-medium text-yellow-900 dark:text-yellow-400 mb-2">
            How to Test
          </h4>
          <ol className="text-sm text-yellow-800 dark:text-yellow-300 list-decimal list-inside space-y-1">
            <li>Get another user's UID from Firestore or create a test account</li>
            <li>Enter their UID in the input field above</li>
            <li>Click "Check Relationship" to see current status</li>
            <li>Use Follow/Unfollow buttons to test the system</li>
            <li>Check mutual followers to see who can chat with you</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default FollowTest;