export interface Message {
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface Conversation {
  id: string;
  user_message: string;
  bot_message: string;
  timestamp: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  created_at: string;
}

export interface PDFDocument {
  id: string;
  title: string;
  content: string;
  url: string;
  created_at: string;
} 