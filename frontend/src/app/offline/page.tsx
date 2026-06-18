'use client';

import React, { useEffect, useState } from 'react';

export default function OfflinePage() {
  // Initialize with navigator.onLine value
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return false;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-redirect when back online
  useEffect(() => {
    if (isOnline) {
      window.location.href = '/dashboard';
    }
  }, [isOnline]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Animated offline icon */}
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto relative">
            {/* Outer ring animation */}
            <div className="absolute inset-0 rounded-full border-4 border-outline animate-pulse" />
            
            {/* Inner content */}
            <div className="absolute inset-2 bg-card rounded-full flex items-center justify-center">
              <svg 
                className="w-16 h-16 text-on-surface-tertiary" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" 
                />
              </svg>
            </div>
          </div>
          
          {/* Floating particles */}
          <div className="absolute top-0 left-1/4 w-2 h-2 bg-purple-500/30 rounded-full animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-cyan-500/30 rounded-full animate-float" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-blue-500/30 rounded-full animate-float" style={{ animationDelay: '1s' }} />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-on-surface mb-4">
          You&apos;re Offline
        </h1>

        {/* Description */}
        <p className="text-on-surface-secondary mb-8 leading-relaxed">
          It looks like you&apos;ve lost your internet connection. 
          Don&apos;t worry, we&apos;ll automatically reconnect when you&apos;re back online.
        </p>

        {/* Status indicator */}
        <div className="inline-flex items-center gap-3 px-4 py-3 bg-card rounded-full mb-8">
          <div className="relative">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            <div className={`absolute inset-0 w-3 h-3 rounded-full animate-ping ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
          <span className="text-sm text-on-surface-secondary">
            {isOnline ? 'Back online! Redirecting...' : 'Waiting for connection...'}
          </span>
        </div>

        {/* What you can do */}
        <div className="bg-card rounded-xl p-6 text-left mb-6">
          <h2 className="text-on-surface font-semibold mb-4">While you wait, you can:</h2>
          <ul className="space-y-3 text-on-surface-secondary text-sm">
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-purple-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Check your WiFi or mobile data connection
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-purple-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Try moving to a location with better signal
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-purple-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Restart your router if you&apos;re on WiFi
            </li>
          </ul>
        </div>

        {/* Retry button */}
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-medium rounded-lg transition-all hover:scale-105"
        >
          Try Again
        </button>

        {/* Footer */}
        <p className="mt-8 text-xs text-on-surface-tertiary">
          DevSync works offline for cached content. Install the app for better offline support.
        </p>
      </div>

      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
