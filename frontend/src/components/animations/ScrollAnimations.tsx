'use client';

import { useRef, useEffect, ReactNode, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Hook to check reduced motion preference
function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return prefersReducedMotion;
}

interface ScrollAnimationProps {
  children: ReactNode;
  className?: string;
  animation?: 'fade-in' | 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom-in' | 'zoom-out' | 'flip' | 'rotate' | 'bounce';
  duration?: number;
  delay?: number;
  start?: string;
  end?: string;
  scrub?: boolean | number;
  pin?: boolean;
  markers?: boolean;
}

export function ScrollAnimation({
  children,
  className = '',
  animation = 'fade-up',
  duration = 1,
  delay = 0,
  start = 'top 85%',
  end = 'bottom 20%',
  scrub = false,
  pin = false,
  markers = false,
}: ScrollAnimationProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!ref.current) return;
    
    // Skip animations for reduced motion preference
    if (prefersReducedMotion) {
      ref.current.style.opacity = '1';
      return;
    }

    const ctx = gsap.context(() => {
      const element = ref.current;
      if (!element) return;

      const getFromTo = () => {
        switch (animation) {
          case 'fade-in':
            return { from: { opacity: 0 }, to: { opacity: 1 } };
          case 'fade-up':
            return { from: { opacity: 0, y: 80 }, to: { opacity: 1, y: 0 } };
          case 'fade-down':
            return { from: { opacity: 0, y: -80 }, to: { opacity: 1, y: 0 } };
          case 'fade-left':
            return { from: { opacity: 0, x: 80 }, to: { opacity: 1, x: 0 } };
          case 'fade-right':
            return { from: { opacity: 0, x: -80 }, to: { opacity: 1, x: 0 } };
          case 'zoom-in':
            return { from: { opacity: 0, scale: 0.5 }, to: { opacity: 1, scale: 1 } };
          case 'zoom-out':
            return { from: { opacity: 0, scale: 1.5 }, to: { opacity: 1, scale: 1 } };
          case 'flip':
            return { from: { opacity: 0, rotationX: 90 }, to: { opacity: 1, rotationX: 0 } };
          case 'rotate':
            return { from: { opacity: 0, rotation: -180 }, to: { opacity: 1, rotation: 0 } };
          case 'bounce':
            return { from: { opacity: 0, y: -100 }, to: { opacity: 1, y: 0, ease: 'bounce.out' } };
          default:
            return { from: { opacity: 0 }, to: { opacity: 1 } };
        }
      };

      const { from, to } = getFromTo();

      gsap.fromTo(element, from, {
        ...to,
        duration,
        delay,
        ease: to.ease || 'power3.out',
        scrollTrigger: {
          trigger: element,
          start,
          end,
          scrub,
          pin,
          markers,
          toggleActions: scrub ? undefined : 'play none none reverse',
        },
      });
    }, ref);

    return () => ctx.revert();
  }, [animation, duration, delay, start, end, scrub, pin, markers, prefersReducedMotion]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

// Parallax scrolling effect
export function Parallax({
  children,
  className = '',
  speed = 0.5,
  direction = 'vertical',
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
  direction?: 'vertical' | 'horizontal';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!ref.current || prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const element = ref.current;
      if (!element) return;

      const movement = direction === 'vertical' ? { y: speed * 200 } : { x: speed * 200 };

      gsap.to(element, {
        ...movement,
        ease: 'none',
        scrollTrigger: {
          trigger: element,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, ref);

    return () => ctx.revert();
  }, [speed, direction, prefersReducedMotion]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

// Horizontal scroll section
export function HorizontalScroll({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !scrollRef.current) return;

    const ctx = gsap.context(() => {
      const scrollElement = scrollRef.current;
      const container = containerRef.current;
      if (!scrollElement || !container) return;

      const scrollWidth = scrollElement.scrollWidth - container.offsetWidth;

      gsap.to(scrollElement, {
        x: -scrollWidth,
        ease: 'none',
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: () => `+=${scrollWidth}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className={`overflow-hidden ${className}`}>
      <div ref={scrollRef} className="flex">
        {children}
      </div>
    </div>
  );
}

// Stagger children animation
export function StaggerChildren({
  children,
  className = '',
  stagger = 0.1,
  animation = 'fade-up',
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  animation?: 'fade-up' | 'fade-in' | 'scale' | 'slide';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!ref.current) return;
    
    // Skip animations for reduced motion preference
    if (prefersReducedMotion) {
      const element = ref.current;
      Array.from(element.children).forEach(child => {
        (child as HTMLElement).style.opacity = '1';
      });
      return;
    }

    const ctx = gsap.context(() => {
      const element = ref.current;
      if (!element) return;

      const children = element.children;
      
      const getAnimation = () => {
        switch (animation) {
          case 'fade-up':
            return { from: { opacity: 0, y: 50 }, to: { opacity: 1, y: 0 } };
          case 'fade-in':
            return { from: { opacity: 0 }, to: { opacity: 1 } };
          case 'scale':
            return { from: { opacity: 0, scale: 0.8 }, to: { opacity: 1, scale: 1 } };
          case 'slide':
            return { from: { opacity: 0, x: -30 }, to: { opacity: 1, x: 0 } };
          default:
            return { from: { opacity: 0 }, to: { opacity: 1 } };
        }
      };

      const { from, to } = getAnimation();

      gsap.fromTo(children, from, {
        ...to,
        duration: 0.6,
        stagger,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 85%',
        },
      });
    }, ref);

    return () => ctx.revert();
  }, [stagger, animation, prefersReducedMotion]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

// Scroll progress indicator
export function ScrollProgress({
  className = '',
  color = '#8b5cf6',
  height = 4,
  position = 'top',
}: {
  className?: string;
  color?: string;
  height?: number;
  position?: 'top' | 'bottom';
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      gsap.to(ref.current, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.3,
        },
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      className={`fixed left-0 right-0 z-50 origin-left ${className}`}
      style={{
        [position]: 0,
        height,
        background: color,
        transform: 'scaleX(0)',
      }}
    />
  );
}
