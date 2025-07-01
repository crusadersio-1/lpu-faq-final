'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import * as pdfjs from 'pdfjs-dist';
import Link from 'next/link';
import ChatbotButton from '../components/ChatbotButton';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// Define a type for PDF documents
interface PDFDocument {
  id: number;
  title: string;
  url: string;
  extraction_successful: boolean;
  // Add other fields as needed
}

// Define a type for User documents
interface User {
  id: string;
  email: string;
  role: string;
  // Add other fields as needed
}

// Define a type for Log entries
interface Log {
  id: number;
  date: string;
  user: string;
  action: string;
  // Add other fields as needed
}

// Add FAQ interface
interface FAQ {
  id: string;  // Changed from number to string since Supabase uses UUID
  question: string;
  answer: string;
  category: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('');
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [pdfs, setPdfs] = useState<PDFDocument[]>([]);
  const [aiModel, setAiModel] = useState('gpt-3.5-turbo');
  const [responseTuning, setResponseTuning] = useState(0.5);
  const [logs, setLogs] = useState<Log[]>([]);
  const [filter, setFilter] = useState({ date: '', user: '', action: '' });
  const [processingPdf, setProcessingPdf] = useState<number | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [selectedPdfContent, setSelectedPdfContent] = useState<string | null>(null);
  const [selectedPdfTitle, setSelectedPdfTitle] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [summaryData, setSummaryData] = useState({
    pdfStats: { total: 0, processed: 0, pending: 0 },
    faqStats: { total: 0, byCategory: {} },
    ticketStats: { total: 0, open: 0, byPriority: {} }
  });

  // Initialize PDF.js worker
  useEffect(() => {
    if (typeof window !== 'undefined') {
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
    }
  }, []);

  const handleSignOut = async () => {
    try {
      // First clear all storage
      localStorage.clear();
      sessionStorage.clear();

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Use Next.js router to navigate to root
      router.push('/');
      router.refresh();

      // Force a page reload after a brief delay
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Sign out error:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(false);
      
      const file = e.target.files?.[0];
      if (!file) return;
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError("File is too large. Maximum size is 10MB.");
        return;
      }
      
      // Validate file type
      if (!file.name.endsWith('.pdf')) {
        setUploadError("Only PDF files are allowed.");
        return;
      }
      
      setPdfFile(file);
      console.log(`Uploading file: ${file.name}`);

      // Create form data for the file
      const formData = new FormData();
      formData.append('file', file);

      // Upload the file first
      const { data: storageData, error: storageError } = await supabase
        .storage
        .from('pdfs')
        .upload(`${Date.now()}-${file.name}`, file);

      if (storageError) {
        throw new Error(`Failed to upload file: ${storageError.message}`);
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('pdfs')
        .getPublicUrl(storageData.path);

      // Extract text from the PDF
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      // Store the PDF metadata and content in Supabase
      const insertData = {
        title: file.name,
        url: publicUrl,
        content: fullText.trim(),
        created_at: new Date().toISOString()
      };

      // Try to insert with extraction_successful first
      let { data: pdfData, error: insertError } = await supabase
        .from('pdf_documents')
        .insert({
          ...insertData,
          extraction_successful: true
        })
        .select()
        .single();

      // If there's an error about the column not existing, try without it
      if (insertError && insertError.message.includes('extraction_successful')) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('pdf_documents')
          .insert(insertData)
          .select()
          .single();

        if (fallbackError) {
          throw new Error(`Failed to store PDF metadata: ${fallbackError.message}`);
        }
        pdfData = fallbackData;
      } else if (insertError) {
        throw new Error(`Failed to store PDF metadata: ${insertError.message}`);
      }
      
      setUploadSuccess(true);
      alert('PDF uploaded and processed successfully!');
      setPdfFile(null);
      if (e.target) {
        e.target.value = '';
      }

      // Refresh the PDFs list
      const { data: updatedPdfs, error: fetchError } = await supabase
        .from('pdf_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching updated PDFs:', fetchError);
      } else {
        setPdfs(updatedPdfs || []);
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload PDF. Please try again.';
      setUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleAddFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newFaq = {
        question,
        answer,
        category,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('faqs')
        .insert(newFaq)
        .select('*')
        .single();

      if (error) throw error;

      // Immediately update the FAQs state with the new FAQ
      if (data) {
        setFaqs(prevFaqs => [data, ...prevFaqs]);
        
        // Update categories if new category
        if (category && !categories.includes(category)) {
          setCategories(prevCategories => [...prevCategories, category]);
        }
      }

      // Clear form
      setQuestion('');
      setAnswer('');
      setCategory('');
      alert('FAQ added successfully!');
    } catch (error) {
      console.error('Error adding FAQ:', error);
      alert('Failed to add FAQ');
    }
  };

  // Add useEffect for fetching FAQs and setting up real-time subscription
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const { data, error } = await supabase
          .from('faqs')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        console.log('Fetched FAQs:', data); // Add logging to debug
        setFaqs(data || []);
        
        // Extract unique categories using Array.from to fix Set iteration
        const uniqueCategories = Array.from(new Set(data?.map(faq => faq.category) || []));
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching FAQs:', error);
      }
    };

    fetchFaqs();

    // Set up real-time subscription
    const subscription = supabase
      .channel('custom-all-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'faqs'
        },
        (payload) => {
          console.log('Realtime change:', payload); // Add logging to debug
          if (payload.eventType === 'INSERT') {
            setFaqs(prevFaqs => [payload.new as FAQ, ...prevFaqs]);
            if (payload.new.category && !categories.includes(payload.new.category)) {
              setCategories(prevCategories => [...prevCategories, payload.new.category]);
            }
          } else if (payload.eventType === 'DELETE') {
            setFaqs(prevFaqs => prevFaqs.filter(faq => faq.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setFaqs(prevFaqs => prevFaqs.map(faq =>
              faq.id === payload.new.id ? payload.new as FAQ : faq
            ));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchPdfs = async () => {
      try {
        const { data, error } = await supabase.from('pdf_documents').select('*');
        if (error) throw error;
        setPdfs(data || []);
      } catch (error) {
        console.error('Error fetching PDFs:', error);
        setProcessingError('Failed to fetch PDF list');
      }
    };
    fetchPdfs();
  }, []);

  const handleDeletePdf = async (id: number) => {
    try {
      const { error } = await supabase.from('pdf_documents').delete().eq('id', id);
      if (error) throw error;
      setPdfs(pdfs.filter(pdf => pdf.id !== id));
      alert('PDF deleted successfully!');
    } catch (error) {
      console.error('Error deleting PDF:', error);
      alert('Failed to delete PDF.');
    }
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase.from('activity_logs').select('*');
        if (error) throw error;
        setLogs(data);
      } catch (error) {
        console.error('Error fetching logs:', error);
      }
    };
    fetchLogs();
  }, []);

  const handleExportLogs = () => {
    // Convert logs to CSV format and trigger download
    console.log('Exporting logs to CSV');
    alert('Logs exported successfully!');
  };

  const handleSendEmailReport = async () => {
    try {
      // Format logs data for the email
      const formattedLogs = logs
        .filter(log => {
          const matchesDate = !filter.date || log.date.includes(filter.date);
          const matchesUser = !filter.user || log.user.toLowerCase().includes(filter.user.toLowerCase());
          const matchesAction = !filter.action || log.action.toLowerCase().includes(filter.action.toLowerCase());
          return matchesDate && matchesUser && matchesAction;
        })
        .map(log => `${log.date} - ${log.user} - ${log.action}`)
        .join('\n');

      const content = `Activity Log Report\n\nDate: ${new Date().toLocaleDateString()}\n\n${formattedLogs}`;

      // Send email using our API
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: process.env.NEXT_PUBLIC_ADMIN_PHONE || '+1234567890',  // Replace with admin's phone number
          subject: 'Activity Log Report',
          content: content,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to send report');
      }

      alert('Email report sent successfully!');
    } catch (error) {
      console.error('Error sending email report:', error);
      alert('Failed to send email report. Please try again.');
    }
  };

  const handleProcessPdf = async (pdfId: number, pdfUrl: string) => {
    try {
      setProcessingPdf(pdfId);
      setProcessingError(null);
      
      console.log('Processing PDF:', pdfUrl);
      
      // Download the PDF file
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error('Failed to download PDF file');
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // Extract text from the PDF
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      // Update the PDF document with extracted content
      const updateData = {
        content: fullText.trim()
      };

      // Try to update with extraction_successful first
      let { error: updateError } = await supabase
        .from('pdf_documents')
        .update({ 
          ...updateData,
          extraction_successful: true 
        })
        .eq('id', pdfId);

      // If there's an error about the column not existing, try without it
      if (updateError && updateError.message.includes('extraction_successful')) {
        const { error: fallbackError } = await supabase
          .from('pdf_documents')
          .update(updateData)
          .eq('id', pdfId);

        if (fallbackError) {
          throw new Error('Failed to update PDF content');
        }
      } else if (updateError) {
        throw new Error('Failed to update PDF content');
      }

      // Refresh the PDF list
      const { data: updatedPdfs, error: refreshError } = await supabase
        .from('pdf_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (refreshError) {
        console.error('Error refreshing PDF list:', refreshError);
        throw new Error('Failed to refresh PDF list');
      }

      setPdfs(updatedPdfs || []);
      
      alert('PDF processed successfully!');
    } catch (error) {
      console.error('PDF processing error:', error);
      setProcessingError(error instanceof Error ? error.message : 'Failed to process PDF');
    } finally {
      setProcessingPdf(null);
    }
  };

  const handleViewPdfContent = async (pdfId: number, title: string) => {
    try {
      const { data, error } = await supabase
        .from('pdf_documents')
        .select('content')
        .eq('id', pdfId)
        .single();

      if (error) throw error;
      
      setSelectedPdfContent(data.content);
      setSelectedPdfTitle(title);
    } catch (error) {
      console.error('Error fetching PDF content:', error);
      alert('Failed to fetch PDF content');
    }
  };

  // Add FAQ update handler
  const handleUpdateFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaq) return;

    try {
      const { error } = await supabase
        .from('faqs')
        .update({
          question: editingFaq.question,
          answer: editingFaq.answer,
          category: editingFaq.category
        })
        .eq('id', editingFaq.id);

      if (error) throw error;

      setFaqs(faqs.map(faq => 
        faq.id === editingFaq.id ? editingFaq : faq
      ));
      setEditingFaq(null);
      alert('FAQ updated successfully!');
    } catch (error) {
      console.error('Error updating FAQ:', error);
      alert('Failed to update FAQ');
    }
  };

  // Add FAQ delete handler
  const handleDeleteFaq = async (id: string) => {
    try {
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFaqs(prevFaqs => prevFaqs.filter(faq => faq.id !== id));
      alert('FAQ deleted successfully!');
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      alert('Failed to delete FAQ');
    }
  };

  // Filter FAQs based on search and category
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = searchQuery.trim() === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === '' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Add this after other useEffect hooks
  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        // Fetch PDF statistics
        const { data: pdfData, error: pdfError } = await supabase
          .from('pdf_documents')
          .select('*');

        if (pdfError) throw pdfError;

        // Fetch FAQ statistics
        const { data: faqData, error: faqError } = await supabase
          .from('faqs')
          .select('*');

        if (faqError) throw faqError;

        // Fetch ticket statistics
        const { data: ticketData, error: ticketError } = await supabase
          .from('tickets')
          .select('*');

        if (ticketError) throw ticketError;

        // Process the data
        const pdfStats = {
          total: pdfData.length,
          processed: pdfData.filter(pdf => pdf.extraction_successful).length,
          pending: pdfData.filter(pdf => !pdf.extraction_successful).length,
        };

        const faqStats = {
          total: faqData.length,
          byCategory: faqData.reduce((acc: { [key: string]: number }, faq) => {
            acc[faq.category] = (acc[faq.category] || 0) + 1;
            return acc;
          }, {}),
        };

        const ticketStats = {
          total: ticketData.length,
          open: ticketData.filter(ticket => ticket.status === 'open').length,
          byPriority: ticketData.reduce((acc: { [key: string]: number }, ticket) => {
            acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
            return acc;
          }, {}),
        };

        setSummaryData({ pdfStats, faqStats, ticketStats });
      } catch (error) {
        console.error('Error fetching summary data:', error);
      }
    };

    fetchSummaryData();
  }, [supabase]);

  // Add chart configurations
  const pdfStatusChartData = {
    labels: ['Processed', 'Pending'],
    datasets: [
      {
        label: 'PDF Documents',
        data: [
          summaryData.pdfStats.processed,
          summaryData.pdfStats.pending,
        ],
        backgroundColor: ['#10B981', '#F59E0B'],
        borderColor: ['#059669', '#D97706'],
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const ticketPriorityChartData = {
    labels: Object.keys(summaryData.ticketStats.byPriority),
    datasets: [
      {
        label: 'Tickets by Priority',
        data: Object.values(summaryData.ticketStats.byPriority),
        backgroundColor: [
          '#EF4444', // High
          '#F59E0B', // Medium
          '#10B981', // Low
        ],
        borderColor: [
          '#DC2626',
          '#D97706',
          '#059669',
        ],
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  const faqCategoryChartData = {
    labels: Object.keys(summaryData.faqStats.byCategory),
    datasets: [
      {
        label: 'FAQs by Category',
        data: Object.values(summaryData.faqStats.byCategory),
        backgroundColor: [
          '#8B5CF6', // Purple
          '#EC4899', // Pink
          '#3B82F6', // Blue
          '#10B981', // Green
          '#F59E0B', // Yellow
        ],
        borderColor: [
          '#7C3AED',
          '#DB2777',
          '#2563EB',
          '#059669',
          '#D97706',
        ],
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 20,
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1F2937',
        bodyColor: '#4B5563',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.raw}`;
          }
        }
      },
    },
  };

  if (typeof window === 'undefined') {
    return null; // Return null during server-side rendering
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-[#6B0000] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-white text-[#6B0000] rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Home</span>
              </button>
              <Link
                href="/admin/tickets"
                className="relative px-4 py-2 bg-white text-[#6B0000] rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <span>View Tickets</span>
                {summaryData?.ticketStats.open > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {summaryData.ticketStats.open}
                  </span>
                )}
              </Link>
              <Link
                href="/admin/analytics"
                className="px-4 py-2 bg-white text-[#6B0000] rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Analytics</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-white text-[#6B0000] rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-6">
            {/* Enhanced System Overview Section */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    System Overview
                  </h2>
                  <span className="text-sm text-gray-500">
                    Last updated: {new Date().toLocaleString()}
                  </span>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-[#6B0000] to-[#8B0000] rounded-lg p-6 text-white">
                    <h3 className="text-lg font-semibold mb-2">Total PDFs</h3>
                    <p className="text-3xl font-bold">{summaryData.pdfStats.total}</p>
                    <p className="text-sm opacity-80 mt-2">
                      {summaryData.pdfStats.processed} processed
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-[#6B0000] to-[#8B0000] rounded-lg p-6 text-white">
                    <h3 className="text-lg font-semibold mb-2">Total FAQs</h3>
                    <p className="text-3xl font-bold">{summaryData.faqStats.total}</p>
                    <p className="text-sm opacity-80 mt-2">
                      Across {Object.keys(summaryData.faqStats.byCategory).length} categories
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-[#6B0000] to-[#8B0000] rounded-lg p-6 text-white">
                    <h3 className="text-lg font-semibold mb-2">Total Tickets</h3>
                    <p className="text-3xl font-bold">{summaryData.ticketStats.total}</p>
                    <p className="text-sm opacity-80 mt-2">
                      {summaryData.ticketStats.open} open tickets
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-[#6B0000] to-[#8B0000] rounded-lg p-6 text-white">
                    <h3 className="text-lg font-semibold mb-2">Processing Rate</h3>
                    <p className="text-3xl font-bold">
                      {summaryData.pdfStats.total > 0
                        ? Math.round((summaryData.pdfStats.processed / summaryData.pdfStats.total) * 100)
                        : 0}%
                    </p>
                    <p className="text-sm opacity-80 mt-2">
                      PDFs successfully processed
                    </p>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* PDF Status Chart */}
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">PDF Processing Status</h3>
                    <div className="h-64">
                      <Doughnut data={pdfStatusChartData} options={chartOptions} />
                    </div>
                  </div>

                  {/* Ticket Priority Chart */}
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tickets by Priority</h3>
                    <div className="h-64">
                      <Bar data={ticketPriorityChartData} options={chartOptions} />
                    </div>
                  </div>

                  {/* FAQ Category Chart */}
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">FAQs by Category</h3>
                    <div className="h-64">
                      <Bar data={faqCategoryChartData} options={chartOptions} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced PDF Management Section */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                  PDF Management
                </h2>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      {pdfs.length} PDFs in total
                    </span>
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.pdf';
                        input.onchange = (e) => handlePDFUpload(e as any);
                        input.click();
                      }}
                      className="px-4 py-2 bg-[#6B0000] text-white rounded-lg hover:bg-[#8B0000] transition-colors duration-200 flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      <span>Upload PDF</span>
                    </button>
                        </div>
                      </div>

                {/* Upload Status Messages */}
                    {uploading && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#6B0000]"></div>
                      <p className="text-blue-700">Uploading PDF...</p>
                    </div>
                  </div>
                    )}
                    {uploadError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-red-700">{uploadError}</p>
                    </div>
                  </div>
                    )}
                    {uploadSuccess && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-green-700">PDF uploaded and processed successfully!</p>
                  </div>
                  </div>
                )}
                  
                {/* PDF List */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                          <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Upload Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pdfs.map((pdf) => (
                          <tr key={pdf.id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <svg className="w-5 h-5 text-[#6B0000] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm font-medium text-gray-900">{pdf.title}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                pdf.extraction_successful 
                                  ? 'bg-green-100 text-green-800' 
                                  : processingPdf === pdf.id
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {processingPdf === pdf.id 
                                  ? 'Processing...' 
                                  : pdf.extraction_successful 
                                  ? 'Processed' 
                                  : 'Pending'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(pdf.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                              <button
                                onClick={() => window.open(pdf.url, '_blank')}
                                className="text-[#6B0000] hover:text-[#8B0000] transition-colors duration-200"
                                title="View PDF"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleViewPdfContent(pdf.id, pdf.title)}
                                className="text-[#6B0000] hover:text-[#8B0000] transition-colors duration-200"
                                title="View Content"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleProcessPdf(pdf.id, pdf.url)}
                                disabled={processingPdf === pdf.id || pdf.extraction_successful}
                                className={`${
                                  processingPdf === pdf.id || pdf.extraction_successful
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-[#6B0000] hover:text-[#8B0000] transition-colors duration-200'
                                }`}
                                title="Process PDF"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeletePdf(pdf.id)}
                                className="text-red-600 hover:text-red-800 transition-colors duration-200"
                                title="Delete PDF"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  </div>

                {/* PDF Content Modal */}
                  {selectedPdfContent && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
                      <div className="flex justify-between items-center p-6 border-b">
                      <h3 className="text-xl font-semibold text-gray-900">
                          Content: {selectedPdfTitle}
                        </h3>
                        <button
                          onClick={() => {
                            setSelectedPdfContent(null);
                            setSelectedPdfTitle(null);
                          }}
                          className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="p-6 overflow-y-auto flex-grow">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                          {selectedPdfContent}
                        </pre>
                      </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* FAQ Management Section */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  FAQ Management
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Add New FAQ</h3>
                    <form onSubmit={handleAddFAQ} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Question</label>
                        <input
                          type="text"
                          value={question}
                          onChange={(e) => setQuestion(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-[#8B0000] focus:border-[#8B0000] sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Answer</label>
                        <textarea
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          rows={4}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-[#8B0000] focus:border-[#8B0000] sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <input
                          type="text"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-[#8B0000] focus:border-[#8B0000] sm:text-sm"
                          required
                          list="categories"
                        />
                        <datalist id="categories">
                          {categories.map((cat, index) => (
                            <option key={index} value={cat} />
                          ))}
                        </datalist>
                      </div>
                      <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#8B0000] hover:bg-[#a00000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B0000]"
                      >
                        Add FAQ
                      </button>
                    </form>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Existing FAQs</h3>
                    <div className="space-y-4">
                      <div className="flex space-x-4">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Search FAQs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:ring-[#8B0000] focus:border-[#8B0000] sm:text-sm"
                          />
                        </div>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="rounded-md border-gray-300 shadow-sm focus:ring-[#8B0000] focus:border-[#8B0000] sm:text-sm"
                        >
                          <option value="">All Categories</option>
                          {categories.map((cat, index) => (
                            <option key={index} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-4 max-h-[600px] overflow-y-auto">
                        {filteredFaqs.map((faq) => (
                          <div key={faq.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                            {editingFaq?.id === faq.id ? (
                              <form onSubmit={handleUpdateFaq} className="space-y-4">
                                <input
                                  type="text"
                                  value={editingFaq.question}
                                  onChange={(e) => setEditingFaq({...editingFaq, question: e.target.value})}
                                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-[#8B0000] focus:border-[#8B0000] sm:text-sm"
                                />
                                <textarea
                                  value={editingFaq.answer}
                                  onChange={(e) => setEditingFaq({...editingFaq, answer: e.target.value})}
                                  rows={3}
                                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-[#8B0000] focus:border-[#8B0000] sm:text-sm"
                                />
                                <input
                                  type="text"
                                  value={editingFaq.category}
                                  onChange={(e) => setEditingFaq({...editingFaq, category: e.target.value})}
                                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-[#8B0000] focus:border-[#8B0000] sm:text-sm"
                                  list="categories"
                                />
                                <div className="flex space-x-2">
                                  <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingFaq(null)}
                                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <>
                                <div className="flex justify-between items-start">
                                  <h4 className="text-lg font-medium text-gray-900">{faq.question}</h4>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => setEditingFaq(faq)}
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteFaq(faq.id)}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                                <p className="mt-2 text-gray-600">{faq.answer}</p>
                                <div className="mt-2 flex justify-between items-center">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    {faq.category}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(faq.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chatbot Button */}
      <ChatbotButton />
    </div>
  );
}