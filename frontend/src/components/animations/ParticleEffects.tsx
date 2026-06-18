'use client';

import { useRef, useEffect, useCallback, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface ParticleFieldProps {
  className?: string;
  particleCount?: number;
  colors?: string[];
  maxSize?: number;
  minSize?: number;
  speed?: number;
  connectDistance?: number;
  mouseInteraction?: boolean;
  mouseRadius?: number;
  variant?: 'default' | 'snow' | 'fireflies' | 'stars' | 'bubbles' | 'confetti' | 'matrix';
}

export function ParticleField({
  className = '',
  particleCount = 80,
  colors = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981'],
  maxSize = 3,
  minSize = 1,
  speed = 0.5,
  connectDistance = 120,
  mouseInteraction = true,
  mouseRadius = 150,
  variant = 'default',
}: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number | undefined>(undefined);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const getVariantConfig = useCallback(() => {
    switch (variant) {
      case 'snow':
        return {
          colors: ['#ffffff', '#e0e7ff', '#c7d2fe'],
          speed: 0.3,
          maxSize: 4,
          minSize: 1,
          connectDistance: 0,
        };
      case 'fireflies':
        return {
          colors: ['#fbbf24', '#f59e0b', '#84cc16', '#22c55e'],
          speed: 0.2,
          maxSize: 3,
          minSize: 2,
          connectDistance: 0,
          glow: true,
        };
      case 'stars':
        return {
          colors: ['#ffffff', '#fef3c7', '#e0e7ff'],
          speed: 0,
          maxSize: 2,
          minSize: 0.5,
          connectDistance: 0,
          twinkle: true,
        };
      case 'bubbles':
        return {
          colors: ['rgba(139, 92, 246, 0.3)', 'rgba(236, 72, 153, 0.3)', 'rgba(6, 182, 212, 0.3)'],
          speed: 0.4,
          maxSize: 20,
          minSize: 5,
          connectDistance: 0,
        };
      case 'confetti':
        return {
          colors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'],
          speed: 2,
          maxSize: 8,
          minSize: 4,
          connectDistance: 0,
        };
      case 'matrix':
        return {
          colors: ['#22c55e', '#16a34a', '#15803d'],
          speed: 3,
          maxSize: 14,
          minSize: 10,
          connectDistance: 0,
          isText: true,
        };
      default:
        return { colors, speed, maxSize, minSize, connectDistance };
    }
  }, [variant, colors, speed, maxSize, minSize, connectDistance]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config = getVariantConfig();
    
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const createParticle = (x?: number, y?: number): Particle => {
      const effectiveColors = config.colors || colors;
      return {
        x: x ?? Math.random() * canvas.offsetWidth,
        y: y ?? Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * (config.speed || speed),
        vy: variant === 'snow' || variant === 'confetti' 
          ? Math.random() * (config.speed || speed) + 0.5
          : variant === 'bubbles'
          ? -Math.random() * (config.speed || speed) - 0.2
          : variant === 'matrix'
          ? Math.random() * (config.speed || speed) + 1
          : (Math.random() - 0.5) * (config.speed || speed),
        size: Math.random() * ((config.maxSize || maxSize) - (config.minSize || minSize)) + (config.minSize || minSize),
        color: effectiveColors[Math.floor(Math.random() * effectiveColors.length)],
        alpha: Math.random() * 0.5 + 0.5,
        life: 0,
        maxLife: variant === 'confetti' ? 200 + Math.random() * 100 : Infinity,
      };
    };

    const initParticles = () => {
      particlesRef.current = [];
      const count = variant === 'matrix' ? Math.floor(canvas.offsetWidth / 20) : particleCount;
      for (let i = 0; i < count; i++) {
        const particle = createParticle();
        if (variant === 'matrix') {
          particle.x = i * 20;
          particle.y = Math.random() * canvas.offsetHeight;
        }
        particlesRef.current.push(particle);
      }
    };

    const drawParticle = (p: Particle) => {
      ctx.save();
      
      if (variant === 'fireflies') {
        // Glow effect
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (variant === 'stars') {
        // Twinkle effect
        const twinkle = Math.sin(Date.now() * 0.005 + p.x) * 0.5 + 0.5;
        ctx.globalAlpha = p.alpha * twinkle;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (variant === 'bubbles') {
        ctx.globalAlpha = p.alpha * 0.6;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
        // Shine
        ctx.beginPath();
        ctx.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fill();
      } else if (variant === 'confetti') {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.life * 0.05);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      } else if (variant === 'matrix') {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.font = `${p.size}px monospace`;
        const char = String.fromCharCode(0x30A0 + Math.random() * 96);
        ctx.fillText(char, p.x, p.y);
      } else {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    };

    const drawConnections = () => {
      const dist = config.connectDistance || connectDistance;
      if (dist <= 0) return;

      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < dist) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.15 * (1 - distance / dist)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };

    const updateParticle = (p: Particle) => {
      // Mouse interaction
      if (mouseInteraction && variant === 'default') {
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouseRadius) {
          const force = (mouseRadius - distance) / mouseRadius;
          p.vx -= (dx / distance) * force * 0.5;
          p.vy -= (dy / distance) * force * 0.5;
        }
      }

      // Update position
      p.x += p.vx;
      p.y += p.vy;
      p.life++;

      // Apply friction for default variant
      if (variant === 'default') {
        p.vx *= 0.99;
        p.vy *= 0.99;
        
        // Random movement
        p.vx += (Math.random() - 0.5) * 0.05;
        p.vy += (Math.random() - 0.5) * 0.05;
      }

      // Confetti gravity
      if (variant === 'confetti') {
        p.vy += 0.02;
        p.alpha = 1 - p.life / p.maxLife;
      }

      // Boundary handling
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;

      if (variant === 'snow' || variant === 'confetti' || variant === 'matrix') {
        if (p.y > height) {
          p.y = 0;
          p.x = Math.random() * width;
          if (variant === 'confetti') p.life = 0;
        }
      } else if (variant === 'bubbles') {
        if (p.y < -p.size) {
          p.y = height + p.size;
          p.x = Math.random() * width;
        }
      } else {
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      particlesRef.current.forEach((p) => {
        updateParticle(p);
        drawParticle(p);
      });

      drawConnections();
      animationRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    resize();
    initParticles();
    animate();

    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particleCount, colors, maxSize, minSize, speed, connectDistance, mouseInteraction, mouseRadius, variant, getVariantConfig]);

  // If reduced motion, render static particles.
  if (prefersReducedMotion) {
    return (
      <div className={`absolute inset-0 w-full h-full ${className}`} style={{ pointerEvents: 'none' }}>
        {[...Array(Math.min(particleCount, 20))].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 43) % 100}%`,
              width: `${minSize + 1}px`,
              height: `${minSize + 1}px`,
              backgroundColor: colors[i % colors.length],
              opacity: 0.3,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ pointerEvents: mouseInteraction ? 'auto' : 'none' }}
    />
  );
}

// Floating elements that follow mouse
export function FloatingElements({
  children,
  className = '',
  intensity = 20,
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) / rect.width;
      const deltaY = (e.clientY - centerY) / rect.height;

      element.style.transform = `translate(${deltaX * intensity}px, ${deltaY * intensity}px)`;
    };

    const handleMouseLeave = () => {
      element.style.transform = 'translate(0, 0)';
    };

    window.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [intensity]);

  return (
    <div ref={ref} className={`transition-transform duration-300 ease-out ${className}`}>
      {children}
    </div>
  );
}
