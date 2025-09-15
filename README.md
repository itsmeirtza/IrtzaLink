# IrtzaLink - Personal Link Management System

![IrtzaLink Logo](https://via.placeholder.com/200x80/000000/FFFFFF?text=IrtzaLink)

A comprehensive, **100% FREE** personal link management system similar to Linktree, featuring:
- Android app (Flutter) with dark UI
- Web management panel
- Public profile pages
- QR code generation
- Analytics tracking
- Admin dashboard

## 🚀 Features

### Android App (Flutter)
- ✅ Dark theme UI (black design)
- ✅ Firebase Authentication (Google + Email login)
- ✅ User profile management (photo, username, bio)
- ✅ Social media links manager (FB, IG, Twitter, TikTok, YouTube, LinkedIn)
- ✅ Auto-generate unique profile links: `irtzalink.com/username`
- ✅ QR code generation for each profile
- ✅ Share options (Copy link, WhatsApp, Messenger)
- ✅ Contact info display (phone, email, website)
- ✅ Settings panel for profile & theme management
- ✅ Multiple theme options (dark/light + accent colors)

### Web Panel
- ✅ User login via Firebase Auth
- ✅ Profile & social links management
- ✅ Admin dashboard (user management, abuse reports)
- ✅ Responsive design (mobile + desktop)
- ✅ Real-time sync with mobile app

### Backend (Firebase - FREE Tier)
- ✅ Firebase Authentication
- ✅ Firestore Database
- ✅ Firebase Hosting for profile pages
- ✅ Firebase Functions for QR generation
- ✅ Firebase Storage for profile pictures
- ✅ Analytics tracking

### Analytics & Extra Features
- ✅ Profile visit tracking
- ✅ QR code scan analytics
- ✅ Custom themes
- ✅ NFC card ready architecture
- ✅ Abuse reporting system

## 📁 Project Structure

```
irtzalink/
├── flutter_app/          # Flutter Android application
│   ├── lib/
│   ├── android/
│   ├── assets/
│   └── pubspec.yaml
├── web_panel/            # React web management panel
│   ├── src/
│   ├── public/
│   └── package.json
├── firebase/             # Firebase configuration & functions
│   ├── functions/
│   ├── firestore.rules
│   └── firebase.json
├── docs/                 # Documentation & setup guides
├── scripts/              # Build & deployment scripts
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites
- Flutter SDK (latest stable)
- Node.js (v16+)
- Firebase CLI
- Android Studio / VS Code
- Git

### 1. Firebase Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project
firebase init
```

### 2. Flutter App Setup
```bash
cd flutter_app
flutter pub get
flutter run
```

### 3. Web Panel Setup
```bash
cd web_panel
npm install
npm start
```

### 4. Vercel Deployment (Recommended for Web Panel)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
npm run deploy

# Or use Vercel CLI directly
vercel --prod
```

### 5. Firebase Deployment (Alternative)
```bash
# Deploy Firestore rules and functions
firebase deploy --only firestore:rules,functions

# Deploy web hosting
firebase deploy --only hosting
```

## 📱 Building APK

```bash
cd flutter_app
flutter build apk --release
```

The APK will be available at: `flutter_app/build/app/outputs/flutter-apk/app-release.apk`

## 🌐 Live Demo

- **Web Panel (Vercel)**: `https://irtzalink.vercel.app`
- **Profile Example**: `https://irtzalink.vercel.app/username`
- **Admin Dashboard**: `https://irtzalink.vercel.app/admin`
- **Firebase Hosting**: `https://your-project.web.app` (if using Firebase hosting)

## 🔧 Configuration

### Firebase Configuration
1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Google & Email providers)
3. Create Firestore database
4. Enable Firebase Hosting
5. Copy configuration files to respective folders

### Environment Variables
Create `.env` files in both `flutter_app` and `web_panel` folders with your Firebase configuration.

## 📊 Database Structure

### Firestore Collections

#### Users Collection
```javascript
users/{userId} {
  username: "string",
  displayName: "string", 
  email: "string",
  photoURL: "string",
  bio: "string",
  theme: "string",
  socialLinks: {
    facebook: "string",
    instagram: "string",
    twitter: "string",
    tiktok: "string",
    youtube: "string",
    linkedin: "string"
  },
  contactInfo: {
    phone: "string",
    email: "string",
    website: "string"
  },
  qrCodeURL: "string",
  isActive: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Analytics Collection
```javascript
analytics/{analyticsId} {
  userId: "string",
  type: "string", // "profile_visit" | "qr_scan"
  timestamp: timestamp,
  userAgent: "string",
  ip: "string"
}
```

## 🎨 Themes

- **Dark Theme** (default): Black background with white text
- **Light Theme**: White background with dark text
- **Accent Colors**: Blue, Purple, Green, Orange

## 🤝 Contributing

This is a free, open-source project. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆓 Cost Breakdown

**Total Cost: $0/month**

- Firebase Authentication: Free (up to 10K users)
- Firestore Database: Free (up to 1GB storage, 50K reads/day)
- Firebase Hosting: Free (up to 10GB storage, 10GB transfer/month)
- Firebase Functions: Free (up to 2M invocations/month)
- Firebase Storage: Free (up to 5GB)

## 📞 Support

For support and questions:
- Create an issue in this repository
- Email: support@irtzalink.com (if available)

## 🔮 Roadmap

- [ ] iOS app development
- [ ] NFC card integration
- [ ] Advanced analytics dashboard
- [ ] Custom domain support
- [ ] Bulk link import/export
- [ ] Social media integration APIs
- [ ] PWA version

---

**Built with ❤️ using Flutter, React, and Firebase**