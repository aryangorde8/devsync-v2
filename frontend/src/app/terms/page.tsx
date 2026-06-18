'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useEffect } from 'react';
import { gsap } from '@/lib/gsap';

// Floating particles
function FloatingParticles() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-cyan-400/20 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -80, 0],
            x: [0, Math.random() * 40 - 20, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 8 + Math.random() * 6,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Animated section
function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function TermsOfServicePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.terms-title',
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );
    });
    return () => ctx.revert();
  }, []);

  const sections = [
    {
      title: '1. Acceptance of Terms',
      text: 'By accessing or using DevSync ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.'
    },
    {
      title: '2. Description of Service',
      text: 'DevSync is a portfolio management platform that allows developers to create, manage, and share their professional portfolios, including projects, skills, work experience, education, and certifications.'
    },
    {
      title: '3. User Accounts',
      items: [
        'You must provide accurate and complete information when creating an account.',
        'You are responsible for maintaining the security of your account credentials.',
        'You must notify us immediately of any unauthorized use of your account.',
        'You must be at least 13 years old to use this Service.'
      ]
    },
    {
      title: '4. User Content',
      text: 'You retain ownership of all content you submit to DevSync. By submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content solely for the purpose of operating and improving the Service.',
      subtext: 'You agree not to submit content that:',
      items: [
        'Violates any applicable laws or regulations',
        'Infringes on intellectual property rights of others',
        'Contains malicious code or harmful content',
        'Is false, misleading, or fraudulent'
      ]
    },
    {
      title: '5. Acceptable Use',
      text: 'You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:',
      items: [
        'Use the Service in any way that violates applicable laws',
        'Attempt to gain unauthorized access to the Service or other accounts',
        'Interfere with or disrupt the integrity of the Service',
        'Use automated systems to access the Service without permission'
      ]
    },
    {
      title: '6. Intellectual Property',
      text: 'The Service and its original content, features, and functionality are owned by DevSync and are protected by international copyright, trademark, and other intellectual property laws.'
    },
    {
      title: '7. Termination',
      text: 'We reserve the right to terminate or suspend your account at any time, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.'
    },
    {
      title: '8. Disclaimer of Warranties',
      text: 'The Service is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.'
    },
    {
      title: '9. Limitation of Liability',
      text: 'In no event shall DevSync be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Service.'
    },
    {
      title: '10. Changes to Terms',
      text: 'We reserve the right to modify these Terms at any time. We will notify users of significant changes by posting the new Terms on this page and updating the "Last Updated" date.'
    },
    {
      title: '11. Contact Us',
      text: 'If you have any questions about these Terms of Service, please contact us at:',
      contact: 'support@devsync.io'
    }
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0a0a0f] text-white relative">
      {/* Progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 z-50 origin-left"
        style={{ scaleX }}
      />

      <FloatingParticles />

      {/* Gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[150px]"
          animate={{ x: [0, -50, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div 
          className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[150px]"
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl"
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/devsync-48.png" alt="DevSync" className="w-8 h-8 rounded-lg group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">DevSync</span>
          </Link>
          <motion.div whileHover={{ x: -3 }} transition={{ type: 'spring', stiffness: 400 }}>
            <Link
              href="/register"
              className="text-white/50 hover:text-white text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Register
            </Link>
          </motion.div>
        </div>
      </motion.header>

      {/* Content */}
      <main className="container mx-auto px-6 py-16 max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-8 md:p-12 overflow-hidden relative"
        >
          {/* Card glow */}
          <div className="absolute -inset-px bg-gradient-to-r from-cyan-500/20 via-transparent to-blue-500/20 rounded-3xl opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          <h1 className="terms-title text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
              Terms of Service
            </span>
          </h1>
          
          <p className="text-white/50 mb-12">
            <strong className="text-white/70">Last Updated:</strong> January 26, 2026
          </p>

          <div className="space-y-10">
            {sections.map((section, sectionIndex) => (
              <AnimatedSection key={section.title} delay={sectionIndex * 0.05}>
                <div className="group">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-sm text-cyan-400 border border-cyan-500/20">
                      {sectionIndex + 1}
                    </span>
                    {section.title.replace(/^\d+\.\s*/, '')}
                  </h2>
                  
                  {section.text && (
                    <p className="text-white/60 mb-4">{section.text}</p>
                  )}

                  {section.subtext && (
                    <p className="text-white/60 mb-2">{section.subtext}</p>
                  )}

                  {section.items && (
                    <ul className="space-y-2 ml-4">
                      {section.items.map((item, i) => (
                        <li key={i} className="text-white/50 flex items-start gap-2">
                          <span className="text-cyan-400 mt-1">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.contact && (
                    <p className="mt-4">
                      <a 
                        href={`mailto:${section.contact}`} 
                        className="text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        {section.contact}
                      </a>
                    </p>
                  )}
                </div>
              </AnimatedSection>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 mt-12 relative z-10">
        <div className="container mx-auto px-6 text-center text-white/30">
          <p>© {new Date().getFullYear()} DevSync. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
