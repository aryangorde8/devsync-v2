"""
RAG (Retrieval Augmented Generation) module for DevSync AI.

Uses ChromaDB for vector storage and sentence-transformers for embeddings.
Falls back gracefully if dependencies are not installed.

Features:
- Comprehensive DevSync knowledge base (50+ documents)
- Semantic search with cosine similarity
- Context-aware query augmentation
- Graceful degradation when dependencies missing
"""

import json
import logging
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

# Lazy-loaded dependencies
_chromadb = None
_sentence_transformer = None
_collection = None
_initialized = False

# ================== Knowledge Base ==================
# Comprehensive DevSync documentation for RAG retrieval

DEVSYNC_KNOWLEDGE = [
    # --- Platform Overview ---
    {
        "id": "platform_overview",
        "content": "DevSync is a production-grade developer portfolio management platform built with Django REST Framework (backend) and Next.js 15 (frontend). It features a custom AI assistant powered by local LLM (Ollama) with RAG, comprehensive CRUD operations for portfolio management, real-time analytics, PDF resume generation, and modern DevOps practices. The platform is 100% free with no API keys needed.",
        "metadata": {"category": "platform", "topic": "overview"},
    },
    {
        "id": "platform_tech_stack",
        "content": "DevSync tech stack: Backend uses Django 5.0, Django REST Framework, PostgreSQL, Redis, Celery. Frontend uses Next.js 15, TypeScript, Tailwind CSS, shadcn/ui. AI system uses Ollama (llama3.2), ChromaDB for RAG, sentence-transformers for embeddings. DevOps: Docker, Kubernetes, Terraform, GitHub Actions CI/CD, Nginx reverse proxy.",
        "metadata": {"category": "platform", "topic": "tech_stack"},
    },
    {
        "id": "platform_architecture",
        "content": "DevSync follows a microservices-inspired architecture: REST API backend (Django) serves the Next.js frontend. Authentication uses JWT tokens (access + refresh). The AI system has three tiers: Smart Response Engine for instant answers, RAG for knowledge retrieval, and Ollama LLM for complex questions. Caching uses Redis, background tasks use Celery, and the database is PostgreSQL.",
        "metadata": {"category": "platform", "topic": "architecture"},
    },
    # --- Profile Section ---
    {
        "id": "profile_photo",
        "content": "To update your profile picture on DevSync: Go to Dashboard → Profile, click your current avatar/photo, and select an image from your device. Tips for a great profile photo: use a professional headshot with good lighting, neutral or clean background, friendly smile, minimum resolution 400x400 pixels. Profiles with professional photos receive 14x more views according to LinkedIn data. Supported formats: JPEG, PNG, WebP.",
        "metadata": {"category": "profile", "topic": "photo"},
    },
    {
        "id": "profile_bio",
        "content": "To write an effective bio on DevSync: Go to Dashboard → Profile → Edit Bio. The ideal bio is 150-300 characters long. Structure it as: Who you are + What you do + What makes you unique. Example: 'Full-stack developer passionate about building scalable web applications. 3+ years with React & Node.js. Open source contributor.' Avoid: generic statements, buzzwords without substance, or leaving it blank. A compelling bio is one of the first things recruiters notice.",
        "metadata": {"category": "profile", "topic": "bio"},
    },
    {
        "id": "profile_title",
        "content": "To set your professional title on DevSync: Go to Dashboard → Profile → Edit Title. Good titles are specific and include key technologies. Examples: 'Full Stack Developer | React & Node.js', 'Frontend Engineer | TypeScript & Next.js', 'Backend Developer | Python & Django'. Avoid generic titles like 'Developer' or 'Programmer'. Include your specialization and 1-2 main technologies. Keep it under 60 characters for best display.",
        "metadata": {"category": "profile", "topic": "title"},
    },
    {
        "id": "profile_social_links",
        "content": "To add social links on DevSync: Go to Dashboard → Profile → Social Links. Essential links: GitHub (showcase your code), LinkedIn (professional network), personal website/blog. Optional: Twitter/X, Stack Overflow, Medium/Dev.to. Make sure your GitHub profile has a good README, pinned repositories, and consistent activity. Your LinkedIn should match your DevSync portfolio for consistency.",
        "metadata": {"category": "profile", "topic": "social_links"},
    },
    {
        "id": "profile_completeness",
        "content": "A complete DevSync profile includes: professional photo (10 points), full name (5 points), specific professional title (5 points), compelling bio 150-300 chars (10 points), social links especially GitHub and LinkedIn. The Portfolio Analysis tool scores your profile and gives personalized recommendations. Aim for 80%+ completeness score to make a strong impression on recruiters.",
        "metadata": {"category": "profile", "topic": "completeness"},
    },
    # --- Skills Section ---
    {
        "id": "skills_adding",
        "content": "To add skills on DevSync: Go to Dashboard → Skills → Add Skill. Enter the skill name, select a category (Frontend, Backend, Database, DevOps, Tools, etc.), and set your honest proficiency level from 0-100%. Aim for 8-15 skills total. Be honest about proficiency levels — having everything at 100% looks unrealistic and damages credibility. Include both technical skills (React, Python) and soft skills (Communication, Leadership).",
        "metadata": {"category": "skills", "topic": "adding"},
    },
    {
        "id": "skills_categories",
        "content": "DevSync skill categories: Frontend (React, Vue, Angular, HTML/CSS, TypeScript), Backend (Node.js, Python, Java, Go, PHP), Database (PostgreSQL, MongoDB, MySQL, Redis), DevOps (Docker, Kubernetes, AWS, CI/CD, Linux), Tools (Git, VS Code, Figma, Postman), Mobile (React Native, Flutter, Swift), AI/ML (TensorFlow, PyTorch, Machine Learning). Diversify across 3+ categories to show versatility.",
        "metadata": {"category": "skills", "topic": "categories"},
    },
    {
        "id": "skills_proficiency",
        "content": "Guidelines for setting skill proficiency on DevSync: 90-100% Expert (you can teach others, deep knowledge), 70-89% Advanced (comfortable in production, handle complex tasks), 50-69% Intermediate (can build features independently), 30-49% Beginner (basic understanding, learning), 0-29% Novice (just started). Be honest — recruiters respect realistic self-assessment over inflated numbers. A mix of levels looks more credible.",
        "metadata": {"category": "skills", "topic": "proficiency"},
    },
    {
        "id": "skills_recommendations",
        "content": "Top skills to add for web developers in 2024-2026: Must-have: JavaScript/TypeScript, React/Next.js, Node.js, Git, SQL. Highly valued: Docker, AWS/Cloud, CI/CD, REST APIs, GraphQL. Trending: AI/ML basics, Rust, Go, serverless, WebAssembly. Soft skills matter: Communication, Problem Solving, Teamwork, Agile/Scrum. Add skills relevant to your target roles and be prepared to demonstrate them.",
        "metadata": {"category": "skills", "topic": "recommendations"},
    },
    # --- Projects Section ---
    {
        "id": "projects_adding",
        "content": "To add projects on DevSync: Go to Dashboard → Projects → Add Project. Required: title, description (explain the problem you solved), technologies used. Highly recommended: GitHub repository link, live demo URL, featured screenshot/image. Aim for 3-6 quality projects. Quality over quantity — each project should demonstrate different skills and solve a real problem.",
        "metadata": {"category": "projects", "topic": "adding"},
    },
    {
        "id": "projects_description",
        "content": "Writing effective project descriptions on DevSync: Start with what the project does and why you built it. Structure: 1) Problem statement (what need does it address?), 2) Your solution and approach, 3) Key features and functionality, 4) Technologies used and why, 5) Results/metrics if available. Use specific numbers: 'Handles 10k requests/day' not 'Handles many requests'. Minimum 100 characters, aim for 200-400 for depth.",
        "metadata": {"category": "projects", "topic": "description"},
    },
    {
        "id": "projects_showcase",
        "content": "Best practices for showcasing projects on DevSync: 1) Include screenshots or demo GIFs showing the UI, 2) Add both GitHub link (shows your code quality) and live demo URL, 3) List all technologies with their roles, 4) Describe challenges you overcame, 5) Mention if it's a team or solo project, 6) Keep repositories clean with good READMEs, 7) Feature your most impressive or most recent projects first.",
        "metadata": {"category": "projects", "topic": "showcase"},
    },
    {
        "id": "projects_ideas",
        "content": "Strong project ideas for developer portfolios: 1) Full-stack CRUD app (shows end-to-end skills), 2) API with authentication (backend focus), 3) Real-time app with WebSockets (shows advanced skills), 4) CLI tool or library (shows engineering depth), 5) Mobile app or PWA, 6) Data visualization dashboard, 7) AI/ML integration project, 8) Open source contribution. Each should solve a real problem, not just be a tutorial copy.",
        "metadata": {"category": "projects", "topic": "ideas"},
    },
    # --- Experience Section ---
    {
        "id": "experience_adding",
        "content": "To add work experience on DevSync: Go to Dashboard → Experience → Add Experience. Enter company name, your role/position, employment type (Full-time, Part-time, Internship, Freelance, Contract), start and end dates. Write achievement-focused descriptions using action verbs and metrics. Example: 'Built REST API serving 10k daily requests, reducing response time by 40%' instead of 'Worked on API development'.",
        "metadata": {"category": "experience", "topic": "adding"},
    },
    {
        "id": "experience_writing",
        "content": "Writing impactful experience descriptions: Use the STAR method (Situation, Task, Action, Result). Start each bullet with a strong action verb: Built, Designed, Implemented, Led, Optimized, Reduced, Increased, Deployed, Automated, Migrated. Include quantifiable results: percentages, user counts, time saved, revenue impact. Don't just list duties — show impact. Even internships should highlight what you delivered.",
        "metadata": {"category": "experience", "topic": "writing"},
    },
    {
        "id": "experience_types",
        "content": "All experience types valuable on DevSync: Full-time roles, internships, freelance projects, contract work, open source contributions, hackathon projects, teaching/mentoring, volunteer tech work. If you're early in your career, include relevant coursework projects, bootcamp projects, or significant personal projects. Freelance work from platforms like Upwork or Fiverr counts as professional experience.",
        "metadata": {"category": "experience", "topic": "types"},
    },
    # --- Education Section ---
    {
        "id": "education_adding",
        "content": "To add education on DevSync: Go to Dashboard → Education → Add Education. Enter institution name, degree type, field of study, start and end dates, and optionally GPA if strong (3.5+). Include relevant coursework that aligns with your career goals. If you're self-taught, add bootcamps, online courses (Coursera, Udemy, freeCodeCamp), or intensive programs.",
        "metadata": {"category": "education", "topic": "adding"},
    },
    {
        "id": "education_coursework",
        "content": "Relevant coursework to highlight on DevSync: Data Structures & Algorithms, Web Development, Database Systems, Software Engineering, Operating Systems, Computer Networks, Machine Learning/AI, Cloud Computing, Cybersecurity. Also include workshops, hackathons, and coding competitions. These show continuous learning and passion for technology beyond required coursework.",
        "metadata": {"category": "education", "topic": "coursework"},
    },
    # --- Certifications Section ---
    {
        "id": "certifications_adding",
        "content": "To add certifications on DevSync: Go to Dashboard → Certifications → Add Certification. Enter certification name, issuing organization, issue date, expiry date (if applicable), and credential URL for verification. Popular developer certifications: AWS Solutions Architect, Google Cloud Professional, Meta Frontend/Backend Developer, MongoDB Developer, Kubernetes (CKA), CompTIA Security+.",
        "metadata": {"category": "certifications", "topic": "adding"},
    },
    {
        "id": "certifications_recommendations",
        "content": "Best certifications for developers by track: Cloud/DevOps: AWS Solutions Architect, GCP Professional, Azure Fundamentals. Frontend: Meta Frontend Developer, Google UX Design. Backend: Meta Backend Developer, AWS Developer Associate. Data: Google Data Analytics, IBM Data Science. Security: CompTIA Security+, CISSP. Free options: freeCodeCamp certificates, HackerRank skill certificates, Google Digital Garage.",
        "metadata": {"category": "certifications", "topic": "recommendations"},
    },
    # --- Portfolio Improvement ---
    {
        "id": "portfolio_improvement",
        "content": "How to improve your DevSync portfolio score: 1) Add a professional photo (10 pts), 2) Write a compelling bio 150-300 chars (10 pts), 3) Set a specific title with technologies (5 pts), 4) Add 8-15 skills across categories (20 pts), 5) Showcase 3-6 projects with demos (25 pts), 6) Add work experience with achievements (15 pts), 7) Include education and certifications (10 pts), 8) Link GitHub and LinkedIn profiles. Check the Portfolio Analysis feature for your personalized score.",
        "metadata": {"category": "portfolio", "topic": "improvement"},
    },
    {
        "id": "portfolio_recruiter_tips",
        "content": "What recruiters look for in developer portfolios: 1) Clean, professional presentation, 2) Real projects with working demos (not just tutorials), 3) Code quality visible through GitHub links, 4) Problem-solving described in project details, 5) Consistent personal branding across platforms, 6) Evidence of continuous learning (certifications, recent projects), 7) Clear professional identity (specific title, focused skills), 8) Good communication (clear writing in bio and descriptions).",
        "metadata": {"category": "portfolio", "topic": "recruiters"},
    },
    {
        "id": "portfolio_common_mistakes",
        "content": "Common portfolio mistakes to avoid: 1) No profile photo (looks unfinished), 2) Generic title like 'Developer' (be specific), 3) All skills at 100% proficiency (unrealistic), 4) Projects without descriptions or links (can't evaluate), 5) Tutorial-only projects (show original work), 6) Outdated information (keep current), 7) No GitHub activity (dead profiles), 8) Spelling/grammar errors (shows lack of attention), 9) Too few or too many projects (3-6 is optimal), 10) Missing social links.",
        "metadata": {"category": "portfolio", "topic": "mistakes"},
    },
    {
        "id": "portfolio_pdf_resume",
        "content": "DevSync can generate a PDF resume from your portfolio data. Go to Dashboard → Export/Download to generate a professional PDF. It includes your profile info, skills, projects, experience, and education. Make sure all sections are filled out before generating. This PDF complements your portfolio link — share both on job applications. The PDF is formatted for ATS (Applicant Tracking Systems) compatibility.",
        "metadata": {"category": "portfolio", "topic": "pdf_resume"},
    },
    # --- Career & Interview ---
    {
        "id": "career_interviews",
        "content": "Using DevSync to prepare for interviews: 1) Review your Portfolio Analysis for gaps, 2) Practice explaining each project: problem, approach, challenges, results, 3) Know your skill proficiency honestly, 4) Have your portfolio link ready to share, 5) Research the company and tailor your talking points, 6) Prepare STAR format stories for behavioral questions, 7) Practice coding challenges alongside portfolio prep, 8) Keep your portfolio updated before applying.",
        "metadata": {"category": "career", "topic": "interviews"},
    },
    {
        "id": "career_job_search",
        "content": "Job search tips for developers: 1) Polish your DevSync portfolio before applying, 2) Customize your portfolio focus for each role type, 3) Network on LinkedIn and at meetups, 4) Contribute to open source for visibility, 5) Apply to 5-10 targeted positions per week, 6) Follow up after applications, 7) Practice system design and coding questions, 8) Share your portfolio link on resumes, LinkedIn, Twitter, and email signatures.",
        "metadata": {"category": "career", "topic": "job_search"},
    },
    {
        "id": "career_learning",
        "content": "Learning path for developers: 1) Pick one stack and master it (e.g., React + Node.js + PostgreSQL), 2) Build real projects, not just follow tutorials, 3) Add each project to your DevSync portfolio as you complete it, 4) Get certified in your focus area, 5) Contribute to open source, 6) Read documentation and blogs, 7) Join developer communities, 8) Track progress in DevSync — watching your portfolio grow is motivating. Quality > quantity.",
        "metadata": {"category": "career", "topic": "learning"},
    },
    {
        "id": "career_resume",
        "content": "Combining your resume with DevSync portfolio: Your DevSync profile provides depth that a 1-page resume can't. Include your DevSync portfolio URL on your resume under 'Links' or 'Portfolio'. The portfolio shows live demos, detailed project descriptions, and skill proficiency that a resume can only summarize. Use the PDF export feature for ATS-compatible submissions, and share the live link for human reviewers.",
        "metadata": {"category": "career", "topic": "resume"},
    },
    # --- Technical Topics ---
    {
        "id": "tech_react",
        "content": "React is the most popular frontend library for building user interfaces. It uses a component-based architecture, virtual DOM for performance, and a rich ecosystem (Next.js, Redux, React Router). Key concepts: JSX, hooks (useState, useEffect), context, props, and state management. DevSync's frontend is built with Next.js (React framework). Add React to your DevSync skills if you know it, and showcase React projects.",
        "metadata": {"category": "technology", "topic": "react"},
    },
    {
        "id": "tech_nextjs",
        "content": "Next.js is a React framework with built-in server-side rendering (SSR), static site generation (SSG), API routes, file-based routing, and automatic optimization. DevSync uses Next.js 15 for the frontend. Key features: App Router, Server Components, middleware, image optimization. It's one of the most in-demand frontend frameworks for production applications.",
        "metadata": {"category": "technology", "topic": "nextjs"},
    },
    {
        "id": "tech_python_django",
        "content": "Python with Django is a powerful backend combination. Django provides ORM, admin panel, authentication, and a batteries-included philosophy. Django REST Framework (DRF) adds API capabilities. DevSync's backend uses Django 5.0 + DRF. FastAPI is a modern alternative focused on async and speed. Flask is lighter for small projects. Add Python/Django to your DevSync skills if you use them.",
        "metadata": {"category": "technology", "topic": "python_django"},
    },
    {
        "id": "tech_databases",
        "content": "Database skills for developers: PostgreSQL (recommended — reliable, feature-rich, used by DevSync), MongoDB (flexible documents, good for prototyping), MySQL (widely used, simple), Redis (in-memory caching and queues, used by DevSync for caching), SQLite (great for development). Learn SQL fundamentals, indexing, query optimization, and data modeling. Add your database skills to DevSync with honest proficiency levels.",
        "metadata": {"category": "technology", "topic": "databases"},
    },
    {
        "id": "tech_devops",
        "content": "DevOps skills increasingly valued: Docker (containerization, DevSync uses it), Kubernetes (orchestration), CI/CD pipelines (GitHub Actions, Jenkins), cloud platforms (AWS, GCP, Azure), Terraform (infrastructure as code, DevSync uses it), Nginx (reverse proxy), monitoring (Prometheus, Grafana). Even basic DevOps knowledge (Docker, CI/CD) sets you apart. Add DevOps skills and any deployment experience to your DevSync portfolio.",
        "metadata": {"category": "technology", "topic": "devops"},
    },
    {
        "id": "tech_ai_tools",
        "content": "AI tools for developers: GitHub Copilot (code autocomplete, boosts productivity 30-50%), ChatGPT/Claude (code explanations, debugging, writing docs), Cursor IDE (AI-first editor), AI testing tools. DevSync itself uses Ollama for local AI. Knowing and using AI tools is increasingly expected. Add 'AI-Assisted Development' or specific tools to your DevSync skills to show modern workflow awareness.",
        "metadata": {"category": "technology", "topic": "ai_tools"},
    },
    {
        "id": "tech_git_github",
        "content": "Git and GitHub best practices for your portfolio: 1) Write clear commit messages, 2) Use feature branches, 3) Have a solid README for each project repo, 4) Keep repos clean (no node_modules, .env files), 5) Use .gitignore properly, 6) Pin your best repositories on GitHub, 7) Add a GitHub profile README, 8) Contribute to open source. Link your GitHub to DevSync for credibility. Consistent activity shows dedication.",
        "metadata": {"category": "technology", "topic": "git_github"},
    },
    {
        "id": "tech_typescript",
        "content": "TypeScript adds static typing to JavaScript, catching bugs early and improving code quality. DevSync's frontend uses TypeScript with Next.js. Key features: type annotations, interfaces, generics, union types, enums. Most modern frontend and Node.js projects use TypeScript. It's increasingly required for senior roles. Add TypeScript to your DevSync skills and use it in your projects to demonstrate code quality.",
        "metadata": {"category": "technology", "topic": "typescript"},
    },
    # --- AI System ---
    {
        "id": "ai_how_it_works",
        "content": "DevSync AI system explained: Three-tier architecture — 1) Smart Response Engine: instant answers for common DevSync questions using pattern matching (<50ms), 2) RAG (Retrieval Augmented Generation): searches a knowledge base of DevSync documentation using semantic embeddings and ChromaDB to find relevant context, 3) Ollama LLM (llama3.2): local language model that generates contextual responses using RAG context. All processing is local — your data never leaves the server. No API keys or external services needed.",
        "metadata": {"category": "ai", "topic": "how_it_works"},
    },
    {
        "id": "ai_privacy",
        "content": "DevSync AI privacy: All AI processing runs locally on your server using Ollama. No data is sent to external APIs (no OpenAI, Google, etc.). Your portfolio data, questions, and conversation history stay on your server. The AI system uses open-source models that you control. This is privacy-by-design — no tracking, no data selling, no subscription fees.",
        "metadata": {"category": "ai", "topic": "privacy"},
    },
    {
        "id": "ai_portfolio_analysis",
        "content": "Portfolio Analysis feature: DevSync's AI analyzes your portfolio completeness across sections: Profile (30 pts), Skills (20 pts), Projects (25 pts), Experience (15 pts), Education & Certifications (10 pts). It identifies specific issues (missing photo, short bio, etc.), provides actionable suggestions, and highlights strengths. Results are cached for 5 minutes. Use 'Refresh Analysis' after making changes. Access via Dashboard → Portfolio Analysis or ask the AI chatbot.",
        "metadata": {"category": "ai", "topic": "portfolio_analysis"},
    },
    # --- Deployment ---
    {
        "id": "deployment_options",
        "content": "DevSync deployment options: 1) Docker Compose (simplest — docker-compose up), 2) Kubernetes (production-grade, k8s configs included), 3) PythonAnywhere (free hosting for backend), 4) Vercel (free frontend hosting), 5) Render (free tier available). Configuration files included: Dockerfile, docker-compose.yml, k8s/, terraform/, render.yaml. The AI can run in smart_only mode for hosts without Ollama support.",
        "metadata": {"category": "deployment", "topic": "options"},
    },
    # --- Frequently Asked Questions ---
    {
        "id": "faq_portfolio_url",
        "content": "Your DevSync portfolio has a unique URL based on your username. To customize it, go to Dashboard → Profile and update your username. Share this URL on your resume, LinkedIn, email signature, and job applications. The URL is public — anyone can view your portfolio without logging in.",
        "metadata": {"category": "faq", "topic": "portfolio_url"},
    },
    {
        "id": "faq_skill_count",
        "content": "How many skills should you list? 8-15 is the sweet spot. Fewer than 5 makes your portfolio look sparse. More than 20 dilutes your expertise. Focus on skills relevant to your target roles. Organize across categories (frontend, backend, tools, etc.) for visual balance. Include 2-3 soft skills alongside technical ones.",
        "metadata": {"category": "faq", "topic": "skill_count"},
    },
    {
        "id": "faq_project_count",
        "content": "How many projects should you showcase? 3-6 high-quality projects is optimal. Each should demonstrate different skills or technologies. Quality matters more than quantity — one well-documented project with a live demo is worth more than five empty repos. Update projects regularly as you complete new work.",
        "metadata": {"category": "faq", "topic": "project_count"},
    },
    {
        "id": "faq_update_frequency",
        "content": "How often should you update your DevSync portfolio? Update after: completing a project, learning a new skill, earning a certification, changing jobs, or before applying to positions. At minimum, review monthly. Stale portfolios signal disengagement — keep your most recent project less than 3 months old if actively job searching.",
        "metadata": {"category": "faq", "topic": "update_frequency"},
    },
]


def is_rag_available() -> bool:
    """Check if RAG dependencies (ChromaDB, sentence-transformers) are installed."""
    try:
        import chromadb
        from sentence_transformers import SentenceTransformer

        return True
    except ImportError:
        return False


def _get_embedding_model():
    """Get or initialize the sentence-transformer embedding model."""
    global _sentence_transformer
    if _sentence_transformer is None:
        try:
            from sentence_transformers import SentenceTransformer

            # all-MiniLM-L6-v2: small, fast, CPU-friendly, good quality
            model_name = os.getenv("RAG_EMBEDDING_MODEL", "all-MiniLM-L6-v2")
            _sentence_transformer = SentenceTransformer(model_name)
            logger.info(f"Loaded embedding model: {model_name}")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise
    return _sentence_transformer


def _get_collection():
    """Get or initialize the ChromaDB collection."""
    global _collection, _chromadb
    if _collection is None:
        try:
            import chromadb

            _chromadb = chromadb

            # Use persistent storage in the ai directory
            persist_dir = os.path.join(os.path.dirname(__file__), "chroma_db")
            client = chromadb.PersistentClient(path=persist_dir)

            _collection = client.get_or_create_collection(
                name="devsync_knowledge", metadata={"hnsw:space": "cosine"}
            )
            logger.info(
                f"ChromaDB collection ready with {_collection.count()} documents"
            )
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {e}")
            raise
    return _collection


def initialize_knowledge_base() -> bool:
    """
    Initialize or update the knowledge base with DevSync documentation.

    Embeds all knowledge documents and stores them in ChromaDB.
    Safe to call multiple times — uses upsert.

    Returns:
        True if successful, False otherwise
    """
    if not is_rag_available():
        logger.warning(
            "RAG dependencies not installed. Run: pip install chromadb sentence-transformers"
        )
        return False

    try:
        model = _get_embedding_model()
        collection = _get_collection()

        # Also load training data QA pairs
        all_documents = list(DEVSYNC_KNOWLEDGE)
        training_data_path = os.path.join(
            os.path.dirname(__file__), "training_data", "devsync_qa.json"
        )

        if os.path.exists(training_data_path):
            try:
                with open(training_data_path, "r") as f:
                    qa_pairs = json.load(f)
                for i, qa in enumerate(qa_pairs):
                    all_documents.append(
                        {
                            "id": f"qa_{i}",
                            "content": f"Q: {qa['instruction']}\nA: {qa['output']}",
                            "metadata": {"category": "qa", "topic": "training_data"},
                        }
                    )
                logger.info(f"Loaded {len(qa_pairs)} QA pairs from training data")
            except Exception as e:
                logger.warning(f"Failed to load training data: {e}")

        # Prepare data for upsert
        ids = [doc["id"] for doc in all_documents]
        contents = [doc["content"] for doc in all_documents]
        metadatas = [doc["metadata"] for doc in all_documents]

        # Generate embeddings
        logger.info(f"Generating embeddings for {len(contents)} documents...")
        embeddings = model.encode(contents, show_progress_bar=False).tolist()

        # Upsert into ChromaDB
        collection.upsert(
            ids=ids, documents=contents, embeddings=embeddings, metadatas=metadatas
        )

        logger.info(f"Knowledge base initialized with {collection.count()} documents")
        return True

    except Exception as e:
        logger.error(f"Failed to initialize knowledge base: {e}")
        return False


def rag_query(query: str, top_k: int = 5) -> Tuple[str, List[Dict]]:
    """
    Perform RAG retrieval and augment the query with relevant context.

    Args:
        query: User's question
        top_k: Number of relevant documents to retrieve

    Returns:
        Tuple of (augmented_query, retrieved_contexts)
        If RAG fails, returns (original_query, [])
    """
    if not is_rag_available():
        return query, []

    try:
        model = _get_embedding_model()
        collection = _get_collection()

        # Check if collection has documents
        if collection.count() == 0:
            logger.warning("Knowledge base is empty. Initializing...")
            initialize_knowledge_base()
            if collection.count() == 0:
                return query, []

        # Generate query embedding
        query_embedding = model.encode([query]).tolist()

        # Search for relevant documents
        results = collection.query(
            query_embeddings=query_embedding,
            n_results=min(top_k, collection.count()),
            include=["documents", "metadatas", "distances"],
        )

        # Extract retrieved contexts
        retrieved_contexts = []
        context_texts = []

        if results and results["documents"] and results["documents"][0]:
            for i, (doc, metadata, distance) in enumerate(
                zip(
                    results["documents"][0],
                    results["metadatas"][0],
                    results["distances"][0],
                )
            ):
                # Filter by relevance (cosine distance < 0.7 for cosine space)
                similarity = 1 - distance  # Convert distance to similarity
                if similarity > 0.3:  # Only include reasonably relevant results
                    retrieved_contexts.append(
                        {
                            "content": doc,
                            "metadata": metadata,
                            "similarity": round(similarity, 3),
                            "rank": i + 1,
                        }
                    )
                    context_texts.append(doc)

        if not context_texts:
            logger.debug(f"No relevant RAG results for query: {query[:100]}")
            return query, []

        # Augment query with retrieved context
        context_block = "\n\n".join(context_texts[:3])  # Top 3 most relevant
        augmented_query = f"""Based on the following DevSync documentation context, answer the user's question accurately and specifically.

RELEVANT CONTEXT:
{context_block}

USER QUESTION: {query}

Provide a helpful, accurate answer based on the context above. If the context doesn't fully address the question, use your general knowledge but prioritize the context information."""

        logger.info(
            f"RAG augmented query with {len(retrieved_contexts)} contexts (top similarity: {retrieved_contexts[0]['similarity'] if retrieved_contexts else 'N/A'})"
        )
        return augmented_query, retrieved_contexts

    except Exception as e:
        logger.error(f"RAG query failed: {e}")
        return query, []


def search_knowledge(
    query: str, top_k: int = 5, category: Optional[str] = None
) -> List[Dict]:
    """
    Search the knowledge base without augmenting the query.
    Useful for direct document retrieval.

    Args:
        query: Search query
        top_k: Number of results
        category: Optional category filter

    Returns:
        List of relevant documents with similarity scores
    """
    if not is_rag_available():
        return []

    try:
        model = _get_embedding_model()
        collection = _get_collection()

        if collection.count() == 0:
            return []

        query_embedding = model.encode([query]).tolist()

        # Build where filter if category specified
        where_filter = {"category": category} if category else None

        results = collection.query(
            query_embeddings=query_embedding,
            n_results=min(top_k, collection.count()),
            where=where_filter,
            include=["documents", "metadatas", "distances"],
        )

        documents = []
        if results and results["documents"] and results["documents"][0]:
            for doc, metadata, distance in zip(
                results["documents"][0],
                results["metadatas"][0],
                results["distances"][0],
            ):
                similarity = 1 - distance
                if similarity > 0.2:
                    documents.append(
                        {
                            "content": doc,
                            "metadata": metadata,
                            "similarity": round(similarity, 3),
                        }
                    )

        return documents

    except Exception as e:
        logger.error(f"Knowledge search failed: {e}")
        return []
