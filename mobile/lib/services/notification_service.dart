import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final firebaseMessagingProvider = Provider<FirebaseMessaging?>((ref) {
  try {
    return FirebaseMessaging.instance;
  } catch (_) {
    return null;
  }
});

class NotificationService {
  static Future<void> ensureInitialized({required bool firebaseReady}) async {
    if (!firebaseReady) return;
    try {
      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission(provisional: true);
      // Get token and optionally save to Firestore under user profile
      final token = await messaging.getToken();
      if (token != null) {
        try {
          final user = FirebaseAuth.instance.currentUser;
          if (user != null) {
            await FirebaseFirestore.instance.collection('users').doc(user.uid).set({
              'fcmToken': token,
              'fcmUpdatedAt': FieldValue.serverTimestamp(),
            }, SetOptions(merge: true));
          }
        } catch (e) {
          debugPrint('Failed to save FCM token: $e');
        }
      }

      FirebaseMessaging.onBackgroundMessage(_backgroundHandler);
    } catch (e) {
      debugPrint('Notification init skipped: $e');
    }
  }
}

Future<void> _backgroundHandler(RemoteMessage message) async {
  // No-op background handler placeholder.
  return;
}
