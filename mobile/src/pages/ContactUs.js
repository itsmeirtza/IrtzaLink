import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';
import toast from 'react-hot-toast';
import {
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Save contact form data to Firebase with notification settings
      await addDoc(collection(db, 'contact_messages'), {
        ...formData,
        timestamp: new Date(),
        status: 'new',
        adminEmail: 'irtzaaliwaris@gmail.com', // Email to send notification
        notificationSent: false
      });

      toast.success('Message sent successfully! We will get back to you soon.');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Contact Us
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Have questions or feedback? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Contact Information */}
        <div className="lg:col-span-1">
          <div className="card p-8 h-fit">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Get in Touch
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <EnvelopeIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Email</h4>
                  <p className="text-gray-600 dark:text-gray-400">irtzaaliwaris@gmail.com</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">We'll respond within 24 hours</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Quick Response</h4>
              <p className="text-sm text-blue-700 dark:text-blue-200">
                For the fastest response, please use the contact form. All messages are delivered directly to our support team.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="card p-8">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Send us a Message
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="What is this about?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="input-field resize-none"
                  placeholder="Tell us more about your question or feedback..."
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Quick answers to common questions about IrtzaLink
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              How do I create my profile?
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              Simply sign up, choose a username, and start adding your social links and bio. Your profile will be live instantly!
            </p>
          </div>

          <div className="card p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              Is IrtzaLink free to use?
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              Yes! IrtzaLink is completely free to use. Create unlimited profiles and share them anywhere.
            </p>
          </div>

          <div className="card p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              Can I customize my profile theme?
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              Absolutely! Choose between light and dark themes, and customize your profile to match your style.
            </p>
          </div>

          <div className="card p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              How do QR codes work?
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              Each profile gets a unique QR code that people can scan to visit your profile instantly. Perfect for business cards!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;