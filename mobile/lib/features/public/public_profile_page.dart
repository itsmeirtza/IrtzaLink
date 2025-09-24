import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:qr_flutter/qr_flutter.dart';

class PublicProfilePage extends StatelessWidget {
  const PublicProfilePage({super.key, required this.username});
  final String username;

  Uri get _profileUri => Uri.parse('https://irtzalink.vercel.app/${username.isNotEmpty ? username : ''}');

  Future<void> _openProfile() async {
    final uri = _profileUri;
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      throw Exception('Could not launch $uri');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Public Profile')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            if (username.isNotEmpty)
              Text('Username: @$username', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Text(_profileUri.toString(), textAlign: TextAlign.center),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: 160,
                      height: 160,
                      child: QrImageView(
                        data: _profileUri.toString(),
                        version: QrVersions.auto,
                      ),
                    ),
                    const SizedBox(height: 12),
                    FilledButton.icon(
                      onPressed: _openProfile,
                      icon: const Icon(Icons.open_in_new),
                      label: const Text('Open in browser'),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
