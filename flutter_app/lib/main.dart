import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
// Enhanced services
import 'data/services/enhanced_auth_service.dart';
import 'core/services/app_initializer.dart';
// Keep old services for compatibility
import 'services/user_service.dart';
import 'services/public_profile_service.dart';
import 'services/theme_service.dart';
import 'services/analytics_service.dart';
// Enhanced screens
import 'presentation/screens/app_shell.dart';
import 'presentation/screens/auth/modern_auth_screen.dart';
// Keep old screens for fallback
import 'screens/splash_screen.dart';
import 'screens/init_error_screen.dart';
import 'utils/app_themes.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runZonedGuarded(() {
    runApp(const AppBootstrap());
  }, (error, stack) {
    // In release, this prevents hard crash on startup
    // Logs still helpful if attached to a logger
    // ignore: avoid_print
    print('Uncaught zone error: $error');
  });
}

class AppBootstrap extends StatelessWidget {
  const AppBootstrap({super.key});

  Future<void> _init() async {
    // Use enhanced app initializer for Firebase + Supabase
    await AppInitializer.initialize();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: _init(),
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const MaterialApp(
            debugShowCheckedModeBanner: false,
            home: SplashScreen(),
          );
        }
        if (snap.hasError) {
          return MaterialApp(
            debugShowCheckedModeBanner: false,
            home: InitErrorScreen(error: snap.error!, stack: snap.stackTrace),
          );
        }
        return const IrtzaLinkApp();
      },
    );
  }
}

class IrtzaLinkApp extends StatelessWidget {
  const IrtzaLinkApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // Enhanced auth service
        ChangeNotifierProvider(create: (_) => EnhancedAuthService()),
        // Keep old services for compatibility
        ChangeNotifierProvider(create: (_) => UserService()),
        ChangeNotifierProvider(create: (_) => PublicProfileService()),
        ChangeNotifierProvider(create: (_) => ThemeService()),
        ChangeNotifierProvider(create: (_) => AnalyticsService()),
      ],
      child: Consumer<ThemeService>(
        builder: (context, themeService, child) {
          return MaterialApp(
            title: 'IrtzaLink',
            theme: AppThemes.lightTheme,
            darkTheme: AppThemes.darkTheme,
            themeMode: themeService.themeMode,
            debugShowCheckedModeBanner: false,
            home: const AuthWrapper(),
            routes: {
              '/login': (context) => const LoginScreen(),
              '/home': (context) => const HomeScreen(),
              '/profile': (context) => const ProfileScreen(),
              '/settings': (context) => const SettingsScreen(),
              '/qr': (context) => const QRScreen(),
            },
          );
        },
      ),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer<EnhancedAuthService>(
      builder: (context, authService, child) {
        // Show splash screen while checking auth state
        if (authService.isLoading) {
          return const SplashScreen();
        }
        
        // Show modern auth screen if not authenticated
        if (!authService.isAuthenticated) {
          return const ModernAuthScreen();
        }
        
        // Show enhanced app shell when authenticated
        return const AppShell();
      },
    );
  }
}
