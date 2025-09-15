import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { socialPlatforms } from '../utils/socialIcons';
import LoadingSpinner from '../components/LoadingSpinner';
import VerifiedBadge from '../components/VerifiedBadge';
import { trackQRScan, getPublicProfile } from '../services/firebase';

const PublicProfile = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (username) {
      fetchProfile(username);
      // Track if this is coming from QR scan
      if (document.referrer === '' || navigator.userAgent.includes('QR')) {
        trackQRCodeScan();
      }
    }
  }, [username]);

  const fetchProfile = async (username) => {
    try {
      const result = await getPublicProfile(username);
      
      if (result.success && result.data) {
        setProfile(result.data);
      } else {
        setError('Profile not found or user does not exist');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Unable to load profile. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const trackQRCodeScan = async () => {
    try {
      if (profile?.userId) {
        await trackQRScan({
          userId: profile.userId,
          userAgent: navigator.userAgent,
          source: 'qr_code'
        });
      }
    } catch (error) {
      // Silent fail for analytics
      console.error('Failed to track QR scan:', error);
    }
  };

  const handleSocialClick = (platform, url) => {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error opening social link:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading profile..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profile Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <a href="/" className="btn-primary inline-block">
            Go to IrtzaLink
          </a>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Profile Data</h1>
          <a href="/" className="btn-primary inline-block">
            Go to IrtzaLink
          </a>
        </div>
      </div>
    );
  }

  const theme = profile.theme || 'dark';
  const bgColor = theme === 'light' ? 'bg-white' : 'bg-black';
  const textColor = theme === 'light' ? 'text-gray-900' : 'text-white';
  const secondaryTextColor = theme === 'light' ? 'text-gray-600' : 'text-gray-300';

  // Filter and create social links
  const activeSocialLinks = Object.entries(profile.socialLinks || {})
    .filter(([_, url]) => url && url.trim())
    .map(([platform, url]) => {
      const platformConfig = socialPlatforms.find(p => p.key === platform);
      return platformConfig ? { ...platformConfig, url } : null;
    })
    .filter(Boolean);

  return (
    <div className={`min-h-screen ${bgColor} ${textColor} transition-colors duration-200`}>
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="text-center">
          {/* Profile Image */}
          <div className="relative mb-6 inline-block">
            <img
              src={
                profile.photoURL || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName || 'User')}&background=${theme === 'light' ? 'e5e7eb' : '374151'}&color=${theme === 'light' ? '374151' : 'ffffff'}&size=120&font-size=0.6&bold=true`
              }
              alt={profile.displayName}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg mx-auto transition-transform duration-300 hover:scale-105 animate-fade-in"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName || 'User')}&background=3b82f6&color=ffffff&size=120`;
              }}
            />
            
            {/* Verified Badge */}
            <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1.5 shadow-md animate-pulse-glow">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Name and Username */}
          <h1 className={`text-2xl sm:text-3xl font-bold ${textColor} mb-2 animate-slide-in-right`}>
            {profile.displayName}
          </h1>
          <p className={`text-base ${secondaryTextColor} mb-1 animate-slide-in-right flex items-center justify-center`} style={{ animationDelay: '0.1s' }}>
            @{profile.username}
            <VerifiedBadge username={profile.username} className="w-4 h-4" />
          </p>
          
          {/* Bio */}
          {profile.bio && (
            <p className={`text-sm ${secondaryTextColor} mb-8 max-w-xs mx-auto leading-relaxed animate-slide-in-right`} style={{ animationDelay: '0.2s' }}>
              {profile.bio}
            </p>
          )}

          {/* Social Links */}
          {activeSocialLinks.length > 0 && (
            <div className="space-y-4 mb-8">
              {activeSocialLinks.map((social, index) => (
                <button
                  key={social.key}
                  onClick={() => handleSocialClick(social.key, social.url)}
                  className={`w-full flex items-center justify-center space-x-3 p-4 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 animate-slide-in-right card-3d ${
                    theme === 'light' 
                      ? 'bg-gray-50 hover:bg-gray-100 border border-gray-200' 
                      : 'bg-gray-800 hover:bg-gray-700 border border-gray-600'
                  }`}
                  style={{
                    background: theme === 'dark' ? `linear-gradient(135deg, ${social.color}15, ${social.color}10)` : undefined,
                    borderColor: theme === 'dark' ? `${social.color}30` : undefined,
                    animationDelay: `${0.3 + index * 0.1}s`
                  }}
                >
                  {/* Platform Icon */}
                  <div 
                    className="flex-shrink-0 p-2 rounded-full animate-float" 
                    style={{ backgroundColor: `${social.color}20`, animationDelay: `${index * 0.5}s` }}
                  >
                    <span className="text-xl">{social.emoji}</span>
                  </div>
                  
                  {/* Platform Name */}
                  <span className={`font-medium text-base flex-1 text-left ${textColor}`}>
                    {social.name}
                  </span>
                  
                  {/* Arrow Icon */}
                  <svg 
                    className={`w-5 h-5 ${secondaryTextColor} transition-transform duration-200 group-hover:translate-x-1`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              ))}
            </div>
          )}

          {/* Contact Info */}
          {profile.contactInfo && Object.values(profile.contactInfo).some(v => v) && (
            <div className={`p-6 rounded-2xl mb-8 glass-dark animate-fade-in ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-800'}`}>
              <h3 className={`text-lg font-semibold ${textColor} mb-4`}>Contact</h3>
              <div className="space-y-3">
                {profile.contactInfo.email && (
                  <a 
                    href={`mailto:${profile.contactInfo.email}`}
                    className={`flex items-center space-x-3 ${secondaryTextColor} hover:${textColor} transition-colors duration-200 hover:scale-105`}
                  >
                    <span>📧</span>
                    <span className="text-sm">{profile.contactInfo.email}</span>
                  </a>
                )}
                {profile.contactInfo.phone && (
                  <a 
                    href={`tel:${profile.contactInfo.phone}`}
                    className={`flex items-center space-x-3 ${secondaryTextColor} hover:${textColor} transition-colors duration-200 hover:scale-105`}
                  >
                    <span>📱</span>
                    <span className="text-sm">{profile.contactInfo.phone}</span>
                  </a>
                )}
                {profile.contactInfo.website && (
                  <a 
                    href={profile.contactInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center space-x-3 ${secondaryTextColor} hover:${textColor} transition-colors duration-200 hover:scale-105`}
                  >
                    <span>🌐</span>
                    <span className="text-sm">{profile.contactInfo.website}</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Powered by IrtzaLink */}
          <div className={`text-center pt-8 border-t ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'} animate-fade-in`}>
            <p className={`text-xs ${secondaryTextColor} mb-2`}>Powered by</p>
            <a 
              href="/" 
              className={`text-sm font-semibold gradient-text hover:underline`}
            >
              IrtzaLink
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;