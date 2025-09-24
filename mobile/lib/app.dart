import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'router.dart';
import 'services/theme_service.dart';

class IrtzaLinkApp extends ConsumerWidget {
  const IrtzaLinkApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: 'IrtzaLink',
      themeMode: themeMode,
      theme: ThemeService.lightTheme,
      darkTheme: ThemeService.darkTheme,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
