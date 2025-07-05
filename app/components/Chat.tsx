'use client';

import { useState, useRef, useEffect } from 'react';
import { searchPDFContent } from '@/app/services/pdfService';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ThemeInit from './ThemeInit'; 

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  source?: string;
  isInitialMessage?: boolean;
  id?: string;
  parentId?: string;
  createdAt?: number;
  suggestions?: string[];
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  created_at: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! How can I help you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isInitialMessage: true,
      id: 'initial',
      createdAt: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showOptions, setShowOptions] = useState(true);
  const [predefinedOptions, setPredefinedOptions] = useState<string[]>([]);
  const [similarQuestions, setSimilarQuestions] = useState<string[]>([]);
  const supabase = createClientComponentClient();

  // Fetch FAQs for quick options
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const { data: faqs, error } = await supabase
          .from('faqs')
          .select('question')
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        const faqQuestions = faqs?.map(faq => faq.question) || [];
        setPredefinedOptions([...faqQuestions, 'I want to submit a ticket']);
      } catch (error) {
        console.error('Error fetching FAQs:', error);
      }
    };

    fetchFaqs();
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    const messagesContainer = messagesEndRef.current?.parentElement;
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages]);

  // Helper: get similar questions from FAQ
  const fetchSimilarQuestions = async (query: string) => {
    try {
      const { data: faqs, error } = await supabase
        .from('faqs')
        .select('question')
        .textSearch('question', query.split(' ').join(' & '), {
          type: 'plain',
          config: 'english'
        })
        .limit(3);

      if (error) throw error;
      return faqs?.map(faq => faq.question).filter(q => !messages[messages.length - 1]?.content.includes(q)) || [];
    } catch (error) {
      return [];
    }
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    setEditedContent(newContent);
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editedContent.trim()) return;
    setEditingMessageId(null);
    setEditedContent('');
    setIsLoading(true);
    try {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, content: editedContent } : msg
      ));
      setMessages(prev => prev.filter(msg => msg.parentId !== messageId));
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: editedContent }),
      });
      if (!response.ok) throw new Error('Failed to get response');
      const data = await response.json();
      const suggestions = await fetchSimilarQuestions(editedContent);
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || 'I apologize, but I could not process your request at this time.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source,
        id: `assistant-${Date.now()}`,
        parentId: messageId,
        createdAt: Date.now(),
        suggestions
      };
      setMessages(prev => [...prev, assistantMessage]);
      setSimilarQuestions(suggestions);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        id: `error-${Date.now()}`,
        parentId: messageId,
        createdAt: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditedContent('');
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleRegenerate = async (message: Message) => {
    setRegeneratingId(message.id || '');
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.parentId ? messages.find(m => m.id === message.parentId)?.content : message.content }),
      });
      if (!response.ok) throw new Error('Failed to get response');
      const data = await response.json();
      const suggestions = await fetchSimilarQuestions(message.content);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === message.id
            ? {
                ...msg,
                content: data.response || 'I apologize, but I could not process your request at this time.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                suggestions
              }
            : msg
        )
      );
      setSimilarQuestions(suggestions);
    } catch (error) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === message.id
            ? {
                ...msg,
                content: 'Sorry, I encountered an error regenerating the response. Please try again.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setRegeneratingId(null);
    }
  };

  const isMessageEditable = (message: Message, index: number) => {
    if (message.role !== 'user') return false;
    const lastUserMessageIndex = messages
      .map((msg, idx) => ({ msg, idx }))
      .filter(({ msg }) => msg.role === 'user')
      .pop()?.idx;
    return lastUserMessageIndex === index;
  };

  const handleSend = async (content: string) => {
    if (!content.trim()) return;
    setShowOptions(false);
    setIsLoading(true);
    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      id: Date.now().toString(),
      createdAt: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      });
      if (!response.ok) throw new Error('Failed to get response');
      const data = await response.json();
      const suggestions = await fetchSimilarQuestions(content);
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || 'I apologize, but I could not process your request at this time.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source,
        id: `assistant-${Date.now()}`,
        parentId: userMessage.id,
        createdAt: Date.now(),
        suggestions
      };
      setMessages(prev => [...prev, assistantMessage]);
      setSimilarQuestions(suggestions);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        id: `error-${Date.now()}`,
        parentId: userMessage.id,
        createdAt: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Hello! How can I help you today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isInitialMessage: true,
        id: 'initial',
        createdAt: Date.now()
      }
    ]);
    setInput('');
    setShowOptions(true);
    setSimilarQuestions([]);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <ThemeInit />
      {/* Header */}
      <div className="bg-[#6B0000] text-white p-4 flex items-center justify-between dark:bg-[#2d0101]">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-[#6B0000] font-bold">LPU</span>
          </div>
          <h1 className="text-xl font-semibold">LPU FAQ Assistant</h1>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {messages.map((message, index) => (
          <div
            key={message.id || index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 bg-[#6B0000] rounded-full flex items-center justify-center mr-2">
                <span className="text-white font-bold">LPU</span>
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg p-3 relative group ${
                message.role === 'user'
                  ? 'bg-[#6B0000] text-white'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
              }`}
            >
              {message.role === 'user' && isMessageEditable(message, index) && (
                <div className="absolute -top-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="flex flex-row space-x-1 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-1">
                    <button
                      onClick={() => {
                        setEditingMessageId(message.id || '');
                        setEditedContent(message.content);
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      title="Edit message"
                      disabled={isLoading}
                      aria-disabled={isLoading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-600 dark:text-gray-300">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleCopyMessage(message.content, message.id || '')}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      title="Copy message"
                      disabled={isLoading}
                      aria-disabled={isLoading}
                    >
                      {copiedMessageId === message.id ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-600">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-600 dark:text-gray-300">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(message.id || '')}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      title="Delete message"
                      disabled={isLoading}
                      aria-disabled={isLoading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-red-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              {message.role === 'user' && !isMessageEditable(message, index) && (
                <div className="absolute -top-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 text-xs px-2 py-1 rounded">
                    Only the last message can be edited
                  </div>
                </div>
              )}
              {message.role === 'assistant' && (
                <div className="text-sm font-semibold text-[#6B0000] mb-1">LPU Assistant</div>
              )}
              {editingMessageId === message.id ? (
                <div className="flex flex-col space-y-2">
                  <textarea
                    value={editedContent}
                    onChange={(e) => handleEditMessage(message.id || '', e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:border-[#6B0000] focus:ring-1 focus:ring-[#6B0000] text-gray-800 dark:text-gray-100 dark:bg-gray-900 min-h-[100px] resize-y"
                    autoFocus
                    placeholder="Edit your message..."
                    disabled={isLoading}
                    aria-disabled={isLoading}
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 flex items-center space-x-1"
                      disabled={isLoading}
                      aria-disabled={isLoading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={() => handleSaveEdit(message.id || '')}
                      disabled={!editedContent.trim() || isLoading}
                      className="px-3 py-1 text-sm bg-[#6B0000] text-white rounded hover:bg-[#8B0000] disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      aria-disabled={isLoading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Save & Resend</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm prose prose-sm max-w-none dark:prose-invert select-text">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({node, ...props}) => (
                        <a 
                          {...props} 
                          className="text-blue-600 hover:text-blue-800 underline dark:text-blue-400 dark:hover:text-blue-300"
                          target="_blank"
                          rel="noopener noreferrer"
                        />
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
                        <blockquote {...props} className="border-l-4 border-[#6B0000] pl-4 py-1 my-2 bg-gray-50 dark:bg-gray-800" />
                      ),
                      code: ({node, inline, ...props}) => (
                        inline ? 
                          <code {...props} className="bg-gray-200 dark:bg-gray-700 rounded px-1 py-0.5" /> :
                          <code {...props} className="block bg-gray-200 dark:bg-gray-700 rounded p-2 my-2" />
                      ),
                      strong: ({node, ...props}) => (
                        <strong {...props} className="font-bold text-[#6B0000]" />
                      ),
                      em: ({node, ...props}) => (
                        <em {...props} className="italic" />
                      )
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
              {message.role === 'assistant' && !message.isInitialMessage && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCopyMessage(message.content, message.id || '')}
                      className="flex items-center space-x-1.5 text-gray-600 hover:text-[#6B0000] dark:text-gray-300 dark:hover:text-[#ffb3b3] transition-colors duration-200"
                      title="Copy response"
                    >
                      {copiedMessageId === message.id ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm">Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                          </svg>
                          <span className="text-sm">Copy</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleRegenerate(message)}
                      disabled={isLoading || regeneratingId === message.id}
                      className="flex items-center space-x-1.5 text-gray-600 hover:text-[#6B0000] dark:text-gray-300 dark:hover:text-[#ffb3b3] transition-colors duration-200"
                      title="Regenerate response"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${regeneratingId === message.id ? 'animate-spin' : ''}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 017.5-7.5m0 0V3m0 1.5l2.25 2.25M19.5 12a7.5 7.5 0 01-7.5 7.5m0 0v1.5m0-1.5l-2.25-2.25" />
                      </svg>
                      <span className="text-sm">Regenerate</span>
                    </button>
                  </div>
                  <button
                    onClick={() => window.location.href = '/ticket'}
                    className="flex items-center space-x-1.5 text-[#6B0000] hover:text-[#8B0000] dark:hover:text-[#ffb3b3] transition-colors duration-200"
                    title="Submit a ticket"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
                    </svg>
                    <span className="text-sm">Submit Ticket</span>
                  </button>
                </div>
              )}
              {/* Similar question suggestions */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-500 dark:text-gray-300 mb-1">Similar questions:</div>
                  <div className="flex flex-wrap gap-2">
                    {message.suggestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(q)}
                        className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-xs hover:bg-[#6B0000] hover:text-white dark:hover:bg-[#6B0000] dark:hover:text-white transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs mt-1 opacity-70 dark:text-gray-300">
                {message.timestamp}
              </p>
            </div>
          </div>
        ))}
        {showOptions && (
          <div className="flex flex-col space-y-2 mt-4">
            {predefinedOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => handleSend(option)}
                className="w-full text-left p-3 rounded-full border-2 border-[#6B0000] text-[#6B0000] hover:bg-[#6B0000] hover:text-white transition-colors duration-200 flex items-center dark:bg-gray-900 dark:border-[#6B0000] dark:hover:bg-[#6B0000] dark:hover:text-white"
              >
                {option}
              </button>
            ))}
          </div>
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 bg-[#6B0000] rounded-full flex items-center justify-center mr-2">
              <span className="text-white font-bold">LPU</span>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative border-t p-4 bg-white dark:bg-gray-950 dark:border-gray-800">
        <button
          onClick={handleNewChat}
          className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-30 px-4 py-2 rounded-full bg-white text-[#6B0000] hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 border border-[#6B0000] text-gray-100 shadow-lg transition-all"
          title="Start a new chat"
        >
          <span className="mr-1">+ </span>
          <span>New Chat</span>
        </button>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder="Message us"
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:border-[#6B0000] focus:ring-1 focus:ring-[#6B0000] bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={isLoading || !input.trim()}
            className="bg-[#6B0000] text-white p-2 rounded-lg hover:bg-[#8B0000] transition-colors duration-200 disabled:opacity-50"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5} 
              stroke="currentColor" 
              className="w-6 h-6"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" 
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}