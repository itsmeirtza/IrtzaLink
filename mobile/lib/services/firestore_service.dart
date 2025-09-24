import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/user_profile.dart';
import '../models/app_link.dart';

final firestoreProvider = Provider<FirebaseFirestore?>((ref) {
  try {
    return FirebaseFirestore.instance;
  } catch (_) {
    return null;
  }
});

class FirestoreService {
  FirestoreService(this._db);
  final FirebaseFirestore? _db;

  CollectionReference<Map<String, dynamic>>? _users() => _db?.collection('users');
  CollectionReference<Map<String, dynamic>>? _links(String uid) => _db?.collection('users').doc(uid).collection('links');
  CollectionReference<Map<String, dynamic>>? _analytics(String uid) => _db?.collection('users').doc(uid).collection('analytics');

  Future<UserProfile?> fetchProfile(String uid) async {
    final ref = await _users()?.doc(uid).get();
    if (ref == null || !ref.exists) return null;
    return UserProfile.fromMap(ref.data()!..['id'] = ref.id);
  }

  Stream<UserProfile?> watchProfile(String uid) {
    final col = _users();
    if (col == null) return const Stream<UserProfile?>.empty();
    return col.doc(uid).snapshots().map((doc) => doc.exists ? UserProfile.fromMap(doc.data()!..['id'] = doc.id) : null);
  }

  Future<void> upsertProfile(UserProfile profile) async {
    await _users()?.doc(profile.id).set(profile.toMap(), SetOptions(merge: true));
  }

  Stream<List<AppLink>> watchLinks(String uid) {
    final col = _links(uid);
    if (col == null) return const Stream<List<AppLink>>.empty();
    return col.orderBy('order', descending: false).snapshots().map((qs) => qs.docs.map((d) => AppLink.fromMap(d.data()!..['id'] = d.id)).toList());
  }

  Future<void> addLink(String uid, AppLink link) async {
    await _links(uid)?.add(link.toMap());
  }

  Future<void> deleteLink(String uid, String linkId) async {
    await _links(uid)?.doc(linkId).delete();
  }

  Future<void> recordVisit(String uid) async {
    try {
      await _analytics(uid)?.doc('totals').set({'profileVisits': FieldValue.increment(1)}, SetOptions(merge: true));
    } catch (e) {
      debugPrint('recordVisit failed: $e');
    }
  }

  Stream<Map<String, int>> watchAnalytics(String uid) {
    final col = _analytics(uid);
    if (col == null) return const Stream<Map<String, int>>.empty();
    return col.doc('totals').snapshots().map((doc) {
      final data = doc.data();
      return {
        'profileVisits': (data?['profileVisits'] as int?) ?? 0,
        'qrScans': (data?['qrScans'] as int?) ?? 0,
      };
    });
  }
}

final firestoreServiceProvider = Provider<FirestoreService>((ref) => FirestoreService(ref.watch(firestoreProvider)));
