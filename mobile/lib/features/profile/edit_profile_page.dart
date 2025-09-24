import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../models/user_profile.dart';
import '../../services/auth_service.dart';
import '../../services/firestore_service.dart';
import '../../services/storage_service.dart';

class EditProfilePage extends ConsumerStatefulWidget {
  const EditProfilePage({super.key});

  @override
  ConsumerState<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends ConsumerState<EditProfilePage> {
  final _displayName = TextEditingController();
  final _username = TextEditingController();
  final _bio = TextEditingController();
  File? _picked;
  bool _saving = false;

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
          appBar: AppBar(title: const Text('Edit Profile')),
          body: profileStream.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, st) => Center(child: Text('Error: $e')),
            data: (p) {
              _displayName.text = p?.displayName ?? '';
              _username.text = p?.username ?? '';
              _bio.text = p?.bio ?? '';
              return ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Center(
                    child: Stack(
                      children: [
                        CircleAvatar(
                          radius: 48,
                          backgroundImage: _picked != null
                              ? FileImage(_picked!)
                              : p?.photoUrl != null
                                  ? NetworkImage(p!.photoUrl!)
                                  : null as ImageProvider<Object>?,
                          child: p?.photoUrl == null && _picked == null ? const Icon(Icons.person, size: 36) : null,
                        ),
                        Positioned(
                          right: 0,
                          bottom: 0,
                          child: IconButton.filledTonal(onPressed: _pick, icon: const Icon(Icons.camera_alt)),
                        )
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(controller: _displayName, decoration: const InputDecoration(labelText: 'Display name')),
                  const SizedBox(height: 12),
                  TextField(controller: _username, decoration: const InputDecoration(labelText: 'Username'))
                      ,
                  const SizedBox(height: 12),
                  TextField(controller: _bio, maxLines: 3, decoration: const InputDecoration(labelText: 'Bio')),
                  const SizedBox(height: 24),
                  FilledButton.icon(
                    onPressed: _saving ? null : () => _save(p, user.uid),
                    icon: _saving ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.save),
                    label: const Text('Save changes'),
                  ),
                ],
              );
            },
          ),
        );
      },
    );
  }
}

final _profileProvider = StreamProvider.family<UserProfile?, String>((ref, uid) => ref.watch(firestoreServiceProvider).watchProfile(uid));
