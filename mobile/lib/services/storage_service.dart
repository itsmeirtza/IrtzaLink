import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

final supabaseClientProvider = Provider<SupabaseClient?>((ref) {
  try {
    final url = dotenv.maybeGet('SUPABASE_URL');
    final key = dotenv.maybeGet('SUPABASE_ANON_KEY');
    if (url == null || key == null) return null;
    return SupabaseClient(url, key);
  } catch (_) {
    return null;
  }
});

class StorageService {
  StorageService(this._client);
  final SupabaseClient? _client;

  Future<String?> uploadProfileImage({required String uid, required File file}) async {
    if (_client == null) return null;
    final path = 'profiles/$uid/${DateTime.now().millisecondsSinceEpoch}_${file.uri.pathSegments.last}';
    final res = await _client!.storage.from('user-files').upload(path, file);
    if (res.isEmpty) return null;
    return _client!.storage.from('user-files').getPublicUrl(path);
  }

  Future<String?> uploadVerificationDoc({required String uid, required File file}) async {
    if (_client == null) return null;
    final path = 'verifications/$uid/${DateTime.now().millisecondsSinceEpoch}_${file.uri.pathSegments.last}';
    final res = await _client!.storage.from('user-files').upload(path, file);
    if (res.isEmpty) return null;
    return _client!.storage.from('user-files').getPublicUrl(path);
  }
}

final storageServiceProvider = Provider<StorageService>((ref) => StorageService(ref.watch(supabaseClientProvider)));
