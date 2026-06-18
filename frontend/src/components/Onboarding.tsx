'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const steps = [
    {
      title: 'Welcome to DevSync! 🎉',
      subtitle: "Let's set up your portfolio in just a few steps",
      content: (
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
            <svg className="w-12 h-12 text-on-surface" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <p className="text-on-surface-secondary max-w-md mx-auto">
            DevSync is your professional portfolio platform. Showcase your projects, 
            skills, and experience to stand out to potential employers.
          </p>
        </div>
      ),
    },
    {
      title: 'Complete Your Profile 👤',
      subtitle: 'Add your personal information',
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-card rounded-lg border border-outline">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h4 className="text-on-surface font-medium">Profile Photo</h4>
              <p className="text-sm text-on-surface-secondary">Upload a professional photo</p>
            </div>
            <div className="ml-auto">
              <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded">Recommended</span>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-card rounded-lg border border-outline">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h4 className="text-on-surface font-medium">Job Title</h4>
              <p className="text-sm text-on-surface-secondary">e.g., Full Stack Developer</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-card rounded-lg border border-outline">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </div>
            <div>
              <h4 className="text-on-surface font-medium">Bio</h4>
              <p className="text-sm text-on-surface-secondary">Write a short introduction</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Add Your First Project 🚀',
      subtitle: 'Showcase your best work',
      content: (
        <div className="space-y-4">
          <p className="text-on-surface-secondary text-center mb-6">
            Projects are the heart of your portfolio. Add your best work to impress potential employers.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-card rounded-lg border border-outline text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h4 className="text-on-surface font-medium mb-1">Manual Entry</h4>
              <p className="text-xs text-on-surface-secondary">Add project details manually</p>
            </div>
            <div className="p-4 bg-card rounded-lg border border-outline text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-surface-tertiary rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-on-surface" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </div>
              <h4 className="text-on-surface font-medium mb-1">Import from GitHub</h4>
              <p className="text-xs text-on-surface-secondary">Auto-import repositories</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Add Your Skills 💡',
      subtitle: 'Show what you can do',
      content: (
        <div className="space-y-4">
          <p className="text-on-surface-secondary text-center mb-6">
            Add your technical skills to help recruiters find you.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {['React', 'TypeScript', 'Python', 'Node.js', 'Docker', 'AWS', 'PostgreSQL', 'Git'].map((skill) => (
              <span
                key={skill}
                className="px-4 py-2 bg-card rounded-full text-on-surface-secondary border border-outline hover:border-purple-500 hover:text-purple-400 cursor-pointer transition-colors"
              >
                {skill}
              </span>
            ))}
          </div>
          <p className="text-center text-sm text-on-surface-tertiary mt-4">
            Click to add popular skills or add your own
          </p>
        </div>
      ),
    },
    {
      title: "You're All Set! 🎊",
      subtitle: 'Your portfolio is ready to shine',
      content: (
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
            <svg className="w-12 h-12 text-on-surface" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-on-surface-secondary max-w-md mx-auto mb-6">
            Your portfolio is ready! You can now share it with the world or continue 
            customizing it from your dashboard.
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-on-surface">∞</div>
              <div className="text-xs text-on-surface-secondary">Projects</div>
            </div>
            <div className="w-px h-10 bg-surface-tertiary" />
            <div className="text-center">
              <div className="text-3xl font-bold text-on-surface">∞</div>
              <div className="text-xs text-on-surface-secondary">Skills</div>
            </div>
            <div className="w-px h-10 bg-surface-tertiary" />
            <div className="text-center">
              <div className="text-3xl font-bold text-on-surface">Free</div>
              <div className="text-xs text-on-surface-secondary">Forever</div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 150);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-background rounded-2xl shadow-2xl border border-outline overflow-hidden">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-card">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Skip button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-secondary hover:text-on-surface transition-colors"
        >
          <span className="text-sm">Skip</span>
        </button>

        {/* Content */}
        <div className="p-8 pt-12">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-purple-500'
                    : index < currentStep
                    ? 'bg-purple-500/50'
                    : 'bg-surface-tertiary'
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <div className={`transition-opacity duration-150 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            <h2 className="text-2xl font-bold text-on-surface text-center mb-2">
              {steps[currentStep].title}
            </h2>
            <p className="text-on-surface-secondary text-center mb-8">
              {steps[currentStep].subtitle}
            </p>
            {steps[currentStep].content}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-card border-t border-outline flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentStep === 0
                ? 'text-on-surface-tertiary cursor-not-allowed'
                : 'text-on-surface-secondary hover:text-on-surface'
            }`}
          >
            Back
          </button>
          <button
            onClick={nextStep}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white font-medium rounded-lg transition-colors"
          >
            {currentStep === steps.length - 1 ? 'Get Started' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Onboarding checklist component
export function OnboardingChecklist() {
  const router = useRouter();
  const [progress, setProgress] = useState({
    profile: false,
    project: false,
    skill: false,
    experience: false,
    social: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  const checkProgress = async () => {
    try {
      interface ProfileData { first_name?: string; last_name?: string; bio?: string; }
      interface ListResponse<T> { results?: T[]; }
      
      const [profile, projects, skills, experiences, socials] = await Promise.all([
        api.get<ProfileData>('/auth/profile/'),
        api.get<ListResponse<unknown> | unknown[]>('/portfolio/projects/'),
        api.get<ListResponse<unknown> | unknown[]>('/portfolio/skills/'),
        api.get<ListResponse<unknown> | unknown[]>('/portfolio/experiences/'),
        api.get<ListResponse<unknown> | unknown[]>('/portfolio/social-links/'),
      ]);

      const getList = (data: ListResponse<unknown> | unknown[]) => 
        'results' in data && data.results ? data.results : Array.isArray(data) ? data : [];
      
      const projectsList = getList(projects);
      const skillsList = getList(skills);
      const experiencesList = getList(experiences);
      const socialsList = getList(socials);

      // Check if user marked "no experience" in localStorage
      const noExperienceMarked = typeof window !== 'undefined' && localStorage.getItem('devsync_no_experience') === 'true';

      setProgress({
        profile: !!(profile?.first_name && profile?.last_name && profile?.bio),
        project: Array.isArray(projectsList) && projectsList.length > 0,
        skill: Array.isArray(skillsList) && skillsList.length >= 3,
        experience: (Array.isArray(experiencesList) && experiencesList.length > 0) || noExperienceMarked,
        social: Array.isArray(socialsList) && socialsList.length > 0,
      });
    } catch (error) {
      console.error('Failed to check onboarding progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    checkProgress();
  }, []);

  // Refresh when page becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkProgress();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Refresh every 30 seconds while component is mounted
  useEffect(() => {
    const interval = setInterval(() => {
      checkProgress();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const completedCount = Object.values(progress).filter(Boolean).length;
  const totalSteps = Object.keys(progress).length;
  const isComplete = completedCount === totalSteps;

  // Don't show if complete
  if (isComplete || isLoading) return null;

  const steps = [
    {
      key: 'profile',
      title: 'Complete your profile',
      description: 'Add name, bio, and photo',
      icon: '👤',
      href: '/dashboard/settings',
    },
    {
      key: 'project',
      title: 'Add your first project',
      description: 'Showcase your work',
      icon: '🚀',
      href: '/dashboard/projects',
    },
    {
      key: 'skill',
      title: 'Add at least 3 skills',
      description: 'Show your expertise',
      icon: '💡',
      href: '/dashboard/skills',
    },
    {
      key: 'experience',
      title: 'Add work experience',
      description: 'Share your career history',
      icon: '💼',
      href: '/dashboard/experience',
    },
    {
      key: 'social',
      title: 'Connect social profiles',
      description: 'Link GitHub, LinkedIn, etc.',
      icon: '🔗',
      href: '/dashboard/settings',
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-3 px-4 py-3 bg-card rounded-full shadow-lg border border-outline hover:border-purple-500 transition-colors"
        >
          <div className="relative">
            <svg className="w-6 h-6 text-purple-400" viewBox="0 0 36 36">
              <path
                className="text-on-surface-tertiary"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-purple-500"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${(completedCount / totalSteps) * 100}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>
          <span className="text-on-surface font-medium">{completedCount}/{totalSteps}</span>
        </button>
      ) : (
        <div className="w-80 bg-card rounded-xl shadow-2xl border border-outline overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-outline flex items-center justify-between">
            <div>
              <h3 className="text-on-surface font-semibold">Getting Started</h3>
              <p className="text-sm text-on-surface-secondary">{completedCount}/{totalSteps} completed</p>
            </div>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 text-on-surface-secondary hover:text-on-surface"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-surface-tertiary">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${(completedCount / totalSteps) * 100}%` }}
            />
          </div>

          {/* Steps */}
          <div className="p-3 max-h-80 overflow-y-auto">
            {steps.map((step) => {
              const isCompleted = progress[step.key as keyof typeof progress];
              return (
                <button
                  key={step.key}
                  onClick={() => !isCompleted && router.push(step.href)}
                  disabled={isCompleted}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    isCompleted
                      ? 'opacity-50 cursor-default'
                      : 'hover:bg-surface-hover cursor-pointer'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                      isCompleted ? 'bg-green-500/20' : 'bg-surface-tertiary'
                    }`}
                  >
                    {isCompleted ? '✓' : step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`font-medium ${
                        isCompleted ? 'text-on-surface-secondary line-through' : 'text-on-surface'
                      }`}
                    >
                      {step.title}
                    </h4>
                    <p className="text-xs text-on-surface-tertiary truncate">{step.description}</p>
                  </div>
                  {!isCompleted && (
                    <svg className="w-4 h-4 text-on-surface-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default OnboardingModal;
