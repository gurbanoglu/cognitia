# Generated by Django 5.1.3 on 2025-06-30 14:21

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_alter_aichatsession_session_id'),
    ]

    operations = [
        migrations.AlterField(
            model_name='aichatsession',
            name='session_id',
            field=models.CharField(default='RHoWXZIjbHdq9DkfPb8RVQ', editable=False, help_text='Unique Base64-encoded session ID', max_length=24, unique=True),
        ),
    ]
