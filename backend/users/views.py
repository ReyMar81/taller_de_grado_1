from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Usuario
from .serializers import UsuarioSerializer, UsuarioDetailSerializer


class UsuarioViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para consultar usuarios
    Solo lectura - Los usuarios se crean/actualizan via Keycloak
    """
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return UsuarioDetailSerializer
        return UsuarioSerializer
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Obtener información del usuario autenticado"""
        serializer = UsuarioDetailSerializer(request.user)
        return Response(serializer.data)
