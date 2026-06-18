"""
AI Views for chat functionality.

Production-Ready Features:
- Smart Response Engine with instant answers
- Rate limiting / Throttling
- Comprehensive error handling
- Request validation
- Logging and monitoring
- Proper HTTP status codes
"""

import logging
import re
import time

from django.core.cache import cache
from django.http import StreamingHttpResponse

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle

from .gemini_service import gemini_service, is_gemini_available
from .models import Conversation, Message
from .serializers import (
    ChatInputSerializer,
    ChatResponseSerializer,
    ConversationListSerializer,
    ConversationSerializer,
)
from .services import (
    PORTFOLIO_SYSTEM_PROMPT,
    OllamaConnectionError,
    OllamaError,
    OllamaModelError,
    OllamaTimeoutError,
    analyze_portfolio_completeness,
    get_portfolio_context,
    invalidate_portfolio_cache,
    is_gemini_mode,
    is_smart_only_mode,
    ollama_service,
)

logger = logging.getLogger(__name__)


# ================== FALLBACK FOR SMART-ONLY MODE ==================
SMART_ONLY_FALLBACK = """I understand your question, but I can provide better help with specific DevSync topics:

**Try asking about:**
• "How do I add a project?"
• "How can I improve my portfolio?"
• "How do I update my skills?"
• "What should I include in my portfolio?"
• "Should I use React or Vue?"
• "Is ChatGPT or Copilot better?"

Or check the **Portfolio Analysis** for personalized recommendations!"""


# ================== Smart Response Engine ==================
# Instant responses for common questions - NO AI delay!

SMART_RESPONSES = {
    # Profile Picture
    r"(profile|avatar|photo|picture|image|pic)": {
        "keywords": ["upload", "update", "change", "add", "how", "set"],
        "response": """**To update your profile picture:**

1. Go to **Dashboard → Profile**
2. Click on your current avatar/photo
3. Select an image from your device

**Tips for a great photo:**
- Professional headshot with good lighting and clean background
- Minimum 400x400px resolution (JPEG, PNG, or WebP)
- Friendly smile — profiles with photos get **14x more views**
- Avoid: group photos, selfies, or low-resolution images""",
    },
    # Skills
    r"(skill|skills|technology|technologies|tech stack)": {
        "keywords": [
            "add",
            "update",
            "how",
            "what",
            "improve",
            "list",
            "learn",
            "should",
            "manage",
        ],
        "response": """**To manage your skills:**

1. Go to **Dashboard → Skills**
2. Click **Add Skill**
3. Choose a category (Frontend, Backend, Database, DevOps, Tools)
4. Set your honest proficiency level (0-100%)

**Proficiency guide:**
- 90-100%: Expert (can teach others)
- 70-89%: Advanced (production-ready)
- 50-69%: Intermediate (builds features independently)
- 30-49%: Beginner (learning)

**Tips:** Aim for 8-15 skills across 3+ categories. A mix of levels looks more credible than all at 100%.""",
    },
    # Projects
    r"(project|projects|portfolio|work|showcase)": {
        "keywords": ["add", "create", "how", "update", "improve", "show", "build"],
        "response": """**To add projects:**

1. Go to **Dashboard → Projects**
2. Click **Add Project**
3. Add title, description, technologies, GitHub link, live demo URL
4. Upload a screenshot showing the key feature

**Writing great descriptions:**
- Start with the problem your project solves
- Describe your approach and key features
- List technologies with their roles
- Include metrics if available (e.g., "handles 10k requests/day")

**Tips:** 3-6 quality projects is optimal. Each should demonstrate different skills.""",
    },
    # Experience — only match DevSync portfolio editing, not career/interview advice
    r"(experience|work history|employment)": {
        "keywords": ["add", "update", "write", "describe", "enter", "edit"],
        "response": """**To add work experience:**

1. Go to **Dashboard → Experience**
2. Click **Add Experience**
3. Select type: Full-time, Part-time, Internship, Freelance, Contract
4. Enter company, role, dates, and achievements

**Writing impactful descriptions (STAR method):**
- Start with strong action verbs: Built, Designed, Implemented, Led, Optimized
- Include metrics: "Reduced response time by 40%" not "Improved performance"
- Focus on impact and results, not just duties

**All experience counts:** Internships, freelance, open source, hackathons, volunteer work.""",
    },
    # Education
    r"(education|degree|university|college|school|study|bootcamp)": {
        "keywords": ["add", "how", "update", "include"],
        "response": """**To add education:**

1. Go to **Dashboard → Education**
2. Click **Add Education**
3. Enter institution, degree type, field of study, dates

**Include:** Relevant coursework, bootcamps, online programs (Coursera, freeCodeCamp), and intensive courses. If self-taught, add your structured learning paths.

**Tip:** Highlight coursework that aligns with your target role.""",
    },
    # Certifications
    r"(certification|certificate|certified|credential)": {
        "keywords": ["add", "how", "update", "which", "best", "get", "recommend"],
        "response": """**To add certifications:**

1. Go to **Dashboard → Certifications**
2. Click **Add Certification**
3. Enter name, issuer, issue/expiry dates, and credential URL

**Recommended by track:**
- **Cloud/DevOps:** AWS Solutions Architect, GCP Professional
- **Frontend:** Meta Frontend Developer
- **Backend:** Meta Backend Developer, AWS Developer Associate
- **Free options:** freeCodeCamp, HackerRank, Google Digital Garage

**Tip:** Keep credential URLs current and remove expired certs.""",
    },
    # Bio
    r"(bio|about me|description|summary|introduce)": {
        "keywords": ["write", "how", "update", "improve", "what", "good"],
        "response": """**To write your bio:**

1. Go to **Dashboard → Profile**
2. Edit bio section — aim for **150-300 characters**

**Structure:** Who you are + What you do + What makes you unique

**Examples:**
- *"Full-stack developer building scalable web apps. 3+ years React & Node.js. Open source contributor."*
- *"Frontend engineer passionate about accessible UI. TypeScript & Next.js specialist."*

**Avoid:** Generic statements, buzzwords without substance, or leaving it blank.""",
    },
    # Title/Headline
    r"(title|headline|tagline)": {
        "keywords": ["write", "how", "update", "improve", "what", "change", "set"],
        "response": """**To set your professional title:**

Go to **Dashboard → Profile** → Edit Title

**Good examples:**
- "Full Stack Developer | React & Node.js"
- "Frontend Engineer | TypeScript & Next.js"
- "Backend Developer | Python & Django"

**Avoid:** Generic "Developer" or "Programmer"

**Tips:** Include your specialization + 1-2 key technologies. Keep it under 60 characters.""",
    },
    # Improve/Review portfolio
    r"(improve|review|better|enhance|optimize|score|complete)": {
        "keywords": ["portfolio", "profile", "how", "my"],
        "response": None,  # Will use dynamic analysis
    },
    # PDF / Resume / Export
    r"(pdf|resume|export|download|cv)": {
        "keywords": ["generate", "create", "download", "how", "get", "make"],
        "response": """**To generate a PDF resume:**

1. Go to **Dashboard → Export/Download**
2. DevSync generates a professional PDF from your portfolio data
3. Includes: profile, skills, projects, experience, education

**Tips:**
- Complete all sections before generating (empty sections look bad)
- The PDF is ATS-compatible for job application systems
- Share the live portfolio link for human reviewers, PDF for ATS""",
    },
    # Social Links
    r"(social|linkedin|github|twitter|link|url)": {
        "keywords": ["add", "how", "connect", "link", "share", "set"],
        "response": """**To add social links:**

1. Go to **Dashboard → Profile → Social Links**
2. Add your URLs

**Essential links:**
- **GitHub** — showcases your code quality and activity
- **LinkedIn** — professional network (keep consistent with DevSync)

**Optional:** Personal website, Twitter/X, Stack Overflow, Medium/Dev.to

**GitHub tips:** Pin best repos, write good READMEs, add a profile README.""",
    },
    # Delete / Remove
    r"(delete|remove|hide|archive)": {
        "keywords": ["project", "skill", "experience", "how", "can"],
        "response": """**To delete or remove items:**

1. Go to the relevant section (Projects, Skills, Experience, etc.)
2. Find the item and click the **delete button** (trash icon)
3. Confirm the deletion

**Alternative:** Instead of deleting, you can set project status to **Draft** to hide it without losing the data.""",
    },
    # Privacy / Data — only match data security questions, not general data queries
    r"(privacy|private|secure|safety)": {
        "keywords": ["data", "my", "information", "secure", "safe"],
        "response": """**DevSync Privacy:**

Your data is private and secure:
- **AI runs locally** — no data sent to external APIs (no OpenAI, Google, etc.)
- Portfolio data stays on your server
- Conversation history is private to your account
- No tracking, no data selling
- 100% open source — full control over your data

Your portfolio page is public (shareable URL), but all management is behind authentication.""",
    },
    # General help — only match clear "how to use DevSync" questions, not "help me with X"
    r"(get started|getting started|how to use|beginner|new to devsync|tutorial|first time)": {
        "keywords": ["how", "devsync", "started", "use", "what", "begin"],
        "response": """**Getting started with DevSync:**

1. **Profile** — Add professional photo, compelling bio (150-300 chars), specific title
2. **Skills** — List 8-15 technologies across 3+ categories with honest levels
3. **Projects** — Showcase 3-6 best works with descriptions, GitHub links, and demos
4. **Experience** — Work history with quantified achievements
5. **Education** — Degrees, bootcamps, certifications

**Next:** Check **Portfolio Analysis** for your personalized score and improvement tips!""",
    },
}

# ================== Instant Dev Responses ==================
# Quick, accurate answers for common dev questions

DEV_RESPONSES = {
    # AI Tools
    r"(chatgpt|gpt|openai)": """**ChatGPT for developers:**

Yes, it's useful for: code explanations, debugging help, learning concepts, and writing docs.

**Tip:** Add "AI Tools" to your DevSync Skills to show modern workflow awareness!""",
    r"(copilot|github copilot)": """**GitHub Copilot:**

Great for: autocomplete, boilerplate code, learning patterns. Boosts productivity 30-50%.

**Add to DevSync:** List it in Skills → Tools/AI section.""",
    r"(ai|artificial intelligence|machine learning|ml)": """**AI in development:**

AI tools help with coding, testing, and docs. Key skills: prompt engineering, AI-assisted development.

**For your portfolio:** Add AI/ML projects or mention AI tools you use in Skills.""",
    # Frameworks
    r"(react|reactjs|react.js)": """**React:**

Top frontend library. Great for SPAs, component-based architecture.

**Add to DevSync:** Skills → Frontend → React (set your proficiency level).""",
    r"(nextjs|next.js|next js)": """**Next.js:**

React framework with SSR, routing, and optimization built-in. Very popular for production apps.

**DevSync uses Next.js!** Add it to your Skills if you know it.""",
    r"(node|nodejs|node.js)": """**Node.js:**

JavaScript runtime for backend. Great with Express, NestJS, or Fastify.

**Add to DevSync:** Skills → Backend → Node.js""",
    r"(python|django|flask|fastapi)": """**Python frameworks:**

- Django: Full-featured, great for rapid development
- FastAPI: Modern, async, great for APIs
- Flask: Lightweight, flexible

**Add to DevSync:** Skills → Backend → Python/Django/FastAPI""",
    # Career
    r"(interview|interviews|job|jobs|hire|hired|hiring)": """**Interview tips:**

1. Have a polished portfolio (use DevSync!)
2. Know your projects deeply - explain problems & solutions
3. Practice coding challenges
4. Research the company

**Check your Portfolio Analysis** for gaps before applying!""",
    r"(resume|cv)": """**Resume + Portfolio combo:**

Your DevSync portfolio complements your resume with live demos and detailed projects.

**Share your DevSync link** on your resume and LinkedIn!""",
    r"(learn|learning|beginner|start|roadmap)": """**Learning path:**

1. Pick one stack (e.g., React + Node.js)
2. Build projects, not just tutorials
3. Add each project to DevSync
4. Get certifications for credibility

Track your progress in your DevSync portfolio!""",
    # Tech choices
    r"(best|which|should i use|recommend|choose)": """**Choosing tech:**

It depends on your goals! For web dev:
- **Frontend:** React/Next.js (most jobs)
- **Backend:** Node.js or Python
- **Database:** PostgreSQL

Add what you learn to your DevSync Skills!""",
    r"(database|sql|mongodb|postgres|mysql)": """**Databases:**

- **PostgreSQL:** Reliable, feature-rich (recommended)
- **MongoDB:** Flexible documents, good for prototypes
- **MySQL:** Widely used, simple

Add your DB skills to DevSync → Skills → Database""",
    # Hello/Thanks
    r"^(hi|hello|hey|greetings)": """Hi! 👋 I'm DevSync AI.

I can help you with your portfolio: adding projects, skills, improving your profile, and career tips.

**Try:** "How do I add a project?" or "How can I improve my portfolio?" """,
    r"(thank|thanks|thx|cheers)": """You're welcome! 🙌

**Quick reminders:**
- Keep your portfolio updated
- Check Portfolio Analysis for your score
- Share your DevSync link when applying!

Good luck with your career!""",
    r"(bye|goodbye|see you)": """Goodbye! Best of luck with your developer journey! 

Remember to keep your DevSync portfolio updated. 🚀""",
}


# ================== DevSync Value Proposition FAQ ==================
# These answer "what does DevSync do" / "how does DevSync help" questions.
# Checked BEFORE career bypass since they're about the platform itself.

DEVSYNC_FAQ = {
    # ---- What is DevSync / Platform intro ----
    r"(what is devsync|what does devsync|what\'s devsync|about devsync|tell me about devsync)": {
        "keywords": ["what", "about", "tell", "is", "does"],
        "response": """**What is DevSync?**

DevSync is a **free, open-source developer portfolio platform** that helps you build a professional online presence.

**Key features:**
- 📝 **Portfolio Builder** — Profile, skills, projects, experience, education, certifications
- 🤖 **AI Assistant** — Personalized advice to improve your portfolio (runs locally, 100% private)
- 📊 **Portfolio Analysis** — AI-powered scoring with actionable improvement tips
- 📄 **PDF Resume Export** — ATS-compatible resume generated from your portfolio data
- 📱 **QR Code & Sharing** — Share your portfolio via link, QR code, or social media
- 🎨 **Customizable Themes** — Personalize colors to match your brand
- 🔒 **Privacy-First** — AI runs locally, no data sent to external services

**Your public portfolio URL:** `devsync.dev/portfolio/your-username`""",
    },
    # ---- How DevSync helps get selected/hired ----
    r"(devsync|dev sync|this platform|this app|this tool)": {
        "keywords": [
            "help",
            "selected",
            "interview",
            "hired",
            "hire",
            "job",
            "career",
            "benefit",
            "useful",
            "use",
            "purpose",
            "do",
            "does",
            "can",
        ],
        "response": """**How DevSync helps you get selected:**

DevSync strengthens your candidacy in several key ways:

1. **Professional Portfolio** — Present your work in a polished, shareable format that impresses recruiters
2. **Skill Highlighting** — Showcase your technical skills with proficiency levels so employers see your strengths at a glance
3. **Project Showcase** — Display your best projects with descriptions, GitHub links, and live demos — proof of what you can build
4. **AI-Powered Resume Tips** — Get personalized suggestions to improve your portfolio and fill gaps
5. **ATS-Ready PDF Export** — Generate a professional resume that passes applicant tracking systems
6. **Portfolio Analysis** — See your completeness score and exactly what to improve

**The result:** A complete, professional online presence that makes you stand out to recruiters and hiring managers.

**Next step:** Check your **Portfolio Analysis** to see your current score and personalized tips!""",
    },
    # ---- Is DevSync free / Pricing ----
    r"(free|cost|price|pricing|pay|payment|subscription|plan|premium|charge)": {
        "keywords": ["devsync", "is", "it", "how", "much", "this", "any", "does"],
        "response": """**DevSync is 100% free!**

- ✅ All features included — no premium tiers, no paywalls
- ✅ Unlimited projects, skills, and portfolio items
- ✅ AI assistant — completely free (runs locally on your machine)
- ✅ PDF resume export — free
- ✅ Portfolio Analysis — free
- ✅ Custom themes — free
- ✅ Open source — you can even self-host it

**No credit card needed.** No hidden costs. No ads. Ever.""",
    },
    # ---- How to share portfolio / Portfolio link ----
    r"(share|sharing|portfolio link|portfolio url|qr|qr code)": {
        "keywords": ["portfolio", "link", "how", "my", "share", "send", "get", "where"],
        "response": """**To share your portfolio:**

1. Go to **Dashboard → Share & QR**
2. You'll find your public portfolio URL: `devsync.dev/portfolio/your-username`

**Sharing options:**
- 📋 **Copy Link** — One-click copy to clipboard
- 📱 **QR Code** — Download as PNG to put on your resume, business card, or email signature
- 🐦 **Social Media** — Share directly to Twitter/X, LinkedIn, and more

**Pro tips:**
- Add your DevSync link to your resume, LinkedIn, and GitHub profile
- Include the QR code on printed resumes — it impresses recruiters!
- Your portfolio is **always live** — keep it updated before applying""",
    },
    # ---- Is my portfolio public / Who can see it ----
    r"(who can see|public|visible|anyone|everyone)": {
        "keywords": ["portfolio", "profile", "my", "see", "view", "visible", "is"],
        "response": """**Portfolio visibility:**

- Your **portfolio page** (`/portfolio/your-username`) is **public** — anyone with the link can view it
- Your **dashboard, AI conversations, and settings** are **private** — only you can access them (behind login)
- **Analytics** shows you who visited your portfolio

**What's public:** Profile info, skills, projects, experience, education, certifications
**What's private:** Dashboard, AI chat history, portfolio analysis details, account settings

You control what sections to fill — empty sections won't appear on your public page.""",
    },
    # ---- How does the AI work ----
    r"(how does.*(ai|assistant)|what ai|which ai|which model|what model|ai work|ai use|llm|ollama)": {
        "keywords": ["how", "what", "which", "does", "work", "use", "model", "ai"],
        "response": """**DevSync AI — How it works:**

- **Model:** Llama 3.2 (1B parameters) via Ollama — runs 100% locally on your machine
- **No external APIs** — your data never leaves your computer (no OpenAI, Google, etc.)
- **RAG (Retrieval-Augmented Generation)** — the AI retrieves relevant DevSync knowledge to give accurate answers

**What it can do:**
- 💬 Answer portfolio and career questions
- 📊 Analyze your portfolio completeness with a score
- 💡 Give personalized improvement suggestions
- 📝 Help you write better project descriptions and bios

**Privacy:** Your conversations are stored locally and are private to your account.""",
    },
    # ---- Portfolio Analysis / Scoring ----
    r"(portfolio analysis|portfolio score|scoring|completeness|how.*score|what.*score)": {
        "keywords": [
            "what",
            "how",
            "score",
            "work",
            "mean",
            "analysis",
            "check",
            "my",
            "see",
        ],
        "response": """**Portfolio Analysis:**

DevSync scores your portfolio based on completeness and quality.

**How it works:**
1. Go to **Dashboard** — your score is shown on the main page
2. Or ask the AI: *"How can I improve my portfolio?"*

**Scoring criteria:**
- ✅ Profile completeness (photo, bio, title)
- ✅ Number and quality of skills (8-15 recommended)
- ✅ Projects with descriptions, links, and demos (3-6 recommended)
- ✅ Work experience with quantified achievements
- ✅ Education and certifications
- ✅ Social links (GitHub, LinkedIn)

**Score tiers:**
- 🏆 80-100%: Excellent — ready to impress
- 📈 50-79%: Good progress — follow the suggestions
- 🚀 0-49%: Just starting — focus on top priorities first""",
    },
    # ---- DevSync for students/freshers ----
    r"(student|fresher|freshman|fresh graduate|new graduate|no experience|first job|entry level|beginner developer)": {
        "keywords": [
            "i am",
            "i'm",
            "as a",
            "can",
            "help",
            "use",
            "how",
            "good",
            "suitable",
            "for",
        ],
        "response": """**DevSync for students & freshers:**

Absolutely! DevSync is **perfect for students and fresh graduates** — here's how to make it work:

1. **Projects > Experience** — No work history? Showcase personal projects, hackathon entries, and coursework
2. **GitHub Integration** — Import your repos directly from GitHub to save time
3. **Skills with honest levels** — Show Beginner/Intermediate levels (more credible than all "Expert")
4. **Education matters more** — Highlight relevant coursework, GPA (if strong), and academic projects
5. **Certifications** — Free certs from freeCodeCamp, HackerRank, and Coursera add credibility
6. **Bootcamps & courses** — Add structured learning paths to your Education section

**Pro tip:** Even 2-3 solid projects with good descriptions beat an empty resume. Start building and adding them to DevSync!""",
    },
    # ---- DevSync vs LinkedIn ----
    r"(linkedin|different from|compare|comparison|vs|versus|better than)": {
        "keywords": [
            "linkedin",
            "different",
            "compare",
            "vs",
            "versus",
            "better",
            "why",
            "instead",
        ],
        "response": """**DevSync vs LinkedIn:**

They serve **different purposes** — use both together!

| | **DevSync** | **LinkedIn** |
|---|---|---|
| **Focus** | Developer portfolio — showcasing code & projects | Professional networking |
| **Projects** | Full descriptions, GitHub links, live demos, screenshots | Basic listing |
| **Skills** | Proficiency levels (0-100%) | Endorsements from connections |
| **AI** | Built-in AI coach for portfolio improvement | No personal AI |
| **Resume** | ATS-ready PDF export from your data | Basic PDF |
| **Privacy** | Open source, local AI, no data selling | Corporate data policies |

**Best strategy:** Build your portfolio on DevSync, then link it from your LinkedIn profile. Recruiters love seeing actual work!""",
    },
    # ---- Theme customization ----
    r"(theme|color|customize|customise|appearance|look|design|brand)": {
        "keywords": [
            "change",
            "how",
            "custom",
            "my",
            "portfolio",
            "set",
            "update",
            "can",
        ],
        "response": """**Customize your portfolio theme:**

1. Go to **Dashboard → Settings → Theme**
2. Choose your colors:
   - **Primary color** — Main accent color for your portfolio
   - **Secondary color** — Supporting color
   - **Accent color** — Highlights and call-to-action elements

**Tips:**
- Match colors to your personal brand
- Dark backgrounds with bright accents look professional
- Keep it consistent — your portfolio URL, resume, and LinkedIn should feel cohesive
- Changes apply instantly to your public portfolio""",
    },
    # ---- Open source ----
    r"(open source|opensource|source code|contribute|github repo|self.host)": {
        "keywords": ["is", "devsync", "can", "how", "where", "contribute", "source"],
        "response": """**DevSync is 100% open source!**

- 🔓 Full source code available on GitHub
- 🛠️ Built with: **Next.js** (frontend) + **Django** (backend) + **Ollama/Llama** (AI)
- 🐳 Docker support for easy self-hosting
- 📖 MIT License — use it however you want

**Want to contribute?**
1. Fork the repo on GitHub
2. Check open issues for beginner-friendly tasks
3. Submit a pull request

**Self-hosting:** Follow the deployment guide for Docker, PythonAnywhere, Render, or Kubernetes.""",
    },
    # ---- GitHub import ----
    r"(import|github import|import repo|import project)": {
        "keywords": [
            "github",
            "repo",
            "repository",
            "import",
            "how",
            "project",
            "from",
        ],
        "response": """**Import projects from GitHub:**

1. Go to **Dashboard → Import**
2. Connect your GitHub account
3. Select repositories to import as portfolio projects
4. DevSync pulls: name, description, languages, and links

**After importing:**
- Edit descriptions to explain the *impact* (not just the tech)
- Add live demo URLs if applicable
- Upload screenshots to make projects visual
- Sort projects by relevance (best work first)

**Tip:** Don't import everything — curate your 3-6 best repos that show range and quality.""",
    },
    # ---- Analytics / Who viewed my portfolio ----
    r"(analytics|views|visitors|traffic|who viewed|who visited|stats|statistics)": {
        "keywords": [
            "portfolio",
            "my",
            "how",
            "many",
            "see",
            "check",
            "where",
            "views",
        ],
        "response": """**Portfolio Analytics:**

Go to **Dashboard → Analytics** to see:
- 👀 **Total views** — how many people viewed your portfolio
- 📈 **View trends** — track growth over time
- 🔗 **Referral sources** — where visitors come from

**Tips to increase views:**
- Share your portfolio link on LinkedIn posts
- Add it to your GitHub profile README
- Include the QR code on your printed resume
- Share it with recruiters proactively — don't wait for them to find you""",
    },
    # ---- Contact / Messages ----
    r"(contact|message|someone contacted|inbox)": {
        "keywords": [
            "form",
            "message",
            "how",
            "where",
            "check",
            "someone",
            "receive",
            "get",
        ],
        "response": """**Contact form & Messages:**

Your public portfolio has a **contact form** — visitors can message you directly!

**To check messages:**
1. Go to **Dashboard → Messages**
2. View all contact submissions from portfolio visitors

**How it works:**
- Visitors fill out a form on your public portfolio page
- Messages land in your Dashboard inbox
- You can respond to opportunities directly

**Tip:** Mention in your bio that you're *"open to opportunities"* — it encourages recruiters to reach out via the contact form.""",
    },
    # ---- Support / Bug report ----
    r"(support|help|bug|report|issue|problem|not working|broken|error)": {
        "keywords": [
            "contact",
            "support",
            "report",
            "problem",
            "bug",
            "help",
            "fix",
            "issue",
            "not",
        ],
        "response": """**Need help or found a bug?**

- 🐛 **Report bugs:** Open an issue on our GitHub repository
- 💬 **Ask questions:** Use this AI assistant — I can help with most DevSync topics
- 📖 **Documentation:** Check the README and deployment guides on GitHub

**Common fixes:**
- **AI not responding?** Make sure Ollama is running (`ollama serve`)
- **Slow responses?** The AI runs locally — speed depends on your hardware
- **Login issues?** Try resetting your password or clearing browser cache""",
    },
    # ---- How to make portfolio stand out ----
    r"(stand out|impressive|best portfolio|great portfolio|strong portfolio|good portfolio|perfect portfolio)": {
        "keywords": ["how", "make", "my", "portfolio", "a", "what", "tips", "create"],
        "response": """**How to make your portfolio stand out:**

1. **Professional photo + compelling bio** — First impressions matter (profiles with photos get 14x more views)
2. **3-6 quality projects** — Each solving a real problem, with live demos and GitHub links
3. **Quantified achievements** — "Reduced load time by 60%" beats "Improved performance"
4. **Diverse skill showcase** — Mix of frontend, backend, tools at honest proficiency levels
5. **Active GitHub** — Pin best repos, write solid READMEs, show consistent commits
6. **Custom theme** — Personalize your portfolio colors to build your brand
7. **ATS-ready PDF** — Export your DevSync resume for job applications
8. **Keep it updated** — Add new projects quarterly; stale portfolios lose impact

**Start now:** Run **Portfolio Analysis** to see your score and top priorities!""",
    },
}


# Words that indicate the user is asking for career/interview/job-search advice
# These should ALWAYS go to Ollama for a nuanced answer, never the Smart Engine
CAREER_CONTEXT_WORDS = {
    "interview",
    "interviews",
    "interviewing",
    "hired",
    "hire",
    "hiring",
    "salary",
    "negotiate",
    "offer",
    "selected",
    "selection",
    "shortlist",
    "recruiter",
    "recruiting",
    "placement",
    "placement",
    "company",
    "companies",
    "apply",
    "applying",
    "application",
    "resume",
    "cv",
    "cover letter",
    "job search",
    "job hunt",
    "freelance",
    "freelancing",
    "remote work",
    "career change",
    "career path",
    "career advice",
    "career growth",
    "stand out",
    "competitive",
    "land a job",
    "crack",
    "prepare",
}


def get_smart_response(message: str, user=None) -> str | None:
    """
    Smart Response Engine - returns instant response ONLY for clear DevSync questions.
    Returns None for other questions (will use fast Ollama instead).

    Improved matching: requires both category pattern AND keyword match to avoid
    false positives. Longer/complex messages are forwarded to Ollama for nuanced answers.
    Career/interview questions are always routed to Ollama.
    """
    message_lower = message.lower().strip()

    # Skip smart responses for longer, complex messages — Ollama handles these better
    word_count = len(message_lower.split())
    if word_count > 15:
        return None

    # FIRST: Check DevSync-specific FAQ (before career bypass)
    # If someone asks "how does DevSync help me get selected" — that's about the platform
    # Use best-match scoring: pick the FAQ with the most keyword hits to avoid
    # broad patterns like "devsync" stealing matches from specific ones like "open source"
    best_faq_match = None
    best_faq_score = 0
    for pattern, config in DEVSYNC_FAQ.items():
        if re.search(pattern, message_lower):
            kw_hits = sum(1 for kw in config["keywords"] if kw in message_lower)
            if kw_hits > 0 and kw_hits > best_faq_score:
                best_faq_score = kw_hits
                best_faq_match = config["response"]
    if best_faq_match:
        return best_faq_match

    # If the query is about career/interview/job topics, always route to Ollama
    # These need nuanced, contextual answers — not canned responses
    words_set = set(message_lower.split())
    if words_set & CAREER_CONTEXT_WORDS:
        return None
    # Also check multi-word career phrases
    for phrase in (
        "job search",
        "job hunt",
        "cover letter",
        "career change",
        "career path",
        "career advice",
        "career growth",
        "stand out",
        "land a job",
        "remote work",
    ):
        if phrase in message_lower:
            return None

    # Only handle clear DevSync-specific questions
    for pattern, config in SMART_RESPONSES.items():
        if re.search(pattern, message_lower):
            if any(kw in message_lower for kw in config["keywords"]):
                response = config["response"]

                # Dynamic response for portfolio improvement
                if response is None and user:
                    analysis = analyze_portfolio_completeness(user)
                    score = analysis["completeness_score"]
                    issues = analysis["issues"][:5]
                    suggestions = analysis["suggestions"][:3]
                    strengths = analysis["strengths"][:3]

                    response = f"""**Your Portfolio Score: {score}%**\n\n"""

                    if strengths:
                        response += "**✅ Strengths:**\n"
                        for s in strengths:
                            response += f"• {s}\n"
                        response += "\n"

                    if issues:
                        response += "**🔴 Top priorities to fix:**\n"
                        for issue in issues:
                            response += f"• {issue}\n"
                        response += "\n"

                    if suggestions:
                        response += "**💡 Suggestions:**\n"
                        for suggestion in suggestions:
                            response += f"• {suggestion}\n"
                        response += "\n"

                    if score >= 80:
                        response += "✨ **Great job!** Your portfolio is strong. Keep projects updated and add recent work."
                    elif score >= 50:
                        response += "📈 **Good progress!** Focus on the priorities above to reach 80%+."
                    else:
                        response += "🚀 **Let's improve this!** Start with the top priorities — even small updates make a big difference."

                return response

    # Check dev-related questions (instant responses) — only for short, simple queries
    if word_count <= 10:
        for pattern, response in DEV_RESPONSES.items():
            if re.search(pattern, message_lower):
                return response

    # Return None for complex/unique questions - let Ollama handle them
    return None


# ================== Throttling Classes ==================
class AIStatusThrottle(UserRateThrottle):
    """Rate limit for AI status checks - generous limit."""

    rate = "60/minute"


class AIAnalysisThrottle(UserRateThrottle):
    """Rate limit for portfolio analysis - moderate limit."""

    rate = "30/minute"


class AIChatThrottle(UserRateThrottle):
    """Rate limit for AI chat - conservative to prevent abuse."""

    rate = "20/minute"


class AIChatStreamThrottle(UserRateThrottle):
    """Rate limit for streaming chat."""

    rate = "10/minute"


# ================== Helper Functions ==================
def format_error_response(
    error: Exception, default_message: str = "An error occurred"
) -> dict:
    """Format error for API response."""
    if isinstance(error, OllamaConnectionError):
        return {
            "error": "AI service is not available",
            "detail": "Please ensure Ollama is running on your machine.",
            "code": "ai_unavailable",
        }
    elif isinstance(error, OllamaTimeoutError):
        return {
            "error": "AI request timed out",
            "detail": "The request took too long. Try a shorter message.",
            "code": "ai_timeout",
        }
    elif isinstance(error, OllamaModelError):
        return {
            "error": "AI model error",
            "detail": str(error),
            "code": "ai_model_error",
        }
    elif isinstance(error, OllamaError):
        return {"error": "AI service error", "detail": str(error), "code": "ai_error"}
    else:
        return {
            "error": default_message,
            "detail": str(error) if str(error) else default_message,
            "code": "unknown_error",
        }


class ConversationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing AI conversations.

    Provides CRUD operations for conversation history.
    """

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "list":
            return ConversationListSerializer
        return ConversationSerializer

    def get_queryset(self):
        return (
            Conversation.objects.filter(user=self.request.user)
            .select_related("user")
            .prefetch_related("messages")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def list(self, request, *args, **kwargs):
        """List conversations with pagination."""
        queryset = self.get_queryset()[:50]  # Limit to 50 most recent
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Delete a conversation."""
        try:
            instance = self.get_object()
            logger.info(f"User {request.user.id} deleting conversation {instance.id}")
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Failed to delete conversation: {e}")
            return Response(
                {"error": "Failed to delete conversation"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ChatViewSet(viewsets.ViewSet):
    """
    ViewSet for AI chat functionality.

    Production-ready with:
    - Rate limiting per endpoint
    - Comprehensive error handling
    - Request logging
    """

    permission_classes = [IsAuthenticated]

    def get_throttles(self):
        """Return appropriate throttle based on action."""
        if self.action == "status":
            return [AIStatusThrottle()]
        elif self.action == "analyze":
            return [AIAnalysisThrottle()]
        elif self.action == "stream":
            return [AIChatStreamThrottle()]
        return [AIChatThrottle()]

    @action(detail=False, methods=["get"])
    def status(self, request):
        """
        Check if AI service is available.

        Returns service status and available models.
        Cached for performance.
        """
        start_time = time.time()

        try:
            # In smart-only mode, AI is always "available" via Smart Response Engine
            if is_smart_only_mode():
                elapsed = time.time() - start_time
                return Response(
                    {
                        "available": True,
                        "mode": "smart_only",
                        "model": "Smart Response Engine",
                        "models": ["Smart Response Engine"],
                        "response_time_ms": int(elapsed * 1000),
                    }
                )

            # Check Gemini mode first (cloud deployment)
            if is_gemini_mode():
                is_available = is_gemini_available()
                elapsed = time.time() - start_time
                return Response(
                    {
                        "available": is_available,
                        "mode": "gemini",
                        "model": gemini_service.model,
                        "models": [m.get("name") for m in gemini_service.get_models()],
                        "response_time_ms": int(elapsed * 1000),
                    }
                )

            # Fallback to Ollama (local deployment)
            is_available = ollama_service.is_available(use_cache=True)
            models = ollama_service.get_models(use_cache=True) if is_available else []

            elapsed = time.time() - start_time
            logger.debug(f"AI status check completed in {elapsed:.2f}s")

            return Response(
                {
                    "available": is_available,
                    "mode": "full",
                    "model": ollama_service.model,
                    "models": [m.get("name") for m in models],
                    "response_time_ms": int(elapsed * 1000),
                }
            )
        except Exception as e:
            logger.error(f"AI status check failed: {e}")
            return Response(
                {
                    "available": False,
                    "mode": "unknown",
                    "model": "unknown",
                    "models": [],
                    "error": "Failed to check AI status",
                }
            )

    @action(detail=False, methods=["get"])
    def analyze(self, request):
        """
        Get portfolio analysis without AI chat.

        Returns completeness score, issues, suggestions, and strengths.
        Results are cached for 5 minutes.
        """
        start_time = time.time()

        try:
            analysis = analyze_portfolio_completeness(request.user)

            elapsed = time.time() - start_time
            logger.info(
                f"Portfolio analysis for user {request.user.id}: score={analysis['completeness_score']}%"
            )

            return Response({**analysis, "response_time_ms": int(elapsed * 1000)})
        except Exception as e:
            logger.error(f"Portfolio analysis failed for user {request.user.id}: {e}")
            return Response(
                format_error_response(e, "Failed to analyze portfolio"),
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["post"])
    def refresh_analysis(self, request):
        """
        Force refresh portfolio analysis cache.

        Use this after making portfolio changes.
        """
        try:
            invalidate_portfolio_cache(request.user)
            analysis = analyze_portfolio_completeness(request.user)
            return Response(analysis)
        except Exception as e:
            logger.error(f"Failed to refresh analysis: {e}")
            return Response(
                format_error_response(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=["post"])
    def send(self, request):
        """
        Send a message and get AI response.

        Uses Smart Response Engine for instant answers,
        falls back to Ollama for complex questions.
        """
        start_time = time.time()

        # Validate input
        serializer = ChatInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": "Invalid input", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        message_text = serializer.validated_data["message"]
        conversation_id = serializer.validated_data.get("conversation_id")
        include_portfolio = serializer.validated_data.get(
            "include_portfolio_context", False
        )

        logger.info(f"Chat request from user {request.user.id}")

        # ========== TRY SMART RESPONSE FIRST (INSTANT!) ==========
        smart_response = get_smart_response(message_text, request.user)

        if smart_response:
            # Get or create conversation
            if conversation_id:
                try:
                    conversation = Conversation.objects.get(
                        id=conversation_id, user=request.user
                    )
                except Conversation.DoesNotExist:
                    conversation = Conversation.objects.create(
                        user=request.user,
                        title=message_text[:50]
                        + ("..." if len(message_text) > 50 else ""),
                    )
            else:
                conversation = Conversation.objects.create(
                    user=request.user,
                    title=message_text[:50] + ("..." if len(message_text) > 50 else ""),
                )

            # Save messages
            Message.objects.create(
                conversation=conversation, role="user", content=message_text
            )
            assistant_message = Message.objects.create(
                conversation=conversation,
                role="assistant",
                content=smart_response,
                metadata={
                    "source": "smart_engine",
                    "response_time_ms": int((time.time() - start_time) * 1000),
                },
            )
            conversation.save()

            elapsed = time.time() - start_time
            logger.info(f"Smart response in {elapsed:.3f}s for user {request.user.id}")

            return Response(
                {
                    "response": smart_response,
                    "conversation_id": conversation.id,
                    "message_id": assistant_message.id,
                }
            )

        # ========== FALLBACK TO OLLAMA FOR COMPLEX QUESTIONS ==========
        # Get or create conversation
        conversation = None
        if conversation_id:
            try:
                conversation = Conversation.objects.get(
                    id=conversation_id, user=request.user
                )
            except Conversation.DoesNotExist:
                return Response(
                    {
                        "error": "Conversation not found",
                        "code": "conversation_not_found",
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

        if not conversation:
            conversation = Conversation.objects.create(
                user=request.user,
                title=message_text[:50] + ("..." if len(message_text) > 50 else ""),
            )

        # Save user message
        user_message = Message.objects.create(
            conversation=conversation, role="user", content=message_text
        )

        # Build message history for context (limit to recent messages)
        history = list(
            conversation.messages.values("role", "content").order_by("created_at")[
                :20
            ]  # Limit context window
        )

        # Build system prompt with portfolio context
        # Auto-include portfolio context for portfolio-related questions
        system_prompt = PORTFOLIO_SYSTEM_PROMPT
        message_lower = message_text.lower()
        portfolio_keywords = [
            "portfolio",
            "profile",
            "skill",
            "project",
            "experience",
            "education",
            "certification",
            "bio",
            "title",
            "photo",
            "avatar",
            "score",
            "improve",
            "review",
            "resume",
            "cv",
            "my ",
            "i have",
            "i need",
            "how do i",
            "what should",
        ]
        should_include_portfolio = include_portfolio or any(
            kw in message_lower for kw in portfolio_keywords
        )
        if should_include_portfolio:
            system_prompt += "\n\n" + get_portfolio_context(request.user)

        try:
            # Check if running in smart-only mode (no AI on free hosting)
            if is_smart_only_mode():
                # Use fallback response for unmatched questions in smart-only mode
                ai_response = SMART_ONLY_FALLBACK

                assistant_message = Message.objects.create(
                    conversation=conversation,
                    role="assistant",
                    content=ai_response,
                    metadata={
                        "source": "smart_only_fallback",
                        "response_time_ms": int((time.time() - start_time) * 1000),
                    },
                )
                conversation.save()

                elapsed = time.time() - start_time
                logger.info(
                    f"Smart-only fallback in {elapsed:.3f}s for user {request.user.id}"
                )

                return Response(
                    {
                        "response": ai_response,
                        "conversation_id": conversation.id,
                        "message_id": assistant_message.id,
                    }
                )

            # Check if using Gemini mode (cloud deployment)
            if is_gemini_mode():
                if not is_gemini_available():
                    user_message.delete()
                    if conversation.messages.count() == 0:
                        conversation.delete()
                    return Response(
                        {
                            "error": "AI service unavailable",
                            "detail": "Gemini API not configured",
                        },
                        status=status.HTTP_503_SERVICE_UNAVAILABLE,
                    )

                # Use Gemini for chat
                ai_response = gemini_service.chat(
                    message=message_text,
                    system_prompt=system_prompt,
                    conversation_history=history,
                )

                # Save assistant message
                assistant_message = Message.objects.create(
                    conversation=conversation,
                    role="assistant",
                    content=ai_response,
                    metadata={
                        "model": gemini_service.model,
                        "response_time_ms": int((time.time() - start_time) * 1000),
                        "source": "gemini",
                    },
                )

                conversation.save()
                elapsed = time.time() - start_time
                logger.info(
                    f"Gemini response generated in {elapsed:.2f}s for user {request.user.id}"
                )

                return Response(
                    {
                        "response": ai_response,
                        "conversation_id": conversation.id,
                        "message_id": assistant_message.id,
                    }
                )

            # Fallback to Ollama (local deployment)
            if not ollama_service.is_available(use_cache=True):
                user_message.delete()
                if conversation.messages.count() == 0:
                    conversation.delete()
                return Response(
                    format_error_response(
                        OllamaConnectionError("AI service unavailable"),
                        "AI service is not available",
                    ),
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

            # Try RAG-enhanced chat for better accuracy
            ai_response, rag_contexts = ollama_service.chat_with_rag(
                query=message_text,
                system_prompt=system_prompt,
                temperature=0.7,
                max_tokens=300,
                conversation_history=history,
            )

            # Save assistant message
            assistant_message = Message.objects.create(
                conversation=conversation,
                role="assistant",
                content=ai_response,
                metadata={
                    "model": ollama_service.model,
                    "response_time_ms": int((time.time() - start_time) * 1000),
                    "rag_contexts": len(rag_contexts),
                    "source": "rag" if rag_contexts else "ollama",
                },
            )

            # Update conversation timestamp
            conversation.save()

            elapsed = time.time() - start_time
            logger.info(
                f"AI response generated in {elapsed:.2f}s for user {request.user.id}"
            )

            response_serializer = ChatResponseSerializer(
                {
                    "response": ai_response,
                    "conversation_id": conversation.id,
                    "message_id": assistant_message.id,
                }
            )

            return Response(response_serializer.data)

        except (
            OllamaConnectionError,
            OllamaTimeoutError,
            OllamaModelError,
            OllamaError,
        ) as e:
            logger.error(f"AI error for user {request.user.id}: {e}")
            # Clean up on failure
            user_message.delete()
            if conversation.messages.count() == 0:
                conversation.delete()

            status_code = status.HTTP_503_SERVICE_UNAVAILABLE
            if isinstance(e, OllamaTimeoutError):
                status_code = status.HTTP_504_GATEWAY_TIMEOUT

            return Response(format_error_response(e), status=status_code)
        except Exception as e:
            logger.error(f"Unexpected error in AI chat: {e}", exc_info=True)
            # Clean up on failure
            user_message.delete()
            if conversation.messages.count() == 0:
                conversation.delete()

            return Response(
                format_error_response(e, "An unexpected error occurred"),
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["post"])
    def stream(self, request):
        """
        Stream a message response (Server-Sent Events).

        More efficient for long responses, provides real-time feedback.
        """
        serializer = ChatInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": "Invalid input", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        message_text = serializer.validated_data["message"]
        conversation_id = serializer.validated_data.get("conversation_id")
        include_portfolio = serializer.validated_data.get(
            "include_portfolio_context", False
        )

        # Get or create conversation
        conversation = None
        if conversation_id:
            try:
                conversation = Conversation.objects.get(
                    id=conversation_id, user=request.user
                )
            except Conversation.DoesNotExist:
                return Response(
                    {"error": "Conversation not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

        if not conversation:
            conversation = Conversation.objects.create(
                user=request.user,
                title=message_text[:50] + ("..." if len(message_text) > 50 else ""),
            )

        # Save user message
        Message.objects.create(
            conversation=conversation, role="user", content=message_text
        )

        # Build message history (limited)
        history = list(
            conversation.messages.values("role", "content").order_by("created_at")[:20]
        )

        # Build system prompt
        system_prompt = PORTFOLIO_SYSTEM_PROMPT
        if include_portfolio:
            system_prompt += get_portfolio_context(request.user)

        def generate():
            full_response = []
            start_time = time.time()

            try:
                for chunk in ollama_service.chat_stream(history, system_prompt):
                    full_response.append(chunk)
                    yield f"data: {chunk}\n\n"

                # Save complete response
                complete_response = "".join(full_response)
                elapsed = time.time() - start_time

                Message.objects.create(
                    conversation=conversation,
                    role="assistant",
                    content=complete_response,
                    metadata={
                        "model": ollama_service.model,
                        "streamed": True,
                        "response_time_ms": int(elapsed * 1000),
                    },
                )
                conversation.save()

                logger.info(
                    f"Streamed response in {elapsed:.2f}s for user {request.user.id}"
                )
                yield "data: [DONE]\n\n"

            except (OllamaError, OllamaConnectionError, OllamaTimeoutError) as e:
                logger.error(f"Stream error: {e}")
                yield f"data: [ERROR] {str(e)}\n\n"
            except Exception as e:
                logger.error(f"Unexpected stream error: {e}", exc_info=True)
                yield f"data: [ERROR] An unexpected error occurred\n\n"

        response = StreamingHttpResponse(generate(), content_type="text/event-stream")
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"  # Disable nginx buffering
        return response

    @action(detail=False, methods=["get"])
    def health(self, request):
        """
        Health check endpoint for monitoring.

        Returns detailed health status of AI service components.
        """
        health_status = {"status": "healthy", "components": {}}

        # Check Ollama
        try:
            ollama_available = ollama_service.is_available(use_cache=False)
            health_status["components"]["ollama"] = {
                "status": "healthy" if ollama_available else "unhealthy",
                "model": ollama_service.model,
                "url": ollama_service.base_url,
            }
            if not ollama_available:
                health_status["status"] = "degraded"
        except Exception as e:
            health_status["components"]["ollama"] = {
                "status": "unhealthy",
                "error": str(e),
            }
            health_status["status"] = "degraded"

        # Check cache
        try:
            cache.set("health_check", "ok", 1)
            cache_ok = cache.get("health_check") == "ok"
            health_status["components"]["cache"] = {
                "status": "healthy" if cache_ok else "unhealthy"
            }
        except Exception as e:
            health_status["components"]["cache"] = {
                "status": "unhealthy",
                "error": str(e),
            }

        status_code = (
            status.HTTP_200_OK
            if health_status["status"] == "healthy"
            else status.HTTP_503_SERVICE_UNAVAILABLE
        )
        return Response(health_status, status=status_code)
