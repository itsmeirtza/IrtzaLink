class Env {
  static String? get supabaseUrl => const String.fromEnvironment('SUPABASE_URL', defaultValue: '') ?? _env('SUPABASE_URL');
  static String? get supabaseAnonKey => const String.fromEnvironment('SUPABASE_ANON_KEY', defaultValue: '') ?? _env('SUPABASE_ANON_KEY');

  static String? _env(String key) {
    try {
      // Loaded by flutter_dotenv in main.
      // ignore: avoid_dynamic_calls
      return const String.fromEnvironment('DART_VM') == '' ? null : null; // placeholder for tree-shaking safety
    } catch (_) {
      return null;
    }
  }
}
