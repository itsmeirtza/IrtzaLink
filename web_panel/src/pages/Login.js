import React, { useState } from 'react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../services/firebase';
import supabaseService from '../services/supabaseService';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { EyeIcon, EyeSlashIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const Login = ({ darkMode, toggleDarkMode }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      const user = result.user;
      
      console.log('🔥 LOGIN: Google signin successful, initializing user in Supabase');
      
      // Initialize user in Supabase (will create if new, or return existing)
      const initResult = await supabaseService.initializeUser(user.uid, {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL
      });
      
      if (initResult.success) {
        toast.success(initResult.isNew ? 'Welcome to IrtzaLink!' : 'Welcome back!');
        console.log('✅ LOGIN: User initialized in Firestore');
      } else {
        console.error('❌ LOGIN: Failed to initialize user:', initResult.error);
        toast.success('Signed in successfully!');
      }
    } catch (error) {
      toast.error(error.message || 'Error signing in with Google');
      console.error('Google sign-in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        await signInWithEmail(formData.email, formData.password);
        toast.success('Welcome back!');
      } else {
        // Sign up
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match');
          setLoading(false);
          return;
        }
        
        if (formData.password.length < 6) {
          toast.error('Password must be at least 6 characters');
          setLoading(false);
          return;
        }

        const result = await signUpWithEmail(formData.email, formData.password);
        const user = result.user;
        
        console.log('🔥 LOGIN: Email signup successful, initializing user in Supabase');
        
        // Initialize user in Supabase
        const initResult = await supabaseService.initializeUser(user.uid, {
          displayName: formData.displayName || user.email.split('@')[0],
          email: user.email,
          photoURL: user.photoURL
        });
        
        if (initResult.success) {
          toast.success('Account created successfully!');
          console.log('✅ LOGIN: User created and initialized in Firestore');
        } else {
          console.error('❌ LOGIN: Failed to initialize user:', initResult.error);
          toast.success('Account created!');
        }
      }
    } catch (error) {
      toast.error(error.message || 'Authentication error');
      console.error('Email auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          {/* Theme Switcher */}
          <div className="flex justify-end mb-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <SunIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <MoonIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
          
          <div className="flex justify-center items-center space-x-4 mb-6">
            <img 
              src={require('../assets/irtzalink-logo.svg').default} 
              alt="IrtzaLink" 
              className="w-12 h-12"
            />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">IrtzaLink</h1>
          </div>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isLogin 
              ? 'Sign in to manage your links and profile' 
              : 'Start building your personal link hub'
            }
          </p>
        </div>

        <div className="card p-8">
          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <LoadingSpinner size="small" text="" />
            ) : (
              <>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Or continue with email
                </span>
              </div>
            </div>
          </div>

          {/* Email Form */}
          <form className="mt-6 space-y-6" onSubmit={handleEmailAuth}>
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  name="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Your display name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email address
              </label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="input-field"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input-field pr-12"
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Confirm your password"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <LoadingSpinner size="small" text="" />
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setFormData({ email: '', password: '', confirmPassword: '', displayName: '' });
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'
              }
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl mb-2">🔗</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Manage Links</p>
            </div>
            <div>
              <div className="text-2xl mb-2">📊</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Track Analytics</p>
            </div>
            <div>
              <div className="text-2xl mb-2">📱</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">QR Codes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;