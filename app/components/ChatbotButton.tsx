'use client';

import { useState } from 'react';
import Chat from './Chat';

export default function ChatbotButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Chat Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center sm:justify-end">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            style={{ zIndex: 40 }}
            onClick={() => setIsOpen(false)}
          />
          <div
            className="
              bg-white rounded-t-lg sm:rounded-lg shadow-xl
              w-full h-[70vh] max-h-[90vh] 
              sm:w-[400px] sm:h-[600px] 
              relative
              mx-0 sm:mr-4
              mb-0 sm:mb-4
              animate-slide-in-right
              flex flex-col
              z-50
            "
          >
            <Chat />
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 pointer-events-auto">
        {!isOpen && (
          <div className="bg-white text-[#8B0000] px-4 py-2 rounded-lg shadow-md mr-3 text-sm font-semibold whitespace-nowrap animate-fade-in border border-[#8B0000]">
            Chat with Lyceum Assistant
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full bg-[#8B0000] text-white flex items-center justify-center shadow-lg hover:bg-[#a00000] transition-colors duration-200 ${
            !isOpen && 'animate-bounce'
          }`}
          aria-label={isOpen ? 'Minimize chat' : 'Open chat'}
          style={{ zIndex: 60 }}
        >
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-6 h-6"
            >
              <path 
                fillRule="evenodd" 
                d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" 
                clipRule="evenodd" 
              />
            </svg>
          )}
        </button>
      </div>

      <style jsx global>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-fade-in {
          animation: fade-in 0.4s;
        }
      `}</style>
    </>
  );
}