import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/user_profile.dart';
import '../../models/app_link.dart';
import '../../services/auth_service.dart';
import '../../services/firestore_service.dart';
import '../../services/storage_service.dart';
import '../../theme.dart';

class EditProfilePage extends ConsumerStatefulWidget {
  const EditProfilePage({super.key});

  @override
  ConsumerState<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends ConsumerState<EditProfilePage> with TickerProviderStateMixin {
  final _displayName = TextEditingController();
  final _username = TextEditingController();
  final _bio = TextEditingController();
  
  // Social Links Controllers
  final _instagram = TextEditingController();
  final _twitter = TextEditingController();
  final _facebook = TextEditingController();
  final _linkedin = TextEditingController();
  final _youtube = TextEditingController();
  final _tiktok = TextEditingController();
  final _github = TextEditingController();
  final _website = TextEditingController();
  
  // Contact Info Controllers
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _location = TextEditingController();
  
  // Custom Links
  final List<AppLink> _customLinks = [];
  
  File? _picked;
  bool _saving = false;
  int _currentTab = 0;
  late TabController _tabController;
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }
  
  @override
  void dispose() {
    _tabController.dispose();
    _displayName.dispose();
    _username.dispose();
    _bio.dispose();
    _instagram.dispose();
    _twitter.dispose();
    _facebook.dispose();
    _linkedin.dispose();
    _youtube.dispose();
    _tiktok.dispose();
    _github.dispose();
    _website.dispose();
    _phone.dispose();
    _email.dispose();
    _location.dispose();
    super.dispose();
  }

  Future<void> _pick() async {
    final picker = ImagePicker();
    final x = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (x != null) setState(() => _picked = File(x.path));
  }

  Future<void> _save(UserProfile? profile, String uid) async {
    setState(() => _saving = true);
    try {
      String? photoUrl = profile?.photoUrl;
      if (_picked != null) {
        photoUrl = await ref.read(storageServiceProvider).uploadProfileImage(uid: uid, file: _picked!);
      }
      final updated = UserProfile(
        id: uid,
        displayName: _displayName.text.trim(),
        username: _username.text.trim(),
        photoUrl: photoUrl,
        bio: _bio.text.trim(),
        followers: profile?.followers ?? 0,
        following: profile?.following ?? 0,
        verified: profile?.verified ?? false,
      );
      await ref.read(firestoreServiceProvider).upsertProfile(updated);
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authStateProvider);
    return auth.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, st) => Scaffold(body: Center(child: Text('Error: $e'))),
      data: (user) {
        if (user == null) return const Scaffold(body: Center(child: Text('Please sign in')));
        final profileStream = ref.watch(_profileProvider(user.uid));
        return Scaffold(
          backgroundColor: Theme.of(context).colorScheme.background,
          appBar: AppBar(
            title: const Text('Edit Profile'),
            backgroundColor: Colors.transparent,
            elevation: 0,
            actions: [
              TextButton(
                onPressed: _saving ? null : () => _save(profileStream.value, user.uid),
                child: _saving 
                  ? SizedBox(
                      width: 20, 
                      height: 20, 
                      child: CircularProgressIndicator(strokeWidth: 2, color: ThemeService.primaryColor)
                    )
                  : Text('Save', style: TextStyle(color: ThemeService.primaryColor, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          body: profileStream.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, st) => Center(child: Text('Error: $e')),
            data: (p) {
              // Load existing data only once
              if (_displayName.text.isEmpty && p != null) {
                _displayName.text = p.displayName;
                _username.text = p.username;
                _bio.text = p.bio;
                // Load social links when available
                // _instagram.text = p.socialLinks?['instagram'] ?? '';
                // etc...
              }
              
              return Column(
                children: [
                  // Tab Bar
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardColor,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: TabBar(
                      controller: _tabController,
                      onTap: (index) => setState(() => _currentTab = index),
                      indicator: BoxDecoration(
                        color: ThemeService.primaryColor,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      labelColor: Colors.white,
                      unselectedLabelColor: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                      dividerColor: Colors.transparent,
                      tabs: const [
                        Tab(text: 'Profile'),
                        Tab(text: 'Social'),
                        Tab(text: 'Contact'),
                        Tab(text: 'Links'),
                      ],
                    ),
                  ),
                  
                  // Content
                  Expanded(
                    child: _buildTabContent(p),
                  ),
                ],
              );
            },
          ),
        );
      },
    );
  }
  
  Widget _buildTabContent(UserProfile? profile) {
    switch (_currentTab) {
      case 0:
        return _buildProfileTab(profile);
      case 1:
        return _buildSocialTab();
      case 2:
        return _buildContactTab();
      case 3:
        return _buildLinksTab();
      default:
        return _buildProfileTab(profile);
    }
  }
  
  Widget _buildProfileTab(UserProfile? profile) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Profile Photo Section
          Center(
            child: Column(
              children: [
                Stack(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: ThemeService.primaryColor, width: 3),
                        boxShadow: [
                          BoxShadow(
                            color: ThemeService.primaryColor.withOpacity(0.3),
                            blurRadius: 15,
                            offset: const Offset(0, 5),
                          ),
                        ],
                      ),
                      child: CircleAvatar(
                        radius: 50,
                        backgroundImage: _picked != null
                            ? FileImage(_picked!)
                            : profile?.photoUrl != null
                                ? NetworkImage(profile!.photoUrl!)
                                : null,
                        child: profile?.photoUrl == null && _picked == null 
                          ? Icon(Icons.person, size: 50, color: Colors.grey.shade400) 
                          : null,
                      ),
                    ),
                    Positioned(
                      right: 0,
                      bottom: 0,
                      child: Container(
                        decoration: BoxDecoration(
                          color: ThemeService.primaryColor,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: ThemeService.primaryColor.withOpacity(0.3),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: IconButton(
                          onPressed: _pick,
                          icon: const Icon(Icons.camera_alt, color: Colors.white, size: 20),
                          padding: const EdgeInsets.all(8),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  'Tap to change profile photo',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 32),
          
          // Form Fields
          _buildSectionHeader('Personal Information', Icons.person_outline),
          const SizedBox(height: 16),
          
          _buildTextField(
            controller: _displayName,
            label: 'Display Name',
            hint: 'Your full name',
            icon: Icons.badge_outlined,
          ),
          
          const SizedBox(height: 16),
          
          _buildTextField(
            controller: _username,
            label: 'Username',
            hint: 'Choose a unique username',
            icon: Icons.alternate_email,
            prefix: '@',
          ),
          
          const SizedBox(height: 16),
          
          _buildTextField(
            controller: _bio,
            label: 'Bio',
            hint: 'Tell people about yourself...',
            icon: Icons.description_outlined,
            maxLines: 4,
            maxLength: 160,
          ),
        ],
      ),
    );
  }
  
  Widget _buildSocialTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader('Social Media Links', Icons.share),
          const SizedBox(height: 8),
          Text(
            'Connect your social media accounts to appear on your profile',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
            ),
          ),
          const SizedBox(height: 24),
          
          _buildSocialLinkField(
            controller: _instagram,
            platform: 'Instagram',
            icon: Icons.camera_alt,
            color: const Color(0xFFE4405F),
            hint: 'instagram.com/username',
          ),
          
          _buildSocialLinkField(
            controller: _twitter,
            platform: 'Twitter/X',
            icon: Icons.alternate_email,
            color: const Color(0xFF1DA1F2),
            hint: 'twitter.com/username',
          ),
          
          _buildSocialLinkField(
            controller: _facebook,
            platform: 'Facebook',
            icon: Icons.facebook,
            color: const Color(0xFF1877F2),
            hint: 'facebook.com/username',
          ),
          
          _buildSocialLinkField(
            controller: _linkedin,
            platform: 'LinkedIn',
            icon: Icons.work_outline,
            color: const Color(0xFF0A66C2),
            hint: 'linkedin.com/in/username',
          ),
          
          _buildSocialLinkField(
            controller: _youtube,
            platform: 'YouTube',
            icon: Icons.play_circle_outline,
            color: const Color(0xFFFF0000),
            hint: 'youtube.com/channel/...',
          ),
          
          _buildSocialLinkField(
            controller: _tiktok,
            platform: 'TikTok',
            icon: Icons.music_note,
            color: const Color(0xFF000000),
            hint: 'tiktok.com/@username',
          ),
          
          _buildSocialLinkField(
            controller: _github,
            platform: 'GitHub',
            icon: Icons.code,
            color: const Color(0xFF333333),
            hint: 'github.com/username',
          ),
          
          _buildSocialLinkField(
            controller: _website,
            platform: 'Website',
            icon: Icons.language,
            color: ThemeService.primaryColor,
            hint: 'https://yourwebsite.com',
          ),
        ],
      ),
    );
  }
  
  Widget _buildContactTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader('Contact Information', Icons.contact_phone),
          const SizedBox(height: 8),
          Text(
            'Add your contact details (optional)',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
            ),
          ),
          const SizedBox(height: 24),
          
          _buildTextField(
            controller: _email,
            label: 'Email',
            hint: 'your@email.com',
            icon: Icons.email_outlined,
            keyboardType: TextInputType.emailAddress,
          ),
          
          const SizedBox(height: 16),
          
          _buildTextField(
            controller: _phone,
            label: 'Phone Number',
            hint: '+1 (555) 123-4567',
            icon: Icons.phone_outlined,
            keyboardType: TextInputType.phone,
          ),
          
          const SizedBox(height: 16),
          
          _buildTextField(
            controller: _location,
            label: 'Location',
            hint: 'City, Country',
            icon: Icons.location_on_outlined,
          ),
          
          const SizedBox(height: 24),
          
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.blue.shade200),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline, color: Colors.blue.shade700, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Your contact information is optional and will only be shown if you choose to display it.',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.blue.shade700,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildLinksTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Custom Links',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: ThemeService.primaryColor,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Add custom links to your profile',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                      ),
                    ),
                  ],
                ),
              ),
              ElevatedButton.icon(
                onPressed: _addCustomLink,
                style: ElevatedButton.styleFrom(
                  backgroundColor: ThemeService.primaryColor,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Add Link'),
              ),
            ],
          ),
          
          const SizedBox(height: 24),
          
          if (_customLinks.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
                ),
              ),
              child: Column(
                children: [
                  Icon(
                    Icons.link_off,
                    size: 64,
                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.4),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No custom links yet',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Add links to your projects, portfolio, or anything you want to share',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                    ),
                  ),
                ],
              ),
            )
          else
            ...List.generate(_customLinks.length, (index) {
              final link = _customLinks[index];
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
                  ),
                ),
                child: ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: ThemeService.primaryColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      Icons.link,
                      color: ThemeService.primaryColor,
                      size: 20,
                    ),
                  ),
                  title: Text(link.title),
                  subtitle: Text(link.url, maxLines: 1, overflow: TextOverflow.ellipsis),
                  trailing: PopupMenuButton(
                    itemBuilder: (context) => [
                      const PopupMenuItem(
                        value: 'edit',
                        child: Row(
                          children: [
                            Icon(Icons.edit, size: 18),
                            SizedBox(width: 8),
                            Text('Edit'),
                          ],
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'delete',
                        child: Row(
                          children: [
                            Icon(Icons.delete, size: 18, color: Colors.red),
                            SizedBox(width: 8),
                            Text('Delete', style: TextStyle(color: Colors.red)),
                          ],
                        ),
                      ),
                    ],
                    onSelected: (value) {
                      if (value == 'edit') {
                        _editCustomLink(index);
                      } else if (value == 'delete') {
                        _deleteCustomLink(index);
                      }
                    },
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }
}

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: ThemeService.primaryColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: ThemeService.primaryColor, size: 20),
        ),
        const SizedBox(width: 12),
        Text(
          title,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
            color: ThemeService.primaryColor,
          ),
        ),
      ],
    );
  }
  
  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    String? prefix,
    int maxLines = 1,
    int? maxLength,
    TextInputType? keyboardType,
  }) {
    return TextField(
      controller: controller,
      maxLines: maxLines,
      maxLength: maxLength,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: Icon(icon, color: ThemeService.primaryColor),
        prefixText: prefix,
        counterText: maxLength != null ? null : '',
      ),
    );
  }
  
  Widget _buildSocialLinkField({
    required TextEditingController controller,
    required String platform,
    required IconData icon,
    required Color color,
    required String hint,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: controller.text.isNotEmpty 
            ? color.withOpacity(0.3)
            : Theme.of(context).colorScheme.outline.withOpacity(0.2),
        ),
      ),
      child: TextField(
        controller: controller,
        decoration: InputDecoration(
          labelText: platform,
          hintText: hint,
          prefixIcon: Container(
            margin: const EdgeInsets.all(8),
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        ),
        onChanged: (value) => setState(() {}), // Rebuild to update border color
      ),
    );
  }
  
  void _addCustomLink() {
    showDialog(
      context: context,
      builder: (context) => _CustomLinkDialog(
        onSave: (title, url) {
          setState(() {
            _customLinks.add(AppLink(
              id: DateTime.now().millisecondsSinceEpoch.toString(),
              title: title,
              url: url,
            ));
          });
        },
      ),
    );
  }
  
  void _editCustomLink(int index) {
    final link = _customLinks[index];
    showDialog(
      context: context,
      builder: (context) => _CustomLinkDialog(
        title: link.title,
        url: link.url,
        onSave: (title, url) {
          setState(() {
            _customLinks[index] = AppLink(
              id: link.id,
              title: title,
              url: url,
            );
          });
        },
      ),
    );
  }
  
  void _deleteCustomLink(int index) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Link'),
        content: const Text('Are you sure you want to delete this link?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              setState(() => _customLinks.removeAt(index));
              Navigator.pop(context);
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}

class _CustomLinkDialog extends StatefulWidget {
  final String title;
  final String url;
  final Function(String title, String url) onSave;
  
  const _CustomLinkDialog({
    this.title = '',
    this.url = '',
    required this.onSave,
  });
  
  @override
  State<_CustomLinkDialog> createState() => _CustomLinkDialogState();
}

class _CustomLinkDialogState extends State<_CustomLinkDialog> {
  late TextEditingController _titleController;
  late TextEditingController _urlController;
  
  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.title);
    _urlController = TextEditingController(text: widget.url);
  }
  
  @override
  void dispose() {
    _titleController.dispose();
    _urlController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.title.isEmpty ? 'Add Custom Link' : 'Edit Link'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _titleController,
            decoration: const InputDecoration(
              labelText: 'Link Title',
              hintText: 'My Portfolio',
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _urlController,
            decoration: const InputDecoration(
              labelText: 'URL',
              hintText: 'https://example.com',
            ),
            keyboardType: TextInputType.url,
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () {
            if (_titleController.text.trim().isNotEmpty && 
                _urlController.text.trim().isNotEmpty) {
              widget.onSave(_titleController.text.trim(), _urlController.text.trim());
              Navigator.pop(context);
            }
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: ThemeService.primaryColor,
            foregroundColor: Colors.white,
          ),
          child: const Text('Save'),
        ),
      ],
    );
  }
}

final _profileProvider = StreamProvider.family<UserProfile?, String>((ref, uid) => ref.watch(firestoreServiceProvider).watchProfile(uid));
