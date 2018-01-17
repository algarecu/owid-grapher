# -*- coding: utf-8 -*-
# Generated by Django 1.11 on 2018-01-17 00:22
from __future__ import unicode_literals

from django.db import migrations

def execute(apps, schema_editor):
    Chart = apps.get_model('grapher_admin', 'Chart')
    for chart in Chart.objects.all():
        chart.config['version'] = 1
        chart.save()

class Migration(migrations.Migration):

    dependencies = [
        ('grapher_admin', '0027_auto_20180105_0712'),
    ]

    operations = [
        migrations.RunPython(execute)
    ]
