/**
 * Auth API Services
 */

import { api, tokenStorage } from './api';

// Types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  title: string | null;
  bio: string | null;
  github_username: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  avatar: string | null;
  profile_picture: string | null;
  username: string | null;
  is_active: boolean;
  is_verified: boolean;
  date_joined: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  title?: string;
  bio?: string;
  github_username?: string;
  linkedin_url?: string;
  portfolio_url?: string;
}

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

// Auth Service
export const authService = {
  /**
   * Login user and store tokens
   */
  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>('/auth/login/', credentials, {
      authenticated: false,
    });
    tokenStorage.setTokens(response);
    return response;
  },

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<User> {
    return api.post<User>('/auth/register/', data, {
      authenticated: false,
    });
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await api.post('/auth/logout/', { refresh: refreshToken });
      } catch {
        // Ignore errors on logout
      }
    }
    tokenStorage.clearTokens();
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    return api.get<User>('/auth/profile/');
  },

  /**
   * Update user profile
   */
  async updateProfile(data: ProfileUpdateData): Promise<User> {
    return api.patch<User>('/auth/profile/', data);
  },

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordData): Promise<void> {
    return api.post('/auth/change-password/', data);
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return tokenStorage.isAuthenticated();
  },
};

export default authService;
