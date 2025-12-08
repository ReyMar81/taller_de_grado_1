"""
Django settings for DUBSS project.
"""

from pathlib import Path
import os
from decouple import config

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='django-insecure-dev-key-change-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    
    # Local apps
    'users',
    'authentication',
    'convocatorias',
    'postulaciones',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'dubss.urls'

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
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'dubss.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='dubss'),
        'USER': config('DB_USER', default='dubss_user'),
        'PASSWORD': config('DB_PASSWORD', default='dubss_password_2025'),
        'HOST': config('DB_HOST', default='postgres'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

# Password validation
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
    },
]

# Internationalization
LANGUAGE_CODE = 'es-bo'
TIME_ZONE = 'America/La_Paz'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'users.Usuario'

# REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'authentication.backends.KeycloakAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# CORS settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CORS_ALLOW_CREDENTIALS = True

# Keycloak settings
KEYCLOAK_SERVER_URL = config('KEYCLOAK_SERVER_URL', default='http://keycloak:8080')
KEYCLOAK_REALM = config('KEYCLOAK_REALM', default='dubss')
KEYCLOAK_CLIENT_ID = config('KEYCLOAK_CLIENT_ID', default='dubss-backend')
KEYCLOAK_CLIENT_SECRET = config('KEYCLOAK_CLIENT_SECRET', default='')

# MinIO settings
MINIO_ENDPOINT = config('MINIO_ENDPOINT', default='minio:9000')
MINIO_ACCESS_KEY = config('MINIO_ACCESS_KEY', default='minioadmin')
MINIO_SECRET_KEY = config('MINIO_SECRET_KEY', default='minioadmin123')
MINIO_SECURE = config('MINIO_SECURE', default=False, cast=bool)
MINIO_BUCKET_NAME = 'dubss-documents'

# Institutional API settings
INSTITUTIONAL_API_URL = config('INSTITUTIONAL_API_URL', default='http://institutional-api:8001')

# Media files (uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# DRF Spectacular settings
SPECTACULAR_SETTINGS = {
    'TITLE': 'DUBSS API',
    'DESCRIPTION': 'Sistema de Gestión de Becas con IA y Blockchain - UAGRM',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}
