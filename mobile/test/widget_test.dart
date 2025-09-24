import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';

import 'package:irtzalink_mobile/features/auth/pages/sign_in_page.dart';

void main() {
  testWidgets('Sign-in screen renders', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: MaterialApp(home: SignInPage())));
    await tester.pumpAndSettle();

    expect(find.text('Welcome to IrtzaLink'), findsOneWidget);
  });
}
