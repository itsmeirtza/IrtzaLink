import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../services/user_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/theme_switcher.dart';
import '../../utils/design_system.dart';
import '../profile/profile_screen.dart';
import '../qr/qr_screen.dart';
import '../settings/settings_screen.dart';
import '../links/links_screen.dart';
import '../analytics/analytics_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  
  final List<Widget> _screens = [
    const DashboardScreen(),
    const LinksScreen(),
    const QRScreen(),
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        selectedItemColor: Theme.of(context).primaryColor,
        unselectedItemColor: Colors.grey,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.link),
            label: 'Links',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.qr_code),
            label: 'QR Code',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final TextEditingController _searchController = TextEditingController();
  bool _isSearching = false;
  List<Map<String, dynamic>> _searchResults = [];
  
  @override
  Widget build(BuildContext context) {
    return Consumer<AuthService>(
      builder: (context, authService, child) {
        final user = authService.user;
        final userData = authService.userData;
        
        return Scaffold(
          appBar: AppBar(
            title: _isSearching 
                ? TextField(
                    controller: _searchController,
                    autofocus: true,
                    decoration: const InputDecoration(
                      border: InputBorder.none,
                      hintText: 'Search users...',
                    ),
                    style: TextStyle(
                      color: Theme.of(context).brightness == Brightness.dark 
                          ? Colors.white 
                          : Colors.black,
                    ),
                    onChanged: _performSearch,
                  )
                : Row(
                    children: [
                      CircleAvatar(
                        radius: 16,
                        backgroundImage: user?.photoURL != null 
                            ? CachedNetworkImageProvider(user!.photoURL!) 
                            : null,
                        backgroundColor: Colors.blue,
                        child: user?.photoURL == null 
                            ? const Icon(Icons.person, color: Colors.white, size: 18) 
                            : null,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Text(
                              'IrtzaLink',
                              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                            if (userData?['username'] != null)
                              Text(
                                '@${userData!['username']}',
                                style: const TextStyle(fontSize: 14, color: Colors.grey),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
            elevation: 0,
            backgroundColor: Colors.transparent,
            leading: _isSearching 
                ? IconButton(
                    icon: const Icon(Icons.arrow_back),
                    onPressed: () {
                      setState(() {
                        _isSearching = false;
                        _searchController.clear();
                        _searchResults.clear();
                      });
                    },
                  )
                : null,
            actions: [
              if (!_isSearching) ...[
                IconButton(
                  icon: const Icon(Icons.search),
                  onPressed: () {
                    setState(() {
                      _isSearching = true;
                    });
                  },
                ),
                const CompactThemeSwitcher(),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.notifications_outlined),
                  onPressed: () => _showNotifications(context),
                ),
                PopupMenuButton(
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: 'admin',
                      child: Row(
                        children: [
                          Icon(Icons.admin_panel_settings, size: 20),
                          SizedBox(width: 8),
                          Text('Admin Panel'),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'settings',
                      child: Row(
                        children: [
                          Icon(Icons.settings, size: 20),
                          SizedBox(width: 8),
                          Text('Settings'),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'logout',
                      child: Row(
                        children: [
                          Icon(Icons.logout, size: 20),
                          SizedBox(width: 8),
                          Text('Logout'),
                        ],
                      ),
                    ),
                  ],
                  onSelected: (value) {
                    switch (value) {
                      case 'admin':
                        _showAdminPanel(context);
                        break;
                      case 'settings':
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => const SettingsScreen()),
                        );
                        break;
                      case 'logout':
                        _showLogoutDialog(context);
                        break;
                    }
                  },
                ),
              ],
            ],
          ),
          body: _isSearching && _searchResults.isNotEmpty
              ? _buildSearchResults()
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Welcome Section
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Row(
                            children: [
                              CircleAvatar(
                                radius: 30,
                                backgroundColor: Colors.blue,
                                backgroundImage: user?.photoURL != null 
                                    ? NetworkImage(user!.photoURL!) 
                                    : null,
                                child: user?.photoURL == null 
                                    ? const Icon(
                                        Icons.person, 
                                        size: 30, 
                                        color: Colors.white,
                                      )
                                    : null,
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Welcome back, ${userData?['displayName'] ?? user?.displayName ?? 'User'}!',
                                      style: Theme.of(context).textTheme.titleLarge,
                                    ),
                                    Text(
                                      userData?['username'] != null 
                                          ? '@${userData!['username']}' 
                                          : user?.email ?? 'Manage your personal links',
                                      style: Theme.of(context).textTheme.bodyMedium,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      
                      // Quick Stats
                      const Text(
                        'Quick Stats',
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: _buildStatCard(
                              context,
                              'Profile Views',
                              '1,234',
                              Icons.visibility,
                              Colors.blue,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _buildStatCard(
                              context,
                              'QR Scans',
                              '567',
                              Icons.qr_code_scanner,
                              Colors.green,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: _buildStatCard(
                              context,
                              'Total Links',
                              '8',
                              Icons.link,
                              Colors.orange,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _buildStatCard(
                              context,
                              'Link Clicks',
                              '2,891',
                              Icons.mouse,
                              Colors.purple,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      
                      // Quick Actions
                      const Text(
                        'Quick Actions',
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 10),
                      GridView.count(
                        crossAxisCount: 2,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        childAspectRatio: 1.5,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                        children: [
                          _buildActionCard(
                            context,
                            'Edit Profile',
                            Icons.edit,
                            Colors.blue,
                            () => Navigator.push(
                              context,
                              MaterialPageRoute(builder: (context) => const ProfileScreen()),
                            ),
                          ),
                          _buildActionCard(
                            context,
                            'View QR Code',
                            Icons.qr_code,
                            Colors.green,
                            () => Navigator.push(
                              context,
                              MaterialPageRoute(builder: (context) => const QRScreen()),
                            ),
                          ),
                          _buildActionCard(
                            context,
                            'Share Profile',
                            Icons.share,
                            Colors.orange,
                            () {
                              // TODO: Implement share functionality
                            },
                          ),
                          _buildActionCard(
                            context,
                            'Analytics',
                            Icons.analytics,
                            Colors.purple,
                            () => Navigator.push(
                              context,
                              MaterialPageRoute(builder: (context) => const AnalyticsScreen()),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
        );
      },
    );
  }

  void _performSearch(String query) async {
    if (query.isEmpty) {
      setState(() {
        _searchResults.clear();
      });
      return;
    }

    // Simulate search results
    await Future.delayed(const Duration(milliseconds: 300));
    setState(() {
      _searchResults = [
        {
          'username': 'itsmeirtza',
          'displayName': 'Irtza',
          'isVerified': true,
          'profileImage': null,
        },
        {
          'username': 'ialiwaris',
          'displayName': 'Ali Waris',
          'isVerified': true,
          'profileImage': null,
        },
      ].where((user) => 
          (user['username'] as String).toLowerCase().contains(query.toLowerCase()) ||
          (user['displayName'] as String).toLowerCase().contains(query.toLowerCase())
      ).toList();
    });
  }

  Widget _buildSearchResults() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _searchResults.length,
      itemBuilder: (context, index) {
        final user = _searchResults[index];
        return Card(
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: Colors.blue,
              child: Text(
                (user['displayName'] as String)[0].toUpperCase(),
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
            title: Row(
              children: [
                Text(user['displayName'] as String),
                if (user['isVerified'] as bool) 
                  const Padding(
                    padding: EdgeInsets.only(left: 4),
                    child: Icon(Icons.verified, color: Colors.blue, size: 16),
                  ),
              ],
            ),
            subtitle: Text('@${user['username']}'),
            trailing: ElevatedButton(
              onPressed: () => _followUser(user['username'] as String),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
                minimumSize: const Size(80, 32),
              ),
              child: const Text('Follow'),
            ),
            onTap: () => _viewProfile(user['username'] as String),
          ),
        );
      },
    );
  }

  void _followUser(String username) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Following @$username'),
        backgroundColor: Colors.green,
      ),
    );
  }

  void _viewProfile(String username) {
    // Navigate to user profile
  }

  void _showNotifications(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Notifications',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ListView(
                children: [
                  _buildNotificationItem(
                    'New follower',
                    '@ialiwaris started following you',
                    Icons.person_add,
                    Colors.blue,
                  ),
                  _buildNotificationItem(
                    'Profile view',
                    'Someone viewed your profile',
                    Icons.visibility,
                    Colors.green,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationItem(
    String title,
    String subtitle,
    IconData icon,
    Color color,
  ) {
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: color.withOpacity(0.1),
        child: Icon(icon, color: color),
      ),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: const Text(
        '2m ago',
        style: TextStyle(color: Colors.grey, fontSize: 12),
      ),
    );
  }

  void _showAdminPanel(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        builder: (context, scrollController) => Container(
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.admin_panel_settings, color: Colors.red),
                    const SizedBox(width: 8),
                    Text(
                      'Admin Panel',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Expanded(
                  child: ListView(
                    controller: scrollController,
                    children: [
                      _buildAdminSection('User Management', [
                        _buildAdminAction('View All Users', Icons.people, () {}),
                        _buildAdminAction('Manage Verified Users', Icons.verified, () {}),
                        _buildAdminAction('User Reports', Icons.report, () {}),
                      ]),
                      _buildAdminSection('Analytics', [
                        _buildAdminAction('System Statistics', Icons.analytics, () {}),
                        _buildAdminAction('Usage Reports', Icons.insert_chart, () {}),
                      ]),
                      _buildAdminSection('Settings', [
                        _buildAdminAction('App Configuration', Icons.settings, () {}),
                        _buildAdminAction('Feature Flags', Icons.flag, () {}),
                      ]),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAdminSection(String title, List<Widget> actions) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            ...actions,
          ],
        ),
      ),
    );
  }

  Widget _buildAdminAction(String title, IconData icon, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon, color: Colors.blue),
      title: Text(title),
      trailing: const Icon(Icons.arrow_forward_ios, size: 16),
      onTap: onTap,
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              // Real logout using AuthService
              final authService = Provider.of<AuthService>(context, listen: false);
              await authService.signOut();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
    BuildContext context,
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Icon(icon, color: color, size: 30),
            const SizedBox(height: 8),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              title,
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard(
    BuildContext context,
    String title,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: color, size: 30),
              const SizedBox(height: 8),
              Text(
                title,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
