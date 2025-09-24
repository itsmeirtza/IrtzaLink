import 'package:flutter/material.dart';

import '../../../models/user_profile.dart';

class ProfileCard extends StatelessWidget {
  const ProfileCard({super.key, required this.profile});
  final UserProfile profile;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () {},
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundImage: profile.photoUrl != null ? NetworkImage(profile.photoUrl!) : null,
                child: profile.photoUrl == null ? const Icon(Icons.person) : null,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(profile.displayName, style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(width: 6),
                        if (profile.verified) const Icon(Icons.verified, color: Colors.blue, size: 18),
                      ],
                    ),
                    Text('@${profile.username}', style: Theme.of(context).textTheme.bodySmall),
                    const SizedBox(height: 8),
                    Text(profile.bio, maxLines: 2, overflow: TextOverflow.ellipsis),
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}
