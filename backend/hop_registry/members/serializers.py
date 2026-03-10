from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import MemberProfile, HopVariety, YieldRecord


# ─── Auth Serializers ─────────────────────────────────────────────────────────

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Extend JWT payload with basic user info."""

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'is_staff': self.user.is_staff,
        }
        return data


class RegisterSerializer(serializers.ModelSerializer):
    """Registration serializer — creates User + MemberProfile."""
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True, label='Confirm password')
    telephone = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2',
                  'first_name', 'last_name', 'telephone')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def create(self, validated_data):
        telephone = validated_data.pop('telephone', '')
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        MemberProfile.objects.create(user=user, telephone=telephone)
        return user


# ─── Hop Variety Serializers ──────────────────────────────────────────────────

class HopVarietySerializer(serializers.ModelSerializer):
    class Meta:
        model = HopVariety
        fields = ('id', 'name', 'description', 'created_at')
        read_only_fields = ('id', 'created_at')


# ─── Yield Record Serializers ─────────────────────────────────────────────────

class YieldRecordSerializer(serializers.ModelSerializer):
    hop_variety_name = serializers.CharField(source='hop_variety.name', read_only=True)
    recorded_by_username = serializers.CharField(source='recorded_by.username', read_only=True)

    class Meta:
        model = YieldRecord
        fields = (
            'id', 'hop_variety', 'hop_variety_name',
            'harvest_date', 'quantity_kg', 'notes',
            'recorded_by', 'recorded_by_username',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'recorded_by', 'recorded_by_username', 'created_at', 'updated_at')


class YieldRecordCreateSerializer(serializers.ModelSerializer):
    """Used by admins to add a yield to a member. Validates hop_variety belongs to member."""

    class Meta:
        model = YieldRecord
        fields = ('id', 'hop_variety', 'harvest_date', 'quantity_kg', 'notes')
        read_only_fields = ('id',)

    def validate_hop_variety(self, value):
        # The member is injected via context from the view
        member = self.context.get('member')
        if member and value.member != member:
            raise serializers.ValidationError(
                'This hop variety does not belong to the specified member.'
            )
        return value

    def create(self, validated_data):
        member = self.context['member']
        admin_user = self.context['request'].user
        return YieldRecord.objects.create(
            member=member,
            recorded_by=admin_user,
            **validated_data
        )


# ─── Member Profile Serializers ───────────────────────────────────────────────

class MemberProfileSerializer(serializers.ModelSerializer):
    """
    Read/write serializer for a member viewing/editing their own profile.
    membership_number is always read-only.
    """
    # Flatten User fields into this serializer
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email')
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    hop_varieties = HopVarietySerializer(many=True, read_only=True)
    yield_records = YieldRecordSerializer(many=True, read_only=True)

    class Meta:
        model = MemberProfile
        fields = (
            'id', 'username', 'membership_number',
            'first_name', 'last_name', 'email', 'telephone', 'start_year',
            'hop_varieties', 'yield_records',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'username', 'membership_number', 'created_at', 'updated_at')

    def validate_email(self, value):
        user = self.instance.user
        if User.objects.filter(email=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError('This email is already in use.')
        return value

    def update(self, instance, validated_data):
        # Handle nested user fields
        user_data = validated_data.pop('user', {})
        user = instance.user
        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save()

        # Update profile fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class AdminMemberListSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.SerializerMethodField()
    hop_variety_count = serializers.SerializerMethodField()
    is_active = serializers.BooleanField(source='user.is_active', read_only=True)

    class Meta:
        model = MemberProfile
        fields = (
            'id', 'username', 'membership_number', 'full_name',
            'email', 'telephone', 'hop_variety_count', 'is_active',
            'created_at',
        )

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_hop_variety_count(self, obj):
        return obj.hop_varieties.count()


class AdminMemberDetailSerializer(serializers.ModelSerializer):
    """Full detail serializer for admin viewing/editing a member."""
    username = serializers.CharField(source='user.username')
    email = serializers.EmailField(source='user.email')
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    is_active = serializers.BooleanField(source='user.is_active')
    hop_varieties = HopVarietySerializer(many=True, read_only=True)
    yield_records = YieldRecordSerializer(many=True, read_only=True)

    class Meta:
        model = MemberProfile
        fields = (
            'id', 'username', 'membership_number',
            'first_name', 'last_name', 'email', 'telephone', 'start_year',
            'is_active', 'hop_varieties', 'yield_records',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'membership_number', 'created_at',
                            'updated_at')

    def validate_username(self, value):
        user = self.instance.user
        if User.objects.filter(username=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError('This username is already taken.')
        return value

    def validate_email(self, value):
        user = self.instance.user
        if User.objects.filter(email=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError('This email is already in use.')
        return value

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user
        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save()
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
