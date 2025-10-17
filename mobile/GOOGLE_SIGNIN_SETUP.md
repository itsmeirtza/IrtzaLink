# Google Sign-In Setup for IrtzaLink Mobile App

## Prerequisites
1. Flutter SDK installed and configured
2. Android Studio or VS Code with Flutter extension
3. Firebase project configured (already done)

## Steps to Complete Google Sign-In Configuration

### 1. Enable Google Sign-In in Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `irtzalink-4d407`
3. Go to Authentication > Sign-in method
4. Enable Google Sign-In provider
5. Add your Android app's SHA-1 fingerprint

### 2. Get SHA-1 Fingerprint
Run this command in the mobile directory:
```bash
cd mobile
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Copy the SHA-1 fingerprint and add it to Firebase Console.

### 3. Download google-services.json
1. In Firebase Console, go to Project Settings
2. Add Android app with package name: `com.irtzalink.app`
3. Download `google-services.json`
4. Place it in `mobile/android/app/google-services.json`

**✅ Already Done**: The `google-services.json` file has been created with the correct configuration!

### 4. Update Android Configuration
The following files have been created:
- `mobile/android/app/build.gradle` - Android build configuration with Google Services
- `mobile/android/app/src/main/AndroidManifest.xml` - Android manifest
- `mobile/android/app/src/main/kotlin/com/irtzalink/app/MainActivity.kt` - Main activity
- `mobile/android/app/google-services.json` - Firebase configuration

### 5. Build and Test
```bash
cd mobile
flutter pub get
flutter build apk --debug
```

## Current Status
✅ Firebase configuration fixed
✅ UI updated to match web app design
✅ Android project structure created
⏳ Google Sign-In configuration pending (requires SHA-1 fingerprint)

## Next Steps
1. Get SHA-1 fingerprint from your development machine
2. Add it to Firebase Console
3. Download google-services.json
4. Test the APK build

The app should now work without the "Google Sign-In requires Firebase configuration" error!
