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

          {/* QR Code Section */}
          <div className={`p-6 rounded-2xl mb-8 glass-dark animate-fade-in ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-800'}`}>
            <h3 className={`text-lg font-semibold ${textColor} mb-4 text-center`}>Share Profile</h3>
            <div className="flex flex-col items-center space-y-4">
              {/* QR Code */}
              <div className="bg-white p-4 rounded-xl shadow-lg">
                <div id="qr-code" className="w-32 h-32 flex items-center justify-center">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}&bgcolor=ffffff&color=000000`}
                    alt="Profile QR Code"
                    className="w-full h-full rounded-lg"
                    onError={(e) => {
                      // Fallback QR code generation
                      e.target.src = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(window.location.href)}`;
                    }}
                  />
                </div>
              </div>
              
              {/* Profile URL */}
              <div className="text-center">
                <p className={`text-xs ${secondaryTextColor} mb-2`}>Scan to view profile</p>
                <p className={`text-sm font-mono ${textColor} bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg`}>
                  {window.location.host}/{profile.username}
                </p>
              </div>
              
              {/* Share Buttons */}
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: `${profile.displayName}'s Profile`,
                        text: `Check out ${profile.displayName}'s links on IrtzaLink`,
                        url: window.location.href
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Profile link copied to clipboard!');
                    }
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    theme === 'light'
                      ? 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                      : 'bg-blue-900/30 hover:bg-blue-900/50 text-blue-400'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span className="text-sm font-medium">Share</span>
                </button>
                
                <a
                  href={`https://wa.me/?text=Check out ${encodeURIComponent(profile.displayName)}'s profile: ${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    theme === 'light'
                      ? 'bg-green-100 hover:bg-green-200 text-green-700'
                      : 'bg-green-900/30 hover:bg-green-900/50 text-green-400'
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
                  </svg>
                  <span className="text-sm font-medium">WhatsApp</span>
                </a>
                
                <button
                  onClick={(e) => {
                    navigator.clipboard.writeText(window.location.href);
                    const button = e.target.closest('button');
                    const originalText = button.innerHTML;
                    button.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span class="text-sm font-medium">Copied!</span>';
                    setTimeout(() => {
                      button.innerHTML = originalText;
                    }, 2000);
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    theme === 'light'
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium">Copy Link</span>
                </button>
              </div>
            </div>
          </div>

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