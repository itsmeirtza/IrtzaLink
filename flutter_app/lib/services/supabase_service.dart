import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  static Future<void> init() async {
    final url = dotenv.env['SUPABASE_URL'] ?? '';
    final anonKey = dotenv.env['SUPABASE_ANON_KEY'] ?? '';
    if (url.isEmpty || anonKey.isEmpty) {
      debugPrint('[Supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
      return;
    }
    await Supabase.initialize(url: url, anonKey: anonKey);
    debugPrint('[Supabase] Initialized');
  }

  static SupabaseClient get client => Supabase.instance.client;
}
