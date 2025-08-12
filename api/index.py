"""
Vercel serverless function entry point for the Trading Bot API
"""
import sys
import os

# Add the parent directory to the path to import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api import app

# Export the FastAPI app for Vercel
app = app
