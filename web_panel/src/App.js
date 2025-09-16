import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { auth, onAuthStateChanged } from './services/firebase';

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Ensure we have the latest user data from Firestore
        try {
          const { getUserData } = await import('./services/firebase');
          const result = await getUserData(user.uid);
          if (result.success) {
            // Merge Firebase Auth user with Firestore data
            const enhancedUser = {
              ...user,
              userData: result.data
            };
            setUser(enhancedUser);
          } else {
            setUser(user);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(user);
        }
      } else {
        setUser(null);
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
                <Route path="/user/:userId" element={<PublicUserProfile currentUser={user} />} />
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