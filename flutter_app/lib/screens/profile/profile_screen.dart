import 'package:flutter/material.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../services/user_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/theme_switcher.dart';
import '../../services/auth_service.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F23),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F0F23),
        title: const Text('Profile', style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit, color: Colors.white),
            onPressed: () {
              // TODO: Navigate to edit profile screen
            },
          ),
        ],
      ),
      body: Consumer2<UserService, AuthService>(
        builder: (context, userService, authService, child) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // User Info Section
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24.0),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E1E2E),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF3B82F6), width: 1),
                  ),
                  child: Column(
                    children: [
                      // Profile Picture
                      CircleAvatar(
                        radius: 50,
                        backgroundColor: const Color(0xFF3B82F6),
                        backgroundImage: userService.photoURL?.isNotEmpty == true
                            ? NetworkImage(userService.photoURL!)
                            : null,
                        child: userService.photoURL?.isEmpty != false
                            ? const Icon(Icons.person, size: 50, color: Colors.white)
                            : null,
                      ),
                      const SizedBox(height: 16),
                      
                      // Name and Username
                      Text(
                        userService.displayName ?? 'User',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '@${userService.username ?? 'username'}',
                        style: const TextStyle(
                          color: Color(0xFF3B82F6),
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'https://irtzalink.site/${userService.username ?? 'username'}',
                        style: const TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 16),
                      
                      // Action Buttons
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          _buildActionButton(
                            context,
                            'Copy Link',
                            Icons.copy,
                            () => _copyProfileLink(userService),
                          ),
                          _buildActionButton(
                            context,
                            'Share',
                            Icons.share,
                            () => _shareProfile(userService),
                          ),
                          _buildActionButton(
                            context,
                            'Edit Profile',
                            Icons.edit,
                            () {},
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                
                // Digital Card Section
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20.0),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E1E2E),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.credit_card, color: Colors.white, size: 24),
                          SizedBox(width: 8),
                          Text(
                            'Your Digital Card',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      
                      // Digital Card Preview
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(20.0),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0F0F23),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFF3B82F6), width: 1),
                        ),
                        child: Column(
                          children: [
                            // Card Header
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'IrtzaLink',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Container(
                                  width: 80,
                                  height: 80,
                                  child: userService.qrCodeURL?.isNotEmpty == true
                                      ? QrImageView(
                                          data: 'https://irtzalink.site/${userService.username}',
                                          version: QrVersions.auto,
                                          size: 80.0,
                                          backgroundColor: Colors.white,
                                        )
                                      : Container(
                                          decoration: BoxDecoration(
                                            color: Colors.white,
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: const Center(
                                            child: Icon(Icons.qr_code, size: 40),
                                          ),
                                        ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 20),
                            
                            // User Info in Card
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 30,
                                  backgroundColor: const Color(0xFF3B82F6),
                                  backgroundImage: userService.photoURL?.isNotEmpty == true
                                      ? NetworkImage(userService.photoURL!)
                                      : null,
                                  child: userService.photoURL?.isEmpty != false
                                      ? const Icon(Icons.person, size: 30, color: Colors.white)
                                      : null,
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        userService.displayName ?? 'User',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      Text(
                                        userService.bio?.isNotEmpty == true
                                            ? userService.bio!
                                            : 'Digital Creator',
                                        style: const TextStyle(
                                          color: Color(0xFF94A3B8),
                                          fontSize: 14,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 20),
                            
                            // Social Links in Card
                            Wrap(
                              spacing: 12,
                              runSpacing: 8,
                              children: userService.socialLinks.entries
                                  .where((entry) => entry.value.isNotEmpty)
                                  .map((entry) => _buildSocialIcon(entry.key, entry.value))
                                  .toList(),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
  
  Widget _buildActionButton(BuildContext context, String label, IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFF3B82F6),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: Colors.white, size: 16),
            const SizedBox(width: 4),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildSocialIcon(String platform, String value) {
    IconData icon;
    Color color;
    
    switch (platform.toLowerCase()) {
      case 'facebook':
        icon = FontAwesomeIcons.facebook;
        color = Colors.blue;
        break;
      case 'instagram':
        icon = FontAwesomeIcons.instagram;
        color = Colors.pink;
        break;
      case 'twitter':
        icon = FontAwesomeIcons.twitter;
        color = Colors.lightBlue;
        break;
      case 'tiktok':
        icon = FontAwesomeIcons.tiktok;
        color = Colors.black;
        break;
      case 'youtube':
        icon = FontAwesomeIcons.youtube;
        color = Colors.red;
        break;
      case 'linkedin':
        icon = FontAwesomeIcons.linkedin;
        color = Colors.blue;
        break;
      case 'whatsapp':
        icon = FontAwesomeIcons.whatsapp;
        color = Colors.green;
        break;
      default:
        icon = FontAwesomeIcons.link;
        color = const Color(0xFF3B82F6);
    }
    
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(
        icon,
        color: Colors.white,
        size: 20,
      ),
    );
  }
  
  void _copyProfileLink(UserService userService) {
    final profileUrl = 'https://irtzalink.site/${userService.username}';
    Clipboard.setData(ClipboardData(text: profileUrl));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Profile link copied to clipboard!'),
        backgroundColor: Color(0xFF3B82F6),
      ),
    );
  }
  
  void _shareProfile(UserService userService) {
    // TODO: Implement share functionality
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Share functionality coming soon!'),
        backgroundColor: Color(0xFF3B82F6),
      ),
    );
  }
}
