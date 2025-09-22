// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:irtzalink/main.dart';

void main() {
  testWidgets('App boots without crashing', (WidgetTester tester) async {
    // Pump the app bootstrap (shows SplashScreen while initializing)
    await tester.pumpWidget(const AppBootstrap());
    await tester.pump(const Duration(milliseconds: 100));

    // Basic sanity check
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
