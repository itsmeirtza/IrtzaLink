import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';

final firebaseAuthProvider = Provider<FirebaseAuth?>((ref) {
  try {
    return FirebaseAuth.instance;
  } catch (_) {
    return null;
  }
});

final authStateProvider = StreamProvider<User?>((ref) {
  final auth = ref.watch(firebaseAuthProvider);
  if (auth == null) {
    // Ensure the app does not get stuck in a perpetual loading state when Firebase isn't configured yet.
    // Emit a single null value so the UI can navigate to the sign-in page.
    return Stream<User?>.value(null);
  }
  // Emit the current user immediately, then follow authentication state changes.
  return auth.authStateChanges().map((user) => user);
});

class AuthService {
  AuthService(this._auth);
  final FirebaseAuth? _auth;

  Future<UserCredential?> signInWithEmail(String email, String password) async {
    if (_auth == null) return null;
    return _auth!.signInWithEmailAndPassword(email: email, password: password);
  }

  Future<UserCredential?> signUpWithEmail(String email, String password) async {
    if (_auth == null) return null;
    return _auth!.createUserWithEmailAndPassword(email: email, password: password);
  }

  Future<void> sendPasswordReset(String email) async {
    if (_auth == null) return;
    await _auth!.sendPasswordResetEmail(email: email);
  }

  Future<UserCredential?> signInWithGoogle() async {
    if (_auth == null) return null;
    try {
      final googleUser = await GoogleSignIn().signIn();
      if (googleUser == null) return null;
      final googleAuth = await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      return _auth!.signInWithCredential(credential);
    } catch (e) {
      debugPrint('Google sign-in failed: $e');
      rethrow;
    }
  }

  Future<void> signOut() async {
    await GoogleSignIn().signOut();
    if (_auth != null) await _auth!.signOut();
  }
}

final authServiceProvider = Provider<AuthService>((ref) => AuthService(ref.watch(firebaseAuthProvider)));
