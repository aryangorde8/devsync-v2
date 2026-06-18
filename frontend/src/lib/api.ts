/**
 * API Client for DevSync Backend
 * Handles authentication, token refresh, and API requests
 */

// Production API URL for Render backend
const PRODUCTION_API_URL = 'https://devsync-api-25hv.onrender.com/api/v1';
const API_URL = process.env.NEXT_PUBLIC_API_URL || PRODUCTION_API_URL;

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Type definitions
interface TokenPair {
  access: string;
  refresh: string;
}

interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

interface RequestOptions extends RequestInit {
  authenticated?: boolean;
}

// Token management
export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens: (tokens: TokenPair): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  },

  clearTokens: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  isAuthenticated: (): boolean => {
    return !!tokenStorage.getAccessToken();
  },
};

// Refresh access token
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      tokenStorage.clearTokens();
      return null;
    }

    const data = await response.json();
    localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
    return data.access;
  } catch {
    tokenStorage.clearTokens();
    return null;
  }
}

// Check if user is online
function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

// Main API request function
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  // Check network connectivity first
  if (!isOnline()) {
    const error: ApiError = {
      message: 'No internet connection. Please check your network and try again.',
      status: 0,
    };
    throw error;
  }

  const { authenticated = true, ...fetchOptions } = options;

  // Don't set Content-Type for FormData - browser will set it with boundary
  const isFormData = fetchOptions.body instanceof FormData;
  
  const headers: HeadersInit = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...fetchOptions.headers,
  };

  // Add auth header if authenticated
  if (authenticated) {
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    }
  }

  let response: Response;
  
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });
  } catch (networkError) {
    // Network error (DNS failure, CORS blocked, server unreachable, etc.)
    const error: ApiError = {
      message: 'Unable to connect to the server. Please check if the backend is running and try again.',
      status: 0,
    };
    throw error;
  }

  // If 401, try refreshing token
  if (response.status === 401 && authenticated) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
      try {
        response = await fetch(`${API_URL}${endpoint}`, {
          ...fetchOptions,
          headers,
        });
      } catch (networkError) {
        const error: ApiError = {
          message: 'Unable to connect to the server. Please check if the backend is running and try again.',
          status: 0,
        };
        throw error;
      }
    } else {
      // Token refresh failed - redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login?session_expired=true';
      }
      const error: ApiError = {
        message: 'Your session has expired. Please log in again.',
        status: 401,
      };
      throw error;
    }
  }

  // Parse response
  let data;
  try {
    data = response.status !== 204 ? await response.json() : null;
  } catch {
    // Response wasn't JSON
    data = null;
  }

  if (!response.ok) {
    // Extract error message safely
    let errorMessage = getErrorMessage(response.status);
    if (data) {
      if (typeof data.detail === 'string') {
        errorMessage = data.detail;
      } else if (typeof data.message === 'string') {
        errorMessage = data.message;
      } else if (typeof data.error === 'string') {
        errorMessage = data.error;
      } else if (data.error && typeof data.error.message === 'string') {
        errorMessage = data.error.message;
      }
    }
    
    const error: ApiError = {
      message: errorMessage,
      status: response.status,
      errors: data?.errors,
    };
    throw error;
  }

  return data as T;
}

// Get user-friendly error messages based on HTTP status
function getErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'A conflict occurred. Please try again.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Please try again later.';
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

// Helper to prepare request body
function prepareBody(body: unknown): BodyInit | undefined {
  if (!body) return undefined;
  if (body instanceof FormData) return body;
  return JSON.stringify(body);
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: prepareBody(body),
      // Don't set Content-Type for FormData - browser will set it with boundary
      headers: body instanceof FormData ? undefined : options?.headers,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: prepareBody(body),
      headers: body instanceof FormData ? undefined : options?.headers,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: prepareBody(body),
      headers: body instanceof FormData ? undefined : options?.headers,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
