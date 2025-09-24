import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../common/widgets/verified_badge.dart';
import '../../models/user_profile.dart';
import '../../services/firestore_service.dart';
import '../../services/follow_service.dart';
import 'widgets/follow_button.dart';

class FollowingPage extends ConsumerWidget {
  const FollowingPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUid = FirebaseAuth.instance.currentUser?.uid;
    if (currentUid == null) {
      return const Scaffold(body: Center(child: Text('Please sign in')));
    }
    final counts = ref.watch(_followCountsProvider(currentUid));
    final followingIds = ref.watch(_followingProvider(currentUid));

    return Scaffold(
      appBar: AppBar(title: const Text('Following')),
      body: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          counts.when(
            data: (c) => _CountsBar(followers: c['followers'] ?? 0, following: c['following'] ?? 0),
            error: (e, st) => const SizedBox.shrink(),
            loading: () => const LinearProgressIndicator(),
          ),
          const SizedBox(height: 12),
          followingIds.when(
            loading: () => const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator())),
            error: (e, st) => Center(child: Text('Error: $e')),
            data: (ids) => ids.isEmpty
                ? const _EmptyState(icon: Icons.group_outlined, title: 'Not Following Anyone', subtitle: 'Start following people to see them here.')
                : _UsersList(userIds: ids, highlightCurrent: currentUid),
          ),
        ],
      ),
    );
  }
}

final _followingProvider = StreamProvider.family<List<String>, String>((ref, uid) => ref.watch(followServiceProvider).watchFollowingIds(uid));
final _followCountsProvider = StreamProvider.family<Map<String, int>, String>((ref, uid) => ref.watch(followServiceProvider).watchFollowCounts(uid));

class _CountsBar extends StatelessWidget {
  const _CountsBar({required this.followers, required this.following});
  final int followers;
  final int following;
  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Icon(Icons.favorite, color: Colors.red.shade400),
            const SizedBox(width: 8),
            Text('$followers Followers', style: Theme.of(context).textTheme.titleMedium),
            const Spacer(),
            Icon(Icons.group, color: Theme.of(context).colorScheme.primary),
            const SizedBox(width: 8),
            Text('$following Following', style: Theme.of(context).textTheme.titleMedium),
          ],
        ),
      ),
    );
  }
}

class _UsersList extends ConsumerWidget {
  const _UsersList({required this.userIds, required this.highlightCurrent});
  final List<String> userIds;
  final String highlightCurrent;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      children: [
        for (final uid in userIds) _UserRow(uid: uid, highlightCurrent: highlightCurrent),
      ],
    );
  }
}

class _UserRow extends ConsumerWidget {
  const _UserRow({required this.uid, required this.highlightCurrent});
  final String uid;
  final String highlightCurrent;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(_profileOnceProvider(uid));
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      margin: const EdgeInsets.symmetric(vertical: 6),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: profile.when(
        loading: () => const ListTile(title: LinearProgressIndicator()),
        error: (e, st) => ListTile(title: Text('Error: $e')),
        data: (p) {
          if (p == null) return const SizedBox.shrink();
          final isYou = p.id == highlightCurrent;
          return ListTile(
            leading: CircleAvatar(backgroundImage: p.photoUrl != null ? NetworkImage(p.photoUrl!) : null, child: p.photoUrl == null ? const Icon(Icons.person) : null),
            title: Row(children: [
              Expanded(child: Text(p.displayName.isNotEmpty ? p.displayName : '@${p.username}')),
              VerifiedBadge(username: p.username, size: 16),
            ]),
            subtitle: Text('@${p.username}'),
            trailing: isYou
                ? const Chip(label: Text('You'))
                : FollowButton(targetUid: p.id, targetUsername: p.username),
          );
        },
      ),
    );
  }
}

final _profileOnceProvider = FutureProvider.family<UserProfile?, String>((ref, uid) async => ref.read(firestoreServiceProvider).fetchProfile(uid));

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.icon, required this.title, required this.subtitle});
  final IconData icon;
  final String title;
  final String subtitle;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Column(
        children: [
          Icon(icon, size: 64, color: Theme.of(context).colorScheme.outline),
          const SizedBox(height: 12),
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          Text(subtitle, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Theme.of(context).colorScheme.outline)),
        ],
      ),
    );
  }
}
