"""
Management command to seed the database with sample data.
Usage: python manage.py seed_data
"""
import random
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from members.models import MemberProfile, HopVariety, YieldRecord
from datetime import date, timedelta


HOP_VARIETIES = [
    ('Cascade', 'Classic American hop with floral, citrus, and grapefruit character.'),
    ('Fuggle', 'Traditional English hop, earthy and woody with mild bitterness.'),
    ('Goldings', 'Smooth English hop with honey, spice, and floral notes.'),
    ('Centennial', 'High alpha hop with floral and citrus aromas.'),
    ('Saaz', 'Noble Czech hop with mild bitterness and herbal character.'),
    ('Challenger', 'Versatile English hop with clean bitterness and cedar notes.'),
    ('Admiral', 'High alpha English hop, good for bittering.'),
    ('Phoenix', 'English dual-purpose hop with chocolate and molasses notes.'),
]

SAMPLE_MEMBERS = [
    ('alice_farmer', 'alice@hopfield.co.uk', 'Alice', 'Hargreaves', '07700900001'),
    ('bob_grower', 'bob@kentfarm.co.uk', 'Bob', 'Whitfield', '07700900002'),
    ('carol_hops', 'carol@surreyhops.co.uk', 'Carol', 'Dunmore', '07700900003'),
    ('dave_farm', 'dave@worcesterhops.co.uk', 'Dave', 'Longley', '07700900004'),
]


class Command(BaseCommand):
    help = 'Seeds the database with sample hop grower data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding data...')

        # Create admin
        if not User.objects.filter(username='admin').exists():
            admin = User.objects.create_superuser('admin', 'admin@hopregistry.co.uk', 'admin123')
            self.stdout.write(self.style.SUCCESS('  Created admin user (admin / admin123)'))
        else:
            admin = User.objects.get(username='admin')

        # Create members
        members = []
        for username, email, first, last, phone in SAMPLE_MEMBERS:
            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(
                    username=username, email=email, password='member123',
                    first_name=first, last_name=last
                )
                profile = MemberProfile.objects.create(user=user, telephone=phone)
                self.stdout.write(f'  Created member: {username} / member123 [{profile.membership_number}]')
            else:
                profile = MemberProfile.objects.get(user__username=username)
            members.append(profile)

        # Add hop varieties
        for profile in members:
            if profile.hop_varieties.count() == 0:
                chosen = random.sample(HOP_VARIETIES, k=random.randint(2, 4))
                for name, desc in chosen:
                    variety = HopVariety.objects.create(member=profile, name=name, description=desc)

                    # Add some yields
                    for year in [2023, 2024]:
                        harvest = date(year, 9, random.randint(1, 20))
                        YieldRecord.objects.create(
                            member=profile,
                            hop_variety=variety,
                            harvest_date=harvest,
                            quantity_kg=round(random.uniform(50, 300), 2),
                            notes=f'{year} harvest — good conditions.',
                            recorded_by=admin,
                        )

        self.stdout.write(self.style.SUCCESS('\n✅ Seed complete! Run `python manage.py runserver` to start.'))
