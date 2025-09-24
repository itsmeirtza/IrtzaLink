import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../services/auth_service.dart';
import '../../services/theme_service.dart';
import '../../theme.dart';
import 'package:firebase_auth/firebase_auth.dart';

class SettingsPage extends ConsumerWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mode = ref.watch(themeModeProvider);
    final auth = ref.watch(authStateProvider);
    
    return auth.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, st) => Scaffold(body: Center(child: Text('Error: $e'))),
      data: (user) => Scaffold(
        backgroundColor: Theme.of(context).colorScheme.background,
        appBar: AppBar(
          title: const Text('Settings'),
          backgroundColor: Colors.transparent,
          elevation: 0,
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // User Account Section
              if (user != null) _buildAccountSection(user),
              const SizedBox(height: 24),
              
              // Appearance Section
              _buildAppearanceSection(mode, ref),
              const SizedBox(height: 24),
              
              // Verification Section
              _buildVerificationSection(context),
              const SizedBox(height: 24),
              
              // Privacy & Security Section
              _buildPrivacySection(context),
              const SizedBox(height: 24),
              
              // Support Section
              _buildSupportSection(context),
              const SizedBox(height: 24),
              
              // Danger Zone
              _buildDangerZone(ref, context),
              
              const SizedBox(height: 32),
              
              // App Info
              _buildAppInfo(),
            ],
          ),
        ),
      ),
    );
  }
}

// Section builders (top-level for clarity)
Widget _buildAccountSection(User user) {
  return Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: Colors.white.withOpacity(0.02),
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: const Color(0xFFE5E7EB).withOpacity(0.2)),
    ),
    child: Row(
      children: [
        CircleAvatar(
          radius: 28,
          backgroundImage: user.photoURL != null ? NetworkImage(user.photoURL!) : null,
          child: user.photoURL == null ? const Icon(Icons.person) : null,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(user.displayName ?? 'User', style: const TextStyle(fontWeight: FontWeight.w600)),
              Text(user.email ?? '', style: const TextStyle(color: Colors.grey)),
            ],
          ),
        ),
        const Icon(Icons.check_circle, color: Colors.green, size: 20),
      ],
    ),
  );
}

Widget _buildAppearanceSection(ThemeMode mode, WidgetRef ref) {
  return Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: Colors.white.withOpacity(0.02),
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: const Color(0xFFE5E7EB).withOpacity(0.2)),
    ),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Appearance', style: TextStyle(fontWeight: FontWeight.w600)),
            Text('Current: ${mode.name}', style: const TextStyle(color: Colors.grey)),
          ],
        ),
        DropdownButton<ThemeMode>(
          value: mode,
          onChanged: (m) => m != null ? ref.read(themeModeProvider.notifier).set(m) : null,
          items: const [
            DropdownMenuItem(value: ThemeMode.system, child: Text('System')),
            DropdownMenuItem(value: ThemeMode.light, child: Text('Light')),
            DropdownMenuItem(value: ThemeMode.dark, child: Text('Dark')),
          ],
        ),
      ],
    ),
  );
}

Widget _buildVerificationSection(BuildContext context) {
  return Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: Colors.white.withOpacity(0.02),
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: const Color(0xFFE5E7EB).withOpacity(0.2)),
    ),
    child: Row(
      children: [
        const Icon(Icons.verified, color: Colors.blue),
        const SizedBox(width: 12),
        const Expanded(
          child: Text('Get Verified Badge — Stand out with a blue checkmark!'),
        ),
        ElevatedButton(
          onPressed: () => context.push('/verification'),
          style: ElevatedButton.styleFrom(
            backgroundColor: ThemeService.primaryColor,
            foregroundColor: Colors.white,
          ),
          child: const Text('Get Verified'),
        ),
      ],
    ),
  );
}

Widget _buildPrivacySection(BuildContext context) {
  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      const Text('Privacy & Security', style: TextStyle(fontWeight: FontWeight.w600)),
      const SizedBox(height: 8),
      _settingsTile(
        icon: Icons.lock_outline,
        title: 'Two-Factor Authentication',
        subtitle: 'Add an extra layer of security',
        trailing: const Text('Coming soon'),
      ),
      _settingsTile(
        icon: Icons.password,
        title: 'Change Password',
        subtitle: 'Update your account password',
        trailing: const Text('Coming soon'),
      ),
    ],
  );
}

Widget _buildSupportSection(BuildContext context) {
  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      const Text('Help & Support', style: TextStyle(fontWeight: FontWeight.w600)),
      const SizedBox(height: 8),
      _settingsTile(
        icon: Icons.help_outline,
        title: 'Help Center',
        subtitle: 'Guides and FAQs',
        onTap: () => context.push('/support'),
      ),
      _settingsTile(
        icon: Icons.mail_outline,
        title: 'Contact Us',
        subtitle: 'Get in touch with our team',
      ),
    ],
  );
}

Widget _buildDangerZone(WidgetRef ref, BuildContext context) {
  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      const Text('Danger Zone', style: TextStyle(fontWeight: FontWeight.w600)),
      const SizedBox(height: 8),
      _settingsTile(
        icon: Icons.logout,
        title: 'Sign Out',
        subtitle: 'Safely log out of your account',
        onTap: () => ref.read(authServiceProvider).signOut(),
      ),
    ],
  );
}

Widget _buildAppInfo() {
  return Center(
    child: Text(
      'IrtzaLink — Mobile v1.0.0',
      style: TextStyle(color: Colors.grey.shade600),
    ),
  );
}

Widget _settingsTile({
  required IconData icon,
  required String title,
  String? subtitle,
  Widget? trailing,
  VoidCallback? onTap,
}) {
  return Container(
    margin: const EdgeInsets.only(bottom: 8),
    decoration: BoxDecoration(
      color: Colors.white.withOpacity(0.02),
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: const Color(0xFFE5E7EB).withOpacity(0.2)),
    ),
    child: ListTile(
      leading: Icon(icon),
      title: Text(title),
      subtitle: subtitle != null ? Text(subtitle) : null,
      trailing: trailing ?? const Icon(Icons.chevron_right),
      onTap: onTap,
    ),
  );
}
