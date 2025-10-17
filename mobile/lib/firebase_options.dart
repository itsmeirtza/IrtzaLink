import 'package:firebase_core/firebase_core.dart';

// Firebase configuration for IrtzaLink mobile app
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    // Use the correct configuration from Firebase Console
    return FirebaseOptions(
      apiKey: 'AIzaSyB0bdUjUA-iBEk6wubRqUkAAqju3BAiZGw',
      appId: '1:342984685133:android:ab735ceb6c3f425ff38e04',
      messagingSenderId: '342984685133',
      projectId: 'irtzalink-4d407',
      storageBucket: 'irtzalink-4d407.firebasestorage.app',
    );
  }
}
