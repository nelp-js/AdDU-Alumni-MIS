import os
from django.core.wsgi import get_wsgi_application

# Tell Django where your settings are located
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Get the WSGI application
_application = get_wsgi_application()

def app(environ, start_response):
    # Vercel rewrites the URL to /api/index, which confuses Django.
    # We can restore the original path using the HTTP_X_NOW_ROUTE header or REQUEST_URI
    original_url = environ.get('HTTP_X_NOW_ROUTE', environ.get('REQUEST_URI', ''))
    
    # Strip any query parameters from the path
    if '?' in original_url:
        original_url = original_url.split('?')[0]
        
    if original_url:
        environ['PATH_INFO'] = original_url

    return _application(environ, start_response)
