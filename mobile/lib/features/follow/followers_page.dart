import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../services/follow_service.dart';
import '../../services/auth_service.dart';

class FollowersPage extends ConsumerWidget {
  const FollowersPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Placeholder UI; in a full build, we'd list followers and following with actions.
    return Scaffold(
      appBar: AppBar(title: const Text('Followers & Following')),
      body: const Center(child: Text('Coming soon: manage followers / follow back / friends')), 
    );
  }
}
