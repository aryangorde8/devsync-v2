'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const techStack = [
  { name: 'Next.js 15', color: '#000000', bg: 'bg-white' },
  { name: 'TypeScript', color: '#3178C6', bg: 'bg-blue-500/20' },
  { name: 'Tailwind CSS', color: '#06B6D4', bg: 'bg-cyan-500/20' },
  { name: 'Django 5.0', color: '#092E20', bg: 'bg-green-500/20' },
  { name: 'PostgreSQL', color: '#336791', bg: 'bg-blue-600/20' },
  { name: 'Redis', color: '#DC382D', bg: 'bg-red-500/20' },
  { name: 'Docker', color: '#2496ED', bg: 'bg-sky-500/20' },
  { name: 'Gemini AI', color: '#8E75B2', bg: 'bg-purple-500/20' },
];

export default function TechStackSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-6">
            Technology
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-on-surface">
            Built with{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Modern Tech
            </span>
          </h2>
          <p className="mt-6 text-lg text-on-surface-secondary max-w-2xl mx-auto">
            Production-grade architecture following industry best practices
          </p>
        </motion.div>

        {/* Tech stack pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-4"
        >
          {techStack.map((tech, index) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
              whileHover={{ scale: 1.1, y: -5 }}
              className={`px-6 py-3 rounded-full ${tech.bg} border border-indigo-500/20 backdrop-blur-sm cursor-default hover:border-indigo-400/40 transition-colors`}
            >
              <span className="font-medium text-on-surface">{tech.name}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Code preview card */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-20 max-w-3xl mx-auto"
        >
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500" />
            
            <div className="relative rounded-2xl bg-[#0d1117] border border-indigo-500/20 overflow-hidden">
              {/* Window header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-indigo-500/20 bg-indigo-500/5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-4 text-sm text-gray-400">portfolio.tsx</span>
              </div>

              {/* Code content */}
              <pre className="p-6 text-sm overflow-x-auto">
                <code>
                  <span className="text-cyan-400">import</span>
                  <span className="text-gray-300"> {'{'} DevSync {'}'} </span>
                  <span className="text-cyan-400">from</span>
                  <span className="text-green-400"> &apos;@devsync/core&apos;</span>
                  <span className="text-gray-300">;</span>
                  {'\n\n'}
                  <span className="text-cyan-400">export default</span>
                  <span className="text-gray-300"> </span>
                  <span className="text-blue-400">function</span>
                  <span className="text-yellow-300"> Portfolio</span>
                  <span className="text-gray-300">() {'{'}</span>
                  {'\n  '}
                  <span className="text-cyan-400">return</span>
                  <span className="text-gray-300"> (</span>
                  {'\n    '}
                  <span className="text-gray-300">&lt;</span>
                  <span className="text-cyan-400">DevSync</span>
                  {'\n      '}
                  <span className="text-indigo-400">projects</span>
                  <span className="text-gray-300">=</span>
                  <span className="text-gray-300">{'{'}amazing{'}'}</span>
                  {'\n      '}
                  <span className="text-indigo-400">skills</span>
                  <span className="text-gray-300">=</span>
                  <span className="text-gray-300">{'{'}impressive{'}'}</span>
                  {'\n      '}
                  <span className="text-indigo-400">theme</span>
                  <span className="text-gray-300">=</span>
                  <span className="text-green-400">&quot;stunning&quot;</span>
                  {'\n    '}
                  <span className="text-gray-300">/&gt;</span>
                  {'\n  '}
                  <span className="text-gray-300">);</span>
                  {'\n'}
                  <span className="text-gray-300">{'}'}</span>
                </code>
              </pre>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
