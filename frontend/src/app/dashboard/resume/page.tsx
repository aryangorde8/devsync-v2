'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { gsap } from '@/lib/gsap';
import api from '@/lib/api';

interface ResumeData {
  personal: {
    name: string;
    email: string;
    title: string;
    bio: string;
    github: string;
    linkedin: string;
    portfolio: string;
  };
  skills: Array<{ id: number; name: string; category: string; category_display: string; proficiency: number }>;
  experience: Array<{
    id: number;
    company: string;
    position: string;
    type_display: string;
    location: string;
    description: string;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
  }>;
  education: Array<{
    id: number;
    institution: string;
    degree: string;
    field_of_study: string;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
    grade: string;
  }>;
  certifications: Array<{
    id: number;
    name: string;
    issuing_organization: string;
    issue_date: string;
    credential_url: string;
  }>;
  projects: Array<{
    id: number;
    title: string;
    short_description: string;
    technologies: string[];
    github_url: string;
    live_url: string;
  }>;
}

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const WarningIcon = () => (
  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

export default function ResumePage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  // GSAP floating particles animation
  useEffect(() => {
    if (!containerRef.current) return;
    
    const ctx = gsap.context(() => {
      const particles = containerRef.current?.querySelectorAll('.floating-particle');
      particles?.forEach((particle, i) => {
        gsap.to(particle, {
          y: 'random(-20, 20)',
          x: 'random(-10, 10)',
          duration: 'random(3, 5)',
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.2,
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
      loadResumeData();
    }
  }, [isAuthenticated]);

  const loadResumeData = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<ResumeData>('/portfolio/resume/');
      setResumeData(data);
    } catch (err) {
      setError('Failed to load resume data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://devsync-api-25hv.onrender.com/api/v1'}/portfolio/resume/download/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to download');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resume.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download PDF');
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      const data = await api.get('/portfolio/export/');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'portfolio-data.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export data');
      console.error(err);
    }
  };

  // Calculate completeness (experience is optional - not required for students/freshers)
  const getCompleteness = () => {
    if (!resumeData) return { score: 0, items: [] };
    
    // Check if user marked "no experience" - this counts as complete
    const noExperienceMarked = typeof window !== 'undefined' && localStorage.getItem('devsync_no_experience') === 'true';
    const hasExperience = resumeData.experience.length >= 1 || noExperienceMarked;
    
    const items = [
      { name: 'Basic Info', complete: !!resumeData.personal.name && !!resumeData.personal.email },
      { name: 'Professional Title', complete: !!resumeData.personal.title },
      { name: 'Bio/Summary', complete: !!resumeData.personal.bio },
      { name: 'Skills (3+)', complete: resumeData.skills.length >= 3 },
      { name: 'Experience', complete: hasExperience },
      { name: 'Education (1+)', complete: resumeData.education.length >= 1 },
      { name: 'Projects (1+)', complete: resumeData.projects.length >= 1 },
      { name: 'GitHub Profile', complete: !!resumeData.personal.github },
      { name: 'LinkedIn Profile', complete: !!resumeData.personal.linkedin },
    ];
    
    const completed = items.filter(i => i.complete).length;
    return { score: Math.round((completed / items.length) * 100), items };
  };

  const completeness = getCompleteness();

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-rose-500/30 animate-ping" />
            <div className="absolute inset-0 rounded-full border-2 border-t-rose-500 border-r-orange-500 border-b-transparent border-l-transparent animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-t-transparent border-r-transparent border-b-orange-500 border-l-rose-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <p className="mt-6 text-white/50">Loading resume...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="floating-particle absolute w-1 h-1 rounded-full bg-rose-400/30"
            style={{
              left: `${10 + i * 12}%`,
              top: `${15 + (i % 4) * 20}%`,
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="relative z-10 bg-white/[0.02] backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-white/50 hover:text-white transition-colors">
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl font-bold text-white">Resume Builder</h1>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExportJSON}
                className="flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white border border-white/[0.08] rounded-xl hover:bg-white/[0.05] transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Export JSON
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-orange-500 text-white px-4 py-2 rounded-xl transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-rose-500/30"
              >
                <DownloadIcon />
                {isDownloading ? 'Generating...' : 'Download PDF'}
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Completeness & Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Completeness Score */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500/20 to-orange-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
              <div className="relative rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 transition-all duration-300 group-hover:bg-white/[0.05]">
                <h2 className="text-lg font-semibold text-white mb-4">Resume Completeness</h2>
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-white/10"
                    />
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="url(#progressGradient)"
                      strokeWidth="12"
                      fill="none"
                      initial={{ strokeDasharray: '0 352' }}
                      animate={{ strokeDasharray: `${completeness.score * 3.52} 352` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="#f97316" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white"
                  >
                    {completeness.score}%
                  </motion.span>
                </div>
                <div className="space-y-2">
                  {completeness.items.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-2 text-sm"
                    >
                      {item.complete ? <CheckIcon /> : <WarningIcon />}
                      <span className={item.complete ? 'text-white/50' : 'text-amber-400'}>
                        {item.name}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500/20 to-orange-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
              <div className="relative rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 transition-all duration-300 group-hover:bg-white/[0.05]">
                <h2 className="text-lg font-semibold text-white mb-4">Improve Your Resume</h2>
                <div className="space-y-2">
                  {[
                    { href: '/dashboard/settings', label: '+ Add Profile Info' },
                    { href: '/dashboard/experience', label: '+ Add Experience' },
                    { href: '/dashboard/education', label: '+ Add Education' },
                    { href: '/dashboard/projects', label: '+ Add Projects' },
                    { href: '/dashboard/certifications', label: '+ Add Certifications' },
                  ].map((link, i) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        href={link.href}
                        className="block px-4 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-white/50 hover:text-white transition-all border border-transparent hover:border-white/[0.08]"
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Resume Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500/20 to-orange-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Preview Header */}
                <div className="bg-gradient-to-r from-rose-500 to-orange-500 px-8 py-6 text-white">
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-bold"
                  >
                    {resumeData?.personal.name || 'Your Name'}
                  </motion.h2>
                  {resumeData?.personal.title && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="text-rose-100 mt-1"
                    >
                      {resumeData.personal.title}
                    </motion.p>
                  )}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-wrap gap-4 mt-3 text-sm text-rose-100"
                  >
                    {resumeData?.personal.email && <span>{resumeData.personal.email}</span>}
                    {resumeData?.personal.github && (
                      <span>github.com/{resumeData.personal.github}</span>
                    )}
                    {resumeData?.personal.linkedin && <span>LinkedIn</span>}
                  </motion.div>
                </div>

                <div className="p-8 space-y-6 text-gray-800">
                  {/* Summary */}
                  {resumeData?.personal.bio && (
                    <motion.section
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <h3 className="text-lg font-bold text-rose-500 border-b border-rose-200 pb-1 mb-3">
                        Professional Summary
                      </h3>
                      <p className="text-gray-600 leading-relaxed">{resumeData.personal.bio}</p>
                    </motion.section>
                  )}

                  {/* Experience */}
                  {resumeData?.experience && resumeData.experience.length > 0 && (
                    <motion.section
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <h3 className="text-lg font-bold text-rose-500 border-b border-rose-200 pb-1 mb-3">
                        Work Experience
                      </h3>
                      <div className="space-y-4">
                        {resumeData.experience.map((exp) => (
                          <div key={exp.id}>
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold">{exp.position}</h4>
                                <p className="text-rose-500">{exp.company}</p>
                              </div>
                              <span className="text-sm text-gray-500">
                                {exp.start_date?.slice(0, 7)} - {exp.is_current ? 'Present' : exp.end_date?.slice(0, 7)}
                              </span>
                            </div>
                            {exp.description && (
                              <p className="text-gray-600 text-sm mt-1">{exp.description}</p>
                            )}
                        </div>
                      ))}
                    </div>
                  </motion.section>
                )}

                {/* Education */}
                {resumeData?.education && resumeData.education.length > 0 && (
                  <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h3 className="text-lg font-bold text-rose-500 border-b border-rose-200 pb-1 mb-3">
                      Education
                    </h3>
                    <div className="space-y-3">
                      {resumeData.education.map((edu) => (
                        <div key={edu.id}>
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">{edu.degree}</h4>
                              <p className="text-rose-500">{edu.institution} - {edu.field_of_study}</p>
                            </div>
                            <span className="text-sm text-gray-500">
                              {edu.start_date?.slice(0, 7)} - {edu.is_current ? 'Present' : edu.end_date?.slice(0, 7)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.section>
                )}

                {/* Skills */}
                {resumeData?.skills && resumeData.skills.length > 0 && (
                  <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <h3 className="text-lg font-bold text-rose-500 border-b border-rose-200 pb-1 mb-3">
                      Technical Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {resumeData.skills.map((skill, i) => (
                        <motion.span
                          key={skill.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 + i * 0.03 }}
                          className="px-3 py-1 bg-gradient-to-r from-rose-100 to-orange-100 text-rose-700 rounded-full text-sm"
                        >
                          {skill.name}
                        </motion.span>
                      ))}
                    </div>
                  </motion.section>
                )}

                {/* Projects */}
                {resumeData?.projects && resumeData.projects.length > 0 && (
                  <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <h3 className="text-lg font-bold text-rose-500 border-b border-rose-200 pb-1 mb-3">
                      Notable Projects
                    </h3>
                    <div className="space-y-3">
                      {resumeData.projects.map((project) => (
                        <div key={project.id}>
                          <h4 className="font-semibold">{project.title}</h4>
                          {project.technologies?.length > 0 && (
                            <p className="text-sm text-gray-500">{project.technologies.join(', ')}</p>
                          )}
                          {project.short_description && (
                            <p className="text-gray-600 text-sm mt-1">{project.short_description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.section>
                )}

                {/* Certifications */}
                {resumeData?.certifications && resumeData.certifications.length > 0 && (
                  <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <h3 className="text-lg font-bold text-rose-500 border-b border-rose-200 pb-1 mb-3">
                      Certifications
                    </h3>
                    <div className="space-y-2">
                      {resumeData.certifications.map((cert) => (
                        <div key={cert.id} className="flex justify-between">
                          <span className="font-medium">{cert.name}</span>
                          <span className="text-gray-500">{cert.issuing_organization}</span>
                        </div>
                      ))}
                    </div>
                  </motion.section>
                )}
              </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
