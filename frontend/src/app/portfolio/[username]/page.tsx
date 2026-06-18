import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PortfolioClient from './PortfolioClient';

interface PortfolioData {
  user: {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    title: string;
    bio: string;
    avatar: string | null;
  };
  theme: {
    preset: string;
    primary_color: string;
    secondary_color: string;
    background_color: string;
    text_color: string;
    hero_title: string;
    hero_subtitle: string;
    show_skills_section: boolean;
    show_experience_section: boolean;
    show_projects_section: boolean;
    show_contact_form: boolean;
  } | null;
  projects: {
    id: number;
    title: string;
    slug: string;
    short_description: string;
    technologies: string[];
    github_url: string;
    live_url: string;
    is_featured: boolean;
  }[];
  skills: {
    id: number;
    name: string;
    category: string;
    category_display: string;
    proficiency: number;
  }[];
  experiences: {
    id: number;
    company: string;
    position: string;
    type_display: string;
    location: string;
    description: string;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
  }[];
  education: {
    id: number;
    institution: string;
    degree: string;
    field_of_study: string;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
  }[];
  social_links: {
    id: number;
    platform: string;
    platform_display: string;
    url: string;
  }[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://devsync-api-25hv.onrender.com/api/v1';

async function getPortfolio(username: string): Promise<PortfolioData | null> {
  try {
    const response = await fetch(`${API_URL}/portfolio/public/${username}/`, {
      next: { revalidate: 60 },
    });
    
    if (!response.ok) {
      return null;
    }
    
    return response.json();
  } catch {
    return null;
  }
}

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const portfolio = await getPortfolio(username);
  
  if (!portfolio) {
    return {
      title: 'Portfolio Not Found',
    };
  }
  
  const title = portfolio.user.full_name || username;
  const description = portfolio.user.bio || `${title}'s developer portfolio`;

  return {
    title: `${title} | Portfolio`,
    description,
    openGraph: {
      title: `${title} | Portfolio`,
      description,
      type: 'profile',
      images: portfolio.user.avatar ? [portfolio.user.avatar] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Portfolio`,
      description,
      images: portfolio.user.avatar ? [portfolio.user.avatar] : [],
    },
  };
}

export default async function PublicPortfolioPage({ params }: PageProps) {
  const { username } = await params;
  const portfolio = await getPortfolio(username);
  
  if (!portfolio) {
    notFound();
  }

  return <PortfolioClient portfolio={portfolio} username={username} apiUrl={API_URL} />;
}
