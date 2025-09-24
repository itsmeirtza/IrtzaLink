import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../services/auth_service.dart';

class NotificationsPage extends ConsumerWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authStateProvider);
    return auth.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, st) => Scaffold(body: Center(child: Text('Error: $e'))),
      data: (user) {
        if (user == null) return const Scaffold(body: Center(child: Text('Please sign in')));
        final stream = FirebaseFirestore.instance
            .collection('notifications')
            .where('toUserId', isEqualTo: user.uid)
            .orderBy('timestamp', descending: true)
            .snapshots();
        return Scaffold(
          appBar: AppBar(title: const Text('Notifications')),
          body: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
            stream: stream,
            builder: (context, snapshot) {
              if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
              final docs = snapshot.data!.docs;
              if (docs.isEmpty) return const Center(child: Text('No notifications'));
              return ListView.builder(
                itemCount: docs.length,
                itemBuilder: (context, index) {
                  final d = docs[index].data();
                  final type = d['type'] as String? ?? 'system';
                  final msg = d['message'] as String? ?? '';
                  final ts = (d['timestamp'] as Timestamp?)?.toDate() ?? DateTime.now();
                  IconData icon;
                  switch (type) {
                    case 'message':
                      icon = Icons.chat_bubble;
                      break;
                    case 'follow':
                      icon = Icons.person_add;
                      break;
                    case 'profile_visit':
                      icon = Icons.visibility;
                      break;
                    default:
                      icon = Icons.notifications;
                  }
                  return Card(
                    child: ListTile(
                      leading: Icon(icon),
                      title: Text(type.toUpperCase()),
                      subtitle: Text(msg),
                      trailing: Text(_ago(ts)),
                    ),
                  );
                },
              );
            },
          ),
        );
      },
    );
  }

  String _ago(DateTime ts) {
    final diff = DateTime.now().difference(ts);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    return '${diff.inDays}d';
  }
}
