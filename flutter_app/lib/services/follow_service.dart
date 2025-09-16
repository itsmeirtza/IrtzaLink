import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class FollowService extends ChangeNotifier {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  // Cache for follow data
  final Map<String, Map<String, dynamic>> _followCache = {};
  final Map<String, List<String>> _followersCache = {};
  final Map<String, List<String>> _followingCache = {};
  
  // Follow a user
  Future<bool> followUser(String currentUserId, String targetUserId) async {
    if (currentUserId == targetUserId) return false;
    
    try {
      // Update both users' documents atomically
      final batch = _firestore.batch();
      
      // Add target to current user's following list
      final currentUserRef = _firestore.collection('users').doc(currentUserId);
      batch.update(currentUserRef, {
        'following': FieldValue.arrayUnion([targetUserId]),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      
      // Add current user to target's followers list
      final targetUserRef = _firestore.collection('users').doc(targetUserId);
      batch.update(targetUserRef, {
        'followers': FieldValue.arrayUnion([currentUserId]),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      
      await batch.commit();
      
      // Update local cache
      _updateFollowCache(currentUserId, targetUserId, 'follow');
      
      // Create notification
      await _createFollowNotification(currentUserId, targetUserId);
      
      notifyListeners();
      return true;
      
    } catch (e) {
      print('Error following user: $e');
      
      // Add to offline queue
      await _addToOfflineQueue(currentUserId, targetUserId, 'follow');
      return false;
    }
  }
  
  // Unfollow a user
  Future<bool> unfollowUser(String currentUserId, String targetUserId) async {
    if (currentUserId == targetUserId) return false;
    
    try {
      // Update both users' documents atomically
      final batch = _firestore.batch();
      
      // Remove target from current user's following list
      final currentUserRef = _firestore.collection('users').doc(currentUserId);
      batch.update(currentUserRef, {
        'following': FieldValue.arrayRemove([targetUserId]),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      
      // Remove current user from target's followers list
      final targetUserRef = _firestore.collection('users').doc(targetUserId);
      batch.update(targetUserRef, {
        'followers': FieldValue.arrayRemove([currentUserId]),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      
      await batch.commit();
      
      // Update local cache
      _updateFollowCache(currentUserId, targetUserId, 'unfollow');
      
      notifyListeners();
      return true;
      
    } catch (e) {
      print('Error unfollowing user: $e');
      
      // Add to offline queue
      await _addToOfflineQueue(currentUserId, targetUserId, 'unfollow');
      return false;
    }
  }
  
  // Check if current user is following target user
  Future<bool> isFollowing(String currentUserId, String targetUserId) async {
    if (currentUserId == targetUserId) return false;
    
    try {
      // Check cache first
      final cacheKey = '${currentUserId}_$targetUserId';
      if (_followCache.containsKey(cacheKey)) {
        return _followCache[cacheKey]!['isFollowing'] ?? false;
      }
      
      // Fetch from Firestore
      final currentUserDoc = await _firestore
          .collection('users')
          .doc(currentUserId)
          .get();
      
      if (currentUserDoc.exists) {
        final following = List<String>.from(
          currentUserDoc.data()?['following'] ?? []
        );
        final isFollowing = following.contains(targetUserId);
        
        // Update cache
        _followCache[cacheKey] = {'isFollowing': isFollowing};
        
        return isFollowing;
      }
      
      return false;
      
    } catch (e) {
      print('Error checking follow status: $e');
      return false;
    }
  }
  
  // Get follow relationship between two users
  Future<Map<String, dynamic>> getFollowRelationship(
    String currentUserId, 
    String targetUserId
  ) async {
    if (currentUserId == targetUserId) {
      return {'relationship': 'self'};
    }
    
    try {
      final results = await Future.wait([
        _firestore.collection('users').doc(currentUserId).get(),
        _firestore.collection('users').doc(targetUserId).get(),
      ]);
      
      final currentUserDoc = results[0];
      final targetUserDoc = results[1];
      
      if (!currentUserDoc.exists || !targetUserDoc.exists) {
        return {'relationship': 'none'};
      }
      
      final currentFollowing = List<String>.from(
        currentUserDoc.data()?['following'] ?? []
      );
      final currentFollowers = List<String>.from(
        currentUserDoc.data()?['followers'] ?? []
      );
      
      final currentFollowsTarget = currentFollowing.contains(targetUserId);
      final targetFollowsCurrent = currentFollowers.contains(targetUserId);
      
      String relationship;
      if (currentFollowsTarget && targetFollowsCurrent) {
        relationship = 'friends'; // Mutual following
      } else if (currentFollowsTarget) {
        relationship = 'following';
      } else if (targetFollowsCurrent) {
        relationship = 'follower';
      } else {
        relationship = 'none';
      }
      
      return {
        'relationship': relationship,
        'currentFollowsTarget': currentFollowsTarget,
        'targetFollowsCurrent': targetFollowsCurrent,
      };
      
    } catch (e) {
      print('Error getting follow relationship: $e');
      return {'relationship': 'none'};
    }
  }
  
  // Get user's followers
  Future<List<Map<String, dynamic>>> getFollowers(
    String userId, 
    {int limit = 50}
  ) async {
    try {
      // Check cache first
      if (_followersCache.containsKey(userId)) {
        return await _getUserDetailsFromIds(_followersCache[userId]!);
      }
      
      final userDoc = await _firestore.collection('users').doc(userId).get();
      
      if (userDoc.exists) {
        final followers = List<String>.from(
          userDoc.data()?['followers'] ?? []
        );
        
        // Cache the follower IDs
        _followersCache[userId] = followers.take(limit).toList();
        
        return await _getUserDetailsFromIds(
          followers.take(limit).toList()
        );
      }
      
      return [];
      
    } catch (e) {
      print('Error getting followers: $e');
      return [];
    }
  }
  
  // Get user's following
  Future<List<Map<String, dynamic>>> getFollowing(
    String userId, 
    {int limit = 50}
  ) async {
    try {
      // Check cache first
      if (_followingCache.containsKey(userId)) {
        return await _getUserDetailsFromIds(_followingCache[userId]!);
      }
      
      final userDoc = await _firestore.collection('users').doc(userId).get();
      
      if (userDoc.exists) {
        final following = List<String>.from(
          userDoc.data()?['following'] ?? []
        );
        
        // Cache the following IDs
        _followingCache[userId] = following.take(limit).toList();
        
        return await _getUserDetailsFromIds(
          following.take(limit).toList()
        );
      }
      
      return [];
      
    } catch (e) {
      print('Error getting following: $e');
      return [];
    }
  }
  
  // Get follow counts
  Future<Map<String, int>> getFollowCounts(String userId) async {
    try {
      final userDoc = await _firestore.collection('users').doc(userId).get();
      
      if (userDoc.exists) {
        final data = userDoc.data()!;
        final followersCount = (data['followers'] as List?)?.length ?? 0;
        final followingCount = (data['following'] as List?)?.length ?? 0;
        
        return {
          'followersCount': followersCount,
          'followingCount': followingCount,
        };
      }
      
      return {'followersCount': 0, 'followingCount': 0};
      
    } catch (e) {
      print('Error getting follow counts: $e');
      return {'followersCount': 0, 'followingCount': 0};
    }
  }
  
  // Helper method to get user details from IDs
  Future<List<Map<String, dynamic>>> _getUserDetailsFromIds(
    List<String> userIds
  ) async {
    if (userIds.isEmpty) return [];
    
    try {
      final List<Map<String, dynamic>> users = [];
      
      // Fetch in batches of 10 (Firestore limit)
      for (int i = 0; i < userIds.length; i += 10) {
        final batch = userIds.sublist(
          i, 
          i + 10 > userIds.length ? userIds.length : i + 10
        );
        
        final docs = await _firestore
            .collection('users')
            .where(FieldPath.documentId, whereIn: batch)
            .get();
        
        for (final doc in docs.docs) {
          if (doc.exists) {
            users.add({
              'uid': doc.id,
              ...doc.data(),
            });
          }
        }
      }
      
      return users;
      
    } catch (e) {
      print('Error getting user details: $e');
      return [];
    }
  }
  
  // Update follow cache
  void _updateFollowCache(String currentUserId, String targetUserId, String action) {
    final cacheKey = '${currentUserId}_$targetUserId';
    
    if (action == 'follow') {
      _followCache[cacheKey] = {'isFollowing': true};
      
      // Update following cache
      if (_followingCache.containsKey(currentUserId)) {
        _followingCache[currentUserId]!.add(targetUserId);
      }
      
      // Update followers cache
      if (_followersCache.containsKey(targetUserId)) {
        _followersCache[targetUserId]!.add(currentUserId);
      }
      
    } else if (action == 'unfollow') {
      _followCache[cacheKey] = {'isFollowing': false};
      
      // Update following cache
      if (_followingCache.containsKey(currentUserId)) {
        _followingCache[currentUserId]!.remove(targetUserId);
      }
      
      // Update followers cache
      if (_followersCache.containsKey(targetUserId)) {
        _followersCache[targetUserId]!.remove(currentUserId);
      }
    }
  }
  
  // Create follow notification
  Future<void> _createFollowNotification(
    String followerId, 
    String followingId
  ) async {
    try {
      await _firestore.collection('notifications').add({
        'userId': followingId,
        'fromUserId': followerId,
        'type': 'follow',
        'message': 'started following you',
        'read': false,
        'createdAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      print('Error creating follow notification: $e');
    }
  }
  
  // Add to offline queue
  Future<void> _addToOfflineQueue(
    String currentUserId, 
    String targetUserId, 
    String action
  ) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final queueKey = 'follow_offline_queue';
      
      final existingQueue = prefs.getStringList(queueKey) ?? [];
      
      final queueItem = {
        'currentUserId': currentUserId,
        'targetUserId': targetUserId,
        'action': action,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      };
      
      existingQueue.add(json.encode(queueItem));
      await prefs.setStringList(queueKey, existingQueue);
      
    } catch (e) {
      print('Error adding to offline queue: $e');
    }
  }
  
  // Process offline queue
  Future<void> processOfflineQueue() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final queueKey = 'follow_offline_queue';
      final queue = prefs.getStringList(queueKey) ?? [];
      
      if (queue.isEmpty) return;
      
      final processedItems = <String>[];
      
      for (final itemString in queue) {
        try {
          final item = json.decode(itemString);
          final currentUserId = item['currentUserId'];
          final targetUserId = item['targetUserId'];
          final action = item['action'];
          
          bool success = false;
          if (action == 'follow') {
            success = await followUser(currentUserId, targetUserId);
          } else if (action == 'unfollow') {
            success = await unfollowUser(currentUserId, targetUserId);
          }
          
          if (success) {
            processedItems.add(itemString);
          }
          
        } catch (e) {
          print('Error processing offline queue item: $e');
          processedItems.add(itemString); // Remove invalid items
        }
      }
      
      // Remove processed items
      final remainingQueue = queue.where(
        (item) => !processedItems.contains(item)
      ).toList();
      
      await prefs.setStringList(queueKey, remainingQueue);
      
    } catch (e) {
      print('Error processing offline queue: $e');
    }
  }
  
  // Clear all caches
  void clearCache() {
    _followCache.clear();
    _followersCache.clear();
    _followingCache.clear();
    notifyListeners();
  }
  
  // Clear cache for specific user
  void clearUserCache(String userId) {
    // Clear follow relationship caches involving this user
    _followCache.removeWhere((key, value) => key.contains(userId));
    _followersCache.remove(userId);
    _followingCache.remove(userId);
    notifyListeners();
  }
}