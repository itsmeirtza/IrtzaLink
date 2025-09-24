class ChatMessage {
  final String id;
  final String chatId;
  final String fromUid;
  final String text;
  final DateTime sentAt;

  ChatMessage({
    required this.id,
    required this.chatId,
    required this.fromUid,
    required this.text,
    required this.sentAt,
  });

  factory ChatMessage.fromMap(Map<String, dynamic> map) => ChatMessage(
        id: map['id'] as String,
        chatId: (map['chatId'] as String?) ?? '',
        fromUid: (map['fromUid'] as String?) ?? '',
        text: (map['text'] as String?) ?? '',
        sentAt: DateTime.tryParse(map['sentAt']?.toString() ?? '') ?? DateTime.now(),
      );

  Map<String, dynamic> toMap() => {
        'chatId': chatId,
        'fromUid': fromUid,
        'text': text,
        'sentAt': sentAt.toIso8601String(),
      };
}
