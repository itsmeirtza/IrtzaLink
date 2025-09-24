import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../services/auth_service.dart';
import '../../services/firestore_service.dart';

class AnalyticsPage extends ConsumerWidget {
  const AnalyticsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authStateProvider);
    return auth.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, st) => Scaffold(body: Center(child: Text('Error: $e'))),
      data: (user) {
        if (user == null) return const Scaffold(body: Center(child: Text('Please sign in')));
        final analytics = ref.watch(_analyticsProvider(user.uid));
        return Scaffold(
          appBar: AppBar(title: const Text('Analytics')),
          body: analytics.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, st) => Center(child: Text('Error: $e')),
            data: (data) => Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _MetricCard(label: 'Profile Visits', value: data['profileVisits'] ?? 0, icon: Icons.visibility),
                  const SizedBox(height: 12),
                  _MetricCard(label: 'QR Scans', value: data['qrScans'] ?? 0, icon: Icons.qr_code),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

final _analyticsProvider = StreamProvider.family<Map<String, int>, String>((ref, uid) => ref.watch(firestoreServiceProvider).watchAnalytics(uid));

class _MetricCard extends StatelessWidget {
  const _MetricCard({required this.label, required this.value, required this.icon});
  final String label;
  final int value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Icon(icon),
        title: Text(label),
        trailing: Text('$value', style: Theme.of(context).textTheme.headlineSmall),
      ),
    );
  }
}
