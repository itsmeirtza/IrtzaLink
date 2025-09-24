import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../services/auth_service.dart';
import '../../services/firestore_service.dart';

class QrSharePage extends ConsumerWidget {
  const QrSharePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authStateProvider);
    return auth.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, st) => Scaffold(body: Center(child: Text('Error: $e'))),
      data: (user) {
        if (user == null) return const Scaffold(body: Center(child: Text('Please sign in')));
        final profile = ref.watch(_usernameProvider(user.uid));
        return Scaffold(
          appBar: AppBar(title: const Text('Share Profile')),
          body: Center(
            child: profile.when(
              loading: () => const CircularProgressIndicator(),
              error: (e, st) => Text('Error: $e'),
              data: (username) {
                final link = 'https://irtzalink.vercel.app/$username';
                return Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    QrImageView(data: link, size: 240),
                    const SizedBox(height: 12),
                    SelectableText(link),
                  ],
                );
              },
            ),
          ),
        );
      },
    );
  }
}

final _usernameProvider = StreamProvider.family<String, String>((ref, uid) async* {
  final stream = ref.watch(firestoreServiceProvider).watchProfile(uid);
  await for (final p in stream) {
    yield p?.username ?? uid.substring(0, 6);
  }
});