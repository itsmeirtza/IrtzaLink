# IrtzaLink Mobile App (Flutter)

This directory contains the Flutter mobile app for irtzalink.vercel.app with:
- Firebase Authentication + Firestore (database)
- Supabase for file storage (profile images, verification docs)
- Real-time sync via Firestore streams
- Push notifications via Firebase Cloud Messaging
- Animations and modern Material 3 design
- Bottom navigation and smooth transitions

Important: Platform folders (android/ios) are intentionally not committed. They are generated in CI with `flutter create .` before building. Locally, run `flutter create .` inside `mobile/` after installing Flutter.

Setup (local):
1) Install Flutter (stable) and Android Studio SDK.
2) From repo root: `cd mobile`.
3) Run: `flutter create .` (generates platform folders).
4) Firebase: run `dart pub global activate flutterfire_cli` and `flutterfire configure` to generate `lib/firebase_options.dart` and Google config files.
5) Supabase: create a project and fill `.env` from `.env.example`.
6) Run: `flutter pub get`.
7) Start app: `flutter run -d emulator-5554` (or your device ID).

Environment:
- Copy `.env.example` to `.env` and set:
  SUPABASE_URL=...
  SUPABASE_ANON_KEY=...

Notes:
- The app tolerates missing Firebase/Supabase at runtime for non-networked screens, but full functionality requires proper config.
- Tests use fakes/mocks; no live services needed.
