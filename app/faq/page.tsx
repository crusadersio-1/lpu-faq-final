'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import LPULogo from '../components/LPULogo'; // Adjust path based on actual structure
import RenderAnswerWithLinks from '../components/RenderAnswerWithLinks'; // Import the new component
import ChatbotButton from '../components/ChatbotButton'; // Import the button
import ThemeToggle from '../components/ThemeToggle';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Define the type for an FAQ item
interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category?: string;
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [openCategories, setOpenCategories] = useState({});
  const [openSubcategories, setOpenSubcategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchFaqs = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        // Fetch data from the 'faqs' table
        // Adjust table/column names if different
        .from('faqs')
        .select('id, question, answer, category');

      if (error) {
        setError('Failed to load FAQs. Please try again later.');
        setFaqs([]);
      } else {
        setFaqs(data || []);
        const uniqueCategories = Array.from(
          new Set((data || []).map((faq: FAQItem) => faq.category || 'General'))
        );
        setCategories(['All', ...uniqueCategories]);
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

  const toggleCategory = (category) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleSubcategory = (subCat) => {
    setOpenSubcategories((prev) => ({
      ...prev,
      [subCat]: !prev[subCat]
    }));
  };

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      (faq.category || 'General') === selectedCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const groupedFaqs: { [cat: string]: FAQItem[] } = {};
  filteredFaqs.forEach((faq) => {
    const cat = faq.category || 'General';
    if (!groupedFaqs[cat]) groupedFaqs[cat] = [];
    groupedFaqs[cat].push(faq);
  });
  
  const admissionCategories = [
    "Enrollment for New Students",
    "Tuition Fee and Payments",
    "Scholarships and Grants"
  ];

  const mergedGroupedFaqs = {
    Admission: Object.fromEntries(
      admissionCategories
        .filter(cat => groupedFaqs[cat])
        .map(cat => [cat, groupedFaqs[cat]])
    ),

    ...Object.fromEntries(
      Object.entries(groupedFaqs).filter(
        ([key]) => !admissionCategories.includes(key)
      )
    )
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Filter by Category
            </label>
            <div className="relative flex items-center w-full">
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 pr-8 border rounded-lg focus:outline-none focus:border-[#6B0000] focus:ring-1 focus:ring-[#6B0000] bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 appearance-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>
          </div>
          <div className="flex-1 md:ml-8">
            <label htmlFor="faq-search" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Search FAQs
            </label>
            <div className="relative flex items-center w-full">
              <input
                id="faq-search"
                type="text"
                placeholder="Type keywords to search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full p-2 pr-10 border rounded-lg focus:outline-none focus:border-[#6B0000] focus:ring-1 focus:ring-[#6B0000] bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
              <span className="absolute right-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-950 p-8 rounded-lg shadow-md dark:shadow-lg">
          <h2 className="text-2xl font-semibold text-[#8B0000] mb-6">Frequently Asked Questions</h2>
          
          {loading && <p className="text-center text-gray-500 dark:text-gray-400">Loading FAQs...</p>}
          {error && <p className="text-center text-red-600 dark:text-red-400">{error}</p>}
          
          {!loading && !error && (
          <div className="space-y-8">
          {Object.keys(mergedGroupedFaqs).length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">No FAQs found.</p>
          ) : (
            Object.entries(mergedGroupedFaqs).map(([cat, catValue]) => {
              const isNested = typeof catValue === 'object' && !Array.isArray(catValue);
              const isCategoryOpen = openCategories[cat];

              return (
                <div key={cat}>
                    {/* Category toggle button */}
                    <button
                      onClick={() => toggleCategory(cat)}
                      className={`flex justify-between items-center w-full py-3 text-left text-lg font-bold focus:outline-none
                        ${isCategoryOpen ? 'text-[#8B0000]' : 'text-gray-700 dark:text-gray-100 hover:text-[#8B0000] dark:hover:text-[#8B0000]'}`}
                    >
                      <span>{cat}</span>
                      <svg 
                        className={`w-5 h-5 transform transition-transform ${isCategoryOpen ? 'rotate-180 text-[#8B0000]' : 'text-gray-500 dark:text-gray-300'}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>

                    {isCategoryOpen && (
                      <div className="space-y-4 mt-2">
                        {isNested ? (
                          Object.entries(catValue).map(([subCat, faqsInSubCat]) => {
                            const isSubCatOpen = openSubcategories[subCat];

                            return (
                              <div key={subCat}>
                                {/* Subcategory toggle */}
                                <button
                                  onClick={() => toggleSubcategory(subCat)}
                                  className={`flex justify-between items-center w-full py-2 text-left text-md font-semibold focus:outline-none
                                    ${isSubCatOpen ? 'text-[#8B0000]' : 'text-gray-800 dark:text-gray-200 hover:text-[#8B0000] dark:hover:text-[#8B0000]'}`}
                                >
                                  <span>{subCat}</span>
                                  <svg 
                                    className={`w-4 h-4 transform transition-transform ${isSubCatOpen ? 'rotate-180 text-[#8B0000]' : 'text-gray-500 dark:text-gray-300'}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                  </svg>
                                </button>

                                {/* Subcategory FAQ list */}
                                {isSubCatOpen && (
                                  <div className="pl-2 space-y-2 mt-1">
                                    {faqsInSubCat.map((faq) => {
                                      const globalIndex = faqs.findIndex(f => f.id === faq.id);
                                      return (
                                        <div key={faq.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                                          <button
                                            onClick={() => toggleAccordion(globalIndex)}
                                            className={`flex justify-between items-center w-full py-3 text-left font-medium focus:outline-none
                                              ${openIndex === globalIndex ? 'text-[#8B0000]' : 'text-gray-700 dark:text-gray-100 hover:text-[#8B0000] dark:hover:text-[#8B0000]'}`}
                                          >
                                            <span>{faq.question}</span>
                                            <svg 
                                              className={`w-5 h-5 transform transition-transform ${openIndex === globalIndex ? 'rotate-180' : ''} ${openIndex === globalIndex ? 'text-[#8B0000]' : 'text-gray-500 dark:text-gray-300'}`}
                                              fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
                                            >
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                            </svg>
                                          </button>
                                          {openIndex === globalIndex && (
                                            <div className="pb-4 pt-2 text-gray-600 dark:text-gray-300">
                                              <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                  a: ({node, ...props}) => (
                                                    <a {...props} className="text-blue-600 hover:text-blue-800 underline dark:text-blue-400 dark:hover:text-blue-300" target="_blank" rel="noopener noreferrer" />
                                                  ),
                                                  ul: ({node, ...props}) => (
                                                    <ul {...props} className="list-disc pl-4 space-y-1" />
                                                  ),
                                                  ol: ({node, ...props}) => (
                                                    <ol {...props} className="list-decimal pl-4 space-y-1" />
                                                  ),
                                                  li: ({node, ...props}) => (
                                                    <li {...props} className="text-gray-800 dark:text-gray-100" />
                                                  ),
                                                  p: ({node, ...props}) => (
                                                    <p {...props} className="mb-2" />
                                                  ),
                                                  blockquote: ({node, ...props}) => (
                                                    <blockquote {...props} className="border-l-4 border-[#8B0000] pl-4 py-1 my-2 bg-gray-50 dark:bg-gray-800" />
                                                  ),
                                                  code: ({node, inline, ...props}) =>
                                                    inline ? (
                                                      <code {...props} className="bg-gray-200 dark:bg-gray-700 rounded px-1 py-0.5" />
                                                    ) : (
                                                      <code {...props} className="block bg-gray-200 dark:bg-gray-700 rounded p-2 my-2" />
                                                    ),
                                                  strong: ({node, ...props}) => (
                                                    <strong {...props} className="font-bold text-gray-600 dark:text-gray-300" />
                                                  ),
                                                  em: ({node, ...props}) => (
                                                    <em {...props} className="italic" />
                                                  )
                                                }}
                                              >
                                                {faq.answer}
                                              </ReactMarkdown>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          // Flat category (not nested) rendering here
                          catValue.map((faq) => {
                            const globalIndex = faqs.findIndex(f => f.id === faq.id);
                            return (
                              <div key={faq.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                                <button
                                  onClick={() => toggleAccordion(globalIndex)}
                                  className={`flex justify-between items-center w-full py-4 text-left font-medium focus:outline-none
                                    ${openIndex === globalIndex ? 'text-[#8B0000]' : 'text-gray-700 dark:text-gray-100 hover:text-[#8B0000] dark:hover:text-[#8B0000]'}`}
                                >
                                  <span>{faq.question}</span>
                                  <svg 
                                    className={`w-5 h-5 transform transition-transform ${openIndex === globalIndex ? 'rotate-180' : ''} ${openIndex === globalIndex ? 'text-[#8B0000]' : 'text-gray-500 dark:text-gray-300'}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                  </svg>
                                </button>
                                {openIndex === globalIndex && (
                                  <div className="pb-4 pt-2 text-gray-600 dark:text-gray-300">
                                    <ReactMarkdown
                                      remarkPlugins={[remarkGfm]}
                                      components={{ /* same as above */ }}
                                    >
                                      {faq.answer}
                                    </ReactMarkdown>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })
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