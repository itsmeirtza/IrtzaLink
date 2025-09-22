# Mobile Setup: Firebase Auth + Supabase Data (Flutter)

Follow these steps to configure the mobile app with Firebase Auth and Supabase for data storage.

1) Prerequisites
- Flutter SDK installed
- Firebase project created
- Supabase project created

2) Firebase (Auth)
- Configure Firebase for Android (google-services.json) and iOS (GoogleService-Info.plist) as usual
- Ensure Email/Password and Google providers are enabled

3) Supabase (Data)
- In Supabase, create a Project and copy:
  - Project URL (SUPABASE_URL)
  - anon public key (SUPABASE_ANON_KEY)

4) Flutter env variables
- Create flutter_app/.env from the example:
  - Copy flutter_app/.env.example to flutter_app/.env
  - Fill SUPABASE_URL and SUPABASE_ANON_KEY

5) Run app
- From flutter_app/, run:
  flutter pub get
  flutter run

6) Using Supabase client
- Access client via: SupabaseService.client
- Example: await SupabaseService.client.from('profiles').select();

Security
- Do NOT commit flutter_app/.env (already in .gitignore)
- For production builds, consider using --dart-define or remote config instead of bundling .env
