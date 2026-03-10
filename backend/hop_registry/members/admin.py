from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import MemberProfile, HopVariety, YieldRecord


class MemberProfileInline(admin.StackedInline):
    model = MemberProfile
    can_delete = False
    verbose_name_plural = 'Member Profile'
    readonly_fields = ('membership_number', 'created_at', 'updated_at')


class HopVarietyInline(admin.TabularInline):
    model = HopVariety
    extra = 1


class YieldRecordInline(admin.TabularInline):
    model = YieldRecord
    extra = 0
    readonly_fields = ('recorded_by', 'created_at')


# Extend the default UserAdmin to show the profile inline
class ExtendedUserAdmin(UserAdmin):
    inlines = (MemberProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active')
    list_filter = ('is_active', 'is_staff', 'date_joined')


admin.site.unregister(User)
admin.site.register(User, ExtendedUserAdmin)


@admin.register(MemberProfile)
class MemberProfileAdmin(admin.ModelAdmin):
    list_display = ('membership_number', 'get_full_name', 'get_email', 'telephone', 'get_is_active', 'created_at')
    list_filter = ('created_at', 'user__is_active')
    search_fields = ('membership_number', 'user__first_name', 'user__last_name', 'user__email')
    readonly_fields = ('membership_number', 'created_at', 'updated_at')
    inlines = [HopVarietyInline, YieldRecordInline]

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    get_full_name.short_description = 'Name'
    get_full_name.admin_order_field = 'user__first_name'

    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = 'Email'
    get_email.admin_order_field = 'user__email'

    def get_is_active(self, obj):
        return obj.user.is_active
    get_is_active.short_description = 'Active'
    get_is_active.boolean = True  # renders as a green tick / red cross
    get_is_active.admin_order_field = 'user__is_active'


@admin.register(HopVariety)
class HopVarietyAdmin(admin.ModelAdmin):
    list_display = ('name', 'get_member', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name',)

    def get_member(self, obj):
        if obj.member is None:
            return '— deleted member —'
        return obj.member.membership_number
    get_member.short_description = 'Member'
    get_member.admin_order_field = 'member__membership_number'


@admin.register(YieldRecord)
class YieldRecordAdmin(admin.ModelAdmin):
    list_display = ('hop_variety', 'get_member', 'harvest_date', 'quantity_kg', 'recorded_by')
    list_filter = ('harvest_date',)
    search_fields = ('hop_variety__name',)
    readonly_fields = ('recorded_by', 'created_at', 'updated_at')

    def get_member(self, obj):
        if obj.member is None:
            return '— deleted member —'
        return obj.member.membership_number
    get_member.short_description = 'Member'
    get_member.admin_order_field = 'member__membership_number'

    def save_model(self, request, obj, form, change):
        if not obj.recorded_by:
            obj.recorded_by = request.user
        super().save_model(request, obj, form, change)
