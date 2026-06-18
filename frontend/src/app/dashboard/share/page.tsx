'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function SharePage() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchQRCode();
    // Get username from profile
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get<{ email: string }>('/auth/profile/');
      const username = response.email.split('@')[0];
      setPortfolioUrl(`${window.location.origin}/portfolio/${username}`);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchQRCode = async () => {
    setIsLoading(true);
    try {
      // Fetch QR code as blob using fetch API directly
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://devsync-api-25hv.onrender.com/api/v1'}/portfolio/qr-code/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (!response.ok) {
        console.error('QR code fetch failed:', response.status, response.statusText);
        setQrCodeUrl(null);
        return;
      }
      
      const blob = await response.blob();
      
      // Verify it's actually an image
      if (!blob.type.startsWith('image/')) {
        console.error('QR code response is not an image:', blob.type);
        setQrCodeUrl(null);
        return;
      }
      
      const url = URL.createObjectURL(blob);
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Failed to fetch QR code:', error);
      setQrCodeUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = 'portfolio-qr-code.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(portfolioUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareOptions = [
    {
      name: 'Twitter',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      color: 'bg-card hover:bg-surface-tertiary',
      url: `https://twitter.com/intent/tweet?text=Check out my portfolio!&url=${encodeURIComponent(portfolioUrl)}`,
    },
    {
      name: 'LinkedIn',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      color: 'bg-blue-600 hover:bg-blue-700',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(portfolioUrl)}`,
    },
    {
      name: 'Facebook',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      color: 'bg-blue-500 hover:bg-blue-600',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(portfolioUrl)}`,
    },
    {
      name: 'WhatsApp',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      color: 'bg-green-500 hover:bg-green-600',
      url: `https://wa.me/?text=${encodeURIComponent(`Check out my portfolio: ${portfolioUrl}`)}`,
    },
    {
      name: 'Email',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: 'bg-surface-active hover:bg-surface-active',
      url: `mailto:?subject=Check out my portfolio&body=${encodeURIComponent(portfolioUrl)}`,
    },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-on-surface">Share Your Portfolio</h1>
          <p className="text-on-surface-secondary mt-2">
            Share your portfolio with potential employers and clients
          </p>
        </div>

        {/* QR Code Card */}
        <div className="bg-card rounded-xl p-8 border border-outline text-center mb-8">
          <h2 className="text-lg font-semibold text-on-surface mb-4">Portfolio QR Code</h2>
          
          <div className="inline-block bg-white p-4 rounded-xl mb-4">
            {isLoading ? (
              <div className="w-48 h-48 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
              </div>
            ) : qrCodeUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={qrCodeUrl}
                alt="Portfolio QR Code"
                className="w-48 h-48"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-on-surface-secondary">
                Failed to load QR code
              </div>
            )}
          </div>

          <p className="text-sm text-on-surface-secondary mb-4">
            Scan this QR code to view your portfolio
          </p>

          <button
            onClick={downloadQRCode}
            disabled={!qrCodeUrl}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-surface-tertiary text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download QR Code
          </button>
        </div>

        {/* Direct Link */}
        <div className="bg-card rounded-xl p-6 border border-outline mb-8">
          <h2 className="text-lg font-semibold text-on-surface mb-4">Direct Link</h2>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={portfolioUrl}
              readOnly
              className="flex-1 px-4 py-3 bg-background border border-outline rounded-lg text-on-surface"
            />
            <button
              onClick={copyToClipboard}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-surface-tertiary hover:bg-surface-active text-on-surface'
              }`}
            >
              {copied ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Social Sharing */}
        <div className="bg-card rounded-xl p-6 border border-outline">
          <h2 className="text-lg font-semibold text-on-surface mb-4">Share on Social Media</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {shareOptions.map((option) => (
              <a
                key={option.name}
                href={option.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-on-surface font-medium transition-colors ${option.color}`}
              >
                {option.icon}
                {option.name}
              </a>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-purple-500/10 rounded-xl p-6 border border-purple-500/20">
          <h3 className="flex items-center gap-2 text-purple-400 font-medium mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Tips for sharing
          </h3>
          <ul className="text-sm text-on-surface-secondary space-y-2">
            <li>• Add the QR code to your business card or resume</li>
            <li>• Include the link in your email signature</li>
            <li>• Share on LinkedIn to increase visibility</li>
            <li>• Add it to your GitHub profile README</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
