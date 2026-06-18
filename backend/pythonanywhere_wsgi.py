"""
PythonAnywhere WSGI Configuration

Copy this content to your PythonAnywhere WSGI file:
/var/www/YOUR_USERNAME_pythonanywhere_com_wsgi.py

Replace YOUR_USERNAME with your actual PythonAnywhere username.
"""

import os
import sys

# Replace YOUR_USERNAME with your PythonAnywhere username
USERNAME = "YOUR_USERNAME"

# Add project to path
path = f"/home/{USERNAME}/Devsync/backend"
if path not in sys.path:
    sys.path.insert(0, path)

# Load environment variables from .env
from dotenv import load_dotenv

env_path = f"/home/{USERNAME}/Devsync/backend/.env"
load_dotenv(env_path)

# Set Django settings module
os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings"

# Get WSGI application
from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()
