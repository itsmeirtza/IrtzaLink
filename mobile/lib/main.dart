import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:firebase_core/firebase_core.dart';

import 'app.dart';
import 'env.dart';
import 'firebase_options.dart';
import 'services/notification_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load .env if present (silent if missing)
  try {
    await dotenv.load(fileName: '.env', isOptional: true);
  } catch (_) {}

  // Initialize Firebase gracefully (supports building without google-services)
  bool firebaseReady = false;
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    firebaseReady = true;
    debugPrint('[IrtzaLink] Firebase initialized successfully');
  } catch (e) {
    debugPrint('[IrtzaLink] Firebase initialization failed: $e');
  }

  // Initialize Notifications (FCM)
  await NotificationService.ensureInitialized(firebaseReady: firebaseReady);

  runApp(const ProviderScope(child: IrtzaLinkApp()));
}
