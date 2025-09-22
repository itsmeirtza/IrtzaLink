import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/firebase_config.dart';
import '../config/supabase_config.dart';

/// Centralized app initialization service
/// Handles Firebase and Supabase initialization with proper error handling
class AppInitializer {
  static bool _isInitialized = false;

  /// Initialize Firebase and Supabase
  static Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      // Initialize Firebase
      await Firebase.initializeApp(
        options: FirebaseConfig.currentPlatform,
      );
      print('✅ Firebase initialized successfully');

      // Initialize Supabase
      await Supabase.initialize(
        url: SupabaseConfig.url,
        anonKey: SupabaseConfig.anonKey,
        debug: false, // Set to true for debugging
      );
      print('✅ Supabase initialized successfully');

      _isInitialized = true;
    } catch (e) {
      print('❌ App initialization failed: $e');
      rethrow;
    }
  }

  /// Get current Firebase user
  static User? get currentFirebaseUser => FirebaseAuth.instance.currentUser;

  /// Get Supabase client
  static SupabaseClient get supabase => Supabase.instance.client;

  /// Check if user is authenticated
  static bool get isAuthenticated => currentFirebaseUser != null;

  /// Link Firebase UID to Supabase user record
  static Future<void> linkUserToSupabase(User firebaseUser) async {
    try {
      final userData = {
        'user_id': firebaseUser.uid,
        'email': firebaseUser.email,
        'display_name': firebaseUser.displayName,
        'photo_url': firebaseUser.photoURL,
        'updated_at': DateTime.now().toIso8601String(),
      };

      // Upsert user data to Supabase
      await supabase
          .from(SupabaseConfig.usersTable)
          .upsert(userData, onConflict: 'user_id');

      print('✅ User linked to Supabase: ${firebaseUser.uid}');
    } catch (e) {
      print('❌ Failed to link user to Supabase: $e');
      throw Exception('Failed to sync user data with Supabase: $e');
    }
  }

  /// Get user data from Supabase by Firebase UID
  static Future<Map<String, dynamic>?> getUserFromSupabase(String uid) async {
    try {
      final response = await supabase
          .from(SupabaseConfig.usersTable)
          .select()
          .eq('user_id', uid)
          .maybeSingle();

      if (response != null) {
        print('✅ Found user in Supabase: ${uid.substring(0, 8)}...');
        return response;
      }
      
      print('ℹ️ User not found in Supabase: ${uid.substring(0, 8)}...');
      return null;
    } catch (e) {
      print('❌ Failed to get user from Supabase: $e');
      return null;
    }
  }

  /// Update user data in Supabase
  static Future<void> updateUserInSupabase(String uid, Map<String, dynamic> data) async {
    try {
      data['user_id'] = uid; // Ensure user_id is set
      data['updated_at'] = DateTime.now().toIso8601String();

      await supabase
          .from(SupabaseConfig.usersTable)
          .upsert(data, onConflict: 'user_id');

      print('✅ User data updated in Supabase: ${uid.substring(0, 8)}...');
    } catch (e) {
      print('❌ Failed to update user in Supabase: $e');
      throw Exception('Failed to update user data in Supabase: $e');
    }
  }

  /// Health check for services
  static Future<Map<String, bool>> healthCheck() async {
    final results = <String, bool>{};

    // Check Firebase
    try {
      final firebaseApp = Firebase.app();
      results['firebase'] = firebaseApp != null;
    } catch (e) {
      results['firebase'] = false;
    }

    // Check Supabase
    try {
      final response = await supabase.from(SupabaseConfig.usersTable).select('user_id').limit(1);
      results['supabase'] = response != null;
    } catch (e) {
      results['supabase'] = false;
    }

    return results;
  }
}