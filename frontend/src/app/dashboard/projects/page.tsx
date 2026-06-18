'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { portfolioApi, Project, CreateProjectData } from '@/lib/portfolio';

// Icons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const GithubIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

const ExternalLinkIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
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

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg className={`w-5 h-5 ${filled ? 'text-yellow-400 fill-yellow-400' : 'text-on-surface-secondary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const statusColors: Record<string, string> = {
  planning: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  in_progress: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  on_hold: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  archived: 'bg-gray-500/20 text-on-surface-secondary border-outline-hover/30',
};

export default function ProjectsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<CreateProjectData>({
    title: '',
    description: '',
    short_description: '',
    status: 'in_progress',
    github_url: '',
    live_url: '',
    technologies: [],
    is_featured: false,
    is_public: true,
  });
  const [techInput, setTechInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadProjects();
    }
  }, [isAuthenticated]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const data = await portfolioApi.getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingProject(null);
    setFormData({
      title: '',
      description: '',
      short_description: '',
      status: 'in_progress',
      github_url: '',
      live_url: '',
      technologies: [],
      is_featured: false,
      is_public: true,
    });
    setTechInput('');
    setShowModal(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description || '',
      short_description: project.short_description,
      status: project.status,
      github_url: project.github_url,
      live_url: project.live_url,
      technologies: project.technologies,
      is_featured: project.is_featured,
      is_public: project.is_public,
    });
    setTechInput('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      if (editingProject) {
        await portfolioApi.updateProject(editingProject.id, formData);
      } else {
        await portfolioApi.createProject(formData);
      }
      setShowModal(false);
      loadProjects();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to save project');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await portfolioApi.deleteProject(id);
      loadProjects();
    } catch (err) {
      console.error('Failed to delete project:', err);
      setError('Failed to delete project');
    }
  };

  const handleToggleFeatured = async (id: number) => {
    try {
      await portfolioApi.toggleFeatured(id);
      loadProjects();
    } catch (err) {
      console.error('Failed to toggle featured:', err);
    }
  };

  const addTechnology = () => {
    if (techInput.trim() && !formData.technologies?.includes(techInput.trim())) {
      setFormData({
        ...formData,
        technologies: [...(formData.technologies || []), techInput.trim()],
      });
      setTechInput('');
    }
  };

  const removeTechnology = (tech: string) => {
    setFormData({
      ...formData,
      technologies: formData.technologies?.filter((t) => t !== tech),
    });
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-outline">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/devsync-48.png" alt="DevSync" className="h-8 w-8 rounded-lg" />
              <span className="text-xl font-bold text-on-surface">DevSync</span>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/dashboard" className="text-on-surface-secondary hover:text-on-surface transition-colors">
                Dashboard
              </Link>
              <Link href="/dashboard/projects" className="text-on-surface font-medium">
                Projects
              </Link>
              <Link href="/dashboard/settings" className="text-on-surface-secondary hover:text-on-surface transition-colors">
                Settings
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-on-surface">Projects</h1>
            <p className="mt-2 text-on-surface-secondary">Manage your portfolio projects</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/import"
              className="flex items-center space-x-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white font-medium hover:bg-white/10 transition-all"
            >
              <GithubIcon />
              <span>Import from GitHub</span>
            </Link>
            <button
              onClick={openCreateModal}
              className="flex items-center space-x-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 px-4 py-2 text-white font-medium hover:from-purple-700 hover:to-cyan-700 transition-all"
            >
              <PlusIcon />
              <span>Add Project</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Projects Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-card mb-6">
              <svg className="w-10 h-10 text-on-surface-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-on-surface mb-2">No projects yet</h3>
            <p className="text-on-surface-secondary mb-6">Create your first project, or import them from GitHub</p>
            <div className="inline-flex items-center gap-3">
              <button
                onClick={openCreateModal}
                className="inline-flex items-center space-x-2 rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 transition-colors"
              >
                <PlusIcon />
                <span>Create Project</span>
              </button>
              <Link
                href="/dashboard/import"
                className="inline-flex items-center space-x-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white hover:bg-white/10 transition-colors"
              >
                <GithubIcon />
                <span>Import from GitHub</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="rounded-2xl bg-card backdrop-blur-sm border border-outline overflow-hidden hover:bg-surface-tertiary transition-all group"
              >
                {/* Project Image */}
                <div className="h-40 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 relative">
                  {project.featured_image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={project.featured_image}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl font-bold text-on-surface/20">
                        {project.title.charAt(0)}
                      </span>
                    </div>
                  )}
                  {/* Featured Star */}
                  <button
                    onClick={() => handleToggleFeatured(project.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/30 hover:bg-[var(--surface-overlay)] transition-colors"
                  >
                    <StarIcon filled={project.is_featured} />
                  </button>
                </div>

                {/* Project Info */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-on-surface">{project.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[project.status]}`}>
                      {project.status_display}
                    </span>
                  </div>
                  <p className="text-on-surface-secondary text-sm mb-4 line-clamp-2">
                    {project.short_description || 'No description'}
                  </p>

                  {/* Technologies */}
                  {project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.technologies.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.technologies.length > 3 && (
                        <span className="text-xs px-2 py-1 text-on-surface-secondary">
                          +{project.technologies.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Links & Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-outline">
                    <div className="flex items-center space-x-3">
                      {project.github_url && (
                        <a
                          href={project.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-on-surface-secondary hover:text-on-surface transition-colors"
                        >
                          <GithubIcon />
                        </a>
                      )}
                      {project.live_url && (
                        <a
                          href={project.live_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-on-surface-secondary hover:text-on-surface transition-colors"
                        >
                          <ExternalLinkIcon />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(project)}
                        className="p-2 rounded-lg text-on-surface-secondary hover:text-on-surface hover:bg-surface-tertiary transition-all"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="p-2 rounded-lg text-on-surface-secondary hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-outline w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-outline">
              <h2 className="text-xl font-bold text-on-surface">
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-on-surface-secondary mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-lg border border-outline-secondary bg-surface-tertiary px-4 py-3 text-on-surface placeholder-[var(--input-placeholder)] focus:border-purple-500 focus:outline-none"
                  placeholder="My Awesome Project"
                  required
                />
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-sm font-medium text-on-surface-secondary mb-2">
                  Short Description
                </label>
                <input
                  type="text"
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  className="w-full rounded-lg border border-outline-secondary bg-surface-tertiary px-4 py-3 text-on-surface placeholder-[var(--input-placeholder)] focus:border-purple-500 focus:outline-none"
                  placeholder="A brief description for cards"
                  maxLength={300}
                />
              </div>

              {/* Full Description */}
              <div>
                <label className="block text-sm font-medium text-on-surface-secondary mb-2">
                  Full Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-outline-secondary bg-surface-tertiary px-4 py-3 text-on-surface placeholder-[var(--input-placeholder)] focus:border-purple-500 focus:outline-none resize-none"
                  placeholder="Describe your project in detail..."
                  rows={4}
                  required
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-on-surface-secondary mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-lg border border-outline-secondary bg-surface-tertiary px-4 py-3 text-on-surface focus:border-purple-500 focus:outline-none"
                >
                  <option value="planning">Planning</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* URLs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface-secondary mb-2">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    value={formData.github_url}
                    onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                    className="w-full rounded-lg border border-outline-secondary bg-surface-tertiary px-4 py-3 text-on-surface placeholder-[var(--input-placeholder)] focus:border-purple-500 focus:outline-none"
                    placeholder="https://github.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-secondary mb-2">
                    Live URL
                  </label>
                  <input
                    type="url"
                    value={formData.live_url}
                    onChange={(e) => setFormData({ ...formData, live_url: e.target.value })}
                    className="w-full rounded-lg border border-outline-secondary bg-surface-tertiary px-4 py-3 text-on-surface placeholder-[var(--input-placeholder)] focus:border-purple-500 focus:outline-none"
                    placeholder="https://myproject.com"
                  />
                </div>
              </div>

              {/* Technologies */}
              <div>
                <label className="block text-sm font-medium text-on-surface-secondary mb-2">
                  Technologies
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                    className="flex-1 rounded-lg border border-outline-secondary bg-surface-tertiary px-4 py-2 text-on-surface placeholder-[var(--input-placeholder)] focus:border-purple-500 focus:outline-none"
                    placeholder="React, Node.js, etc."
                  />
                  <button
                    type="button"
                    onClick={addTechnology}
                    className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {formData.technologies && formData.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center space-x-1 text-sm px-3 py-1 rounded-full bg-purple-500/20 text-purple-300"
                      >
                        <span>{tech}</span>
                        <button
                          type="button"
                          onClick={() => removeTechnology(tech)}
                          className="text-purple-400 hover:text-purple-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="rounded border-outline-secondary bg-surface-tertiary text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-on-surface-secondary">Featured project</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                    className="rounded border-outline-secondary bg-surface-tertiary text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-on-surface-secondary">Public</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-outline">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-outline-secondary text-on-surface-secondary hover:bg-surface-tertiary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-medium hover:from-purple-700 hover:to-cyan-700 transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
