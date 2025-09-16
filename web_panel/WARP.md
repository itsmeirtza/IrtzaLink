# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Core Development
- `npm start` - Start development server (React app runs on localhost:3000)
- `npm run build` - Build production version (CI=false set to avoid treating warnings as errors)
- `npm run vercel-build` - Build for Vercel deployment (same as build but explicit for deployment)
- `npm test` - Run Jest tests in watch mode
- `npm run eject` - Eject from Create React App (use with caution)

### Environment Setup
- Copy `.env.example` to `.env` and configure Firebase credentials
- Ensure all `REACT_APP_FIREBASE_*` variables are set for Firebase integration
- Set `REACT_APP_APP_NAME`, `REACT_APP_APP_URL`, and `REACT_APP_VERSION` for app configuration

### Testing
- `npm test -- --coverage` - Run tests with coverage report
- `npm test -- --watchAll=false` - Run tests once without watch mode
- `npm test -- --testPathPattern=ComponentName` - Run specific component tests

## Architecture Overview

### Tech Stack
- **Frontend**: React 18.2+ with functional components and hooks
- **Styling**: Tailwind CSS with dark mode support (`darkMode: 'class'`)
- **Authentication**: Firebase Auth with Google OAuth and email/password
- **Database**: Firestore for user data and profiles
- **Storage**: Firebase Storage for file uploads
- **Routing**: React Router DOM v6+ with nested routes
- **State Management**: React Context + hooks (no external state library)
- **UI Components**: Headless UI, Heroicons, custom components
- **Notifications**: React Hot Toast
- **Forms**: React Hook Form
- **Animations**: Framer Motion

### Application Structure

#### Core Architecture Patterns

**1. Data Persistence Strategy (Critical)**
The app implements a multi-layered data persistence system to prevent data loss:
- **Primary**: localStorage with multiple backup keys per user
- **Secondary**: Firebase Firestore as cloud backup
- **Tertiary**: Memory cache for performance
- **Key Feature**: Data is NEVER cleared on logout to prevent user data loss

**2. Service Layer Architecture**
- `services/firebase.js` - Firebase configuration, auth, and Firestore operations
- `services/userDataManager.js` - Caching and offline-first user data management  
- `services/permanentStorage.js` - Multi-location localStorage management (prevents data loss)
- `services/followDataManager.js` - Social features and follower/following management

**3. Component Organization**
```
src/
├── components/     # Reusable UI components (Navbar, LoadingSpinner, ChatBox, etc.)
├── pages/         # Route components (Dashboard, Profile, Analytics, Admin)
├── services/      # Business logic and external service integration
├── config/        # Configuration files and constants
├── utils/         # Utility functions and helpers
└── assets/        # Static assets
```

#### Key Architectural Features

**Authentication Flow**
- Firebase Auth state management in `App.js`
- Persistent user data loading from localStorage on app startup
- Automatic data restoration after re-authentication
- Support for offline functionality with cached user data

**Data Management**
- Optimistic updates with offline queue
- Multiple localStorage backup locations per user
- Firebase sync with fallback to cached data
- Permanent storage that survives logout/login cycles

**Routing Strategy**
- Protected routes that require authentication
- Public profile pages accessible without auth (`/:username`)
- Admin routes for verified users
- Fallback redirects for common URL patterns

### Development Patterns

**State Management**
- Use React hooks (`useState`, `useEffect`) for local component state
- Pass user data and functions through props rather than global context
- Store persistent data in localStorage with multiple backup keys
- Use Firebase for cross-device synchronization

**Error Handling**
- All service functions return `{success, data, error}` objects
- Graceful fallbacks to cached data when Firebase is unavailable
- Toast notifications for user feedback
- Console logging with detailed debugging information

**Performance Optimization**
- Memory cache in userDataManager for frequently accessed data
- Local storage as first-class persistence layer
- Lazy loading not implemented (all routes loaded upfront)
- Image optimization handled by Firebase Storage

## Critical Code Patterns

### Data Persistence (Never Lose User Data)
```javascript
// Always save to multiple localStorage locations
localStorage.setItem(`irtzalink_${userId}_profile`, JSON.stringify(data));
localStorage.setItem(`irtzalink_user_${userId}`, JSON.stringify(data));
localStorage.setItem(`irtzalink_persistent_${userId}`, JSON.stringify(data));
```

### Service Call Pattern
```javascript
const result = await someFirebaseOperation();
if (result.success) {
  // Handle success
} else {
  console.error('Operation failed:', result.error);
  // Fallback to cached data if applicable
}
```

### Component Structure Pattern
```javascript
function ComponentName({ user, ...props }) {
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Component logic
  }, []);
  
  if (loading) return <LoadingSpinner />;
  
  return <div className="tailwind-classes">Content</div>;
}
```

## Firebase Integration

### Environment Variables Required
- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID`
- `REACT_APP_FIREBASE_MEASUREMENT_ID`

### Firestore Collections
- `users` - User profiles and settings
- Additional collections are referenced in the follow data manager

### Authentication Methods
- Google OAuth (primary)
- Email/password (secondary)
- Email verification supported but not enforced

## Styling Guidelines

### Tailwind Configuration
- Dark mode enabled with class strategy
- Custom color palette with primary blues and dark grays
- Poppins font family integration
- Responsive design with mobile-first approach

### Theme Implementation
- Dark mode state managed in App.js
- Persisted to localStorage
- CSS classes toggle with `dark:` variants
- Custom color scheme in tailwind.config.js

## Development Notes

### Common Development Tasks
- Adding new routes: Update both authenticated and unauthenticated sections in App.js
- Creating new components: Place in `/components` with proper prop types
- Adding new pages: Create in `/pages` and add to routing in App.js
- Database operations: Use existing service layer patterns
- Adding social features: Extend followDataManager.js

### Key Files to Understand
- `App.js` - Main application component with auth and routing
- `services/permanentStorage.js` - Critical data persistence logic
- `services/firebase.js` - All Firebase operations and configuration
- `tailwind.config.js` - Styling configuration

### Data Safety Features
- Multiple localStorage backup locations prevent data loss
- Offline functionality with sync queue
- Data preservation through logout/login cycles
- Fallback loading strategies for network issues

This is a social link management platform (similar to Linktree) with robust data persistence and Firebase integration.