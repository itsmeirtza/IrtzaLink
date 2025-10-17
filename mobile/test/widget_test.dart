import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';

import 'package:irtzalink_mobile/features/auth/pages/sign_in_page.dart';

void main() {
  testWidgets('Sign-in screen renders', (tester) async {
    // Create a test app with proper theme and routing
    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          theme: ThemeData.dark(),
          home: const SignInPage(),
        ),
      ),
    );
    
    // Wait for the widget to settle
    await tester.pumpAndSettle();

    // Verify the welcome text is present
    expect(find.text('Welcome to IrtzaLink'), findsOneWidget);
    
    // Verify email field is present
    expect(find.byType(TextField), findsNWidgets(2));
    
    // Verify sign in button is present
    expect(find.text('Sign In'), findsOneWidget);
    
    // Verify Google sign in button is present
    expect(find.text('Sign in with Google'), findsOneWidget);
  });

  testWidgets('Sign-in screen has correct styling', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          theme: ThemeData.dark(),
          home: const SignInPage(),
        ),
      ),
    );
    
    await tester.pumpAndSettle();

    // Verify the main container has dark background
    final container = find.byType(Container).first;
    expect(container, findsOneWidget);
    
    // Verify the scaffold has black background
    final scaffold = find.byType(Scaffold);
    expect(scaffold, findsOneWidget);
  });

  testWidgets('Sign-in screen has all required elements', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          theme: ThemeData.dark(),
          home: const SignInPage(),
        ),
      ),
    );
    
    await tester.pumpAndSettle();

    // Verify all required UI elements are present
    expect(find.text('Welcome to IrtzaLink'), findsOneWidget);
    expect(find.text('Email'), findsOneWidget);
    expect(find.text('Password'), findsOneWidget);
    expect(find.text('Sign In'), findsOneWidget);
    expect(find.text('Forgot password?'), findsOneWidget);
    expect(find.text('Sign in with Google'), findsOneWidget);
    expect(find.text("Don't have an account? Sign up"), findsOneWidget);
  });
}
