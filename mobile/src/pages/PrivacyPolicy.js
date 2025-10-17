import React from 'react';
import {
  ShieldCheckIcon,
  EyeIcon,
  UserIcon,
  DocumentTextIcon,
  LockClosedIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const PrivacyPolicy = () => {
  const lastUpdated = "December 15, 2024";

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-12">
        <ShieldCheckIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Privacy Policy
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Your privacy is important to us. This policy explains how we collect, use, and protect your information.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
          Last updated: {lastUpdated}
        </p>
      </div>

      <div className="space-y-12">
        {/* Information We Collect */}
        <section className="card p-8">
          <div className="flex items-center space-x-3 mb-6">
            <UserIcon className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Information We Collect
            </h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Personal Information
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
                <li>Name and email address when you create an account</li>
                <li>Profile information including bio, social links, and contact details</li>
                <li>Photos you upload for your profile</li>
                <li>Username and display name</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Usage Information
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
                <li>Profile visits and QR code scans</li>
                <li>Device information and IP addresses</li>
                <li>Browser type and operating system</li>
                <li>Pages visited and time spent on our platform</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Communication Data
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
                <li>Messages sent through our chat system</li>
                <li>Support tickets and contact form submissions</li>
                <li>Feedback and survey responses</li>
              </ul>
            </div>
          </div>
        </section>

        {/* How We Use Your Information */}
        <section className="card p-8">
          <div className="flex items-center space-x-3 mb-6">
            <EyeIcon className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              How We Use Your Information
            </h2>
          </div>
          
          <div className="space-y-4 text-gray-600 dark:text-gray-400">
            <p>
              <strong className="text-gray-900 dark:text-white">To provide our services:</strong> We use your information to create and maintain your profile, enable social connections, and provide analytics about your profile performance.
            </p>
            <p>
              <strong className="text-gray-900 dark:text-white">To improve our platform:</strong> We analyze usage patterns to enhance user experience, develop new features, and fix bugs.
            </p>
            <p>
              <strong className="text-gray-900 dark:text-white">To communicate with you:</strong> We may send you updates about our service, respond to your inquiries, and provide customer support.
            </p>
            <p>
              <strong className="text-gray-900 dark:text-white">For security:</strong> We monitor for fraudulent activity and protect against spam and abuse.
            </p>
          </div>
        </section>

        {/* Data Protection */}
        <section className="card p-8">
          <div className="flex items-center space-x-3 mb-6">
            <LockClosedIcon className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              How We Protect Your Data
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Security Measures
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
                <li>End-to-end encryption for sensitive data</li>
                <li>Secure HTTPS connections</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Data Storage
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
                <li>Data stored on secure cloud servers</li>
                <li>Regular backups and disaster recovery</li>
                <li>Limited access to authorized personnel</li>
                <li>Compliance with industry standards</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Data Sharing */}
        <section className="card p-8">
          <div className="flex items-center space-x-3 mb-6">
            <GlobeAltIcon className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Data Sharing and Third Parties
            </h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                We DO NOT sell your personal data
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                IrtzaLink never sells, rents, or trades your personal information to third parties for marketing purposes.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Limited Sharing
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                We may share information only in these specific circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
                <li>With your explicit consent</li>
                <li>To comply with legal requirements</li>
                <li>To protect our rights and safety</li>
                <li>With service providers who help us operate our platform</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Public Information
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Information you choose to make public on your profile (name, bio, social links) can be viewed by anyone who visits your profile page.
              </p>
            </div>
          </div>
        </section>

        {/* Your Rights */}
        <section className="card p-8">
          <div className="flex items-center space-x-3 mb-6">
            <DocumentTextIcon className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Your Rights and Choices
            </h2>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Access and Control
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
                  <li>View and update your profile anytime</li>
                  <li>Download your data</li>
                  <li>Delete your account</li>
                  <li>Control privacy settings</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Communication Preferences
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
                  <li>Opt out of promotional emails</li>
                  <li>Manage notification settings</li>
                  <li>Control who can contact you</li>
                  <li>Block unwanted users</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                Need help with your data?
              </h4>
              <p className="text-blue-800 dark:text-blue-400 text-sm">
                Contact us at irtzaaliwaris@gmail.com for any questions about your data rights or to request data deletion.
              </p>
            </div>
          </div>
        </section>

        {/* Cookies and Tracking */}
        <section className="card p-8">
          <div className="flex items-center space-x-3 mb-6">
            <ShieldCheckIcon className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Cookies and Tracking
            </h2>
          </div>
          
          <div className="space-y-4 text-gray-600 dark:text-gray-400">
            <p>
              We use cookies and similar technologies to improve your experience on IrtzaLink. These help us:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Keep you logged in</li>
              <li>Remember your preferences</li>
              <li>Provide analytics about platform usage</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
            <p>
              You can control cookie settings through your browser preferences. Note that disabling cookies may affect some platform functionality.
            </p>
          </div>
        </section>

        {/* Updates and Contact */}
        <section className="card p-8">
          <div className="flex items-center space-x-3 mb-6">
            <DocumentTextIcon className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Policy Updates and Contact
            </h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Policy Changes
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We may update this privacy policy from time to time. We'll notify you of significant changes through email or platform notifications. Continued use of IrtzaLink after changes constitutes acceptance of the updated policy.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Contact Us
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                If you have questions about this privacy policy or our data practices, please contact us:
              </p>
              <div className="space-y-2 text-gray-600 dark:text-gray-400">
                <p><strong>Email:</strong> irtzaaliwaris@gmail.com</p>
                <p><strong>Response time:</strong> We typically respond within 24 hours</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;