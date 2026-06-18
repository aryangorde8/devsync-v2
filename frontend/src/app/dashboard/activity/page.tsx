'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from '@/lib/gsap';

interface ActivityItem {
  id: number;
  action: string;
  action_display: string;
  model_name: string;
  object_id: number | null;
  object_repr: string;
  changes: Record<string, unknown>;
  created_at: string;
  time_ago: string;
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
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
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const url = filter === 'all' 
        ? '/portfolio/activity/' 
        : `/portfolio/activity/by_model/?model=${filter}`;
      const response = await api.get<{ results?: ActivityItem[] } | ActivityItem[]>(url);
      const data = response as { results?: ActivityItem[] } | ActivityItem[];
      setActivities('results' in data && data.results ? data.results : Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30';
      case 'update':
        return 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30';
      case 'delete':
        return 'from-red-500/20 to-rose-500/20 text-red-400 border-red-500/30';
      case 'login':
        return 'from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30';
      case 'export':
        return 'from-yellow-500/20 to-amber-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'from-white/10 to-white/5 text-white/60 border-white/20';
    }
  };

  const getActionGlow = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-500/30';
      case 'update': return 'bg-blue-500/30';
      case 'delete': return 'bg-red-500/30';
      case 'login': return 'bg-purple-500/30';
      case 'export': return 'bg-yellow-500/30';
      default: return 'bg-white/10';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        );
      case 'update':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case 'delete':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        );
      case 'login':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        );
      case 'export':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const modelFilters = [
    { value: 'all', label: 'All Activity' },
    { value: 'project', label: 'Projects' },
    { value: 'skill', label: 'Skills' },
    { value: 'experience', label: 'Experience' },
    { value: 'education', label: 'Education' },
    { value: 'certification', label: 'Certifications' },
  ];

  return (
    <div ref={containerRef} className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]" />
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="floating-particle absolute w-1 h-1 bg-indigo-400/30 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white">Activity Log</h1>
            <p className="text-white/50 mt-1">Track all changes to your portfolio</p>
          </div>
          
          {/* Filter Dropdown */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2.5 bg-white/[0.05] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
          >
            {modelFilters.map((f) => (
              <option key={f.value} value={f.value} className="bg-[#1a1a25]">
                {f.label}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Activity Timeline */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="animate-pulse"
              >
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/5 rounded w-3/4" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/30 via-purple-500/20 to-transparent" />

            {/* Activity items */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {activities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="relative flex gap-4 group"
                  >
                    {/* Timeline dot with glow */}
                    <div className="relative z-10">
                      <div className={`absolute inset-0 ${getActionGlow(activity.action)} rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                      <div
                        className={`relative flex items-center justify-center w-10 h-10 rounded-full border bg-gradient-to-br ${getActionColor(activity.action)}`}
                      >
                        {getActionIcon(activity.action)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 relative">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                      <div className="relative rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-4 transition-all duration-300 group-hover:bg-white/[0.05] group-hover:border-white/[0.15]">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full border bg-gradient-to-r ${getActionColor(activity.action)}`}
                              >
                                {activity.action_display}
                              </span>
                              <span className="text-white font-medium">{activity.model_name}</span>
                            </div>
                            {activity.object_repr && (
                              <p className="text-white/50 mt-1">{activity.object_repr}</p>
                            )}
                            {activity.changes && Object.keys(activity.changes).length > 0 && (
                              <div className="mt-2 text-sm text-white/50">
                                <details className="cursor-pointer">
                                  <summary className="hover:text-white/70 transition-colors">View changes</summary>
                                  <pre className="mt-2 p-3 bg-black/30 rounded-xl text-xs overflow-x-auto border border-white/5">
                                    {JSON.stringify(activity.changes, null, 2)}
                                  </pre>
                                </details>
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-white/40 whitespace-nowrap">
                            {activity.time_ago}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl opacity-50 blur-xl" />
            <div className="relative rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-12 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-6 border border-white/10"
              >
                <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-semibold text-white mb-3"
              >
                No activity yet
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/50"
              >
                Start making changes to see your activity history
              </motion.p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
