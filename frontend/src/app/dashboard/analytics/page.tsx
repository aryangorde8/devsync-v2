'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { gsap } from '@/lib/gsap';

interface AnalyticsData {
  total_profile_views: number;
  total_project_views: number;
  views_today: number;
  views_this_week: number;
  views_this_month: number;
  top_projects: { id: number; title: string; view_count: number }[];
  views_by_day: { date: string; views: number }[];
  referrers: { referrer: string; count: number }[];
  devices: Record<string, number>;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // GSAP floating particles animation
  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      const particles = containerRef.current?.querySelectorAll('.floating-particle');
      particles?.forEach((particle) => {
        gsap.to(particle, {
          y: 'random(-20, 20)',
          x: 'random(-10, 10)',
          duration: 'random(3, 5)',
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      });
    }, containerRef);
    return () => ctx.revert();
  }, [isLoading]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAnalytics();
    }
  }, [isAuthenticated]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<AnalyticsData>('/portfolio/analytics/');
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-teal-500/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </motion.div>
      </div>
    );
  }

  const maxViews = Math.max(...(analytics?.views_by_day.map(d => d.views) || [1]), 1);

  const stats = [
    { label: 'Total Views', value: (analytics?.total_profile_views || 0) + (analytics?.total_project_views || 0), icon: '👁️', color: 'from-indigo-500 to-purple-500' },
    { label: 'Today', value: analytics?.views_today || 0, icon: '📅', color: 'from-blue-500 to-cyan-500' },
    { label: 'This Week', value: analytics?.views_this_week || 0, icon: '📊', color: 'from-emerald-500 to-teal-500' },
    { label: 'This Month', value: analytics?.views_this_month || 0, icon: '📈', color: 'from-amber-500 to-orange-500' },
    { label: 'Project Views', value: analytics?.total_project_views || 0, icon: '🚀', color: 'from-cyan-500 to-blue-500' },
  ];

  return (
    <div ref={containerRef} className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px]" />
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="floating-particle absolute w-1 h-1 bg-emerald-400/30 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-white/50 mt-1">Track your portfolio performance</p>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="group relative"
            >
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${stat.color} rounded-2xl opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300`} />
              <div className="relative rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-4 transition-all duration-300 group-hover:bg-white/[0.05] group-hover:border-white/[0.15]">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-2xl font-bold text-white"
                >
                  {stat.value.toLocaleString()}
                </motion.div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Views Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="lg:col-span-2 relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
            <div className="relative rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 transition-all duration-300 group-hover:bg-white/[0.05]">
              <h2 className="text-xl font-semibold text-white mb-6">Views (Last 30 Days)</h2>
              <div className="h-64 flex items-end gap-1">
                {analytics?.views_by_day.slice(-30).map((day, i) => (
                  <motion.div
                    key={day.date}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max((day.views / maxViews) * 100, 2)}%` }}
                    transition={{ delay: 0.7 + i * 0.02, duration: 0.4 }}
                    className="flex-1 bg-gradient-to-t from-emerald-500/50 to-teal-500/30 hover:from-emerald-500 hover:to-teal-500 transition-colors rounded-t cursor-pointer relative group/bar"
                  >
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#1a1a25] border border-white/10 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover/bar:opacity-100 whitespace-nowrap pointer-events-none z-10">
                      {new Date(day.date).toLocaleDateString()}: {day.views} views
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-white/40">
                <span>30 days ago</span>
                <span>Today</span>
              </div>
            </div>
          </motion.div>

          {/* Device Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
            <div className="relative rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 transition-all duration-300 group-hover:bg-white/[0.05]">
              <h2 className="text-xl font-semibold text-white mb-6">Devices</h2>
              <div className="space-y-4">
                {Object.entries(analytics?.devices || {}).map(([device, count], i) => {
                  const total = Object.values(analytics?.devices || {}).reduce((a, b) => a + b, 0) || 1;
                  const percentage = Math.round((count / total) * 100);
                  return (
                    <motion.div
                      key={device}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                    >
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white/60 capitalize">
                          {device === 'desktop' && '🖥️ '}
                          {device === 'mobile' && '📱 '}
                          {device === 'tablet' && '📱 '}
                          {device}
                        </span>
                        <span className="text-white">{percentage}%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: 1 + i * 0.1, duration: 0.6 }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                        />
                      </div>
                    </motion.div>
                  );
                })}
                {Object.keys(analytics?.devices || {}).length === 0 && (
                  <p className="text-white/40 text-center py-4">No device data yet</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          {/* Top Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
            <div className="relative rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 transition-all duration-300 group-hover:bg-white/[0.05]">
              <h2 className="text-xl font-semibold text-white mb-6">Top Projects</h2>
              <div className="space-y-3">
                {analytics?.top_projects.map((project, i) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + i * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">#{i + 1}</span>
                      <span className="text-white">{project.title}</span>
                    </div>
                    <span className="text-white/50">{project.view_count} views</span>
                  </motion.div>
                ))}
                {(analytics?.top_projects.length || 0) === 0 && (
                  <p className="text-white/40 text-center py-4">No project views yet</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Top Referrers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
            <div className="relative rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 transition-all duration-300 group-hover:bg-white/[0.05]">
              <h2 className="text-xl font-semibold text-white mb-6">Top Referrers</h2>
              <div className="space-y-3">
                {analytics?.referrers.slice(0, 5).map((ref, i) => (
                  <motion.div
                    key={ref.referrer}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + i * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-colors"
                  >
                    <span className="text-white truncate flex-1 mr-2">
                      {(() => {
                        try {
                          return new URL(ref.referrer).hostname;
                        } catch {
                          return ref.referrer;
                        }
                      })()}
                    </span>
                    <span className="text-white/50">{ref.count} visits</span>
                  </motion.div>
                ))}
                {(analytics?.referrers.length || 0) === 0 && (
                  <p className="text-white/40 text-center py-4">No referrer data yet</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
