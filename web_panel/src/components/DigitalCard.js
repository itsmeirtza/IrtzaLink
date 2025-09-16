import React from 'react';
import QRCode from 'react-qr-code';
import { socialPlatforms } from '../utils/socialIcons';
import VerifiedBadge from './VerifiedBadge';

const DigitalCard = ({ userData }) => {

  // Filter active social links
  const activeSocialLinks = Object.entries(userData.socialLinks || {})
    .filter(([_, url]) => url && url.trim())
    .slice(0, 4) // Limit to 4 social links for better design
    .map(([platform, url]) => {
      const platformConfig = socialPlatforms.find(p => p.key === platform);
      return platformConfig ? { ...platformConfig, url } : null;
    })
    .filter(Boolean);

  return (
    <div className="relative">
      {/* Digital Card */}
      <div 
        className="w-[600px] h-[400px] bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden digital-card card-3d animate-pulse-glow rounded-2xl"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Header */}
        <div className="absolute top-6 left-6 right-6">
          <div className="text-center mb-2">
            <h1 className="text-2xl font-bold tracking-wide">IrtzaLink</h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-full pt-20">
          {/* Left Side - Profile Info */}
          <div className="flex-1 px-6 py-4">
            {/* Profile Picture */}
            <div className="mb-4">
              <img
                src={userData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName || 'User')}&background=666&color=white&size=80`}
                alt={userData.displayName}
                className="w-20 h-20 rounded-2xl border-4 border-gray-600 object-cover"
              />
            </div>

            {/* Name and Bio */}
            <div className="mb-6">
              <div className="flex items-center mb-1 space-x-2">
                <h2 className="text-2xl font-bold">{userData.displayName}</h2>
                <VerifiedBadge username={userData.username} className="w-5 h-5 flex-shrink-0" />
              </div>
              <p className="text-gray-300 text-sm mb-2">{userData.bio || 'IrtzaLink User'}</p>
            </div>

            {/* Social Links */}
            {activeSocialLinks.length > 0 && (
              <div className="flex space-x-3 mb-6">
                {activeSocialLinks.map((social) => (
                  <div
                    key={social.key}
                    className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center"
                    title={social.name}
                    style={{ backgroundColor: `${social.color}20` }}
                  >
                    <div className="w-5 h-5" style={{ color: social.color }}>
                      {social.icon}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Contact Info */}
            <div className="space-y-2 text-sm">
              {userData.contactInfo?.phone && (
                <div className="flex items-center space-x-2">
                  <span className="text-base">📞</span>
                  <span>{userData.contactInfo.phone}</span>
                </div>
              )}
              {userData.contactInfo?.email && (
                <div className="flex items-center space-x-2">
                  <span className="text-base">✉️</span>
                  <span>{userData.contactInfo.email}</span>
                </div>
              )}
              {userData.contactInfo?.website && (
                <div className="flex items-center space-x-2">
                  <span className="text-base">🌐</span>
                  <span>{userData.contactInfo.website}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - QR Code */}
          <div className="flex-shrink-0 px-6 py-4 flex flex-col items-center justify-center">
            <div className="bg-white p-4 rounded-2xl mb-3">
              <QRCode 
                value={userData.profileURL || `https://irtzalink.site/${userData.username}`} 
                size={120}
              />
            </div>
            <p className="text-xs text-center opacity-80">
              irtzalink.site/{userData.username}
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full opacity-60 animate-float"></div>
        <div className="absolute bottom-4 left-4 w-3 h-3 bg-purple-500 rounded-full opacity-40 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-8 right-8 w-1 h-1 bg-pink-500 rounded-full opacity-80 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

    </div>
  );
};

export default DigitalCard;