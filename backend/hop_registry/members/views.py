from django.contrib.auth.models import User
from django.db import models
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Sum, Count

from .models import MemberProfile, HopVariety, YieldRecord
from .permissions import IsAdminUser
from .serializers import (
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    MemberProfileSerializer,
    HopVarietySerializer,
    YieldRecordSerializer,
    YieldRecordCreateSerializer,
    AdminMemberListSerializer,
    AdminMemberDetailSerializer,
)

import csv
import io
import secrets
import string

# ─── NON Auth Views ───────────────────────────────────────────────────────────────


class PublicYieldSummaryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        from django.db.models import Sum, Count

        results = (
            YieldRecord.objects
            .values("hop_variety__name", "hop_variety__description")
            .annotate(
                total_kg=Sum("quantity_kg"),
                record_count=Count("id"),
                grower_count=Count("member", distinct=True)
            )
            .order_by("-total_kg")
        )

        # Merge rows with the same variety name
        grouped = {}
        for r in results:
            name = r["hop_variety__name"]
            if name not in grouped:
                grouped[name] = {
                    "name":         name,
                    "description":  r["hop_variety__description"] or "",
                    "total_kg":     float(r["total_kg"] or 0),
                    "record_count": r["record_count"],
                    "grower_count": r["grower_count"],
                }
            else:
                grouped[name]["total_kg"]     += float(r["total_kg"] or 0)
                grouped[name]["record_count"] += r["record_count"]
                grouped[name]["grower_count"] += r["grower_count"]

        data = sorted(grouped.values(), key=lambda x: x["total_kg"], reverse=True)
        return Response(data)

# ─── Auth Views ───────────────────────────────────────────────────────────────


class LoginView(TokenObtainPairView):
    """
    POST /api/auth/login/
    Returns access + refresh JWT tokens along with basic user info.
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Creates a new member account and profile.
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Return tokens immediately so user is logged in after registering
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Registration successful.',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'membership_number': user.profile.membership_number,
        }, status=status.HTTP_201_CREATED)


# ─── Member Self-Service Views ────────────────────────────────────────────────

class MemberProfileView(APIView):
    """
    GET  /api/member/me/   — view own profile
    PATCH /api/member/me/  — update own profile (not membership_number)
    """
    permission_classes = [IsAuthenticated]

    def get_profile(self, request):
        return MemberProfile.objects.get(user=request.user)

    def get(self, request):
        profile = self.get_profile(request)
        serializer = MemberProfileSerializer(profile)
        return Response(serializer.data)

    def patch(self, request):
        profile = self.get_profile(request)
        serializer = MemberProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class MemberHopVarietyListView(APIView):
    """
    GET  /api/member/me/hop-varieties/  — list own hop varieties
    POST /api/member/me/hop-varieties/  — add a new hop variety
    """
    permission_classes = [IsAuthenticated]

    def get_profile(self, request):
        return MemberProfile.objects.get(user=request.user)

    def get(self, request):
        profile = self.get_profile(request)
        varieties = profile.hop_varieties.all()
        serializer = HopVarietySerializer(varieties, many=True)
        return Response(serializer.data)


class MemberHopVarietyDetailView(APIView):
    """
    DELETE /api/member/me/hop-varieties/{id}/  — remove a hop variety
    """
    permission_classes = [IsAuthenticated]

    def get_variety(self, request, pk):
        try:
            variety = HopVariety.objects.get(pk=pk, member__user=request.user)
            return variety
        except HopVariety.DoesNotExist:
            return None

    def delete(self, request, pk):
        return Response(
            {'detail': 'Only admins can manage hop varieties.'},
            status=status.HTTP_403_FORBIDDEN
        )

    def patch(self, request, pk):
        return Response(
            {'detail': 'Only admins can manage hop varieties.'},
            status=status.HTTP_403_FORBIDDEN
        )


class MemberYieldListView(APIView):
    """
    GET /api/member/me/yields/  — view own yield records (read-only)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = MemberProfile.objects.get(user=request.user)
        yields = profile.yield_records.select_related('hop_variety', 'recorded_by').all()
        serializer = YieldRecordSerializer(yields, many=True)
        return Response(serializer.data)


# ─── Admin Views ──────────────────────────────────────────────────────────────

class AdminMemberListView(APIView):
    """
    GET /api/admin/members/  — list all members
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        members = MemberProfile.objects.select_related('user').all()

        # Optional search by name, email, or membership number
        search = request.query_params.get('search')
        if search:
            members = members.filter(
                models.Q(user__first_name__icontains=search) |
                models.Q(user__last_name__icontains=search) |
                models.Q(user__email__icontains=search) |
                models.Q(membership_number__icontains=search)
            )

        serializer = AdminMemberListSerializer(members, many=True)
        return Response(serializer.data)


class AdminMemberDetailView(APIView):
    """
    GET    /api/admin/members/{id}/  — view a member's full details
    PATCH  /api/admin/members/{id}/  — edit a member's details
    DELETE /api/admin/members/{id}/  — delete a member
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_member(self, pk):
        try:
            return MemberProfile.objects.select_related('user').get(pk=pk)
        except MemberProfile.DoesNotExist:
            return None

    def get(self, request, pk):
        member = self.get_member(pk)
        if not member:
            return Response({'detail': 'Member not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = AdminMemberDetailSerializer(member)
        return Response(serializer.data)

    def patch(self, request, pk):
        member = self.get_member(pk)
        if not member:
            return Response({'detail': 'Member not found.'}, status=status.HTTP_404_NOT_FOUND)
        # Handle reactivation
        if 'is_active' in request.data:
            member.user.is_active = request.data['is_active']
            member.user.save()

        serializer = AdminMemberDetailSerializer(member, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        member = self.get_member(pk)
        if not member:
            return Response({'detail': 'Member not found.'}, status=status.HTTP_404_NOT_FOUND)

        if member.user == request.user:
            return Response(
                {'detail': 'You cannot deactivate your own account.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Deactivate instead of delete — preserves all variety and yield history
        username = member.user.username
        member.user.is_active = False
        member.user.save()
        return Response(
            {'detail': f'Member "{username}" has been deactivated. Their yield history has been preserved.'},
            status=status.HTTP_200_OK
        )


class AdminMemberAnonymiseView(APIView):
    """
    POST /api/admin/members/{id}/anonymise/
    Removes all PII from a member account but preserves yield history.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        try:
            member = MemberProfile.objects.select_related('user').get(pk=pk)
        except MemberProfile.DoesNotExist:
            return Response({'detail': 'Member not found.'}, status=status.HTTP_404_NOT_FOUND)

        if member.user == request.user:
            return Response(
                {'detail': 'You cannot anonymise your own account.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = member.user
        anon_id = member.membership_number  # use membership number as reference

        # Wipe all PII from the User model
        user.first_name = "Anonymised"
        user.last_name  = "Member"
        user.email      = f"anon_{anon_id}@deleted.invalid"
        user.username   = f"anon_{anon_id}"
        user.is_active  = False
        user.save()

        # Wipe PII from the profile
        member.telephone = ""
        member.save()

        return Response({
            'detail': f'Member {anon_id} has been anonymised. Yield history preserved.'
        }, status=status.HTTP_200_OK)


class AdminMemberYieldListView(APIView):
    """
    GET  /api/admin/members/{id}/yields/  — view all yields for a member
    POST /api/admin/members/{id}/yields/  — add a yield to a member
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_member(self, pk):
        try:
            return MemberProfile.objects.get(pk=pk)
        except MemberProfile.DoesNotExist:
            return None

    def get(self, request, pk):
        member = self.get_member(pk)
        if not member:
            return Response({'detail': 'Member not found.'}, status=status.HTTP_404_NOT_FOUND)
        yields = member.yield_records.select_related('hop_variety', 'recorded_by').all()
        serializer = YieldRecordSerializer(yields, many=True)
        return Response(serializer.data)

    def post(self, request, pk):
        member = self.get_member(pk)
        if not member:
            return Response({'detail': 'Member not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = YieldRecordCreateSerializer(
            data=request.data,
            context={'request': request, 'member': member}
        )
        serializer.is_valid(raise_exception=True)
        yield_record = serializer.save()
        return Response(
            YieldRecordSerializer(yield_record).data,
            status=status.HTTP_201_CREATED
        )


class AdminYieldDetailView(APIView):
    """
    PATCH  /api/admin/yields/{id}/  — edit a yield record
    DELETE /api/admin/yields/{id}/  — delete a yield record
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_yield(self, pk):
        try:
            return YieldRecord.objects.get(pk=pk)
        except YieldRecord.DoesNotExist:
            return None

    def patch(self, request, pk):
        yield_record = self.get_yield(pk)
        if not yield_record:
            return Response({'detail': 'Yield record not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = YieldRecordSerializer(yield_record, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        yield_record = self.get_yield(pk)
        if not yield_record:
            return Response({'detail': 'Yield record not found.'}, status=status.HTTP_404_NOT_FOUND)
        yield_record.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminMemberHopVarietyView(APIView):
    """
    POST   /api/admin/members/{id}/varieties/  — add a variety to a member
    DELETE /api/admin/varieties/{id}/          — delete a variety
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        try:
            member = MemberProfile.objects.get(pk=pk)
        except MemberProfile.DoesNotExist:
            return Response({'detail': 'Member not found.'}, status=404)
        serializer = HopVarietySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(member=member)
        return Response(serializer.data, status=201)


class AdminHopVarietyDetailView(APIView):
    """DELETE /api/admin/varieties/{id}/"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def delete(self, request, pk):
        try:
            variety = HopVariety.objects.get(pk=pk)
        except HopVariety.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        variety.delete()
        return Response(status=204)

# ─── CSV Import Views ───────────────────────────────────────────────────────────────


class AdminMemberCSVImportView(APIView):
    """
    POST /api/admin/members/import-csv/
    Accepts a CSV file and bulk-creates member accounts.
    Expected columns: first_name, last_name, email, telephone (optional)
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        if 'file' not in request.FILES:
            return Response({'detail': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)

        csv_file = request.FILES['file']

        if not csv_file.name.endswith('.csv'):
            return Response({'detail': 'File must be a .csv'}, status=status.HTTP_400_BAD_REQUEST)

        decoded = csv_file.read().decode('utf-8-sig')  # utf-8-sig handles Excel BOM
        reader  = csv.DictReader(io.StringIO(decoded))

        # Normalise headers — strip whitespace and lowercase
        reader.fieldnames = [f.strip().lower() for f in reader.fieldnames]

        created = []
        skipped = []
        errors  = []

        for i, row in enumerate(reader, start=2):  # start=2 because row 1 is header
            # Strip whitespace from all values
            row = {k: v.strip() for k, v in row.items()}

            first_name = row.get('first_name') or row.get('firstname') or row.get('first name', '')
            last_name  = row.get('last_name')  or row.get('lastname')  or row.get('last name', '')
            email      = row.get('email', '')
            telephone  = row.get('telephone') or row.get('phone') or row.get('phone_number', '')

            # Validate required fields
            if not first_name or not last_name or not email:
                errors.append({
                    'row': i,
                    'reason': f'Missing required field — needs first_name, last_name and email. Got: {dict(row)}'
                })
                continue

            # Skip if email already exists
            if User.objects.filter(email=email).exists():
                skipped.append({'row': i, 'email': email, 'reason': 'Email already registered'})
                continue

            # Generate a unique username from name
            base_username = f"{first_name.lower()}_{last_name.lower()}".replace(' ', '_')
            username      = base_username
            counter       = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}_{counter}"
                counter += 1

            # Generate a random temporary password
            alphabet  = string.ascii_letters + string.digits
            temp_pass = ''.join(secrets.choice(alphabet) for _ in range(12))

            try:
                user = User.objects.create_user(
                    username   = username,
                    email      = email,
                    password   = temp_pass,
                    first_name = first_name,
                    last_name  = last_name,
                )
                MemberProfile.objects.create(user=user, telephone=telephone)
                created.append({
                    'row':              i,
                    'username':         username,
                    'email':            email,
                    'full_name':        f'{first_name} {last_name}',
                    'temp_password':    temp_pass,
                    'membership_number': user.profile.membership_number,
                })
            except Exception as e:
                errors.append({'row': i, 'email': email, 'reason': str(e)})

        return Response({
            'summary': {
                'created': len(created),
                'skipped': len(skipped),
                'errors':  len(errors),
            },
            'created': created,
            'skipped': skipped,
            'errors':  errors,
        }, status=status.HTTP_200_OK)
