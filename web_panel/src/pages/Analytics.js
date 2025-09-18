import React, { useState, useEffect } from 'react';
import StorageManager from '../services/StorageManager';
import LoadingSpinner from '../components/LoadingSpinner';
import { EyeIcon, QrCodeIcon, CursorArrowRaysIcon, CalendarIcon } from '@heroicons/react/24/outline';

const Analytics = ({ user }) => {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalScans: 0,
    todayViews: 0,
    todayScans: 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      const result = await StorageManager.getUserAnalytics(user.uid, null, 50);
      if (result.success) {
        const data = result.data;
        setAnalytics(data);
        
        // Calculate stats
        const today = new Date().toDateString();
        const totalViews = data.filter(item => item.type === 'profile_visit').length;
        const totalScans = data.filter(item => item.type === 'qr_scan').length;
        const todayViews = data.filter(item => 
          item.type === 'profile_visit' && 
          item.timestamp?.toDate?.()?.toDateString() === today
        ).length;
        const todayScans = data.filter(item => 
          item.type === 'qr_scan' && 
          item.timestamp?.toDate?.()?.toDateString() === today
        ).length;

        setStats({
          totalViews,
          totalScans,
          todayViews,
          todayScans
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Profile Views',
      value: stats.totalViews,
      icon: EyeIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Total QR Scans',
      value: stats.totalScans,
      icon: QrCodeIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Today\'s Views',
      value: stats.todayViews,
      icon: CalendarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      title: 'Today\'s Scans',
      value: stats.todayScans,
      icon: CursorArrowRaysIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    }
  ];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner size="large" text="Loading analytics..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Analytics Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your profile performance and engagement
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Recent Activity
        </h3>
        
        {analytics.length > 0 ? (
          <div className="space-y-4">
            {analytics.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    activity.type === 'profile_visit' ? 'bg-blue-500' : 'bg-green-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.type === 'profile_visit' ? 'Profile Visit' : 'QR Code Scan'}
                    </p>
                    {activity.userAgent && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.userAgent.includes('Mobile') ? '📱 Mobile' : '💻 Desktop'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {activity.timestamp?.toDate ? 
                      activity.timestamp.toDate().toLocaleDateString() : 
                      'Recently'
                    }
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.timestamp?.toDate ? 
                      activity.timestamp.toDate().toLocaleTimeString() : 
                      ''
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CursorArrowRaysIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No activity yet
            </h4>
            <p className="text-gray-500 dark:text-gray-500">
              Share your profile link or QR code to start tracking visits!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;