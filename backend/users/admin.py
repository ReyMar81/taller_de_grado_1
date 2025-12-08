from django.contrib import admin
from .models import Usuario, PerfilEstudiante, PerfilInstitucional


@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'correo', 'rol', 'is_active', 'fecha_creacion']
    list_filter = ['rol', 'is_active']
    search_fields = ['nombre', 'correo', 'keycloak_user_id']
    readonly_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']


@admin.register(PerfilEstudiante)
class PerfilEstudianteAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'registro_universitario', 'carrera', 'validado_institucionalmente']
    list_filter = ['validado_institucionalmente', 'facultad']
    search_fields = ['registro_universitario', 'usuario__nombre', 'usuario__correo']


@admin.register(PerfilInstitucional)
class PerfilInstitucionalAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'cargo', 'unidad']
    search_fields = ['usuario__nombre', 'cargo', 'unidad']
