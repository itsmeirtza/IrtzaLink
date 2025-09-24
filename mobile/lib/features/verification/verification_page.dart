import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../services/auth_service.dart';
import '../../services/storage_service.dart';
import '../../theme.dart';

class VerificationPage extends ConsumerStatefulWidget {
  const VerificationPage({super.key});

  @override
  ConsumerState<VerificationPage> createState() => _VerificationPageState();
}

class _VerificationPageState extends ConsumerState<VerificationPage> {
  final _fullName = TextEditingController();
  final _docType = ValueNotifier<String>('National ID');
  final _docNumber = TextEditingController();
  File? _front;
  File? _back;
  bool _submitting = false;

  Future<void> _pick(bool front) async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await showDialog<XFile?>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Image'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Camera'),
              onTap: () async {
                final img = await picker.pickImage(source: ImageSource.camera);
                Navigator.pop(context, img);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Gallery'),
              onTap: () async {
                final img = await picker.pickImage(source: ImageSource.gallery);
                Navigator.pop(context, img);
              },
            ),
          ],
        ),
      ),
    );
    
    if (image != null) {
      setState(() {
        if (front) {
          _front = File(image.path);
        } else {
          _back = File(image.path);
        }
      });
    }
  }

  Future<void> _submit(String uid) async {
    setState(() => _submitting = true);
    try {
      final storage = ref.read(storageServiceProvider);
      String? frontUrl;
      String? backUrl;
      if (_front != null) frontUrl = await storage.uploadVerificationDoc(uid: uid, file: _front!);
      if (_back != null) backUrl = await storage.uploadVerificationDoc(uid: uid, file: _back!);
      // Save request in Firestore under users/{uid}/verification/
      // For simplicity, we just show a snackbar here.
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Verification submitted.')));
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _submitting = false);
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
        return Scaffold(
          backgroundColor: Theme.of(context).colorScheme.background,
          appBar: AppBar(
            title: const Text('Get Verified'),
            backgroundColor: Colors.transparent,
            elevation: 0,
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header Card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.blue.shade600, Colors.blue.shade800],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.verified,
                          size: 48,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Get Your Blue Checkmark',
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Join the verified community and stand out with the iconic blue checkmark badge.',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.white.withOpacity(0.9),
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
                
                // Form Fields
                Text(
                  'Personal Information',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: ThemeService.primaryColor,
                  ),
                ),
                const SizedBox(height: 16),
                
                TextField(
                  controller: _fullName,
                  decoration: InputDecoration(
                    labelText: 'Full Name',
                    hintText: 'Enter your full legal name',
                    prefixIcon: Icon(Icons.person_outline, color: ThemeService.primaryColor),
                  ),
                ),
                const SizedBox(height: 16),
                
                DropdownButtonFormField<String>(
                  value: _docType.value,
                  decoration: InputDecoration(
                    labelText: 'Document Type',
                    prefixIcon: Icon(Icons.badge_outlined, color: ThemeService.primaryColor),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'National ID', child: Text('National ID')),
                    DropdownMenuItem(value: 'Passport', child: Text('Passport')),
                    DropdownMenuItem(value: 'Driver License', child: Text('Driver License')),
                  ],
                  onChanged: (v) => setState(() => _docType.value = v ?? 'National ID'),
                ),
                const SizedBox(height: 16),
                
                TextField(
                  controller: _docNumber,
                  decoration: InputDecoration(
                    labelText: 'Document Number',
                    hintText: 'Enter your document number',
                    prefixIcon: Icon(Icons.numbers, color: ThemeService.primaryColor),
                  ),
                ),
                const SizedBox(height: 32),
                
                // Document Upload Section
                Text(
                  'Document Upload',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: ThemeService.primaryColor,
                  ),
                ),
                const SizedBox(height: 16),
                
                _DocumentUploadCard(
                  title: 'Front Side of Document',
                  subtitle: 'Clear photo showing all details',
                  file: _front,
                  onTap: () => _pick(true),
                ),
                const SizedBox(height: 16),
                
                _DocumentUploadCard(
                  title: 'Back Side of Document',
                  subtitle: 'Clear photo of the reverse side',
                  file: _back,
                  onTap: () => _pick(false),
                ),
                
                const SizedBox(height: 32),
                
                // Requirements Info
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.blue.shade200),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.info_outline, color: Colors.blue.shade700, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'Requirements',
                            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                              color: Colors.blue.shade700,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      _RequirementItem('• Government-issued photo ID'),
                      _RequirementItem('• Clear, high-quality photos'),
                      _RequirementItem('• All text must be readable'),
                      _RequirementItem('• Both front and back sides required'),
                    ],
                  ),
                ),
                
                const SizedBox(height: 32),
                
                // Submit Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _submitting || _front == null || _back == null ? null : () => _submit(user.uid),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: ThemeService.primaryColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 4,
                    ),
                    child: _submitting
                        ? Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              ),
                              const SizedBox(width: 12),
                              const Text('Submitting for Review...'),
                            ],
                          )
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.verified),
                              const SizedBox(width: 8),
                              const Text('Submit for Verification'),
                            ],
                          ),
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Disclaimer
                Text(
                  'Your documents will be reviewed within 24-48 hours. We keep your information secure and private.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                  ),
                  textAlign: TextAlign.center,
                ),
                
                const SizedBox(height: 32),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _DocumentUploadCard extends StatelessWidget {
  const _DocumentUploadCard({
    required this.title,
    required this.subtitle,
    required this.file,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final File? file;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: file != null 
            ? ThemeService.successColor.withOpacity(0.5)
            : Theme.of(context).colorScheme.outline.withOpacity(0.3),
          width: 2,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: file != null 
                      ? ThemeService.successColor.withOpacity(0.1)
                      : ThemeService.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    file != null 
                      ? Icons.check_circle_outline
                      : Icons.upload_file_outlined,
                    color: file != null 
                      ? ThemeService.successColor
                      : ThemeService.primaryColor,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: file != null 
                            ? ThemeService.successColor
                            : null,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        file != null ? 'Image selected' : subtitle,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  file != null ? Icons.edit : Icons.add_photo_alternate,
                  color: Theme.of(context).colorScheme.onSurface.withOpacity(0.4),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RequirementItem extends StatelessWidget {
  const _RequirementItem(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Text(
        text,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          color: Colors.blue.shade700,
        ),
      ),
    );
  }
}
