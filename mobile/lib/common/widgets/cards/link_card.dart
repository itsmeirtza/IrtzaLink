import 'package:flutter/material.dart';

class LinkCard extends StatelessWidget {
  const LinkCard({super.key, required this.title, required this.url, this.onOpen});
  final String title;
  final String url;
  final VoidCallback? onOpen;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        title: Text(title),
        subtitle: Text(url, maxLines: 1, overflow: TextOverflow.ellipsis),
        trailing: const Icon(Icons.open_in_new),
        onTap: onOpen,
      ),
    );
  }
}
