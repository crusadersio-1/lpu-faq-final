'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import ChatbotButton from '@/app/components/ChatbotButton';

type SortField = 'id' | 'full_name' | 'email_address' | 'subject' | 'priority' | 'department' | 'created_at';
type SortDirection = 'asc' | 'desc';

type Ticket = {
  id: string;
  full_name: string;
  email_address: string;
  subject: string;
  description: string;
  priority: string;
  department: string;
  created_at: string;
  status?: string; // DB value: 'open' | 'closed'
};

const dbToUiStatus = (dbStatus: string | undefined): 'In progress' | 'Resolved' =>
  dbStatus === 'closed' ? 'Resolved' : 'In progress';

const uiToDbStatus = (uiStatus: 'In progress' | 'Resolved') =>
  uiStatus === 'In progress' ? 'open' : 'closed';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchTickets();

    // Set up real-time subscription
    const channel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets'
        },
        async () => {
          await fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line
  }, [sortField, sortDirection]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (error) throw error;

      setTickets(
        (data as Ticket[] || []).map((ticket) => ({
          ...ticket,
          status: dbToUiStatus(ticket.status),
        }))
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const handleDeleteTicket = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      try {
        const { error } = await supabase
          .from('tickets')
          .delete()
          .eq('id', id);

        if (error) {
          throw error;
        }

        setTickets(prevTickets => prevTickets.filter(ticket => ticket.id !== id));
        await fetchTickets();
        alert('Ticket deleted successfully!');
      } catch (error: any) {
        alert('Failed to delete ticket: ' + error.message);
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'Resolved') {
      return 'bg-green-100 text-green-800 border border-green-200';
    }
    return 'bg-blue-100 text-blue-800 border border-blue-200';
  };

  const handleStatusChange = async (id: string, newStatus: 'In progress' | 'Resolved') => {
    try {
      const dbStatus = uiToDbStatus(newStatus);
      const { error } = await supabase
        .from('tickets')
        .update({ status: dbStatus })
        .eq('id', id);

      if (error) throw error;

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === id ? { ...ticket, status: newStatus } : ticket
        )
      );
    } catch (err) {
      alert('Failed to update status');
    }
  };

  // Filter tickets based on search query and department
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = searchQuery.trim() === '' ||
      ticket.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.email_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDepartment = selectedDepartment === '' || ticket.department === selectedDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  // Get unique departments
  const departments = Array.from(new Set(tickets.map(ticket => ticket.department)));

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
            <p className="text-red-800">Error loading tickets: {error}</p>
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
            <h1 className="text-3xl font-bold text-[#6B0000]">Support Tickets</h1>
            <p className="mt-2 text-gray-600">Manage and monitor all support tickets</p>
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

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Tickets
              </label>
              <div className="relative">
                <input
                  id="search"
                  type="text"
                  placeholder="Search by name, email, subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-[#6B0000] focus:border-[#6B0000] sm:text-sm pl-10"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="sm:w-64">
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Department
              </label>
              <select
                id="department"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-[#6B0000] focus:border-[#6B0000] sm:text-sm"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept.charAt(0).toUpperCase() + dept.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Ticket ID</span>
                      <span className="text-gray-400">{getSortIcon('id')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => handleSort('full_name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Name</span>
                      <span className="text-gray-400">{getSortIcon('full_name')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => handleSort('email_address')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Email</span>
                      <span className="text-gray-400">{getSortIcon('email_address')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => handleSort('subject')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Subject</span>
                      <span className="text-gray-400">{getSortIcon('subject')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Description
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => handleSort('priority')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Priority</span>
                      <span className="text-gray-400">{getSortIcon('priority')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => handleSort('department')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Department</span>
                      <span className="text-gray-400">{getSortIcon('department')}</span>
                    </div>
                  </th>
                  {/* Status column header */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Created At</span>
                      <span className="text-gray-400">{getSortIcon('created_at')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {ticket.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ticket.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <a href={`mailto:${ticket.email_address}`} className="text-[#6B0000] hover:text-[#8B0000]">
                        {ticket.email_address}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ticket.subject}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-md">
                        <p className="line-clamp-2">{ticket.description}</p>
                        <button
                          onClick={() => {
                            const modal = document.createElement('div');
                            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
                            modal.innerHTML = `
                              <div class="bg-white rounded-lg max-w-3xl w-full p-6">
                                <div class="flex justify-between items-center mb-4 border-b pb-4">
                                  <div>
                                    <h3 class="text-xl font-semibold text-gray-900">Ticket Details</h3>
                                    <p class="text-sm text-gray-500 mt-1">From: ${ticket.full_name} (${ticket.email_address})</p>
                                  </div>
                                  <button class="text-gray-500 hover:text-gray-700 transition-colors duration-200" onclick="this.closest('.fixed').remove()">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                                <div class="space-y-4">
                                  <div>
                                    <h4 class="text-sm font-medium text-gray-500">Subject</h4>
                                    <p class="mt-1 text-gray-900">${ticket.subject}</p>
                                  </div>
                                  <div>
                                    <h4 class="text-sm font-medium text-gray-500">Description</h4>
                                    <div class="mt-1 p-4 bg-gray-50 rounded-lg">
                                      <p class="text-gray-900 whitespace-pre-wrap">${ticket.description}</p>
                                    </div>
                                  </div>
                                  <div class="flex space-x-4 text-sm">
                                    <div>
                                      <span class="text-gray-500">Priority:</span>
                                      <span class="ml-2 px-2 py-1 rounded-full ${getPriorityColor(ticket.priority)}">
                                        ${ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                                      </span>
                                    </div>
                                    <div>
                                      <span class="text-gray-500">Department:</span>
                                      <span class="ml-2 px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                                        ${ticket.department.charAt(0).toUpperCase() + ticket.department.slice(1)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            `;
                            document.body.appendChild(modal);
                          }}
                          className="inline-flex items-center text-[#6B0000] hover:text-[#8B0000] text-sm mt-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Details
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                        {ticket.department.charAt(0).toUpperCase() + ticket.department.slice(1)}
                      </span>
                    </td>
                    {/* Status column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={ticket.status || 'In progress'}
                        onChange={(e) =>
                          handleStatusChange(
                            ticket.id,
                            e.target.value as 'In progress' | 'Resolved'
                          )
                        }
                        className={`px-3 py-1 rounded-full text-xs font-semibold border focus:outline-none ${getStatusColor(ticket.status || 'In progress')}`}
                        style={{ minWidth: 110 }}
                      >
                        <option value="In progress">In progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() => handleDeleteTicket(ticket.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <ChatbotButton />
    </div>
  );
}