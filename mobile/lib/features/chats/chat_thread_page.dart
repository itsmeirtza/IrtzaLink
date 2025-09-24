import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../services/chat_service.dart';

class ChatThreadPage extends ConsumerStatefulWidget {
  const ChatThreadPage({super.key, required this.chatId});
  final String chatId;

  @override
  ConsumerState<ChatThreadPage> createState() => _ChatThreadPageState();
}

class _ChatThreadPageState extends ConsumerState<ChatThreadPage> {
  final _controller = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    final messages = ref.watch(_messagesProvider(widget.chatId));
    return Scaffold(
      appBar: AppBar(title: const Text('Conversation')),
      body: Column(
        children: [
          Expanded(
            child: messages.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, st) => Center(child: Text('Error: $e')),
              data: (msgs) => ListView.builder(
                padding: const EdgeInsets.all(8),
                itemCount: msgs.length,
                itemBuilder: (context, index) {
                  final m = msgs[index];
                  final mine = m.fromUid == uid;
                  return Align(
                    alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
                    child: Card(
                      color: mine ? Theme.of(context).colorScheme.primaryContainer : null,
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Text(m.text),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8),
            child: Row(
              children: [
                Expanded(child: TextField(controller: _controller, decoration: const InputDecoration(hintText: 'Message...'))),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: uid == null
                      ? null
                      : () async {
                          final text = _controller.text.trim();
                          if (text.isEmpty) return;
                          await ref.read(chatServiceProvider).sendMessage(chatId: widget.chatId, fromUid: uid, text: text);
                          _controller.clear();
                        },
                  icon: const Icon(Icons.send),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

final _messagesProvider = StreamProvider.family((ref, String chatId) => ref.watch(chatServiceProvider).watchMessages(chatId));
