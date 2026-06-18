'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';

// Floating particles component
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-indigo-400/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 5 + Math.random() * 5,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Animated input component
function AnimatedInput({ 
  label, 
  icon, 
  error,
  ...props 
}: { 
  label: string; 
  icon: React.ReactNode;
  error?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <label className="block text-sm font-medium text-indigo-300/80 mb-2 font-mono uppercase text-xs tracking-wider">
        {label}
      </label>
      <div className="relative group">
        {/* Glow effect */}
        <motion.div
          className={`absolute -inset-0.5 rounded-xl blur-sm transition-opacity duration-300 ${
            error 
              ? 'bg-red-500/50 opacity-100' 
              : 'bg-gradient-to-r from-indigo-600 to-cyan-600'
          }`}
          animate={{ opacity: isFocused ? 0.7 : 0 }}
        />
        
        <div className="relative flex items-center">
          <span className={`absolute left-4 transition-colors duration-300 ${
            isFocused ? 'text-cyan-400' : 'text-slate-400'
          }`}>
            {icon}
          </span>
          <input
            ref={inputRef}
            {...props}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className={`w-full pl-12 pr-4 py-4 bg-[#0f1419]/80 backdrop-blur-sm border-2 rounded-xl text-indigo-100 placeholder:text-slate-500 transition-all duration-300 outline-none ${
              error 
                ? 'border-red-500/50' 
                : isFocused 
                  ? 'border-indigo-500/50' 
                  : 'border-indigo-500/20 hover:border-indigo-500/30'
            }`}
          />
        </div>
      </div>
    </motion.div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const formRef = useRef<HTMLFormElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  // Check for session expired parameter
  useEffect(() => {
    if (searchParams.get('session_expired') === 'true') {
      setSessionExpired(true);
    }
  }, [searchParams]);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  // GSAP entrance animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Logo animation
      gsap.fromTo(logoRef.current,
        { scale: 0, rotation: -180 },
        { scale: 1, rotation: 0, duration: 0.8, ease: 'back.out(1.7)', delay: 0.2 }
      );
    });
    return () => ctx.revert();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(formData);
      // Success animation
      gsap.to(formRef.current, {
        scale: 0.95,
        opacity: 0,
        duration: 0.3,
        onComplete: () => router.push('/dashboard'),
      });
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Invalid credentials. Please try again.');
      // Shake animation on error
      gsap.to(formRef.current, {
        keyframes: { x: [-10, 10, -10, 10, 0] },
        duration: 0.4,
        ease: 'power2.out',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-md px-4">
      {/* Animated card */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        {/* Card glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-cyan-600 to-blue-600 rounded-3xl blur-xl opacity-40 animate-pulse" />
        
        <div className="relative bg-[#0f1419]/90 backdrop-blur-xl rounded-2xl border border-indigo-500/20 p-8 shadow-2xl shadow-indigo-500/10">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <motion.div 
                ref={logoRef}
                className="relative mx-auto w-16 h-16 mb-6"
                whileHover={{ scale: 1.1, rotate: 10 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                {/* Logo glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-cyan-600 rounded-2xl blur-lg opacity-60" />
                <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/50">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
              </motion.div>
            </Link>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-3xl font-bold"
            >
              <span className="bg-gradient-to-r from-indigo-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent">
                Welcome back
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-2 text-slate-400 font-mono text-sm"
            >
              // Sign in to continue to DevSync
            </motion.p>
          </div>

          {/* Form */}
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence>
              {sessionExpired && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Your session has expired. Please sign in again.
                  </div>
                </motion.div>
              )}
              
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatedInput
              label="Email address"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              error={!!error}
            />

            <AnimatedInput
              label="Password"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              error={!!error}
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-between"
            >
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 rounded-md border-2 border-indigo-500/30 bg-[#0f1419]/80 peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all duration-300" />
                  <svg className="absolute top-0.5 left-0.5 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-slate-400 group-hover:text-indigo-300 transition-colors font-mono">
                  Remember me
                </span>
              </label>
              
              <Link href="/forgot-password" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-mono">
                Forgot password?
              </Link>
            </motion.div>

            {/* Submit button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative w-full group"
              >
                {/* Button glow */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 via-cyan-600 to-blue-600 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300" />
                
                <div className="relative w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-xl text-white font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/50">
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      <span className="font-mono">AUTHENTICATING...</span>
                    </>
                  ) : (
                    <>
                      <span className="font-mono">SIGN IN</span>
                      <motion.svg 
                        className="w-5 h-5" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </motion.svg>
                    </>
                  )}
                </div>
              </motion.button>
            </motion.div>
          </form>

          {/* Register link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center text-slate-400 font-mono text-sm"
          >
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent hover:from-cyan-300 hover:to-blue-300 transition-all">
              Create one now
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="w-full max-w-md px-4">
      <div className="bg-surface/80 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-600 mx-auto animate-pulse" />
          <div className="mt-6 h-8 w-48 skeleton mx-auto rounded-lg" />
          <div className="mt-2 h-4 w-64 skeleton mx-auto rounded-lg" />
        </div>
        <div className="space-y-5">
          <div className="h-16 skeleton rounded-xl" />
          <div className="h-16 skeleton rounded-xl" />
          <div className="h-14 skeleton rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden bg-[#0a0e1a]">
      {/* Animated background */}
      <FloatingParticles />
      
      {/* Large gradient orbs */}
      <motion.div 
        className="absolute top-0 -left-40 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[150px]"
        animate={{ 
          x: [0, 100, 0],
          y: [0, 50, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div 
        className="absolute bottom-0 -right-40 w-[500px] h-[500px] bg-cyan-600/15 rounded-full blur-[150px]"
        animate={{ 
          x: [0, -80, 0],
          y: [0, -60, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px]"
        animate={{ 
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />
      
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
