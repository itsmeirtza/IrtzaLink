import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../services/auth_service.dart';
import '../../services/storage_service.dart';

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
    // Note: image_picker not added here to keep dependencies smaller in this file.
    // Recommend installing image_picker if you want real selection from gallery/camera.
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
          appBar: AppBar(title: const Text('Get Verified')),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              TextField(controller: _fullName, decoration: const InputDecoration(labelText: 'Full name')),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _docType.value,
                decoration: const InputDecoration(labelText: 'Document Type'),
                items: const [DropdownMenuItem(value: 'National ID', child: Text('National ID')), DropdownMenuItem(value: 'Passport', child: Text('Passport'))],
                onChanged: (v) => setState(() => _docType.value = v ?? 'National ID'),
              ),
              const SizedBox(height: 12),
              TextField(controller: _docNumber, decoration: const InputDecoration(labelText: 'Document Number')),
              const SizedBox(height: 12),
              Card(
                child: ListTile(
                  title: const Text('Upload ID Front'),
                  trailing: const Icon(Icons.upload_file),
                  onTap: () => _pick(true),
                ),
              ),
              Card(
                child: ListTile(
                  title: const Text('Upload ID Back'),
                  trailing: const Icon(Icons.upload_file),
                  onTap: () => _pick(false),
                ),
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: _submitting ? null : () => _submit(user.uid),
                icon: _submitting ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.verified),
                label: const Text('Submit for verification'),
              ),
            ],
          ),
        );
      },
    );
  }
}
