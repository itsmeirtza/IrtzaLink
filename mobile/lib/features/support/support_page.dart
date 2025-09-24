import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher_string.dart';

class SupportPage extends StatelessWidget {
  const SupportPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Help & Support')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Need help? Reach out to us:'),
          const SizedBox(height: 12),
          ListTile(
            leading: const Icon(Icons.email_outlined),
            title: const Text('Email'),
            subtitle: const Text('support@irtzalink.com'),
            onTap: () => launchUrlString('mailto:support@irtzalink.com?subject=IrtzaLink%20Support'),
          ),
          ListTile(
            leading: const Icon(Icons.language),
            title: const Text('Website'),
            subtitle: const Text('https://irtzalink.vercel.app'),
            onTap: () => launchUrlString('https://irtzalink.vercel.app'),
          ),
        ],
      ),
    );
  }
}
