import os
from django.core.wsgi import get_wsgi_application

# Tell Django where your settings are located
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Get the WSGI application
app = get_wsgi_application()
