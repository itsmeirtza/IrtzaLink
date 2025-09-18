import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout, getUnreadMessagesCount } from '../services/firebase';
import toast from 'react-hot-toast';
import NotificationCenter from './NotificationCenter';
import {
  UserCircleIcon,
  ChartBarIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';

const Navbar = ({ user, darkMode, toggleDarkMode, openChatManager }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // Fetch unread message count
  useEffect(() => {
    if (user && user.uid) {
      // Reset unread count when user changes
      setUnreadMessageCount(0);
      
      fetchUnreadMessageCount();
      // Set up interval to check periodically
      const interval = setInterval(fetchUnreadMessageCount, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    } else {
      // Clear unread count when user logs out
      setUnreadMessageCount(0);
    }
  }, [user?.uid]);

  const fetchUnreadMessageCount = async () => {
    if (user) {
      const result = await getUnreadMessagesCount(user.uid);
      if (result.success) {
        setUnreadMessageCount(result.count);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      setIsProfileMenuOpen(false);
    } catch (error) {
      toast.error('Error logging out');
      console.error('Logout error:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    // Navigate based on notification type
    switch (notification.type) {
      case 'follow':
      case 'profile_visit':
        navigate(`/user/${notification.fromUserId}`);
        break;
      case 'message':
        // Navigate to chat when implemented
        toast.info('Chat feature coming soon!');
        break;
      default:
        break;
    }
  };

  const handleChatClick = () => {
    if (openChatManager) {
      openChatManager();
    } else {
      toast.info('Chat feature coming soon! Follow users to chat with them.');
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Profile', href: '/profile', icon: UserCircleIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    { name: 'Get Verified', href: '/get-verified', icon: CheckBadgeIcon },
    { name: 'Settings', href: '/settings', icon: CogIcon },
    { name: 'Help', href: '/help', icon: QuestionMarkCircleIcon },
  ];

  return (
    <nav className="fixed top-0 w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-2">
            <img 
              src={require('../assets/irtzalink-logo.svg').default} 
              alt="IrtzaLink" 
              className="w-8 h-8"
            />
            <span className="text-xl font-bold text-gray-900 dark:text-white">IrtzaLink</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {user && (
              <>
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </>
            )}

            {/* Notifications */}
            {user && (
              <NotificationCenter 
                user={user} 
                onNotificationClick={handleNotificationClick}
              />
            )}
            
            {/* Chat Button */}
            {user && (
              <div className="relative">
                <button
                  onClick={handleChatClick}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                  title="Chat"
                >
                  <ChatBubbleLeftRightIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>
                
                {/* Unread Message Count Badge */}
                {unreadMessageCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                  </span>
                )}
              </div>
            )}
            {user && (
              <>
                {/* Dark Mode Toggle */}
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  {darkMode ? (
                    <SunIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <MoonIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
              </>
            )}

            {user && (
              /* Profile Menu */
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                >
                  <img
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=3b82f6&color=ffffff`}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden lg:block">
                    {user.displayName || user.email?.split('@')[0] || 'User'}
                  </span>
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                    <Link to="/profile" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <UserCircleIcon className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Link>
                    <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          {user && (
            <div className="md:hidden flex items-center space-x-2">
              {/* Chat Button Mobile */}
              <div className="relative">
                <button
                  onClick={handleChatClick}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                  title="Chat"
                >
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                
                {/* Unread Message Count Badge */}
                {unreadMessageCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium text-xs">
                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                  </span>
                )}
              </div>
              
              <button onClick={toggleDarkMode} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                {darkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              </button>
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                {isMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {user && isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-900">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} to={item.href} onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <button onClick={handleLogout} className="flex items-center w-full px-3 py-2 text-base font-medium text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200">
                <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;