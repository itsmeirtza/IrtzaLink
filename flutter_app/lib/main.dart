import 'dart:async';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'services/auth_service.dart';
import 'services/user_service.dart';
import 'services/public_profile_service.dart';
import 'services/theme_service.dart';
import 'services/analytics_service.dart';
import 'screens/splash_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/profile/profile_screen.dart';
import 'screens/settings/settings_screen.dart';
import 'screens/qr/qr_screen.dart';
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
    // If google-services.json exists and plugin is applied, this will auto-pick config
    await Firebase.initializeApp();
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
        ChangeNotifierProvider(create: (_) => AuthService()),
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
    return Consumer<AuthService>(
      builder: (context, authService, child) {
        // Show splash screen while checking auth state
        if (authService.isLoading) {
          return const SplashScreen();
        }
        
        // Show login screen if not authenticated
        if (!authService.isAuthenticated) {
          return const LoginScreen();
        }
        
        // Show home screen if authenticated
        return const HomeScreen();
      },
    );
  }
}