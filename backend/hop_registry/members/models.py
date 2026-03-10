from django.db import models
from django.contrib.auth.models import User


def generate_membership_number():
    """Generate a sequential 4-digit membership number starting from 0001."""
    from members.models import MemberProfile
    try:
        last = (
            MemberProfile.objects
            .filter(membership_number__regex=r'^\d{4}$')
            .order_by('-membership_number')
            .values_list('membership_number', flat=True)
            .first()
        )
        next_num = int(last) + 1 if last else 1
    except Exception:
        next_num = 1
    return f"BHC-{str(next_num).zfill(4)}"


class MemberProfile(models.Model):
    """
    Extended profile for each registered member.
    One-to-one with Django's built-in User model.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    membership_number = models.CharField(
        max_length=20,
        unique=True,
        default=generate_membership_number,
        editable=False,  # Cannot be changed via forms/serializers
    )
    telephone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    start_year = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text='Year the member started growing hops'
    )

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} [{self.membership_number}]"

    class Meta:
        ordering = ['membership_number']


class HopVariety(models.Model):
    """
    A hop variety grown by a specific member.
    Each member can have multiple varieties.
    """
    member = models.ForeignKey(
        MemberProfile,
        on_delete=models.SET_NULL,
        null=True,
        related_name='hop_varieties'
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        if self.member is None:
            return f"{self.name} (deleted member)"
        return f"{self.name} ({self.member.membership_number})"

    class Meta:
        verbose_name_plural = 'Hop Varieties'
        ordering = ['name']
        # A member cannot have two varieties with the same name
        unique_together = ('member', 'name')


class YieldRecord(models.Model):
    """
    A harvest yield entry, linked to a member and one of their hop varieties.
    Only admins can create/edit these.
    """
    member = models.ForeignKey(
        MemberProfile,
        on_delete=models.SET_NULL,
        null=True,
        related_name='yield_records'
    )
    hop_variety = models.ForeignKey(
        HopVariety,
        on_delete=models.CASCADE,
        related_name='yields'
    )
    harvest_date = models.DateField()
    quantity_kg = models.DecimalField(
        max_digits=15,
        decimal_places=5,
        help_text='Yield in kilograms'
    )
    notes = models.TextField(blank=True)
    recorded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='recorded_yields',
        help_text='Admin who entered this yield'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        member_ref = self.member.membership_number if self.member else "deleted member"
        return f"{self.hop_variety.name} — {self.quantity_kg}kg ({self.harvest_date}) [{member_ref}]"

    class Meta:
        ordering = ['-harvest_date']
