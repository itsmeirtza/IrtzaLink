import React from 'react';
import {
  HeartIcon,
  RocketLaunchIcon,
  UserGroupIcon,
  GlobeAltIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ShareIcon
} from '@heroicons/react/24/outline';

const AboutUs = () => {
  const features = [
    {
      icon: UserGroupIcon,
      title: 'Social Networking',
      description: 'Connect with people, follow friends, and build your network with our social features.'
    },
    {
      icon: ShareIcon,
      title: 'Easy Sharing',
      description: 'Share your profile with a simple link or QR code. Perfect for networking events and business cards.'
    },
    {
      icon: ChartBarIcon,
      title: 'Analytics',
      description: 'Track profile visits, QR code scans, and engagement to understand your audience better.'
    },
    {
      icon: SparklesIcon,
      title: 'Customizable',
      description: 'Personalize your profile with themes, custom bios, and organize your links your way.'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Privacy Focused',
      description: 'Your data is secure with us. We never sell your information and give you full control.'
    },
    {
      icon: GlobeAltIcon,
      title: 'Global Reach',
      description: 'Accessible worldwide with fast loading times and mobile-optimized design.'
    }
  ];

  const team = [
    {
      name: 'Ahmed Irtza',
      role: 'Founder & CEO',
      image: 'https://ui-avatars.com/api/?name=Ahmed+Irtza&background=3b82f6&color=ffffff&size=200',
      description: 'Passionate about connecting people through technology and simplifying digital networking.'
    },
    {
      name: 'Sarah Khan',
      role: 'Lead Developer',
      image: 'https://ui-avatars.com/api/?name=Sarah+Khan&background=10b981&color=ffffff&size=200',
      description: 'Full-stack developer with expertise in modern web technologies and user experience.'
    },
    {
      name: 'Marcus Johnson',
      role: 'Design Lead',
      image: 'https://ui-avatars.com/api/?name=Marcus+Johnson&background=f59e0b&color=ffffff&size=200',
      description: 'Creates beautiful and intuitive user interfaces that make technology accessible to everyone.'
    },
    {
      name: 'Lisa Chen',
      role: 'Marketing Director',
      image: 'https://ui-avatars.com/api/?name=Lisa+Chen&background=8b5cf6&color=ffffff&size=200',
      description: 'Helps people discover IrtzaLink and connects our platform with users worldwide.'
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Active Users' },
    { number: '50,000+', label: 'Profiles Created' },
    { number: '100,000+', label: 'QR Codes Scanned' },
    { number: '25+', label: 'Countries' }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <HeartIcon className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
          About IrtzaLink
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
          We're on a mission to make digital networking simple, beautiful, and accessible to everyone. 
          IrtzaLink helps you create stunning profile pages that connect all your social media and 
          contact information in one place.
        </p>
      </div>

      {/* Mission Section */}
      <div className="card p-8 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <RocketLaunchIcon className="w-8 h-8 text-blue-600" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Our Mission
              </h2>
            </div>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                In today's digital world, we all have multiple social media accounts, websites, 
                and ways to connect. But sharing all of these with someone new can be complicated 
                and time-consuming.
              </p>
              <p>
                IrtzaLink solves this problem by creating a single, beautiful link that showcases 
                everything about you. Whether you're a content creator, business professional, 
                student, or just someone who wants to share their digital presence easily - 
                we've got you covered.
              </p>
              <p>
                Our platform is designed to be simple enough for anyone to use, yet powerful 
                enough to meet the needs of professionals and creators worldwide.
              </p>
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 text-center">
              <div className="grid grid-cols-2 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="space-y-2">
                    <div className="text-2xl font-bold text-blue-600">{stat.number}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            What Makes IrtzaLink Special
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            We've built IrtzaLink with the features that matter most to our users, 
            focusing on simplicity, security, and powerful functionality.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="card p-6 text-center hover:shadow-lg transition-shadow duration-200">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team Section */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Meet Our Team
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            We're a passionate group of developers, designers, and creators who believe 
            in making technology work better for people.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <div key={index} className="card p-6 text-center">
              <img
                src={member.image}
                alt={member.name}
                className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-white dark:border-gray-800 shadow-lg"
              />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {member.name}
              </h3>
              <p className="text-blue-600 text-sm font-medium mb-3">
                {member.role}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {member.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Values Section */}
      <div className="mb-16">
        <div className="card p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Our Values
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              The principles that guide everything we do at IrtzaLink
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <SparklesIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Simplicity First
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                We believe great technology should be invisible. Our tools are designed 
                to be intuitive and easy to use for everyone.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Privacy Matters
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Your data belongs to you. We're committed to protecting your privacy 
                and giving you control over your information.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <HeartIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Community Driven
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                We listen to our users and build features based on real needs and feedback 
                from our amazing community.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="text-center">
        <div className="card p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Get in Touch
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            Have questions, feedback, or just want to say hello? We'd love to hear from you. 
            Our team is always ready to help and chat about how we can improve IrtzaLink.
          </p>
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <a 
              href="/contact" 
              className="btn-primary inline-block"
            >
              Contact Us
            </a>
            <a 
              href="mailto:irtzaaliwaris@gmail.com" 
              className="btn-secondary inline-block"
            >
              Email Us Directly
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;