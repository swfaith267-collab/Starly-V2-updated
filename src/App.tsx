import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, User, Heart, MessageCircle, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getStarlyResponseStream, type Message } from './lib/gemini';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hey you, am starly...What's up" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessageText = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', text: userMessageText }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      let fullResponse = "";
      const stream = getStarlyResponseStream(newMessages);
      
      // Temporary message for streaming
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'model') {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'model', text: fullResponse };
            return updated;
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Signal's weak. Try that again?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f5f5f0] text-[#1a1a1a] font-sans selection:bg-[#5A5A40] selection:text-white">
      {/* Header */}
      <header className="border-b border-[#1a1a1a]/10 bg-white/50 backdrop-blur-md sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#5A5A40] flex items-center justify-center text-white shadow-lg overflow-hidden relative group">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute inset-0 bg-gradient-to-tr from-[#5A5A40] to-[#7A7A60]"
            />
            <Sparkles size={20} className="relative z-10" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-medium tracking-tight">Starly</h1>
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#5A5A40] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Online
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-[#1a1a1a]/5 rounded-full transition-colors order-last">
          <Info size={18} className="text-[#1a1a1a]/60" />
        </button>
      </header>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className={cn(
                "flex w-full mb-4",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "max-w-[85%] md:max-w-[70%] flex gap-4 items-start",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs mt-1",
                  msg.role === 'user' ? "bg-[#1a1a1a] text-white" : "bg-[#5A5A40] text-white"
                )}>
                  {msg.role === 'user' ? <User size={14} /> : <Heart size={14} />}
                </div>
                <div className={cn(
                  "px-5 py-3.5 rounded-3xl shadow-sm text-sm leading-relaxed",
                  msg.role === 'user' 
                  ? "bg-[#1a1a1a] text-white rounded-tr-none" 
                  : "bg-white border border-[#1a1a1a]/5 text-[#1a1a1a] rounded-tl-none"
                )}>
                  <div className="prose prose-sm font-body max-w-none">
                    <ReactMarkdown>
                      {msg.text || (isLoading && idx === messages.length - 1 ? "..." : "")}
                     </ReactMarkdown>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && messages[messages.length-1].text === "" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4 items-center justify-start anim-pulse"
          >
             <div className="w-8 h-8 rounded-full bg-[#5A5A40]/10 flex items-center justify-center">
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-[#5A5A40] rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1 h-1 bg-[#5A5A40] rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1 h-1 bg-[#5A5A40] rounded-full animate-bounce" />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white/80 backdrop-blur-xl border-t border-[#1a1a1a]/5">
        <form 
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto relative group"
        >
          <input
            autoFocus
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="How are you feeling?"
            className="w-full pl-6 pr-14 py-4 rounded-full border border-[#1a1a1a]/10 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] transition-all placeholder-[#1a1a1a]/30"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center hover:bg-[#5A5A40] disabled:bg-[#1a1a1a]/10 disabled:text-[#1a1a1a]/30 transition-all shadow-md active:scale-95"
          >
            <Send size={18} className={cn(isLoading && "animate-pulse")} />
          </button>
        </form>
        <p className="text-center text-[10px] text-[#1a1a1a]/40 mt-3 flex items-center justify-center gap-1.5 font-medium">
          <MessageCircle size={10} />
          Always here with a bit of heart.
        </p>
      </div>
    </div>
  );
}
