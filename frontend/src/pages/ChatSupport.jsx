import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MessagesSquare, Send, Paperclip, Smile, Loader2 } from 'lucide-react';
import { useAuthStore } from '../features/auth/authStore';
import { useSocket } from '../hooks/useSocket';
import apiClient from '../api/apiClient';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const ChatSupport = () => {
  const user = useAuthStore(state => state.user);
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  
  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const fetchChatHistory = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/messages');
      setMessages(data.data || []);
      // Mark as read
      await apiClient.post('/messages/read');
    } catch (err) {
      console.error('Failed to fetch support chat history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    if (!socket || !user) return;

    // Join Support Room
    socket.emit('support:join', user._id);

    // Message Listener
    const handleSupportMessage = (msg) => {
      setMessages(prev => {
        // Prevent duplicate append
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      // Mark messages as read on receipt
      apiClient.post('/messages/read').catch(console.error);
    };

    // Typing Status Listener
    const handleAgentTyping = (data) => {
      if (data.userId === user._id) {
        setAgentTyping(data.isTyping);
      }
    };

    socket.on('support:message_received', handleSupportMessage);
    socket.on('support:typing', handleAgentTyping);

    return () => {
      socket.off('support:message_received', handleSupportMessage);
      socket.off('support:typing', handleAgentTyping);
    };
  }, [socket, user]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, agentTyping]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    
    if (!socket || !user) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('support:typing', { userId: user._id, isTyping: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('support:typing', { userId: user._id, isTyping: false });
    }, 1500);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      const content = inputText;
      setInputText('');

      // Send typing false on hit send
      if (socket && user) {
        socket.emit('support:typing', { userId: user._id, isTyping: false });
        setIsTyping(false);
      }

      const { data } = await apiClient.post('/messages', { content });
      setMessages(prev => [...prev, data.data]);
    } catch (err) {
      console.error('Failed to send support message', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="space-y-2">
          <Link to="/settings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft size={16} /> Back to Settings
          </Link>
          <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-[0.26em]">
            <MessagesSquare size={14} /> Support
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white">Live Chat Support</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
            Direct real-time connection with our operational desk and support admin.
          </p>
        </div>
      </div>

      <Card className="bg-[#121212] border-border/70 overflow-hidden flex flex-col h-[550px] rounded-2xl">
        {/* Support Header */}
        <div className="bg-[#18181a] border-b border-border/40 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 border border-primary/20 text-primary flex items-center justify-center rounded-xl font-bold font-mono">
              SU
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">Commute Support Desk</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Support online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="animate-spin text-primary w-8 h-8" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-20 text-xs text-muted-foreground">
              Send a message to start a conversation with our support team.
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderRole === 'employee';
              return (
                <div
                  key={msg._id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs ${
                      isMe
                        ? 'bg-primary/20 text-white rounded-tr-none border border-primary/20'
                        : 'bg-[#222222]/30 text-white rounded-tl-none border border-border/60'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <span className="text-[8px] text-muted-foreground font-mono block mt-1 text-right">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {agentTyping && (
            <div className="flex justify-start">
              <div className="bg-[#222222]/30 text-muted-foreground rounded-2xl rounded-tl-none border border-border/60 px-4 py-2.5 text-xs flex items-center gap-1.5">
                <Loader2 size={12} className="animate-spin text-primary" />
                <span>Agent is typing...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <form onSubmit={handleSend} className="bg-[#18181a] border-t border-border/40 p-4 flex gap-2">
          <input
            type="text"
            placeholder="Type your message here..."
            value={inputText}
            onChange={handleInputChange}
            className="flex-1 bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
          />
          <Button type="submit" variant="primary" className="p-2.5 rounded-xl min-w-[50px] flex items-center justify-center">
            <Send size={16} />
          </Button>
        </form>
      </Card>
    </motion.div>
  );
};

export default ChatSupport;
