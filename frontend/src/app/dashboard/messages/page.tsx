'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { gsap } from '@/lib/gsap';
import { api } from '@/lib/api';

interface Message {
  id: number;
  sender_name: string;
  sender_email: string;
  subject: string;
  message: string;
  status: string;
  status_display: string;
  is_starred: boolean;
  created_at: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred'>('all');

  // GSAP floating particles animation
  useEffect(() => {
    if (!containerRef.current) return;
    
    const ctx = gsap.context(() => {
      const particles = containerRef.current?.querySelectorAll('.floating-particle');
      particles?.forEach((particle, i) => {
        gsap.to(particle, {
          y: 'random(-20, 20)',
          x: 'random(-10, 10)',
          duration: 'random(3, 5)',
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.2,
        });
      });
    }, containerRef);
    
    return () => ctx.revert();
  }, [isLoading]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadMessages();
    }
  }, [isAuthenticated]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<{ results: Message[] } | Message[]>('/portfolio/messages/');
      const data = Array.isArray(response) ? response : response.results;
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.post(`/portfolio/messages/${id}/mark_read/`);
      setMessages(messages.map(m => m.id === id ? { ...m, status: 'read' } : m));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const toggleStarred = async (id: number) => {
    try {
      const response = await api.post<{ is_starred: boolean }>(`/portfolio/messages/${id}/toggle_starred/`);
      setMessages(messages.map(m => m.id === id ? { ...m, is_starred: response.is_starred } : m));
    } catch (err) {
      console.error('Failed to toggle starred:', err);
    }
  };

  const archiveMessage = async (id: number) => {
    try {
      await api.post(`/portfolio/messages/${id}/archive/`);
      setMessages(messages.filter(m => m.id !== id));
      setSelectedMessage(null);
    } catch (err) {
      console.error('Failed to archive:', err);
    }
  };

  const deleteMessage = async (id: number) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      await api.delete(`/portfolio/messages/${id}/`);
      setMessages(messages.filter(m => m.id !== id));
      setSelectedMessage(null);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const filteredMessages = messages.filter(m => {
    if (filter === 'unread') return m.status === 'unread';
    if (filter === 'starred') return m.is_starred;
    return m.status !== 'archived';
  });

  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
    if (message.status === 'unread') {
      markAsRead(message.id);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-sky-500/30 animate-ping" />
            <div className="absolute inset-0 rounded-full border-2 border-t-sky-500 border-r-indigo-500 border-b-transparent border-l-transparent animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-t-transparent border-r-transparent border-b-indigo-500 border-l-sky-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <p className="mt-6 text-white/50">Loading messages...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="floating-particle absolute w-1 h-1 rounded-full bg-sky-400/30"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-white/50 hover:text-white transition-colors">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-white">Messages</h1>
              <span className="bg-sky-500/20 text-sky-400 px-3 py-1 rounded-lg text-sm border border-sky-500/20">
                {messages.filter(m => m.status === 'unread').length} unread
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Message List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
            <div className="relative h-full rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] overflow-hidden flex flex-col">
              {/* Filters */}
              <div className="p-4 border-b border-white/[0.08] flex gap-2">
                {(['all', 'unread', 'starred'] as const).map((f) => (
                  <motion.button
                    key={f}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-xl text-sm capitalize transition-all ${
                      filter === f
                        ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-500/20'
                        : 'bg-white/[0.05] text-white/50 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    {f}
                  </motion.button>
                ))}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto">
                {filteredMessages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 text-center text-white/40"
                  >
                    <p className="text-4xl mb-2">📭</p>
                    <p>No messages yet</p>
                  </motion.div>
                ) : (
                  <AnimatePresence>
                    {filteredMessages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSelectMessage(message)}
                        className={`p-4 border-b border-white/[0.05] cursor-pointer transition-all ${
                          selectedMessage?.id === message.id
                            ? 'bg-sky-500/20'
                            : 'hover:bg-white/[0.05]'
                        } ${message.status === 'unread' ? 'bg-white/[0.03]' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {message.status === 'unread' && (
                                <span className="w-2 h-2 bg-sky-500 rounded-full shadow-lg shadow-sky-500/50" />
                              )}
                              <span className={`font-medium truncate ${
                                message.status === 'unread' ? 'text-white' : 'text-white/70'
                              }`}>
                                {message.sender_name}
                              </span>
                            </div>
                            <p className="text-sm text-white/50 truncate">{message.subject}</p>
                            <p className="text-xs text-white/30 mt-1">
                              {new Date(message.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStarred(message.id);
                            }}
                            className="text-xl"
                          >
                            {message.is_starred ? '⭐' : '☆'}
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </motion.div>

          {/* Message Detail */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
            <div className="relative h-full rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] overflow-hidden">
              <AnimatePresence mode="wait">
                {selectedMessage ? (
                  <motion.div
                    key={selectedMessage.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="h-full flex flex-col"
                  >
                    <div className="p-6 border-b border-white/[0.08]">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-xl font-semibold text-white">{selectedMessage.subject}</h2>
                          <p className="text-white/50 mt-1">
                            From: {selectedMessage.sender_name} &lt;{selectedMessage.sender_email}&gt;
                          </p>
                          <p className="text-sm text-white/30 mt-1">
                            {new Date(selectedMessage.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleStarred(selectedMessage.id)}
                            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] transition-colors"
                            title={selectedMessage.is_starred ? 'Unstar' : 'Star'}
                          >
                            {selectedMessage.is_starred ? '⭐' : '☆'}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => archiveMessage(selectedMessage.id)}
                            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] transition-colors"
                            title="Archive"
                          >
                            📥
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => deleteMessage(selectedMessage.id)}
                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Delete"
                          >
                            🗑️
                          </motion.button>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto">
                      <div className="prose prose-invert max-w-none">
                        <p className="text-white/70 whitespace-pre-wrap leading-relaxed">{selectedMessage.message}</p>
                      </div>
                    </div>
                    <div className="p-4 border-t border-white/[0.08]">
                      <motion.a
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        href={`mailto:${selectedMessage.sender_email}?subject=Re: ${selectedMessage.subject}`}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-xl transition-all hover:shadow-lg hover:shadow-sky-500/30"
                      >
                        <span>↩️</span> Reply via Email
                      </motion.a>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex items-center justify-center text-white/30"
                  >
                    <div className="text-center">
                      <p className="text-6xl mb-4">✉️</p>
                      <p>Select a message to read</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
