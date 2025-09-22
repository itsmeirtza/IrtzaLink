import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:flutter/foundation.dart';
import '../../core/services/app_initializer.dart';

/// Enhanced authentication service with Firebase and Supabase integration
/// Supports email/password, Google Sign-In, and Apple Sign-In
class EnhancedAuthService extends ChangeNotifier {
  final FirebaseAuth _firebaseAuth = FirebaseAuth.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn();

  User? _currentUser;
  Map<String, dynamic>? _userData;
  bool _isLoading = false;
  String? _error;

  // Getters
  User? get currentUser => _currentUser;
  Map<String, dynamic>? get userData => _userData;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _currentUser != null;

  EnhancedAuthService() {
    _init();
  }

  void _init() {
    // Listen to Firebase Auth state changes
    _firebaseAuth.authStateChanges().listen(_onAuthStateChanged);
  }

  Future<void> _onAuthStateChanged(User? user) async {
    _setLoading(true);
    _currentUser = user;

    if (user != null) {
      try {
        // Link user to Supabase and get enhanced user data
        await AppInitializer.linkUserToSupabase(user);
        
        // Get user data from Supabase
        _userData = await AppInitializer.getUserFromSupabase(user.uid);
        
        print('✅ Auth state changed: User signed in (${user.uid.substring(0, 8)}...)');
      } catch (e) {
        print('❌ Error syncing user data: $e');
        _setError('Failed to sync user data');
      }
    } else {
      _userData = null;
      print('🚪 Auth state changed: User signed out');
    }

    _setLoading(false);
    notifyListeners();
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    _error = null;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    _isLoading = false;
    notifyListeners();
  }

  /// Sign up with email and password
  Future<UserCredential?> signUpWithEmailPassword(
    String email,
    String password,
  ) async {
    try {
      _setLoading(true);
      
      final userCredential = await _firebaseAuth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      // Send email verification
      if (userCredential.user != null && !userCredential.user!.emailVerified) {
        await userCredential.user!.sendEmailVerification();
      }

      return userCredential;
    } on FirebaseAuthException catch (e) {
      _handleFirebaseAuthException(e);
      return null;
    } catch (e) {
      _setError('Failed to create account: $e');
      return null;
    }
  }

  /// Sign in with email and password
  Future<UserCredential?> signInWithEmailPassword(
    String email,
    String password,
  ) async {
    try {
      _setLoading(true);
      
      final userCredential = await _firebaseAuth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      return userCredential;
    } on FirebaseAuthException catch (e) {
      _handleFirebaseAuthException(e);
      return null;
    } catch (e) {
      _setError('Failed to sign in: $e');
      return null;
    }
  }

  /// Sign in with Google
  Future<UserCredential?> signInWithGoogle() async {
    try {
      _setLoading(true);

      // Trigger the authentication flow
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      
      if (googleUser == null) {
        // User cancelled the sign-in
        _setLoading(false);
        return null;
      }

      // Obtain the auth details from the request
      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;

      // Create a new credential
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      // Sign in to Firebase with the Google credential
      final userCredential = await _firebaseAuth.signInWithCredential(credential);
      
      return userCredential;
    } on FirebaseAuthException catch (e) {
      _handleFirebaseAuthException(e);
      return null;
    } catch (e) {
      _setError('Failed to sign in with Google: $e');
      return null;
    }
  }

  /// Sign in with Apple (iOS only)
  Future<UserCredential?> signInWithApple() async {
    try {
      _setLoading(true);

      // Check if Apple Sign In is available
      if (!await SignInWithApple.isAvailable()) {
        _setError('Apple Sign In is not available on this device');
        return null;
      }

      // Request credential for Apple Sign In
      final appleCredential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );

      // Create OAuth credential for Firebase
      final oauthCredential = OAuthProvider("apple.com").credential(
        idToken: appleCredential.identityToken,
        accessToken: appleCredential.authorizationCode,
      );

      // Sign in to Firebase with the Apple credential
      final userCredential = await _firebaseAuth.signInWithCredential(oauthCredential);
      
      return userCredential;
    } on FirebaseAuthException catch (e) {
      _handleFirebaseAuthException(e);
      return null;
    } catch (e) {
      _setError('Failed to sign in with Apple: $e');
      return null;
    }
  }

  /// Sign out
  Future<void> signOut() async {
    try {
      _setLoading(true);

      // Sign out from Google if signed in with Google
      if (await _googleSignIn.isSignedIn()) {
        await _googleSignIn.signOut();
      }

      // Sign out from Firebase
      await _firebaseAuth.signOut();
      
      print('✅ User signed out successfully');
    } catch (e) {
      _setError('Failed to sign out: $e');
    }
  }

  /// Reset password
  Future<bool> resetPassword(String email) async {
    try {
      _setLoading(true);
      
      await _firebaseAuth.sendPasswordResetEmail(email: email);
      _setLoading(false);
      
      return true;
    } on FirebaseAuthException catch (e) {
      _handleFirebaseAuthException(e);
      return false;
    } catch (e) {
      _setError('Failed to send password reset email: $e');
      return false;
    }
  }

  /// Update user profile in Supabase
  Future<bool> updateUserProfile(Map<String, dynamic> data) async {
    if (_currentUser == null) {
      _setError('No user signed in');
      return false;
    }

    try {
      _setLoading(true);
      
      await AppInitializer.updateUserInSupabase(_currentUser!.uid, data);
      
      // Refresh user data
      _userData = await AppInitializer.getUserFromSupabase(_currentUser!.uid);
      
      _setLoading(false);
      notifyListeners();
      
      return true;
    } catch (e) {
      _setError('Failed to update profile: $e');
      return false;
    }
  }

  /// Refresh user data from Supabase
  Future<void> refreshUserData() async {
    if (_currentUser == null) return;

    try {
      _userData = await AppInitializer.getUserFromSupabase(_currentUser!.uid);
      notifyListeners();
    } catch (e) {
      print('❌ Failed to refresh user data: $e');
    }
  }

  /// Handle Firebase Auth exceptions
  void _handleFirebaseAuthException(FirebaseAuthException e) {
    String message;
    
    switch (e.code) {
      case 'user-not-found':
        message = 'No user found with this email address.';
        break;
      case 'wrong-password':
        message = 'Incorrect password.';
        break;
      case 'email-already-in-use':
        message = 'An account already exists with this email address.';
        break;
      case 'weak-password':
        message = 'Password is too weak. Use at least 6 characters.';
        break;
      case 'invalid-email':
        message = 'Invalid email address format.';
        break;
      case 'user-disabled':
        message = 'This user account has been disabled.';
        break;
      case 'too-many-requests':
        message = 'Too many failed attempts. Please try again later.';
        break;
      case 'operation-not-allowed':
        message = 'This sign-in method is not enabled.';
        break;
      default:
        message = e.message ?? 'An authentication error occurred.';
    }
    
    _setError(message);
  }

  /// Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}