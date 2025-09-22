import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:provider/provider.dart';
import '../../data/services/enhanced_auth_service.dart';
import 'home/modern_home_screen.dart';
import 'explore/explore_screen.dart';
import 'create/create_screen.dart';
import 'activity/activity_screen.dart';
import 'profile/enhanced_profile_screen.dart';

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
      icon: Icons.home_outlined,
      activeIcon: Icons.home,
      label: 'Home',
    ),
    AppTab(
      icon: Icons.search_outlined,
      activeIcon: Icons.search,
      label: 'Explore',
    ),
    AppTab(
      icon: Icons.add_box_outlined,
      activeIcon: Icons.add_box,
      label: 'Create',
    ),
    AppTab(
      icon: Icons.favorite_outline,
      activeIcon: Icons.favorite,
      label: 'Activity',
    ),
    AppTab(
      icon: Icons.person_outline,
      activeIcon: Icons.person,
      label: 'Profile',
    ),
  ];

  final List<Widget> _screens = const [
    ModernHomeScreen(),
    ExploreScreen(),
    CreateScreen(),
    ActivityScreen(),
    EnhancedProfileScreen(),
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