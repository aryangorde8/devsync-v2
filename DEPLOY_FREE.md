# PythonAnywhere Free Deployment Guide (NO CREDIT CARD)

## ⚠️ Important: AI Mode for Free Hosting

Since PythonAnywhere doesn't support running Ollama (AI model), we use **Smart-Only Mode**:

```
AI_MODE=smart_only
```

This uses the **Smart Response Engine** which handles:
- ✅ Portfolio questions (adding projects, skills, experience)
- ✅ Developer tool comparisons (ChatGPT vs Copilot, React vs Vue)
- ✅ Career advice (interviews, resumes, learning paths)
- ✅ Tech recommendations (best frameworks, databases)

**90% of questions work instantly** without any AI model!

---

## Step 1: Create Account
1. Go to https://www.pythonanywhere.com
2. Click "Start running Python online" → "Create a Beginner account"
3. **NO credit card required!**

## Step 2: Upload Your Code
```bash
# Option A: Clone from GitHub
git clone https://github.com/aryangorde8/Devsync.git
cd Devsync/backend

# Option B: Upload as ZIP
# Go to Files tab → Upload → upload backend folder
```

## Step 3: Create Virtual Environment
In PythonAnywhere Bash console:
```bash
mkvirtualenv --python=/usr/bin/python3.10 devsync
workon devsync
pip install -r requirements.txt
```

## Step 4: Configure Database (Free MySQL)
1. Go to "Databases" tab
2. Initialize MySQL (free!)
3. Create database: `devsync`
4. Note your database password

## Step 5: Create .env file
```bash
# In /home/YOUR_USERNAME/Devsync/backend/.env
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=YOUR_USERNAME.pythonanywhere.com
DATABASE_URL=mysql://YOUR_USERNAME:YOUR_DB_PASSWORD@YOUR_USERNAME.mysql.pythonanywhere-services.com/YOUR_USERNAME$devsync
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
AI_MODE=smart_only
```

## Step 6: Run Migrations
```bash
workon devsync
cd ~/Devsync/backend
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic --noinput
```

## Step 7: Configure Web App
1. Go to "Web" tab
2. Click "Add a new web app"
3. Choose "Manual configuration" → Python 3.10
4. Set these paths:
   - Source code: `/home/YOUR_USERNAME/Devsync/backend`
   - Working directory: `/home/YOUR_USERNAME/Devsync/backend`
   - Virtualenv: `/home/YOUR_USERNAME/.virtualenvs/devsync`

## Step 8: Edit WSGI File
Click on WSGI configuration file and replace with:
```python
import os
import sys

# Add project to path
path = '/home/YOUR_USERNAME/Devsync/backend'
if path not in sys.path:
    sys.path.append(path)

os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

## Step 9: Static Files
In Web tab, add static file mapping:
- URL: `/static/`
- Directory: `/home/YOUR_USERNAME/Devsync/backend/staticfiles/`

## Step 10: Reload
Click "Reload" button on Web tab.

Your API is now live at: `https://YOUR_USERNAME.pythonanywhere.com`

---

## Frontend Deployment (Vercel - NO CARD)

1. Go to https://vercel.com
2. Sign up with GitHub (no card needed!)
3. Import your repo: `aryangorde8/Devsync`
4. Set root directory: `frontend`
5. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = `https://YOUR_USERNAME.pythonanywhere.com/api/v1`
6. Deploy!

---

## Database Option: Neon (NO CARD)

If you prefer PostgreSQL over MySQL:
1. Go to https://neon.tech
2. Sign up with GitHub (no card!)
3. Create project
4. Copy connection string
5. Use in DATABASE_URL instead of MySQL
