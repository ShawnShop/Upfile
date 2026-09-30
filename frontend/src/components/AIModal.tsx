import React, { useState } from 'react';
import { X, Sparkles, Send, Bot, User, FileText } from 'lucide-react';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIModal: React.FC<AIModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<{ sender: 'ai' | 'user'; text: string; source?: string }[]>([
    {
      sender: 'ai',
      text: "Hello Alex! I'm your KBase AI Assistant. Ask me anything about your documents, meeting notes, or project specs across your 12 projects.",
    }
  ]);
  const [input, setInput] = useState('');

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);

    setTimeout(() => {
      let aiReply = "Based on 'Marketing Plan.pdf' and 'Website Redesign' notes, all Q3 brand deliverables are scheduled for completion next week. Let me know if you need specific section details!";
      if (userText.toLowerCase().includes('research') || userText.toLowerCase().includes('survey')) {
        aiReply = "According to 'Survey Data.xlsx' in the Product Research project, 84% of surveyed respondents preferred the streamlined dashboard layout.";
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: aiReply,
          source: 'Marketing Plan.pdf (Page 4)'
        }
      ]);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full h-[520px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                KBase AI Assistant
              </h3>
              <p className="text-[11px] text-slate-500">Ask questions across your knowledge base</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white/80 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                    : 'bg-slate-100/80 text-slate-800 rounded-tl-none border border-slate-200/50'
                }`}
              >
                <p>{m.text}</p>
                {m.source && (
                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                    <FileText className="w-3 h-3 text-blue-500" />
                    <span>Source: {m.source}</span>
                  </div>
                )}
              </div>
              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Footer */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your projects..."
              className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
            />
            <button
              type="submit"
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
