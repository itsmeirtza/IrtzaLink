import React, { useContext } from 'react';
import { CheckBadgeIcon, SparklesIcon, StarIcon, PhoneIcon, EnvelopeIcon, ShieldCheckIcon, TrophyIcon, EyeIcon, UserGroupIcon, BoltIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';

const GetVerified = () => {
  const { user } = useContext(AuthContext);

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
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
              Get Verified
            </h1>
          </div>
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
          <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
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