'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'message';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    href: string;
  };
  sender?: {
    name: string;
    avatar?: string;
  };
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
  isConnected: boolean;
  requestPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: React.ReactNode;
  websocketUrl?: string;
}

export function NotificationProvider({ children, websocketUrl }: NotificationProviderProps) {
  // Load initial notifications from localStorage using initializer
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('notifications');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.map((n: AppNotification) => ({
            ...n,
            timestamp: new Date(n.timestamp),
          }));
        } catch (e) {
          console.error('Failed to parse stored notifications:', e);
        }
      }
    }
    return [];
  });
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Add notification handler - defined before WebSocket effect
  const addNotification = useCallback((notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: AppNotification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Keep last 50
  }, []);

  // WebSocket connection
  useEffect(() => {
    if (!websocketUrl) return;

    const connect = () => {
      try {
        const ws = new WebSocket(websocketUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[Notifications] WebSocket connected');
          setIsConnected(true);
          reconnectAttempts.current = 0;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'notification') {
              addNotification(data.notification);
              
              // Show browser notification if permitted
              if (Notification.permission === 'granted') {
                new Notification(data.notification.title, {
                  body: data.notification.message,
                  icon: '/icons/icon-192x192.png',
                });
              }
            }
          } catch (e) {
            console.error('[Notifications] Failed to parse message:', e);
          }
        };

        ws.onclose = () => {
          console.log('[Notifications] WebSocket disconnected');
          setIsConnected(false);
          
          // Reconnect with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        };

        ws.onerror = (error) => {
          console.error('[Notifications] WebSocket error:', error);
        };
      } catch (error) {
        console.error('[Notifications] Failed to connect:', error);
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [websocketUrl, addNotification]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAll,
        isConnected,
        requestPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// Notification Center Component
interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification, clearAll } = useNotifications();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-16 right-4 w-96 max-h-[80vh] bg-card rounded-xl shadow-2xl border border-outline z-50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-outline flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-on-surface">Notifications</h2>
            {unreadCount > 0 && (
              <p className="text-sm text-on-surface-secondary">{unreadCount} unread</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-sm text-on-surface-secondary hover:text-on-surface-secondary"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-surface-tertiary rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-on-surface-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-on-surface font-medium mb-1">No notifications</h3>
              <p className="text-sm text-on-surface-secondary">You&apos;re all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-outline">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={() => markAsRead(notification.id)}
                  onClear={() => clearNotification(notification.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Individual notification item
interface NotificationItemProps {
  notification: AppNotification;
  onRead: () => void;
  onClear: () => void;
}

function NotificationItem({ notification, onRead, onClear }: NotificationItemProps) {
  const iconMap = {
    info: (
      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    message: notification.sender?.avatar ? (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={notification.sender.avatar}
        alt={notification.sender.name}
        className="w-8 h-8 rounded-full"
      />
    ) : (
      <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-medium">
        {notification.sender?.name?.charAt(0) || 'U'}
      </div>
    ),
  };

  const timeAgo = getTimeAgo(notification.timestamp);

  return (
    <div
      className={`p-4 hover:bg-surface-hover transition-colors cursor-pointer ${
        !notification.read ? 'bg-purple-500/5' : ''
      }`}
      onClick={onRead}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            notification.type !== 'message' ? 'bg-surface-tertiary' : ''
          }`}>
            {iconMap[notification.type]}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className={`text-sm font-medium ${notification.read ? 'text-on-surface-secondary' : 'text-on-surface'}`}>
                {notification.title}
              </h4>
              <p className="text-sm text-on-surface-secondary line-clamp-2">{notification.message}</p>
            </div>
            {!notification.read && (
              <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-1.5" />
            )}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-on-surface-tertiary">{timeAgo}</span>
            {notification.action && (
              <a
                href={notification.action.href}
                className="text-xs text-purple-400 hover:text-purple-300"
                onClick={(e) => e.stopPropagation()}
              >
                {notification.action.label}
              </a>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="text-xs text-on-surface-tertiary hover:text-on-surface-secondary ml-auto"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Notification bell button
interface NotificationBellProps {
  onClick: () => void;
}

export function NotificationBell({ onClick }: NotificationBellProps) {
  const { unreadCount } = useNotifications();

  return (
    <button
      onClick={onClick}
      className="relative p-2 text-on-surface-secondary hover:text-on-surface hover:bg-surface-tertiary rounded-lg transition-colors"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}

// Helper function
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default NotificationProvider;
