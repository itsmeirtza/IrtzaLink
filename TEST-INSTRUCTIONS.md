# 🚀 IrtzaLink Testing Instructions

## ✅ Firebase Setup Status:
- [x] Firebase Project Created: irtzalink-4d407
- [x] Firebase Configuration Updated
- [x] Firebase CLI Installed
- [ ] Authentication Enabled (Do this now!)
- [ ] Firestore Database Created
- [ ] Storage Enabled (Optional)

## 🔥 Enable Firebase Services:

### 1. Authentication:
1. Go to: https://console.firebase.google.com/u/0/project/irtzalink-4d407
2. Click **Authentication** → **Get started**
3. **Sign-in method** tab:
   - Enable **Email/Password** 
   - Enable **Google** (select support email)

### 2. Firestore Database:
1. Click **Firestore Database** → **Create database**
2. **Start in test mode** → **Next**
3. Location: **asia-south1 (Mumbai)** → **Done**

## 🌐 Test Website:

```bash
cd C:\Users\Dynabook\irtzalink\web_panel
npm start
```

Website will open at: http://localhost:3000

## 🧪 Features to Test:

### Authentication:
- [x] Login page loads
- [ ] Email signup works
- [ ] Google login works
- [ ] Dashboard loads after login

### Profile Management:
- [ ] Create profile
- [ ] Add social links
- [ ] Generate QR code
- [ ] Upload profile picture (if storage enabled)

### Public Profile:
- [ ] Access profile via username: localhost:3000/username
- [ ] Social links work
- [ ] Theme display correct

## 🚨 Troubleshooting:

**If login fails:**
1. Check Firebase Authentication is enabled
2. Check console for errors (F12)
3. Verify Firebase config is correct

**If build fails:**
1. Clear cache: `npm start -- --reset-cache`
2. Reinstall: `rm -rf node_modules && npm install`

## 🎯 Next Steps:
1. Test all features locally
2. Deploy to Firebase Hosting
3. Build Flutter APK
4. Setup custom domain (optional)