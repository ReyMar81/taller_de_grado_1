"""
Permisos personalizados para el sistema de becas
"""
from rest_framework import permissions


class IsDirectorOrAnalista(permissions.BasePermission):
    """
    Permite acceso solo a Directores y Analistas de Becas
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.rol in ['DIRECTOR', 'ANALISTA']
        )


class IsDirector(permissions.BasePermission):
    """
    Permite acceso solo a Directores
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.rol == 'DIRECTOR'
        )


class IsAnalista(permissions.BasePermission):
    """
    Permite acceso solo a Analistas de Becas
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.rol == 'ANALISTA'
        )


class IsEstudiante(permissions.BasePermission):
    """
    Permite acceso solo a Estudiantes (postulantes o becados)
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.rol in ['ESTUDIANTE_POSTULANTE', 'ESTUDIANTE_BECADO']
        )


class IsResponsableSeguimiento(permissions.BasePermission):
    """
    Permite acceso solo a Responsables de Seguimiento Académico
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.rol == 'RESPONSABLE_SEGUIMIENTO'
        )
