"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path

from backend.views import (
	send_verification_code,
  verify_token,
  check_if_active,
  login_with_email
)

from core.views import (
  create_chat_session,
  chat_session,
  chat_session_detail,
  update_user_message,
  save_chat_session,
  get_all_sessions
)

from .views import get_csrf_token

urlpatterns = [
  path('admin/', admin.site.urls),
	path('api/chat-page/sessions/', create_chat_session),
	path('api/chat-page/sessions/<str:session_id>/', chat_session),
	path('send-verification-code/', send_verification_code),
	path('verify-token/', verify_token),
  path('check-if-active/', check_if_active),
  path('login-with-email/', login_with_email),
  path('api/get-csrf-token/', get_csrf_token),
  path('chat-page/<slug:slug>/', chat_session_detail),
  path('save-chat-session/', save_chat_session),
  path('get-all-sessions/', get_all_sessions),
  path('api/chat-page/update/<str:session_id>/<int:message_index>/', update_user_message)
]