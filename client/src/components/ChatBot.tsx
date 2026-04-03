import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Bot, Loader2 } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

interface Message {
  role: "user" | "model";
  parts: [{ text: string }];
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { axios } = useAppContext();

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      parts: [{ text: input.trim() }],
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data } = await axios.post("/api/chat", {
        message: userMessage.parts[0].text,
        history: messages,
      });

      if (data.success) {
        const botMessage: Message = {
          role: "model",
          parts: [{ text: data.text }],
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        toast.error("Failed to get response");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4 font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[350px] sm:w-[400px] h-[500px] bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="p-4 bg-primary/20 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center border border-primary/50">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-white font-semibold leading-none">Ari — MovieShine Assistant</h3>
                <span className="text-[10px] text-green-400 flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Online
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Messages area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
          >
            {messages.length === 0 && (
              <div className="text-center py-10 space-y-3">
                <Bot className="w-12 h-12 mx-auto text-primary opacity-50" />
                <p className="text-white/60 text-sm px-8">
                  Hi! I'm Ari, your MovieShine Assistant. I can help you with movie recommendations, showtimes, and booking inquiries.
                </p>
              </div>
            )}
            
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-tr-none"
                      : "bg-white/10 text-white/90 border border-white/10 rounded-tl-none backdrop-blur-md"
                  }`}
                >
                  {msg.parts[0].text}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1">
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                </div>
              </div>
            )}
          </div>

          {/* Input field */}
          <form 
            onSubmit={handleSendMessage}
            className="p-4 bg-white/5 border-t border-white/10 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about movies..."
              className="flex-1 bg-white/10 border border-white/10 rounded-full px-4 py-2 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 bg-primary hover:bg-primary-dull disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </button>
          </form>
          
          <div className="bg-white/5 py-1 text-center">
            <span className="text-[9px] text-white/30 uppercase tracking-widest font-medium">Powered by MovieShine AI</span>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-90 ${
          isOpen 
            ? "bg-red-500 hover:bg-red-600 rotate-90" 
            : "bg-primary hover:bg-primary-dull hover:scale-110"
        }`}
      >
        {isOpen ? (
          <X className="w-7 h-7 text-white" />
        ) : (
          <MessageCircle className="w-7 h-7 text-white" />
        )}
      </button>
    </div>
  );
};

export default ChatBot;
