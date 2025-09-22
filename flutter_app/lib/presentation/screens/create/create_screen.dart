import 'package:flutter/material.dart';

class CreateScreen extends StatelessWidget {
  const CreateScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create')),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.add_box, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('Create Posts & Content', style: TextStyle(fontSize: 18)),
            Text('Coming Soon!', style: TextStyle(color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}

class ActivityScreen extends StatelessWidget {
  const ActivityScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Activity')),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.favorite, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('Notifications & Messages', style: TextStyle(fontSize: 18)),
            Text('Coming Soon!', style: TextStyle(color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}

class EnhancedProfileScreen extends StatelessWidget {
  const EnhancedProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.person, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('Enhanced Profile', style: TextStyle(fontSize: 18)),
            Text('With Social Features - Coming Soon!', style: TextStyle(color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}