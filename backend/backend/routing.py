from django.urls import re_path
from core.consumers import NotificationConsumer
from core.consumers import SessionConsumer

websocket_urlpatterns = [
  # re_path(r'ws/simple/$', NotificationConsumer.as_asgi()),
  re_path(r"^ws/session/(?P<session_id>[0-9a-f-]+)/$", SessionConsumer.as_asgi()),
]