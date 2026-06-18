'use client';

import { useRef, useState, ReactNode } from 'react';

interface HoverEffectProps {
  children: ReactNode;
  className?: string;
}

// Magnetic button effect
export function MagneticButton({
  children,
  className = '',
  strength = 0.5,
}: HoverEffectProps & { strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    ref.current.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  };

  const handleMouseLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = 'translate(0, 0)';
  };

  return (
    <div
      ref={ref}
      className={`transition-transform duration-300 ease-out ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

// 3D tilt card effect
export function TiltCard({
  children,
  className = '',
  maxTilt = 15,
  scale = 1.05,
  glare = true,
}: HoverEffectProps & { maxTilt?: number; scale?: number; glare?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = ((y - centerY) / centerY) * maxTilt;
    const tiltY = ((centerX - x) / centerX) * maxTilt;

    ref.current.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${scale})`;
    
    if (glare) {
      setGlarePosition({
        x: (x / rect.width) * 100,
        y: (y / rect.height) * 100,
      });
    }
  };

  const handleMouseLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
  };

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden transition-transform duration-300 ease-out ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
      {glare && (
        <div
          className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.2) 0%, transparent 60%)`,
          }}
        />
      )}
    </div>
  );
}

// Glow on hover
export function GlowCard({
  children,
  className = '',
  glowColor = 'rgba(139, 92, 246, 0.5)',
  glowSize = 100,
}: HoverEffectProps & { glowColor?: string; glowSize?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      <div
        className="pointer-events-none absolute transition-opacity duration-300"
        style={{
          left: position.x - glowSize / 2,
          top: position.y - glowSize / 2,
          width: glowSize,
          height: glowSize,
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          opacity: isHovered ? 1 : 0,
        }}
      />
    </div>
  );
}

// Border gradient animation on hover
export function GradientBorderCard({
  children,
  className = '',
  borderWidth = 2,
  gradientColors = ['#8b5cf6', '#ec4899', '#06b6d4', '#8b5cf6'],
  animationDuration = 3,
}: HoverEffectProps & {
  borderWidth?: number;
  gradientColors?: string[];
  animationDuration?: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated gradient border */}
      <div
        className="absolute inset-0 rounded-[inherit] transition-opacity duration-300"
        style={{
          padding: borderWidth,
          background: `linear-gradient(90deg, ${gradientColors.join(', ')})`,
          backgroundSize: '300% 100%',
          animation: isHovered ? `gradient-border ${animationDuration}s linear infinite` : 'none',
          opacity: isHovered ? 1 : 0.3,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      <div className="relative">{children}</div>
      <style jsx>{`
        @keyframes gradient-border {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
      `}</style>
    </div>
  );
}

// Spotlight effect
export function SpotlightCard({
  children,
  className = '',
}: HoverEffectProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(139, 92, 246, 0.1), transparent 40%)`,
          opacity: isHovered ? 1 : 0,
        }}
      />
    </div>
  );
}

// Morphing blob background
export function MorphingBlob({
  className = '',
  color = 'rgba(139, 92, 246, 0.3)',
}: {
  className?: string;
  color?: string;
}) {
  return (
    <div className={`absolute pointer-events-none ${className}`}>
      <div
        className="w-full h-full animate-blob"
        style={{
          background: color,
          filter: 'blur(60px)',
          borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
        }}
      />
      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
            transform: translate(0, 0) scale(1);
          }
          25% {
            border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
            transform: translate(10%, 10%) scale(1.1);
          }
          50% {
            border-radius: 50% 60% 30% 60% / 30% 60% 70% 40%;
            transform: translate(-5%, 5%) scale(0.95);
          }
          75% {
            border-radius: 60% 30% 70% 40% / 60% 40% 30% 70%;
            transform: translate(5%, -10%) scale(1.05);
          }
        }
        .animate-blob {
          animation: blob 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// Ripple effect on click
export function RippleButton({
  children,
  className = '',
  rippleColor = 'rgba(255, 255, 255, 0.5)',
}: HoverEffectProps & { rippleColor?: string }) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
    >
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute animate-ripple rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            background: rippleColor,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
      <style jsx>{`
        @keyframes ripple {
          0% {
            width: 0;
            height: 0;
            opacity: 0.5;
          }
          100% {
            width: 500px;
            height: 500px;
            opacity: 0;
          }
        }
        .animate-ripple {
          animation: ripple 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Text shimmer effect
export function ShimmerText({
  children,
  className = '',
}: HoverEffectProps) {
  return (
    <span
      className={`relative inline-block ${className}`}
      style={{
        background: 'linear-gradient(90deg, #8b5cf6 0%, #ec4899 50%, #8b5cf6 100%)',
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        animation: 'shimmer 2s linear infinite',
      }}
    >
      {children}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </span>
  );
}
