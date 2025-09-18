import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'user_service.dart';

class AuthService extends ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  User? _user;
  Map<String, dynamic>? _userData;
  bool _isLoading = true;
  bool _hasDataPersistence = true;
  
  // Getters
  User? get user => _user;
  Map<String, dynamic>? get userData => _userData;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;
  bool get hasDataPersistence => _hasDataPersistence;

  AuthService() {
    // Listen to auth state changes
    _auth.authStateChanges().listen(_onAuthStateChanged);
    
    // Setup auth persistence
    _setupPersistence();
  }

  Future<void> _setupPersistence() async {
    try {
      await _auth.setPersistence(Persistence.LOCAL);
      _hasDataPersistence = true;
    } catch (e) {
      print('Error setting up auth persistence: $e');
      _hasDataPersistence = false;
    }
  }

  Future<void> _onAuthStateChanged(User? user) async {
    print('🔒 Auth state changed: ${user != null ? 'User signed in (${user!.uid.substring(0, 8)}...)' : 'User signed out'}');
    
    // If switching to a different user, clear previous data
    if (_user != null && user != null && _user!.uid != user.uid) {
      print('🔄 Different user detected, clearing previous data');
      _userData = null;
      await _clearUserCache();
    }
    
    _user = user;
    _isLoading = true;
    notifyListeners();

    if (user != null) {
      // User signed in, load their data with caching
      await _loadUserDataWithCache(user.uid);
      
      // Setup offline data persistence
      await _setupOfflineDataSync(user.uid);
      
      print('✅ User authentication complete for ${user.uid.substring(0, 8)}, ready to show home screen');
    } else {
      // User signed out, clear memory but keep cache
      _userData = null;
      print('🔐 Auth state changed: user signed out, memory cleared but cache preserved');
    }

    _isLoading = false;
    notifyListeners();
  }

  // Load user data with caching support
  Future<void> _loadUserDataWithCache(String uid) async {
    try {
      // Try to load from cache first (for quick startup)
      final cachedData = await _loadCachedUserData(uid);
      if (cachedData != null) {
        _userData = cachedData;
        notifyListeners();
      }

      // Then load from Firestore and update cache
      final docSnapshot = await _firestore.collection('users').doc(uid).get();
      if (docSnapshot.exists) {
        final freshData = docSnapshot.data()!;
        _userData = freshData;
        
        // Update cache
        await _cacheUserData(uid, freshData);
        
        notifyListeners();
      } else {
        // Create user document if it doesn't exist
        await _createUserDocument(uid);
      }
    } catch (e) {
      print('Error loading user data: $e');
      
      // Fall back to cached data if available
      if (_userData == null) {
        final cachedData = await _loadCachedUserData(uid);
        if (cachedData != null) {
          _userData = cachedData;
          notifyListeners();
        }
      }
    }
  }

  // Cache user data locally
  Future<void> _cacheUserData(String uid, Map<String, dynamic> data) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheData = {
        'data': data,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
        'uid': uid,
      };
      await prefs.setString('user_data_cache', json.encode(cacheData));
    } catch (e) {
      print('Error caching user data: $e');
    }
  }

  // Load cached user data
  Future<Map<String, dynamic>?> _loadCachedUserData(String uid) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheString = prefs.getString('user_data_cache');
      
      if (cacheString != null) {
        final cacheData = json.decode(cacheString);
        final cachedUid = cacheData['uid'];
        final timestamp = cacheData['timestamp'];
        
        // Use cache if it's for the same user and not too old (24 hours for better persistence)
        if (cachedUid == uid && 
            DateTime.now().millisecondsSinceEpoch - timestamp < 86400000) {
          print('Loading cached user data for faster login experience');
          return Map<String, dynamic>.from(cacheData['data']);
        }
      }
    } catch (e) {
      print('Error loading cached user data: $e');
    }
    return null;
  }

  // Setup offline data synchronization
  Future<void> _setupOfflineDataSync(String uid) async {
    try {
      // Enable offline persistence for Firestore
      await _firestore.enablePersistence();
      
      // Listen for user document changes with offline support
      _firestore.collection('users').doc(uid).snapshots().listen(
        (docSnapshot) {
          if (docSnapshot.exists) {
            final data = docSnapshot.data()!;
            _userData = data;
            
            // Update cache
            _cacheUserData(uid, data);
            
            notifyListeners();
          }
        },
        onError: (error) {
          print('Error in user data stream: $error');
        }
      );
    } catch (e) {
      print('Error setting up offline sync: $e');
    }
  }

  // Create user document
  Future<void> _createUserDocument(String uid) async {
    try {
      final userDoc = {
        'uid': uid,
        'email': _user?.email,
        'displayName': _user?.displayName,
        'photoURL': _user?.photoURL,
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
        'isActive': true,
        'followers': [],
        'following': [],
        'socialLinks': {},
        'contactInfo': {},
        'theme': 'dark',
      };

      await _firestore.collection('users').doc(uid).set(userDoc);
      _userData = userDoc;
      
      // Cache the new user data
      await _cacheUserData(uid, userDoc);
      
      notifyListeners();
    } catch (e) {
      print('Error creating user document: $e');
    }
  }

  // Sign in with email and password
  Future<UserCredential?> signInWithEmailAndPassword(
    String email, 
    String password
  ) async {
    try {
      _isLoading = true;
      notifyListeners();

      final credential = await _auth.signInWithEmailAndPassword(
        email: email, 
        password: password
      );
      
      return credential;
    } catch (e) {
      print('Sign in error: $e');
      rethrow;
    }
  }

  // Sign up with email and password
  Future<UserCredential?> signUpWithEmailAndPassword(
    String email, 
    String password
  ) async {
    try {
      _isLoading = true;
      notifyListeners();

      final credential = await _auth.createUserWithEmailAndPassword(
        email: email, 
        password: password
      );
      
      return credential;
    } catch (e) {
      print('Sign up error: $e');
      rethrow;
    }
  }

  // Sign in with Google (web and mobile support)
  Future<UserCredential?> signInWithGoogle() async {
    try {
      print('🔄 Starting Google sign-in...');
      _isLoading = true;
      notifyListeners();

      if (kIsWeb) {
        // Web: use popup flow
        final provider = GoogleAuthProvider();
        final credential = await _auth.signInWithPopup(provider);
        print('✅ Google sign-in successful (web)');
        return credential;
      } else {
        // Mobile: use google_sign_in for token, then Firebase credential
        print('📱 Starting Google sign-in for mobile...');
        
        final GoogleSignInAccount? gUser = await GoogleSignIn().signIn();
        if (gUser == null) {
          print('⚠️ Google sign-in cancelled by user');
          return null; // Don't throw exception for user cancellation
        }
        
        print('🔑 Getting Google authentication credentials...');
        final GoogleSignInAuthentication gAuth = await gUser.authentication;
        
        final oauthCred = GoogleAuthProvider.credential(
          accessToken: gAuth.accessToken,
          idToken: gAuth.idToken,
        );
        
        print('🔥 Signing in with Firebase...');
        final credential = await _auth.signInWithCredential(oauthCred);
        print('✅ Google sign-in successful! User: ${credential.user?.uid.substring(0, 8)}...');
        
        return credential;
      }
    } catch (e) {
      print('❌ Google sign-in error: $e');
      rethrow;
    } finally {
      print('🔄 Google sign-in process complete, setting loading to false');
      _isLoading = false;
      notifyListeners();
    }
  }

  // Sign out
  Future<void> signOut() async {
    try {
      _isLoading = true;
      notifyListeners();

      await _auth.signOut();
      
      // Clear user data from memory but keep cache for re-login
      _userData = null;
      
      // DON'T clear cache - keep it for faster re-login of same user
      print('🔐 User signed out, data cached for potential re-login');
      
    } catch (e) {
      print('Sign out error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Update user data
  Future<void> updateUserData(Map<String, dynamic> updates) async {
    if (_user == null) return;

    try {
      // Update locally immediately for UI responsiveness
      if (_userData != null) {
        _userData!.addAll(updates);
        _userData!['updatedAt'] = FieldValue.serverTimestamp();
        notifyListeners();
        
        // Update cache
        await _cacheUserData(_user!.uid, _userData!);
      }

      // Update in Firestore
      await _firestore.collection('users').doc(_user!.uid).update({
        ...updates,
        'updatedAt': FieldValue.serverTimestamp(),
      });
      
    } catch (e) {
      print('Error updating user data: $e');
      
      // Add to offline queue for later sync
      await _addToOfflineQueue(_user!.uid, updates);
    }
  }

  // Add updates to offline sync queue
  Future<void> _addToOfflineQueue(String uid, Map<String, dynamic> updates) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final queueKey = 'offline_updates_$uid';
      
      // Get existing queue
      final existingQueue = prefs.getStringList(queueKey) ?? [];
      
      // Add new update
      final updateData = {
        'updates': updates,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      };
      existingQueue.add(json.encode(updateData));
      
      await prefs.setStringList(queueKey, existingQueue);
      
    } catch (e) {
      print('Error adding to offline queue: $e');
    }
  }

  // Process offline queue when back online
  Future<void> _processOfflineQueue(String uid) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final queueKey = 'offline_updates_$uid';
      final queue = prefs.getStringList(queueKey) ?? [];
      
      if (queue.isEmpty) return;
      
      // Process each queued update
      for (final updateString in queue) {
        try {
          final updateData = json.decode(updateString);
          final updates = Map<String, dynamic>.from(updateData['updates']);
          
          await _firestore.collection('users').doc(uid).update({
            ...updates,
            'updatedAt': FieldValue.serverTimestamp(),
          });
          
        } catch (e) {
          print('Error processing queued update: $e');
        }
      }
      
      // Clear the queue after processing
      await prefs.remove(queueKey);
      
    } catch (e) {
      print('Error processing offline queue: $e');
    }
  }

  // Clear user cache
  Future<void> _clearUserCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('user_data_cache');
    } catch (e) {
      print('Error clearing user cache: $e');
    }
  }

  // Check if user data is stale and needs refresh
  bool isUserDataStale() {
    // Implementation depends on your needs
    return false;
  }

  // Force refresh user data
  Future<void> refreshUserData() async {
    if (_user != null) {
      await _loadUserDataWithCache(_user!.uid);
    }
  }
}