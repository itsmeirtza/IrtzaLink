import 'package:flutter/material.dart';

const _baseVerified = <String>{
  'ialiwaris',
  'itsmeirtza',
  'hakeemmuhammadnawaz',
  'hellojuttsab',
};

class VerifiedBadge extends StatelessWidget {
  const VerifiedBadge({super.key, required this.username, this.size = 16});
  final String? username;
  final double size;

  bool get _isVerified => username != null && _baseVerified.contains(username!.toLowerCase());

  @override
  Widget build(BuildContext context) {
    if (!_isVerified) return const SizedBox.shrink();
    return Icon(Icons.verified, color: Colors.blue, size: size);
  }
}
