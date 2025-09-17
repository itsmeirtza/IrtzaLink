class SocialLink {
  final String platform;
  final String username;
  final String url;
  final String iconPath;
  final bool isActive;

  SocialLink({
    required this.platform,
    required this.username,
    required this.url,
    required this.iconPath,
    this.isActive = true,
  });

  // Convert to/from Map for Firestore
  Map<String, dynamic> toMap() {
    return {
      'platform': platform,
      'username': username,
      'url': url,
      'iconPath': iconPath,
      'isActive': isActive,
    };
  }

  static SocialLink fromMap(Map<String, dynamic> map) {
    return SocialLink(
      platform: map['platform'] ?? '',
      username: map['username'] ?? '',
      url: map['url'] ?? '',
      iconPath: map['iconPath'] ?? '',
      isActive: map['isActive'] ?? true,
    );
  }

  // Helper methods for common platforms
  static String buildFacebookUrl(String username) {
    return 'https://facebook.com/$username';
  }

  static String buildInstagramUrl(String username) {
    return 'https://instagram.com/$username';
  }

  static String buildTwitterUrl(String username) {
    return 'https://twitter.com/$username';
  }

  static String buildTikTokUrl(String username) {
    return 'https://tiktok.com/@$username';
  }

  static String buildYouTubeUrl(String username) {
    return 'https://youtube.com/$username';
  }

  static String buildLinkedInUrl(String username) {
    return 'https://linkedin.com/in/$username';
  }

  static String buildWhatsAppUrl(String phone) {
    return 'https://wa.me/$phone';
  }

  static String buildTelegramUrl(String username) {
    return 'https://t.me/$username';
  }

  @override
  String toString() {
    return 'SocialLink(platform: $platform, username: $username, url: $url)';
  }
}