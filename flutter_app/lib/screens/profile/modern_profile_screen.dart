import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/auth_service.dart';
import '../../services/user_service.dart';
import '../../utils/design_system.dart';
import '../../widgets/theme_switcher.dart';

class ModernProfileScreen extends StatefulWidget {
  const ModernProfileScreen({Key? key}) : super(key: key);

  @override
  State<ModernProfileScreen> createState() => _ModernProfileScreenState();
}

class _ModernProfileScreenState extends State<ModernProfileScreen>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: DesignSystem.animationMedium,
      vsync: this,
    );
    
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
    
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.1),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOutCubic,
    ));
    
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Consumer<AuthService>(
      builder: (context, authService, child) {
        final user = authService.user;
        final userData = authService.userData;
        
        if (user == null) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(),
            ),
          );
        }

        return Scaffold(
          body: CustomScrollView(
            slivers: [
              // Modern App Bar with gradient
              SliverAppBar(
                expandedHeight: 120.0,
                floating: false,
                pinned: true,
                backgroundColor: Colors.transparent,
                flexibleSpace: Container(
                  decoration: BoxDecoration(
                    gradient: isDark 
                        ? DesignSystem.purpleGradient
                        : DesignSystem.blueGradient,
                  ),
                  child: FlexibleSpaceBar(
                    title: Text(
                      'My Profile',
                      style: DesignSystem.headingSmall.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    centerTitle: true,
                  ),
                ),
                actions: [
                  const CompactThemeSwitcher(),
                  IconButton(
                    icon: const Icon(Icons.share, color: Colors.white),
                    onPressed: _shareProfile,
                  ),
                  const SizedBox(width: 8),
                ],
              ),
              
              // Profile Content
              SliverToBoxAdapter(
                child: FadeTransition(
                  opacity: _fadeAnimation,
                  child: SlideTransition(
                    position: _slideAnimation,
                    child: Padding(
                      padding: EdgeInsets.all(DesignSystem.spacing20),
                      child: Column(
                        children: [
                          // Profile Header Card
                          _buildProfileHeader(user, userData, isDark),
                          
                          SizedBox(height: DesignSystem.spacing24),
                          
                          // Stats Row
                          _buildStatsRow(userData),
                          
                          SizedBox(height: DesignSystem.spacing24),
                          
                          // Social Links Section
                          _buildSocialLinks(userData),
                          
                          SizedBox(height: DesignSystem.spacing24),
                          
                          // Contact Info Section  
                          _buildContactInfo(userData),
                          
                          SizedBox(height: DesignSystem.spacing24),
                          
                          // Action Buttons
                          _buildActionButtons(isDark),
                          
                          SizedBox(height: DesignSystem.spacing32),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildProfileHeader(user, userData, bool isDark) {
    return Container(
      padding: EdgeInsets.all(DesignSystem.spacing24),
      decoration: DesignSystem.getCardDecoration(isDark: isDark),
      child: Column(
        children: [
          // Profile Picture with animation
          AnimatedContainer(
            duration: DesignSystem.animationMedium,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: DesignSystem.shadowLarge,
            ),
            child: CircleAvatar(
              radius: 50,
              backgroundColor: DesignSystem.primaryBlue,
              backgroundImage: user.photoURL != null
                  ? CachedNetworkImageProvider(user.photoURL!)
                  : null,
              child: user.photoURL == null
                  ? const Icon(
                      Icons.person,
                      size: 50,
                      color: Colors.white,
                    )
                  : null,
            ),
          ),
          
          SizedBox(height: DesignSystem.spacing16),
          
          // Display Name
          Text(
            userData?['displayName'] ?? user.displayName ?? 'User',
            style: DesignSystem.headingMedium.copyWith(
              color: isDark ? DesignSystem.textDark : DesignSystem.textPrimary,
            ),
          ),
          
          SizedBox(height: DesignSystem.spacing8),
          
          // Username
          if (userData?['username'] != null)
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '@${userData!['username']}',
                  style: DesignSystem.bodyLarge.copyWith(
                    color: DesignSystem.primaryBlue,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(width: 4),
                const Icon(
                  Icons.verified,
                  color: DesignSystem.primaryBlue,
                  size: 16,
                ),
              ],
            ),
          
          SizedBox(height: DesignSystem.spacing8),
          
          // Email
          Text(
            user.email ?? '',
            style: DesignSystem.bodyMedium.copyWith(
              color: isDark 
                  ? DesignSystem.textDarkSecondary 
                  : DesignSystem.textSecondary,
            ),
          ),
          
          SizedBox(height: DesignSystem.spacing12),
          
          // Bio
          if (userData?['bio'] != null)
            Text(
              userData!['bio'],
              textAlign: TextAlign.center,
              style: DesignSystem.bodyMedium.copyWith(
                color: isDark ? DesignSystem.textDark : DesignSystem.textPrimary,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildStatsRow(userData) {
    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            'Followers',
            '${userData?['followersCount'] ?? 0}',
            Icons.people_outline,
            DesignSystem.primaryBlue,
          ),
        ),
        SizedBox(width: DesignSystem.spacing12),
        Expanded(
          child: _buildStatCard(
            'Following',
            '${userData?['followingCount'] ?? 0}',
            Icons.person_add_outlined,
            DesignSystem.secondaryPurple,
          ),
        ),
        SizedBox(width: DesignSystem.spacing12),
        Expanded(
          child: _buildStatCard(
            'Links',
            '${userData?['linksCount'] ?? 0}',
            Icons.link,
            DesignSystem.accentGreen,
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      padding: EdgeInsets.all(DesignSystem.spacing16),
      decoration: DesignSystem.getCardDecoration(isDark: isDark),
      child: Column(
        children: [
          Icon(
            icon,
            color: color,
            size: 24,
          ),
          SizedBox(height: DesignSystem.spacing8),
          Text(
            value,
            style: DesignSystem.headingSmall.copyWith(
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            title,
            style: DesignSystem.bodySmall.copyWith(
              color: isDark 
                  ? DesignSystem.textDarkSecondary 
                  : DesignSystem.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSocialLinks(userData) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final socialLinks = userData?['socialLinks'] as Map<String, dynamic>?;
    
    if (socialLinks == null || socialLinks.isEmpty) {
      return Container(
        padding: EdgeInsets.all(DesignSystem.spacing20),
        decoration: DesignSystem.getCardDecoration(isDark: isDark),
        child: Column(
          children: [
            Icon(
              Icons.link_off,
              size: 48,
              color: isDark 
                  ? DesignSystem.textDarkSecondary 
                  : DesignSystem.textSecondary,
            ),
            SizedBox(height: DesignSystem.spacing12),
            Text(
              'No social links added yet',
              style: DesignSystem.bodyMedium.copyWith(
                color: isDark 
                    ? DesignSystem.textDarkSecondary 
                    : DesignSystem.textSecondary,
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: EdgeInsets.all(DesignSystem.spacing20),
      decoration: DesignSystem.getCardDecoration(isDark: isDark),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Social Links',
            style: DesignSystem.headingSmall.copyWith(
              color: isDark ? DesignSystem.textDark : DesignSystem.textPrimary,
            ),
          ),
          SizedBox(height: DesignSystem.spacing16),
          Wrap(
            spacing: DesignSystem.spacing12,
            runSpacing: DesignSystem.spacing12,
            children: socialLinks.entries.map((entry) {
              return _buildSocialIcon(entry.key, entry.value);
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildSocialIcon(String platform, String url) {
    if (url.isEmpty) return const SizedBox.shrink();

    IconData icon;
    Color color;

    switch (platform.toLowerCase()) {
      case 'facebook':
        icon = FontAwesomeIcons.facebook;
        color = const Color(0xFF1877F2);
        break;
      case 'instagram':
        icon = FontAwesomeIcons.instagram;
        color = const Color(0xFFE4405F);
        break;
      case 'twitter':
        icon = FontAwesomeIcons.twitter;
        color = const Color(0xFF1DA1F2);
        break;
      case 'linkedin':
        icon = FontAwesomeIcons.linkedin;
        color = const Color(0xFF0A66C2);
        break;
      case 'youtube':
        icon = FontAwesomeIcons.youtube;
        color = const Color(0xFFFF0000);
        break;
      case 'tiktok':
        icon = FontAwesomeIcons.tiktok;
        color = const Color(0xFF000000);
        break;
      default:
        icon = FontAwesomeIcons.link;
        color = DesignSystem.primaryBlue;
    }

    return GestureDetector(
      onTap: () => _launchURL(url),
      child: Container(
        padding: EdgeInsets.all(DesignSystem.spacing12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(DesignSystem.radiusMedium),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Icon(
          icon,
          color: color,
          size: 24,
        ),
      ),
    );
  }

  Widget _buildContactInfo(userData) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final contactInfo = userData?['contactInfo'] as Map<String, dynamic>?;
    
    return Container(
      padding: EdgeInsets.all(DesignSystem.spacing20),
      decoration: DesignSystem.getCardDecoration(isDark: isDark),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Contact Information',
            style: DesignSystem.headingSmall.copyWith(
              color: isDark ? DesignSystem.textDark : DesignSystem.textPrimary,
            ),
          ),
          SizedBox(height: DesignSystem.spacing16),
          if (contactInfo?['phone'] != null && contactInfo!['phone'].isNotEmpty)
            _buildContactItem(
              Icons.phone,
              'Phone',
              contactInfo['phone'],
              () => _launchURL('tel:${contactInfo['phone']}'),
            ),
          if (contactInfo?['website'] != null && contactInfo!['website'].isNotEmpty)
            _buildContactItem(
              Icons.web,
              'Website',
              contactInfo['website'],
              () => _launchURL(contactInfo['website']),
            ),
        ],
      ),
    );
  }

  Widget _buildContactItem(IconData icon, String title, String value, VoidCallback onTap) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Padding(
      padding: EdgeInsets.only(bottom: DesignSystem.spacing12),
      child: GestureDetector(
        onTap: onTap,
        child: Row(
          children: [
            Icon(
              icon,
              color: DesignSystem.primaryBlue,
              size: 20,
            ),
            SizedBox(width: DesignSystem.spacing12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: DesignSystem.bodySmall.copyWith(
                      color: isDark 
                          ? DesignSystem.textDarkSecondary 
                          : DesignSystem.textSecondary,
                    ),
                  ),
                  Text(
                    value,
                    style: DesignSystem.bodyMedium.copyWith(
                      color: isDark ? DesignSystem.textDark : DesignSystem.textPrimary,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.open_in_new,
              size: 16,
              color: DesignSystem.primaryBlue,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons(bool isDark) {
    return Column(
      children: [
        // Edit Profile Button
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _editProfile,
            icon: const Icon(Icons.edit),
            label: const Text('Edit Profile'),
            style: DesignSystem.primaryButtonStyle,
          ),
        ),
        
        SizedBox(height: DesignSystem.spacing12),
        
        // Settings Button
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: _openSettings,
            icon: const Icon(Icons.settings),
            label: const Text('Settings'),
            style: DesignSystem.secondaryButtonStyle,
          ),
        ),
      ],
    );
  }

  void _shareProfile() {
    final authService = Provider.of<AuthService>(context, listen: false);
    final userData = authService.userData;
    final username = userData?['username'];
    
    if (username != null) {
      Share.share(
        'Check out my profile on IrtzaLink: https://irtzalink.vercel.app/$username',
        subject: 'My IrtzaLink Profile',
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please set up your username first'),
          backgroundColor: Colors.orange,
        ),
      );
    }
  }

  void _editProfile() {
    // Navigate to edit profile screen
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Edit profile feature coming soon!'),
        backgroundColor: DesignSystem.primaryBlue,
      ),
    );
  }

  void _openSettings() {
    // Navigate to settings
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Opening settings...'),
        backgroundColor: DesignSystem.primaryBlue,
      ),
    );
  }

  void _launchURL(String url) async {
    try {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      } else {
        throw 'Could not launch $url';
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Could not open link: $e'),
          backgroundColor: DesignSystem.error,
        ),
      );
    }
  }
}