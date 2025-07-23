import os
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
import django

django.setup()

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

import os
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from backend.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
  "http": get_asgi_application(),
  "websocket": URLRouter(websocket_urlpatterns)
})