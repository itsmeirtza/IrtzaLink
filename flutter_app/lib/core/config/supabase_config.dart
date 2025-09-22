/// Supabase configuration for the IrtzaLink app
/// This matches the web app's Supabase configuration
class SupabaseConfig {
  // SUPABASE PROJECT CONFIGURED ✅
  static const String url = 'https://ceeapuwdpjdlsfsntsdq.supabase.co';
  static const String anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlZWFwdXdkcGpkbHNmc250c2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMTgxMjcsImV4cCI6MjA3Mzc5NDEyN30.O-x1RA-4tp2YaVja7UcGNhJNhE03yTZMpC0DudyRa24';

  /// Database table names
  static const String usersTable = 'users';
  static const String postsTable = 'posts';
  static const String commentsTable = 'comments';
  static const String likesTable = 'likes';
  static const String notificationsTable = 'notifications';
  static const String followsTable = 'follows';
  static const String analyticsTable = 'analytics';

  /// Storage bucket names
  static const String profilePicturesBucket = 'profile_pictures';
  static const String postMediaBucket = 'post_media';

  /// Real-time channel names
  static const String postsChannel = 'posts_channel';
  static const String notificationsChannel = 'notifications_channel';
  static const String messagesChannel = 'messages_channel';
}