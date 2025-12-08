from django.urls import path
from .views import (
    verify_token,
    health_check,
    debug_auth,
    validate_student,
    register_student
)

urlpatterns = [
    path('verify/', verify_token, name='verify-token'),
    path('health/', health_check, name='health-check'),
    path('debug/', debug_auth, name='debug-auth'),
    path('validate-student/', validate_student, name='validate-student'),
    path('register/', register_student, name='register-student'),
]
