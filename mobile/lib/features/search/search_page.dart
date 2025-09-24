import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../models/user_profile.dart';
import '../../services/firestore_service.dart';
import '../../common/widgets/verified_badge.dart';
import '../../theme.dart';

class SearchPage extends ConsumerStatefulWidget {
  const SearchPage({super.key});

  @override
  ConsumerState<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends ConsumerState<SearchPage> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final term = _controller.text;
    final results = ref.watch(_searchProvider(term));

    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _controller,
          autofocus: true,
          decoration: const InputDecoration(
            hintText: 'Search users by name or username',
            border: InputBorder.none,
          ),
          onChanged: (_) => setState(() {}),
        ),
        actions: [
          IconButton(
            onPressed: () {
              setState(() => _controller.clear());
            },
            icon: const Icon(Icons.clear),
          ),
        ],
      ),
      body: results.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, st) => Center(child: Text('Error: $e')),
        data: (list) => list.isEmpty
            ? const _EmptyState()
            : ListView.separated(
                padding: const EdgeInsets.all(12),
                itemBuilder: (c, i) => _UserRow(user: list[i]),
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemCount: list.length,
              ),
      ),
    );
  }
}

final _searchProvider = StreamProvider.family<List<UserProfile>, String>((ref, term) =>
    ref.watch(firestoreServiceProvider).searchUsers(term));

class _UserRow extends StatelessWidget {
  const _UserRow({required this.user});
  final UserProfile user;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
        ),
      ),
      child: ListTile(
        leading: CircleAvatar(
          backgroundImage: user.photoUrl != null ? NetworkImage(user.photoUrl!) : null,
          child: user.photoUrl == null ? const Icon(Icons.person) : null,
        ),
        title: Row(
          children: [
            Expanded(child: Text(user.displayName.isNotEmpty ? user.displayName : '@${user.username}')),
            VerifiedBadge(username: user.username, size: 16),
          ],
        ),
        subtitle: Text('@${user.username}'),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => context.go('/public?u=${user.username}'),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.search, size: 56, color: ThemeService.primaryColor),
            const SizedBox(height: 12),
            const Text('Type to search users'),
          ],
        ),
      ),
    );
  }
}
