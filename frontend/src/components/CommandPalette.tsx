'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  shortcut?: string[];
  section: string;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Command definitions
  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      subtitle: 'View your portfolio overview',
      icon: <HomeIcon />,
      shortcut: ['G', 'D'],
      section: 'Navigation',
      action: () => router.push('/dashboard'),
      keywords: ['home', 'main', 'overview'],
    },
    {
      id: 'nav-projects',
      title: 'Go to Projects',
      subtitle: 'Manage your portfolio projects',
      icon: <FolderIcon />,
      shortcut: ['G', 'P'],
      section: 'Navigation',
      action: () => router.push('/dashboard/projects'),
      keywords: ['work', 'portfolio'],
    },
    {
      id: 'nav-skills',
      title: 'Go to Skills',
      subtitle: 'Manage your technical skills',
      icon: <CodeIcon />,
      shortcut: ['G', 'S'],
      section: 'Navigation',
      action: () => router.push('/dashboard/skills'),
      keywords: ['abilities', 'technologies'],
    },
    {
      id: 'nav-experience',
      title: 'Go to Experience',
      subtitle: 'Manage work experience',
      icon: <BriefcaseIcon />,
      shortcut: ['G', 'E'],
      section: 'Navigation',
      action: () => router.push('/dashboard/experience'),
      keywords: ['work', 'jobs', 'career'],
    },
    {
      id: 'nav-education',
      title: 'Go to Education',
      subtitle: 'Manage educational background',
      icon: <AcademicIcon />,
      section: 'Navigation',
      action: () => router.push('/dashboard/education'),
      keywords: ['school', 'degree', 'university'],
    },
    {
      id: 'nav-certifications',
      title: 'Go to Certifications',
      subtitle: 'Manage your certifications',
      icon: <CertificateIcon />,
      section: 'Navigation',
      action: () => router.push('/dashboard/certifications'),
      keywords: ['credentials', 'certificates'],
    },
    {
      id: 'nav-analytics',
      title: 'Go to Analytics',
      subtitle: 'View portfolio analytics',
      icon: <ChartIcon />,
      section: 'Navigation',
      action: () => router.push('/dashboard/analytics'),
      keywords: ['stats', 'metrics', 'views'],
    },
    {
      id: 'nav-messages',
      title: 'Go to Messages',
      subtitle: 'View contact messages',
      icon: <MailIcon />,
      shortcut: ['G', 'M'],
      section: 'Navigation',
      action: () => router.push('/dashboard/messages'),
      keywords: ['inbox', 'contacts'],
    },
    {
      id: 'nav-settings',
      title: 'Go to Settings',
      subtitle: 'Manage your account settings',
      icon: <SettingsIcon />,
      section: 'Navigation',
      action: () => router.push('/dashboard/settings'),
      keywords: ['preferences', 'account', 'profile'],
    },
    // Actions
    {
      id: 'action-new-project',
      title: 'Create New Project',
      subtitle: 'Add a new portfolio project',
      icon: <PlusIcon />,
      shortcut: ['N', 'P'],
      section: 'Actions',
      action: () => router.push('/dashboard/projects?new=true'),
      keywords: ['add', 'create'],
    },
    {
      id: 'action-new-skill',
      title: 'Add New Skill',
      subtitle: 'Add a new technical skill',
      icon: <PlusIcon />,
      shortcut: ['N', 'S'],
      section: 'Actions',
      action: () => router.push('/dashboard/skills?new=true'),
      keywords: ['add', 'create'],
    },
    {
      id: 'action-import-github',
      title: 'Import from GitHub',
      subtitle: 'Import repositories as projects',
      icon: <GitHubIcon />,
      section: 'Actions',
      action: () => router.push('/dashboard/import'),
      keywords: ['repositories', 'github'],
    },
    {
      id: 'action-download-resume',
      title: 'Download Resume PDF',
      subtitle: 'Generate and download your resume',
      icon: <DownloadIcon />,
      section: 'Actions',
      action: () => router.push('/dashboard/resume'),
      keywords: ['cv', 'pdf', 'export'],
    },
    {
      id: 'action-share',
      title: 'Share Portfolio',
      subtitle: 'Get QR code and share links',
      icon: <ShareIcon />,
      section: 'Actions',
      action: () => router.push('/dashboard/share'),
      keywords: ['qr', 'link', 'social'],
    },
    {
      id: 'action-view-portfolio',
      title: 'View Public Portfolio',
      subtitle: 'Open your public portfolio',
      icon: <ExternalLinkIcon />,
      section: 'Actions',
      action: () => window.open('/portfolio', '_blank'),
      keywords: ['preview', 'public'],
    },
    // Tools
    {
      id: 'tool-activity',
      title: 'Activity Log',
      subtitle: 'View recent activity',
      icon: <ClockIcon />,
      section: 'Tools',
      action: () => router.push('/dashboard/activity'),
      keywords: ['history', 'logs', 'audit'],
    },
    {
      id: 'tool-export',
      title: 'Export Data',
      subtitle: 'Export all your data as JSON',
      icon: <DownloadIcon />,
      section: 'Tools',
      action: async () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://devsync-api-25hv.onrender.com/api/v1';
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${apiUrl}/portfolio/export/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'portfolio-export.json';
        a.click();
      },
      keywords: ['backup', 'download'],
    },
    // Help
    {
      id: 'help-shortcuts',
      title: 'Keyboard Shortcuts',
      subtitle: 'View all keyboard shortcuts',
      icon: <KeyboardIcon />,
      shortcut: ['⌘', '/'],
      section: 'Help',
      action: () => {
        // This will be handled by parent
      },
      keywords: ['keys', 'hotkeys'],
    },
    {
      id: 'help-docs',
      title: 'Documentation',
      subtitle: 'View the documentation',
      icon: <BookIcon />,
      section: 'Help',
      action: () => window.open('/docs', '_blank'),
      keywords: ['guide', 'help'],
    },
  ];

  // Filter commands based on query
  const filteredCommands = query
    ? commands.filter((cmd) => {
        const searchStr = `${cmd.title} ${cmd.subtitle || ''} ${cmd.keywords?.join(' ') || ''}`.toLowerCase();
        return searchStr.includes(query.toLowerCase());
      })
    : commands;

  // Group commands by section
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.section]) {
      acc[cmd.section] = [];
    }
    acc[cmd.section].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  const flatCommands = filteredCommands;

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % flatCommands.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + flatCommands.length) % flatCommands.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (flatCommands[selectedIndex]) {
            flatCommands[selectedIndex].action();
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOpen, flatCommands.length, selectedIndex, onClose]
  );

  // Focus input when opened - reset state using initializer functions instead of setState in effect
  useEffect(() => {
    if (isOpen) {
      // Use setTimeout to avoid setState during render cycle
      const timeoutId = setTimeout(() => {
        setQuery('');
        setSelectedIndex(0);
        inputRef.current?.focus();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  // Add keyboard listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = document.querySelector(`[data-command-index="${selectedIndex}"]`);
    selectedElement?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Command Palette */}
      <div className="fixed inset-x-0 top-[15%] mx-auto max-w-2xl px-4">
        <div className="overflow-hidden rounded-2xl bg-background shadow-2xl ring-1 ring-white/10">
          {/* Search Input */}
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-secondary" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Type a command or search..."
              className="h-14 w-full border-0 bg-transparent pl-12 pr-4 text-on-surface placeholder-[var(--input-placeholder)] focus:outline-none focus:ring-0"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="rounded bg-card px-1.5 py-0.5 text-xs text-on-surface-secondary">
                ESC
              </kbd>
            </div>
          </div>

          {/* Results */}
          <div
            ref={listRef}
            className="max-h-96 overflow-y-auto border-t border-outline p-2"
          >
            {flatCommands.length === 0 ? (
              <div className="px-4 py-14 text-center">
                <p className="text-sm text-on-surface-secondary">No results found for &quot;{query}&quot;</p>
              </div>
            ) : (
              Object.entries(groupedCommands).map(([section, cmds]) => (
                <div key={section}>
                  <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-on-surface-tertiary">
                    {section}
                  </div>
                  {cmds.map((cmd) => {
                    const index = flatCommands.indexOf(cmd);
                    const isSelected = index === selectedIndex;
                    return (
                      <button
                        key={cmd.id}
                        data-command-index={index}
                        onClick={() => {
                          cmd.action();
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                          isSelected
                            ? 'bg-purple-500/20 text-on-surface'
                            : 'text-on-surface-secondary hover:bg-card'
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                            isSelected ? 'bg-purple-500/30' : 'bg-card'
                          }`}
                        >
                          {cmd.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{cmd.title}</div>
                          {cmd.subtitle && (
                            <div className="text-sm text-on-surface-secondary truncate">
                              {cmd.subtitle}
                            </div>
                          )}
                        </div>
                        {cmd.shortcut && (
                          <div className="flex items-center gap-1">
                            {cmd.shortcut.map((key, i) => (
                              <kbd
                                key={i}
                                className="rounded bg-card px-1.5 py-0.5 text-xs text-on-surface-secondary"
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-outline px-4 py-2.5">
            <div className="flex items-center gap-4 text-xs text-on-surface-tertiary">
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-card px-1 py-0.5">↑</kbd>
                <kbd className="rounded bg-card px-1 py-0.5">↓</kbd>
                <span>to navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-card px-1.5 py-0.5">↵</kbd>
                <span>to select</span>
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-on-surface-tertiary">
              <span>DevSync</span>
              <span className="text-purple-400">⌘</span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Keyboard shortcut hook
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    setIsOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}

// Icons
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const HomeIcon = () => (
  <svg className="h-5 w-5 text-on-surface-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const FolderIcon = () => (
  <svg className="h-5 w-5 text-on-surface-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const CodeIcon = () => (
  <svg className="h-5 w-5 text-on-surface-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg className="h-5 w-5 text-on-surface-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const AcademicIcon = () => (
  <svg className="h-5 w-5 text-on-surface-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M12 14l9-5-9-5-9 5 9 5z" />
    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
  </svg>
);

const CertificateIcon = () => (
  <svg className="h-5 w-5 text-on-surface-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="h-5 w-5 text-on-surface-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const MailIcon = () => (
  <svg className="h-5 w-5 text-on-surface-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="h-5 w-5 text-on-surface-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="h-5 w-5 text-on-surface-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const GitHubIcon = () => (
  <svg className="h-5 w-5 text-on-surface-secondary" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

const DownloadIcon = () => (
  <svg className="h-5 w-5 text-on-surface-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const ShareIcon = () => (
  <svg className="h-5 w-5 text-on-surface-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg className="h-5 w-5 text-on-surface-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const ClockIcon = () => (
  <svg className="h-5 w-5 text-on-surface-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const KeyboardIcon = () => (
  <svg className="h-5 w-5 text-on-surface-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
  </svg>
);

const BookIcon = () => (
  <svg className="h-5 w-5 text-on-surface-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

export default CommandPalette;
