'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Conversation {
  id: string;
  user_message: string;
  bot_message: string;
  timestamp: string;
}

export default function ConversationHistory() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;

      setConversations(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-700">Error loading conversations: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Recent Conversations</h2>
      {conversations.length === 0 ? (
        <p className="text-gray-500">No conversations yet</p>
      ) : (
        conversations.map((conv) => (
          <div
            key={conv.id}
            className="bg-white rounded-lg shadow p-4 space-y-2"
          >
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-600">U</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-gray-900">{conv.user_message}</p>
                <p className="text-xs text-gray-500">
                  {new Date(conv.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2 pl-10">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600">B</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-gray-900">{conv.bot_message}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
} 