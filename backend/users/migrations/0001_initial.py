# Generated initial migration for users app

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='Usuario',
            fields=[
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('nombre', models.CharField(max_length=200)),
                ('correo', models.EmailField(db_index=True, max_length=254, unique=True)),
                ('telefono', models.CharField(blank=True, max_length=20, null=True)),
                ('rol', models.CharField(choices=[('DIRECTOR', 'Director DUBSS'), ('ANALISTA', 'Analista de Becas'), ('RESPONSABLE', 'Responsable de Seguimiento'), ('ESTUDIANTE_POSTULANTE', 'Estudiante Postulante'), ('ESTUDIANTE_BECADO', 'Estudiante Becado')], max_length=25)),
                ('keycloak_user_id', models.CharField(blank=True, db_index=True, max_length=100, null=True, unique=True)),
                ('is_active', models.BooleanField(default=True)),
                ('is_staff', models.BooleanField(default=False)),
                ('fecha_creacion', models.DateTimeField(default=django.utils.timezone.now)),
                ('fecha_actualizacion', models.DateTimeField(auto_now=True)),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
            ],
            options={
                'verbose_name': 'Usuario',
                'verbose_name_plural': 'Usuarios',
                'db_table': 'usuario',
                'ordering': ['-fecha_creacion'],
            },
        ),
        migrations.CreateModel(
            name='PerfilInstitucional',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('unidad', models.CharField(max_length=200)),
                ('cargo', models.CharField(max_length=200)),
                ('usuario', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='perfil_institucional', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Perfil Institucional',
                'verbose_name_plural': 'Perfiles Institucionales',
                'db_table': 'perfil_institucional',
            },
        ),
        migrations.CreateModel(
            name='PerfilEstudiante',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('registro_universitario', models.CharField(db_index=True, max_length=20, unique=True)),
                ('facultad', models.CharField(max_length=200)),
                ('carrera', models.CharField(max_length=200)),
                ('validado_institucionalmente', models.BooleanField(default=False)),
                ('fecha_validacion', models.DateTimeField(blank=True, null=True)),
                ('usuario', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='perfil_estudiante', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Perfil Estudiante',
                'verbose_name_plural': 'Perfiles Estudiantes',
                'db_table': 'perfil_estudiante',
            },
        ),
    ]
