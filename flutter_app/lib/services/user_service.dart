import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'dart:io';

class UserService extends ChangeNotifier {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;
  
  // User data
  String? _username;
  String? _displayName;
  String? _bio;
  String? _photoURL;
  Map<String, String> _socialLinks = {};
  Map<String, String> _contactInfo = {};
  String? _qrCodeURL;
  
  // Statistics
  int _profileViews = 0;
  int _qrScans = 0;
  int _totalLinks = 0;
  int _linkClicks = 0;
  
  bool _isLoading = false;
  
  // Getters
  String? get username => _username;
  String? get displayName => _displayName;
  String? get bio => _bio;
  String? get photoURL => _photoURL;
  Map<String, String> get socialLinks => _socialLinks;
  Map<String, String> get contactInfo => _contactInfo;
  String? get qrCodeURL => _qrCodeURL;
  
  int get profileViews => _profileViews;
  int get qrScans => _qrScans;
  int get totalLinks => _totalLinks;
  int get linkClicks => _linkClicks;
  
  bool get isLoading => _isLoading;
  
  // Initialize user data
  Future<void> initializeUser() async {
    final user = _auth.currentUser;
    if (user == null) return;
    
    _isLoading = true;
    notifyListeners();
    
    try {
      final doc = await _firestore.collection('users').doc(user.uid).get();
      
      if (doc.exists) {
        final data = doc.data()!;
        _username = data['username'] ?? user.displayName?.replaceAll(' ', '').toLowerCase();
        _displayName = data['displayName'] ?? user.displayName;
        _bio = data['bio'] ?? '';
        _photoURL = data['photoURL'] ?? user.photoURL;
        _socialLinks = Map<String, String>.from(data['socialLinks'] ?? {});
        _contactInfo = Map<String, String>.from(data['contactInfo'] ?? {});
        _qrCodeURL = data['qrCodeURL'] ?? '';
        
        // Statistics
        _profileViews = data['profileViews'] ?? 0;
        _qrScans = data['qrScans'] ?? 0;
        _totalLinks = _socialLinks.values.where((link) => link.isNotEmpty).length;
        _linkClicks = data['linkClicks'] ?? 0;
      } else {
        // Create new user document
        _username = user.displayName?.replaceAll(' ', '').toLowerCase() ?? 'user${DateTime.now().millisecondsSinceEpoch}';
        _displayName = user.displayName ?? 'User';
        _photoURL = user.photoURL;
        
        await _createUserDocument(user.uid);
      }
    } catch (e) {
      debugPrint('Error initializing user: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  // Create new user document in Firestore
  Future<void> _createUserDocument(String uid) async {
    await _firestore.collection('users').doc(uid).set({
      'username': _username,
      'displayName': _displayName,
      'bio': _bio ?? '',
      'photoURL': _photoURL ?? '',
      'socialLinks': _socialLinks,
      'contactInfo': _contactInfo,
      'qrCodeURL': _qrCodeURL ?? '',
      'profileViews': 0,
      'qrScans': 0,
      'linkClicks': 0,
      'isActive': true,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }
  
  // Update profile information
  Future<void> updateProfile({
    String? displayName,
    String? bio,
    String? photoURL,
  }) async {
    final user = _auth.currentUser;
    if (user == null) return;
    
    _isLoading = true;
    notifyListeners();
    
    try {
      final updates = <String, dynamic>{};
      
      if (displayName != null) {
        _displayName = displayName;
        updates['displayName'] = displayName;
      }
      
      if (bio != null) {
        _bio = bio;
        updates['bio'] = bio;
      }
      
      if (photoURL != null) {
        _photoURL = photoURL;
        updates['photoURL'] = photoURL;
      }
      
      updates['updatedAt'] = FieldValue.serverTimestamp();
      
      await _firestore.collection('users').doc(user.uid).update(updates);
    } catch (e) {
      debugPrint('Error updating profile: $e');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  // Update social media links
  Future<void> updateSocialLinks() async {
    final user = _auth.currentUser;
    if (user == null) return;
    
    _isLoading = true;
    notifyListeners();
    
    try {
      _totalLinks = _socialLinks.values.where((link) => link.isNotEmpty).length;
      
      await _firestore.collection('users').doc(user.uid).update({
        'socialLinks': _socialLinks,
        'contactInfo': _contactInfo,
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      debugPrint('Error updating social links: $e');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  // Upload profile photo
  Future<String?> uploadProfilePhoto(File imageFile) async {
    final user = _auth.currentUser;
    if (user == null) return null;
    
    try {
      final ref = _storage.ref().child('profile_photos').child('${user.uid}.jpg');
      await ref.putFile(imageFile);
      final url = await ref.getDownloadURL();
      
      await updateProfile(photoURL: url);
      return url;
    } catch (e) {
      debugPrint('Error uploading profile photo: $e');
      rethrow;
    }
  }
  
  // Generate and update QR code
  Future<void> generateQRCode() async {
    final user = _auth.currentUser;
    if (user == null) return;
    
    try {
      // This would typically call a Firebase Function to generate QR code
      final qrURL = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://irtzalink.com/$_username';
      
      _qrCodeURL = qrURL;
      
      await _firestore.collection('users').doc(user.uid).update({
        'qrCodeURL': qrURL,
        'updatedAt': FieldValue.serverTimestamp(),
      });
      
      notifyListeners();
    } catch (e) {
      debugPrint('Error generating QR code: $e');
      rethrow;
    }
  }
  
  // Get profile URL
  String getProfileURL() {
    return 'https://irtzalink.com/$_username';
  }
  
  // Clear user data
  void clearUserData() {
    _username = null;
    _displayName = null;
    _bio = null;
    _photoURL = null;
    _socialLinks.clear();
    _contactInfo.clear();
    _qrCodeURL = null;
    _profileViews = 0;
    _qrScans = 0;
    _totalLinks = 0;
    _linkClicks = 0;
    notifyListeners();
  }
}
  final FirebaseAuth _auth = FirebaseAuth.instance;
  
  Map<String, dynamic>? _userData;
  bool _isLoading = false;

  Map<String, dynamic>? get userData => _userData;
  bool get isLoading => _isLoading;

  // Get current user
  User? get currentUser => _auth.currentUser;

  // Load user data
  Future<void> loadUserData() async {
    if (_auth.currentUser == null) return;
    
    _isLoading = true;
    notifyListeners();

    try {
      final doc = await _firestore
          .collection('users')
          .doc(_auth.currentUser!.uid)
          .get();
      
      if (doc.exists) {
        _userData = doc.data();
      }
    } catch (e) {
      print('Error loading user data: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Update user profile
  Future<void> updateProfile({
    String? displayName,
    String? bio,
    String? website,
    String? profileImageUrl,
  }) async {
    if (_auth.currentUser == null) return;

    _isLoading = true;
    notifyListeners();

    try {
      final updates = <String, dynamic>{};
      if (displayName != null) updates['displayName'] = displayName;
      if (bio != null) updates['bio'] = bio;
      if (website != null) updates['website'] = website;
      if (profileImageUrl != null) updates['profileImageUrl'] = profileImageUrl;
      
      updates['updatedAt'] = FieldValue.serverTimestamp();

      await _firestore
          .collection('users')
          .doc(_auth.currentUser!.uid)
          .update(updates);

      _userData = {...?_userData, ...updates};
    } catch (e) {
      print('Error updating profile: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Clear user data
  void clearUserData() {
    _userData = null;
    notifyListeners();
  }
}