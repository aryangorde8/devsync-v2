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
          className="absolute w-1 h-1 bg-indigo-400/20 rounded-full"
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

export default function PrivacyPolicyPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.privacy-title',
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );
    });
    return () => ctx.revert();
  }, []);

  const sections = [
    {
      title: '1. Information We Collect',
      content: [
        {
          subtitle: 'Personal Information',
          text: 'When you create an account, we collect:',
          items: ['Name (first and last name)', 'Email address', 'Password (encrypted)', 'Profile information you choose to provide']
        },
        {
          subtitle: 'Portfolio Content',
          text: 'Information you add to your portfolio:',
          items: ['Projects, skills, and work experience', 'Education and certifications', 'Social media links', 'Profile photos and project images']
        },
        {
          subtitle: 'Automatically Collected Information',
          items: ['Device information and browser type', 'IP address and location data', 'Usage patterns and analytics', 'Cookies and similar tracking technologies']
        }
      ]
    },
    {
      title: '2. How We Use Your Information',
      text: 'We use the information we collect to:',
      items: ['Provide, maintain, and improve our Service', 'Create and manage your account', 'Process and display your portfolio content', 'Send you important updates and notifications', 'Analyze usage to improve user experience', 'Protect against fraud and unauthorized access', 'Comply with legal obligations']
    },
    {
      title: '3. Information Sharing',
      text: 'We do not sell your personal information. We may share your information:',
      items: ['Public Portfolio: Information you make public in your portfolio is visible to anyone', 'Service Providers: With third parties who help us operate the Service', 'Legal Requirements: When required by law or to protect our rights', 'Business Transfers: In connection with a merger or acquisition']
    },
    {
      title: '4. Data Security',
      text: 'We implement industry-standard security measures to protect your information, including:',
      items: ['Encryption of data in transit (HTTPS/TLS)', 'Secure password hashing', 'Regular security audits', 'Access controls and authentication'],
      note: 'However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security of your data.'
    },
    {
      title: '5. Your Rights',
      text: 'You have the right to:',
      items: ['Access: Request a copy of your personal data', 'Correction: Update or correct inaccurate information', 'Deletion: Request deletion of your account and data', 'Export: Download your portfolio data', 'Opt-out: Unsubscribe from marketing communications']
    },
    {
      title: '6. Cookies',
      text: 'We use cookies and similar technologies to enhance your experience. You can control cookie preferences through your browser settings. Essential cookies are required for the Service to function properly.'
    },
    {
      title: '7. Third-Party Links',
      text: 'Our Service may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.'
    },
    {
      title: "8. Children's Privacy",
      text: 'Our Service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.'
    },
    {
      title: '9. International Users',
      text: 'If you access the Service from outside the United States, your information may be transferred to and processed in the United States or other countries. By using the Service, you consent to such transfers.'
    },
    {
      title: '10. Changes to This Policy',
      text: 'We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last Updated" date. Your continued use of the Service after changes constitutes acceptance of the updated policy.'
    },
    {
      title: '11. Contact Us',
      text: 'If you have questions about this Privacy Policy or our data practices, please contact us at:',
      contacts: [
        { label: 'Email', value: 'privacy@devsync.io' },
        { label: 'Support', value: 'support@devsync.io' }
      ]
    }
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0a0a0f] text-white relative">
      {/* Progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-cyan-500 z-50 origin-left"
        style={{ scaleX }}
      />

      <FloatingParticles />

      {/* Gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[150px]"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div 
          className="absolute -bottom-40 -right-40 w-[400px] h-[400px] bg-cyan-600/20 rounded-full blur-[150px]"
          animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
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
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">DevSync</span>
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
          <div className="absolute -inset-px bg-gradient-to-r from-indigo-500/20 via-transparent to-cyan-500/20 rounded-3xl opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          <h1 className="privacy-title text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              Privacy Policy
            </span>
          </h1>
          
          <p className="text-white/50 mb-12">
            <strong className="text-white/70">Last Updated:</strong> January 26, 2026
          </p>

          <AnimatedSection>
            <p className="text-white/70 text-lg leading-relaxed mb-12">
              At DevSync, we take your privacy seriously. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our portfolio management platform.
            </p>
          </AnimatedSection>

          <div className="space-y-12">
            {sections.map((section, sectionIndex) => (
              <AnimatedSection key={section.title} delay={sectionIndex * 0.05}>
                <div className="group">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 flex items-center justify-center text-sm text-indigo-400 border border-indigo-500/20">
                      {sectionIndex + 1}
                    </span>
                    {section.title.replace(/^\d+\.\s*/, '')}
                  </h2>
                  
                  {section.text && (
                    <p className="text-white/60 mb-4">{section.text}</p>
                  )}

                  {section.content && section.content.map((sub, subIndex) => (
                    <div key={subIndex} className="mb-6 ml-4 pl-4 border-l border-white/10">
                      {sub.subtitle && (
                        <h3 className="text-lg font-medium text-indigo-300 mb-2">{sub.subtitle}</h3>
                      )}
                      {sub.text && <p className="text-white/60 mb-2">{sub.text}</p>}
                      {sub.items && (
                        <ul className="space-y-2">
                          {sub.items.map((item, i) => (
                            <li key={i} className="text-white/50 flex items-start gap-2">
                              <span className="text-indigo-400 mt-1">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}

                  {section.items && (
                    <ul className="space-y-2 ml-4">
                      {section.items.map((item, i) => (
                        <li key={i} className="text-white/50 flex items-start gap-2">
                          <span className="text-indigo-400 mt-1">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.note && (
                    <p className="text-white/40 mt-4 italic">{section.note}</p>
                  )}

                  {section.contacts && (
                    <div className="mt-4 space-y-2">
                      {section.contacts.map((contact, i) => (
                        <p key={i} className="text-white/60">
                          <strong className="text-white/70">{contact.label}:</strong>{' '}
                          <a 
                            href={`mailto:${contact.value}`} 
                            className="text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            {contact.value}
                          </a>
                        </p>
                      ))}
                    </div>
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
