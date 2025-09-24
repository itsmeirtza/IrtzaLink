import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class FollowService {
  FollowService(this._db);
  final FirebaseFirestore? _db;

  CollectionReference<Map<String, dynamic>>? _follows() => _db?.collection('follows');

  Future<void> follow(String followerUid, String followingUid) async {
    final col = _follows();
    if (col == null) return;
    final id = '${followerUid}_$followingUid';
    await col.doc(id).set({
      'followerUid': followerUid,
      'followingUid': followingUid,
      'createdAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  Future<void> unfollow(String followerUid, String followingUid) async {
    final col = _follows();
    if (col == null) return;
    final id = '${followerUid}_$followingUid';
    await col.doc(id).delete();
  }

  Stream<String> relationship(String a, String b) {
    final col = _follows();
    if (col == null) return const Stream<String>.empty();
    final ab = col.doc('${a}_$b').snapshots();
    final ba = col.doc('${b}_$a').snapshots();

    return ab.asyncMap((abDoc) async {
      final baDoc = await ba.first;
      final aFollowsB = abDoc.exists;
      final bFollowsA = baDoc.exists;
      if (aFollowsB && bFollowsA) return 'friends';
      if (aFollowsB) return 'following';
      if (bFollowsA) return 'follow_back';
      return 'none';
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
