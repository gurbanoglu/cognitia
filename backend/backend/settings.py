import os
from pathlib import Path
from dotenv import load_dotenv

# Go three levels up.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

print('BASE_DIR:', BASE_DIR)

dotenv_path = BASE_DIR / '.env'

load_dotenv(dotenv_path)

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-pdntuw_59%zf&kumx&!!9!f=lv4z&_o$549^8*=n6po0z)@-#l'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []

INSTALLED_APPS = [
	'django.contrib.admin',
	'django.contrib.auth',
	'django.contrib.contenttypes',
	'django.contrib.sessions',
	'django.contrib.messages',
	'django.contrib.staticfiles',
  'corsheaders',
	'core',
  'channels'
]

SITE_ID = 1

MIDDLEWARE = [
	'django.middleware.security.SecurityMiddleware',
	'django.contrib.sessions.middleware.SessionMiddleware',
	'corsheaders.middleware.CorsMiddleware',
	'django.middleware.common.CommonMiddleware',
	'django.middleware.csrf.CsrfViewMiddleware',
	'django.contrib.auth.middleware.AuthenticationMiddleware',
	'django.contrib.messages.middleware.MessageMiddleware',
	'django.middleware.clickjacking.XFrameOptionsMiddleware'
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
	{
		'BACKEND': 'django.template.backends.django.DjangoTemplates',
		'DIRS': [],
		'APP_DIRS': True,
		'OPTIONS': {
			'context_processors': [
				'django.template.context_processors.debug',
				'django.template.context_processors.request',
				'django.contrib.auth.context_processors.auth',
				'django.contrib.messages.context_processors.messages'
			]
		}
	}
]

WSGI_APPLICATION = 'backend.wsgi.application'

# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

DATABASES = {
	"default": {
		"ENGINE": "django.db.backends.postgresql",
		"NAME": os.environ.get("DB_NAME"),
		"USER": os.environ.get("DB_USER"),
		"PASSWORD": os.environ.get("DB_PASS"),
		"HOST": os.environ.get("DB_HOST"),
		"PORT": "5432"
	}
}

# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
	{
		'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
	},
	{
		'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
	},
	{
		'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
	},
	{
		'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
	}
]

# The subsequent setting is for development purposes
# only because it allows all origins (i.e., any domain)
# to make cross-origin requests to your Django backend.
# It effectively disables CORS restrictions, meaning
# any website can send requests to your API without
# being blocked by the browser's same-origin policy.
# CORS_ORIGIN_ALLOW_ALL = True

# Explicitly lists the allowed origins (domains) that
# can make cross-origin requests to your Django backend.
# When CORS_ORIGIN_ALLOW_ALL is set to False, only the
# domains in this list will be permitted to access your
# API.
CORS_ALLOWED_ORIGINS = [
	'http://localhost:5173',
  'http://172.20.0.4:5173'
]

# Allows browsers to include credentials such as
# cookies, HTTP authentication, or client-side SSL
# certificates in cross-origin requests. When set
# to True, it enables the server to accept and respond
# to requests that include credentials.
CORS_ALLOW_CREDENTIALS = True

# Session backend (default)
SESSION_ENGINE = 'django.contrib.sessions.backends.db'

CSRF_TRUSTED_ORIGINS = [
  'http://localhost:5173',
  'http://172.20.0.4:5173'
]

# Internationalisation
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# The URL path where users are redirected after
# a successful login.
LOGIN_REDIRECT_URL = '/callback/'

# Configures social authentication providers for
# Django Allauth.
# SOCIALACCOUNT_PROVIDERS = {
# 	'google': {
#     # SCOPE: Specifies the OAuth scopes requested from
# 		# Google. 'email' and 'profile' allow access to the
# 		# user's email address and basic profile information.
# 		'SCOPE': ['email', 'profile'],

# 		# The application is requesting immediate, short-term
# 		# access to the user's Google account without asking
# 		# for a refresh token. In this mode, Google issues an
# 		# access token that allows the app to access the user's
# 		# data only while the user is actively using the app.
# 		'AUTH_PARAMS': {'access_type': 'online'},
    
# 		# OAUTH_PKCE_ENABLED: Enables Proof Key for Code
# 		# Exchange (PKCE), an OAuth 2.0 extension that adds
# 		# security to the authorization code flow, especially
# 		# for public clients like single-page apps.
# 		'OAUTH_PKCE_ENABLED': True,
    
# 		# FETCH_USERINFO: When set to True, Allauth will fetch
# 		# additional user information from Google's userinfo
# 		# endpoint after authentication to populate the user
# 		# profile.
# 		'FETCH_USERINFO': True
# 	}
# }

# This setting tells Django Allauth to store the
# OAuth access and refresh tokens received from
# the social provider (Google in this case) in
# the database.
# SOCIALACCOUNT_STORE_TOKENS = True

CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL")

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD")

AUTH_USER_MODEL = 'core.CustomUser'

ASGI_APPLICATION = 'backend.asgi.application'

CHANNEL_LAYERS = {
	"default": {
		"BACKEND": "channels.layers.InMemoryChannelLayer"
	}
}

# CHANNEL_LAYERS = {
#   "default": {
#     "BACKEND": "channels_redis.core.RedisChannelLayer",
#     "CONFIG": {
#       "hosts": [("redis", 6379)],
#     },
#   },
# }