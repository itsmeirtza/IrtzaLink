import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'features/auth/auth_gate.dart';
import 'features/auth/pages/sign_in_page.dart';
import 'features/auth/pages/sign_up_page.dart';
import 'features/auth/pages/reset_password_page.dart';
import 'features/dashboard/dashboard_page.dart';
import 'features/profile/profile_page.dart';
import 'features/profile/edit_profile_page.dart';
import 'features/analytics/analytics_page.dart';
import 'features/verification/verification_page.dart';
import 'features/settings/settings_page.dart';
import 'features/support/support_page.dart';
import 'features/notifications/notifications_page.dart';
import 'features/chats/chats_page.dart';
import 'features/chats/chat_thread_page.dart';
import 'features/follow/followers_page.dart';
import 'features/follow/following_page.dart';
import 'features/qr/qr_share_page.dart';
import 'features/qr/qr_scan_page.dart';
import 'features/search/search_page.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/gate',
    routes: [
      GoRoute(path: '/gate', builder: (c, s) => const AuthGate()),
      GoRoute(path: '/sign-in', builder: (c, s) => const SignInPage()),
      GoRoute(path: '/sign-up', builder: (c, s) => const SignUpPage()),
      GoRoute(path: '/reset', builder: (c, s) => const ResetPasswordPage()),
      GoRoute(path: '/search', builder: (c, s) => const SearchPage()),

      // Shell routes with bottom navigation
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return _NavShell(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: '/dashboard', builder: (c, s) => const DashboardPage()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/profile', builder: (c, s) => const ProfilePage()),
            GoRoute(path: '/profile/edit', builder: (c, s) => const EditProfilePage()),
            GoRoute(path: '/analytics', builder: (c, s) => const AnalyticsPage()),
            GoRoute(path: '/verification', builder: (c, s) => const VerificationPage()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/chats', builder: (c, s) => const ChatsPage()),
            GoRoute(path: '/chats/thread', builder: (c, s) => ChatThreadPage(chatId: s.uri.queryParameters['id'] ?? '')),
            GoRoute(path: '/followers', builder: (c, s) => const FollowersPage()),
            GoRoute(path: '/following', builder: (c, s) => const FollowingPage()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/notifications', builder: (c, s) => const NotificationsPage()),
            GoRoute(path: '/qr/share', builder: (c, s) => const QrSharePage()),
            GoRoute(path: '/qr/scan', builder: (c, s) => const QrScanPage()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/settings', builder: (c, s) => const SettingsPage()),
            GoRoute(path: '/support', builder: (c, s) => const SupportPage()),
          ]),
        ],
      ),
    ],
    redirect: (context, state) {
      // Basic redirect logic could be added here if needed.
      return null;
    },
  );
});

class _NavShell extends StatefulWidget {
  const _NavShell({required this.navigationShell});
  final StatefulNavigationShell navigationShell;

  @override
  State<_NavShell> createState() => _NavShellState();
}

class _NavShellState extends State<_NavShell> {
  int _currentIndex = 0;

  void _goBranch(int index) {
    setState(() => _currentIndex = index);
    widget.navigationShell.goBranch(index, initialLocation: index == _currentIndex);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: widget.navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: _goBranch,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: 'Dashboard'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile'),
          NavigationDestination(icon: Icon(Icons.chat_bubble_outline), selectedIcon: Icon(Icons.chat_bubble), label: 'Chats'),
          NavigationDestination(icon: Icon(Icons.notifications_outlined), selectedIcon: Icon(Icons.notifications), label: 'Alerts'),
          NavigationDestination(icon: Icon(Icons.settings_outlined), selectedIcon: Icon(Icons.settings), label: 'Settings'),
        ],
      ),
    );
  }
}
