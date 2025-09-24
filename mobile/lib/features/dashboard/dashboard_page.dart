import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../services/auth_service.dart';
import '../../services/firestore_service.dart';
import '../../models/user_profile.dart';
import '../../models/app_link.dart';

class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authStateProvider);
    return auth.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, st) => Scaffold(body: Center(child: Text('Error: $e'))),
      data: (user) {
        if (user == null) return const Scaffold(body: Center(child: Text('Please sign in')));
        final profileStream = ref.watch(_profileProvider(user.uid));
        final linksStream = ref.watch(_linksProvider(user.uid));
        return Scaffold(
          appBar: AppBar(
            title: const Text('Dashboard'),
            actions: [
              IconButton(onPressed: () => context.go('/qr/share'), icon: const Icon(Icons.qr_code)),
              IconButton(onPressed: () => context.go('/notifications'), icon: const Icon(Icons.notifications_outlined)),
            ],
          ),
          floatingActionButton: FloatingActionButton.extended(
            onPressed: () => context.go('/profile/edit'),
            icon: const Icon(Icons.edit),
            label: const Text('Edit Profile'),
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                profileStream.when(
                  loading: () => const LinearProgressIndicator(),
                  error: (e, st) => Text('Profile error: $e'),
                  data: (profile) => _ProfileHeader(profile: profile),
                ),
                const SizedBox(height: 16),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text('Your Links', style: Theme.of(context).textTheme.titleLarge),
                ),
                const SizedBox(height: 8),
                linksStream.when(
                  loading: () => const LinearProgressIndicator(),
                  error: (e, st) => Text('Links error: $e'),
                  data: (links) => _LinksGrid(links: links),
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
final _linksProvider = StreamProvider.family<List<AppLink>, String>((ref, uid) => ref.watch(firestoreServiceProvider).watchLinks(uid));

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({required this.profile});
  final UserProfile? profile;

  @override
  Widget build(BuildContext context) {
    final p = profile;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            CircleAvatar(radius: 32, backgroundImage: p?.photoUrl != null ? NetworkImage(p!.photoUrl!) : null, child: p?.photoUrl == null ? const Icon(Icons.person) : null),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(p?.displayName ?? '—', style: Theme.of(context).textTheme.titleLarge),
                  Text('@${p?.username ?? ''}', style: Theme.of(context).textTheme.bodyMedium),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _Stat(label: 'Followers', value: p?.followers ?? 0),
                      const SizedBox(width: 16),
                      _Stat(label: 'Following', value: p?.following ?? 0),
                      const SizedBox(width: 16),
                      if (p?.verified == true) const Icon(Icons.verified, color: Colors.blue, size: 20),
                    ],
                  ),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value});
  final String label;
  final int value;
  @override
  Widget build(BuildContext context) => Column(
        children: [
          Text('$value', style: Theme.of(context).textTheme.titleMedium),
          Text(label),
        ],
      );
}

class _LinksGrid extends StatelessWidget {
  const _LinksGrid({required this.links});
  final List<AppLink> links;

  @override
  Widget build(BuildContext context) {
    if (links.isEmpty) return const Text('No links yet');
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, childAspectRatio: 3),
      itemCount: links.length,
      itemBuilder: (context, index) {
        final link = links[index];
        return Card(
          child: ListTile(
            title: Text(link.title),
            subtitle: Text(link.url, maxLines: 1, overflow: TextOverflow.ellipsis),
            trailing: const Icon(Icons.open_in_new),
            onTap: () {},
          ),
        );
      },
    );
  }
}
