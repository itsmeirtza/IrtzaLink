class UserProfile {
  final String id;
  final String displayName;
  final String username;
  final String? photoUrl;
  final String bio;
  final int followers;
  final int following;
  final bool verified;

  UserProfile({
    required this.id,
    required this.displayName,
    required this.username,
    this.photoUrl,
    this.bio = '',
    this.followers = 0,
    this.following = 0,
    this.verified = false,
  });

  factory UserProfile.fromMap(Map<String, dynamic> map) => UserProfile(
        id: map['id'] as String,
        displayName: (map['displayName'] as String?) ?? '',
        username: (map['username'] as String?) ?? '',
        photoUrl: map['photoUrl'] as String?,
        bio: (map['bio'] as String?) ?? '',
        followers: (map['followers'] as int?) ?? 0,
        following: (map['following'] as int?) ?? 0,
        verified: (map['verified'] as bool?) ?? false,
      );

  Map<String, dynamic> toMap() => {
        'displayName': displayName,
        'username': username,
        'photoUrl': photoUrl,
        'bio': bio,
        'followers': followers,
        'following': following,
        'verified': verified,
      };
}
