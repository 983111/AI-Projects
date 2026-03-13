import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { geminiService } from '../lib/gemini';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

export default function Chat() {
  const { chatHistory, addChatMessage, userProfile } = useStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: input,
      timestamp: Date.now()
    };
    
    addChatMessage(userMsg);
    setInput('');
    setLoading(true);

    try {
      const response = await geminiService.chat(userMsg.content, chatHistory, userProfile);
      
      addChatMessage({
        id: crypto.randomUUID(),
        role: 'model',
        content: response || "I'm sorry, I couldn't generate a response.",
        timestamp: Date.now()
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
          <Bot className="text-emerald-600" size={20} />
        </div>
        <div>
          <h2 className="font-semibold text-slate-900">AI Admission Consultant</h2>
          <p className="text-xs text-slate-500">Ask about essays, deadlines, or college fit.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
        {chatHistory.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Bot className="mx-auto mb-4 opacity-50" size={48} />
            <p>Hello! I'm your personal admission consultant.</p>
            <p className="text-sm mt-2">Ask me to draft an essay, find scholarships, or review your profile.</p>
          </div>
        )}
        
        {chatHistory.map((msg) => (
          <div key={msg.id} className={cn("flex gap-4 max-w-3xl", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              msg.role === 'user' ? "bg-slate-200" : "bg-emerald-100"
            )}>
              {msg.role === 'user' ? <User size={14} className="text-slate-600" /> : <Bot size={14} className="text-emerald-600" />}
            </div>
            <div className={cn(
              "p-4 rounded-2xl text-sm leading-relaxed",
              msg.role === 'user' 
                ? "bg-slate-900 text-white rounded-tr-none" 
                : "bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none"
            )}>
              <div className="markdown-body">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-4 max-w-3xl">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-emerald-600" />
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100 flex items-center gap-2 text-slate-500 text-sm">
              <Loader2 className="animate-spin" size={14} />
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-100 bg-white">
        <form onSubmit={handleSend} className="flex gap-2 max-w-4xl mx-auto">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your application..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-slate-50 focus:bg-white transition-all"
          />
          <button 
            type="submit" 
            disabled={loading || !input.trim()}
            className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
