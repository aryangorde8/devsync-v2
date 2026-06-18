/**
 * AI Assistant API Client
 * Handles chat with local Ollama AI
 * 
 * Production-Ready Features:
 * - Retry logic with exponential backoff
 * - Request timeout handling
 * - Error classification
 * - Response validation
 */

import api from './api';

// ================== Constants ==================
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 120000; // 2 minutes for AI responses

// ================== Types ==================
export interface AIMessage {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface AIConversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  messages: AIMessage[];
  message_count: number;
}

export interface AIConversationListItem {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message?: {
    role: string;
    content: string;
    created_at: string;
  };
}

export interface AIStatus {
  available: boolean;
  model: string;
  models: string[];
  response_time_ms?: number;
  error?: string;
}

export interface ChatResponse {
  response: string;
  conversation_id: number;
  message_id: number;
}

export interface ChatInput {
  message: string;
  conversation_id?: number | null;
  include_portfolio_context?: boolean;
}

export interface PortfolioAnalysis {
  completeness_score: number;
  issues: string[];
  suggestions: string[];
  strengths: string[];
  response_time_ms?: number;
}

export interface AIError {
  error: string;
  detail?: string;
  code?: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    ollama?: { status: string; model?: string; url?: string; error?: string };
    cache?: { status: string; error?: string };
  };
}

// ================== Error Classes ==================
export class AIServiceError extends Error {
  code: string;
  detail?: string;
  
  constructor(message: string, code: string = 'ai_error', detail?: string) {
    super(message);
    this.name = 'AIServiceError';
    this.code = code;
    this.detail = detail;
  }
}

export class AIUnavailableError extends AIServiceError {
  constructor(detail?: string) {
    super('AI service is not available', 'ai_unavailable', detail);
    this.name = 'AIUnavailableError';
  }
}

export class AITimeoutError extends AIServiceError {
  constructor(detail?: string) {
    super('AI request timed out', 'ai_timeout', detail);
    this.name = 'AITimeoutError';
  }
}

// ================== Utility Functions ==================

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  baseDelay: number = RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on client errors (4xx) or AI unavailable
      if (error instanceof AIUnavailableError || 
          (error instanceof AIServiceError && error.code === 'ai_model_error')) {
        throw error;
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries - 1) {
        break;
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await sleep(delay);
    }
  }
  
  throw lastError || new Error('Request failed after retries');
}

/**
 * Parse API error response
 */
function parseErrorResponse(error: unknown): AIServiceError {
  if (error instanceof AIServiceError) {
    return error;
  }
  
  // Handle axios/fetch error responses
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    
    // Check for response data
    const data = err.response && typeof err.response === 'object' 
      ? (err.response as Record<string, unknown>).data as AIError | undefined
      : err.data as AIError | undefined;
    
    if (data) {
      const code = data.code || 'unknown_error';
      
      switch (code) {
        case 'ai_unavailable':
          return new AIUnavailableError(data.detail);
        case 'ai_timeout':
          return new AITimeoutError(data.detail);
        default:
          return new AIServiceError(
            data.error || 'An error occurred',
            code,
            data.detail
          );
      }
    }
    
    // Check for network errors
    if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
      return new AIUnavailableError('Cannot connect to server');
    }
    
    // Check for timeout
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return new AITimeoutError('Request timed out');
    }
    
    // Generic error with message
    if ('message' in err && typeof err.message === 'string') {
      return new AIServiceError(err.message);
    }
  }
  
  return new AIServiceError('An unexpected error occurred');
}

// ================== API Functions ==================
export const aiApi = {
  /**
   * Check if AI service is available
   * Cached on server for 30 seconds
   */
  getStatus: async (): Promise<AIStatus> => {
    try {
      return await api.get<AIStatus>('/ai/chat/status/');
    } catch (error) {
      console.error('AI status check failed:', error);
      return {
        available: false,
        model: 'unknown',
        models: [],
        error: 'Failed to check AI status'
      };
    }
  },

  /**
   * Get portfolio analysis
   * Cached on server for 5 minutes
   */
  getAnalysis: async (): Promise<PortfolioAnalysis> => {
    try {
      return await withRetry(() => api.get<PortfolioAnalysis>('/ai/chat/analyze/'));
    } catch (error) {
      throw parseErrorResponse(error);
    }
  },

  /**
   * Force refresh portfolio analysis (bypasses cache)
   */
  refreshAnalysis: async (): Promise<PortfolioAnalysis> => {
    try {
      return await api.post<PortfolioAnalysis>('/ai/chat/refresh_analysis/');
    } catch (error) {
      throw parseErrorResponse(error);
    }
  },

  /**
   * Get all conversations for the current user
   */
  getConversations: async (): Promise<AIConversationListItem[]> => {
    try {
      return await api.get<AIConversationListItem[]>('/ai/conversations/');
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      return [];
    }
  },

  /**
   * Get a specific conversation with messages
   */
  getConversation: async (id: number): Promise<AIConversation> => {
    try {
      return await api.get<AIConversation>(`/ai/conversations/${id}/`);
    } catch (error) {
      throw parseErrorResponse(error);
    }
  },

  /**
   * Delete a conversation
   */
  deleteConversation: async (id: number): Promise<void> => {
    try {
      await api.delete(`/ai/conversations/${id}/`);
    } catch (error) {
      throw parseErrorResponse(error);
    }
  },

  /**
   * Send a chat message and get AI response
   * Has retry logic for transient failures
   */
  sendMessage: async (input: ChatInput): Promise<ChatResponse> => {
    // Validate input
    if (!input.message || input.message.trim().length === 0) {
      throw new AIServiceError('Message cannot be empty', 'validation_error');
    }
    
    if (input.message.length > 10000) {
      throw new AIServiceError('Message too long (max 10000 characters)', 'validation_error');
    }
    
    try {
      // Only retry once for chat messages (user might send duplicate)
      return await withRetry(
        () => api.post<ChatResponse>('/ai/chat/send/', input),
        2 // Max 2 attempts
      );
    } catch (error) {
      throw parseErrorResponse(error);
    }
  },

  /**
   * Create a new conversation
   */
  createConversation: async (title?: string): Promise<AIConversation> => {
    try {
      return await api.post<AIConversation>('/ai/conversations/', { title: title || '' });
    } catch (error) {
      throw parseErrorResponse(error);
    }
  },

  /**
   * Health check for monitoring
   */
  getHealth: async (): Promise<HealthStatus> => {
    try {
      return await api.get<HealthStatus>('/ai/chat/health/');
    } catch (error) {
      return {
        status: 'unhealthy',
        components: {
          ollama: { status: 'unknown', error: 'Failed to check health' }
        }
      };
    }
  },
};

export default aiApi;
