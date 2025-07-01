'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LPULogo from './components/LPULogo';
import Chat from '@/app/components/Chat';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [logoError, setLogoError] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setLoading(false);
    };

    checkSession();
  }, [supabase.auth]);

  const handleAdminClick = () => {
    window.location.href = '/admin';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl font-semibold text-gray-700">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <LPULogo />
            </div>
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-700 hover:text-[#8B0000] focus:outline-none"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMobileMenuOpen ? (
                    <path d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
            {/* Navigation Links - Centered */}
            <div className="hidden md:flex items-center space-x-6">
              <a href="/" className="text-gray-700 hover:text-[#8B0000] font-medium">Home</a>
              <a href="/faq" className="text-gray-700 hover:text-[#8B0000] font-medium">FAQ</a>
              <a href="/contact" className="text-gray-700 hover:text-[#8B0000] font-medium">Contact</a>
            </div>
            {/* Action Buttons - Right Aligned */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={handleAdminClick}
                className="px-4 py-2 bg-[#8B0000] text-white rounded-lg font-medium hover:bg-[#6B0000] transition-colors duration-200 flex items-center space-x-2"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <span>Admin Panel</span>
              </button>
            </div>
          </div>
          
          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                <a href="/" className="block px-3 py-2 text-gray-700 hover:text-[#8B0000] font-medium">Home</a>
                <a href="/faq" className="block px-3 py-2 text-gray-700 hover:text-[#8B0000] font-medium">FAQ</a>
                <a href="/contact" className="block px-3 py-2 text-gray-700 hover:text-[#8B0000] font-medium">Contact</a>
                <button
                  onClick={handleAdminClick}
                  className="w-full mt-2 px-4 py-2 bg-[#8B0000] text-white rounded-lg font-medium hover:bg-[#6B0000] transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <span>Admin Panel</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-white bg-hero-pattern bg-cover bg-center bg-no-repeat">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#8B0000] font-serif">
              LYCEUM OF THE PHILIPPINES UNIVERSITY
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-[#8B0000] max-w-3xl mx-auto font-serif">
              Learn Different. Live Different.
            </p>
            <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-4">
              Get instant answers to your questions about courses, schedules, exams, and more with our AI-powered help desk.
            </p>
            <div className="mt-6 sm:mt-8">
              <a href="#chat-section">
                <button className="w-full sm:w-auto px-6 py-3 bg-[#8B0000] text-white rounded-lg font-medium hover:bg-[#6B0000] transition-colors duration-200">
                  Start Chatting
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-[#8B0000] text-2xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold text-gray-900">Instant Responses</h3>
            <p className="mt-2 text-gray-600">Get quick answers to your questions anytime, anywhere.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-[#8B0000] text-2xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-gray-900">Comprehensive Knowledge</h3>
            <p className="mt-2 text-gray-600">Access information about all aspects of LPU life.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm sm:col-span-2 md:col-span-1">
            <div className="text-[#8B0000] text-2xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold text-gray-900">Secure & Private</h3>
            <p className="mt-2 text-gray-600">Your conversations are always private and secure.</p>
          </div>
        </div>
      </div>

      {/* Chat Section */}
      <div id="chat-section" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 scroll-mt-16">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Start Your Conversation
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Ask me anything about LPU!
            </p>
          </div>
          <div className="h-[400px] sm:h-[500px] md:h-[600px]">
            <Chat />
          </div>
        </div>
      </div>
    </div>
  );
} 