import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class AdminPage extends StatelessWidget {
  const AdminPage({super.key});

  Uri get _adminUri => Uri.parse('https://irtzalink.vercel.app/admin');

  Future<void> _openAdmin() async {
    if (!await launchUrl(_adminUri, mode: LaunchMode.externalApplication)) {
      throw Exception('Could not launch $_adminUri');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Admin Panel')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'The Admin Panel is managed on the web for full functionality. Use the button below to open it.',
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: _openAdmin,
              icon: const Icon(Icons.admin_panel_settings),
              label: const Text('Open Admin Panel (Web)'),
            ),
          ],
        ),
      ),
    );
  }
}
