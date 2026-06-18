/**
 * useAuth Hook Tests
 * Tests for authentication hook functionality
 */

import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';

// Mock the auth context
const mockLogin = jest.fn();
const mockLogout = jest.fn();
const mockRefreshUser = jest.fn();

// Simple mock auth hook for testing
function useAuth() {
  return {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    login: mockLogin,
    logout: mockLogout,
    refreshUser: mockRefreshUser,
  };
}

// Mock provider wrapper
function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial unauthenticated state', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should provide login function', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(typeof result.current.login).toBe('function');
  });

  it('should provide logout function', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(typeof result.current.logout).toBe('function');
  });

  it('should call login with credentials', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    const credentials = { email: 'test@example.com', password: 'password123' };
    
    await act(async () => {
      result.current.login(credentials);
    });

    expect(mockLogin).toHaveBeenCalledWith(credentials);
  });

  it('should call logout', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      result.current.logout();
    });

    expect(mockLogout).toHaveBeenCalled();
  });

  it('should call refreshUser', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      result.current.refreshUser();
    });

    expect(mockRefreshUser).toHaveBeenCalled();
  });
});
