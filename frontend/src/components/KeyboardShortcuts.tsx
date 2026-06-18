'use client';

import React, { useState, useEffect } from 'react';

interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: KeyboardShortcut[] = [
  { keys: ['⌘', 'K'], description: 'Open search', category: 'Navigation' },
  { keys: ['⌘', '/'], description: 'Show keyboard shortcuts', category: 'Navigation' },
  { keys: ['G', 'D'], description: 'Go to Dashboard', category: 'Navigation' },
  { keys: ['G', 'P'], description: 'Go to Projects', category: 'Navigation' },
  { keys: ['G', 'S'], description: 'Go to Skills', category: 'Navigation' },
  { keys: ['G', 'E'], description: 'Go to Experience', category: 'Navigation' },
  { keys: ['G', 'M'], description: 'Go to Messages', category: 'Navigation' },
  { keys: ['N', 'P'], description: 'New Project', category: 'Actions' },
  { keys: ['N', 'S'], description: 'New Skill', category: 'Actions' },
  { keys: ['⌘', 'Enter'], description: 'Save form', category: 'Actions' },
  { keys: ['Esc'], description: 'Close modal / Cancel', category: 'Actions' },
];

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = [...new Set(shortcuts.map((s) => s.category))];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-x-0 top-20 mx-auto max-w-lg p-4">
        <div className="bg-card rounded-xl shadow-2xl border border-outline overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline">
            <h2 className="text-lg font-semibold text-on-surface">Keyboard Shortcuts</h2>
            <button
              onClick={onClose}
              className="p-1 text-on-surface-secondary hover:text-on-surface rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            {categories.map((category) => (
              <div key={category} className="mb-6 last:mb-0">
                <h3 className="text-xs font-semibold text-on-surface-secondary uppercase tracking-wider mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts
                    .filter((s) => s.category === category)
                    .map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2"
                      >
                        <span className="text-on-surface-secondary">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, i) => (
                            <React.Fragment key={i}>
                              <kbd className="px-2 py-1 text-xs font-semibold text-on-surface-secondary bg-surface-tertiary rounded border border-outline">
                                {key}
                              </kbd>
                              {i < shortcut.keys.length - 1 && (
                                <span className="text-on-surface-tertiary text-xs mx-0.5">+</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-outline bg-card">
            <p className="text-xs text-on-surface-secondary text-center">
              Press <kbd className="px-1 py-0.5 text-xs bg-surface-tertiary rounded mx-1">⌘/</kbd> to toggle this dialog
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useKeyboardShortcuts(router: { push: (path: string) => void }) {
  const [showSearch, setShowSearch] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    let keySequence = '';
    let keyTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Cmd/Ctrl + K: Open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch((prev) => !prev);
        return;
      }

      // Cmd/Ctrl + /: Show shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
        return;
      }

      // Key sequences for navigation
      clearTimeout(keyTimeout);
      keySequence += e.key.toUpperCase();
      
      keyTimeout = setTimeout(() => {
        keySequence = '';
      }, 500);

      // G + D: Go to Dashboard
      if (keySequence === 'GD') {
        router.push('/dashboard');
        keySequence = '';
      }
      // G + P: Go to Projects
      else if (keySequence === 'GP') {
        router.push('/dashboard/projects');
        keySequence = '';
      }
      // G + S: Go to Skills
      else if (keySequence === 'GS') {
        router.push('/dashboard/skills');
        keySequence = '';
      }
      // G + E: Go to Experience
      else if (keySequence === 'GE') {
        router.push('/dashboard/experience');
        keySequence = '';
      }
      // G + M: Go to Messages
      else if (keySequence === 'GM') {
        router.push('/dashboard/messages');
        keySequence = '';
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return {
    showSearch,
    setShowSearch,
    showShortcuts,
    setShowShortcuts,
  };
}

export default KeyboardShortcutsModal;
