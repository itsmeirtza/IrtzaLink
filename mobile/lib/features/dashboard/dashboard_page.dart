import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';
import 'package:flutter/services.dart';

import '../../services/auth_service.dart';
import '../../services/firestore_service.dart';
import '../../services/follow_service.dart';
import '../../models/user_profile.dart';
import '../../models/app_link.dart';
import '../../theme.dart';
import 'package:firebase_auth/firebase_auth.dart';

class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  void _shareProfile(UserProfile? profile) async {
    if (profile == null) return;
    final profileUrl = 'https://irtzalink.vercel.app/${profile.username}';
    await Share.share(
      'Check out my IrtzaLink profile: $profileUrl',
      subject: '${profile.displayName} - IrtzaLink Profile',
    );
  }

  Future<void> _copyProfileLink(UserProfile? profile, BuildContext context) async {
    if (profile == null) return;
    final profileUrl = 'https://irtzalink.vercel.app/${profile.username}';
    await Clipboard.setData(ClipboardData(text: profileUrl));
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile link copied')), 
      );
    }
  }

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
          backgroundColor: Theme.of(context).colorScheme.background,
          appBar: AppBar(
            title: const Text('Dashboard'),
            elevation: 0,
            backgroundColor: Colors.transparent,
            actions: [
              IconButton(
                onPressed: () => context.go('/search'),
                icon: Icon(Icons.search_rounded, color: ThemeService.primaryColor),
              ),
              IconButton(
                onPressed: () => context.go('/qr/share'),
                icon: Icon(Icons.qr_code, color: ThemeService.primaryColor),
              ),
              IconButton(
                onPressed: () => context.go('/notifications'),
                icon: Icon(Icons.notifications_outlined, color: ThemeService.primaryColor),
              ),
            ],
          ),
          floatingActionButton: FloatingActionButton.extended(
            onPressed: () => context.go('/profile/edit'),
            backgroundColor: ThemeService.primaryColor,
            foregroundColor: Colors.white,
            icon: const Icon(Icons.edit_rounded),
            label: const Text('Edit Profile'),
            elevation: 8,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                profileStream.when(
                  loading: () => const _ShimmerCard(),
                  error: (e, st) => _ErrorCard(message: 'Profile error: $e'),
                  data: (profile) => _ProfileHeader(
                    profile: profile,
                    onShare: () => _shareProfile(profile),
                    onCopy: () => _copyProfileLink(profile, context),
                  ),
                ),
                const SizedBox(height: 24),
                _StatsRow(profile: profileStream.value),
                const SizedBox(height: 24),
                _DigitalCard(profile: profileStream.value),
                const SizedBox(height: 24),
                _FollowNetwork(),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Your Links', style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: ThemeService.primaryColor,
                    )),
                    TextButton.icon(
                      onPressed: () => context.go('/profile/edit'),
                      icon: Icon(Icons.add_rounded, color: ThemeService.primaryColor),
                      label: Text('Add Link', style: TextStyle(color: ThemeService.primaryColor)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                linksStream.when(
                  loading: () => const _ShimmerGrid(),
                  error: (e, st) => _ErrorCard(message: 'Links error: $e'),
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
  const _ProfileHeader({required this.profile, required this.onShare, required this.onCopy});
  final UserProfile? profile;
  final VoidCallback onShare;
  final VoidCallback onCopy;

  @override
  Widget build(BuildContext context) {
    final p = profile;
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [ThemeService.primaryColor, ThemeService.secondaryColor],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: ThemeService.primaryColor.withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 3),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: CircleAvatar(
                    radius: 35,
                    backgroundImage: p?.photoUrl != null ? NetworkImage(p!.photoUrl!) : null,
                    child: p?.photoUrl == null 
                      ? Icon(Icons.person, size: 35, color: Colors.white) 
                      : null,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              p?.displayName ?? 'Your Name',
                              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          if (p?.verified == true)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.verified, color: Colors.blue, size: 16),
                                  const SizedBox(width: 4),
                                  Text('Verified', style: TextStyle(color: Colors.blue, fontSize: 12, fontWeight: FontWeight.w600)),
                                ],
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '@${p?.username ?? 'username'}',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.white.withOpacity(0.9),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      if (p?.bio != null && p!.bio.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text(
                          p.bio,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white.withOpacity(0.8),
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _Stat(label: 'Followers', value: p?.followers ?? 0, isLight: true),
                Container(width: 1, height: 40, color: Colors.white.withOpacity(0.3)),
                _Stat(label: 'Following', value: p?.following ?? 0, isLight: true),
                Container(width: 1, height: 40, color: Colors.white.withOpacity(0.3)),
                _Stat(label: 'Links', value: 0, isLight: true), // TODO: Add links count
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: onShare,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: ThemeService.primaryColor,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: const Icon(Icons.share_rounded),
                    label: const Text('Share Profile'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: onCopy,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: ThemeService.primaryColor,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: const Icon(Icons.link),
                    label: const Text('Copy Link'),
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: IconButton(
                    onPressed: () {}, // TODO: Add QR code functionality
                    icon: const Icon(Icons.qr_code, color: Colors.white),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value, this.isLight = false});
  final String label;
  final int value;
  final bool isLight;
  
  @override
  Widget build(BuildContext context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '$value',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              color: isLight ? Colors.white : ThemeService.primaryColor,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: isLight ? Colors.white.withOpacity(0.8) : Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      );
}

class _StatsRow extends StatelessWidget {
  const _StatsRow({required this.profile});
  final UserProfile? profile;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _StatCard(
            icon: Icons.visibility_rounded,
            title: 'Profile Views',
            value: '1,234', // TODO: Get from analytics
            color: ThemeService.successColor,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatCard(
            icon: Icons.qr_code_scanner_rounded,
            title: 'QR Scans',
            value: '89', // TODO: Get from analytics
            color: ThemeService.accentColor,
          ),
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.title,
    required this.value,
    required this.color,
  });
  
  final IconData icon;
  final String title;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: color.withOpacity(0.2),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
            ),
          ),
        ],
      ),
    );
  }
}

class _ShimmerCard extends StatelessWidget {
  const _ShimmerCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 200,
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: ThemeService.primaryColor),
            const SizedBox(height: 16),
            Text(
              'Loading your profile...',
              style: TextStyle(color: ThemeService.primaryColor),
            ),
          ],
        ),
      ),
    );
  }
}

class _DigitalCard extends StatelessWidget {
  const _DigitalCard({required this.profile});
  final UserProfile? profile;

  @override
  Widget build(BuildContext context) {
    if (profile == null) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF111827)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.25),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: AspectRatio(
        aspectRatio: 16 / 9,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              // Left: avatar and details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 32,
                          backgroundImage: profile!.photoUrl != null ? NetworkImage(profile!.photoUrl!) : null,
                          child: profile!.photoUrl == null ? const Icon(Icons.person, color: Colors.white) : null,
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  profile!.displayName,
                                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w700,
                                      ),
                                ),
                                const SizedBox(width: 6),
                                if (profile!.verified) const Icon(Icons.verified, color: Colors.blueAccent, size: 20),
                              ],
                            ),
                            Text(
                              'irtzalink.site/${profile!.username}',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white70),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      profile!.bio,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: Colors.white70),
                    ),
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 8,
                      children: [
                        _chip('Instagram'),
                        _chip('YouTube'),
                        _chip('Twitter'),
                        _chip('Website'),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              // Right: QR
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: QrImageView(
                    data: 'https://irtzalink.vercel.app/${profile!.username}',
                    version: QrVersions.auto,
                    size: 100,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _chip(String label) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.12),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(label, style: const TextStyle(color: Colors.white)),
      );
}

class _ShimmerGrid extends StatelessWidget {
  const _ShimmerGrid();

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 1.2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: 4,
      itemBuilder: (context, index) {
        return Container(
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Center(
            child: CircularProgressIndicator(
              color: ThemeService.primaryColor,
              strokeWidth: 2,
            ),
          ),
        );
      },
    );
  }
}

class _FollowNetwork extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUid = FirebaseAuth.instance.currentUser?.uid;
    if (currentUid == null) return const SizedBox.shrink();
    final followers = ref.watch(_followersProvider(currentUid));
    final following = ref.watch(_followingProvider(currentUid));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.people_outline),
            const SizedBox(width: 8),
            Text('Follow Network', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 12),
        DefaultTabController(
          length: 2,
          child: Container(
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Theme.of(context).colorScheme.outline.withOpacity(0.2)),
            ),
            child: Column(
              children: [
                const TabBar(
                  tabs: [
                    Tab(text: 'Followers'),
                    Tab(text: 'Following'),
                  ],
                ),
                SizedBox(
                  height: 220,
                  child: TabBarView(
                    children: [
                      followers.when(
                        loading: () => const Center(child: CircularProgressIndicator()),
                        error: (e, st) => Center(child: Text('Error: $e')),
                        data: (ids) => _UserIdsPreview(ids: ids),
                      ),
                      following.when(
                        loading: () => const Center(child: CircularProgressIndicator()),
                        error: (e, st) => Center(child: Text('Error: $e')),
                        data: (ids) => _UserIdsPreview(ids: ids),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

final _followersProvider = StreamProvider.family<List<String>, String>((ref, uid) => ref.watch(followServiceProvider).watchFollowerIds(uid));
final _followingProvider = StreamProvider.family<List<String>, String>((ref, uid) => ref.watch(followServiceProvider).watchFollowingIds(uid));
final _profileOnceProvider = FutureProvider.family<UserProfile?, String>((ref, uid) async => ref.read(firestoreServiceProvider).fetchProfile(uid));

class _UserIdsPreview extends ConsumerWidget {
  const _UserIdsPreview({required this.ids});
  final List<String> ids;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (ids.isEmpty) {
      return const Center(child: Text('No users yet'));
    }
    final limited = ids.take(5).toList();
    return ListView.separated(
      padding: const EdgeInsets.all(12),
      itemCount: limited.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final uid = limited[index];
        final profile = ref.watch(_profileOnceProvider(uid));
        return profile.when(
          loading: () => const ListTile(title: LinearProgressIndicator()),
          error: (e, st) => ListTile(title: Text('Error: $e')),
          data: (p) => p == null
              ? const SizedBox.shrink()
              : Container(
                  decoration: BoxDecoration(
                    color: Theme.of(context).cardColor,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Theme.of(context).colorScheme.outline.withOpacity(0.2)),
                  ),
                  child: ListTile(
                    leading: CircleAvatar(backgroundImage: p.photoUrl != null ? NetworkImage(p.photoUrl!) : null, child: p.photoUrl == null ? const Icon(Icons.person) : null),
                    title: Text(p.displayName.isNotEmpty ? p.displayName : '@${p.username}'),
                    subtitle: Text('@${p.username}'),
                    trailing: const Icon(Icons.chevron_right),
                  ),
                ),
        );
      },
    );
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: ThemeService.errorColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: ThemeService.errorColor.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(Icons.error_outline, color: ThemeService.errorColor, size: 48),
          const SizedBox(height: 12),
          Text(
            'Oops! Something went wrong',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: ThemeService.errorColor,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            message,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: ThemeService.errorColor.withOpacity(0.8),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _LinksGrid extends StatelessWidget {
  const _LinksGrid({required this.links});
  final List<AppLink> links;

  @override
  Widget build(BuildContext context) {
    if (links.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(40),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
          ),
        ),
        child: Column(
          children: [
            Icon(
              Icons.link_off_rounded,
              size: 64,
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.4),
            ),
            const SizedBox(height: 16),
            Text(
              'No links yet',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Start building your profile by adding your first link',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () {}, // TODO: Navigate to add link
              style: ElevatedButton.styleFrom(
                backgroundColor: ThemeService.primaryColor,
                foregroundColor: Colors.white,
              ),
              icon: const Icon(Icons.add_rounded),
              label: const Text('Add Your First Link'),
            ),
          ],
        ),
      );
    }
    
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 1.2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: links.length,
      itemBuilder: (context, index) {
        final link = links[index];
        return _LinkCard(link: link);
      },
    );
  }
}

class _LinkCard extends StatelessWidget {
  const _LinkCard({required this.link});
  final AppLink link;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
        ),
        boxShadow: [
          BoxShadow(
            color: ThemeService.primaryColor.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {}, // TODO: Open link
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: ThemeService.primaryColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        _getLinkIcon(link.url),
                        color: ThemeService.primaryColor,
                        size: 20,
                      ),
                    ),
                    const Spacer(),
                    Icon(
                      Icons.open_in_new_rounded,
                      color: Theme.of(context).colorScheme.onSurface.withOpacity(0.4),
                      size: 16,
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  link.title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  _getDomainFromUrl(link.url),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  IconData _getLinkIcon(String url) {
    if (url.contains('instagram.com')) return Icons.camera_alt_rounded;
    if (url.contains('youtube.com')) return Icons.play_circle_rounded;
    if (url.contains('twitter.com')) return Icons.alternate_email_rounded;
    if (url.contains('facebook.com')) return Icons.facebook_rounded;
    if (url.contains('linkedin.com')) return Icons.work_rounded;
    if (url.contains('tiktok.com')) return Icons.music_note_rounded;
    if (url.contains('github.com')) return Icons.code_rounded;
    return Icons.link_rounded;
  }

  String _getDomainFromUrl(String url) {
    try {
      final uri = Uri.parse(url);
      return uri.host.replaceFirst('www.', '');
    } catch (e) {
      return url;
    }
  }
}
