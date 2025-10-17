import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';

// Mock AuthService for testing
class MockAuthService {
  Future<UserCredential?> signInWithEmail(String email, String password) async {
    // Mock successful sign in
    return null; // Return null for testing
  }

  Future<UserCredential?> signUpWithEmail(String email, String password) async {
    // Mock successful sign up
    return null; // Return null for testing
  }

  Future<void> sendPasswordReset(String email) async {
    // Mock password reset
  }

  Future<UserCredential?> signInWithGoogle() async {
    // Mock Google sign in
    return null; // Return null for testing
  }

  Future<void> signOut() async {
    // Mock sign out
  }
}

// Mock provider for testing
final mockAuthServiceProvider = Provider<MockAuthService>((ref) => MockAuthService());
