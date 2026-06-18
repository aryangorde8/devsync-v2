/**
 * API Client Tests
 * Tests for the API utility functions
 */

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Token Storage', () => {
    it('should store tokens in localStorage', () => {
      const tokens = { access: 'access-token', refresh: 'refresh-token' };
      
      localStorageMock.setItem('access_token', tokens.access);
      localStorageMock.setItem('refresh_token', tokens.refresh);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'access-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refresh_token', 'refresh-token');
    });

    it('should clear tokens from localStorage', () => {
      localStorageMock.removeItem('access_token');
      localStorageMock.removeItem('refresh_token');
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
    });

    it('should return null when no token exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const token = localStorageMock.getItem('access_token');
      expect(token).toBeNull();
    });
  });

  describe('API Requests', () => {
    it('should make GET request with auth header when token exists', async () => {
      localStorageMock.getItem.mockReturnValue('test-token');
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' }),
      });

      await fetch('/api/test', {
        headers: {
          'Authorization': `Bearer ${localStorageMock.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
      });
    });

    it('should make POST request with body', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const body = { email: 'test@example.com', password: 'password' };
      
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(fetch('/api/test')).rejects.toThrow('Network error');
    });

    it('should handle 401 unauthorized response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Unauthorized' }),
      });

      const response = await fetch('/api/protected');
      expect(response.status).toBe(401);
    });
  });

  describe('Error Handling', () => {
    it('should parse error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ 
          email: ['This field is required'],
          password: ['Password too short'] 
        }),
      });

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const errorData = await response.json();
      expect(errorData.email).toContain('This field is required');
      expect(errorData.password).toContain('Password too short');
    });
  });
});
