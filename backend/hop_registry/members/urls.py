from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView,
    RegisterView,
    MemberProfileView,
    MemberHopVarietyListView,
    MemberHopVarietyDetailView,
    MemberYieldListView,
    AdminMemberCSVImportView,
    AdminMemberListView,
    AdminMemberDetailView,
    AdminMemberYieldListView,
    AdminYieldDetailView,
    AdminMemberHopVarietyView,
    AdminHopVarietyDetailView,
    PublicYieldSummaryView,
    AdminMemberAnonymiseView,
)

urlpatterns = [
    # ── Public ──────────────────────────────────────────────────────────────────
    path("public/yields/", PublicYieldSummaryView.as_view(), name="public-yields"),

    # ── Auth ──────────────────────────────────────────────────────────────────
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),

    # ── Member self-service ───────────────────────────────────────────────────
    path('member/me/', MemberProfileView.as_view(), name='member-profile'),
    path('member/me/hop-varieties/', MemberHopVarietyListView.as_view(), name='member-hop-varieties'),
    path('member/me/hop-varieties/<int:pk>/', MemberHopVarietyDetailView.as_view(), name='member-hop-variety-detail'),
    path('member/me/yields/', MemberYieldListView.as_view(), name='member-yields'),

    # ── Admin ─────────────────────────────────────────────────────────────────
    path('admin/members/import-csv/', AdminMemberCSVImportView.as_view(), name='admin-member-csv-import'),
    path('admin/members/', AdminMemberListView.as_view(), name='admin-member-list'),
    path('admin/members/<int:pk>/', AdminMemberDetailView.as_view(), name='admin-member-detail'),
    path('admin/members/<int:pk>/yields/', AdminMemberYieldListView.as_view(), name='admin-member-yields'),
    path('admin/yields/<int:pk>/', AdminYieldDetailView.as_view(), name='admin-yield-detail'),
    path('admin/members/<int:pk>/varieties/', AdminMemberHopVarietyView.as_view(), name='admin-member-varieties'),
    path('admin/varieties/<int:pk>/', AdminHopVarietyDetailView.as_view(), name='admin-variety-detail'),
    path('admin/members/<int:pk>/anonymise/', AdminMemberAnonymiseView.as_view(), name='admin-member-anonymise'),
]
