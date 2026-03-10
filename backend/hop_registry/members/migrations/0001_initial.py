from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import members.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='MemberProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('membership_number', models.CharField(default=members.models.generate_membership_number, editable=False, max_length=20, unique=True)),
                ('telephone', models.CharField(blank=True, max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='profile', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['membership_number'],
            },
        ),
        migrations.CreateModel(
            name='HopVariety',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('description', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('member', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='hop_varieties', to='members.memberprofile')),
            ],
            options={
                'verbose_name_plural': 'Hop Varieties',
                'ordering': ['name'],
            },
        ),
        migrations.AddConstraint(
            model_name='hopvariety',
            constraint=models.UniqueConstraint(fields=('member', 'name'), name='unique_variety_per_member'),
        ),
        migrations.AlterUniqueTogether(
            name='hopvariety',
            unique_together={('member', 'name')},
        ),
        migrations.CreateModel(
            name='YieldRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('harvest_date', models.DateField()),
                ('quantity_kg', models.DecimalField(decimal_places=2, help_text='Yield in kilograms', max_digits=10)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('hop_variety', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='yields', to='members.hopvariety')),
                ('member', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='yield_records', to='members.memberprofile')),
                ('recorded_by', models.ForeignKey(help_text='Admin who entered this yield', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='recorded_yields', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-harvest_date'],
            },
        ),
    ]
