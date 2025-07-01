'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import LPULogo from '../components/LPULogo'; // Adjust path based on actual structure
import RenderAnswerWithLinks from '../components/RenderAnswerWithLinks'; // Import the new component
import ChatbotButton from '../components/ChatbotButton'; // Import the button
import ThemeToggle from '../components/ThemeToggle';

// Define the type for an FAQ item
interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchFaqs = async () => {
      setLoading(true);
      setError(null);
      // Fetch data from the 'faqs' table
      // Adjust table/column names if different
      const { data, error } = await supabase
        .from('faqs')
        .select('id, question, answer');

      if (error) {
        console.error('Error fetching FAQs:', error);
        setError('Failed to load FAQs. Please try again later.');
        setFaqs([]);
      } else {
        setFaqs(data || []);
      }
      setLoading(false);
    };

    fetchFaqs();
  }, [supabase]);

  const handleAdminClick = () => {
    window.location.href = '/admin'; // Assuming admin route
  };

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 relative">
      {/* Replicated Header - Consider creating a shared Header component */}
      <nav className="bg-white dark:bg-gray-950 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <LPULogo />
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-700 dark:text-gray-100 hover:text-[#8B0000] dark:hover:text-[#8B0000] font-medium">Home</Link>
              <Link href="/faq" className="text-[#8B0000] font-bold">FAQ</Link>
              <Link href="/contact" className="text-gray-700 dark:text-gray-100 hover:text-[#8B0000] dark:hover:text-[#8B0000] font-medium">Contact</Link>
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

      {/* FAQ Content Area */}
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-center text-[#8B0000] mb-4">Frequently Asked Questions</h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-12">Find answers to the most common questions about our school and services.</p>

        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-950 p-8 rounded-lg shadow-md dark:shadow-lg">
          <h2 className="text-2xl font-semibold text-[#8B0000] mb-6">Frequently Asked Questions</h2>
          
          {loading && <p className="text-center text-gray-500 dark:text-gray-400">Loading FAQs...</p>}
          {error && <p className="text-center text-red-600 dark:text-red-400">{error}</p>}
          
          {!loading && !error && (
            <div className="space-y-4">
              {faqs.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400">No FAQs found.</p>
              ) : (
                faqs.map((faq, index) => (
                  <div key={faq.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <button
                      onClick={() => toggleAccordion(index)}
                      className="flex justify-between items-center w-full py-4 text-left font-medium text-gray-700 dark:text-gray-100 hover:text-[#8B0000] focus:outline-none"
                    >
                      <span>{faq.question}</span>
                      <svg 
                        className={`w-5 h-5 transform transition-transform ${openIndex === index ? 'rotate-180' : ''} text-gray-500 dark:text-gray-300`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                    {openIndex === index && (
                      <div className="pb-4 pt-2 text-gray-600 dark:text-gray-300">
                        <RenderAnswerWithLinks text={faq.answer} />
                      </div>
                    )}
                  </div>
                ))
              )}
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-6">
                Don't see your question here? Ask our chatbot or contact the student help desk.
              </p>
            </div>
          )}
        </div>

        {/* Additional Actions */}
        <div className="text-center mt-12">
            <p className="text-gray-600 dark:text-gray-300 mb-4">Don't see what you're looking for? Try our AI Assistant or contact us directly.</p>
            <div className="flex justify-center space-x-4">
                <Link href="/" className="px-6 py-3 bg-[#8B0000] text-white rounded-lg font-medium hover:bg-[#6B0000] transition-colors duration-200 flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path></svg>
                    <span>Ask the AI Assistant</span>
                </Link>
                <Link 
                  href="/ticket" 
                  className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-100 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                >
                    Contact Support
                </Link>
            </div>
        </div>
      </main>

      {/* Floating chat button */}
      <ChatbotButton />
    </div>
  );
}