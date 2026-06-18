'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { portfolioApi, Skill, SocialLink, CreateSkillData, PortfolioTheme, UpdateThemeData } from '@/lib/portfolio';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from '@/lib/gsap';

// Icons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const socialPlatforms = [
  { value: 'github', label: 'GitHub', icon: '🐙' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'twitter', label: 'Twitter/X', icon: '🐦' },
  { value: 'website', label: 'Website', icon: '🌐' },
  { value: 'youtube', label: 'YouTube', icon: '📺' },
  { value: 'devto', label: 'Dev.to', icon: '📝' },
  { value: 'medium', label: 'Medium', icon: '📰' },
  { value: 'stackoverflow', label: 'Stack Overflow', icon: '📚' },
];

const skillCategories = [
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'database', label: 'Database' },
  { value: 'devops', label: 'DevOps' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'design', label: 'Design' },
  { value: 'other', label: 'Other' },
];

const colorPresets = [
  { name: 'Purple', primary: '#9333ea', secondary: '#ec4899', accent: '#a855f7' },
  { name: 'Blue', primary: '#3b82f6', secondary: '#06b6d4', accent: '#60a5fa' },
  { name: 'Green', primary: '#22c55e', secondary: '#84cc16', accent: '#4ade80' },
  { name: 'Orange', primary: '#f97316', secondary: '#ef4444', accent: '#fb923c' },
  { name: 'Teal', primary: '#14b8a6', secondary: '#0891b2', accent: '#2dd4bf' },
];

const fontFamilies = [
  { value: 'inter', label: 'Inter (Modern)' },
  { value: 'roboto', label: 'Roboto (Clean)' },
  { value: 'poppins', label: 'Poppins (Friendly)' },
  { value: 'fira-code', label: 'Fira Code (Developer)' },
  { value: 'playfair', label: 'Playfair Display (Elegant)' },
];

const layoutOptions = [
  { value: 'modern', label: 'Modern', description: 'Clean and minimal design' },
  { value: 'classic', label: 'Classic', description: 'Traditional portfolio layout' },
  { value: 'creative', label: 'Creative', description: 'Bold and expressive style' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, refreshUser } = useAuth();
  const { refreshTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
  }, [authLoading]);

  // Profile form
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    title: '',
    bio: '',
    github_username: '',
    linkedin_url: '',
    portfolio_url: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Cleanup avatar preview URL on unmount
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  // Skills
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState<CreateSkillData>({
    name: '',
    category: 'other',
    proficiency: 50,
  });

  // Social Links
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [newSocialLink, setNewSocialLink] = useState({ platform: 'github', url: '' });

  // Theme
  const [, setTheme] = useState<PortfolioTheme | null>(null);
  const [themeData, setThemeData] = useState<UpdateThemeData>({
    primary_color: '#9333ea',
    secondary_color: '#ec4899',
    accent_color: '#a855f7',
    background_color: '#111827',
    text_color: '#ffffff',
    font_family: 'inter',
    layout: 'modern',
    show_skills: true,
    show_projects: true,
    show_experience: true,
    show_education: true,
    show_certifications: true,
    show_social_links: true,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        title: user.title || '',
        bio: user.bio || '',
        github_username: user.github_username || '',
        linkedin_url: user.linkedin_url || '',
        portfolio_url: user.portfolio_url || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      loadSkills();
      loadSocialLinks();
      loadTheme();
    }
  }, [isAuthenticated]);

  const loadSkills = async () => {
    try {
      const data = await portfolioApi.getSkills();
      setSkills(data);
    } catch (err) {
      console.error('Failed to load skills:', err);
    }
  };

  const loadSocialLinks = async () => {
    try {
      const data = await portfolioApi.getSocialLinks();
      setSocialLinks(data);
    } catch (err) {
      console.error('Failed to load social links:', err);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    
    setUploadingAvatar(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      // Don't set Content-Type header - browser will set it with correct boundary
      await api.patch('/auth/profile/', formData);
      
      await refreshUser();
      setSuccess('Profile picture updated!');
      setAvatarFile(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to upload profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.patch('/auth/profile/', profileData);
      await refreshUser();
      setSuccess('Profile updated successfully!');
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.name.trim()) return;

    try {
      await portfolioApi.createSkill(newSkill);
      setNewSkill({ name: '', category: 'other', proficiency: 50 });
      loadSkills();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to add skill');
    }
  };

  const handleDeleteSkill = async (id: number) => {
    try {
      await portfolioApi.deleteSkill(id);
      loadSkills();
    } catch (err) {
      console.error('Failed to delete skill:', err);
    }
  };

  const handleAddSocialLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSocialLink.url.trim()) return;

    try {
      await portfolioApi.createSocialLink(newSocialLink);
      setNewSocialLink({ platform: 'github', url: '' });
      loadSocialLinks();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to add social link');
    }
  };

  const handleDeleteSocialLink = async (id: number) => {
    try {
      await portfolioApi.deleteSocialLink(id);
      loadSocialLinks();
    } catch (err) {
      console.error('Failed to delete social link:', err);
    }
  };

  const loadTheme = async () => {
    try {
      const data = await portfolioApi.getTheme();
      setTheme(data);
      setThemeData({
        primary_color: data.primary_color || '#9333ea',
        secondary_color: data.secondary_color || '#ec4899',
        accent_color: data.accent_color || '#a855f7',
        background_color: data.background_color || '#111827',
        text_color: data.text_color || '#ffffff',
        font_family: data.font_family || 'inter',
        layout: data.layout || 'modern',
        show_skills: data.show_skills ?? true,
        show_projects: data.show_projects ?? true,
        show_experience: data.show_experience ?? true,
        show_education: data.show_education ?? true,
        show_certifications: data.show_certifications ?? true,
        show_social_links: data.show_social_links ?? true,
      });
    } catch (err) {
      console.error('Failed to load theme:', err);
    }
  };

  const handleThemeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await portfolioApi.updateTheme(themeData);
      setSuccess('Theme updated successfully!');
      loadTheme();
      await refreshTheme(); // Update dashboard colors immediately
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to update theme');
    } finally {
      setIsLoading(false);
    }
  };

  const applyColorPreset = async (preset: typeof colorPresets[0]) => {
    const newThemeData = {
      ...themeData,
      primary_color: preset.primary,
      secondary_color: preset.secondary,
      accent_color: preset.accent,
    };
    setThemeData(newThemeData);
    
    // Auto-save the preset
    try {
      setIsLoading(true);
      await portfolioApi.updateTheme(newThemeData);
      setSuccess(`${preset.name} theme applied!`);
      await refreshTheme(); // Update dashboard colors immediately
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to apply preset:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-cyan-500/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'skills', label: 'Skills', icon: '🛠️' },
    { id: 'social', label: 'Social', icon: '🔗' },
    { id: 'theme', label: 'Theme', icon: '🎨' },
  ];

  return (
    <div ref={containerRef} className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />
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

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="mt-2 text-white/50">Manage your profile and preferences</p>
        </motion.div>

        {/* Status Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-red-400 backdrop-blur-sm"
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 rounded-2xl bg-green-500/10 border border-green-500/30 p-4 text-green-400 backdrop-blur-sm"
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-8 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 rounded-xl border border-white/10"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative flex items-center justify-center gap-2">
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </span>
            </button>
          ))}
        </motion.div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl"
          >
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Profile Picture Section */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                <div className="relative rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 transition-all duration-300 group-hover:bg-white/[0.05]">
                  <h3 className="text-lg font-semibold text-white mb-4">Profile Picture</h3>
                  <div className="flex items-center gap-6">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="relative"
                    >
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center border border-white/20">
                        {avatarPreview || user?.avatar ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={avatarPreview || user?.avatar || ''}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl font-bold text-white">
                            {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                          </span>
                        )}
                      </div>
                    </motion.div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white hover:bg-white/[0.1] cursor-pointer transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Choose Photo
                      </label>
                      {avatarFile && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={handleAvatarUpload}
                          disabled={uploadingAvatar}
                          className="ml-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50"
                        >
                          {uploadingAvatar ? 'Uploading...' : 'Upload'}
                        </motion.button>
                      )}
                      <p className="mt-2 text-sm text-white/40">
                        JPG, PNG or GIF. Max size 5MB.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                <div className="relative rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 space-y-6 transition-all duration-300 group-hover:bg-white/[0.05]">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={profileData.first_name}
                        onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white placeholder-white/30 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profileData.last_name}
                        onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white placeholder-white/30 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Professional Title
                    </label>
                    <input
                      type="text"
                      value={profileData.title}
                      onChange={(e) => setProfileData({ ...profileData, title: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white placeholder-white/30 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                      placeholder="e.g., Full Stack Developer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      rows={4}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white placeholder-white/30 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all resize-none"
                      placeholder="Tell us about yourself..."
                      maxLength={500}
                    />
                    <p className="mt-1 text-sm text-white/40">{profileData.bio.length}/500</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      GitHub URL
                    </label>
                    <input
                      type="url"
                      value={profileData.github_username ? `https://github.com/${profileData.github_username}` : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                      // Extract username from GitHub URL or use as-is if it's just a username
                      let username = value;
                      if (value.includes('github.com/')) {
                        const match = value.match(/github\.com\/([^/\s?#]+)/);
                        username = match ? match[1] : '';
                      } else if (value.startsWith('https://') || value.startsWith('http://')) {
                        username = '';
                      }
                      setProfileData({ ...profileData, github_username: username });
                    }}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white placeholder-white/30 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                      placeholder="https://github.com/your-username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={profileData.linkedin_url}
                      onChange={(e) => setProfileData({ ...profileData, linkedin_url: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white placeholder-white/30 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Portfolio URL
                    </label>
                    <input
                      type="url"
                      value={profileData.portfolio_url}
                      onChange={(e) => setProfileData({ ...profileData, portfolio_url: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white placeholder-white/30 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div className="pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isLoading}
                      className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-3 text-white font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50"
                    >
                      {isLoading ? 'Saving...' : 'Save Profile'}
                    </motion.button>
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl"
          >
            {/* Add Skill Form */}
            <div className="relative group mb-6">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
              <form onSubmit={handleAddSkill} className="relative rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 transition-all duration-300 group-hover:bg-white/[0.05]">
                <h3 className="text-lg font-semibold text-white mb-4">Add New Skill</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Skill Name
                    </label>
                    <input
                      type="text"
                      value={newSkill.name}
                      onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-white placeholder-white/30 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                      placeholder="React, Python, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Category
                    </label>
                    <select
                      value={newSkill.category}
                      onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-white focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                    >
                      {skillCategories.map((cat) => (
                        <option key={cat.value} value={cat.value} className="bg-[#1a1a25]">
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Proficiency ({newSkill.proficiency}%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={newSkill.proficiency}
                      onChange={(e) => setNewSkill({ ...newSkill, proficiency: parseInt(e.target.value) })}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-white font-medium hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
                >
                  <PlusIcon />
                  <span>Add Skill</span>
                </motion.button>
              </form>
            </div>

            {/* Skills List */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
              <div className="relative rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 transition-all duration-300 group-hover:bg-white/[0.05]">
                <h3 className="text-lg font-semibold text-white mb-4">Your Skills</h3>
                {skills.length === 0 ? (
                  <p className="text-white/50">No skills added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {skills.map((skill, index) => (
                      <motion.div
                        key={skill.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-all"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-white">{skill.name}</span>
                            <span className="text-xs px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">
                              {skill.category_display}
                            </span>
                          </div>
                          <div className="mt-2 w-full bg-white/5 rounded-full h-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${skill.proficiency}%` }}
                              transition={{ duration: 0.5, delay: index * 0.05 }}
                              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full"
                            />
                          </div>
                        </div>
                        <div className="ml-4 flex items-center gap-2">
                          <span className="text-sm text-white/50">{skill.proficiency}%</span>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteSkill(skill.id)}
                            className="p-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          >
                            <TrashIcon />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Social Links Tab */}
        {activeTab === 'social' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl"
          >
            {/* Add Social Link Form */}
            <div className="relative group mb-6">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
              <form onSubmit={handleAddSocialLink} className="relative rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 transition-all duration-300 group-hover:bg-white/[0.05]">
                <h3 className="text-lg font-semibold text-white mb-4">Add Social Link</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Platform
                    </label>
                    <select
                      value={newSocialLink.platform}
                      onChange={(e) => setNewSocialLink({ ...newSocialLink, platform: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    >
                      {socialPlatforms.map((platform) => (
                        <option key={platform.value} value={platform.value} className="bg-[#1a1a25]">
                          {platform.icon} {platform.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      URL
                    </label>
                    <input
                      type="url"
                      value={newSocialLink.url}
                      onChange={(e) => setNewSocialLink({ ...newSocialLink, url: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-white placeholder-white/30 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2.5 text-white font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                >
                  <PlusIcon />
                  <span>Add Link</span>
                </motion.button>
              </form>
            </div>

            {/* Social Links List */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
              <div className="relative rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 transition-all duration-300 group-hover:bg-white/[0.05]">
                <h3 className="text-lg font-semibold text-white mb-4">Your Social Links</h3>
                {socialLinks.length === 0 ? (
                  <p className="text-white/50">No social links added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {socialLinks.map((link, index) => {
                      const platform = socialPlatforms.find((p) => p.value === link.platform);
                      return (
                        <motion.div
                          key={link.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{platform?.icon || '🔗'}</span>
                            <div>
                              <p className="font-medium text-white">{platform?.label || link.platform}</p>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                {link.url}
                              </a>
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteSocialLink(link.id)}
                            className="p-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          >
                            <TrashIcon />
                          </motion.button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Theme Tab */}
        {activeTab === 'theme' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl"
          >
            <form onSubmit={handleThemeSubmit} className="space-y-6">
              {/* Color Presets */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                <div className="relative rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 transition-all duration-300 group-hover:bg-white/[0.05]">
                  <h3 className="text-lg font-semibold text-white mb-4">Color Presets</h3>
                  <div className="flex flex-wrap gap-3">
                    {colorPresets.map((preset, index) => (
                      <motion.button
                        key={preset.name}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => applyColorPreset(preset)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.08] transition-all"
                      >
                        <div className="flex -space-x-1">
                          <div
                            className="w-4 h-4 rounded-full border border-white/20"
                            style={{ backgroundColor: preset.primary }}
                          />
                          <div
                            className="w-4 h-4 rounded-full border border-white/20"
                            style={{ backgroundColor: preset.secondary }}
                          />
                          <div
                            className="w-4 h-4 rounded-full border border-white/20"
                            style={{ backgroundColor: preset.accent }}
                          />
                        </div>
                        <span className="text-sm text-white/70">{preset.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom Colors */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                <div className="relative rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 transition-all duration-300 group-hover:bg-white/[0.05]">
                  <h3 className="text-lg font-semibold text-white mb-4">Custom Colors</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        Primary Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeData.primary_color}
                          onChange={(e) => setThemeData({ ...themeData, primary_color: e.target.value })}
                          className="w-10 h-10 rounded-lg cursor-pointer border border-white/10"
                        />
                        <input
                          type="text"
                          value={themeData.primary_color}
                          onChange={(e) => setThemeData({ ...themeData, primary_color: e.target.value })}
                          className="flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-white text-sm focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        Secondary Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                        type="color"
                          value={themeData.secondary_color}
                          onChange={(e) => setThemeData({ ...themeData, secondary_color: e.target.value })}
                          className="w-10 h-10 rounded-lg cursor-pointer border border-white/10"
                        />
                        <input
                          type="text"
                          value={themeData.secondary_color}
                          onChange={(e) => setThemeData({ ...themeData, secondary_color: e.target.value })}
                          className="flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-white text-sm focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        Accent Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeData.accent_color}
                          onChange={(e) => setThemeData({ ...themeData, accent_color: e.target.value })}
                          className="w-10 h-10 rounded-lg cursor-pointer border border-white/10"
                        />
                        <input
                          type="text"
                          value={themeData.accent_color}
                          onChange={(e) => setThemeData({ ...themeData, accent_color: e.target.value })}
                          className="flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-white text-sm focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Typography & Layout */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                <div className="relative rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 transition-all duration-300 group-hover:bg-white/[0.05]">
                  <h3 className="text-lg font-semibold text-white mb-4">Typography & Layout</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        Font Family
                      </label>
                      <select
                        value={themeData.font_family}
                        onChange={(e) => setThemeData({ ...themeData, font_family: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                      >
                        {fontFamilies.map((font) => (
                          <option key={font.value} value={font.value} className="bg-[#1a1a25]">
                            {font.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        Layout Style
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {layoutOptions.map((layout, index) => (
                          <motion.button
                            key={layout.value}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => setThemeData({ ...themeData, layout: layout.value })}
                            className={`p-4 rounded-xl border text-left transition-all ${
                              themeData.layout === layout.value
                                ? 'border-indigo-500/50 bg-indigo-500/20'
                                : 'border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                            }`}
                          >
                            <p className="font-medium text-white">{layout.label}</p>
                            <p className="text-xs text-white/50 mt-1">{layout.description}</p>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visibility Settings */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                <div className="relative rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 transition-all duration-300 group-hover:bg-white/[0.05]">
                  <h3 className="text-lg font-semibold text-white mb-4">Section Visibility</h3>
                  <p className="text-sm text-white/50 mb-4">Choose which sections to display on your public portfolio</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { key: 'show_projects', label: 'Projects' },
                      { key: 'show_skills', label: 'Skills' },
                      { key: 'show_experience', label: 'Experience' },
                      { key: 'show_education', label: 'Education' },
                      { key: 'show_certifications', label: 'Certifications' },
                      { key: 'show_social_links', label: 'Social Links' },
                    ].map((item, index) => (
                      <motion.label
                        key={item.key}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] cursor-pointer hover:bg-white/[0.05] hover:border-white/10 transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={themeData[item.key as keyof UpdateThemeData] as boolean}
                          onChange={(e) =>
                            setThemeData({ ...themeData, [item.key]: e.target.checked })
                          }
                          className="w-4 h-4 rounded bg-white/[0.05] border-white/20 text-indigo-500 focus:ring-indigo-500/50"
                        />
                        <span className="text-white">{item.label}</span>
                      </motion.label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                <div className="relative rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 transition-all duration-300 group-hover:bg-white/[0.05]">
                  <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
                  <div
                    className="rounded-2xl p-6 border border-white/10"
                    style={{ backgroundColor: themeData.background_color }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center"
                        style={{ backgroundColor: themeData.primary_color }}
                      >
                        {user?.avatar ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-bold">
                            {user?.first_name?.charAt(0) || 'U'}
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold" style={{ color: themeData.text_color }}>
                          {user?.first_name && user?.last_name 
                            ? `${user.first_name} ${user.last_name}` 
                            : user?.first_name || user?.username || 'Your Name'}
                        </h4>
                        <p className="text-sm" style={{ color: themeData.secondary_color }}>
                          {user?.title || 'Full Stack Developer'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span
                        className="px-3 py-1 rounded-full text-sm text-white"
                        style={{ backgroundColor: themeData.primary_color }}
                      >
                        React
                      </span>
                      <span
                        className="px-3 py-1 rounded-full text-sm text-white"
                        style={{ backgroundColor: themeData.secondary_color }}
                      >
                        Python
                      </span>
                      <span
                        className="px-3 py-1 rounded-full text-sm text-white"
                        style={{ backgroundColor: themeData.accent_color }}
                      >
                        Node.js
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 py-3.5 text-white font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Theme Settings'}
              </motion.button>
            </form>
          </motion.div>
        )}
      </main>
    </div>
  );
}
