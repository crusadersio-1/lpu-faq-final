'use client';

import { useState } from 'react';
import Link from 'next/link';
import LPULogo from '../components/LPULogo';
import ChatbotButton from '../components/ChatbotButton';
import ThemeToggle from '../components/ThemeToggle';

// Placeholder icons (replace with actual SVGs or an icon library later)
const PhoneIcon = () => <span>📞</span>;
const EmailIcon = () => <span>✉️</span>;
const AddressIcon = () => <span>📍</span>;
const ClockIcon = () => <span>🕒</span>;

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Implement actual form submission logic (e.g., send to API)
    console.log('Form data submitted:', formData);
    alert('Message sent (simulation)!');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };
  
  const handleAdminClick = () => {
    window.location.href = '/admin';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 relative">
      {/* Header */}
      <nav className="bg-white dark:bg-gray-950 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <LPULogo />
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-700 dark:text-gray-100 hover:text-[#8B0000] dark:hover:text-[#8B0000] font-medium">Home</Link>
              <Link href="/faq" className="text-gray-700 dark:text-gray-100 hover:text-[#8B0000] dark:hover:text-[#8B0000] font-medium">FAQ</Link>
              <Link href="/contact" className="text-[#8B0000] font-bold">Contact</Link>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
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
        </div>
      </nav>

      {/* Contact Content Area */}
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-center text-[#8B0000] mb-2">Contact Us</h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-12">Have questions? Reach out to our support team.</p>
        <div className="flex flex-col md:flex-row justify-center items-stretch gap-8 w-full">
          <div className="md:w-3/4 w-full flex items-center">
            <div className="w-full h-[32rem] rounded-lg overflow-hidden shadow border border-gray-200 dark:border-gray-700">
              <iframe
                src="https://www.google.com/maps?q=General+Luna+St,+corner+Muralla+St,+Intramuros,+Manila,+1002+Metro+Manila,+Philippines&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: 512 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="LPU Manila Map"
              ></iframe>
            </div>
          </div>
          {/* Contact Info */}
          <div className="md:w-1/4 w-full">
            <h2 className="text-2xl font-semibold text-[#8B0000] mb-6">Contact Information</h2>
            <div className="space-y-6 bg-white dark:bg-gray-950 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              {/* Phone */}
              <div className="flex items-start space-x-4">
                <div className="pt-1 text-[#8B0000]"><PhoneIcon /></div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">Phone</h3>
                  <p className="text-gray-600 dark:text-gray-300">Main Office: (555) 123-4567</p> 
                  <p className="text-gray-600 dark:text-gray-300">Student Services: (555) 123-4568</p>
                </div>
              </div>
              {/* Email */}
              <div className="flex items-start space-x-4">
                <div className="pt-1 text-[#8B0000]"><EmailIcon /></div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">Email</h3>
                  <p className="text-gray-600 dark:text-gray-300">General Inquiries: info@lpu.edu.ph</p>
                  <p className="text-gray-600 dark:text-gray-300">Technical Support: support@lpu.edu.ph</p>
                </div>
              </div>
              {/* Address */}
              <div className="flex items-start space-x-4">
                <div className="pt-1 text-[#8B0000]"><AddressIcon /></div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">Address</h3>
                  <p className="text-gray-600 dark:text-gray-300">General Luna St, corner Muralla St, Intramuros, Manila, 1002 Metro Manila, Philippines</p>
                </div>
              </div>
              {/* Hours */}
              <div className="flex items-start space-x-4">
                <div className="pt-1 text-[#8B0000]"><ClockIcon /></div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">Hours of Operation</h3>
                  <p className="text-gray-600 dark:text-gray-300">Monday - Friday: 8:00 AM - 5:00 PM</p>
                  <p className="text-gray-600 dark:text-gray-300">Saturday: 9:00 AM - 1:00 PM</p>
                  <p className="text-gray-600 dark:text-gray-300">Sunday: Closed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating chat button */}
      <ChatbotButton />
    </div>
  );
}