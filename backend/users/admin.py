from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'username', 'first_name', 'last_name', 'is_staff', 'email_verified', 'created_at']
    list_filter = ['is_staff', 'is_superuser', 'email_verified', 'created_at']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-created_at']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Información adicional', {
            'fields': ('phone', 'address', 'city', 'department', 'postal_code')
        }),
        ('Verificación', {
            'fields': ('email_verified', 'email_verification_token')
        }),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Información adicional', {
            'fields': ('email', 'first_name', 'last_name', 'phone')
        }),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'total_orders', 'total_spent', 'last_purchase', 'customer_segment']
    list_filter = ['customer_segment', 'last_purchase']
    search_fields = ['user__email', 'user__username']
    readonly_fields = ['created_at', 'updated_at']