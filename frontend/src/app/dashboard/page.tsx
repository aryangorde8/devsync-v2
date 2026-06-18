'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { portfolioApi, DashboardStats, Project } from '@/lib/portfolio';
import { motion, useInView } from 'framer-motion';
import { gsap, ScrollTrigger } from '@/lib/gsap';

// Animated counter component
function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    
    // If value is 0, just set it directly
    if (value === 0) {
      setCount(0);
      return;
    }
    
    let start = 0;
    const end = value;
    const incrementTime = (duration * 1000) / end;
    
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, Math.max(incrementTime, 20));

    return () => clearInterval(timer);
  }, [inView, value, duration]);

  return <span ref={ref}>{count}</span>;
}

// Apple-style stat card
function StatCard({ 
  label, 
  value, 
  icon, 
  gradient, 
  delay = 0,
  isLoading 
}: { 
  label: string; 
  value: number; 
  icon: React.ReactNode; 
  gradient: string;
  delay?: number;
  isLoading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="group relative"
    >
      {/* Glow effect */}
      <div className={`absolute -inset-1 ${gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-60 transition-all duration-500`} />
      
      <div className="relative rounded-3xl bg-[#0f1419]/80 backdrop-blur-2xl border border-indigo-500/20 p-8 hover:border-indigo-400/40 transition-all duration-500 overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className={`absolute inset-0 ${gradient} opacity-[0.05] group-hover:opacity-[0.12] transition-opacity duration-500`} />
        
        {/* Animated background shapes */}
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
        
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-300/70 uppercase tracking-wider font-mono">{label}</p>
            <p className="mt-3 text-5xl font-semibold text-indigo-100 tracking-tight">
              {isLoading ? (
                <span className="inline-block w-12 h-12 bg-indigo-500/10 rounded-lg animate-pulse" />
              ) : (
                <AnimatedCounter value={value} />
              )}
            </p>
          </div>
          <div className={`p-3 rounded-2xl ${gradient} shadow-lg shadow-indigo-500/20`}>
            {icon}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Quick action card with Apple-style animation
function QuickActionCard({ 
  href, 
  icon, 
  label, 
  gradient,
  delay = 0 
}: { 
  href: string; 
  icon: React.ReactNode; 
  label: string; 
  gradient: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={href} className="group block">
        <motion.div 
          whileHover={{ scale: 1.03, y: -3 }}
          whileTap={{ scale: 0.98 }}
          className="relative rounded-2xl bg-[#0f1419]/60 backdrop-blur-xl border border-indigo-500/20 p-5 hover:border-cyan-400/40 transition-all duration-300 overflow-hidden"
        >
          {/* Gradient glow on hover */}
          <div className={`absolute inset-0 ${gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
          
          <div className="relative flex items-center gap-4">
            <div className={`p-3 rounded-xl ${gradient} shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300`}>
              {icon}
            </div>
            <span className="font-medium text-indigo-200/90 group-hover:text-cyan-300 transition-colors font-mono text-sm">
              {label}
            </span>
            <svg 
              className="w-5 h-5 text-indigo-400/30 ml-auto group-hover:text-cyan-400 group-hover:translate-x-1 transition-all duration-300" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

// Project card with Apple-style design
function ProjectCard({ project, delay = 0 }: { project: Project; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href="/dashboard/projects" className="group block">
        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          className="relative rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 hover:border-white/20 transition-all duration-500 overflow-hidden h-full"
        >
          {/* Animated gradient border */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-indigo-500/20 via-cyan-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute inset-[1px] rounded-3xl bg-[#0a0a0f]" />
          
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                  {project.title[0]}
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-xs text-white/40">
                    {project.status === 'completed' ? '✓ Completed' : '◐ In Progress'}
                  </p>
                </div>
              </div>
              {project.is_featured && (
                <div className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                  Featured
                </div>
              )}
            </div>
            
            <p className="text-sm text-white/50 line-clamp-2 mb-4 min-h-[40px]">
              {project.short_description || 'No description provided'}
            </p>
            
            <div className="flex flex-wrap gap-2">
              {project.technologies.slice(0, 4).map((tech) => (
                <span 
                  key={tech} 
                  className="text-xs px-3 py-1 rounded-full bg-white/5 text-white/60 border border-white/10"
                >
                  {tech}
                </span>
              ))}
              {project.technologies.length > 4 && (
                <span className="text-xs px-3 py-1 rounded-full bg-white/5 text-white/40">
                  +{project.technologies.length - 4}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  // GSAP scroll animations
  useEffect(() => {
    if (!containerRef.current) return;
    
    const ctx = gsap.context(() => {
      // Parallax effect on scroll
      gsap.to('.dashboard-hero-bg', {
        yPercent: 50,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoadingData(true);
      setError(null);
      const [statsData, projectsData] = await Promise.all([
        portfolioApi.getStats(),
        portfolioApi.getProjects(),
      ]);
      setStats(statsData);
      setRecentProjects(projectsData.slice(0, 6));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Calculate in-progress: total minus completed (never negative) - v2
  const totalProjects = stats?.total_projects ?? 0;
  const completedProjects = stats?.completed_projects ?? 0;
  // Simple subtraction: if 4 projects and 4 completed = 0 in progress
  const inProgressProjects = totalProjects - completedProjects > 0 ? totalProjects - completedProjects : 0;
  const statsData = [
    {
      label: 'Projects',
      value: totalProjects,
      icon: (
        <svg className="h-6 w-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      gradient: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    },
    {
      label: 'Completed',
      value: completedProjects,
      icon: (
        <svg className="h-6 w-6 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    },
    {
      label: 'In Progress',
      value: inProgressProjects,
      icon: (
        <svg className="h-6 w-6 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'bg-gradient-to-br from-cyan-500 to-blue-600',
    },
    {
      label: 'Skills',
      value: stats?.total_skills ?? 0,
      icon: (
        <svg className="h-6 w-6 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      gradient: 'bg-gradient-to-br from-cyan-500 to-blue-600',
    },
  ];

  const quickActions = [
    { href: '/dashboard/projects', icon: <svg className="w-5 h-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>, label: 'Projects', gradient: 'bg-indigo-500' },
    { href: '/dashboard/experience', icon: <svg className="w-5 h-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>, label: 'Experience', gradient: 'bg-blue-500' },
    { href: '/dashboard/education', icon: <svg className="w-5 h-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>, label: 'Education', gradient: 'bg-cyan-500' },
    { href: '/dashboard/certifications', icon: <svg className="w-5 h-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>, label: 'Certifications', gradient: 'bg-emerald-500' },
    { href: '/dashboard/resume', icon: <svg className="w-5 h-5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, label: 'Resume Builder', gradient: 'bg-amber-500' },
    { href: '/dashboard/ai-assistant', icon: <svg className="w-5 h-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, label: 'AI Assistant', gradient: 'bg-cyan-500' },
  ];

  return (
    <div ref={containerRef} className="min-h-screen text-white overflow-x-hidden">

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <div className="flex items-center gap-4 mb-4">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="h-20 w-20 rounded-3xl bg-gradient-to-br from-indigo-500 via-cyan-500 to-blue-500 flex items-center justify-center text-3xl font-bold text-white shadow-2xl shadow-indigo-500/40 overflow-hidden neon-border"
            >
              {user.avatar ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={user.avatar} alt={user.first_name || 'Profile'} className="w-full h-full object-cover" />
              ) : (
                (user.first_name?.[0] || user.email[0]).toUpperCase()
              )}
            </motion.div>
            <div>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-indigo-300/60 text-lg font-mono uppercase tracking-wider text-sm"
              >
                // WELCOME BACK
              </motion.p>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-200 via-cyan-200 to-blue-200 bg-clip-text text-transparent"
              >
                {user.first_name || user.email.split('@')[0]}
              </motion.h1>
            </div>
          </div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-slate-400 text-lg max-w-2xl font-light"
          >
            Your developer portfolio is <span className="text-cyan-400">active</span>. System status: <span className="text-emerald-400">operational</span>.
          </motion.p>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-400">{error}</span>
            </div>
            <button
              onClick={loadDashboardData}
              className="px-4 py-2 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-16">
          {statsData.map((stat, index) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              gradient={stat.gradient}
              delay={0.1 * index}
              isLoading={isLoadingData}
            />
          ))}
        </div>

        {/* Quick Actions Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mb-16"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold text-white">Quick Actions</h2>
              <p className="text-white/40 mt-1">Jump to any section of your portfolio</p>
            </div>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action, index) => (
              <QuickActionCard
                key={action.href}
                href={action.href}
                icon={action.icon}
                label={action.label}
                gradient={action.gradient}
                delay={0.6 + index * 0.05}
              />
            ))}
          </div>
          
          {/* View Portfolio CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mt-6"
          >
            <a
              href={`/portfolio/${user?.email?.split('@')[0] || 'portfolio'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center gap-3 w-full p-6 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-cyan-500/20 to-blue-500/20 border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                View Public Portfolio
              </span>
              <svg className="w-5 h-5 text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </motion.div>
        </motion.div>

        {/* Recent Projects Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold text-white">Recent Projects</h2>
              <p className="text-white/40 mt-1">Your latest work and creations</p>
            </div>
            <Link 
              href="/dashboard/projects" 
              className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              View all
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          {isLoadingData ? (
            <div className="flex justify-center py-16">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full"
              />
            </div>
          ) : recentProjects.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 rounded-3xl bg-white/5 border border-white/10"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
              <p className="text-white/40 mb-6">Start showcasing your work by adding your first project</p>
              <Link
                href="/dashboard/projects"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create your first project
              </Link>
            </motion.div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recentProjects.map((project, index) => (
                <ProjectCard key={project.id} project={project} delay={0.8 + index * 0.1} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Profile Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-16"
        >
          <div className="rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 p-8 overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 rounded-full blur-3xl" />
            
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-indigo-500 via-cyan-500 to-blue-500 flex items-center justify-center text-4xl font-bold text-white shadow-2xl shadow-indigo-500/30 overflow-hidden">
                  {user.avatar ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={user.avatar} alt={user.first_name || 'Profile'} className="w-full h-full object-cover" />
                  ) : (
                    (user.first_name?.[0] || user.email[0]).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {user.first_name && user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user.email.split('@')[0]}
                  </h3>
                  <p className="text-white/50">{user.email}</p>
                  {user.title && (
                    <p className="text-indigo-400 font-medium mt-1">{user.title}</p>
                  )}
                  {user.github_username && (
                    <a
                      href={`https://github.com/${user.github_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                      </svg>
                      @{user.github_username}
                    </a>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                <Link
                  href="/dashboard/settings"
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all duration-300 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Edit Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-white/70 hover:text-white font-medium transition-all duration-300 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
