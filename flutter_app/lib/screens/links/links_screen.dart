import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/user_service.dart';
import '../../models/social_link.dart';

class LinksScreen extends StatefulWidget {
  const LinksScreen({Key? key}) : super(key: key);

  @override
  State<LinksScreen> createState() => _LinksScreenState();
}

class _LinksScreenState extends State<LinksScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isEditing = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Manage Links'),
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(_isEditing ? Icons.save : Icons.edit),
            onPressed: () {
              if (_isEditing && _formKey.currentState!.validate()) {
                _formKey.currentState!.save();
                context.read<UserService>().updateSocialLinks();
                setState(() => _isEditing = false);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Links updated successfully!')),
                );
              } else {
                setState(() => _isEditing = !_isEditing);
              }
            },
          ),
        ],
      ),
      body: Consumer<UserService>(
        builder: (context, userService, child) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Profile Link Preview
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Your Profile Link',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.all(12.0),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    'irtzalink.com/${userService.username}',
                                    style: const TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.copy),
                                  onPressed: () {
                                    // TODO: Copy to clipboard
                                  },
                                ),
                                IconButton(
                                  icon: const Icon(Icons.share),
                                  onPressed: () {
                                    // TODO: Share profile link
                                  },
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  
                  // Social Media Links
                  Text(
                    'Social Media Links',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 10),
                  
                  _buildSocialLinkField(
                    'Facebook',
                    FontAwesomeIcons.facebook,
                    Colors.blue.shade700,
                    userService.socialLinks['facebook'] ?? '',
                    'https://facebook.com/',
                    (value) => userService.socialLinks['facebook'] = value,
                  ),
                  
                  _buildSocialLinkField(
                    'Instagram',
                    FontAwesomeIcons.instagram,
                    Colors.purple.shade400,
                    userService.socialLinks['instagram'] ?? '',
                    'https://instagram.com/',
                    (value) => userService.socialLinks['instagram'] = value,
                  ),
                  
                  _buildSocialLinkField(
                    'Twitter',
                    FontAwesomeIcons.twitter,
                    Colors.blue.shade400,
                    userService.socialLinks['twitter'] ?? '',
                    'https://twitter.com/',
                    (value) => userService.socialLinks['twitter'] = value,
                  ),
                  
                  _buildSocialLinkField(
                    'TikTok',
                    FontAwesomeIcons.tiktok,
                    Colors.black,
                    userService.socialLinks['tiktok'] ?? '',
                    'https://tiktok.com/',
                    (value) => userService.socialLinks['tiktok'] = value,
                  ),
                  
                  _buildSocialLinkField(
                    'YouTube',
                    FontAwesomeIcons.youtube,
                    Colors.red.shade600,
                    userService.socialLinks['youtube'] ?? '',
                    'https://youtube.com/',
                    (value) => userService.socialLinks['youtube'] = value,
                  ),
                  
                  _buildSocialLinkField(
                    'LinkedIn',
                    FontAwesomeIcons.linkedin,
                    Colors.blue.shade800,
                    userService.socialLinks['linkedin'] ?? '',
                    'https://linkedin.com/in/',
                    (value) => userService.socialLinks['linkedin'] = value,
                  ),
                  
                  _buildSocialLinkField(
                    'WhatsApp',
                    FontAwesomeIcons.whatsapp,
                    Colors.green.shade600,
                    userService.socialLinks['whatsapp'] ?? '',
                    'https://wa.me/',
                    (value) => userService.socialLinks['whatsapp'] = value,
                  ),
                  
                  _buildSocialLinkField(
                    'Telegram',
                    FontAwesomeIcons.telegram,
                    Colors.blue.shade500,
                    userService.socialLinks['telegram'] ?? '',
                    'https://t.me/',
                    (value) => userService.socialLinks['telegram'] = value,
                  ),
                  
                  const SizedBox(height: 20),
                  
                  // Contact Information
                  Text(
                    'Contact Information',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 10),
                  
                  _buildContactField(
                    'Phone',
                    Icons.phone,
                    Colors.green,
                    userService.contactInfo['phone'] ?? '',
                    'Enter your phone number',
                    (value) => userService.contactInfo['phone'] = value,
                  ),
                  
                  _buildContactField(
                    'Email',
                    Icons.email,
                    Colors.blue,
                    userService.contactInfo['email'] ?? '',
                    'Enter your email address',
                    (value) => userService.contactInfo['email'] = value,
                  ),
                  
                  _buildContactField(
                    'Website',
                    Icons.web,
                    Colors.purple,
                    userService.contactInfo['website'] ?? '',
                    'Enter your website URL',
                    (value) => userService.contactInfo['website'] = value,
                  ),
                  
                  const SizedBox(height: 30),
                  
                  // Preview Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        _showPreviewDialog(context, userService);
                      },
                      icon: const Icon(Icons.preview),
                      label: const Text('Preview Profile'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSocialLinkField(
    String platform,
    IconData icon,
    Color color,
    String currentValue,
    String prefix,
    Function(String) onSaved,
  ) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                FaIcon(icon, color: color, size: 20),
                const SizedBox(width: 12),
                Text(
                  platform,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                if (currentValue.isNotEmpty && !_isEditing)
                  IconButton(
                    icon: const Icon(Icons.open_in_new),
                    onPressed: () => _launchURL('$prefix$currentValue'),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            TextFormField(
              initialValue: currentValue,
              enabled: _isEditing,
              decoration: InputDecoration(
                hintText: 'Username or handle',
                prefixText: _isEditing ? prefix : null,
                border: _isEditing ? const OutlineInputBorder() : InputBorder.none,
                filled: !_isEditing,
                fillColor: Colors.grey.shade50,
              ),
              onSaved: (value) => onSaved(value ?? ''),
              validator: (value) {
                if (value != null && value.isNotEmpty) {
                  if (platform == 'Email' && !value.contains('@')) {
                    return 'Please enter a valid email';
                  }
                }
                return null;
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContactField(
    String label,
    IconData icon,
    Color color,
    String currentValue,
    String hint,
    Function(String) onSaved,
  ) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 20),
                const SizedBox(width: 12),
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            TextFormField(
              initialValue: currentValue,
              enabled: _isEditing,
              decoration: InputDecoration(
                hintText: hint,
                border: _isEditing ? const OutlineInputBorder() : InputBorder.none,
                filled: !_isEditing,
                fillColor: Colors.grey.shade50,
              ),
              onSaved: (value) => onSaved(value ?? ''),
            ),
          ],
        ),
      ),
    );
  }

  void _launchURL(String url) async {
    final Uri uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  void _showPreviewDialog(BuildContext context, UserService userService) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Profile Preview'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircleAvatar(
                radius: 40,
                backgroundImage: userService.photoURL != null
                    ? NetworkImage(userService.photoURL!)
                    : null,
                child: userService.photoURL == null
                    ? const Icon(Icons.person, size: 40)
                    : null,
              ),
              const SizedBox(height: 16),
              Text(
                userService.displayName ?? 'User Name',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              Text(
                '@${userService.username}',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 16),
              if (userService.bio?.isNotEmpty == true) ...[
                Text(userService.bio!),
                const SizedBox(height: 16),
              ],
              ...userService.socialLinks.entries
                  .where((entry) => entry.value.isNotEmpty)
                  .map((entry) => ListTile(
                        leading: _getSocialIcon(entry.key),
                        title: Text(entry.key.toUpperCase()),
                        subtitle: Text(entry.value),
                        dense: true,
                      )),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Widget _getSocialIcon(String platform) {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return FaIcon(FontAwesomeIcons.facebook, color: Colors.blue.shade700);
      case 'instagram':
        return FaIcon(FontAwesomeIcons.instagram, color: Colors.purple.shade400);
      case 'twitter':
        return FaIcon(FontAwesomeIcons.twitter, color: Colors.blue.shade400);
      case 'tiktok':
        return const FaIcon(FontAwesomeIcons.tiktok, color: Colors.black);
      case 'youtube':
        return FaIcon(FontAwesomeIcons.youtube, color: Colors.red.shade600);
      case 'linkedin':
        return FaIcon(FontAwesomeIcons.linkedin, color: Colors.blue.shade800);
      case 'whatsapp':
        return FaIcon(FontAwesomeIcons.whatsapp, color: Colors.green.shade600);
      case 'telegram':
        return FaIcon(FontAwesomeIcons.telegram, color: Colors.blue.shade500);
      default:
        return const Icon(Icons.link);
    }
  }
}