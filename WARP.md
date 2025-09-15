# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Architecture Overview

IrtzaLink is a personal link management system (similar to Linktree) with three main components:

### Core Components
1. **Web Panel** (`web_panel/`): React-based admin interface for managing profiles and links
2. **Flutter App** (`flutter_app/`): Android mobile app for profile management on-the-go  
3. **Firebase Backend** (`firebase/`): Serverless backend with Authentication, Firestore, Functions, Storage, and Hosting

### Key Architecture Patterns
- **Multi-platform authentication**: Shared Firebase Auth across web and mobile
- **Real-time data sync**: Firestore provides real-time updates between web panel and mobile app
- **Dual hosting setup**: Web panel hosted on main domain, public profiles served via Firebase Functions
- **Username-based routing**: Public profiles accessible at `/:username` URLs
- **Analytics tracking**: Built-in visitor and QR scan analytics via Firebase Functions

## Essential Development Commands

### Initial Setup
```powershell
# Run the automated setup script (Windows)
.\scripts\build.ps1

# Or manual setup:
cd web_panel && npm install
cd ..\firebase\functions && npm install
```

### Web Panel Development
```bash
# Start development server
cd web_panel
npm start

# Build for production
npm run build

# Run tests
npm test
```

### Firebase Operations
```bash
# Deploy all Firebase services
firebase deploy

# Deploy specific services
firebase deploy --only firestore:rules,functions
firebase deploy --only hosting
firebase deploy --only functions

# Test functions locally
cd firebase/functions
npm run serve

# View function logs
firebase functions:log
```

### Flutter App Development
```bash
# Install dependencies
cd flutter_app
flutter pub get

# Run on device/emulator
flutter run

# Build release APK
flutter build apk --release
```

### Testing Commands
```bash
# Test single component (Web Panel)
cd web_panel
npm test -- --testNamePattern="ComponentName"

# Test Firebase Functions locally
cd firebase/functions
npm run shell

# Test Firebase rules
firebase emulators:start --only firestore
```

## Firebase Configuration

### Required Firebase Services
- **Authentication**: Email/Password + Google Sign-in
- **Firestore Database**: User profiles, analytics, reports, username reservations
- **Firebase Hosting**: Web panel and public profile hosting
- **Firebase Functions**: QR generation, username management, profile serving
- **Firebase Storage**: Profile pictures and assets

### Key Firebase Functions
- `generateQRCode`: Creates QR codes for user profiles
- `getProfile`: Serves public profile pages at `/:username`
- `checkUsernameAvailability`: Validates username availability
- `reserveUsername`: Claims usernames to prevent conflicts
- `trackQRScan`: Records analytics for QR code scans

### Firestore Collections Structure
- `users/`: User profiles with social links, themes, contact info
- `analytics/`: Profile visit and QR scan tracking
- `reports/`: Abuse reports for moderation  
- `usernames/`: Username reservations to prevent conflicts
- `admins/`: Admin user permissions

## Development Environment Notes

### Firebase Configuration
The Firebase config is stored in `web_panel/src/services/firebase.js`. When working with a new Firebase project:
1. Update the `firebaseConfig` object with your project credentials
2. Enable required services in Firebase Console
3. Deploy security rules with `firebase deploy --only firestore:rules`

### Local Development URLs
- Web Panel: `http://localhost:3000`
- User Dashboard: `http://localhost:3000/dashboard`
- Public Profile: `http://localhost:3000/username`
- Admin Panel: `http://localhost:3000/admin`

### Theme System
The app supports dark/light themes with accent colors:
- Default: Dark mode (black background)
- Theme state managed in React context and localStorage
- Flutter app uses matching theme system with Provider

### Authentication Flow
1. Users sign in via Google or Email/Password
2. Profile creation with username selection
3. Username availability checked via Firebase Function
4. Profile data stored in Firestore with real-time sync

### QR Code Generation
- QR codes generated server-side via Firebase Functions
- Links point to public profile URLs
- QR scan analytics tracked automatically

## File Structure Conventions

### React Components (`web_panel/src/`)
- `pages/`: Route-level components (Dashboard, Profile, Analytics, etc.)
- `components/`: Reusable UI components (Navbar, LoadingSpinner, etc.)
- `services/`: Firebase integration and API calls
- `utils/`: Helper functions and utilities

### Firebase Functions (`firebase/functions/src/`)
- TypeScript-based with strict typing
- Express.js for HTTP functions
- CORS enabled for cross-origin requests

### Flutter Structure (`flutter_app/lib/`)
- Provider pattern for state management
- Firebase integration via FlutterFire plugins
- Material Design with custom dark theme

## Common Development Patterns

### Error Handling
All Firebase operations return structured responses:
```javascript
{ success: boolean, data?: any, error?: string }
```

### Data Validation
- Usernames: lowercase, alphanumeric, 3-20 characters
- Social links: validated URL format
- Profile photos: uploaded to Firebase Storage

### Security Rules
- Users can only edit their own profiles
- Public profiles readable by anyone
- Admin permissions managed via `admins` collection
- Analytics creation allowed for tracking

## Deployment Notes

### Production Deployment
1. Build web panel: `cd web_panel && npm run build`
2. Deploy to Firebase: `firebase deploy`
3. Flutter APK: `flutter build apk --release`

### Environment-Specific Configuration
- Firebase project settings in `firebase.json`
- Web panel build output configured for Firebase Hosting
- Profile routes handled by Firebase Functions

This project is designed to run entirely on Firebase's free tier, making it cost-effective for personal use while maintaining professional functionality.