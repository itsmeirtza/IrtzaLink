import React, { useContext } from 'react';
import { CheckBadgeIcon, SparklesIcon, StarIcon, PhoneIcon, EnvelopeIcon, ShieldCheckIcon, TrophyIcon, EyeIcon, UserGroupIcon, BoltIcon, GiftIcon, CrownIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import { isVerifiedUser } from '../config/verifiedAccounts';

const GetVerified = ({ user }) => {
  // Check if user is already verified
  const isUserVerified = user && user.userData && user.userData.username && isVerifiedUser(user.userData.username);
  
  // If user is already verified, show verified status page
  if (isUserVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Verified Status Hero */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            {/* Floating Animation Container */}
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotateY: [0, 5, 0, -5, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="mb-8"
            >
              <div className="relative inline-block">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 scale-150 animate-pulse"></div>
                {/* Crown icon with 3D effect */}
                <motion.div
                  whileHover={{ scale: 1.1, rotateY: 15 }}
                  className="relative bg-gradient-to-tr from-blue-500 to-purple-600 p-6 rounded-full shadow-2xl transform-gpu"
                  style={{
                    background: 'linear-gradient(135deg, #3B82F6, #8B5CF6, #EF4444)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 40px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  <CrownIcon className="w-16 h-16 text-yellow-300 drop-shadow-lg" />
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                You're Verified!
              </h1>
              
              <div className="flex items-center justify-center space-x-2 mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <CheckBadgeIcon className="w-8 h-8 text-blue-500" />
                </motion.div>
                <span className="text-2xl font-bold text-gray-800 dark:text-white">
                  @{user.userData.username}
                </span>
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <CheckBadgeIcon className="w-8 h-8 text-blue-500" />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Verified Benefits */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid md:grid-cols-3 gap-6 mb-12"
          >
            {[
              {
                icon: <CheckBadgeIcon className="w-8 h-8" />,
                title: "Verified Badge",
                description: "Your blue checkmark is active and visible to everyone",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: <StarIcon className="w-8 h-8" />,
                title: "Enhanced Trust",
                description: "People know your profile is authentic and verified",
                color: "from-yellow-500 to-orange-500"
              },
              {
                icon: <CrownIcon className="w-8 h-8" />,
                title: "Premium Status",
                description: "You're part of the exclusive verified community",
                color: "from-purple-500 to-pink-500"
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                whileHover={{ 
                  scale: 1.05,
                  rotateY: 5,
                  z: 50
                }}
                className="relative group"
              >
                <div className={`bg-gradient-to-br ${benefit.color} p-1 rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-300`}>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 h-full">
                    <div className={`text-white bg-gradient-to-r ${benefit.color} p-3 rounded-xl mb-4 inline-block`}>
                      {benefit.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Celebration Message */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-3xl"></div>
            
            <div className="relative z-10">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Congratulations!
              </h2>
              
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
                Your account is verified and your blue checkmark is proudly displayed. 
                You're now part of the exclusive verified community on IrtzaLink!
              </p>
              
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/profile'}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl"
              >
                View My Profile
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent("Hi! I'm interested in getting verified badge for my IrtzaLink profile. Please provide more details about the verification process.");
    window.open(`https://wa.me/+923001234567?text=${message}`, '_blank');
  };

  const handleEmailContact = () => {
    const subject = encodeURIComponent("Verification Badge Request - IrtzaLink");
    const body = encodeURIComponent(`Hi,

I would like to request a verified badge for my IrtzaLink profile.

My Profile Details:
- Username: [Your Username]
- Display Name: [Your Name]
- Email: [Your Email]

Please provide me with the verification process and payment details.

Thank you!`);
    
    window.open(`mailto:verification@irtzalink.com?subject=${subject}&body=${body}`, '_blank');
  };

  const features = [
    {
      icon: <CheckBadgeIcon className="w-6 h-6" />,
      title: "Verified Badge",
      description: "Get the iconic blue checkmark next to your name"
    },
    {
      icon: <StarIcon className="w-6 h-6" />,
      title: "Enhanced Credibility",
      description: "Build trust with your audience and followers"
    },
    {
      icon: <SparklesIcon className="w-6 h-6" />,
      title: "Premium Status",
      description: "Stand out from regular profiles with verified status"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-6">
            <CheckBadgeIcon className="w-16 h-16 text-blue-500 mr-3" />
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white">
              Get Verified
            </h1>
          </div>
          
          {/* Blue Tick Preview */}
          {user && user.userData && user.userData.username && (
            <div className="mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-auto border-2 border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 text-center">
                  Preview: Your Verified Profile
                </h3>
                <div className="flex flex-col items-center space-y-3">
                  <img
                    src={user.userData.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.userData.displayName || user.displayName || 'User')}&background=3b82f6&color=ffffff`}
                    alt="Profile Preview"
                    className="w-16 h-16 rounded-full object-cover border-3 border-blue-200 dark:border-blue-600 shadow-lg"
                  />
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {user.userData.displayName || user.displayName || 'Your Name'}
                    </h4>
                    <div className="flex items-center justify-center space-x-1">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        @{user.userData.username}
                      </span>
                      <CheckBadgeIcon className="w-4 h-4 text-blue-500 ml-1" title="Verified" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Join the elite circle of verified users and boost your profile's credibility with our exclusive verified badge
          </p>
        </motion.div>

        {/* Pricing Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="card p-8 mb-12 text-center relative overflow-hidden"
        >
          {/* Special Offer Badge */}
          <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
            Limited Time Offer!
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <span className="text-3xl text-gray-500 dark:text-gray-400 line-through mr-4">$29.9</span>
              <span className="text-6xl font-bold text-blue-600 dark:text-blue-400">$10</span>
              <span className="text-xl text-gray-600 dark:text-gray-300 ml-2">/year</span>
            </div>
            <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-2 rounded-full inline-block font-semibold text-lg">
              Save $19.9! 🎉
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Verified Badge - Annual Plan
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Get verified status for a full year with our special launch discount
          </p>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
              >
                <div className="text-blue-500 mb-3 flex justify-center">
                  {feature.icon}
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Contact Options */}
          <div className="space-y-4">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Ready to get verified? Contact us:
            </h4>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* WhatsApp Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleWhatsAppContact}
                className="flex items-center justify-center space-x-3 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <PhoneIcon className="w-6 h-6" />
                <span>WhatsApp</span>
              </motion.button>
              
              {/* Email Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEmailContact}
                className="flex items-center justify-center space-x-3 bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <EnvelopeIcon className="w-6 h-6" />
                <span>Email</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="card p-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Frequently Asked Questions
          </h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                What do I get with verification?
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                You'll receive a blue checkmark badge next to your name, enhanced profile visibility, and premium status that builds trust with your audience.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                How long does verification take?
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                Once payment is processed, verification is typically completed within 24-48 hours.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Is this a one-time payment?
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                The verification badge is valid for one year. You can renew annually to maintain your verified status.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Can I get a refund?
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                We offer a 30-day money-back guarantee if you're not satisfied with our verification service.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GetVerified;