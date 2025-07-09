'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
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
import { Bar, Doughnut, Line } from 'react-chartjs-2';

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

interface AnalyticsData {
  pdfStats: {
    total: number;
    processed: number;
    pending: number;
    recentUploads: number;
  };
  faqStats: {
    total: number;
    byCategory: { [key: string]: number };
  };
  ticketStats: {
    total: number;
    byPriority: { [key: string]: number };
    byDepartment: { [key: string]: number };
  };
  activityStats: {
    totalConversations: number;
    recentActivity: number;
  };
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();
  const [userMessages, setUserMessages] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchAndCategorize = async () => {
      try {
        const { data: allMessages, error: allError } = await supabase
          .from('user_messages')
          .select('id, content, category');

        if (allError) {
          console.error('Error fetching all messages:', allError);
          return;
        }

        if (!allMessages) return;

        setUserMessages(allMessages.map(msg => msg.content));

        const uncategorized = allMessages.filter(msg => msg.category === null);

        if (uncategorized.length > 0) {
          const batchSize = 3;
          for (let i = 0; i < uncategorized.length; i += batchSize) {
            const batch = uncategorized.slice(i, i + batchSize);
            const batchMessages = batch.map(msg => msg.content);

            try {
              const response = await fetch('/api/categorize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: batchMessages }),
              });

              const result = await response.json();
              const batchCategories = result.categories || [];

              for (let j = 0; j < batch.length; j++) {
                const messageId = batch[j].id;
                const category = batchCategories[j] || 'Others';

                const { error: updateError } = await supabase
                  .from('user_messages')
                  .update({ category })
                  .eq('id', messageId);

                if (updateError) {
                  console.error(`Failed to update message ${messageId}`, updateError);
                }
              }
            } catch (err) {
              console.error('Categorization error:', err);
            }
          }
        }

        const updatedResult = await supabase
          .from('user_messages')
          .select('category');

        if (updatedResult.error) {
          console.error('Error re-fetching categories:', updatedResult.error);
          return;
        }

        const counts: Record<string, number> = {};
        updatedResult.data.forEach(row => {
          const cat = row.category || 'Others';
          counts[cat] = (counts[cat] || 0) + 1;
        });

        setCategories(Object.keys(counts));
        setCategoryCounts(counts);
      } catch (err) {
        console.error('Unexpected error in fetchAndCategorize:', err);
      }
    };
    fetchAndCategorize();
  }, [supabase]);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setError(null);

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
          recentUploads: pdfData.filter(pdf => {
            const uploadDate = new Date(pdf.created_at);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return uploadDate >= thirtyDaysAgo;
          }).length,
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
          byPriority: ticketData.reduce((acc: { [key: string]: number }, ticket) => {
            acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
            return acc;
          }, {}),
          byDepartment: ticketData.reduce((acc: { [key: string]: number }, ticket) => {
            acc[ticket.department] = (acc[ticket.department] || 0) + 1;
            return acc;
          }, {}),
        };

        // For now, we'll use placeholder data for activity stats
        const activityStats = {
          totalConversations: 0, // TODO: Implement when conversation tracking is added
          recentActivity: 0, // TODO: Implement when activity tracking is added
        };

        setAnalyticsData({
          pdfStats,
          faqStats,
          ticketStats,
          activityStats,
        });
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to load analytics data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [supabase]);

  // Chart configurations
  const pdfStatusChartData = {
    labels: ['Processed', 'Pending'],
    datasets: [
      {
        label: 'PDF Documents',
        data: [
          analyticsData?.pdfStats.processed || 0,
          analyticsData?.pdfStats.pending || 0,
        ],
        backgroundColor: ['#10B981', '#F59E0B'],
        borderColor: ['#059669', '#D97706'],
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const faqCategoryChartData = {
    labels: Object.keys(analyticsData?.faqStats.byCategory || {}),
    datasets: [
      {
        label: 'FAQs by Category',
        data: Object.values(analyticsData?.faqStats.byCategory || {}),
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
          '#EC4899',
        ],
        borderColor: [
          '#2563EB',
          '#059669',
          '#D97706',
          '#DC2626',
          '#7C3AED',
          '#DB2777',
        ],
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const ticketPriorityChartData = {
    labels: Object.keys(analyticsData?.ticketStats.byPriority || {}),
    datasets: [
      {
        label: 'Tickets by Priority',
        data: Object.values(analyticsData?.ticketStats.byPriority || {}),
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

  const ticketDepartmentChartData = {
    labels: Object.keys(analyticsData?.ticketStats.byDepartment || {}),
    datasets: [
      {
        label: 'Tickets by Department',
        data: Object.values(analyticsData?.ticketStats.byDepartment || {}),
        backgroundColor: 'rgba(107, 0, 0, 0.6)',
        borderColor: 'rgba(107, 0, 0, 1)',
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B0000]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error loading analytics data: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#6B0000]">Analytics Dashboard</h1>
            <p className="mt-2 text-gray-600">Monitor your system's performance and usage</p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#6B0000] hover:bg-[#8B0000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6B0000] transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* PDF Stats Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">PDF Documents</h2>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#6B0000]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Documents</span>
                <span className="text-2xl font-bold text-[#6B0000]">{analyticsData?.pdfStats.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Processed</span>
                <span className="text-xl font-semibold text-green-600">{analyticsData?.pdfStats.processed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending</span>
                <span className="text-xl font-semibold text-yellow-600">{analyticsData?.pdfStats.pending}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Recent Uploads (30d)</span>
                <span className="text-xl font-semibold text-blue-600">{analyticsData?.pdfStats.recentUploads}</span>
              </div>
            </div>
          </div>

          {/* FAQ Stats Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">FAQs</h2>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#6B0000]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total FAQs</span>
                <span className="text-2xl font-bold text-[#6B0000]">{analyticsData?.faqStats.total}</span>
              </div>
              {Object.entries(analyticsData?.faqStats.byCategory || {}).map(([category, count]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-gray-600">{category}</span>
                  <span className="text-xl font-semibold text-[#6B0000]">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ticket Stats Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Support Tickets</h2>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#6B0000]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Tickets</span>
                <span className="text-2xl font-bold text-[#6B0000]">{analyticsData?.ticketStats.total}</span>
              </div>
              <div className="border-t pt-3">
                <h3 className="text-sm font-medium text-gray-900 mb-2">By Priority</h3>
                {Object.entries(analyticsData?.ticketStats.byPriority || {}).map(([priority, count]) => (
                  <div key={priority} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{priority}</span>
                    <span className="font-semibold text-[#6B0000]">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activity Stats Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">User Activity</h2>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#6B0000]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Conversations</span>
                <span className="text-2xl font-bold text-[#6B0000]">{analyticsData?.activityStats.totalConversations}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Recent Activity (30d)</span>
                <span className="text-xl font-semibold text-[#6B0000]">{analyticsData?.activityStats.recentActivity}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Chat Insights</h2>
          <div className="flex flex-col md:flex-row md:space-x-8">
            <div className="mb-4 md:mb-0 md:w-1/4 flex-shrink-0">
              <div className="text-gray-600">Total User Messages</div>
              <div className="text-2xl font-bold text-[#6B0000]">{userMessages.length}</div>
            </div>
            <div className="md:w-3/4 flex-grow">
              <div className="text-gray-600 mb-1">Frequently Noted Topics</div>
              <ul className="list-disc pl-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1">
                {Object.entries(categoryCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, count]) => (
                    <li key={cat} className="text-[#6B0000] font-medium">
                      {cat} <span className="text-gray-500 font-normal">({count})</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* PDF Status Chart */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">PDF Processing Status</h2>
            <div className="h-80">
              <Doughnut data={pdfStatusChartData} options={chartOptions} />
            </div>
          </div>

          {/* FAQ Categories Chart */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">FAQ Categories Distribution</h2>
            <div className="h-80">
              <Doughnut data={faqCategoryChartData} options={chartOptions} />
            </div>
          </div>

          {/* Ticket Priority Chart */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tickets by Priority</h2>
            <div className="h-80">
              <Bar data={ticketPriorityChartData} options={chartOptions} />
            </div>
          </div>

          {/* Ticket Department Chart */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tickets by Department</h2>
            <div className="h-80">
              <Bar data={ticketDepartmentChartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 