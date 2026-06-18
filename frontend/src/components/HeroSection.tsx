'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { 
  gsap, 
  ScrollTrigger, 
  SplitText, 
  ScrambleTextPlugin,
  CustomEase 
} from '@/lib/gsap';

// Dynamic imports
const Laptop3D = dynamic(() => import('./3d/Laptop3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] lg:h-[600px] flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  ),
});

const ParticleField = dynamic(
  () => import('./animations/ParticleEffects').then((mod) => mod.ParticleField),
  { ssr: false }
);

// Typewriter effect component
function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i <= text.length) {
          setDisplayText(text.slice(0, i));
          i++;
        } else {
          clearInterval(interval);
        }
      }, 80);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);

  useEffect(() => {
    const cursor = setInterval(() => setShowCursor((v) => !v), 500);
    return () => clearInterval(cursor);
  }, []);

  return (
    <span>
      {displayText}
      <span className={`${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity`}>|</span>
    </span>
  );
}

// Magnetic button component
function MagneticButton({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(ref.current, { x: x * 0.3, y: y * 0.3, duration: 0.3 });
  };

  const handleMouseLeave = () => {
    if (!ref.current) return;
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
  };

  return (
    <div ref={ref} className={className} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      {children}
    </div>
  );
}

// Glitch text effect
function GlitchText({ children, className = '' }: { children: string; className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{children}</span>
      <span className="absolute top-0 left-0 -ml-[2px] text-cyan-400 opacity-70 animate-glitch-1" aria-hidden>
        {children}
      </span>
      <span className="absolute top-0 left-0 ml-[2px] text-cyan-400 opacity-70 animate-glitch-2" aria-hidden>
        {children}
      </span>
    </span>
  );
}

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Entrance animations with GSAP plugins
  useEffect(() => {
    // Create custom ease for smooth animations
    CustomEase.create('smooth', '0.25, 0.1, 0.25, 1');
    
    const ctx = gsap.context(() => {
      // Animate badge with bounce
      gsap.fromTo('.hero-badge', 
        { opacity: 0, y: 30, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, delay: 0.2, ease: 'back.out(1.7)' }
      );

      // SplitText animation for main title
      const titleWords = document.querySelectorAll('.hero-title-word');
      titleWords.forEach((word, i) => {
        gsap.fromTo(word,
          { opacity: 0, y: 100, rotateX: -90, transformOrigin: 'center bottom' },
          { 
            opacity: 1, 
            y: 0, 
            rotateX: 0, 
            duration: 1.2, 
            delay: 0.5 + (i * 0.15), 
            ease: 'power4.out'
          }
        );
      });

      // Scramble text effect for gradient title
      const gradientTitle = document.querySelector('.hero-gradient-title');
      if (gradientTitle) {
        gsap.fromTo(gradientTitle,
          { opacity: 0 },
          { 
            opacity: 1, 
            duration: 0.1, 
            delay: 1.0,
            onComplete: () => {
              gsap.to(gradientTitle, {
                duration: 1.5,
                scrambleText: {
                  text: gradientTitle.textContent || '',
                  chars: '!@#$%^&*()_+=[]{}|;:,.<>?',
                  revealDelay: 0.3,
                  speed: 0.4
                }
              });
            }
          }
        );
      }

      // Animate description with fade
      gsap.fromTo('.hero-description',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, delay: 1.4, ease: 'smooth' }
      );

      // Animate buttons with stagger
      gsap.fromTo('.hero-buttons',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, delay: 1.7, ease: 'smooth' }
      );

      // Animate stats with bounce stagger
      gsap.fromTo('.hero-stat',
        { opacity: 0, y: 30, scale: 0.8 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, delay: 2.0, ease: 'back.out(1.7)' }
      );

      // Animate laptop with 3D effect
      gsap.fromTo('.hero-laptop',
        { opacity: 0, x: 100, rotateY: -30, scale: 0.9 },
        { opacity: 1, x: 0, rotateY: 0, scale: 1, duration: 1.2, delay: 0.8, ease: 'power4.out' }
      );

      // Floating code snippets animation
      gsap.to('.floating-code', {
        y: -15,
        rotation: 3,
        duration: 2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        stagger: 0.5
      });

      // ScrollTrigger for parallax effect on orbs
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
        onUpdate: (self) => {
          gsap.to('.gradient-orb-1', { y: self.progress * 200, duration: 0.5 });
          gsap.to('.gradient-orb-2', { y: self.progress * -150, duration: 0.5 });
          gsap.to('.gradient-orb-3', { y: self.progress * 100, duration: 0.5 });
        }
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative min-h-screen overflow-hidden">
      {/* Dramatic particle background */}
      <div className="absolute inset-0 z-0">
        <ParticleField 
          variant="fireflies" 
          particleCount={60}
          mouseInteraction={true}
        />
      </div>

      {/* Moving gradient orbs with ScrollTrigger classes */}
      <motion.div 
        className="gradient-orb-1 absolute top-20 left-10 w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[150px] pointer-events-none"
        animate={{ 
          x: [0, 100, 0], 
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div 
        className="gradient-orb-2 absolute bottom-20 right-10 w-[400px] h-[400px] bg-cyan-600/30 rounded-full blur-[150px] pointer-events-none"
        animate={{ 
          x: [0, -80, 0], 
          y: [0, -60, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div 
        className="gradient-orb-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/20 rounded-full blur-[200px] pointer-events-none"
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Gradient fade at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />

      {/* Content */}
      <motion.div style={{ y, opacity }} className="relative z-20 container mx-auto px-6 pt-24 lg:pt-36">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <TypewriterText text="Built for developers who want to stand out" delay={500} />
            </div>

            {/* Title with dramatic reveal */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1]" style={{ perspective: '1000px' }}>
              <span className="hero-title-word inline-block text-on-surface">Your</span>{' '}
              <span className="hero-title-word inline-block text-on-surface">Developer</span>
              <br />
              <span className="hero-title-word inline-block">
                <GlitchText className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-cyan-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  Portfolio
                </GlitchText>
              </span>{' '}
              <span className="hero-title-word inline-block">
                <GlitchText className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  Dashboard
                </GlitchText>
              </span>
            </h1>

            {/* Description */}
            <p className="hero-description mt-8 text-lg sm:text-xl text-on-surface-secondary max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Showcase your projects, skills, and achievements in one beautiful, 
              professional dashboard. Built for developers who want to stand out.
            </p>

            {/* Buttons */}
            <div className="hero-buttons mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <MagneticButton>
                <Link href="/register" className="group relative inline-block">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-cyan-600 to-cyan-600 rounded-xl blur-lg opacity-70 group-hover:opacity-100 transition duration-500 animate-pulse" />
                  <button className="relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-xl text-white font-semibold text-lg flex items-center gap-2 hover:shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 transform hover:scale-105">
                    Create Your Portfolio
                    <motion.svg 
                      className="w-5 h-5" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </motion.svg>
                  </button>
                </Link>
              </MagneticButton>

              <MagneticButton>
                <Link
                  href="/api/docs"
                  className="group px-8 py-4 rounded-xl text-on-surface-secondary hover:text-on-surface font-semibold text-lg border border-border hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all duration-300 flex items-center gap-2 backdrop-blur-sm"
                >
                  <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  API Docs
                </Link>
              </MagneticButton>
            </div>
          </div>

          {/* Right side - 3D Laptop */}
          <div className="hero-laptop relative" style={{ perspective: '1000px' }}>
            <motion.div
              whileHover={{ rotateY: 10, rotateX: -5 }}
              transition={{ type: 'spring', stiffness: 100 }}
            >
              <Laptop3D />
            </motion.div>
            
            {/* Enhanced glow effect */}
            <motion.div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full -z-10"
              style={{
                background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, rgba(236,72,153,0.2) 50%, transparent 70%)',
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Floating code snippets */}
            <div
              className="floating-code absolute -top-4 -left-4 px-3 py-2 bg-surface-secondary/80 backdrop-blur-sm rounded-lg border border-indigo-500/30 text-xs font-mono text-indigo-300"
            >
              {'<DevSync />'}
            </div>
            <div
              className="floating-code absolute -bottom-4 -right-4 px-3 py-2 bg-surface-secondary/80 backdrop-blur-sm rounded-lg border border-cyan-500/30 text-xs font-mono text-cyan-300"
            >
              npm i devsync
            </div>
            <div
              className="floating-code absolute top-1/4 -right-8 px-3 py-2 bg-surface-secondary/80 backdrop-blur-sm rounded-lg border border-cyan-500/30 text-xs font-mono text-cyan-300"
            >
              git push 🚀
            </div>
          </div>
        </div>
      </motion.div>

      {/* Animated scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-on-surface-tertiary uppercase tracking-widest">Scroll</span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-6 h-10 rounded-full border-2 border-indigo-500/50 flex justify-center pt-2"
        >
          <motion.div 
            className="w-1.5 h-3 bg-gradient-to-b from-indigo-400 to-cyan-400 rounded-full"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>

      {/* CSS for glitch effect */}
      <style jsx global>{`
        @keyframes glitch-1 {
          0%, 100% { clip-path: inset(0 0 0 0); transform: translate(0); }
          20% { clip-path: inset(20% 0 60% 0); transform: translate(-2px, 2px); }
          40% { clip-path: inset(40% 0 40% 0); transform: translate(2px, -2px); }
          60% { clip-path: inset(60% 0 20% 0); transform: translate(-1px, 1px); }
          80% { clip-path: inset(80% 0 0 0); transform: translate(1px, -1px); }
        }
        @keyframes glitch-2 {
          0%, 100% { clip-path: inset(0 0 0 0); transform: translate(0); }
          20% { clip-path: inset(80% 0 0 0); transform: translate(2px, -2px); }
          40% { clip-path: inset(60% 0 20% 0); transform: translate(-2px, 2px); }
          60% { clip-path: inset(40% 0 40% 0); transform: translate(1px, -1px); }
          80% { clip-path: inset(20% 0 60% 0); transform: translate(-1px, 1px); }
        }
        .animate-glitch-1 { animation: glitch-1 3s infinite linear; }
        .animate-glitch-2 { animation: glitch-2 3s infinite linear reverse; }
      `}</style>
    </section>
  );
}

// Count up animation component
function CountUpNumber({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    const duration = 2000;
    const steps = 60;
    const increment = end / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [hasStarted, end]);

  return (
    <span ref={ref}>
      {count % 1 === 0 ? Math.round(count) : count.toFixed(1)}{suffix}
    </span>
  );
}
