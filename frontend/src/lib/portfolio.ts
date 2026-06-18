/**
 * Portfolio API types and functions for DevSync
 */

import api from './api';

// Paginated response type
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Types
export interface Skill {
  id: number;
  name: string;
  category: string;
  category_display: string;
  proficiency: number;
  years_experience: number | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  title: string;
  slug: string;
  description?: string;
  short_description: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'archived';
  status_display: string;
  github_url: string;
  live_url: string;
  demo_url?: string;
  featured_image: string | null;
  skills?: Skill[];
  technologies: string[];
  is_featured: boolean;
  is_public: boolean;
  order?: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at?: string;
}

export interface Experience {
  id: number;
  company: string;
  position: string;
  type: string;
  type_display: string;
  location: string;
  description: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  skills: Skill[];
  created_at: string;
  updated_at: string;
}

export interface SocialLink {
  id: number;
  platform: string;
  platform_display: string;
  url: string;
  is_visible: boolean;
}

export interface Education {
  id: number;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  grade: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Certification {
  id: number;
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date: string | null;
  credential_id: string;
  credential_url: string;
  created_at: string;
  updated_at: string;
}

export interface PortfolioTheme {
  id: number;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  accent_color: string;
  font_family: string;
  layout: string;
  show_skills: boolean;
  show_projects: boolean;
  show_experience: boolean;
  show_education: boolean;
  show_certifications: boolean;
  show_social_links: boolean;
  custom_css: string;
}

export interface DashboardStats {
  total_projects: number;
  completed_projects: number;
  in_progress_projects: number;
  total_skills: number;
  total_experiences: number;
  profile_views: number;
}

// Create/Update types
export interface CreateProjectData {
  title: string;
  description: string;
  short_description?: string;
  status?: string;
  github_url?: string;
  live_url?: string;
  demo_url?: string;
  technologies?: string[];
  skill_ids?: number[];
  is_featured?: boolean;
  is_public?: boolean;
  start_date?: string;
  end_date?: string;
}

export interface CreateSkillData {
  name: string;
  category: string;
  proficiency: number;
  years_experience?: number;
}

export interface CreateExperienceData {
  company: string;
  position: string;
  type: string;
  location?: string;
  description?: string;
  start_date: string;
  end_date?: string;
  is_current?: boolean;
  skill_ids?: number[];
}

export interface CreateEducationData {
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date?: string;
  is_current?: boolean;
  grade?: string;
  description?: string;
}

export interface CreateCertificationData {
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
}

export interface UpdateThemeData {
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
  text_color?: string;
  accent_color?: string;
  font_family?: string;
  layout?: string;
  show_skills?: boolean;
  show_projects?: boolean;
  show_experience?: boolean;
  show_education?: boolean;
  show_certifications?: boolean;
  show_social_links?: boolean;
  custom_css?: string;
}

// API functions
export const portfolioApi = {
  // Dashboard
  getStats: () => api.get<DashboardStats>('/portfolio/dashboard/stats/'),

  // Projects
  getProjects: async (): Promise<Project[]> => {
    const response = await api.get<PaginatedResponse<Project> | Project[]>('/portfolio/projects/');
    // Handle both paginated and non-paginated responses
    return Array.isArray(response) ? response : response.results;
  },
  getProject: (id: number) => api.get<Project>(`/portfolio/projects/${id}/`),
  createProject: (data: CreateProjectData) => api.post<Project>('/portfolio/projects/', data),
  updateProject: (id: number, data: Partial<CreateProjectData>) =>
    api.patch<Project>(`/portfolio/projects/${id}/`, data),
  deleteProject: (id: number) => api.delete(`/portfolio/projects/${id}/`),
  toggleFeatured: (id: number) =>
    api.post<{ is_featured: boolean }>(`/portfolio/projects/${id}/toggle_featured/`),
  getFeaturedProjects: () => api.get<Project[]>('/portfolio/projects/featured/'),

  // Skills
  getSkills: async (): Promise<Skill[]> => {
    const response = await api.get<PaginatedResponse<Skill> | Skill[]>('/portfolio/skills/');
    return Array.isArray(response) ? response : response.results;
  },
  getSkill: (id: number) => api.get<Skill>(`/portfolio/skills/${id}/`),
  createSkill: (data: CreateSkillData) => api.post<Skill>('/portfolio/skills/', data),
  updateSkill: (id: number, data: Partial<CreateSkillData>) =>
    api.patch<Skill>(`/portfolio/skills/${id}/`, data),
  deleteSkill: (id: number) => api.delete(`/portfolio/skills/${id}/`),
  getSkillsByCategory: () => api.get<Record<string, Skill[]>>('/portfolio/skills/by_category/'),

  // Experiences
  getExperiences: async (): Promise<Experience[]> => {
    const response = await api.get<PaginatedResponse<Experience> | Experience[]>('/portfolio/experiences/');
    return Array.isArray(response) ? response : response.results;
  },
  getExperience: (id: number) => api.get<Experience>(`/portfolio/experiences/${id}/`),
  createExperience: (data: CreateExperienceData) =>
    api.post<Experience>('/portfolio/experiences/', data),
  updateExperience: (id: number, data: Partial<CreateExperienceData>) =>
    api.patch<Experience>(`/portfolio/experiences/${id}/`, data),
  deleteExperience: (id: number) => api.delete(`/portfolio/experiences/${id}/`),

  // Social Links
  getSocialLinks: async (): Promise<SocialLink[]> => {
    const response = await api.get<PaginatedResponse<SocialLink> | SocialLink[]>('/portfolio/social-links/');
    return Array.isArray(response) ? response : response.results;
  },
  createSocialLink: (data: { platform: string; url: string }) =>
    api.post<SocialLink>('/portfolio/social-links/', data),
  updateSocialLink: (id: number, data: { url?: string; is_visible?: boolean }) =>
    api.patch<SocialLink>(`/portfolio/social-links/${id}/`, data),
  deleteSocialLink: (id: number) => api.delete(`/portfolio/social-links/${id}/`),

  // Education
  getEducation: async (): Promise<Education[]> => {
    const response = await api.get<PaginatedResponse<Education> | Education[]>('/portfolio/education/');
    return Array.isArray(response) ? response : response.results;
  },
  getEducationItem: (id: number) => api.get<Education>(`/portfolio/education/${id}/`),
  createEducation: (data: CreateEducationData) =>
    api.post<Education>('/portfolio/education/', data),
  updateEducation: (id: number, data: Partial<CreateEducationData>) =>
    api.patch<Education>(`/portfolio/education/${id}/`, data),
  deleteEducation: (id: number) => api.delete(`/portfolio/education/${id}/`),

  // Certifications
  getCertifications: async (): Promise<Certification[]> => {
    const response = await api.get<PaginatedResponse<Certification> | Certification[]>('/portfolio/certifications/');
    return Array.isArray(response) ? response : response.results;
  },
  getCertification: (id: number) => api.get<Certification>(`/portfolio/certifications/${id}/`),
  createCertification: (data: CreateCertificationData) =>
    api.post<Certification>('/portfolio/certifications/', data),
  updateCertification: (id: number, data: Partial<CreateCertificationData>) =>
    api.patch<Certification>(`/portfolio/certifications/${id}/`, data),
  deleteCertification: (id: number) => api.delete(`/portfolio/certifications/${id}/`),

  // Theme
  getTheme: () => api.get<PortfolioTheme>('/portfolio/theme/'),
  updateTheme: (data: UpdateThemeData) =>
    api.patch<PortfolioTheme>('/portfolio/theme/', data),
};

export default portfolioApi;
