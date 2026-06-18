'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import CyberpunkHero from '@/components/CyberpunkHero';
import FeaturesSection from '@/components/FeaturesSection';
import TechStackSection from '@/components/TechStackSection';
import {
  ScrollProgress,
} from '@/components/animations';

// Dynamic import for 3D to avoid SSR issues
const Interactive3D = dynamic(
  () => import('@/components/animations/Interactive3D').then((mod) => mod.Interactive3D),
  { ssr: false }
);

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Scroll Progress */}
      <ScrollProgress color="#6366f1" height={3} />

      {/* Navigation */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#0a0e1a]/80 border-b border-indigo-500/20"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2.5 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/devsync-48.png" alt="DevSync" className="h-9 w-9 rounded-xl group-hover:scale-110 transition-transform" />
              <span className="text-xl font-bold text-indigo-100">DevSync</span>
            </Link>
            <div className="flex items-center space-x-3">
              <Link
                href="/login"
                className="text-slate-300 hover:text-indigo-300 transition-colors px-4 py-2 rounded-xl hover:bg-indigo-500/10"
              >
                Sign In
              </Link>
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl text-white font-medium text-sm overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  <span className="relative z-10">Get Started</span>
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <CyberpunkHero />

      {/* Features Section */}
      <FeaturesSection />

      {/* Tech Stack Section */}
      <TechStackSection />

      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-cyan-600/10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/20 rounded-full blur-[150px]" />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="container mx-auto px-6 relative z-10 text-center"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-indigo-100">
            Ready to showcase your{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              work?
            </span>
          </h2>
          <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto">
            Join thousands of developers who are already using DevSync to build stunning portfolios.
          </p>
          <div className="mt-10">
            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative px-8 py-4 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-lg font-semibold text-lg text-white overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                <span className="relative z-10 flex items-center gap-2">
                  Start Building Free
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-indigo-500/20 py-12 bg-[#0a0e1a]/50 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/devsync-48.png" alt="DevSync" className="h-8 w-8 rounded-lg" />
              <span className="text-lg font-bold text-indigo-100">DevSync</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-slate-400 hover:text-indigo-300 transition-colors text-sm">Privacy</Link>
              <Link href="/terms" className="text-slate-400 hover:text-indigo-300 transition-colors text-sm">Terms</Link>
              <a href="https://github.com/aryangorde8/Devsync" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-300 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
            <p className="text-slate-400 text-sm font-mono">
              &copy; {new Date().getFullYear()} DevSync. Built with ❤️ for developers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
