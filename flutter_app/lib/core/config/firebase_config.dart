import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

/// Firebase configuration for the IrtzaLink app
/// This matches the web app's Firebase configuration
class FirebaseConfig {
  static const FirebaseOptions android = FirebaseOptions(
    apiKey: "AIzaSyDc9vaKPD4XSdP1jhjto1VmcuheJcq0i8c",
    authDomain: "irtzalink-4d407.firebaseapp.com",
    projectId: "irtzalink-4d407",
    storageBucket: "irtzalink-4d407.firebasestorage.app",
    messagingSenderId: "342984685133",
    appId: "1:342984685133:web:19eb6d4bcfdd921ef38e04",
    measurementId: "G-3TDPN9HGJW",
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: "AIzaSyDc9vaKPD4XSdP1jhjto1VmcuheJcq0i8c", // Replace with iOS API key when available
    authDomain: "irtzalink-4d407.firebaseapp.com",
    projectId: "irtzalink-4d407",
    storageBucket: "irtzalink-4d407.firebasestorage.app",
    messagingSenderId: "342984685133",
    appId: "1:342984685133:ios:your-ios-app-id", // Replace with actual iOS App ID when available
    measurementId: "G-3TDPN9HGJW",
  );

  static FirebaseOptions get currentPlatform {
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError(
          'FirebaseOptions are not supported for this platform.',
        );
    }
  }
}