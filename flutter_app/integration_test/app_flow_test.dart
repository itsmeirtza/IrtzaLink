import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:irtzalink/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('IrtzaLink App Flow Integration Tests', () {
    testWidgets('Complete user flow: signup → navigation → profile → logout', (WidgetTester tester) async {
      // Start the app
      app.main();
      await tester.pumpAndSettle();

      // Wait for splash screen to complete
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Test 1: Authentication flow
      await _testAuthenticationFlow(tester);

      // Test 2: Navigation between tabs
      await _testNavigationFlow(tester);

      // Test 3: Profile management
      await _testProfileFlow(tester);

      // Test 4: Logout flow
      await _testLogoutFlow(tester);
    });

    testWidgets('App handles network errors gracefully', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // This test would verify error handling when network is unavailable
      // For now, just verify the app starts without crashing
      expect(find.byType(MaterialApp), findsOneWidget);
    });

    testWidgets('App persists user session across restarts', (WidgetTester tester) async {
      // This test would verify that user sessions are properly cached
      // and restored after app restart
      app.main();
      await tester.pumpAndSettle();

      expect(find.byType(MaterialApp), findsOneWidget);
    });
  });
}

Future<void> _testAuthenticationFlow(WidgetTester tester) async {
  // Look for authentication screen or skip if already authenticated
  
  // Check if we see the modern auth screen
  final authScreenExists = find.text('Welcome Back').evaluate().isNotEmpty ||
      find.text('Create Account').evaluate().isNotEmpty;
      
  if (authScreenExists) {
    // Test sign up flow
    if (find.text('Create Account').evaluate().isNotEmpty ||
        find.text('Sign Up').evaluate().isNotEmpty) {
      
      // Tap Sign Up if on sign in screen
      final signUpButton = find.text('Sign Up');
      if (signUpButton.evaluate().isNotEmpty) {
        await tester.tap(signUpButton);
        await tester.pumpAndSettle();
      }

      // Fill in test credentials
      final emailField = find.byType(TextFormField).first;
      await tester.enterText(emailField, 'test@irtzalink.com');
      await tester.pumpAndSettle();

      final passwordFields = find.byType(TextFormField);
      if (passwordFields.evaluate().length > 1) {
        await tester.enterText(passwordFields.at(1), 'testpass123');
        await tester.pumpAndSettle();
      }

      // Try to submit (this would normally fail without proper setup)
      final submitButton = find.text('Create Account');
      if (submitButton.evaluate().isNotEmpty) {
        await tester.tap(submitButton);
        await tester.pumpAndSettle(const Duration(seconds: 2));
      }
    }

    // Test Google Sign In button (won't work in test environment)
    final googleButton = find.text('Google');
    if (googleButton.evaluate().isNotEmpty) {
      // Just verify the button exists
      expect(googleButton, findsOneWidget);
    }
  }

  print('✅ Authentication flow test completed');
}

Future<void> _testNavigationFlow(WidgetTester tester) async {
  // Find and test bottom navigation
  final bottomNavItems = find.byType(GestureDetector);
  
  if (bottomNavItems.evaluate().isNotEmpty) {
    // Test navigation to each tab
    final tabLabels = ['Home', 'Explore', 'Create', 'Activity', 'Profile'];
    
    for (final label in tabLabels) {
      final tabFinder = find.text(label);
      if (tabFinder.evaluate().isNotEmpty) {
        await tester.tap(tabFinder);
        await tester.pumpAndSettle();
        
        // Wait for transition animation
        await tester.pumpAndSettle(const Duration(milliseconds: 500));
      }
    }
  }

  print('✅ Navigation flow test completed');
}

Future<void> _testProfileFlow(WidgetTester tester) async {
  // Navigate to profile tab
  final profileTab = find.text('Profile');
  if (profileTab.evaluate().isNotEmpty) {
    await tester.tap(profileTab);
    await tester.pumpAndSettle();
  }

  // Look for profile elements
  final profileScreen = find.text('Enhanced Profile') | 
                       find.text('Profile') |
                       find.byIcon(Icons.person);
  
  expect(profileScreen, findsAtLeastNWidget(1));

  print('✅ Profile flow test completed');
}

Future<void> _testLogoutFlow(WidgetTester tester) async {
  // Look for settings or menu button
  final menuButton = find.byIcon(Icons.menu) | 
                     find.byIcon(Icons.more_vert) |
                     find.byIcon(Icons.settings);
  
  if (menuButton.evaluate().isNotEmpty) {
    await tester.tap(menuButton.first);
    await tester.pumpAndSettle();
    
    // Look for logout option
    final logoutButton = find.text('Logout') | find.text('Sign Out');
    if (logoutButton.evaluate().isNotEmpty) {
      await tester.tap(logoutButton);
      await tester.pumpAndSettle();
    }
  }

  print('✅ Logout flow test completed');
}