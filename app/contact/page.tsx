'use client';

import { useState } from 'react';
import Link from 'next/link';
import LPULogo from '../components/LPULogo'; // Adjust path if needed
import ChatbotButton from '../components/ChatbotButton'; // Import the button

// Placeholder icons (replace with actual SVGs or an icon library later)
const PhoneIcon = () => <span>📞</span>;
const EmailIcon = () => <span>✉️</span>;
const AddressIcon = () => <span>📍</span>;
const ClockIcon = () => <span>🕒</span>;

export default function ContactPage() {
  // Basic state for form fields (add more robust handling later)
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
    alert('Message sent (simulation)!'); // Placeholder alert
    // Reset form (optional)
    setFormData({ name: '', email: '', subject: '', message: '' });
  };
  
  const handleAdminClick = () => {
    window.location.href = '/admin'; // Assuming admin route
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 relative"> {/* Added relative positioning */}
      {/* Header - Copied from FAQ, highlighting Contact */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <LPULogo />
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-700 hover:text-[#8B0000] font-medium">Home</Link>
              <Link href="/faq" className="text-gray-700 hover:text-[#8B0000] font-medium">FAQ</Link>
              <Link href="/contact" className="text-[#8B0000] font-bold">Contact</Link> {/* Highlight Contact */}
            </div>
            <div className="flex items-center space-x-4">
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
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Contact Us</h1>
        <p className="text-center text-gray-600 mb-12">Have questions? Reach out to our support team.</p>

        {/* Changed grid to center the single column */}
        <div className="flex justify-center max-w-6xl mx-auto">
          
          {/* Contact Form Section REMOVED */}
          
          {/* Contact Information Section - Now centered */}
          <div className="max-w-md w-full"> {/* Constrain width */} 
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Contact Information</h2>
            <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              {/* Phone */}
              <div className="flex items-start space-x-4">
                <div className="pt-1 text-[#8B0000]"><PhoneIcon /></div>
                <div>
                  <h3 className="font-semibold text-gray-800">Phone</h3>
                  <p className="text-gray-600">Main Office: (555) 123-4567</p> 
                  <p className="text-gray-600">Student Services: (555) 123-4568</p>
                </div>
              </div>
              {/* Email */}
              <div className="flex items-start space-x-4">
                 <div className="pt-1 text-[#8B0000]"><EmailIcon /></div>
                 <div>
                  <h3 className="font-semibold text-gray-800">Email</h3>
                  <p className="text-gray-600">General Inquiries: info@lpu.edu.ph</p>
                  <p className="text-gray-600">Technical Support: support@lpu.edu.ph</p>
                </div>
              </div>
              {/* Address */}
              <div className="flex items-start space-x-4">
                 <div className="pt-1 text-[#8B0000]"><AddressIcon /></div>
                 <div>
                  <h3 className="font-semibold text-gray-800">Address</h3>
                  <p className="text-gray-600">General Luna St, corner Muralla St, Intramuros, Manila, 1002 Metro Manila, Philippines</p>
                </div>
              </div>
              {/* Hours */}
              <div className="flex items-start space-x-4">
                 <div className="pt-1 text-[#8B0000]"><ClockIcon /></div>
                 <div>
                  <h3 className="font-semibold text-gray-800">Hours of Operation</h3>
                  <p className="text-gray-600">Monday - Friday: 8:00 AM - 5:00 PM</p>
                  <p className="text-gray-600">Saturday: 9:00 AM - 1:00 PM</p>
                  <p className="text-gray-600">Sunday: Closed</p>
                </div>
              </div>
            </div>

            {/* Connect with Us - Remains commented out */}
          </div>

        </div>
      </main>

      {/* Add the floating chat button */}
      <ChatbotButton />
    </div>
  );
} 