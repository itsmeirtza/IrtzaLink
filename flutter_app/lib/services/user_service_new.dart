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
  
  // Initialize user data - MAIN SYNC FIX
  Future<void> initializeUser() async {
    final user = _auth.currentUser;
    if (user == null) return;
    
    _isLoading = true;
    notifyListeners();
    
    try {
      debugPrint('🔥 Initializing user data from Firestore for: ${user.uid}');
      
      // Always try to get fresh data from Firestore first
      final doc = await _firestore.collection('users').doc(user.uid).get();
      
      if (doc.exists) {
        final data = doc.data()!;
        
        debugPrint('✅ User data loaded from Firestore: username=${data['username']}, socialLinks=${(data['socialLinks'] as Map?)?.keys.length ?? 0}');
        
        // Load data from Firestore
        _username = data['username'] ?? _generateUsername(user.displayName ?? user.email);
        _displayName = data['displayName'] ?? user.displayName ?? 'User';
        _bio = data['bio'] ?? '';
        _photoURL = data['photoURL'] ?? user.photoURL ?? '';
        _socialLinks = Map<String, String>.from(data['socialLinks'] ?? {});
        _contactInfo = Map<String, String>.from(data['contactInfo'] ?? {});
        _qrCodeURL = data['qrCodeURL'] ?? '';
        
        // Statistics
        _profileViews = data['profileViews'] ?? 0;
        _qrScans = data['qrScans'] ?? 0;
        _totalLinks = _socialLinks.values.where((link) => link.isNotEmpty).length;
        _linkClicks = data['linkClicks'] ?? 0;
        
        // Generate QR code if missing
        if (_qrCodeURL?.isEmpty ?? true) {
          await generateQRCode();
        }
        
      } else {
        debugPrint('📝 Creating new user document in Firestore');
        
        // Create new user document with proper structure
        _username = _generateUsername(user.displayName ?? user.email);
        _displayName = user.displayName ?? 'User';
        _photoURL = user.photoURL ?? '';
        _bio = '';
        _socialLinks = {
          'facebook': '',
          'instagram': '',
          'twitter': '',
          'tiktok': '',
          'youtube': '',
          'linkedin': '',
          'whatsapp': '',
          'telegram': '',
        };
        _contactInfo = {
          'phone': '',
          'email': user.email ?? '',
          'website': '',
        };
        
        await _createUserDocument(user.uid);
        await generateQRCode();
        
        debugPrint('✅ New user document created in Firestore');
      }
      
      // Setup real-time listener for data sync
      _setupRealtimeListener(user.uid);
      
      debugPrint('✅ User data initialization completed successfully');
      debugPrint('📈 Stats: ${_socialLinks.length} social links, ${_contactInfo.length} contact fields');
      
    } catch (e) {
      debugPrint('❌ Error initializing user: $e');
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
  
  // Generate username from display name or email
  String _generateUsername(String? input) {
    if (input == null || input.isEmpty) {
      return 'user${DateTime.now().millisecondsSinceEpoch}';
    }
    
    // If it's an email, use the part before @
    if (input.contains('@')) {
      input = input.split('@')[0];
    }
    
    // Clean up the username
    return input
        .toLowerCase()
        .replaceAll(RegExp(r'[^a-z0-9]'), '')
        .substring(0, input.length < 15 ? input.length : 15)
        .isNotEmpty ? input.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '').substring(0, input.length < 15 ? input.length : 15) : 'user${DateTime.now().millisecondsSinceEpoch}';
  }
  
  // Setup real-time listener for data sync
  void _setupRealtimeListener(String userId) {
    _firestore.collection('users').doc(userId).snapshots().listen(
      (snapshot) {
        if (snapshot.exists) {
          final data = snapshot.data()!;
          
          debugPrint('🔄 Real-time sync: User data updated from Firestore');
          
          // Update local data
          _username = data['username'] ?? _username;
          _displayName = data['displayName'] ?? _displayName;
          _bio = data['bio'] ?? _bio;
          _photoURL = data['photoURL'] ?? _photoURL;
          _socialLinks = Map<String, String>.from(data['socialLinks'] ?? _socialLinks);
          _contactInfo = Map<String, String>.from(data['contactInfo'] ?? _contactInfo);
          _qrCodeURL = data['qrCodeURL'] ?? _qrCodeURL;
          
          // Statistics
          _profileViews = data['profileViews'] ?? _profileViews;
          _qrScans = data['qrScans'] ?? _qrScans;
          _totalLinks = _socialLinks.values.where((link) => link.isNotEmpty).length;
          _linkClicks = data['linkClicks'] ?? _linkClicks;
          
          notifyListeners();
        }
      },
      onError: (error) {
        debugPrint('❌ Real-time sync error: $error');
      },
    );
  }
  
  // Track profile view
  Future<void> trackProfileView() async {
    final user = _auth.currentUser;
    if (user == null) return;
    
    try {
      _profileViews++;
      
      await _firestore.collection('users').doc(user.uid).update({
        'profileViews': FieldValue.increment(1),
        'lastViewedAt': FieldValue.serverTimestamp(),
      });
      
      // Log analytics
      await _firestore.collection('analytics').add({
        'userId': user.uid,
        'type': 'profile_view',
        'timestamp': FieldValue.serverTimestamp(),
        'userAgent': 'Flutter Mobile App',
      });
      
      notifyListeners();
    } catch (e) {
      debugPrint('Error tracking profile view: $e');
    }
  }
  
  // Track QR code scan
  Future<void> trackQRScan() async {
    final user = _auth.currentUser;
    if (user == null) return;
    
    try {
      _qrScans++;
      
      await _firestore.collection('users').doc(user.uid).update({
        'qrScans': FieldValue.increment(1),
      });
      
      // Log analytics
      await _firestore.collection('analytics').add({
        'userId': user.uid,
        'type': 'qr_scan',
        'timestamp': FieldValue.serverTimestamp(),
        'userAgent': 'Flutter Mobile App',
      });
      
      notifyListeners();
    } catch (e) {
      debugPrint('Error tracking QR scan: $e');
    }
  }
  
  // Track link click
  Future<void> trackLinkClick(String platform, String url) async {
    final user = _auth.currentUser;
    if (user == null) return;
    
    try {
      _linkClicks++;
      
      await _firestore.collection('users').doc(user.uid).update({
        'linkClicks': FieldValue.increment(1),
      });
      
      // Log analytics
      await _firestore.collection('analytics').add({
        'userId': user.uid,
        'type': 'link_click',
        'platform': platform,
        'url': url,
        'timestamp': FieldValue.serverTimestamp(),
        'userAgent': 'Flutter Mobile App',
      });
      
      notifyListeners();
    } catch (e) {
      debugPrint('Error tracking link click: $e');
    }
  }
  
  // Update username with availability check
  Future<bool> updateUsername(String newUsername) async {
    final user = _auth.currentUser;
    if (user == null) return false;
    
    // Check if username is available
    final querySnapshot = await _firestore
        .collection('users')
        .where('username', isEqualTo: newUsername)
        .get();
    
    if (querySnapshot.docs.isNotEmpty) {
      // Username already exists
      return false;
    }
    
    try {
      _username = newUsername;
      
      await _firestore.collection('users').doc(user.uid).update({
        'username': newUsername,
        'updatedAt': FieldValue.serverTimestamp(),
      });
      
      // Regenerate QR code with new username
      await generateQRCode();
      
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint('Error updating username: $e');
      return false;
    }
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
