import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';

import 'package:irtzalink_mobile/app.dart';

void main() {
  testWidgets('App renders and shows sign-in by default', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: IrtzaLinkApp()));
    await tester.pumpAndSettle();

    expect(find.text('Welcome to IrtzaLink'), findsOneWidget);
  });
}
