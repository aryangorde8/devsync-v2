'use client';

import React, { useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface ImportResult {
  message: string;
  github_username?: string;
  imported: string[];
  skipped: string[];
}

interface GitHubRepository {
  name: string;
  description: string;
  language: string;
  html_url: string;
  homepage: string;
  private: boolean;
  fork: boolean;
  archived: boolean;
  stargazers_count: number;
  updated_at: string;
}

interface PreviewResponse {
  message: string;
  github_username: string;
  total_repositories: number;
  eligible_repositories: number;
  repositories: GitHubRepository[];
}

interface RepoSelection {
  import: boolean;
  showcase: boolean;
  featured: boolean;
}

export default function GitHubImportPage() {
  const [username, setUsername] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [selection, setSelection] = useState<Record<string, RepoSelection>>({});
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Extract username from GitHub URL or return as-is if it's a username
  const extractGitHubUsername = (input: string): string => {
    const trimmed = input.trim();
    if (trimmed.includes('github.com/')) {
      const match = trimmed.match(/github\.com\/([^/\s?#]+)/);
      return match ? match[1] : '';
    }
    return trimmed;
  };

  const handleFetchRepositories = async (e: React.FormEvent) => {
    e.preventDefault();

    const githubUsername = extractGitHubUsername(username);

    if (!githubUsername) {
      setError('Please enter a GitHub username or URL');
      return;
    }

    setIsFetching(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post<PreviewResponse>('/portfolio/github/import/', {
        github_username: githubUsername,
        preview: true,
      });

      const initialSelection: Record<string, RepoSelection> = {};
      response.repositories.forEach((repo) => {
        initialSelection[repo.name] = {
          import: true,
          showcase: true,
          featured: false,
        };
      });

      setPreview(response);
      setSelection(initialSelection);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to fetch repositories');
    } finally {
      setIsFetching(false);
    }
  };

  const setAllImport = (value: boolean) => {
    if (!preview) return;

    const updated: Record<string, RepoSelection> = {};
    preview.repositories.forEach((repo) => {
      const current = selection[repo.name] || {
        import: true,
        showcase: true,
        featured: false,
      };
      updated[repo.name] = {
        ...current,
        import: value,
        showcase: value ? current.showcase : false,
        featured: value ? current.featured : false,
      };
    });
    setSelection(updated);
  };

  const handleRepoSelectionChange = (
    repoName: string,
    field: keyof RepoSelection,
    value: boolean
  ) => {
    setSelection((prev) => {
      const current = prev[repoName] || {
        import: true,
        showcase: true,
        featured: false,
      };

      const next = { ...current, [field]: value };

      if (field === 'import' && !value) {
        next.showcase = false;
        next.featured = false;
      }

      if (field === 'showcase' && !value) {
        next.featured = false;
      }

      if (field === 'featured' && value) {
        next.import = true;
        next.showcase = true;
      }

      return {
        ...prev,
        [repoName]: next,
      };
    });
  };

  const handleImportSelected = async () => {
    const githubUsername = extractGitHubUsername(username);

    if (!githubUsername || !preview) {
      setError('Please fetch repositories first');
      return;
    }

    const selectedRepositories = preview.repositories
      .filter((repo) => selection[repo.name]?.import)
      .map((repo) => ({
        name: repo.name,
        showcase: selection[repo.name]?.showcase ?? true,
        featured: selection[repo.name]?.featured ?? false,
      }));

    if (selectedRepositories.length === 0) {
      setError('Select at least one repository to import');
      return;
    }

    setIsImporting(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post<ImportResult>('/portfolio/github/import/', {
        github_username: githubUsername,
        repositories: selectedRepositories,
      });
      setResult(response);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to import selected repositories');
    } finally {
      setIsImporting(false);
    }
  };

  const selectedCount = preview
    ? preview.repositories.filter((repo) => selection[repo.name]?.import).length
    : 0;

  const showcaseCount = preview
    ? preview.repositories.filter((repo) => selection[repo.name]?.showcase).length
    : 0;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/projects"
            className="inline-flex items-center text-on-surface-secondary hover:text-on-surface mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Projects
          </Link>
          <h1 className="text-3xl font-bold text-on-surface">Import from GitHub</h1>
          <p className="text-on-surface-secondary mt-2">
            Automatically import your public repositories as portfolio projects
          </p>
        </div>

        {/* Import Form */}
        <div className="bg-card rounded-xl p-6 border border-outline">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-on-surface" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-on-surface">GitHub Repository Import</h2>
              <p className="text-sm text-on-surface-secondary">Enter your GitHub username to get started</p>
            </div>
          </div>

          <form onSubmit={handleFetchRepositories} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-on-surface-secondary mb-2">
                GitHub URL or Username
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="https://github.com/username or username"
                    className="w-full px-4 py-3 bg-background border border-outline rounded-lg text-on-surface placeholder-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isFetching}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {isFetching ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Fetching...
                    </>
                  ) : (
                    <>
                      Fetch Repositories
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {preview && (
            <div className="mt-6 rounded-lg border border-outline p-4 bg-card/20">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-on-surface">
                    Found {preview.eligible_repositories} repositories for @{preview.github_username}
                  </h3>
                  <p className="text-xs text-on-surface-secondary mt-1">
                    Selected for import: {selectedCount} | Marked to showcase: {showcaseCount}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAllImport(true)}
                    className="px-3 py-1.5 text-xs rounded-md border border-outline text-on-surface-secondary hover:text-on-surface"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllImport(false)}
                    className="px-3 py-1.5 text-xs rounded-md border border-outline text-on-surface-secondary hover:text-on-surface"
                  >
                    Clear all
                  </button>
                </div>
              </div>

              <div className="max-h-[22rem] overflow-y-auto space-y-2 pr-1">
                {preview.repositories.map((repo) => {
                  const repoState = selection[repo.name] || {
                    import: true,
                    showcase: true,
                    featured: false,
                  };

                  return (
                    <div key={repo.name} className="rounded-lg border border-outline p-3 bg-background/40">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-medium text-on-surface truncate">{repo.name}</p>
                          <p className="text-xs text-on-surface-secondary mt-1 line-clamp-2">
                            {repo.description || 'No description'}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-on-surface-secondary">
                            {repo.language && <span>{repo.language}</span>}
                            <span>★ {repo.stargazers_count}</span>
                            {repo.archived && <span className="text-yellow-400">Archived</span>}
                          </div>
                        </div>

                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-purple-400 hover:text-purple-300 whitespace-nowrap"
                        >
                          Open Repo
                        </a>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-3 text-xs">
                        <label className="flex items-center gap-2 text-on-surface-secondary">
                          <input
                            type="checkbox"
                            checked={repoState.import}
                            onChange={(e) => handleRepoSelectionChange(repo.name, 'import', e.target.checked)}
                          />
                          Import
                        </label>
                        <label className="flex items-center gap-2 text-on-surface-secondary">
                          <input
                            type="checkbox"
                            checked={repoState.showcase}
                            disabled={!repoState.import}
                            onChange={(e) => handleRepoSelectionChange(repo.name, 'showcase', e.target.checked)}
                          />
                          Showcase publicly
                        </label>
                        <label className="flex items-center gap-2 text-on-surface-secondary">
                          <input
                            type="checkbox"
                            checked={repoState.featured}
                            disabled={!repoState.showcase}
                            onChange={(e) => handleRepoSelectionChange(repo.name, 'featured', e.target.checked)}
                          />
                          Mark as featured
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleImportSelected}
                disabled={isImporting || selectedCount === 0}
                className="mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Importing selected...
                  </>
                ) : (
                  <>Import Selected Repositories</>
                )}
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-red-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            </div>
          )}

          {/* Success Result */}
          {result && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-green-400 font-medium">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {result.message}
                </div>
              </div>

              {result.imported.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-on-surface-secondary mb-2">
                    Imported Projects ({result.imported.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.imported.map((name) => (
                      <span
                        key={name}
                        className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.skipped.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-on-surface-secondary mb-2">
                    Skipped (already exists) ({result.skipped.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.skipped.map((name) => (
                      <span
                        key={name}
                        className="px-3 py-1 bg-surface-tertiary text-on-surface-secondary rounded-full text-sm"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Link
                href="/dashboard/projects"
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300"
              >
                View your projects
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="bg-card/30 rounded-lg p-4 border border-outline">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-medium text-on-surface">What gets imported?</h3>
            </div>
            <ul className="text-sm text-on-surface-secondary space-y-1 ml-11">
              <li>• Repository name as project title</li>
              <li>• Repository description</li>
              <li>• Primary programming language</li>
              <li>• Repository URL and homepage</li>
            </ul>
          </div>

          <div className="bg-card/30 rounded-lg p-4 border border-outline">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="font-medium text-on-surface">Note</h3>
            </div>
            <ul className="text-sm text-on-surface-secondary space-y-1 ml-11">
              <li>• You can choose which repositories to import</li>
              <li>• You can choose which imported repos are showcased publicly</li>
              <li>• Forked repositories are skipped</li>
              <li>• Up to 30 recent repos are fetched</li>
              <li>• Duplicates are automatically skipped</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
