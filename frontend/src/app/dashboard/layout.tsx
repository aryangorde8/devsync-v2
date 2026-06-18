'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CommandPalette } from '@/components/CommandPalette';
import { NotificationBell, NotificationCenter } from '@/components/Notifications';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { CardErrorBoundary } from '@/components/ErrorBoundary';
import { NeonRibbonBackground } from '@/components/dashboard/NeonRibbonBackground';
import { gsap, ScrollTrigger, CustomEase } from '@/lib/gsap';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: 'Projects',
    href: '/dashboard/projects',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    name: 'Experience',
    href: '/dashboard/experience',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: 'Education',
    href: '/dashboard/education',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M12 14l9-5-9-5-9 5 9 5z" />
        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
      </svg>
    ),
  },
  {
    name: 'Certifications',
    href: '/dashboard/certifications',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    name: 'Resume',
    href: '/dashboard/resume',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    name: 'Messages',
    href: '/dashboard/messages',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    name: 'Activity',
    href: '/dashboard/activity',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    name: 'AI Assistant',
    href: '/dashboard/ai-assistant',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

// Animated Nav Item Component
function AnimatedNavItem({ 
  item, 
  isActive, 
  onClick, 
  index,
  colors 
}: { 
  item: NavItem; 
  isActive: boolean; 
  onClick: () => void;
  index: number;
  colors: { primary: string; secondary: string };
}) {
  const itemRef = useRef<HTMLAnchorElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!itemRef.current) return;

    // Entrance animation with stagger
    gsap.fromTo(itemRef.current,
      { opacity: 0, x: -20 },
      { 
        opacity: 1, 
        x: 0, 
        duration: 0.5, 
        delay: index * 0.05,
        ease: 'power3.out'
      }
    );
  }, [index]);

  const handleMouseEnter = () => {
    if (!itemRef.current || !glowRef.current) return;
    
    // Glow effect
    gsap.to(glowRef.current, {
      opacity: 0.5,
      scale: 1.1,
      duration: 0.3,
      ease: 'power2.out'
    });

    // Icon animation
    const icon = itemRef.current.querySelector('.nav-icon');
    if (icon) {
      gsap.to(icon, {
        scale: 1.2,
        rotate: 5,
        duration: 0.3,
        ease: 'back.out(2)'
      });
    }

    // Text slide
    const text = itemRef.current.querySelector('.nav-text');
    if (text) {
      gsap.to(text, {
        x: 4,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  };

  const handleMouseLeave = () => {
    if (!itemRef.current || !glowRef.current) return;

    gsap.to(glowRef.current, {
      opacity: 0,
      scale: 1,
      duration: 0.3
    });

    const icon = itemRef.current.querySelector('.nav-icon');
    if (icon) {
      gsap.to(icon, {
        scale: 1,
        rotate: 0,
        duration: 0.3
      });
    }

    const text = itemRef.current.querySelector('.nav-text');
    if (text) {
      gsap.to(text, {
        x: 0,
        duration: 0.3
      });
    }
  };

  return (
    <Link
      ref={itemRef}
      href={item.href}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group overflow-hidden ${
        isActive ? '' : ''
      }`}
      style={isActive ? {
        background: `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}10)`,
        boxShadow: `0 0 20px ${colors.primary}20`,
      } : {}}
    >
      {/* Animated glow background */}
      <div 
        ref={glowRef}
        className="absolute inset-0 rounded-2xl opacity-0 pointer-events-none"
        style={{ 
          background: `linear-gradient(135deg, ${colors.primary}15, ${colors.secondary}10)`,
        }}
      />

      {/* Active indicator line */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
          style={{ background: `linear-gradient(to bottom, ${colors.primary}, ${colors.secondary})` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}

      {/* Icon with glow */}
      <span 
        className={`nav-icon relative z-10 transition-colors duration-200 ${
          isActive ? '' : 'opacity-60 group-hover:opacity-100'
        }`}
        style={isActive ? { color: colors.primary, filter: `drop-shadow(0 0 8px ${colors.primary}60)` } : { color: 'var(--sidebar-text)' }}
      >
        {item.icon}
      </span>

      {/* Text */}
      <span 
        className={`nav-text relative z-10 font-medium text-sm transition-colors duration-200 ${
          isActive ? '' : ''
        }`}
        style={isActive ? { color: colors.primary } : { color: 'var(--sidebar-text)' }}
      >
        {item.name}
      </span>

      {/* Badge */}
      {item.badge && (
        <motion.span 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="ml-auto px-2.5 py-1 text-xs font-bold text-white rounded-full relative z-10"
          style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
        >
          {item.badge}
        </motion.span>
      )}

      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div 
          className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
          style={{
            background: `linear-gradient(90deg, transparent, ${colors.primary}10, transparent)`,
          }}
        />
      </div>
    </Link>
  );
}

// Inner dashboard component that uses theme
function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading, isAuthenticated } = useAuth();
  const { colors } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Register custom ease
  useEffect(() => {
    try {
      CustomEase.create('premium', '0.22, 1, 0.36, 1');
    } catch {
      // Ease may already exist
    }
  }, []);

  // GSAP sidebar animations on mount
  useEffect(() => {
    if (!sidebarRef.current || !logoRef.current) return;

    const ctx = gsap.context(() => {
      // Logo entrance with bounce
      gsap.fromTo(logoRef.current,
        { scale: 0, rotate: -180, opacity: 0 },
        { 
          scale: 1, 
          rotate: 0, 
          opacity: 1, 
          duration: 0.8, 
          ease: 'back.out(1.7)',
          delay: 0.2
        }
      );

      // Floating particles in sidebar
      const particles = document.querySelectorAll('.sidebar-particle');
      particles.forEach((particle, i) => {
        gsap.to(particle, {
          y: 'random(-20, 20)',
          x: 'random(-10, 10)',
          opacity: 'random(0.3, 0.7)',
          duration: 'random(3, 5)',
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.2
        });
      });
    }, sidebarRef);

    return () => ctx.revert();
  }, [isAuthenticated]);

  // Header scroll effect
  useEffect(() => {
    if (!headerRef.current) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (headerRef.current) {
        if (scrollY > 50) {
          gsap.to(headerRef.current, {
            backdropFilter: 'blur(20px)',
            background: 'rgba(10, 10, 15, 0.9)',
            duration: 0.3
          });
        } else {
          gsap.to(headerRef.current, {
            backdropFilter: 'blur(10px)',
            background: 'var(--header)',
            duration: 0.3
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Command palette keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsProfileOpen(false);
    };
    if (isProfileOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isProfileOpen]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div 
            className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: colors.primary, borderTopColor: 'transparent' }}
          ></div>
          <p className="mt-4 text-on-surface-tertiary">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <NeonRibbonBackground />
      {/* Inject theme CSS variables */}
      <style jsx global>{`
        :root {
          --theme-primary: ${colors.primary};
          --theme-secondary: ${colors.secondary};
          --theme-accent: ${colors.accent};
        }
        .theme-primary { color: ${colors.primary}; }
        .theme-bg-primary { background-color: ${colors.primary}; }
        .theme-bg-primary-10 { background-color: ${colors.primary}1a; }
        .theme-border-primary { border-color: ${colors.primary}; }
        .theme-gradient { background: linear-gradient(to right, ${colors.primary}, ${colors.secondary}); }
      `}</style>

      {/* Command Palette */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
      />

      {/* Notifications Panel */}
      <NotificationCenter 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
      />

      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed top-0 left-0 z-50 h-full w-72 transform transition-transform duration-300 ease-out lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ 
          background: 'linear-gradient(180deg, rgba(15, 15, 20, 0.98) 0%, rgba(10, 10, 15, 0.98) 100%)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="sidebar-particle absolute w-1 h-1 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                left: `${20 + i * 15}%`,
                top: `${10 + i * 18}%`,
                opacity: 0.4,
              }}
            />
          ))}
        </div>

        {/* Gradient glow at top */}
        <div 
          className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at top, ${colors.primary}15, transparent 70%)`,
          }}
        />

        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-5 relative" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <motion.div
              ref={logoRef}
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <div 
                className="absolute inset-0 rounded-xl blur-lg opacity-60"
                style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
              />
              <Image
                src="/logos/devsync-48.png"
                alt="DevSync"
                width={40}
                height={40}
                className="rounded-xl relative z-10"
                priority
              />
            </motion.div>
            <div className="flex flex-col">
              <span 
                className="text-xl font-bold bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(135deg, #fff, ${colors.primary})` }}
              >
                DevSync
              </span>
              <span className="text-[10px] text-white/40 font-medium tracking-wider">PORTFOLIO BUILDER</span>
            </div>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-10rem)] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            
            return (
              <AnimatedNavItem
                key={item.name}
                item={item}
                isActive={isActive}
                onClick={() => setIsSidebarOpen(false)}
                index={index}
                colors={colors}
              />
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header 
          ref={headerRef}
          className="sticky top-0 z-30 h-16 backdrop-blur-xl transition-all duration-300" 
          style={{ 
            background: 'rgba(10, 10, 15, 0.8)',
            borderBottom: '1px solid rgba(255,255,255,0.05)' 
          }}
        >
          <div className="h-full px-6 flex items-center justify-between">
            {/* Mobile menu button */}
            <motion.button
              onClick={() => setIsSidebarOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="lg:hidden p-2.5 text-white/50 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </motion.button>

            {/* Search bar (desktop) */}
            <motion.button
              onClick={() => setIsCommandPaletteOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="hidden lg:flex items-center gap-3 px-5 py-2.5 rounded-2xl transition-all group"
              style={{ 
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <svg className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-sm text-white/40 group-hover:text-white/60 transition-colors">Search anything...</span>
              <kbd 
                className="text-[10px] px-2 py-1 rounded-lg font-medium"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.05)', 
                  color: 'rgba(255,255,255,0.4)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                ⌘K
              </kbd>
            </motion.button>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              {/* Theme toggle */}
              <ThemeToggle />

              {/* Public portfolio link */}
              <motion.a
                href={`/portfolio/${user?.email?.split('@')[0] || ''}`}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm text-white/50 hover:text-white rounded-xl hover:bg-white/5 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>View Portfolio</span>
              </motion.a>

              {/* Notifications */}
              <NotificationBell onClick={() => setIsNotificationsOpen(true)} />

              {/* Profile dropdown */}
              <div className="relative">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProfileOpen(!isProfileOpen);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-3 p-1.5 rounded-2xl transition-all hover:bg-white/5"
                >
                  <div 
                    className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden relative"
                    style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
                  >
                    {/* Glow effect */}
                    <div 
                      className="absolute inset-0 rounded-xl blur-md opacity-50"
                      style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
                    />
                    {user?.avatar ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={user.avatar}
                        alt={user.first_name}
                        className="w-full h-full rounded-xl object-cover relative z-10"
                      />
                    ) : (
                      <span className="text-white text-sm font-bold relative z-10">
                        {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-white">
                      {user?.first_name || user?.username || 'User'}
                    </p>
                    <p className="text-xs text-white/40">{user?.email}</p>
                  </div>
                  <motion.svg 
                    animate={{ rotate: isProfileOpen ? 180 : 0 }}
                    className="hidden md:block w-4 h-4 text-white/40" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </motion.svg>
                </motion.button>

                {/* Dropdown menu */}
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 mt-2 w-60 rounded-2xl py-2 z-50 overflow-hidden" 
                      style={{ 
                        background: 'rgba(20, 20, 25, 0.95)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.1)', 
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)' 
                      }}
                    >
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <p className="text-sm font-semibold text-white">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-xs text-white/40 truncate">{user?.email}</p>
                    </div>
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </Link>
                    <Link
                      href="/dashboard/activity"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Activity Log
                    </Link>
                    <Link
                      href="/dashboard/share"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Share Portfolio
                    </Link>
                    <div className="my-1 mx-4" style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)]">
          <CardErrorBoundary title="page content">
            {children}
          </CardErrorBoundary>
        </main>
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}

// Main layout component that wraps with ThemeProvider
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <DashboardContent>{children}</DashboardContent>
    </ThemeProvider>
  );
}
