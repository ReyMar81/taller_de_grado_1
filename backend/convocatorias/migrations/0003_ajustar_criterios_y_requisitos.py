# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('convocatorias', '0002_agregar_campos_oficiales_tipo_beca'),
    ]

    operations = [
        # Renombrar campos en CriterioEvaluacion
        migrations.RenameField(
            model_name='criterioevaluacion',
            old_name='tipo',
            new_name='tipo_dato',
        ),
        migrations.AddField(
            model_name='criterioevaluacion',
            name='valor_minimo',
            field=models.FloatField(null=True, blank=True, help_text='Valor mínimo permitido para criterios numéricos'),
        ),
        migrations.AddField(
            model_name='criterioevaluacion',
            name='valor_maximo',
            field=models.FloatField(null=True, blank=True, help_text='Valor máximo permitido para criterios numéricos'),
        ),
        migrations.AlterField(
            model_name='criterioevaluacion',
            name='ponderacion',
            field=models.FloatField(
                validators=[models.Q(ponderacion__gte=0), models.Q(ponderacion__lte=100)],
                help_text='Peso del criterio en porcentaje (0-100, puede tener decimales)'
            ),
        ),
        
        # Renombrar campos en RequisitoDocumento
        migrations.RenameField(
            model_name='requisitodocumento',
            old_name='tipo',
            new_name='tipo_archivo',
        ),
        migrations.RenameField(
            model_name='requisitodocumento',
            old_name='obligatorio',
            new_name='es_obligatorio',
        ),
        migrations.RemoveField(
            model_name='requisitodocumento',
            name='formato_permitido',
        ),
        migrations.RemoveField(
            model_name='requisitodocumento',
            name='tamano_maximo_mb',
        ),
        migrations.AlterField(
            model_name='requisitodocumento',
            name='tipo_archivo',
            field=models.CharField(
                max_length=30,
                default='PDF',
                help_text='Tipo de archivo: PDF, IMAGEN, DOCUMENTO, FORMULARIO, CUALQUIERA'
            ),
        ),
    ]
