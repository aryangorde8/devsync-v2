'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { portfolioApi, Experience, CreateExperienceData } from '@/lib/portfolio';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from '@/lib/gsap';

// Icons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const BriefcaseIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const experienceTypes = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'freelance', label: 'Freelance' },
];

export default function ExperiencePage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [noExperience, setNoExperience] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // GSAP animations
  useEffect(() => {
    if (!containerRef.current) return;
    
    const ctx = gsap.context(() => {
      // Floating particles
      const particles = containerRef.current?.querySelectorAll('.page-particle');
      particles?.forEach((particle, i) => {
        gsap.to(particle, {
          y: 'random(-30, 30)',
          x: 'random(-20, 20)',
          opacity: 'random(0.2, 0.5)',
          duration: 'random(4, 6)',
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.3
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Load noExperience preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('devsync_no_experience');
    if (saved === 'true') {
      setNoExperience(true);
    }
  }, []);

  // Save noExperience preference to localStorage
  const handleNoExperience = (value: boolean) => {
    setNoExperience(value);
    if (value) {
      localStorage.setItem('devsync_no_experience', 'true');
    } else {
      localStorage.removeItem('devsync_no_experience');
    }
  };
  const [formData, setFormData] = useState<CreateExperienceData>({
    company: '',
    position: '',
    type: 'full_time',
    location: '',
    description: '',
    start_date: '',
    end_date: '',
    is_current: false,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadExperiences();
    }
  }, [isAuthenticated]);

  const loadExperiences = async () => {
    try {
      setIsLoading(true);
      const data = await portfolioApi.getExperiences();
      setExperiences(data);
    } catch (err) {
      setError('Failed to load experiences');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const submitData = {
        ...formData,
        end_date: formData.is_current ? undefined : formData.end_date,
      };

      if (editingExperience) {
        await portfolioApi.updateExperience(editingExperience.id, submitData);
        setSuccess('Experience updated successfully!');
      } else {
        await portfolioApi.createExperience(submitData);
        setSuccess('Experience added successfully!');
      }

      setShowModal(false);
      setEditingExperience(null);
      resetForm();
      loadExperiences();
    } catch (err) {
      setError('Failed to save experience');
      console.error(err);
    }
  };

  const handleEdit = (experience: Experience) => {
    setEditingExperience(experience);
    setFormData({
      company: experience.company,
      position: experience.position,
      type: experience.type,
      location: experience.location || '',
      description: experience.description || '',
      start_date: experience.start_date,
      end_date: experience.end_date || '',
      is_current: experience.is_current,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this experience?')) return;

    try {
      await portfolioApi.deleteExperience(id);
      setSuccess('Experience deleted successfully!');
      loadExperiences();
    } catch (err) {
      setError('Failed to delete experience');
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({
      company: '',
      position: '',
      type: 'full_time',
      location: '',
      description: '',
      start_date: '',
      end_date: '',
      is_current: false,
    });
  };

  const openAddModal = () => {
    setEditingExperience(null);
    resetForm();
    setShowModal(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  if (authLoading || isLoading) {
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

  return (
    <div ref={containerRef} className="min-h-screen relative">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[200px]" />
        
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="page-particle absolute w-2 h-2 rounded-full"
            style={{
              background: `linear-gradient(135deg, rgba(139, 92, 246, 0.5), rgba(236, 72, 153, 0.5))`,
              left: `${15 + i * 15}%`,
              top: `${10 + i * 12}%`,
              opacity: 0.3,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent"
            >
              Work Experience
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-2 text-white/50"
            >
              Showcase your professional journey
            </motion.p>
          </div>
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openAddModal}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-6 py-3 rounded-2xl font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
          >
            <PlusIcon />
            Add Experience
          </motion.button>
        </motion.div>

        {/* Status Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 rounded-2xl bg-gradient-to-r from-red-500/20 to-red-500/5 border border-red-500/30 p-4 flex items-center gap-3 text-red-400"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 p-4 flex items-center gap-3 text-emerald-400"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Experience Timeline */}
        {experiences.length === 0 && !noExperience ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 rounded-3xl blur-xl" />
            <div className="relative rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-12 md:p-16 text-center overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />
              
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center mb-6 border border-white/10">
                  <BriefcaseIcon className="w-8 h-8 text-white/60" />
                </div>
              </motion.div>
              
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-semibold text-white mb-3"
              >
                No experience added yet
              </motion.h3>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/50 mb-8 max-w-md mx-auto"
              >
                Add your work history to showcase your professional journey.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={openAddModal}
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-6 py-3 rounded-2xl font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                >
                  <PlusIcon />
                  Add Your First Experience
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNoExperience(true)}
                  className="inline-flex items-center justify-center gap-2 bg-white/[0.05] border border-white/[0.1] text-white/70 px-6 py-3 rounded-2xl font-medium hover:bg-white/[0.1] hover:border-white/[0.2] transition-all"
                >
                  I don&apos;t have work experience yet
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        ) : experiences.length === 0 && noExperience ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl opacity-50 blur-xl" />
            <div className="relative rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">No work experience? No problem!</h3>
                  <p className="mt-2 text-white/60">
                    You&apos;re just getting started on your professional journey. That&apos;s perfectly fine! 
                    Focus on showcasing your projects, education, certifications, and skills instead.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4">
                    <Link href="/dashboard/projects" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                      Add Projects →
                    </Link>
                    <Link href="/dashboard/education" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                      Add Education →
                    </Link>
                    <Link href="/dashboard/certifications" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                      Add Certifications →
                    </Link>
                  </div>
                  <button
                    onClick={() => handleNoExperience(false)}
                    className="mt-4 text-sm text-white/40 hover:text-white/60 transition-colors"
                  >
                    Actually, I do have experience to add
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {experiences.map((exp, index) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="group relative"
              >
                {/* Glow effect on hover */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                
                <div className="relative rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 transition-all duration-300 group-hover:bg-white/[0.05] group-hover:border-white/[0.15]">
                  {/* Timeline connector */}
                  {index < experiences.length - 1 && (
                    <div className="absolute left-8 top-full w-0.5 h-4 bg-gradient-to-b from-indigo-500/30 to-transparent z-10" />
                  )}

                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      {/* Icon */}
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center border border-white/10"
                      >
                        <BriefcaseIcon className="w-6 h-6 text-indigo-400" />
                      </motion.div>

                      {/* Content */}
                      <div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors">{exp.position}</h3>
                        <p className="text-indigo-400 font-medium">{exp.company}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-white/50">
                          <span className="px-2 py-1 rounded-lg bg-white/[0.05] border border-white/[0.08]">
                            {experienceTypes.find(t => t.value === exp.type)?.label || exp.type}
                          </span>
                          {exp.location && <span className="text-white/40">{exp.location}</span>}
                          <span className="text-white/40">
                            {formatDate(exp.start_date)} - {exp.is_current ? 'Present' : exp.end_date ? formatDate(exp.end_date) : 'N/A'}
                          </span>
                        </div>
                        {exp.description && (
                          <p className="mt-3 text-white/60 whitespace-pre-wrap">{exp.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEdit(exp)}
                        className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        title="Edit"
                      >
                        <EditIcon />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(exp.id)}
                        className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                        title="Delete"
                      >
                        <TrashIcon />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => { setShowModal(false); setEditingExperience(null); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none"
            >
              <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto pointer-events-auto rounded-3xl bg-[#0f0f15] border border-white/10">
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                  <h2 className="text-xl font-bold text-white">
                    {editingExperience ? 'Edit Experience' : 'Add Experience'}
                  </h2>
                  <p className="text-white/50 text-sm mt-1">Fill in your work experience details</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Position *</label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      placeholder="e.g. Senior Software Engineer"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Company *</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      placeholder="e.g. Google"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Employment Type *</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                        required
                      >
                        {experienceTypes.map((type) => (
                          <option key={type.value} value={type.value} className="bg-[#1a1a25]">
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Location</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                        placeholder="e.g. San Francisco, CA"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Start Date *</label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all [color-scheme:dark]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        End Date {formData.is_current && '(Current)'}
                      </label>
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all disabled:opacity-40 [color-scheme:dark]"
                        disabled={formData.is_current}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_current"
                      checked={formData.is_current}
                      onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
                      className="w-5 h-5 rounded-lg bg-white/[0.05] border-white/20 text-indigo-500 focus:ring-indigo-500/50 focus:ring-offset-0"
                    />
                    <label htmlFor="is_current" className="text-sm text-white/70">
                      I currently work here
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none"
                      placeholder="Describe your responsibilities and achievements..."
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setShowModal(false); setEditingExperience(null); }}
                      className="px-5 py-2.5 text-white/60 hover:text-white hover:bg-white/[0.05] rounded-xl transition-all"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                    >
                      {editingExperience ? 'Update' : 'Add'} Experience
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
