import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../models/user_profile.dart';
import '../../services/auth_service.dart';
import '../../services/firestore_service.dart';
import '../../services/storage_service.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authStateProvider);
    return auth.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, st) => Scaffold(body: Center(child: Text('Error: $e'))),
      data: (user) {
        if (user == null) return const Scaffold(body: Center(child: Text('Please sign in')));
        final profile = ref.watch(_profileProvider(user.uid));
        return Scaffold(
          appBar: AppBar(
            title: const Text('Profile'),
            actions: [
              IconButton(onPressed: () => context.go('/profile/edit'), icon: const Icon(Icons.edit)),
            ],
          ),
          body: profile.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, st) => Center(child: Text('Error: $e')),
            data: (p) => p == null
                ? const Center(child: Text('No profile yet'))
                : ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Center(
                        child: CircleAvatar(
                          radius: 48,
                          backgroundImage: p.photoUrl != null ? NetworkImage(p.photoUrl!) : null,
                          child: p.photoUrl == null ? const Icon(Icons.person, size: 36) : null,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Center(child: Text(p.displayName, style: Theme.of(context).textTheme.headlineSmall)),
                      Center(child: Text('@${p.username}')),
                      const SizedBox(height: 16),
                      Text(p.bio),
                      const SizedBox(height: 24),
                      FilledButton.icon(
                        onPressed: () => context.go('/analytics'),
                        icon: const Icon(Icons.analytics_outlined),
                        label: const Text('View Analytics'),
                      ),
                      const SizedBox(height: 12),
                      FilledButton.icon(
                        onPressed: () => context.go('/verification'),
                        icon: const Icon(Icons.verified_outlined),
                        label: const Text('Get Verified'),
                      ),
                    ],
                  ),
          ),
        );
      },
    );
  }
}

final _profileProvider = StreamProvider.family<UserProfile?, String>((ref, uid) => ref.watch(firestoreServiceProvider).watchProfile(uid));
