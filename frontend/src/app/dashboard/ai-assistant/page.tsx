'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { gsap } from '@/lib/gsap';
import aiApi, { 
  AIMessage, 
  AIConversationListItem, 
  AIStatus, 
  PortfolioAnalysis,
  AIServiceError,
  AIUnavailableError,
  AITimeoutError
} from '@/lib/ai';

// ================== Constants ==================
const MAX_MESSAGE_LENGTH = 10000;
const DEBOUNCE_DELAY = 300; // ms

// ================== Utility Hooks ==================

/**
 * Debounce hook for input handling
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof AIUnavailableError) {
    return 'AI service is not available. Please ensure the AI backend is running.';
  }
  if (error instanceof AITimeoutError) {
    return 'Request timed out. The AI might be processing a complex request. Please try again.';
  }
  if (error instanceof AIServiceError) {
    return error.detail || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  // Handle plain objects with error/message properties
  if (error && typeof error === 'object') {
    const obj = error as Record<string, unknown>;
    // Check for nested error object (common API format)
    if (obj.error && typeof obj.error === 'object') {
      const nested = obj.error as Record<string, unknown>;
      if (typeof nested.message === 'string') return nested.message;
      if (typeof nested.detail === 'string') return nested.detail;
    }
    if (typeof obj.error === 'string') return obj.error;
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.detail === 'string') return obj.detail;
    // Try JSON stringify as last resort but limit length
    try {
      const jsonStr = JSON.stringify(obj);
      if (jsonStr.length < 200) return jsonStr;
    } catch {
      // Ignore stringify errors
    }
  }
  // Fallback for any other type
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred. Please try again.';
}

// Portfolio Analysis Card
function AnalysisCard({ analysis, colors, onAskAI, onRefresh, isRefreshing }: { 
  analysis: PortfolioAnalysis; 
  colors: { primary: string; secondary: string };
  onAskAI: (question: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}) {
  const scoreColor = analysis.completeness_score >= 80 
    ? 'text-emerald-400' 
    : analysis.completeness_score >= 50 
      ? 'text-amber-400' 
      : 'text-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
      <div className="relative rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 transition-all duration-300 group-hover:bg-white/[0.05]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">Portfolio Analysis</h3>
            {onRefresh && (
              <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-2 hover:bg-white/[0.05] rounded-xl transition-colors disabled:opacity-50"
                title="Refresh analysis"
              >
                <svg 
                  className={`w-4 h-4 text-white/50 ${isRefreshing ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </motion.button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/50">Completeness:</span>
            <span className={`text-2xl font-bold ${scoreColor}`}>
              {analysis.completeness_score}%
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/[0.05] rounded-full h-2 mb-4 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${analysis.completeness_score}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500"
          />
        </div>

        {/* Issues */}
        {analysis.issues.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Issues to Fix ({analysis.issues.length})
            </h4>
            <div className="space-y-2">
              {analysis.issues.slice(0, 3).map((issue, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-sm text-white/70 bg-red-500/10 border border-red-500/20 rounded-xl p-3 cursor-pointer hover:bg-red-500/20 transition-colors"
                  onClick={() => onAskAI(`How can I fix this issue: ${issue}`)}
                >
                  {issue}
                </motion.div>
              ))}
              {analysis.issues.length > 3 && (
                <p className="text-xs text-white/40">+{analysis.issues.length - 3} more issues</p>
              )}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {analysis.suggestions.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Suggestions ({analysis.suggestions.length})
            </h4>
            <div className="space-y-2">
              {analysis.suggestions.slice(0, 3).map((suggestion, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-sm text-white/70 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 cursor-pointer hover:bg-amber-500/20 transition-colors"
                  onClick={() => onAskAI(`Tell me more about: ${suggestion}`)}
                >
                  {suggestion}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        {analysis.strengths.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-emerald-400 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Strengths ({analysis.strengths.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.strengths.slice(0, 5).map((strength, i) => (
                <motion.span 
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1"
                >
                  ✓ {strength}
                </motion.span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Message component
function ChatMessage({ message, colors }: { message: AIMessage; colors: { primary: string; secondary: string } }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-gradient-to-r text-white'
            : 'bg-white/[0.05] backdrop-blur-sm border border-white/[0.08] text-white'
        }`}
        style={isUser ? { background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` } : {}}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                 style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
              AI
            </div>
            <span className="text-xs text-white/50">DevSync AI</span>
          </div>
        )}
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {message.content}
        </div>
        <div className={`text-xs mt-2 ${isUser ? 'text-white/60' : 'text-white/40'}`}>
          {formatDate(message.created_at)}
        </div>
      </div>
    </motion.div>
  );
}

// Typing indicator
function TypingIndicator({ colors }: { colors: { primary: string } }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start mb-4"
    >
      <div className="bg-white/[0.05] backdrop-blur-sm border border-white/[0.08] rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
               style={{ background: colors.primary }}>
            AI
          </div>
          <span className="text-xs text-white/50">DevSync AI</span>
        </div>
        <div className="flex gap-1">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
            className="w-2 h-2 rounded-full bg-white/50"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
            className="w-2 h-2 rounded-full bg-white/50"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
            className="w-2 h-2 rounded-full bg-white/50"
          />
        </div>
      </div>
    </motion.div>
  );
}

// Conversation sidebar item
function ConversationItem({
  conversation,
  isActive,
  onClick,
  onDelete,
  colors,
}: {
  conversation: AIConversationListItem;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  colors: { primary: string };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4 }}
      onClick={onClick}
      className={`p-3 rounded-xl cursor-pointer transition-colors group ${
        isActive ? 'bg-white/[0.08]' : 'hover:bg-white/[0.05]'
      }`}
      style={isActive ? { borderLeft: `3px solid ${colors.primary}` } : { borderLeft: '3px solid transparent' }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{conversation.title || 'New Conversation'}</p>
          {conversation.last_message && (
            <p className="text-xs text-white/50 truncate mt-1">
              {conversation.last_message.content}
            </p>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-red-400 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </motion.button>
      </div>
      <p className="text-xs text-white/30 mt-1">{formatDate(conversation.updated_at)}</p>
    </motion.div>
  );
}

// Suggestion chip
function SuggestionChip({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="px-4 py-2 bg-white/[0.05] backdrop-blur-sm border border-white/[0.08] hover:bg-white/[0.08] rounded-full text-sm text-white/70 hover:text-white transition-colors"
    >
      {text}
    </motion.button>
  );
}

export default function AIAssistantPage() {
  const { colors } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [conversations, setConversations] = useState<AIConversationListItem[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);
  const [includePortfolio, setIncludePortfolio] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRefreshingAnalysis, setIsRefreshingAnalysis] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
  }, []);
  
  // Safe error setter - always ensures string
  const setError = useCallback((err: unknown) => {
    if (err === null) {
      setErrorState(null);
    } else if (typeof err === 'string') {
      setErrorState(err);
    } else {
      setErrorState(getErrorMessage(err));
    }
  }, []);
  
  // Track character count
  const charCount = inputValue.length;
  const isOverLimit = charCount > MAX_MESSAGE_LENGTH;

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load AI status, conversations, and analysis
  useEffect(() => {
    let mounted = true;
    
    async function loadData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Load in parallel for better performance
        const [statusData, convData, analysisData] = await Promise.all([
          aiApi.getStatus(),
          aiApi.getConversations(),
          aiApi.getAnalysis().catch(() => null), // Don't fail on analysis error
        ]);
        
        if (!mounted) return;
        
        setStatus(statusData);
        setConversations(convData);
        if (analysisData) {
          setAnalysis(analysisData);
        }
        
        // Show warning if AI is not available
        if (!statusData.available) {
          setError('AI service is not available. Please ensure Ollama is running.');
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Failed to load AI data:', err);
        console.error('Error type:', typeof err);
        console.error('Error stringified:', JSON.stringify(err, null, 2));
        const errorMsg = getErrorMessage(err);
        console.error('Extracted error message:', errorMsg);
        setError(errorMsg);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    
    loadData();
    
    // Cleanup
    return () => {
      mounted = false;
    };
  }, []);

  // Load conversation messages
  const loadConversation = useCallback(async (id: number) => {
    try {
      setError(null);
      const conv = await aiApi.getConversation(id);
      setMessages(conv.messages);
      setCurrentConversationId(id);
    } catch (err) {
      console.error('Failed to load conversation:', err);
      setError(getErrorMessage(err));
    }
  }, []);

  // Start new conversation
  const handleNewConversation = useCallback(() => {
    setCurrentConversationId(null);
    setMessages([]);
    setInputValue('');
    setError(null);
    inputRef.current?.focus();
  }, []);

  // Delete conversation
  const handleDeleteConversation = useCallback(async (id: number) => {
    try {
      await aiApi.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConversationId === id) {
        handleNewConversation();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      setError(getErrorMessage(err));
    }
  }, [currentConversationId, handleNewConversation]);

  // Refresh portfolio analysis
  const handleRefreshAnalysis = useCallback(async () => {
    setIsRefreshingAnalysis(true);
    try {
      const newAnalysis = await aiApi.refreshAnalysis();
      setAnalysis(newAnalysis);
    } catch (err) {
      console.error('Failed to refresh analysis:', err);
      // Don't show error for refresh, just keep old data
    } finally {
      setIsRefreshingAnalysis(false);
    }
  }, []);

  // Send message with improved error handling
  const handleSendMessage = useCallback(async () => {
    const messageText = inputValue.trim();
    
    // Validation
    if (!messageText || isSending) return;
    if (messageText.length > MAX_MESSAGE_LENGTH) {
      setError(`Message too long (${messageText.length}/${MAX_MESSAGE_LENGTH} characters)`);
      return;
    }

    setInputValue('');
    setIsSending(true);
    setError(null);

    // Optimistically add user message
    const tempUserMessage: AIMessage = {
      id: Date.now(),
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await aiApi.sendMessage({
        message: messageText,
        conversation_id: currentConversationId,
        include_portfolio_context: includePortfolio,
      });

      // Update conversation ID if new
      if (!currentConversationId) {
        setCurrentConversationId(response.conversation_id);
        // Reload conversations list
        const convData = await aiApi.getConversations();
        setConversations(convData);
      }

      // Add AI response
      const aiMessage: AIMessage = {
        id: response.message_id,
        role: 'assistant',
        content: response.response,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(getErrorMessage(err));
      // Remove the optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
      // Restore the input so user can retry
      setInputValue(messageText);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [inputValue, isSending, currentConversationId, includePortfolio]);

  // Handle Enter key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Dynamic suggestions based on analysis - memoized for performance
  const suggestions = useMemo(() => {
    const baseSuggestions = [
      'Review my complete portfolio',
      'What skills should I learn next?',
    ];
    
    if (analysis) {
      if (analysis.issues.some(i => i.toLowerCase().includes('profile picture'))) {
        baseSuggestions.unshift('Tips for a professional profile photo');
      }
      if (analysis.issues.some(i => i.toLowerCase().includes('bio'))) {
        baseSuggestions.push('Help me write a compelling bio');
      }
      if (analysis.issues.some(i => i.toLowerCase().includes('project'))) {
        baseSuggestions.push('How to showcase projects better');
      }
      if (analysis.issues.some(i => i.toLowerCase().includes('certification'))) {
        baseSuggestions.push('Which certifications are worth getting?');
      }
    }
    
    return baseSuggestions.slice(0, 4);
  }, [analysis]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30 animate-ping" />
            <div className="absolute inset-0 rounded-full border-2 border-t-indigo-500 border-r-cyan-500 border-b-transparent border-l-transparent animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-t-transparent border-r-transparent border-b-cyan-500 border-l-indigo-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <p className="mt-6 text-white/50">Loading AI Assistant...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex h-[calc(100vh-80px)] rounded-2xl overflow-hidden border border-white/[0.08]">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="floating-particle absolute w-1 h-1 rounded-full bg-indigo-400/30"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
          />
        ))}
      </div>
      
      {/* Sidebar */}
      <motion.div
        animate={{ width: isSidebarOpen ? 288 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="relative bg-white/[0.02] border-r border-white/[0.08] overflow-hidden"
      >
        <div className="p-4 h-full flex flex-col w-72">
          {/* New Chat Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNewConversation}
            className="w-full px-4 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </motion.button>

          {/* Conversations List */}
          <div className="mt-4 flex-1 overflow-y-auto space-y-2">
            <p className="text-xs text-white/40 uppercase tracking-wider px-2 mb-2">
              Recent Conversations
            </p>
            {conversations.length === 0 ? (
              <p className="text-sm text-white/30 text-center py-4">No conversations yet</p>
            ) : (
              <AnimatePresence>
                {conversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === currentConversationId}
                    onClick={() => loadConversation(conv.id)}
                    onDelete={() => handleDeleteConversation(conv.id)}
                    colors={colors}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* AI Status */}
          <div className="mt-4 p-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  status?.available ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-red-500'
                }`}
              />
              <span className="text-xs text-white/50">
                {status?.available ? 'AI Online' : 'AI Offline'}
              </span>
            </div>
            {status?.model && (
              <p className="text-xs text-white/30 mt-1">Model: {status.model}</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Chat Area */}
      <div className="relative flex-1 flex flex-col">
        {/* Header */}
        <div className="relative px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02] backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/[0.05] rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </motion.button>
            <div>
              <h1 className="text-lg font-semibold text-white">AI Assistant</h1>
              <p className="text-xs text-white/40">Powered by Google Gemini 2.5 Flash</p>
            </div>
          </div>

          {/* Portfolio Context Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-white/50">Include portfolio context</span>
            <button
              type="button"
              onClick={() => setIncludePortfolio(!includePortfolio)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
                includePortfolio ? 'bg-gradient-to-r from-indigo-500 to-cyan-500' : 'bg-white/10'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-300 ${
                  includePortfolio ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </label>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              {/* Portfolio Analysis Card */}
              {analysis && (
                <div className="w-full max-w-2xl mb-6">
                  <AnalysisCard 
                    analysis={analysis} 
                    colors={colors}
                    onAskAI={(question) => {
                      setInputValue(question);
                      inputRef.current?.focus();
                    }}
                    onRefresh={handleRefreshAnalysis}
                    isRefreshing={isRefreshingAnalysis}
                  />
                </div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-white/[0.08]">
                  <svg
                    className="w-8 h-8 text-indigo-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">How can I help you today?</h2>
                <p className="text-white/50 mb-4 max-w-md text-sm">
                  Click on any issue above or ask me anything about your portfolio!
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                  {suggestions.map((suggestion, i) => (
                    <motion.div
                      key={suggestion}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <SuggestionChip
                        text={suggestion}
                        onClick={() => {
                          setInputValue(suggestion);
                          inputRef.current?.focus();
                        }}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            <>
              <AnimatePresence>
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} colors={colors} />
                ))}
              </AnimatePresence>
              {isSending && <TypingIndicator colors={colors} />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mx-6 mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{typeof error === 'string' ? error : 'An error occurred. Please try again.'}</span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setError(null)}
                className="ml-auto hover:text-red-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="p-4 border-t border-white/[0.08] bg-white/[0.02] backdrop-blur-sm">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={status?.available ? 'Type your message...' : 'AI service is not available'}
                disabled={!status?.available || isSending}
                rows={1}
                className={`w-full px-4 py-3 bg-white/[0.05] backdrop-blur-sm border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                  isOverLimit ? 'border-red-500' : 'border-white/[0.08] focus:border-indigo-500/50'
                }`}
                style={{ 
                  minHeight: '48px', 
                  maxHeight: '200px',
                }}
              />
              {/* Character count */}
              <div className={`absolute right-3 bottom-3 text-xs ${
                isOverLimit ? 'text-red-400' : charCount > MAX_MESSAGE_LENGTH * 0.9 ? 'text-amber-400' : 'text-white/30'
              }`}>
                {charCount > 0 && `${charCount}/${MAX_MESSAGE_LENGTH}`}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || !status?.available || isSending || isOverLimit}
              className="p-3 rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-indigo-500 to-cyan-500 hover:shadow-lg hover:shadow-indigo-500/30"
            >
              {isSending ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </motion.button>
          </div>
          <p className="text-xs text-white/30 mt-2 text-center">
            AI runs locally on your machine • No data sent to external servers • Completely free
          </p>
        </div>
      </div>
    </div>
  );
}
