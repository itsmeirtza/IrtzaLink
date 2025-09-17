import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { auth, onAuthStateChanged } from './services/firebase';
import { userSync } from './services/userSync';
// Import diagnostics for easier debugging
import './utils/dataPersistenceDiagnostics';

// Components
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';
import LoadingSplash from './components/LoadingSplash';
import Footer from './components/Footer';
import ChatBox from './components/ChatBox';
import ChatManager from './components/ChatManager';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import PublicProfile from './pages/PublicProfile';
import PublicUserProfile from './pages/PublicUserProfile';
import ContactUs from './pages/ContactUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AboutUs from './pages/AboutUs';
import FollowTest from './pages/FollowTest';
import FollowersPage from './pages/FollowersPage';
import FollowingPage from './pages/FollowingPage';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true; // Default to dark mode
  });
  const [chatUser, setChatUser] = useState(null);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [isChatManagerOpen, setIsChatManagerOpen] = useState(false);

  // Initialize user data from localStorage on app start
  useEffect(() => {
    const initializeUserData = async () => {
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData && !user) {
        try {
          const parsedUserData = JSON.parse(storedUserData);
          // Check if user is still authenticated
          if (auth.currentUser && auth.currentUser.uid === parsedUserData.uid) {
            // Restore user data from localStorage temporarily
            setUser({
              uid: parsedUserData.uid,
              email: parsedUserData.email,
              displayName: parsedUserData.displayName,
              photoURL: parsedUserData.photoURL,
              userData: parsedUserData.userData
            });
          } else {
            // Clear invalid stored data
            localStorage.removeItem('userData');
          }
        } catch (error) {
          console.error('Error restoring user data:', error);
          localStorage.removeItem('userData');
        }
      }
    };

    initializeUserData();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          console.log('🔥 User signed in, initializing data sync...', firebaseUser.uid);
          
          // Use new UserSync service - FIXES ALL DATA SYNC ISSUES!
          const result = await userSync.initializeUserData(firebaseUser.uid);
          
          if (result.success) {
            const enhancedUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: result.data.displayName || firebaseUser.displayName,
              photoURL: result.data.photoURL || firebaseUser.photoURL,
              emailVerified: firebaseUser.emailVerified,
              userData: result.data,
              dataSource: result.source || 'firestore'
            };
            
            console.log('✅ User data loaded successfully:', {
              username: result.data.username,
              hasUsername: !!result.data.username,
              hasBio: !!result.data.bio,
              socialLinksCount: Object.keys(result.data.socialLinks || {}).length,
              contactInfoCount: Object.keys(result.data.contactInfo || {}).length
            });
            
            setUser(enhancedUser);
            
          } else {
            console.error('❌ Failed to initialize user data:', result.error);
            
            // Create basic user object as fallback
            const basicUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              emailVerified: firebaseUser.emailVerified,
              userData: null,
              dataSource: 'error_fallback'
            };
            
            setUser(basicUser);
          }
          
        } catch (error) {
          console.error('❌ Error in auth state change:', error);
          
          // Fallback to basic user
          const basicUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            userData: null,
            dataSource: 'auth_error'
          };
          
          setUser(basicUser);
        }
      } else {
        console.log('🚪 User signed out');
        setUser(null);
        
        // Clean up listeners but PRESERVE user data for quick re-login
        // This prevents data loss when switching accounts or re-logging
        console.log('✅ User data preserved for quick re-login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const openChat = (chatUserData) => {
    setChatUser(chatUserData);
    setIsChatMinimized(false);
  };

  const closeChat = () => {
    setChatUser(null);
    setIsChatMinimized(false);
  };

  const toggleChatMinimize = () => {
    setIsChatMinimized(!isChatMinimized);
  };

  const openChatManager = () => {
    setIsChatManagerOpen(true);
  };

  const closeChatManager = () => {
    setIsChatManagerOpen(false);
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Make chat functions available globally
  React.useEffect(() => {
    window.openChat = openChat;
    window.openChatManager = openChatManager;
    return () => {
      delete window.openChat;
      delete window.openChatManager;
    };
  }, []);

  // Show splash screen first
  if (showSplash) {
    return <LoadingSplash onComplete={handleSplashComplete} />;
  }

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-black transition-colors duration-200 ${darkMode ? 'dark' : ''}`}>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: darkMode ? '#1f2937' : '#ffffff',
              color: darkMode ? '#f9fafb' : '#111827',
              border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
            },
          }}
        />
        
        {user ? (
          <>
            <Navbar user={user} darkMode={darkMode} toggleDarkMode={toggleDarkMode} openChatManager={openChatManager} />
            <main className="pt-16 min-h-screen">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard user={user} />} />
                <Route path="/profile" element={<Profile user={user} />} />
                <Route path="/analytics" element={<Analytics user={user} />} />
                <Route path="/settings" element={<Settings user={user} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />} />
                <Route path="/admin" element={<Admin user={user} />} />
                <Route path="/follow-test" element={<FollowTest user={user} />} />
                <Route path="/user/:userId" element={<PublicUserProfile currentUser={user} />} />
                <Route path="/user/:userId/followers" element={<FollowersPage currentUser={user} />} />
                <Route path="/user/:userId/following" element={<FollowingPage currentUser={user} />} />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/contact-us" element={<Navigate to="/contact" replace />} />
                <Route path="/help" element={<Navigate to="/contact" replace />} />
                <Route path="/support" element={<Navigate to="/contact" replace />} />
                <Route path="/help-center" element={<Navigate to="/contact" replace />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
                <Route path="/terms" element={<Navigate to="/privacy" replace />} />
                <Route path="/terms-of-service" element={<Navigate to="/privacy" replace />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/about-us" element={<Navigate to="/about" replace />} />
                <Route path="/:username" element={<PublicProfile />} />
                <Route path="/login" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
            <Footer />
          </>
        ) : (
          <>
            <Navbar user={user} darkMode={darkMode} toggleDarkMode={toggleDarkMode} openChatManager={() => {}} />
            <main className="pt-16 min-h-screen">
              <Routes>
                <Route path="/" element={<Login darkMode={darkMode} toggleDarkMode={toggleDarkMode} />} />
                <Route path="/login" element={<Login darkMode={darkMode} toggleDarkMode={toggleDarkMode} />} />
                <Route path="/user/:userId" element={<PublicUserProfile currentUser={null} />} />
                <Route path="/user/:userId/followers" element={<FollowersPage currentUser={null} />} />
                <Route path="/user/:userId/following" element={<FollowingPage currentUser={null} />} />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/contact-us" element={<Navigate to="/contact" replace />} />
                <Route path="/help" element={<Navigate to="/contact" replace />} />
                <Route path="/support" element={<Navigate to="/contact" replace />} />
                <Route path="/help-center" element={<Navigate to="/contact" replace />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
                <Route path="/terms" element={<Navigate to="/privacy" replace />} />
                <Route path="/terms-of-service" element={<Navigate to="/privacy" replace />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/about-us" element={<Navigate to="/about" replace />} />
                <Route path="/:username" element={<PublicProfile />} />
              </Routes>
            </main>
            <Footer />
          </>
        )}
        
        {/* Global ChatBox */}
        {user && chatUser && (
          <ChatBox
            currentUser={user}
            chatUser={chatUser}
            onClose={closeChat}
            isMinimized={isChatMinimized}
            onToggleMinimize={toggleChatMinimize}
          />
        )}
        
        {/* Global ChatManager */}
        {user && (
          <ChatManager
            user={user}
            isOpen={isChatManagerOpen}
            onClose={closeChatManager}
          />
        )}
        
      </Router>
    </div>
  );
}

export default App;