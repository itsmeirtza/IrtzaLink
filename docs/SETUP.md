# IrtzaLink Setup Guide

This guide will help you set up the complete IrtzaLink system including the web panel, Firebase backend, and Flutter mobile app.

## 📋 Prerequisites

Before starting, make sure you have:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org)
- **npm** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com)
- **Firebase Account** - [Sign up here](https://firebase.google.com)
- **Flutter SDK** (for mobile app) - [Install guide](https://flutter.dev/docs/get-started/install)
- **Android Studio** (for mobile app) - [Download here](https://developer.android.com/studio)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd irtzalink

# Run the setup script (Windows PowerShell)
./scripts/build.ps1

# Or manually install dependencies
cd web_panel && npm install
cd ../firebase/functions && npm install
```

### 2. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `irtzalink` (or your preferred name)
4. Follow the setup wizard

#### Enable Firebase Services

**Authentication:**
1. Go to "Authentication" → "Sign-in method"
2. Enable "Email/Password"
3. Enable "Google"
4. Add authorized domains if needed

**Firestore Database:**
1. Go to "Firestore Database"
2. Click "Create database"
3. Start in test mode (we'll deploy security rules later)
4. Choose a location close to your users

**Firebase Hosting:**
1. Go to "Hosting"
2. Click "Get started"
3. Follow the setup instructions

**Firebase Storage:**
1. Go to "Storage"
2. Click "Get started"
3. Start in test mode
4. Choose same location as Firestore

### 3. Firebase CLI Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
cd irtzalink
firebase init

# Select these services:
# - Firestore
# - Functions
# - Hosting
# - Storage

# Choose your Firebase project
# Accept default settings or customize as needed
```

### 4. Configure Firebase in Code

Update `web_panel/src/services/firebase.js` with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

**To get your config:**
1. Go to Firebase Console
2. Click project settings (gear icon)
3. Scroll down to "Your apps"
4. Click "Web app" icon
5. Copy the config object

### 5. Deploy Firebase Backend

```bash
# Deploy Firestore rules and Functions
firebase deploy --only firestore:rules,functions,storage

# Deploy web hosting
firebase deploy --only hosting
```

### 6. Test the Web Panel

```bash
cd web_panel
npm start
```

The web panel should open at `http://localhost:3000`

## 🔧 Detailed Configuration

### Firestore Security Rules

The security rules are in `firebase/firestore.rules`. Key features:

- Users can only edit their own profiles
- Public profiles are readable by everyone
- Admins can manage all users
- Username reservations prevent conflicts

### Firebase Functions

Functions are in `firebase/functions/src/index.ts`:

- **generateQRCode** - Creates QR codes for user profiles
- **getProfile** - Serves public profile pages
- **checkUsernameAvailability** - Validates usernames
- **reserveUsername** - Claims usernames
- **trackQRScan** - Analytics for QR code scans

### Environment Variables

Create `.env` files if needed:

**web_panel/.env:**
```
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
```

### Hosting Configuration

The `firebase/firebase.json` configures:
- Web panel hosting
- Profile page routing
- Firebase Functions integration

## 📱 Flutter App Setup (Optional)

### 1. Flutter Dependencies

```bash
cd flutter_app
flutter pub get
```

### 2. Firebase Configuration for Flutter

1. Install Firebase CLI tools for Flutter:
```bash
dart pub global activate flutterfire_cli
```

2. Configure Firebase:
```bash
cd flutter_app
flutterfire configure
```

3. Follow the prompts to select your Firebase project

### 3. Build and Test

```bash
# Test on emulator/device
flutter run

# Build APK
flutter build apk --release
```

The APK will be in `flutter_app/build/app/outputs/flutter-apk/app-release.apk`

## 🌐 Domain Setup (Optional)

### Custom Domain

1. In Firebase Console, go to Hosting
2. Click "Add custom domain"
3. Enter your domain (e.g., `irtzalink.com`)
4. Follow DNS setup instructions
5. Wait for SSL certificate provisioning

### Profile URLs

Once deployed, user profiles will be available at:
- Default: `https://your-project.web.app/username`
- Custom: `https://yourdomain.com/username`

## 🔍 Testing Checklist

### Web Panel Testing

- [ ] User registration (Email + Google)
- [ ] Profile creation and editing
- [ ] Social links management
- [ ] QR code generation
- [ ] Analytics tracking
- [ ] Theme switching (Dark/Light)
- [ ] Responsive design (Mobile/Desktop)

### Firebase Testing

- [ ] User authentication
- [ ] Firestore read/write permissions
- [ ] Storage file uploads
- [ ] Functions execution
- [ ] Security rules enforcement

### Profile Pages Testing

- [ ] Public profile access
- [ ] Social links clicking
- [ ] QR code scanning
- [ ] Analytics tracking
- [ ] Theme rendering
- [ ] Mobile responsive design

## 🚨 Troubleshooting

### Common Issues

**Firebase Config Error:**
- Double-check your Firebase config object
- Ensure all services are enabled in Firebase Console

**CORS Errors:**
- Add your domain to Firebase authorized domains
- Check Firebase Functions region settings

**Build Errors:**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Update Node.js to latest LTS version

**Firestore Permission Errors:**
- Check security rules are deployed
- Verify user authentication state

**Functions Not Working:**
- Check Functions logs: `firebase functions:log`
- Verify Functions are deployed: `firebase deploy --only functions`

### Getting Help

1. Check the [Firebase Documentation](https://firebase.google.com/docs)
2. Review error logs in:
   - Firebase Console → Functions → Logs
   - Browser Developer Console
3. Create an issue in the project repository

## 📚 Additional Resources

- [Firebase Web Documentation](https://firebase.google.com/docs/web/setup)
- [React Documentation](https://reactjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Flutter Documentation](https://flutter.dev/docs)

## 💰 Cost Estimation

Firebase Free Tier Limits:
- **Authentication:** 10K users/month
- **Firestore:** 50K reads, 20K writes, 1GB storage/day
- **Hosting:** 10GB storage, 10GB transfer/month
- **Functions:** 2M invocations, 400K GB-seconds/month
- **Storage:** 5GB total

This should easily support hundreds of active users for free!

---

**Need help?** Create an issue in the repository or contact support.