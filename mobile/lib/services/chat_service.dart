import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/chat_message.dart';

class ChatService {
  ChatService(this._db);
  final FirebaseFirestore? _db;

  CollectionReference<Map<String, dynamic>>? _chats() => _db?.collection('chats');

  Stream<List<ChatMessage>> watchThreads(String uid) {
    final col = _chats();
    if (col == null) return const Stream<List<ChatMessage>>.empty();
    return col.where('members', arrayContains: uid).orderBy('updatedAt', descending: true).snapshots().asyncMap((qs) async {
      final List<ChatMessage> latest = [];
      for (final doc in qs.docs) {
        final msg = await doc.reference.collection('messages').orderBy('sentAt', descending: true).limit(1).get();
        if (msg.docs.isNotEmpty) {
          latest.add(ChatMessage.fromMap(msg.docs.first.data()..['id'] = msg.docs.first.id..['chatId'] = doc.id));
        }
      }
      return latest;
    });
  }

  Stream<List<ChatMessage>> watchMessages(String chatId) {
    final col = _chats();
    if (col == null) return const Stream<List<ChatMessage>>.empty();
    return col.doc(chatId).collection('messages').orderBy('sentAt', descending: false).snapshots().map(
          (qs) => qs.docs.map((d) => ChatMessage.fromMap(d.data()..['id'] = d.id..['chatId'] = chatId)).toList(),
        );
  }

  Future<String?> ensureChat(String a, String b) async {
    final col = _chats();
    if (col == null) return null;
    final members = [a, b]..sort();
    final existing = await col.where('members', isEqualTo: members).limit(1).get();
    if (existing.docs.isNotEmpty) return existing.docs.first.id;
    final created = await col.add({'members': members, 'updatedAt': FieldValue.serverTimestamp()});
    return created.id;
  }

  Future<void> sendMessage({required String chatId, required String fromUid, required String text}) async {
    final col = _chats();
    if (col == null) return;
    final msg = {
      'fromUid': fromUid,
      'text': text,
      'sentAt': FieldValue.serverTimestamp(),
    };
    await col.doc(chatId).collection('messages').add(msg);
    await col.doc(chatId).update({'updatedAt': FieldValue.serverTimestamp()});
  }
}

final chatServiceProvider = Provider<ChatService>((ref) => ChatService(_safeDb()));

FirebaseFirestore? _safeDb() {
  try {
    return FirebaseFirestore.instance;
  } catch (_) {
    return null;
  }
}
