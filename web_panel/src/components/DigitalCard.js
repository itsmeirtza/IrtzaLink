import React, { useRef } from 'react';
import QRCode from 'react-qr-code';
import { socialPlatforms } from '../utils/socialIcons';
import VerifiedBadge from './VerifiedBadge';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import html2canvas from 'html2canvas';

const DigitalCard = ({ userData, onDownload }) => {
  const cardRef = useRef();

  const handleDownload = async () => {
    if (cardRef.current) {
      try {
        const canvas = await html2canvas(cardRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#1a1a1a',
        });
        
        const link = document.createElement('a');
        link.download = `${userData.username}-irtzalink-digital-card.png`;
        link.href = canvas.toDataURL();
        link.click();
        
        if (onDownload) onDownload();
      } catch (error) {
        console.error('Error generating card:', error);
      }
    }
  };

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
        ref={cardRef}
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
              <div className="flex items-center mb-2 gap-2">
                <h2 className="text-2xl font-bold leading-tight">{userData.displayName}</h2>
                <VerifiedBadge username={userData.username} className="w-6 h-6 flex-shrink-0 mt-1" />
              </div>
              <p className="text-gray-300 text-sm">{userData.bio || 'IrtzaLink User'}</p>
            </div>

            {/* Social Links */}
            {activeSocialLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {activeSocialLinks.map((social) => (
                  <div
                    key={social.key}
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-105"
                    title={social.name}
                    style={{ 
                      backgroundColor: social.color,
                      border: `2px solid ${social.color}40`
                    }}
                  >
                    <div className="w-6 h-6 text-white">
                      {social.icon}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Contact Info */}
            <div className="space-y-3 text-sm">
              {userData.contactInfo?.email && (
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                    </svg>
                  </div>
                  <span className="text-gray-200">{userData.contactInfo.email}</span>
                </div>
              )}
              {userData.contactInfo?.website && (
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.559-.499-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.559.499.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.497-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <span className="text-gray-200">{userData.contactInfo.website}</span>
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

      {/* Download Button */}
      <button
        onClick={handleDownload}
        className="mt-4 w-full btn-primary btn-3d flex items-center justify-center space-x-2 animate-fade-in"
      >
        <ArrowDownTrayIcon className="w-5 h-5" />
        <span>Download IrtzaLink Digital Card</span>
      </button>
    </div>
  );
};

export default DigitalCard;