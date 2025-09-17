import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class AnalyticsService extends ChangeNotifier {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  
  bool _isLoading = false;
  
  // Growth percentages
  double _viewsGrowth = 12.5;
  double _scansGrowth = 8.3;
  double _clicksGrowth = 15.7;
  double _visitorsGrowth = 9.2;
  
  // Unique visitors count
  int _uniqueVisitors = 234;
  
  // Chart data
  List<Map<String, dynamic>> _profileViewsData = [];
  List<Map<String, dynamic>> _qrScansData = [];
  
  // Link clicks data
  List<Map<String, dynamic>> _linkClicks = [];
  
  // Demographics data
  List<Map<String, dynamic>> _topCountries = [];
  List<Map<String, dynamic>> _deviceTypes = [];
  
  // Referrers data
  List<Map<String, dynamic>> _topReferrers = [];
  
  // Recent activity
  List<Map<String, dynamic>> _recentActivity = [];
  
  // Getters
  bool get isLoading => _isLoading;
  double get viewsGrowth => _viewsGrowth;
  double get scansGrowth => _scansGrowth;
  double get clicksGrowth => _clicksGrowth;
  double get visitorsGrowth => _visitorsGrowth;
  int get uniqueVisitors => _uniqueVisitors;
  
  List<Map<String, dynamic>> get profileViewsData => _profileViewsData;
  List<Map<String, dynamic>> get qrScansData => _qrScansData;
  List<Map<String, dynamic>> get linkClicks => _linkClicks;
  List<Map<String, dynamic>> get topCountries => _topCountries;
  List<Map<String, dynamic>> get deviceTypes => _deviceTypes;
  List<Map<String, dynamic>> get topReferrers => _topReferrers;
  List<Map<String, dynamic>> get recentActivity => _recentActivity;
  
  // Load analytics data
  Future<void> loadAnalytics() async {
    final user = _auth.currentUser;
    if (user == null) return;
    
    _isLoading = true;
    notifyListeners();
    
    try {
      // Load chart data
      await _loadChartData(user.uid);
      
      // Load link clicks
      await _loadLinkClicks(user.uid);
      
      // Load demographics
      _loadDemographics();
      
      // Load referrers
      _loadReferrers();
      
      // Load recent activity
      await _loadRecentActivity(user.uid);
      
    } catch (e) {
      debugPrint('Error loading analytics: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  // Load chart data from Firestore
  Future<void> _loadChartData(String userId) async {
    try {
      // Get last 7 days of analytics data
      final now = DateTime.now();
      final sevenDaysAgo = now.subtract(const Duration(days: 7));
      
      final analyticsQuery = await _firestore
          .collection('analytics')
          .where('userId', isEqualTo: userId)
          .where('timestamp', isGreaterThan: sevenDaysAgo)
          .orderBy('timestamp')
          .get();
      
      // Process profile views data
      _profileViewsData = _processChartData(analyticsQuery.docs, 'profile_view');
      
      // Process QR scans data
      _qrScansData = _processChartData(analyticsQuery.docs, 'qr_scan');
      
    } catch (e) {
      debugPrint('Error loading chart data: $e');
      // Fallback to demo data
      _profileViewsData = _getDemoProfileViewsData();
      _qrScansData = _getDemoQRScansData();
    }
  }
  
  // Process analytics documents into chart data
  List<Map<String, dynamic>> _processChartData(List<QueryDocumentSnapshot> docs, String type) {
    final Map<String, int> dailyCounts = {};
    
    for (final doc in docs) {
      final data = doc.data() as Map<String, dynamic>;
      if (data['type'] == type) {
        final timestamp = (data['timestamp'] as Timestamp?)?.toDate() ?? DateTime.now();
        final dateKey = '${timestamp.month}/${timestamp.day}';
        dailyCounts[dateKey] = (dailyCounts[dateKey] ?? 0) + 1;
      }
    }
    
    // Convert to chart data format
    return dailyCounts.entries.map((entry) => {
      'label': entry.key,
      'value': entry.value,
    }).toList();
  }
  
  // Load link clicks data
  Future<void> _loadLinkClicks(String userId) async {
    try {
      final linksQuery = await _firestore
          .collection('analytics')
          .where('userId', isEqualTo: userId)
          .where('type', isEqualTo: 'link_click')
          .get();
      
      final Map<String, Map<String, dynamic>> linkStats = {};
      
      for (final doc in linksQuery.docs) {
        final data = doc.data();
        final platform = data['platform'] ?? 'Unknown';
        final url = data['url'] ?? '';
        
        if (linkStats.containsKey(platform)) {
          linkStats[platform]!['clicks']++;
        } else {
          linkStats[platform] = {
            'platform': platform,
            'url': url,
            'clicks': 1,
          };
        }
      }
      
      _linkClicks = linkStats.values.toList();
      _linkClicks.sort((a, b) => (b['clicks'] as int).compareTo(a['clicks'] as int));
      
    } catch (e) {
      debugPrint('Error loading link clicks: $e');
      _linkClicks = _getDemoLinkClicks();
    }
  }
  
  // Load demographics data (demo data for now)
  void _loadDemographics() {
    _topCountries = [
      {'name': 'Pakistan', 'flag': '🇵🇰', 'percentage': 45},
      {'name': 'United States', 'flag': '🇺🇸', 'percentage': 23},
      {'name': 'United Kingdom', 'flag': '🇬🇧', 'percentage': 12},
      {'name': 'Canada', 'flag': '🇨🇦', 'percentage': 8},
      {'name': 'India', 'flag': '🇮🇳', 'percentage': 12},
    ];
    
    _deviceTypes = [
      {'name': 'Mobile', 'icon': Icons.phone_android, 'percentage': 68},
      {'name': 'Desktop', 'icon': Icons.computer, 'percentage': 25},
      {'name': 'Tablet', 'icon': Icons.tablet, 'percentage': 7},
    ];
  }
  
  // Load referrers data (demo data for now)
  void _loadReferrers() {
    _topReferrers = [
      {'source': 'Direct', 'icon': Icons.link, 'visits': 156},
      {'source': 'WhatsApp', 'icon': Icons.message, 'visits': 89},
      {'source': 'Instagram', 'icon': Icons.camera_alt, 'visits': 67},
      {'source': 'Facebook', 'icon': Icons.facebook, 'visits': 45},
      {'source': 'QR Code', 'icon': Icons.qr_code, 'visits': 34},
    ];
  }
  
  // Load recent activity
  Future<void> _loadRecentActivity(String userId) async {
    try {
      final recentQuery = await _firestore
          .collection('analytics')
          .where('userId', isEqualTo: userId)
          .orderBy('timestamp', descending: true)
          .limit(10)
          .get();
      
      _recentActivity = recentQuery.docs.map((doc) {
        final data = doc.data();
        final type = data['type'] ?? 'unknown';
        final timestamp = (data['timestamp'] as Timestamp?)?.toDate() ?? DateTime.now();
        
        String description;
        switch (type) {
          case 'profile_view':
            description = 'Someone viewed your profile';
            break;
          case 'qr_scan':
            description = 'QR code was scanned';
            break;
          case 'link_click':
            final platform = data['platform'] ?? 'Unknown';
            description = 'Someone clicked your $platform link';
            break;
          default:
            description = 'Unknown activity';
        }
        
        return {
          'type': type,
          'description': description,
          'timestamp': timestamp,
        };
      }).toList();
      
    } catch (e) {
      debugPrint('Error loading recent activity: $e');
      _recentActivity = _getDemoRecentActivity();
    }
  }
  
  // Demo data methods (fallback when Firebase is not available)
  List<Map<String, dynamic>> _getDemoProfileViewsData() {
    return [
      {'label': '12/11', 'value': 23},
      {'label': '12/12', 'value': 31},
      {'label': '12/13', 'value': 45},
      {'label': '12/14', 'value': 28},
      {'label': '12/15', 'value': 52},
      {'label': '12/16', 'value': 38},
      {'label': '12/17', 'value': 41},
    ];
  }
  
  List<Map<String, dynamic>> _getDemoQRScansData() {
    return [
      {'label': '12/11', 'value': 12},
      {'label': '12/12', 'value': 18},
      {'label': '12/13', 'value': 25},
      {'label': '12/14', 'value': 15},
      {'label': '12/15', 'value': 32},
      {'label': '12/16', 'value': 22},
      {'label': '12/17', 'value': 28},
    ];
  }
  
  List<Map<String, dynamic>> _getDemoLinkClicks() {
    return [
      {'platform': 'Instagram', 'url': '@yourhandle', 'clicks': 45},
      {'platform': 'Facebook', 'url': 'facebook.com/yourpage', 'clicks': 38},
      {'platform': 'WhatsApp', 'url': '+1234567890', 'clicks': 32},
      {'platform': 'LinkedIn', 'url': 'linkedin.com/in/you', 'clicks': 28},
      {'platform': 'Twitter', 'url': '@yourtwitter', 'clicks': 23},
    ];
  }
  
  List<Map<String, dynamic>> _getDemoRecentActivity() {
    final now = DateTime.now();
    return [
      {
        'type': 'profile_view',
        'description': 'Someone viewed your profile',
        'timestamp': now.subtract(const Duration(minutes: 5)),
      },
      {
        'type': 'link_click',
        'description': 'Someone clicked your Instagram link',
        'timestamp': now.subtract(const Duration(minutes: 12)),
      },
      {
        'type': 'qr_scan',
        'description': 'QR code was scanned',
        'timestamp': now.subtract(const Duration(minutes: 25)),
      },
      {
        'type': 'profile_view',
        'description': 'Someone viewed your profile',
        'timestamp': now.subtract(const Duration(hours: 1)),
      },
      {
        'type': 'link_click',
        'description': 'Someone clicked your Facebook link',
        'timestamp': now.subtract(const Duration(hours: 2)),
      },
    ];
  }
  
  // Track analytics event
  Future<void> trackEvent(String type, {Map<String, dynamic>? data}) async {
    final user = _auth.currentUser;
    if (user == null) return;
    
    try {
      final eventData = {
        'userId': user.uid,
        'type': type,
        'timestamp': FieldValue.serverTimestamp(),
        'userAgent': 'Mobile App',
        ...?data,
      };
      
      await _firestore.collection('analytics').add(eventData);
    } catch (e) {
      debugPrint('Error tracking event: $e');
    }
  }
}