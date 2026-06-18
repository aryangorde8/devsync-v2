'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';

interface SearchResult {
  projects: Array<{
    id: number;
    title: string;
    short_description: string;
    status: string;
  }>;
  skills: Array<{
    id: number;
    name: string;
    category_display: string;
  }>;
  experiences: Array<{
    id: number;
    company: string;
    position: string;
  }>;
  education: Array<{
    id: number;
    institution: string;
    degree: string;
  }>;
  certifications: Array<{
    id: number;
    name: string;
    issuing_organization: string;
  }>;
  total: number;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export default function SearchModal({ isOpen, onClose, onNavigate }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open search with Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // Parent component should handle opening
        } else {
          onClose();
        }
      }

      if (isOpen) {
        if (e.key === 'Escape') {
          onClose();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => prev + 1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(0, prev - 1));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleResultClick();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedIndex, results, onClose]);

  // Search with debounce
  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get<SearchResult>(`/portfolio/search/?q=${encodeURIComponent(searchQuery)}`);
      setResults(response);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, search]);

  const handleResultClick = () => {
    if (!results) return;

    const allResults = [
      ...results.projects.map((p) => ({ type: 'project', id: p.id, path: '/dashboard/projects' })),
      ...results.skills.map((s) => ({ type: 'skill', id: s.id, path: '/dashboard/skills' })),
      ...results.experiences.map((e) => ({ type: 'experience', id: e.id, path: '/dashboard/experience' })),
      ...results.education.map((e) => ({ type: 'education', id: e.id, path: '/dashboard/education' })),
      ...results.certifications.map((c) => ({ type: 'certification', id: c.id, path: '/dashboard/certifications' })),
    ];

    if (allResults[selectedIndex]) {
      onNavigate(allResults[selectedIndex].path);
      onClose();
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'project':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        );
      case 'skill':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'experience':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'education':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 14l9-5-9-5-9 5 9 5z" />
            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
          </svg>
        );
      case 'certification':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  let resultIndex = 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-x-0 top-20 mx-auto max-w-2xl p-4">
        <div
          ref={modalRef}
          className="bg-card rounded-xl shadow-2xl border border-outline overflow-hidden"
        >
          {/* Search Input */}
          <div className="flex items-center px-4 border-b border-outline">
            <svg className="w-5 h-5 text-on-surface-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects, skills, experience..."
              className="flex-1 px-4 py-4 bg-transparent text-on-surface placeholder-[var(--input-placeholder)] focus:outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs text-on-surface-secondary bg-surface-tertiary rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500" />
              </div>
            ) : results && results.total > 0 ? (
              <div className="py-2">
                {/* Projects */}
                {results.projects.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-on-surface-secondary uppercase tracking-wider">
                      Projects
                    </div>
                    {results.projects.map((project) => {
                      const currentIndex = resultIndex++;
                      return (
                        <button
                          key={`project-${project.id}`}
                          onClick={() => {
                            setSelectedIndex(currentIndex);
                            onNavigate('/dashboard/projects');
                            onClose();
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-hover ${
                            selectedIndex === currentIndex ? 'bg-surface-hover' : ''
                          }`}
                        >
                          <span className="text-purple-400">{getResultIcon('project')}</span>
                          <div>
                            <div className="text-on-surface font-medium">{project.title}</div>
                            <div className="text-sm text-on-surface-secondary truncate">{project.short_description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Skills */}
                {results.skills.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-on-surface-secondary uppercase tracking-wider">
                      Skills
                    </div>
                    {results.skills.map((skill) => {
                      const currentIndex = resultIndex++;
                      return (
                        <button
                          key={`skill-${skill.id}`}
                          onClick={() => {
                            setSelectedIndex(currentIndex);
                            onNavigate('/dashboard/skills');
                            onClose();
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-hover ${
                            selectedIndex === currentIndex ? 'bg-surface-hover' : ''
                          }`}
                        >
                          <span className="text-green-400">{getResultIcon('skill')}</span>
                          <div>
                            <div className="text-on-surface font-medium">{skill.name}</div>
                            <div className="text-sm text-on-surface-secondary">{skill.category_display}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Experience */}
                {results.experiences.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-on-surface-secondary uppercase tracking-wider">
                      Experience
                    </div>
                    {results.experiences.map((exp) => {
                      const currentIndex = resultIndex++;
                      return (
                        <button
                          key={`exp-${exp.id}`}
                          onClick={() => {
                            setSelectedIndex(currentIndex);
                            onNavigate('/dashboard/experience');
                            onClose();
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-hover ${
                            selectedIndex === currentIndex ? 'bg-surface-hover' : ''
                          }`}
                        >
                          <span className="text-blue-400">{getResultIcon('experience')}</span>
                          <div>
                            <div className="text-on-surface font-medium">{exp.position}</div>
                            <div className="text-sm text-on-surface-secondary">{exp.company}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Education */}
                {results.education.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-on-surface-secondary uppercase tracking-wider">
                      Education
                    </div>
                    {results.education.map((edu) => {
                      const currentIndex = resultIndex++;
                      return (
                        <button
                          key={`edu-${edu.id}`}
                          onClick={() => {
                            setSelectedIndex(currentIndex);
                            onNavigate('/dashboard/education');
                            onClose();
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-hover ${
                            selectedIndex === currentIndex ? 'bg-surface-hover' : ''
                          }`}
                        >
                          <span className="text-yellow-400">{getResultIcon('education')}</span>
                          <div>
                            <div className="text-on-surface font-medium">{edu.degree}</div>
                            <div className="text-sm text-on-surface-secondary">{edu.institution}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Certifications */}
                {results.certifications.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-on-surface-secondary uppercase tracking-wider">
                      Certifications
                    </div>
                    {results.certifications.map((cert) => {
                      const currentIndex = resultIndex++;
                      return (
                        <button
                          key={`cert-${cert.id}`}
                          onClick={() => {
                            setSelectedIndex(currentIndex);
                            onNavigate('/dashboard/certifications');
                            onClose();
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-hover ${
                            selectedIndex === currentIndex ? 'bg-surface-hover' : ''
                          }`}
                        >
                          <span className="text-cyan-400">{getResultIcon('certification')}</span>
                          <div>
                            <div className="text-on-surface font-medium">{cert.name}</div>
                            <div className="text-sm text-on-surface-secondary">{cert.issuing_organization}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : query.length >= 2 && !isLoading ? (
              <div className="py-8 text-center text-on-surface-secondary">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No results found for &quot;{query}&quot;</p>
              </div>
            ) : (
              <div className="py-8 text-center text-on-surface-secondary">
                <p>Type at least 2 characters to search</p>
                <div className="mt-4 flex justify-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-surface-tertiary rounded">↑</kbd>
                    <kbd className="px-1.5 py-0.5 bg-surface-tertiary rounded">↓</kbd>
                    to navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-surface-tertiary rounded">Enter</kbd>
                    to select
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-outline flex items-center justify-between text-xs text-on-surface-secondary">
            <span>
              {results ? `${results.total} result${results.total !== 1 ? 's' : ''}` : 'Search your portfolio'}
            </span>
            <span className="hidden sm:inline">
              Press <kbd className="px-1.5 py-0.5 bg-surface-tertiary rounded mx-1">⌘K</kbd> to toggle
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
