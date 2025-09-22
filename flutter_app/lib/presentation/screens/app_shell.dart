import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:provider/provider.dart';
import '../../data/services/enhanced_auth_service.dart';
import '../../screens/home/home_screen.dart'; // Dashboard with user stats and links
import '../../screens/profile/profile_screen.dart'; // Profile management & social links
import '../../screens/analytics/analytics_screen.dart'; // Analytics & visit stats
import 'get_verified/get_verified_screen.dart'; // Get verified badge functionality
import '../../screens/settings/settings_screen.dart'; // Settings & preferences

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> with TickerProviderStateMixin {
  int _currentIndex = 0;
  late PageController _pageController;
  late List<AnimationController> _iconControllers;

  final List<AppTab> _tabs = [
    AppTab(
      icon: Icons.dashboard_outlined,
      activeIcon: Icons.dashboard,
      label: 'Dashboard',
    ),
    AppTab(
      icon: Icons.person_outline,
      activeIcon: Icons.person,
      label: 'Profile',
    ),
    AppTab(
      icon: Icons.analytics_outlined,
      activeIcon: Icons.analytics,
      label: 'Analytics',
    ),
    AppTab(
      icon: Icons.verified_outlined,
      activeIcon: Icons.verified,
      label: 'Get Verified',
    ),
    AppTab(
      icon: Icons.settings_outlined,
      activeIcon: Icons.settings,
      label: 'Settings',
    ),
  ];

  final List<Widget> _screens = const [
    HomeScreen(), // Dashboard - main hub with user stats
    ProfileScreen(), // Profile - manage bio, social links, photos
    AnalyticsScreen(), // Analytics - profile visits, QR scans
    GetVerifiedScreen(), // Get Verified - verification badge process
    SettingsScreen(), // Settings - theme, preferences, account
  ];

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _iconControllers = List.generate(
      _tabs.length,
      (index) => AnimationController(
        duration: const Duration(milliseconds: 200),
        vsync: this,
      ),
    );
    _iconControllers[0].forward(); // Animate first icon
  }

  @override
  void dispose() {
    _pageController.dispose();
    for (final controller in _iconControllers) {
      controller.dispose();
    }
    super.dispose();
  }

  void _onTabTapped(int index) {
    if (_currentIndex == index) return;

    setState(() {
      _currentIndex = index;
    });

    // Animate page transition
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOutCubic,
    );

    // Animate icons
    for (int i = 0; i < _iconControllers.length; i++) {
      if (i == index) {
        _iconControllers[i].forward();
      } else {
        _iconControllers[i].reverse();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _buildAppBar(context),
      drawer: _buildDrawer(context),
      body: PageView(
        controller: _pageController,
        physics: const NeverScrollableScrollPhysics(),
        children: _screens,
      ),
      bottomNavigationBar: _buildModernBottomNav(),
    );
  }

  Widget _buildModernBottomNav() {
    final theme = Theme.of(context);
    
    return Container(
      height: 90,
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        border: Border(
          top: BorderSide(
            color: theme.dividerColor.withOpacity(0.1),
            width: 0.5,
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(_tabs.length, (index) {
              return _buildNavItem(index);
            }),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index) {
    final tab = _tabs[index];
    final isActive = _currentIndex == index;
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: () => _onTabTapped(index),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Icon with animation
            AnimatedBuilder(
              animation: _iconControllers[index],
              builder: (context, child) {
                final scale = 1.0 + (_iconControllers[index].value * 0.1);
                return Transform.scale(
                  scale: scale,
                  child: Icon(
                    isActive ? tab.activeIcon : tab.icon,
                    size: 26,
                    color: isActive
                        ? theme.primaryColor
                        : theme.iconTheme.color?.withOpacity(0.6),
                  ),
                );
              },
            ),
            const SizedBox(height: 4),
            // Label with animation
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 200),
              style: TextStyle(
                fontSize: 12,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                color: isActive
                    ? theme.primaryColor
                    : theme.textTheme.bodySmall?.color?.withOpacity(0.6),
              ),
              child: Text(tab.label),
            ),
            // Active indicator
            const SizedBox(height: 2),
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: isActive ? 20 : 0,
              height: 2,
              decoration: BoxDecoration(
                color: theme.primaryColor,
                borderRadius: BorderRadius.circular(1),
              ),
            ),
          ],
        ),
      ),
    ).animate(target: isActive ? 1 : 0)
      .scaleXY(begin: 0.95, end: 1.0, duration: 200.ms, curve: Curves.easeOut);
  }

  PreferredSizeWidget? _buildAppBar(BuildContext context) {
    return AppBar(
      title: Text(_getPageTitle()),
      elevation: 0,
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      actions: [
        IconButton(
          icon: const Icon(Icons.notifications_outlined),
          onPressed: () {
            // Navigate to notifications
          },
        ),
        IconButton(
          icon: const Icon(Icons.search),
          onPressed: () {
            // Navigate to search
          },
        ),
      ],
    );
  }

  String _getPageTitle() {
    switch (_currentIndex) {
      case 0:
        return 'Dashboard';
      case 1:
        return 'Profile';
      case 2:
        return 'Analytics';
      case 3:
        return 'Get Verified';
      case 4:
        return 'Settings';
      default:
        return 'IrtzaLink';
    }
  }

  Widget _buildDrawer(BuildContext context) {
    return Drawer(
      child: Consumer<EnhancedAuthService>(
        builder: (context, authService, child) {
          final user = authService.currentUser;
          final userData = authService.userData;
          
          return ListView(
            padding: EdgeInsets.zero,
            children: [
              UserAccountsDrawerHeader(
                currentAccountPicture: CircleAvatar(
                  backgroundImage: user?.photoURL != null 
                      ? NetworkImage(user!.photoURL!) 
                      : null,
                  backgroundColor: Colors.blue,
                  child: user?.photoURL == null 
                      ? const Icon(Icons.person, color: Colors.white) 
                      : null,
                ),
                accountName: Text(userData?['display_name'] ?? user?.displayName ?? 'User'),
                accountEmail: Text(user?.email ?? ''),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.blue, Colors.purple],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
              ),
              ListTile(
                leading: const Icon(Icons.qr_code),
                title: const Text('QR Code'),
                onTap: () {
                  Navigator.pop(context);
                  // Navigate to QR screen
                },
              ),
              ListTile(
                leading: const Icon(Icons.admin_panel_settings),
                title: const Text('Admin Panel'),
                onTap: () {
                  Navigator.pop(context);
                  // Navigate to admin panel
                },
              ),
              ListTile(
                leading: const Icon(Icons.people),
                title: const Text('Follow Test'),
                onTap: () {
                  Navigator.pop(context);
                  // Navigate to follow test
                },
              ),
              ListTile(
                leading: const Icon(Icons.group),
                title: const Text('Followers'),
                onTap: () {
                  Navigator.pop(context);
                  // Navigate to followers
                },
              ),
              ListTile(
                leading: const Icon(Icons.person_add),
                title: const Text('Following'),
                onTap: () {
                  Navigator.pop(context);
                  // Navigate to following
                },
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.help),
                title: const Text('Contact Us'),
                onTap: () {
                  Navigator.pop(context);
                  // Navigate to contact
                },
              ),
              ListTile(
                leading: const Icon(Icons.privacy_tip),
                title: const Text('Privacy Policy'),
                onTap: () {
                  Navigator.pop(context);
                  // Navigate to privacy
                },
              ),
              ListTile(
                leading: const Icon(Icons.info),
                title: const Text('About Us'),
                onTap: () {
                  Navigator.pop(context);
                  // Navigate to about
                },
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.logout, color: Colors.red),
                title: const Text('Logout', style: TextStyle(color: Colors.red)),
                onTap: () async {
                  Navigator.pop(context);
                  await authService.signOut();
                },
              ),
            ],
          );
        },
      ),
    );
  }
}

class AppTab {
  final IconData icon;
  final IconData activeIcon;
  final String label;

  AppTab({
    required this.icon,
    required this.activeIcon,
    required this.label,
  });
}