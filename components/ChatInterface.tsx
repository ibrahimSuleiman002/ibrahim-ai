import React, { useRef, useEffect } from 'react';
import { Message, Role } from '../types';
import MessageBubble from './MessageBubble';
import { Sparkles } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center mb-6 animate-fade-in-up">
            <Sparkles className="text-brand-500" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to Ibrahim's AI</h2>
        <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
          I am designed to be an intelligent, reliable, and respectful assistant. 
          Ask me anything, and I will help you learn and solve problems step-by-step.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full text-left">
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-default">
                <h3 className="font-semibold text-slate-700 mb-1 text-sm">Explain deeply</h3>
                <p className="text-xs text-slate-500">I break down complex topics into simple, logical parts.</p>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-default">
                <h3 className="font-semibold text-slate-700 mb-1 text-sm">Problem Solving</h3>
                <p className="text-xs text-slate-500">I use reasoning and examples to help you find solutions.</p>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
      <div className="max-w-4xl mx-auto">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && !messages.some(m => m.isStreaming) && (
             <div className="flex w-full mb-6 justify-start">
                 <div className="flex max-w-[80%] gap-3 items-center">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                         <Sparkles size={16} className="text-brand-500 animate-spin-slow" />
                    </div>
                    <div className="text-sm text-slate-500 italic">Thinking...</div>
                 </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatInterface;
