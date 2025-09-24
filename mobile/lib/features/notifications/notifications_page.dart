import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/notification_item.dart';
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
        return Scaffold(
          appBar: AppBar(title: const Text('Notifications')),
          body: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
            stream: FirebaseFirestore.instance.collection('users').doc(user.uid).collection('notifications').orderBy('createdAt', descending: true).snapshots(),
            builder: (context, snapshot) {
              if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
              final items = snapshot.data!.docs.map((d) => NotificationItem.fromMap(d.data()..['id'] = d.id)).toList();
              if (items.isEmpty) return const Center(child: Text('No notifications'));
              return ListView.builder(
                itemCount: items.length,
                itemBuilder: (context, index) {
                  final n = items[index];
                  return Card(
                    child: ListTile(
                      leading: Icon(n.type == 'message' ? Icons.chat_bubble : n.type == 'follow' ? Icons.person_add : Icons.info_outline),
                      title: Text(n.title),
                      subtitle: Text(n.body),
                      trailing: Text(_ago(n.createdAt)),
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
