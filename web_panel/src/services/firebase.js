// CLEAN FIREBASE SETUP - AUTHENTICATION ONLY
// NO FIRESTORE, NO STORAGE - ONLY AUTH!
// All data goes to Supabase

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

// Firebase Configuration - AUTHENTICATION ONLY
const firebaseConfig = {
  apiKey: "AIzaSyDc9vaKPD4XSdP1jhjto1VmcuheJcq0i8c",
  authDomain: "irtzalink-4d407.firebaseapp.com",
  projectId: "irtzalink-4d407",
  storageBucket: "irtzalink-4d407.firebasestorage.app",
  messagingSenderId: "342984685133",
  appId: "1:342984685133:web:19eb6d4bcfdd921ef38e04",
  measurementId: "G-3TDPN9HGJW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize ONLY Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Authentication Functions - CLEAN AND SIMPLE
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signInWithEmail = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const signUpWithEmail = (email, password) => createUserWithEmailAndPassword(auth, email, password);

// LOGOUT FUNCTION - Only clears Firebase auth, data stays in Supabase
export const logout = async () => {
  try {
    console.log('🚪 FIREBASE AUTH: Logging out (Supabase data remains safe)');
    await signOut(auth);
    console.log('✅ FIREBASE AUTH: Logged out successfully');
    console.log('💾 SUPABASE: All user data remains safe in cloud!');
    return { success: true };
  } catch (error) {
    console.error('❌ FIREBASE AUTH: Logout error:', error);
    return { success: false, error: error.message };
  }
};

// Export onAuthStateChanged for App.js
export { onAuthStateChanged } from 'firebase/auth';

console.log('🔥 FIREBASE: Authentication-only setup complete');
console.log('✅ FIREBASE: Auth, Google login, email signup ready');
console.log('💾 SUPABASE: All data storage handled by Supabase');
console.log('🔄 INTEGRATION: Firebase Auth + Supabase Data = Perfect!');

export default app;