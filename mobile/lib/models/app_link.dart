class AppLink {
  final String id;
  final String title;
  final String url;
  final int order;

  AppLink({
    required this.id,
    required this.title,
    required this.url,
    required this.order,
  });

  factory AppLink.fromMap(Map<String, dynamic> map) => AppLink(
        id: map['id'] as String,
        title: (map['title'] as String?) ?? '',
        url: (map['url'] as String?) ?? '',
        order: (map['order'] as int?) ?? 0,
      );

  Map<String, dynamic> toMap() => {
        'title': title,
        'url': url,
        'order': order,
      };
}
