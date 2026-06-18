'use client';

import { useRef, useEffect, useState, ReactNode, createContext, useContext } from 'react';
import { gsap } from 'gsap';

// Page transition context
interface TransitionContextType {
  isTransitioning: boolean;
  startTransition: (callback: () => void) => void;
}

const TransitionContext = createContext<TransitionContextType | null>(null);

export function usePageTransition() {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error('usePageTransition must be used within TransitionProvider');
  }
  return context;
}

// Transition provider
export function TransitionProvider({
  children,
  variant = 'fade',
}: {
  children: ReactNode;
  variant?: 'fade' | 'slide' | 'reveal' | 'curtain' | 'zoom';
}) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const startTransition = (callback: () => void) => {
    if (!overlayRef.current || isTransitioning) return;
    
    setIsTransitioning(true);
    const overlay = overlayRef.current;

    const timeline = gsap.timeline({
      onComplete: () => {
        callback();
        // Reverse animation
        setTimeout(() => {
          const reverseTimeline = gsap.timeline({
            onComplete: () => setIsTransitioning(false),
          });

          switch (variant) {
            case 'fade':
              reverseTimeline.to(overlay, { opacity: 0, duration: 0.4, ease: 'power2.inOut' });
              break;
            case 'slide':
              reverseTimeline.to(overlay, { yPercent: -100, duration: 0.5, ease: 'power3.inOut' });
              break;
            case 'reveal':
              reverseTimeline.to(overlay, { scaleY: 0, duration: 0.5, ease: 'power3.inOut', transformOrigin: 'top' });
              break;
            case 'curtain':
              reverseTimeline.to(overlay.children, { scaleX: 0, duration: 0.4, stagger: 0.05, ease: 'power3.inOut' });
              break;
            case 'zoom':
              reverseTimeline.to(overlay, { scale: 0, opacity: 0, duration: 0.5, ease: 'power3.in' });
              break;
          }
        }, 100);
      },
    });

    switch (variant) {
      case 'fade':
        gsap.set(overlay, { opacity: 0 });
        timeline.to(overlay, { opacity: 1, duration: 0.4, ease: 'power2.inOut' });
        break;
      case 'slide':
        gsap.set(overlay, { yPercent: 100 });
        timeline.to(overlay, { yPercent: 0, duration: 0.5, ease: 'power3.inOut' });
        break;
      case 'reveal':
        gsap.set(overlay, { scaleY: 0, transformOrigin: 'bottom' });
        timeline.to(overlay, { scaleY: 1, duration: 0.5, ease: 'power3.inOut' });
        break;
      case 'curtain':
        gsap.set(overlay.children, { scaleX: 0 });
        timeline.to(overlay.children, { scaleX: 1, duration: 0.4, stagger: 0.05, ease: 'power3.inOut' });
        break;
      case 'zoom':
        gsap.set(overlay, { scale: 0, opacity: 0 });
        timeline.to(overlay, { scale: 1, opacity: 1, duration: 0.5, ease: 'power3.out' });
        break;
    }
  };

  return (
    <TransitionContext.Provider value={{ isTransitioning, startTransition }}>
      {children}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9999] pointer-events-none"
        style={{ 
          background: variant === 'curtain' ? 'transparent' : 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
          display: variant === 'curtain' ? 'flex' : 'block',
        }}
      >
        {variant === 'curtain' && (
          <>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-1 bg-gradient-to-b from-indigo-600 to-cyan-600 origin-left" />
            ))}
          </>
        )}
      </div>
    </TransitionContext.Provider>
  );
}

// Page wrapper with entrance animation
export function PageWrapper({
  children,
  className = '',
  animation = 'fade-up',
}: {
  children: ReactNode;
  className?: string;
  animation?: 'fade-up' | 'fade' | 'slide-left' | 'slide-right' | 'zoom' | 'stagger';
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      const element = ref.current;
      if (!element) return;

      switch (animation) {
        case 'fade-up':
          gsap.fromTo(element, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
          break;
        case 'fade':
          gsap.fromTo(element, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
          break;
        case 'slide-left':
          gsap.fromTo(element, { opacity: 0, x: 50 }, { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' });
          break;
        case 'slide-right':
          gsap.fromTo(element, { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' });
          break;
        case 'zoom':
          gsap.fromTo(element, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' });
          break;
        case 'stagger':
          gsap.fromTo(
            element.children,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out' }
          );
          break;
      }
    }, ref);

    return () => ctx.revert();
  }, [animation]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

// Route transition link component
export function TransitionLink({
  href,
  children,
  className = '',
  onClick,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const { startTransition } = usePageTransition();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    startTransition(() => {
      if (onClick) onClick();
      window.location.href = href;
    });
  };

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}

// Preloader component
export function Preloader({
  onComplete,
  variant = 'minimal',
}: {
  onComplete: () => void;
  variant?: 'minimal' | 'counter' | 'logo' | 'bar';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100 && ref.current) {
      const timeline = gsap.timeline({
        onComplete,
      });

      switch (variant) {
        case 'minimal':
          timeline.to(ref.current, { opacity: 0, duration: 0.5, ease: 'power2.inOut' });
          break;
        case 'counter':
        case 'logo':
          timeline
            .to(ref.current.querySelector('.preloader-content'), { y: -20, opacity: 0, duration: 0.3 })
            .to(ref.current, { yPercent: -100, duration: 0.6, ease: 'power3.inOut' });
          break;
        case 'bar':
          timeline
            .to(ref.current.querySelector('.preloader-bar'), { scaleX: 1, duration: 0.3 })
            .to(ref.current, { opacity: 0, duration: 0.4 });
          break;
      }
    }
  }, [progress, onComplete, variant]);

  const clampedProgress = Math.min(100, Math.round(progress));

  return (
    <div
      ref={ref}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-background"
    >
      {variant === 'minimal' && (
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      )}

      {variant === 'counter' && (
        <div className="preloader-content text-center">
          <div className="text-7xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            {clampedProgress}%
          </div>
          <div className="mt-4 text-on-surface-secondary">Loading...</div>
        </div>
      )}

      {variant === 'logo' && (
        <div className="preloader-content flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-600 flex items-center justify-center mb-6 animate-pulse">
            <span className="text-3xl font-bold text-white">D</span>
          </div>
          <div className="w-48 h-1 bg-surface-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-300"
              style={{ width: `${clampedProgress}%` }}
            />
          </div>
        </div>
      )}

      {variant === 'bar' && (
        <div className="w-full h-full flex items-end">
          <div
            className="preloader-bar h-1 bg-gradient-to-r from-indigo-500 to-cyan-500 origin-left"
            style={{ transform: `scaleX(${clampedProgress / 100})` }}
          />
        </div>
      )}
    </div>
  );
}
