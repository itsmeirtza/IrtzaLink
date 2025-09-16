import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserData, searchUsersByUsername, getUserAnalytics } from '../services/firebase';
import LoadingSpinner from '../components/LoadingSpinner';
import DigitalCard from '../components/DigitalCard';
import VerifiedBadge from '../components/VerifiedBadge';
import LiveAnalytics from '../components/LiveAnalytics';
import FollowManager from '../components/FollowManager';
import FollowButton from '../components/FollowButton';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import { 
  UserCircleIcon, 
  ChartBarIcon, 
  QrCodeIcon, 
  ShareIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  LinkIcon,
  CogIcon,
  MagnifyingGlassIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [analytics, setAnalytics] = useState({ views: 0, qrScans: 0, totalVisits: 0 });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    if (user && user.uid) {
      fetchUserData();
      fetchAnalytics();
    }
  }, [user?.uid]);

  const fetchUserData = async () => {
    try {
      const result = await getUserData(user.uid);
      if (result.success) {
        setUserData(result.data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      // Get more analytics data for better accuracy
      const result = await getUserAnalytics(user.uid, null, 100);
      if (result.success) {
        const analyticsData = result.data;
        setRecentActivity(analyticsData.slice(0, 5));
        
        // Calculate stats with better filtering
        const profileViews = analyticsData.filter(item => 
          item.type === 'profile_visit' || item.type === 'profile_view'
        ).length;
        
        const qrScans = analyticsData.filter(item => 
          item.type === 'qr_scan' || item.type === 'qr_code_scan'
        ).length;
        
        // Get today's stats
        const today = new Date().toDateString();
        const todayViews = analyticsData.filter(item => {
          const itemDate = item.timestamp?.toDate ? 
            item.timestamp.toDate().toDateString() : 
            new Date(item.timestamp).toDateString();
          return (item.type === 'profile_visit' || item.type === 'profile_view') && 
                 itemDate === today;
        }).length;
        
        setAnalytics({
          views: profileViews,
          qrScans: qrScans,
          totalVisits: profileViews + qrScans,
          todayViews: todayViews
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set default values if error occurs
      setAnalytics({ views: 0, qrScans: 0, totalVisits: 0, todayViews: 0 });
    } finally {
      setLoading(false);
    }
  };

  const shareProfile = async () => {
    if (userData?.username && userData?.profileURL) {
      try {
        await navigator.share({
          title: `${userData.displayName} - IrtzaLink`,
          text: `Check out my links on IrtzaLink!`,
          url: userData.profileURL
        });
      } catch (error) {
        // Fallback to copying to clipboard
        navigator.clipboard.writeText(userData.profileURL);
        // You could show a toast here
      }
    }
  };

  const copyProfileLink = () => {
    if (userData?.profileURL) {
      navigator.clipboard.writeText(userData.profileURL);
      // Show toast notification
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setShowSearchResults(false);
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const result = await searchUsersByUsername(query.trim());
      if (result.success) {
        setSearchResults(result.data);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounce search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      handleSearch(query);
    }, 300);
  };


  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner size="large" text="Loading your dashboard..." />
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Edit Profile',
      description: 'Update your bio, photo, and links',
      icon: UserCircleIcon,
      link: '/profile',
      color: 'bg-blue-500'
    },
    {
      title: 'View Analytics',
      description: 'See your profile performance',
      icon: ChartBarIcon,
      link: '/analytics',
      color: 'bg-green-500'
    },
    {
      title: 'Settings',
      description: 'Manage your account preferences',
      icon: CogIcon,
      link: '/settings',
      color: 'bg-purple-500'
    }
  ];

  const stats = [
    {
      title: 'Profile Views',
      value: analytics.views,
      icon: EyeIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'QR Scans',
      value: analytics.qrScans,
      icon: QrCodeIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Total Visits',
      value: analytics.totalVisits,
      icon: CursorArrowRaysIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {userData?.displayName || user.displayName || 'User'}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Here's your link management dashboard
            </p>
          </div>
          
          {/* User Search Bar */}
          <div className="relative max-w-md w-full lg:w-80">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or username..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              {searchLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
            
            {/* Search Results */}
            {showSearchResults && (
              <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                {searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((foundUser, index) => (
                      <div
                        key={foundUser.uid || index}
                        className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0 cursor-pointer"
                        onClick={() => {
                          setShowSearchResults(false);
                          setSearchQuery('');
                          navigate(`/user/${foundUser.uid}`);
                        }}
                      >
                        <img
                          src={foundUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(foundUser.displayName || foundUser.username)}&background=3b82f6&color=ffffff`}
                          alt={foundUser.displayName}
                          className="w-10 h-10 rounded-full object-cover mr-3"
                        />
                        <div className="flex-1">
                          <div className="flex items-center">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {foundUser.displayName || foundUser.username}
                            </p>
                            <VerifiedBadge username={foundUser.username} className="w-4 h-4 ml-1" />
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{foundUser.username}
                          </p>
                          {foundUser.bio && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                              {foundUser.bio}
                            </p>
                          )}
                        </div>
                        
                        {/* Follow Button */}
                        <div className="ml-2">
                          <FollowButton
                            currentUser={user}
                            targetUser={{
                              uid: foundUser.uid,
                              username: foundUser.username,
                              displayName: foundUser.displayName,
                              photoURL: foundUser.photoURL
                            }}
                            onFollowChange={() => {
                              // Refresh search results to show updated status
                              if (searchQuery.trim()) {
                                handleSearch(searchQuery.trim());
                              }
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center">
                    <UsersIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No users found with username "{searchQuery}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Profile Quick View */}
      {userData && (
        <div className="card p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <img
                src={userData.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName || user.email)}&background=3b82f6&color=ffffff`}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
              />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {userData.displayName || user.displayName}
                </h3>
                <div className="flex items-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    {userData.username ? `@${userData.username}` : 'Username not set'}
                  </p>
                  {userData.username && <VerifiedBadge username={userData.username} className="w-4 h-4 ml-1" />}
                </div>
                {userData.profileURL && (
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {userData.profileURL}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {userData.profileURL && (
                <>
                  <button
                    onClick={copyProfileLink}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <LinkIcon className="w-4 h-4" />
                    <span>Copy Link</span>
                  </button>
                  <button
                    onClick={shareProfile}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <ShareIcon className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </>
              )}
              <Link to="/profile" className="btn-primary flex items-center space-x-2">
                <UserCircleIcon className="w-4 h-4" />
                <span>Edit Profile</span>
              </Link>
            </div>
          </div>

          {/* QR Code Section */}
          {userData.qrCodeURL && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Your QR Code
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Share this QR code to let people access your profile instantly
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <div className="p-4 bg-white rounded-lg shadow-sm">
                    <QRCode value={userData.profileURL || ''} size={120} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Digital Card Section */}
      {userData?.username && (
        <div className="card p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            📱 Your Digital Card
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Download and share your professional digital business card
          </p>
          <div className="flex justify-center">
            <div className="transform scale-75 lg:scale-100">
              <DigitalCard 
                userData={{
                  ...userData,
                  profileURL: userData?.profileURL || `https://irtzalink.site/${userData.username}`
                }}
                onDownload={() => {
                  // You can add toast notification here
                  console.log('Digital card downloaded!');
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Live Analytics Section */}
      <div className="mb-8">
        <LiveAnalytics user={user} />
      </div>

      {/* Follow Manager Section */}
      <FollowManager user={user} />

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        {/* Quick Actions */}
        <div className="card p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  to={action.link}
                  className="flex items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <div className={`p-2 rounded-lg ${action.color} text-white mr-4`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {action.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {action.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Getting Started */}
      {(!userData?.username || !userData?.profileURL) && (
        <div className="mt-8 card p-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🚀 Complete your setup
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Finish setting up your profile to start sharing your links
          </p>
          <div className="space-y-2 text-sm">
            {!userData?.username && (
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <span className="w-4 h-4 rounded-full bg-yellow-400 mr-2"></span>
                Choose a username
              </div>
            )}
            {!userData?.bio && (
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <span className="w-4 h-4 rounded-full bg-yellow-400 mr-2"></span>
                Add a bio
              </div>
            )}
            {(!userData?.socialLinks || Object.keys(userData.socialLinks).length === 0) && (
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <span className="w-4 h-4 rounded-full bg-yellow-400 mr-2"></span>
                Add your social links
              </div>
            )}
          </div>
          <Link
            to="/profile"
            className="inline-block mt-4 btn-primary"
          >
            Complete Setup
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;