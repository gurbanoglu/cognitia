from django.urls import re_path
from core.consumers import NotificationConsumer

websocket_urlpatterns = [
  re_path(r'ws/simple/$', NotificationConsumer.as_asgi()),
]