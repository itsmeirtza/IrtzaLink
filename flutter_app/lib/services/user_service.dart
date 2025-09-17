import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class UserService extends ChangeNotifier {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
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