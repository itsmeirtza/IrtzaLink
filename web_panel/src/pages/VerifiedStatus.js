import React from 'react';
import { CheckBadgeIcon, StarIcon, BoltIcon, ShieldCheckIcon, TrophyIcon, EyeIcon, UserGroupIcon } from '@heroicons/react/24/solid';
import { isVerifiedUser } from '../config/verifiedAccounts';

const VerifiedStatus = ({ user }) => {
  const isUserVerified = user?.userData?.username ? isVerifiedUser(user.userData.username) : false;

  if (!isUserVerified) {
    // If user is not verified, show "Get Verified" content
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                <CheckBadgeIcon className="w-16 h-16 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Get Verified on IrtzaLink
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Join the exclusive community of verified creators and unlock premium features
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Why Get Verified?
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
                <CheckBadgeIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Blue Checkmark
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Stand out with the official verified badge on your profile
                </p>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl">
                <TrophyIcon className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Priority Support
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Get faster response times and dedicated assistance
                </p>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl">
                <BoltIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Early Access
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Be the first to try new features and updates
                </p>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl">
                <EyeIcon className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Higher Visibility
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Verified accounts get better search rankings
                </p>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl">
                <ShieldCheckIcon className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Trust & Safety
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Build trust with your audience through verification
                </p>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-xl">
                <UserGroupIcon className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Community Access
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Join exclusive verified creator communities
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              How to Apply for Verification
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">1</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Complete Your Profile</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Fill out all profile information including bio, profile picture, and social links
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">2</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Meet the Criteria</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Have significant following, authentic content, and comply with our guidelines
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">3</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contact Us</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Reach out to our team with your verification request and supporting documents
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <a
                href="/contact"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
              >
                <CheckBadgeIcon className="w-5 h-5 mr-2" />
                Apply for Verification
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is verified, show verified status page
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                <CheckBadgeIcon className="w-16 h-16 text-white" />
              </div>
              <div className="absolute -top-2 -right-2">
                <TrophyIcon className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🎉 Congratulations! You're Verified!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Welcome to the exclusive club of verified IrtzaLink creators
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center">
            <CheckBadgeIcon className="w-20 h-20 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              @{user?.userData?.username}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              Officially Verified Creator
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <CheckBadgeIcon className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-blue-700 dark:text-blue-300 font-semibold">Verified Account</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <TrophyIcon className="w-6 h-6 text-yellow-600 mr-2" />
              Your Verified Benefits
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <CheckBadgeIcon className="w-5 h-5 text-blue-600 mr-3" />
                Blue checkmark on profile
              </li>
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <BoltIcon className="w-5 h-5 text-yellow-600 mr-3" />
                Priority customer support
              </li>
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <EyeIcon className="w-5 h-5 text-green-600 mr-3" />
                Higher search visibility
              </li>
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <ShieldCheckIcon className="w-5 h-5 text-purple-600 mr-3" />
                Enhanced trust & credibility
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <StarIcon className="w-6 h-6 text-yellow-600 mr-2" />
              Exclusive Features
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <UserGroupIcon className="w-5 h-5 text-indigo-600 mr-3" />
                Verified creator community access
              </li>
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <BoltIcon className="w-5 h-5 text-red-600 mr-3" />
                Early access to new features
              </li>
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <TrophyIcon className="w-5 h-5 text-purple-600 mr-3" />
                Special verification badge
              </li>
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <ShieldCheckIcon className="w-5 h-5 text-blue-600 mr-3" />
                Account protection priority
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Keep Your Verified Status
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            Continue following our community guidelines and maintaining authentic content to keep your verified status. 
            Remember, verification is a privilege that comes with responsibility.
          </p>
          <div className="flex justify-center space-x-4">
            <a
              href="/profile"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              View Your Profile
            </a>
            <a
              href="/contact"
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifiedStatus;