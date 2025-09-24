import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../services/chat_service.dart';
import '../../models/chat_message.dart';

class ChatsPage extends ConsumerWidget {
  const ChatsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return const Scaffold(body: Center(child: Text('Please sign in')));
    final threads = ref.watch(_threadsProvider(user.uid));
    return Scaffold(
      appBar: AppBar(title: const Text('Chats')),
      body: threads.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, st) => Center(child: Text('Error: $e')),
        data: (msgs) {
          if (msgs.isEmpty) return const Center(child: Text('No conversations'));
          return ListView.builder(
            itemCount: msgs.length,
            itemBuilder: (context, index) {
              final m = msgs[index];
              return Card(
                child: ListTile(
                  title: Text(m.text, maxLines: 1, overflow: TextOverflow.ellipsis),
                  subtitle: Text('from ${m.fromUid}'),
                  onTap: () => Navigator.of(context).pushNamed('/chats/thread?id=${m.chatId}'),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

final _threadsProvider = StreamProvider.family<List<ChatMessage>, String>((ref, uid) => ref.watch(chatServiceProvider).watchThreads(uid));
