import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class PublicProfileService extends ChangeNotifier {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  Map<String, dynamic>? _profileData;
  bool _isLoading = false;
  String? _currentProfileUsername;
  
  // Getters
  Map<String, dynamic>? get profileData => _profileData;
  bool get isLoading => _isLoading;
  String? get currentProfileUsername => _currentProfileUsername;
  
  // Load public profile by username (for viewing other users' profiles)
  Future<bool> loadPublicProfile(String username) async {
    if (username == _currentProfileUsername && _profileData != null) {
      // Already loaded this profile
      return true;
    }
    
    _isLoading = true;
    _currentProfileUsername = username;
    notifyListeners();
    
    try {
      debugPrint('🔍 Loading public profile for username: $username');
      
      // Query Firestore for user with this username
      final querySnapshot = await _firestore
          .collection('users')
          .where('username', isEqualTo: username)
          .limit(1)
          .get();
      
      if (querySnapshot.docs.isNotEmpty) {
        _profileData = querySnapshot.docs.first.data();
        debugPrint('✅ Public profile loaded successfully for: $username');
        debugPrint('📊 Profile data: ${_profileData?['displayName']}, Social Links: ${(_profileData?['socialLinks'] as Map?)?.keys.length ?? 0}');
        
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        debugPrint('❌ No profile found for username: $username');
        _profileData = null;
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      debugPrint('❌ Error loading public profile for $username: $e');
      _profileData = null;
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
  
  // Clear current profile data
  void clearProfile() {
    _profileData = null;
    _currentProfileUsername = null;
    _isLoading = false;
    notifyListeners();
  }
  
  // Get profile URL for sharing
  String getProfileURL(String username) {
    return 'https://irtzalink.site/$username';
  }
  
  // Get QR code URL for profile
  String getQRCodeURL(String username) {
    return 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://irtzalink.site/$username';
  }
}