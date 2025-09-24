class NotificationItem {
  final String id;
  final String type; // follow, message, system
  final String title;
  final String body;
  final DateTime createdAt;
  final bool read;

  NotificationItem({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.createdAt,
    this.read = false,
  });

  factory NotificationItem.fromMap(Map<String, dynamic> map) => NotificationItem(
        id: map['id'] as String,
        type: (map['type'] as String?) ?? 'system',
        title: (map['title'] as String?) ?? '',
        body: (map['body'] as String?) ?? '',
        createdAt: DateTime.tryParse(map['createdAt']?.toString() ?? '') ?? DateTime.now(),
        read: (map['read'] as bool?) ?? false,
      );

  Map<String, dynamic> toMap() => {
        'type': type,
        'title': title,
        'body': body,
        'createdAt': createdAt.toIso8601String(),
        'read': read,
      };
}
