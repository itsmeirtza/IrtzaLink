# Feature Parity Checklist (Web -> Mobile)

Goal: Mobile app (Flutter) must match Web Panel features exactly – no differences.

- [ ] Auth
  - [ ] Firebase Email/Password login
  - [ ] Google Sign-In
  - [ ] Remembered session / re-auth flows

- [ ] User Profile
  - [ ] Display name, username, bio
  - [ ] Photo upload (Firebase Storage)
  - [ ] Contact info (phone, email, website)
  - [ ] QR code generation & share
  - [ ] Public profile page share (irtzalink.com/username)

- [ ] Social Links Manager
  - [ ] Facebook, Instagram, Twitter/X, TikTok, YouTube, LinkedIn
  - [ ] Reorder links
  - [ ] Enable/disable links

- [ ] Analytics
  - [ ] Profile visits
  - [ ] QR scans

- [ ] Followers/Following
  - [ ] View followers / following lists
  - [ ] Follow / Unfollow actions

- [ ] Admin
  - [ ] Admin dashboard parity
  - [ ] Abuse reports

- [ ] Settings / Theming
  - [ ] Dark mode + Accent colors
  - [ ] Theme selection parity

- [ ] Chat (if enabled on web)
  - [ ] Open chat / chat manager parity

- [ ] Extra
  - [ ] Responsive screens
  - [ ] Smooth transitions
  - [ ] Error states & retry flows

Implementation note:
- Mobile will keep Firebase Auth
- Mobile user data will be stored in Supabase (separate config) – ensure Sync/Mapping layer as needed
