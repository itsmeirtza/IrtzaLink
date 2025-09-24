import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class FollowService {
  FollowService(this._db);
  final FirebaseFirestore? _db;

  DocumentReference<Map<String, dynamic>>? _userDoc(String uid) => _db?.collection('users').doc(uid);

  // Match web app behavior: store followers/following arrays on users/{uid}
  Future<void> follow(String followerUid, String followingUid) async {
    if (_db == null) return;
    if (followerUid == followingUid) return;
    final batch = _db!.batch();
    final followerRef = _userDoc(followerUid)!;
    final followingRef = _userDoc(followingUid)!;

    batch.update(followerRef, {
      'following': FieldValue.arrayUnion([followingUid]),
      'updatedAt': FieldValue.serverTimestamp(),
    });
    batch.update(followingRef, {
      'followers': FieldValue.arrayUnion([followerUid]),
      'updatedAt': FieldValue.serverTimestamp(),
    });
    await batch.commit();

    // Optional: Create notification in top-level "notifications" collection (parity with web)
    try {
      await _db!.collection('notifications').add({
        'toUserId': followingUid,
        'fromUserId': followerUid,
        'type': 'follow',
        'message': 'started following you',
        'read': false,
        'timestamp': FieldValue.serverTimestamp(),
      });
    } catch (_) {}
  }

  Future<void> unfollow(String followerUid, String followingUid) async {
    if (_db == null) return;
    final batch = _db!.batch();
    final followerRef = _userDoc(followerUid)!;
    final followingRef = _userDoc(followingUid)!;

    batch.update(followerRef, {
      'following': FieldValue.arrayRemove([followingUid]),
      'updatedAt': FieldValue.serverTimestamp(),
    });
    batch.update(followingRef, {
      'followers': FieldValue.arrayRemove([followerUid]),
      'updatedAt': FieldValue.serverTimestamp(),
    });
    await batch.commit();
  }

  // Relationship stream: friends, following, follower, none
  Stream<String> relationship(String currentUid, String targetUid) {
    final aRef = _userDoc(currentUid);
    final bRef = _userDoc(targetUid);
    if (aRef == null || bRef == null) return const Stream<String>.empty();

    final aSnap = aRef.snapshots();
    final bSnap = bRef.snapshots();

    return aSnap.asyncMap((aDoc) async {
      final bDoc = await bSnap.first;
      final aFollowing = List<String>.from((aDoc.data()?['following'] ?? const []) as List);
      final bFollowing = List<String>.from((bDoc.data()?['following'] ?? const []) as List);
      final aFollowsB = aFollowing.contains(targetUid);
      final bFollowsA = bFollowing.contains(currentUid) || List<String>.from((aDoc.data()?['followers'] ?? const []) as List).contains(targetUid) || List<String>.from((bDoc.data()?['followers'] ?? const []) as List).contains(currentUid);
      if (aFollowsB && bFollowsA) return 'friends';
      if (aFollowsB) return 'following';
      if (bFollowsA) return 'follower';
      return 'none';
    });
  }

  // Watch followers list (returns list of user ids)
  Stream<List<String>> watchFollowerIds(String uid) {
    final ref = _userDoc(uid);
    if (ref == null) return const Stream<List<String>>.empty();
    return ref.snapshots().map((snap) => List<String>.from((snap.data()?['followers'] ?? const []) as List));
  }

  // Watch following list (returns list of user ids)
  Stream<List<String>> watchFollowingIds(String uid) {
    final ref = _userDoc(uid);
    if (ref == null) return const Stream<List<String>>.empty();
    return ref.snapshots().map((snap) => List<String>.from((snap.data()?['following'] ?? const []) as List));
  }

  // Follow counts
  Stream<Map<String, int>> watchFollowCounts(String uid) {
    final ref = _userDoc(uid);
    if (ref == null) return const Stream<Map<String, int>>.empty();
    return ref.snapshots().map((snap) {
      final data = snap.data();
      final followers = (data?['followers'] as List?)?.length ?? 0;
      final following = (data?['following'] as List?)?.length ?? 0;
      return {'followers': followers, 'following': following};
    });
  }
}

final followServiceProvider = Provider<FollowService>((ref) {
  try {
    return FollowService(FirebaseFirestore.instance);
  } catch (_) {
    return FollowService(null);
  }
});
