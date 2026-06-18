'use client';

import { useRef, useEffect, ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface TextRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  stagger?: number;
  variant?: 'fade-up' | 'fade-down' | 'slide-left' | 'slide-right' | 'char-by-char' | 'word-by-word' | 'typewriter' | 'glitch';
  trigger?: 'scroll' | 'load';
}

// Split text into spans for animation
function splitText(text: string, by: 'char' | 'word'): string[] {
  if (by === 'char') {
    return text.split('');
  }
  return text.split(' ');
}

export function TextReveal({
  children,
  className = '',
  delay = 0,
  duration = 0.8,
  stagger = 0.02,
  variant = 'fade-up',
  trigger = 'scroll',
}: TextRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const element = containerRef.current;
      if (!element) return;

      let animation: gsap.core.Tween | gsap.core.Timeline;
      const scrollConfig = trigger === 'scroll' ? {
        scrollTrigger: {
          trigger: element,
          start: 'top 85%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse',
        },
      } : {};

      switch (variant) {
        case 'fade-up':
          animation = gsap.fromTo(
            element,
            { opacity: 0, y: 50 },
            { opacity: 1, y: 0, duration, delay, ease: 'power3.out', ...scrollConfig }
          );
          break;

        case 'fade-down':
          animation = gsap.fromTo(
            element,
            { opacity: 0, y: -50 },
            { opacity: 1, y: 0, duration, delay, ease: 'power3.out', ...scrollConfig }
          );
          break;

        case 'slide-left':
          animation = gsap.fromTo(
            element,
            { opacity: 0, x: 100 },
            { opacity: 1, x: 0, duration, delay, ease: 'power3.out', ...scrollConfig }
          );
          break;

        case 'slide-right':
          animation = gsap.fromTo(
            element,
            { opacity: 0, x: -100 },
            { opacity: 1, x: 0, duration, delay, ease: 'power3.out', ...scrollConfig }
          );
          break;

        case 'char-by-char':
        case 'word-by-word': {
          const text = element.textContent || '';
          const items = splitText(text, variant === 'char-by-char' ? 'char' : 'word');
          element.innerHTML = items
            .map((item) => `<span class="inline-block opacity-0">${item === ' ' ? '&nbsp;' : item}</span>`)
            .join(variant === 'word-by-word' ? ' ' : '');

          animation = gsap.to(element.querySelectorAll('span'), {
            opacity: 1,
            y: 0,
            duration: duration / 2,
            stagger,
            delay,
            ease: 'power2.out',
            ...scrollConfig,
          });
          gsap.set(element.querySelectorAll('span'), { y: 20 });
          break;
        }

        case 'typewriter': {
          const text = element.textContent || '';
          element.textContent = '';
          element.style.borderRight = '2px solid currentColor';
          
          let i = 0;
          const typeInterval = setInterval(() => {
            if (i < text.length) {
              element.textContent += text[i];
              i++;
            } else {
              clearInterval(typeInterval);
              // Blinking cursor
              gsap.to(element, {
                borderRightColor: 'transparent',
                repeat: -1,
                yoyo: true,
                duration: 0.5,
              });
            }
          }, 50);
          break;
        }

        case 'glitch': {
          const text = element.textContent || '';
          element.setAttribute('data-text', text);
          element.classList.add('glitch-text');
          animation = gsap.fromTo(
            element,
            { opacity: 0 },
            { opacity: 1, duration: 0.1, delay, ...scrollConfig }
          );
          break;
        }
      }
    }, containerRef);

    return () => ctx.revert();
  }, [variant, delay, duration, stagger, trigger]);

  return (
    <div ref={containerRef} className={className}>
      <span ref={textRef}>{children}</span>
    </div>
  );
}

// Animated heading with gradient reveal
export function GradientTextReveal({
  children,
  className = '',
  from = '#8b5cf6',
  to = '#ec4899',
}: {
  children: ReactNode;
  className?: string;
  from?: string;
  to?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        {
          backgroundSize: '0% 100%',
          opacity: 0,
        },
        {
          backgroundSize: '100% 100%',
          opacity: 1,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: ref.current,
            start: 'top 85%',
          },
        }
      );
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        background: `linear-gradient(90deg, ${from}, ${to})`,
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {children}
    </div>
  );
}

// Counter animation for numbers
export function CountUp({
  end,
  duration = 2,
  suffix = '',
  prefix = '',
  className = '',
}: {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      const obj = { value: 0 };
      gsap.to(obj, {
        value: end,
        duration,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 85%',
        },
        onUpdate: () => {
          if (ref.current) {
            ref.current.textContent = `${prefix}${Math.round(obj.value).toLocaleString()}${suffix}`;
          }
        },
      });
    }, ref);

    return () => ctx.revert();
  }, [end, duration, suffix, prefix]);

  return <span ref={ref} className={className}>0</span>;
}
