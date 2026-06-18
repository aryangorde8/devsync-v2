'use client';

import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { gsap } from '@/lib/gsap';
import ContactForm from './ContactForm';

const resolveMediaUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) return path;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
  const origin = apiBase.replace(/\/api\/v\d+\/?$/, '');
  return `${origin}${path}`;
};

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

// Floating particles background
function FloatingParticles({ primaryColor, secondaryColor }: { primaryColor: string; secondaryColor: string }) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: i % 2 === 0 ? primaryColor : secondaryColor,
            opacity: 0.3,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 40 - 20, 0],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: 8 + Math.random() * 8,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Animated section wrapper
function AnimatedSection({ children, className = '', delay = 0 }: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animated skill bar
function AnimatedSkillBar({ name, proficiency, primaryColor, secondaryColor, delay }: {
  name: string;
  proficiency: number;
  primaryColor: string;
  secondaryColor: string;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref}>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-white/80">{name}</span>
        <motion.span 
          className="text-white/50"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: delay + 0.5 }}
        >
          {proficiency}%
        </motion.span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
          }}
          initial={{ width: 0 }}
          animate={isInView ? { width: `${proficiency}%` } : { width: 0 }}
          transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

// Project card with hover effects
function ProjectCard({ project, primaryColor, index }: {
  project: PortfolioData['projects'][0];
  primaryColor: string;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    
    const card = ref.current;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      gsap.to(card, {
        '--mouse-x': `${x}px`,
        '--mouse-y': `${y}px`,
        duration: 0.3,
      });
    };
    
    card.addEventListener('mousemove', handleMouseMove);
    return () => card.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 overflow-hidden"
      style={{
        '--mouse-x': '50%',
        '--mouse-y': '50%',
      } as React.CSSProperties}
    >
      {/* Hover glow effect */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), ${primaryColor}15, transparent 40%)`,
        }}
      />
      
      {project.is_featured && (
        <motion.span 
          className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full mb-4 border border-amber-500/30"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          <span>⭐</span> Featured
        </motion.span>
      )}
      
      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-cyan-400 transition-all duration-300">
        {project.title}
      </h3>
      
      <p className="text-white/60 text-sm mb-4 line-clamp-2">{project.short_description}</p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {project.technologies.slice(0, 4).map((tech, i) => (
          <motion.span
            key={tech}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="px-2 py-1 bg-white/5 text-white/70 text-xs rounded-lg border border-white/10"
          >
            {tech}
          </motion.span>
        ))}
      </div>
      
      <div className="flex gap-4">
        {project.github_url && (
          <motion.a
            href={project.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-white transition-colors text-sm flex items-center gap-1"
            whileHover={{ x: 3 }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            GitHub
          </motion.a>
        )}
        {project.live_url && (
          <motion.a
            href={project.live_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm flex items-center gap-1"
            whileHover={{ x: 3 }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Live Demo
          </motion.a>
        )}
      </div>
    </motion.div>
  );
}

// Social icon component
function SocialIcon({ platform }: { platform: string }) {
  const icons: Record<string, React.ReactNode> = {
    github: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
      </svg>
    ),
    linkedin: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
      </svg>
    ),
    twitter: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    website: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    youtube: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  };
  
  return icons[platform] || (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

export default function PortfolioClient({ 
  portfolio, 
  username, 
  apiUrl 
}: { 
  portfolio: PortfolioData; 
  username: string;
  apiUrl: string;
}) {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const theme = portfolio.theme;
  const primaryColor = theme?.primary_color || '#8B5CF6';
  const secondaryColor = theme?.secondary_color || '#EC4899';

  // Group skills by category
  const skillsByCategory = portfolio.skills.reduce((acc, skill) => {
    const cat = skill.category_display;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {} as Record<string, typeof portfolio.skills>);

  // GSAP entrance animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero text reveal
      gsap.fromTo('.hero-avatar',
        { scale: 0, rotation: -180 },
        { scale: 1, rotation: 0, duration: 1, ease: 'back.out(1.7)', delay: 0.2 }
      );

      gsap.fromTo('.hero-name',
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.5 }
      );

      gsap.fromTo('.hero-title',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.7 }
      );

      gsap.fromTo('.hero-bio',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.9 }
      );

      gsap.fromTo('.hero-social',
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, delay: 1.1, ease: 'back.out(1.7)' }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative">
      {/* Floating particles */}
      <FloatingParticles primaryColor={primaryColor} secondaryColor={secondaryColor} />

      {/* Gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full blur-[150px] opacity-30"
          style={{ background: primaryColor }}
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div 
          className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-[150px] opacity-30"
          style={{ background: secondaryColor }}
          animate={{ x: [0, -80, 0], y: [0, -60, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Hero Section */}
      <section ref={heroRef} className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 text-center px-4"
        >
          {/* Avatar */}
          <div className="hero-avatar relative w-40 h-40 mx-auto mb-8">
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-30"
              style={{ background: `radial-gradient(circle, ${primaryColor}, transparent 70%)` }}
            />
            {portfolio.user.avatar ? (
              <img
                src={resolveMediaUrl(portfolio.user.avatar)}
                alt={portfolio.user.full_name}
                width={160}
                height={160}
                className="relative w-40 h-40 rounded-full border-4 border-white/20 object-cover"
              />
            ) : (
              <div
                className="relative w-40 h-40 rounded-full flex items-center justify-center text-6xl font-bold text-white border-4 border-white/20"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                {(portfolio.user.first_name?.[0] || portfolio.user.full_name?.[0] || "?").toUpperCase()}
              </div>
            )}
          </div>

          {/* Name */}
          <h1 className="hero-name text-5xl md:text-7xl font-bold mb-4">
            <span className="bg-clip-text text-transparent" style={{ 
              backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` 
            }}>
              {theme?.hero_title || portfolio.user.full_name}
            </span>
          </h1>

          {/* Title */}
          <p className="hero-title text-xl md:text-2xl text-white/70 mb-6">
            {theme?.hero_subtitle || portfolio.user.title}
          </p>

          {/* Bio */}
          {portfolio.user.bio && (
            <p className="hero-bio text-white/50 max-w-2xl mx-auto mb-8 leading-relaxed">
              {portfolio.user.bio}
            </p>
          )}

          {/* Social Links */}
          <div className="flex justify-center gap-4">
            {portfolio.social_links.map((link) => (
              <motion.a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-social p-4 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:border-white/30 hover:bg-white/10 transition-all duration-300"
                title={link.platform_display}
                whileHover={{ scale: 1.1, y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                <SocialIcon platform={link.platform} />
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-white/40 uppercase tracking-widest">Scroll</span>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2"
          >
            <motion.div 
              className="w-1.5 h-3 rounded-full"
              style={{ background: `linear-gradient(180deg, ${primaryColor}, ${secondaryColor})` }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Projects Section */}
      {(theme?.show_projects_section ?? true) && portfolio.projects.length > 0 && (
        <section className="py-24 px-4 relative" id="projects">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold">
                <span className="bg-clip-text text-transparent" style={{ 
                  backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` 
                }}>
                  Projects
                </span>
              </h2>
              <p className="text-white/50 mt-4">Some of my recent work</p>
            </AnimatedSection>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolio.projects.map((project, i) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  primaryColor={primaryColor}
                  index={i}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Skills Section */}
      {(theme?.show_skills_section ?? true) && portfolio.skills.length > 0 && (
        <section className="py-24 px-4 bg-white/[0.02]" id="skills">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold">
                <span className="bg-clip-text text-transparent" style={{ 
                  backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` 
                }}>
                  Skills
                </span>
              </h2>
              <p className="text-white/50 mt-4">Technologies I work with</p>
            </AnimatedSection>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Object.entries(skillsByCategory).map(([category, skills], catIndex) => (
                <AnimatedSection 
                  key={category} 
                  delay={catIndex * 0.1}
                  className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6"
                >
                  <h3 
                    className="text-lg font-semibold mb-6"
                    style={{ color: primaryColor }}
                  >
                    {category}
                  </h3>
                  <div className="space-y-4">
                    {skills.map((skill, i) => (
                      <AnimatedSkillBar
                        key={skill.id}
                        name={skill.name}
                        proficiency={skill.proficiency}
                        primaryColor={primaryColor}
                        secondaryColor={secondaryColor}
                        delay={i * 0.1}
                      />
                    ))}
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Experience Section */}
      {(theme?.show_experience_section ?? true) && portfolio.experiences.length > 0 && (
        <section className="py-24 px-4" id="experience">
          <div className="max-w-4xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold">
                <span className="bg-clip-text text-transparent" style={{ 
                  backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` 
                }}>
                  Experience
                </span>
              </h2>
              <p className="text-white/50 mt-4">My professional journey</p>
            </AnimatedSection>
            
            <div className="relative">
              {/* Timeline line */}
              <div 
                className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px"
                style={{ background: `linear-gradient(180deg, ${primaryColor}50, ${secondaryColor}50)` }}
              />
              
              <div className="space-y-12">
                {portfolio.experiences.map((exp, i) => (
                  <motion.div
                    key={exp.id}
                    initial={{ opacity: 0, x: i % 2 === 0 ? 50 : -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    className={`relative flex flex-col md:flex-row gap-4 ${
                      i % 2 === 0 ? 'md:flex-row-reverse' : ''
                    }`}
                  >
                    {/* Timeline dot */}
                    <motion.div 
                      className="absolute left-4 md:left-1/2 w-4 h-4 rounded-full -translate-x-2 md:-translate-x-2 mt-6"
                      style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3, type: 'spring' }}
                    />
                    
                    <div className={`md:w-1/2 ${i % 2 === 0 ? 'md:pl-12' : 'md:pr-12 md:text-right'} pl-12 md:pl-0`}>
                      <motion.div 
                        className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <span className="text-sm" style={{ color: primaryColor }}>{exp.type_display}</span>
                        <h3 className="text-xl font-semibold text-white mt-1">{exp.position}</h3>
                        <p className="text-white/70">{exp.company}</p>
                        <p className="text-white/40 text-sm mt-1">
                          {new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          {' - '}
                          {exp.is_current ? 'Present' : exp.end_date && new Date(exp.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                        {exp.description && (
                          <p className="text-white/50 text-sm mt-3">{exp.description}</p>
                        )}
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Education Section */}
      {portfolio.education.length > 0 && (
        <section className="py-24 px-4 bg-white/[0.02]" id="education">
          <div className="max-w-4xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold">
                <span className="bg-clip-text text-transparent" style={{ 
                  backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` 
                }}>
                  Education
                </span>
              </h2>
            </AnimatedSection>
            
            <div className="space-y-6">
              {portfolio.education.map((edu, i) => (
                <motion.div
                  key={edu.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{edu.institution}</h3>
                      <p style={{ color: primaryColor }}>{edu.degree} in {edu.field_of_study}</p>
                    </div>
                    <p className="text-white/40 text-sm mt-2 md:mt-0">
                      {new Date(edu.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      {' - '}
                      {edu.is_current ? 'Present' : edu.end_date && new Date(edu.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      {(theme?.show_contact_form ?? true) && (
        <section className="py-24 px-4" id="contact">
          <div className="max-w-2xl mx-auto">
            <AnimatedSection className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold">
                <span className="bg-clip-text text-transparent" style={{ 
                  backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` 
                }}>
                  Get in Touch
                </span>
              </h2>
              <p className="text-white/50 mt-4">Let&apos;s work together</p>
            </AnimatedSection>
            
            <AnimatedSection delay={0.2}>
              <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-8">
                <ContactForm username={username} apiUrl={apiUrl} />
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 text-center border-t border-white/5">
        <motion.p 
          className="text-white/30 text-sm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Built with <span className="text-indigo-400">DevSync</span>
        </motion.p>
      </footer>
    </div>
  );
}
