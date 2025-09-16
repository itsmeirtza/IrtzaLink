import React, { useState, useEffect } from 'react';
import { getUserAnalytics } from '../services/firebase';
import { 
  EyeIcon, 
  QrCodeIcon, 
  ChartBarIcon,
  ArrowTrendingUpIcon 
} from '@heroicons/react/24/outline';

const LiveAnalytics = ({ user }) => {
  const [analytics, setAnalytics] = useState({
    profileViews: 0,
    qrScans: 0,
    totalVisits: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    if (user) {
      fetchAnalytics();
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(fetchAnalytics, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      const result = await getUserAnalytics(user.uid, null, 100);
      if (result.success) {
        const data = result.data;
        
        // Process analytics data
        const profileViews = data.filter(item => item.type === 'profile_visit').length;
        const qrScans = data.filter(item => item.type === 'qr_scan').length;
        const totalVisits = profileViews + qrScans;
        
        // Get recent activity (last 10 items)
        const recentActivity = data.slice(0, 10).map(item => ({
          ...item,
          timeAgo: getTimeAgo(item.timestamp)
        }));

        setAnalytics({
          profileViews,
          qrScans,
          totalVisits,
          recentActivity
        });
        
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'profile_visit':
        return <EyeIcon className="w-4 h-4 text-blue-500" />;
      case 'qr_scan':
        return <QrCodeIcon className="w-4 h-4 text-green-500" />;
      default:
        return <ChartBarIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityText = (type) => {
    switch (type) {
      case 'profile_visit':
        return 'Profile viewed';
      case 'qr_scan':
        return 'QR code scanned';
      default:
        return 'Unknown activity';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6">
              <div className="animate-pulse">
                <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Status Indicator */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live</span>
          </div>
          <span>•</span>
          <span>Updated {getTimeAgo(lastUpdate)}</span>
          <button
            onClick={fetchAnalytics}
            className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Profile Views */}
        <div className="card p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500 rounded-lg">
              <EyeIcon className="w-6 h-6 text-white" />
            </div>
            <ArrowTrendingUpIcon className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics.profileViews.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Profile Views</p>
        </div>

        {/* QR Scans */}
        <div className="card p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500 rounded-lg">
              <QrCodeIcon className="w-6 h-6 text-white" />
            </div>
            <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics.qrScans.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">QR Scans</p>
        </div>

        {/* Total Visits */}
        <div className="card p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
            <ArrowTrendingUpIcon className="w-5 h-5 text-purple-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics.totalVisits.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Visits</p>
        </div>
      </div>

      {/* Recent Activity */}
      {analytics.recentActivity.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <ChartBarIcon className="w-5 h-5 mr-2 text-blue-500" />
            Recent Activity
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {analytics.recentActivity.map((activity, index) => (
              <div key={activity.id || index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getActivityIcon(activity.type)}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {getActivityText(activity.type)}
                    </p>
                    {activity.userAgent && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.userAgent.includes('Mobile') ? '📱 Mobile' : 
                         activity.userAgent.includes('Mac') ? '💻 Mac' :
                         activity.userAgent.includes('Windows') ? '🖥️ Windows' : '💻 Desktop'}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {activity.timeAgo}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {analytics.recentActivity.length === 0 && (
        <div className="card p-8 text-center">
          <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No activity yet.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Share your profile to get started!
          </p>
        </div>
      )}
    </div>
  );
};

export default LiveAnalytics;