import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../data/services/enhanced_auth_service.dart';

class GetVerifiedScreen extends StatefulWidget {
  const GetVerifiedScreen({super.key});

  @override
  State<GetVerifiedScreen> createState() => _GetVerifiedScreenState();
}

class _GetVerifiedScreenState extends State<GetVerifiedScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _reasonController = TextEditingController();
  final _socialLinksController = TextEditingController();
  
  String _selectedCategory = 'Creator';
  bool _isSubmitting = false;

  @override
  void dispose() {
    _fullNameController.dispose();
    _usernameController.dispose();
    _reasonController.dispose();
    _socialLinksController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Get Verified'),
        elevation: 0,
      ),
      body: Consumer<EnhancedAuthService>(
        builder: (context, authService, child) {
          final user = authService.currentUser;
          final userData = authService.userData;
          
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(),
                const SizedBox(height: 24),
                _buildVerificationStatus(userData),
                const SizedBox(height: 24),
                _buildVerificationBenefits(),
                const SizedBox(height: 24),
                _buildApplicationForm(context, user, userData),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Colors.blue, Colors.purple],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.verified, color: Colors.white, size: 32),
              SizedBox(width: 12),
              Text(
                'Get Verified Badge',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          SizedBox(height: 12),
          Text(
            'Stand out with a verified badge and gain credibility in the IrtzaLink community.',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVerificationStatus(Map<String, dynamic>? userData) {
    // Check if user is already verified from web app verified accounts
    final verifiedUsernames = ['ialiwaris', 'itsmeirtza', 'hakeemmuhammadnawaz'];
    final isVerified = userData != null && 
                       userData['username'] != null && 
                       verifiedUsernames.contains(userData['username'].toString().toLowerCase());

    if (isVerified) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.green[50],
          border: Border.all(color: Colors.green[200]!),
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green, size: 24),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Account Verified! ✅',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.green,
                    ),
                  ),
                  Text(
                    'Your account has been verified and you have the blue checkmark.',
                    style: TextStyle(color: Colors.green),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.orange[50],
        border: Border.all(color: Colors.orange[200]!),
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Row(
        children: [
          Icon(Icons.pending, color: Colors.orange, size: 24),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Not Verified',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.orange,
                  ),
                ),
                Text(
                  'Apply for verification to get the blue checkmark badge.',
                  style: TextStyle(color: Colors.orange),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVerificationBenefits() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Verification Benefits',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        _buildBenefit('✅', 'Blue verified badge on your profile'),
        _buildBenefit('🚀', 'Increased visibility and credibility'),
        _buildBenefit('🔒', 'Protection against impersonation'),
        _buildBenefit('⭐', 'Priority in search results'),
        _buildBenefit('📈', 'Access to advanced analytics'),
      ],
    );
  }

  Widget _buildBenefit(String icon, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: Colors.blue[50],
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(icon, style: const TextStyle(fontSize: 16)),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 16),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildApplicationForm(BuildContext context, dynamic user, Map<String, dynamic>? userData) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Apply for Verification',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          
          // Full Name
          _buildTextField(
            controller: _fullNameController,
            label: 'Full Name',
            hint: userData?['display_name'] ?? user?.displayName ?? '',
            icon: Icons.person,
            validator: (value) => value?.isEmpty == true ? 'Full name is required' : null,
          ),
          
          const SizedBox(height: 16),
          
          // Username
          _buildTextField(
            controller: _usernameController,
            label: 'Username',
            hint: userData?['username'] ?? '',
            icon: Icons.alternate_email,
            validator: (value) => value?.isEmpty == true ? 'Username is required' : null,
          ),
          
          const SizedBox(height: 16),
          
          // Category Dropdown
          DropdownButtonFormField<String>(
            value: _selectedCategory,
            decoration: InputDecoration(
              labelText: 'Category',
              prefixIcon: const Icon(Icons.category),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            items: const [
              DropdownMenuItem(value: 'Creator', child: Text('Creator/Influencer')),
              DropdownMenuItem(value: 'Business', child: Text('Business')),
              DropdownMenuItem(value: 'Artist', child: Text('Artist/Musician')),
              DropdownMenuItem(value: 'Public Figure', child: Text('Public Figure')),
              DropdownMenuItem(value: 'Brand', child: Text('Brand/Organization')),
              DropdownMenuItem(value: 'Other', child: Text('Other')),
            ],
            onChanged: (value) => setState(() => _selectedCategory = value!),
          ),
          
          const SizedBox(height: 16),
          
          // Reason for Verification
          _buildTextField(
            controller: _reasonController,
            label: 'Why do you deserve verification?',
            hint: 'Describe your achievements, following, or why you should be verified...',
            icon: Icons.star,
            maxLines: 4,
            validator: (value) => value?.isEmpty == true ? 'Please provide a reason' : null,
          ),
          
          const SizedBox(height: 16),
          
          // Social Links
          _buildTextField(
            controller: _socialLinksController,
            label: 'Social Media Links (Optional)',
            hint: 'Instagram, Twitter, YouTube, etc. (one per line)',
            icon: Icons.link,
            maxLines: 3,
          ),
          
          const SizedBox(height: 24),
          
          // Submit Button
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : () => _submitApplication(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isSubmitting
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text(
                      'Submit Application',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Note
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Text(
              'Note: Verification applications are manually reviewed. You will be notified via email about the status of your application within 5-7 business days.',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    String? hint,
    int maxLines = 1,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      maxLines: maxLines,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: Icon(icon),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
  }

  Future<void> _submitApplication(BuildContext context) async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);
    
    // Simulate API call
    await Future.delayed(const Duration(seconds: 2));
    
    setState(() => _isSubmitting = false);
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Verification application submitted! You will hear back within 5-7 business days.'),
          backgroundColor: Colors.green,
          duration: Duration(seconds: 4),
        ),
      );
      
      // Clear form
      _formKey.currentState!.reset();
      _fullNameController.clear();
      _usernameController.clear();
      _reasonController.clear();
      _socialLinksController.clear();
    }
  }
}